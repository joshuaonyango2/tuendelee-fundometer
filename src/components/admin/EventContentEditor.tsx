import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Languages, Save } from 'lucide-react';

interface EventContentEditorProps {
  eventId: string;
  event: any;
  onSaved?: () => void;
}

const LANGS = [
  { code: 'en', label: 'English (original)', titleKey: 'title', descKey: 'description' },
  { code: 'it', label: 'Italiano', titleKey: 'title_it', descKey: 'description_it' },
  { code: 'fr', label: 'Français', titleKey: 'title_fr', descKey: 'description_fr' },
  { code: 'sw', label: 'Kiswahili', titleKey: 'title_sw', descKey: 'description_sw' },
] as const;

export function EventContentEditor({ eventId, event, onSaved }: EventContentEditorProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    LANGS.forEach(({ titleKey, descKey }) => {
      initial[titleKey] = event?.[titleKey] ?? '';
      initial[descKey] = event?.[descKey] ?? '';
    });
    return initial;
  });
  const [isSaving, setIsSaving] = useState(false);

  const setValue = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!values.title?.trim()) {
      toast.error('The English title is required');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, string | null> = {};
      LANGS.forEach(({ titleKey, descKey }) => {
        payload[titleKey] = values[titleKey]?.trim() ? values[titleKey].trim() : null;
        payload[descKey] = values[descKey]?.trim() ? values[descKey].trim() : null;
      });
      // English title must never be null
      payload.title = values.title.trim();

      const { error } = await supabase
        .from('fundraising_events')
        .update(payload)
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Updated successfully — donors will see your new text right away');
      onSaved?.();
    } catch (error: any) {
      console.error('Error saving event content:', error);
      toast.error(error?.message || 'Failed to save event text');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="w-5 h-5 text-primary" />
          Event Text Donors See
        </CardTitle>
        <CardDescription>
          Write your own title and description, and add translations so donors reading in Italian,
          French or Kiswahili understand it too. Any language left empty falls back to the English text.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="en">
          <TabsList className="flex-wrap h-auto">
            {LANGS.map((lang) => (
              <TabsTrigger key={lang.code} value={lang.code}>
                {lang.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {LANGS.map(({ code, label, titleKey, descKey }) => (
            <TabsContent key={code} value={code} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor={`title-${code}`}>Title ({label})</Label>
                <Input
                  id={`title-${code}`}
                  value={values[titleKey] ?? ''}
                  onChange={(e) => setValue(titleKey, e.target.value)}
                  placeholder={code === 'en' ? '7th Annual Fundraiser' : values.title || 'Translated title'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`desc-${code}`}>Description ({label})</Label>
                <Textarea
                  id={`desc-${code}`}
                  rows={8}
                  value={values[descKey] ?? ''}
                  onChange={(e) => setValue(descKey, e.target.value)}
                  placeholder={
                    code === 'en'
                      ? 'Tell donors what this campaign will achieve...'
                      : 'Translation of the description (optional)'
                  }
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Event Text'}
        </Button>
      </CardContent>
    </Card>
  );
}
