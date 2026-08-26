import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Save } from "lucide-react";

/**
 * Organisation-wide sender identity. Every automated email (pledge, payment,
 * reminder, thank-you, follow-up) falls back to this address, so the app keeps
 * sending from the official organisational address even when the personal admin
 * account changes.
 */
export function OrgSenderSettings() {
  const [orgName, setOrgName] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) return;

        const { data, error } = await supabase
          .from("admin_profiles")
          .select("org_name, org_email")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;
        setOrgName((data as any)?.org_name ?? "");
        setOrgEmail((data as any)?.org_email ?? "");
      } catch (error) {
        console.error("Failed to load organisation settings:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    const email = orgEmail.trim();
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Enter a valid organisational email address");
      return;
    }

    setIsSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error("Not signed in");

      const { error } = await supabase
        .from("admin_profiles")
        .update({ org_name: orgName.trim() || null, org_email: email || null } as any)
        .eq("user_id", userId);

      if (error) throw error;
      toast.success("Updated successfully — system emails will use this address");
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Official organisation email
        </CardTitle>
        <CardDescription>
          Used as the sender for all automated emails when an event has no sender of its own.
          Set it to the Tuendelee organisational address so nothing is sent from a personal account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organisation name</Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Tuendelee Foundation"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-email">Organisation email</Label>
            <Input
              id="org-email"
              type="email"
              value={orgEmail}
              onChange={(e) => setOrgEmail(e.target.value)}
              placeholder="info@tuendeleefoundation.org"
              disabled={isLoading}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          The domain must be verified in Resend before donors can receive email from it.
        </p>
        <Button onClick={save} disabled={isSaving || isLoading} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save organisation email"}
        </Button>
      </CardContent>
    </Card>
  );
}
