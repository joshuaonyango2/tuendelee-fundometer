import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart, DollarSign, User, Mail, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
interface PledgeFormProps {
  onSubmit: (pledge: PledgeData) => void;
}

export interface PledgeData {
  name: string;
  email: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  message?: string;
  paymentType: 'immediate' | 'pledge';
  pledgeDurationDays?: number;
}

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
];

// Payment methods will be loaded dynamically from Supabase

export function PledgeForm({ onSubmit }: PledgeFormProps) {
  const { t } = useLanguage();
  // Load saved donor info from localStorage
  const getSavedDonorInfo = () => {
    const saved = localStorage.getItem('donor_info');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { name: "", email: "" };
      }
    }
    return { name: "", email: "" };
  };

  const savedInfo = getSavedDonorInfo();
  const [formData, setFormData] = useState<PledgeData>({
    name: savedInfo.name || "",
    email: savedInfo.email || "",
    amount: 0,
    currency: "KES",
    paymentMethod: "",
    message: "",
    paymentType: 'immediate',
    pledgeDurationDays: 7,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const loadMethods = async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('name,type')
        .eq('is_active', true)
        .order('name');
      if (error) {
        console.error('Failed to load payment methods', error);
        return;
      }
      // Map each active method; show friendly labels, but keep bank transfer entries distinct
      const labelFor = (m: any) => {
        switch (m.type) {
          case 'mpesa':
            return 'M-Pesa';
          case 'paypal':
            return 'PayPal';
          case 'benevity':
            return 'Benevity';
          case 'bank_transfer':
            return m.name || 'Bank Transfer';
          default:
            return m.name || m.type;
        }
      };
      const mapped = (data || []).map((m: any) => ({
        value: m.type === 'bank_transfer' ? `bank_transfer:${m.name || 'Bank'}` : m.type,
        label: labelFor(m)
      }));
      setAvailableMethods(mapped);
      if (!formData.paymentMethod && mapped[0]) {
        setFormData((prev) => ({ ...prev, paymentMethod: mapped[0].value }));
      }
    };
    loadMethods();
  }, []);
  const handleSubmit = async (paymentType: 'immediate' | 'pledge') => {
    if (!formData.name || !formData.email || formData.amount <= 0) {
      toast.error(t("pledge.requiredFields"));
      return;
    }

    if (paymentType === 'pledge' && (!formData.pledgeDurationDays || formData.pledgeDurationDays < 1 || formData.pledgeDurationDays > 30)) {
      toast.error("Please select a valid payment duration (1-30 days)");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save donor info to localStorage for future use
      localStorage.setItem('donor_info', JSON.stringify({
        name: formData.name,
        email: formData.email
      }));

      await onSubmit({ ...formData, paymentType });
      
      // Reset form after successful submission but keep donor info
      setFormData({
        name: formData.name,
        email: formData.email,
        amount: 0,
        currency: "KES",
        paymentMethod: "",
        message: "",
        paymentType: 'immediate',
        pledgeDurationDays: 7,
      });
    } catch (error) {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-primary/10">
      <CardHeader className="bg-gradient-primary text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5" />
          {t("pledge.formTitle")}
        </CardTitle>
        <CardDescription className="text-primary-foreground/90">
          {t("pledge.formSubtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t("pledge.name")} *
            </Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="border-primary/20 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {t("pledge.email")} *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="border-primary/20 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                {t("pledge.amount")} (in {currencies.find(c => c.code === formData.currency)?.code || 'KES'}) *
              </Label>
              <Input
                id="amount"
                type="number"
                min="1"
                placeholder="100"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
                className="border-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t("pledge.currency")}</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="border-primary/20 focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background">
                  {currencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">{t("pledge.paymentMethod")} *</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
            >
              <SelectTrigger className="border-primary/20 focus:border-primary">
                <SelectValue placeholder={t("pledge.selectMethod")} />
              </SelectTrigger>
                <SelectContent className="z-50 bg-background">
                  {availableMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">{t("pledge.duration")}</Label>
            <Select
              value={formData.pledgeDurationDays?.toString() || "7"}
              onValueChange={(value) => setFormData({ ...formData, pledgeDurationDays: parseInt(value) })}
            >
              <SelectTrigger className="border-primary/20 focus:border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background">
                <SelectItem value="7">7 {t("pledge.days")}</SelectItem>
                <SelectItem value="14">14 {t("pledge.days")}</SelectItem>
                <SelectItem value="21">21 {t("pledge.days")}</SelectItem>
                <SelectItem value="30">{t("pledge.month")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {t("pledge.message")}
            </Label>
            <Textarea
              id="message"
              placeholder={t("pledge.messagePlaceholder")}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="border-primary/20 focus:border-primary resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={() => handleSubmit('immediate')}
              disabled={isSubmitting}
              className="w-full bg-success hover:bg-success/90 text-white font-semibold py-6 text-lg shadow-lg"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t("pledge.processing")}
                </span>
              ) : (
                t("pledge.payNow")
              )}
            </Button>

            <Button
              type="button"
              onClick={() => handleSubmit('pledge')}
              disabled={isSubmitting}
              className="w-full bg-gradient-secondary hover:opacity-90 text-white font-semibold py-6 text-lg shadow-lg"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t("pledge.processing")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  {t("pledge.pledgeNow")}
                </span>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}