import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ShieldCheck,
  ShieldAlert,
  FileSearch,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
} from "lucide-react";
import { formatAmountWithKES } from "@/lib/currencyUtils";

interface EvidenceRow {
  id: string;
  name: string;
  email: string | null;
  donor_phone: string | null;
  amount: number;
  currency: string;
  amount_in_usd: number;
  payment_method: string | null;
  payment_reference: string | null;
  reference_valid: boolean | null;
  is_confirmed: boolean | null;
  confirmed_at: string | null;
  verification_status: string;
  verification_note: string | null;
  verified_at: string | null;
  possible_duplicate_of: string | null;
  proof_path: string | null;
  proof_uploaded_at: string | null;
  created_at: string;
}

const STATUS_META: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  unverified: { label: "Awaiting review", variant: "outline" },
  reference_ok: { label: "Reference looks valid", variant: "secondary" },
  reference_invalid: { label: "Reference format wrong", variant: "destructive" },
  duplicate_suspect: { label: "Possible duplicate", variant: "destructive" },
  verified: { label: "Verified", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

const REFERENCE_RULES = [
  "M-Pesa: 10 characters, letters and numbers (e.g. QA12B3C4D5).",
  "PayPal: 17 characters, letters and numbers.",
  "Bank transfer: 6–40 characters, letters, numbers or slashes.",
  "Benevity: the donation ID from your company portal (4–60 characters).",
];

export function PaymentVerificationView({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<EvidenceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [proofPreview, setProofPreview] = useState<{ url: string; row: EvidenceRow } | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase.rpc("get_pledge_evidence", { p_event_id: eventId });
    if (error) {
      console.error(error);
      toast.error("Failed to load payment evidence");
    } else {
      setRows((data ?? []) as EvidenceRow[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!eventId) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = statusFilter === "all" || row.verification_status === statusFilter;
      const matchesTerm =
        !term ||
        row.name?.toLowerCase().includes(term) ||
        row.email?.toLowerCase().includes(term) ||
        row.donor_phone?.toLowerCase().includes(term) ||
        row.payment_reference?.toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const verified = rows.filter((r) => r.verification_status === "verified").length;
    const flagged = rows.filter((r) =>
      ["reference_invalid", "duplicate_suspect"].includes(r.verification_status)
    ).length;
    const withProof = rows.filter((r) => !!r.proof_path).length;
    const awaiting = rows.filter((r) => ["unverified", "reference_ok"].includes(r.verification_status)).length;
    return { total, verified, flagged, withProof, awaiting };
  }, [rows]);

  const openProof = async (row: EvidenceRow) => {
    if (!row.proof_path) return;
    const { data, error } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(row.proof_path, 60 * 10);

    if (error || !data?.signedUrl) {
      console.error(error);
      toast.error("Could not open the uploaded proof");
      return;
    }
    setProofPreview({ url: data.signedUrl, row });
  };

  const setStatus = async (row: EvidenceRow, status: string) => {
    setBusyId(row.id);
    const { error } = await supabase.rpc("set_pledge_verification", {
      p_pledge_id: row.id,
      p_status: status,
      p_note: noteDraft[row.id]?.trim() || null,
    });
    setBusyId(null);

    if (error) {
      console.error(error);
      toast.error(error.message || "Failed to update verification");
      return;
    }
    toast.success("Updated successfully");
    await load();
  };

  const isImage = (path?: string | null) => !!path && !/\.pdf$/i.test(path);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-success" />
                Verify transaction evidence
              </CardTitle>
              <CardDescription>
                Check each donor's transaction code and uploaded receipt, then mark the payment verified
                or rejected. Donors keep their pledge record either way — nothing is counted twice.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              { label: "Payments", value: stats.total },
              { label: "Verified", value: stats.verified },
              { label: "Awaiting review", value: stats.awaiting },
              { label: "Flagged", value: stats.flagged },
              { label: "With receipt", value: stats.withProof },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-accent p-4">
            <p className="flex items-center gap-2 font-semibold text-accent-foreground">
              <ShieldAlert className="h-4 w-4" />
              How references are checked automatically
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-accent-foreground">
              {REFERENCE_RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
              <li>
                Any reference already used on this event is flagged as a possible duplicate so the same
                payment is never counted twice.
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="min-w-[240px] flex-1 space-y-2">
              <Label htmlFor="evidence-search">Search donor or reference</Label>
              <Input
                id="evidence-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, phone or transaction code"
              />
            </div>
            <div className="w-full space-y-2 sm:w-56">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(STATUS_META).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evidence queue</CardTitle>
          <CardDescription>{filtered.length} records</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading evidence…</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground">No payments match these filters yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Transaction code</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="min-w-[260px]">Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => {
                    const meta = STATUS_META[row.verification_status] ?? STATUS_META.unverified;
                    const { primary, kes } = formatAmountWithKES(row.amount, row.currency);
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <p className="font-semibold text-foreground">{row.name}</p>
                          <p className="text-sm text-muted-foreground">{row.email || "No email"}</p>
                          <p className="text-sm text-muted-foreground">{row.donor_phone || "No phone"}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(row.created_at), "d MMM yyyy, HH:mm")}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold tabular-nums">{primary}</p>
                          {kes && <p className="text-sm text-muted-foreground tabular-nums">{kes}</p>}
                        </TableCell>
                        <TableCell className="capitalize">
                          {(row.payment_method || "not stated").replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>
                          {row.payment_reference ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{row.payment_reference}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Copy transaction code"
                                onClick={() => {
                                  void navigator.clipboard.writeText(row.payment_reference ?? "");
                                  toast.success("Code copied");
                                }}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">None given</span>
                          )}
                          {row.payment_reference && (
                            <Badge
                              variant={row.reference_valid ? "secondary" : "destructive"}
                              className="mt-1"
                            >
                              {row.reference_valid ? "Format OK" : "Format check failed"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.proof_path ? (
                            <Button size="sm" variant="outline" onClick={() => void openProof(row)}>
                              <FileSearch className="mr-2 h-4 w-4" />
                              View
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not uploaded</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                          {row.verification_note && (
                            <p className="mt-1 text-xs text-muted-foreground">{row.verification_note}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Textarea
                            rows={2}
                            placeholder="Optional note for the record…"
                            value={noteDraft[row.id] ?? ""}
                            onChange={(e) => setNoteDraft({ ...noteDraft, [row.id]: e.target.value })}
                          />
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              disabled={busyId === row.id}
                              onClick={() => void setStatus(row, "verified")}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={busyId === row.id}
                              onClick={() => void setStatus(row, "rejected")}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyId === row.id}
                              onClick={() => void setStatus(row, "duplicate_suspect")}
                            >
                              Flag duplicate
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!proofPreview} onOpenChange={(open) => !open && setProofPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment proof — {proofPreview?.row.name}</DialogTitle>
            <DialogDescription>
              {proofPreview?.row.proof_uploaded_at
                ? `Uploaded ${format(new Date(proofPreview.row.proof_uploaded_at), "d MMM yyyy, HH:mm")}`
                : "Uploaded by the donor"}
            </DialogDescription>
          </DialogHeader>
          {proofPreview && (
            <div className="space-y-3">
              {isImage(proofPreview.row.proof_path) ? (
                <img
                  src={proofPreview.url}
                  alt={`Payment proof uploaded by ${proofPreview.row.name}`}
                  className="max-h-[60vh] w-full rounded-lg object-contain"
                />
              ) : (
                <iframe
                  src={proofPreview.url}
                  title="Payment proof document"
                  className="h-[60vh] w-full rounded-lg border border-border"
                />
              )}
              <Button variant="outline" asChild>
                <a href={proofPreview.url} target="_blank" rel="noopener noreferrer">
                  Open in a new tab
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
