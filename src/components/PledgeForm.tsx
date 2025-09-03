import { useState } from "react";
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

interface PledgeFormProps {
  onSubmit: (pledge: PledgeData) => void;
}

export interface PledgeData {
  name: string;
  email: string;
  amount: number;
  currency: string;
  message?: string;
}

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
];

export function PledgeForm({ onSubmit }: PledgeFormProps) {
  const [formData, setFormData] = useState<PledgeData>({
    name: "",
    email: "",
    amount: 0,
    currency: "USD",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || formData.amount <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast.success("Thank you for your pledge! Redirecting to payment...");
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        amount: 0,
        currency: "USD",
        message: "",
      });
    } catch (error) {
      toast.error("Failed to submit pledge. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-primary/10">
      <CardHeader className="bg-gradient-primary text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Make Your Pledge
        </CardTitle>
        <CardDescription className="text-primary-foreground/90">
          Support bright students in need of scholarships
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Your Name *
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
              Email Address *
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
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Amount *
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
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="border-primary/20 focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Your message of support..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="border-primary/20 focus:border-primary resize-none"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-secondary hover:opacity-90 text-white font-semibold py-6 text-lg shadow-lg"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Pledge Now
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}