import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings, Video } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function PlatformCredentialsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<Record<string, { apiKey: string; apiSecret: string }>>({});

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const { data: platforms, error: platformsError } = await supabase
        .from('meeting_platforms')
        .select('*')
        .eq('is_active', true);

      if (platformsError) throw platformsError;

      const { data: userIntegrations, error: integrationsError } = await supabase
        .from('admin_meeting_integrations')
        .select('*, platform:meeting_platforms(*)');

      if (integrationsError) throw integrationsError;

      setIntegrations(platforms || []);
    } catch (error) {
      console.error('Error loading integrations:', error);
    }
  };

  const handleSaveCredentials = async (platformId: string, platformName: string) => {
    const creds = credentials[platformId];
    if (!creds?.apiKey || !creds?.apiSecret) {
      toast.error('Please enter both API Key and API Secret');
      return;
    }

    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('admin_meeting_integrations')
        .upsert({
          admin_id: userData.user.id,
          platform_id: platformId,
          access_token: creds.apiKey,
          refresh_token: creds.apiSecret,
          is_connected: true,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success(`${platformName} credentials updated successfully`);
      setCredentials((prev) => ({
        ...prev,
        [platformId]: { apiKey: '', apiSecret: '' }
      }));
      loadIntegrations();
    } catch (error: any) {
      console.error('Error saving credentials:', error);
      toast.error(error.message || 'Failed to save credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Platform Credentials
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Meeting Platform Credentials</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {integrations.map((platform) => (
            <Card key={platform.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Video className="w-5 h-5" />
                  {platform.display_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`${platform.id}-key`}>API Key / Client ID</Label>
                  <Input
                    id={`${platform.id}-key`}
                    type="password"
                    placeholder="Enter your API key"
                    value={credentials[platform.id]?.apiKey || ''}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        [platform.id]: {
                          ...credentials[platform.id],
                          apiKey: e.target.value
                        }
                      })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`${platform.id}-secret`}>API Secret / Client Secret</Label>
                  <Input
                    id={`${platform.id}-secret`}
                    type="password"
                    placeholder="Enter your API secret"
                    value={credentials[platform.id]?.apiSecret || ''}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        [platform.id]: {
                          ...credentials[platform.id],
                          apiSecret: e.target.value
                        }
                      })
                    }
                  />
                </div>
                
                <Button
                  onClick={() => handleSaveCredentials(platform.id, platform.display_name)}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Saving...' : 'Save Credentials'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
