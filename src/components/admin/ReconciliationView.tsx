import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Upload,
  RefreshCw,
  Download,
  Mail,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Scale,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ReconciliationViewProps {
  eventId: string;
  event: any;
  onSaved?: () => void;
}

interface BankEntry {
  id: string;
  txn_date: string | null;
  reference: string | null;
  description: string | null;
  payer_name: string | null;
  amount: number;
  currency: string;
  match_status: string;
  match_reason: string | null;
  matched_pledge_id: string | null;
}

interface AdminPledge {
  id: string;
  name: string;
  email: string | null;
  donor_phone: string | null;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_reference: string | null;
  is_confirmed: boolean;
  created_at: string;
}

interface Summary {
  bank_total: number;
  bank_entries: number;
  matched_total: number;
  matched_entries: number;
  unmatched_bank_total: number;
  unmatched_bank_entries: number;
  system_paid_total: number;
  system_paid_count: number;
  paid_not_in_bank_total: number;
  paid_not_in_bank_count: number;
  pending_total: number;
  pending_count: number;
}

const DEFAULT_FOLLOWUP =
  'Dear ${name},\n\nThank you for supporting ${event_title}. Our bank reconciliation has not yet located your payment of ${currency} ${amount}. Kindly reply with the transaction reference (M-Pesa code, PayPal ID or bank slip) so we can confirm it, or complete the payment if it is still outstanding.\n\nAsante sana,\nTuendelee Foundation';

