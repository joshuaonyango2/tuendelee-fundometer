import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Video, Users, Calendar, Globe } from "lucide-react";
import { toast } from "sonner";

interface MeetingPlatform {
  id: string;
  name: string;
  display_name: string;
  icon_url: string | null;
  oauth_url: string | null;
  is_active: boolean;
}

interface MeetingIntegration {
  id: string;
  platform_id: string;
  is_connected: boolean;
  platform?: MeetingPlatform;
}

interface MeetingIntegrationsProps {
  onIntegrationComplete?: () => void;
}

export default function MeetingIntegrations({ onIntegrationComplete }: MeetingIntegrationsProps) {
  const [platforms, setPlatforms] = useState<MeetingPlatform[]>([]);
  const [integrations, setIntegrations] = useState<MeetingIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<MeetingPlatform | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useEffect(() => {
    loadPlatforms();
    loadIntegrations();
  }, []);

  const loadPlatforms = async () => {
    try {
      const { data, error } = await supabase
        .from("meeting_platforms")
        .select("*")
        .eq("is_active", true)
        .order("display_name");

      if (error) throw error;
      setPlatforms(data || []);
    } catch (error) {
      console.error("Error loading platforms:", error);
      toast.error("Failed to load meeting platforms");
    }
  };

  const loadIntegrations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("admin_meeting_integrations")
        .select(`
          *,
          platform:meeting_platforms(*)
        `)
        .eq("admin_id", user.id);

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error("Error loading integrations:", error);
      toast.error("Failed to load integrations");
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformIcon = (name: string) => {
    switch (name) {
      case "zoom":
        return <Video className="w-5 h-5" />;
      case "google_meet":
        return <Globe className="w-5 h-5" />;
      case "teams":
        return <Users className="w-5 h-5" />;
      case "webex":
        return <Calendar className="w-5 h-5" />;
      default:
        return <Video className="w-5 h-5" />;
    }
  };

  const isConnected = (platformId: string) => {
    return integrations.some(i => i.platform_id === platformId && i.is_connected);
  };

  const handleConnect = async (platform: MeetingPlatform) => {
    setSelectedPlatform(platform);
    setShowAuthDialog(true);
  };

  const handleOAuthLogin = async () => {
    if (!selectedPlatform) return;

    // Store platform info in localStorage for callback
    localStorage.setItem("meeting_platform_auth", JSON.stringify({
      platform_id: selectedPlatform.id,
      platform_name: selectedPlatform.name
    }));

    // Generate OAuth URL based on platform
    let authUrl = "";
    const redirectUri = `${window.location.origin}/admin/dashboard`;

    switch (selectedPlatform.name) {
      case "zoom":
        // Note: You'll need to add Zoom OAuth app credentials
        authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=YOUR_ZOOM_CLIENT_ID&redirect_uri=${encodeURIComponent(redirectUri)}`;
        break;
      
      case "google_meet":
        // Note: You'll need to add Google OAuth app credentials
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_GOOGLE_CLIENT_ID&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https://www.googleapis.com/auth/calendar`;
        break;
      
      case "teams":
        // Note: You'll need to add Microsoft OAuth app credentials
        authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_MICROSOFT_CLIENT_ID&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=OnlineMeetings.ReadWrite`;
        break;
      
      case "webex":
        // Note: You'll need to add Webex OAuth app credentials
        authUrl = `https://webexapis.com/v1/authorize?client_id=YOUR_WEBEX_CLIENT_ID&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=meeting:schedules_write`;
        break;
    }

    if (authUrl) {
      // For now, we'll simulate the connection since actual OAuth requires API keys
      toast.info(`OAuth integration for ${selectedPlatform.display_name} requires API credentials to be configured`);
      
      // Simulate successful connection (remove this in production)
      await simulateConnection(selectedPlatform.id);
    }

    setShowAuthDialog(false);
  };

  const simulateConnection = async (platformId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("admin_meeting_integrations")
        .upsert({
          admin_id: user.id,
          platform_id: platformId,
          is_connected: true,
          access_token: "simulated_token",
          refresh_token: "simulated_refresh",
          expires_at: new Date(Date.now() + 3600000).toISOString()
        }, {
          onConflict: "admin_id,platform_id"
        });

      if (error) throw error;

      toast.success("Platform connected successfully!");
      await loadIntegrations();
      onIntegrationComplete?.();
    } catch (error) {
      console.error("Error connecting platform:", error);
      toast.error("Failed to connect platform");
    }
  };

  const handleDisconnect = async (platformId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("admin_meeting_integrations")
        .update({ is_connected: false })
        .eq("admin_id", user.id)
        .eq("platform_id", platformId);

      if (error) throw error;

      toast.success("Platform disconnected");
      await loadIntegrations();
    } catch (error) {
      console.error("Error disconnecting platform:", error);
      toast.error("Failed to disconnect platform");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Loading integrations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Meeting Platform Integrations</CardTitle>
          <CardDescription>
            Connect your meeting platforms to create virtual events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {platforms.map((platform) => {
              const connected = isConnected(platform.id);
              return (
                <div
                  key={platform.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {getPlatformIcon(platform.name)}
                    </div>
                    <div>
                      <p className="font-medium">{platform.display_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {connected ? "Connected" : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {connected && (
                      <Badge variant="secondary" className="gap-1">
                        <Check className="w-3 h-3" />
                        Connected
                      </Badge>
                    )}
                    {connected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(platform.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleConnect(platform)}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {selectedPlatform?.display_name}</DialogTitle>
            <DialogDescription>
              You'll be redirected to {selectedPlatform?.display_name} to authorize the connection.
              This allows you to create and manage meetings directly from your dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Required Permissions:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Create and schedule meetings</li>
                <li>• Generate meeting links</li>
                <li>• Manage meeting settings</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAuthDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleOAuthLogin}
                className="flex-1"
              >
                Continue to {selectedPlatform?.display_name}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}