import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { BarChart3, Download, FileJson, Copy, Database } from "lucide-react";

interface PowerBIExportProps {
  eventId: string;
  eventTitle?: string;
}

const SUPABASE_HOST = `db.${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`;

export function PowerBIExport({ eventId, eventTitle }: PowerBIExportProps) {
  const [isBusy, setIsBusy] = useState(false);

  const loadRows = async () => {
    const { data, error } = await supabase.rpc("get_admin_pledges", { p_event_id: eventId });
    if (error) throw error;
    return data ?? [];
  };

  const download = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const slug = (eventTitle || "fundometer").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const stamp = format(new Date(), "yyyy-MM-dd");

  const exportCsv = async () => {
    setIsBusy(true);
    try {
      const rows = (await loadRows()) as Record<string, unknown>[];
      if (rows.length === 0) {
        toast.error("No pledges to export yet");
        return;
      }
      const headers = Object.keys(rows[0]);
      const escape = (value: unknown) => {
        const text = value === null || value === undefined ? "" : String(value);
        return `"${text.replace(/"/g, '""')}"`;
      };
      const csv = [
        headers.join(","),
        ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
      ].join("\n");

      download(csv, `${slug}-pledges-${stamp}.csv`, "text/csv;charset=utf-8;");
      toast.success("CSV ready for Power BI");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsBusy(false);
    }
  };

  const exportJson = async () => {
    setIsBusy(true);
    try {
      const rows = await loadRows();
      download(
        JSON.stringify({ event_id: eventId, exported_at: new Date().toISOString(), pledges: rows }, null, 2),
        `${slug}-pledges-${stamp}.json`,
        "application/json"
      );
      toast.success("JSON export downloaded");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsBusy(false);
    }
  };

  const copy = (value: string, label: string) => {
    void navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Power BI &amp; Excel visualisation
          </CardTitle>
          <CardDescription>
            Export this event's pledge and payment data, or connect Power BI straight to the database for
            dashboards that refresh on their own.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void exportCsv()} disabled={isBusy}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
            <Button variant="outline" onClick={() => void exportJson()} disabled={isBusy}>
              <FileJson className="mr-2 h-4 w-4" />
              Download JSON
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Each file contains one row per pledge: donor, amount in the original currency plus USD and KES,
            payment method, transaction reference, paid status and payment deadline.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Live connection (auto-refreshing dashboards)
          </CardTitle>
          <CardDescription>
            In Power BI Desktop choose <strong>Get Data → PostgreSQL database</strong> and use the details
            below. Power BI then refreshes the dashboard directly from the Fundometer database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Server</Label>
              <div className="flex gap-2">
                <Input readOnly value={SUPABASE_HOST} />
                <Button variant="outline" size="icon" onClick={() => copy(SUPABASE_HOST, "Server")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Database</Label>
              <div className="flex gap-2">
                <Input readOnly value="postgres" />
                <Button variant="outline" size="icon" onClick={() => copy("postgres", "Database")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Schema / tables</Label>
              <Input readOnly value="public.event_pledges, public.bank_statement_entries" />
            </div>
            <div className="space-y-2">
              <Label>Filter for this event</Label>
              <div className="flex gap-2">
                <Input readOnly value={eventId} />
                <Button variant="outline" size="icon" onClick={() => copy(eventId, "Event ID")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-accent p-4 text-sm text-accent-foreground">
            <p className="font-semibold">Two things to know</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                The database username and password come from your Supabase project settings
                (Project Settings → Database → Connection info). Keep them out of shared reports.
              </li>
              <li>
                If your organisation blocks direct database connections, use the CSV export above and
                schedule a refresh from a shared folder or OneDrive — Power BI treats it the same way.
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Pledges</Badge>
            <Badge variant="secondary">Payments &amp; references</Badge>
            <Badge variant="secondary">Bank reconciliation</Badge>
            <Badge variant="secondary">Currencies: USD, EUR, KES, GBP</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