/** Minimal RFC4180-ish CSV parser (handles quoted fields and embedded commas). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ',' || char === ';' || char === '\t') {
      row.push(field.trim());
      field = '';
    } else if (char === '\n') {
      row.push(field.trim());
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  row.push(field.trim());
  if (row.some((c) => c !== '')) rows.push(row);
  return rows;
}

function findColumn(headers: string[], keywords: string[]): number {
  return headers.findIndex((h) => keywords.some((k) => h.toLowerCase().includes(k)));
}

function parseAmount(raw: string): number {
  const cleaned = (raw || '').replace(/[^0-9.,()-]/g, '').replace(/,/g, '');
  const negative = /^\(.*\)$/.test(cleaned);
  const value = parseFloat(cleaned.replace(/[()]/g, ''));
  if (!isFinite(value)) return 0;
  return negative ? -value : value;
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  const iso = new Date(raw);
  if (!isNaN(iso.getTime())) return iso.toISOString().slice(0, 10);
  const m = raw.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return null;
}

export function ReconciliationView({ eventId, event, onSaved }: ReconciliationViewProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<BankEntry[]>([]);
  const [pledges, setPledges] = useState<AdminPledge[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currency, setCurrency] = useState<string>('KES');
  const [senderEmail, setSenderEmail] = useState<string>(event?.sender_email ?? '');
  const [senderName, setSenderName] = useState<string>(event?.sender_name ?? '');
  const [isSavingSender, setIsSavingSender] = useState(false);
  const [followUpSubject, setFollowUpSubject] = useState('Kindly confirm your pledge payment');
  const [followUpMessage, setFollowUpMessage] = useState(DEFAULT_FOLLOWUP);

  const loadData = async () => {
    try {
      const [entriesRes, pledgesRes, summaryRes] = await Promise.all([
        supabase
          .from('bank_statement_entries')
          .select('*')
          .eq('event_id', eventId)
          .order('txn_date', { ascending: false })
          .limit(1000),
        supabase.rpc('get_admin_pledges', { p_event_id: eventId }),
        supabase.rpc('get_reconciliation_summary', { p_event_id: eventId }),
      ]);

      if (entriesRes.error) throw entriesRes.error;
      if (pledgesRes.error) throw pledgesRes.error;
      if (summaryRes.error) throw summaryRes.error;

      setEntries((entriesRes.data as BankEntry[]) ?? []);
      setPledges((pledgesRes.data as AdminPledge[]) ?? []);
      const s = Array.isArray(summaryRes.data) ? summaryRes.data[0] : summaryRes.data;
      setSummary((s as Summary) ?? null);
    } catch (error: any) {
      console.error('Reconciliation load failed:', error);
      toast.error(error?.message ?? 'Failed to load reconciliation data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!eventId) return;
    loadData();
  }, [eventId]);

  useEffect(() => {
    setSenderEmail(event?.sender_email ?? '');
    setSenderName(event?.sender_name ?? '');
  }, [event?.sender_email, event?.sender_name]);

  const matchedPledgeIds = useMemo(
    () => new Set(entries.filter((e) => e.matched_pledge_id).map((e) => e.matched_pledge_id as string)),
    [entries]
  );

  const paidNotInBank = useMemo(
    () => pledges.filter((p) => p.is_confirmed && !matchedPledgeIds.has(p.id)),
    [pledges, matchedPledgeIds]
  );
  const pendingPledges = useMemo(() => pledges.filter((p) => !p.is_confirmed), [pledges]);
  const unmatchedEntries = useMemo(() => entries.filter((e) => e.match_status !== 'matched'), [entries]);
  const matchedEntries = useMemo(() => entries.filter((e) => e.match_status === 'matched'), [entries]);

  const money = (value: number, code = currency) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value || 0)) + ` ${code}`;

  const handleSaveSender = async () => {
    if (senderEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(senderEmail)) {
      toast.error('Enter a valid organisational email address');
      return;
    }
    setIsSavingSender(true);
    try {
      const { error } = await supabase
        .from('fundraising_events')
        .update({ sender_email: senderEmail || null, sender_name: senderName || null })
        .eq('id', eventId);
      if (error) throw error;
      toast.success('Official sender email updated successfully');
      onSaved?.();
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to save sender email');
    } finally {
      setIsSavingSender(false);
    }
  };

  const handleFile = async (file: File) => {
    setIsImporting(true);
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error('The file has no data rows');

      const headers = rows[0];
      const dateIdx = findColumn(headers, ['date', 'tarehe', 'value date']);
      const refIdx = findColumn(headers, ['reference', 'receipt', 'transaction id', 'txn', 'code']);
      const nameIdx = findColumn(headers, ['payer', 'sender', 'name', 'depositor', 'from']);
      const descIdx = findColumn(headers, ['description', 'details', 'narrative', 'particulars']);
      const amountIdx = findColumn(headers, ['amount', 'credit', 'paid in', 'value']);

      if (amountIdx === -1) {
        throw new Error('Could not find an amount column. Include a header such as "Amount" or "Credit".');
      }

      const parsedRows = rows
        .slice(1)
        .map((r) => ({
          txn_date: dateIdx >= 0 ? parseDate(r[dateIdx]) : null,
          reference: refIdx >= 0 ? r[refIdx] || null : null,
          payer_name: nameIdx >= 0 ? r[nameIdx] || null : null,
          description: descIdx >= 0 ? r[descIdx] || null : null,
          amount: parseAmount(r[amountIdx]),
        }))
        .filter((r) => r.amount > 0);

      if (parsedRows.length === 0) throw new Error('No positive credit amounts found in the file');

      const total = parsedRows.reduce((sum, r) => sum + r.amount, 0);

      const { data: userData } = await supabase.auth.getUser();
      const { data: importRow, error: importError } = await supabase
        .from('bank_statement_imports')
        .insert({
          event_id: eventId,
          admin_id: userData?.user?.id,
          file_name: file.name,
          currency,
          row_count: parsedRows.length,
          total_amount: total,
        })
        .select('id')
        .single();
      if (importError) throw importError;

      const { error: entriesError } = await supabase.from('bank_statement_entries').insert(
        parsedRows.map((r) => ({
          import_id: importRow.id,
          event_id: eventId,
          currency,
          ...r,
        }))
      );
      if (entriesError) throw entriesError;

      toast.success(`Imported ${parsedRows.length} bank lines (${money(total)})`);
      await handleReconcile();
    } catch (error: any) {
      console.error('Import failed:', error);
      toast.error(error?.message ?? 'Failed to import bank statement');
    } finally {
      setIsImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const autoVerifyMatched = async (silent = false) => {
    const { data, error } = await supabase.rpc('auto_verify_reconciled_pledges', { p_event_id: eventId });
    if (error) throw error;
    const verified = Number(data ?? 0);
    if (!silent) {
      toast.success(
        verified > 0
          ? `${verified} matched pledge${verified === 1 ? '' : 's'} verified automatically`
          : 'All matched pledges were already verified'
      );
    }
    return verified;
  };

  const handleReconcile = async () => {
    setIsReconciling(true);
    try {
      const { data, error } = await supabase.rpc('reconcile_bank_entries', { p_event_id: eventId });
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;

      let verified = 0;
      try {
        verified = await autoVerifyMatched(true);
      } catch (verifyError) {
        console.error('Auto-verification failed:', verifyError);
      }

      toast.success(
        `Reconciled: ${result?.matched ?? 0} matched, ${result?.unmatched ?? 0} unmatched` +
          (verified > 0 ? ` • ${verified} pledge(s) auto-verified` : '')
      );
      await loadData();
    } catch (error: any) {
      console.error('Reconcile failed:', error);
      toast.error(error?.message ?? 'Failed to reconcile');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleAutoVerify = async () => {
    setIsVerifying(true);
    try {
      await autoVerifyMatched();
      await loadData();
    } catch (error: any) {
      console.error('Auto-verify failed:', error);
      toast.error(error?.message ?? 'Failed to verify matched pledges');
    } finally {
      setIsVerifying(false);
    }
  };


  const handleClearImports = async () => {
    if (!window.confirm('Remove all imported bank statement data for this event?')) return;
    try {
      const { error } = await supabase.from('bank_statement_imports').delete().eq('event_id', eventId);
      if (error) throw error;
      toast.success('Bank statement data cleared');
      await loadData();
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to clear data');
    }
  };

  const handleSendFollowUps = async (targets: AdminPledge[], kind: string) => {
    const withEmail = targets.filter((p) => p.email);
    if (withEmail.length === 0) {
      toast.error('None of these donors have an email address on record');
      return;
    }
    if (!senderEmail) {
      toast.error('Add your official organisational email above before sending');
      return;
    }
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-followup-email', {
        body: {
          eventId,
          pledgeIds: withEmail.map((p) => p.id),
          subject: followUpSubject,
          message: followUpMessage,
          kind,
        },
      });
      if (error) throw error;
      toast.success(`Emails sent: ${data?.sent ?? 0}${data?.failed ? `, failed: ${data.failed}` : ''}`);
    } catch (error: any) {
      console.error('Follow-up send failed:', error);
      toast.error(error?.message ?? 'Failed to send follow-up emails');
    } finally {
      setIsSending(false);
    }
  };

  const exportReconciliation = () => {
    const lines: string[] = ['Section,Name/Payer,Email,Phone,Amount,Currency,Reference,Status,Date'];
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    matchedEntries.forEach((e) =>
      lines.push(
        ['Matched in bank', e.payer_name, '', '', e.amount, e.currency, e.reference, `matched (${e.match_reason ?? ''})`, e.txn_date]
          .map(esc)
          .join(',')
      )
    );
    unmatchedEntries.forEach((e) =>
      lines.push(['Bank line not in system', e.payer_name, '', '', e.amount, e.currency, e.reference, 'unmatched', e.txn_date].map(esc).join(','))
    );
    paidNotInBank.forEach((p) =>
      lines.push(
        ['Marked paid but not in bank', p.name, p.email, p.donor_phone, p.amount, p.currency, p.payment_reference, 'needs follow-up', p.created_at]
          .map(esc)
          .join(',')
      )
    );
    pendingPledges.forEach((p) =>
      lines.push(['Pledge still pending', p.name, p.email, p.donor_phone, p.amount, p.currency, p.payment_reference, 'pending', p.created_at].map(esc).join(','))
    );

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliation-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Reconciliation exported — ready for Excel or Power BI');
  };

  const chartData = summary
    ? [
        { label: 'Bank received', value: Number(summary.bank_total), fill: 'hsl(var(--primary))' },
        { label: 'Confirmed both', value: Number(summary.matched_total), fill: 'hsl(142 71% 45%)' },
        { label: 'Bank only', value: Number(summary.unmatched_bank_total), fill: 'hsl(38 92% 50%)' },
        { label: 'System only', value: Number(summary.paid_not_in_bank_total), fill: 'hsl(0 72% 51%)' },
        { label: 'Still pending', value: Number(summary.pending_total), fill: 'hsl(215 20% 65%)' },
      ]
    : [];

  const stats = summary
    ? [
        {
          title: 'Verified in bank & system',
          Icon: CheckCircle2,
          value: money(Number(summary.matched_total)),
          note: `${summary.matched_entries} bank lines matched`,
          tone: 'text-emerald-600',
        },
        {
          title: 'In bank, not in system',
          Icon: AlertTriangle,
          value: money(Number(summary.unmatched_bank_total)),
          note: `${summary.unmatched_bank_entries} unidentified deposits`,
          tone: 'text-amber-600',
        },
        {
          title: 'Marked paid, not in bank',
          Icon: Scale,
          value: money(Number(summary.paid_not_in_bank_total)),
          note: `${summary.paid_not_in_bank_count} donors to follow up`,
          tone: 'text-red-600',
        },
        {
          title: 'Pledges still pending',
          Icon: Clock,
          value: money(Number(summary.pending_total)),
          note: `${summary.pending_count} unpaid pledges`,
          tone: 'text-muted-foreground',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Official sending email
          </CardTitle>
          <CardDescription>
            All system emails (pledge confirmations, reminders, receipts and follow-ups) will be sent from this
            organisational address.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="sender-name">Sender name</Label>
            <Input
              id="sender-name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Tuendelee Foundation"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sender-email">Official email</Label>
            <Input
              id="sender-email"
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="info@tuendeleefoundation.org"
            />
          </div>
          <Button onClick={handleSaveSender} disabled={isSavingSender}>
            {isSavingSender ? 'Saving...' : 'Save'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Upload bank / M-Pesa statement
          </CardTitle>
          <CardDescription>
            Upload the CSV exported from your bank or M-Pesa account. Columns are detected automatically (date,
            reference/receipt, payer name, description, amount). The system then compares every deposit against the
            pledges recorded here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <div className="space-y-2">
              <Label htmlFor="stmt-currency">Statement currency</Label>
              <Input
                id="stmt-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stmt-file">Statement file (.csv)</Label>
              <Input
                id="stmt-file"
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                disabled={isImporting}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleReconcile} disabled={isReconciling} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isReconciling ? 'animate-spin' : ''}`} />
              Re-run reconciliation
            </Button>
            <Button variant="outline" onClick={exportReconciliation} className="gap-2">
              <Download className="h-4 w-4" />
              Export for Power BI
            </Button>
            <Button variant="ghost" onClick={handleClearImports} className="gap-2 text-destructive">
              <Upload className="h-4 w-4" />
              Clear imported data
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Loading reconciliation...</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ title, Icon, value, note, tone }) => (
              <Card key={title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{title}</CardTitle>
                  <Icon className={`h-4 w-4 ${tone}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold tabular-nums ${tone}`}>{value}</div>
                  <p className="text-xs text-muted-foreground">{note}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reconciliation overview</CardTitle>
              <CardDescription>
                Bank deposits {summary ? money(Number(summary.bank_total)) : '-'} vs system-confirmed{' '}
                {summary ? money(Number(summary.system_paid_total)) : '-'}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(v)} />
                  <Tooltip formatter={(v: number) => money(v)} />
                  <Legend />
                  <Bar dataKey="value" name={`Amount (${currency})`} radius={[6, 6, 0, 0]}>
                    {chartData.map((d) => (
                      <Cell key={d.label} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow-up email</CardTitle>
              <CardDescription>
                Use ${'{name}'}, ${'{amount}'}, ${'{currency}'}, ${'{event_title}'} and ${'{reference}'} as
                placeholders.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="fu-subject">Subject</Label>
                <Input id="fu-subject" value={followUpSubject} onChange={(e) => setFollowUpSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fu-message">Message</Label>
                <Textarea id="fu-message" rows={7} value={followUpMessage} onChange={(e) => setFollowUpMessage(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="gaps">
            <TabsList className="flex-wrap">
              <TabsTrigger value="gaps">Paid in system, not in bank ({paidNotInBank.length})</TabsTrigger>
              <TabsTrigger value="bankonly">Bank lines not matched ({unmatchedEntries.length})</TabsTrigger>
              <TabsTrigger value="matched">Matched ({matchedEntries.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending pledges ({pendingPledges.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="gaps" className="space-y-3">
              <div className="flex justify-end">
                <Button
                  onClick={() => handleSendFollowUps(paidNotInBank, 'reconciliation_followup')}
                  disabled={isSending || paidNotInBank.length === 0}
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email these donors
                </Button>
              </div>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Donor</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidNotInBank.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Every confirmed payment was found in the bank statement.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paidNotInBank.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.email || '-'}</TableCell>
                          <TableCell>{p.donor_phone || '-'}</TableCell>
                          <TableCell className="tabular-nums">{money(Number(p.amount), p.currency)}</TableCell>
                          <TableCell>{p.payment_method || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">{p.payment_reference || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="bankonly">
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Payer</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unmatchedEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No unmatched bank deposits.
                        </TableCell>
                      </TableRow>
                    ) : (
                      unmatchedEntries.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>{e.txn_date ? format(new Date(e.txn_date), 'MMM dd, yyyy') : '-'}</TableCell>
                          <TableCell className="font-medium">{e.payer_name || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">{e.reference || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate">{e.description || '-'}</TableCell>
                          <TableCell className="tabular-nums">{money(Number(e.amount), e.currency)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="matched">
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Payer</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Matched by</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchedEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Upload a statement to see matched deposits.
                        </TableCell>
                      </TableRow>
                    ) : (
                      matchedEntries.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>{e.txn_date ? format(new Date(e.txn_date), 'MMM dd, yyyy') : '-'}</TableCell>
                          <TableCell className="font-medium">{e.payer_name || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">{e.reference || '-'}</TableCell>
                          <TableCell className="tabular-nums">{money(Number(e.amount), e.currency)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{e.match_reason === 'reference' ? 'Reference' : 'Name + amount'}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-3">
              <div className="flex justify-end">
                <Button
                  onClick={() => handleSendFollowUps(pendingPledges, 'pending_followup')}
                  disabled={isSending || pendingPledges.length === 0}
                  variant="outline"
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email pending donors
                </Button>
              </div>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Donor</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Pledged</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPledges.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No pending pledges.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingPledges.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.email || '-'}</TableCell>
                          <TableCell>{p.donor_phone || '-'}</TableCell>
                          <TableCell className="tabular-nums">{money(Number(p.amount), p.currency)}</TableCell>
                          <TableCell>{format(new Date(p.created_at), 'MMM dd, yyyy')}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
