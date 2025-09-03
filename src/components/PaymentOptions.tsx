import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, CreditCard, Smartphone, Building } from "lucide-react";

interface PaymentOptionsProps {
  amount: number;
  currency: string;
  email: string;
  name: string;
  onClose: () => void;
}

export function PaymentOptions({ amount, currency, email, name, onClose }: PaymentOptionsProps) {
  const paypalUrl = `https://www.paypal.com/paypalme/tuendeleefoundation/${amount}${currency}`;
  
  const handlePaymentRedirect = (platform: string, url?: string) => {
    if (url) {
      window.open(url, '_blank');
    }
    console.log(`Redirecting to ${platform} for ${amount} ${currency}`);
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-2xl border-primary/10">
      <CardHeader className="bg-gradient-success text-white rounded-t-lg">
        <CardTitle>Complete Your Donation</CardTitle>
        <CardDescription className="text-success-foreground/90">
          Choose your preferred payment method for {currency} {amount}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="p-4 bg-accent rounded-lg">
          <p className="text-sm text-accent-foreground">
            <strong>Donor:</strong> {name}
          </p>
          <p className="text-sm text-accent-foreground">
            <strong>Email:</strong> {email}
          </p>
          <p className="text-sm text-accent-foreground">
            <strong>Amount:</strong> {currency} {amount}
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => handlePaymentRedirect('PayPal', paypalUrl)}
            className="w-full justify-between bg-[#0070ba] hover:bg-[#003087] text-white"
            size="lg"
          >
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              PayPal
            </span>
            <ExternalLink className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => handlePaymentRedirect('M-Pesa')}
            className="w-full justify-between bg-success hover:bg-success-light text-white"
            size="lg"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              M-Pesa (Kenya)
            </span>
            <span className="text-sm">Paybill: 123456</span>
          </Button>

          <Button
            onClick={() => handlePaymentRedirect('Bank Transfer')}
            variant="outline"
            className="w-full justify-between border-primary/20 hover:bg-primary/5"
            size="lg"
          >
            <span className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Bank Transfer
            </span>
            <span className="text-sm">View Details</span>
          </Button>

          <Button
            onClick={() => handlePaymentRedirect('Stripe', `https://donate.stripe.com/test_28o01234567890ABC?amount=${amount * 100}&currency=${currency.toLowerCase()}`)}
            variant="outline"
            className="w-full justify-between border-primary/20 hover:bg-primary/5"
            size="lg"
          >
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Card Payment (Stripe)
            </span>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground text-center mb-4">
            You will be redirected to a secure payment page
          </p>
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}