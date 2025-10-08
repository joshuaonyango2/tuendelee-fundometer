import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Smartphone, Building, Heart, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PaymentConfirmation } from './PaymentConfirmation';
import { toast } from 'sonner';

interface ImprovedPaymentOptionsProps {
  pledgeId: string;
  amount: number;
  currency: string;
  email: string;
  name: string;
  onClose: () => void;
}

export function ImprovedPaymentOptions({ 
  pledgeId,
  amount, 
  currency, 
  email, 
  name, 
  onClose 
}: ImprovedPaymentOptionsProps) {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    console.log('ImprovedPaymentOptions mounted with:', { pledgeId, amount, currency, email, name });
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    console.log('Loading payment methods...');
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error loading payment methods:', error);
      toast.error('Failed to load payment methods');
      return;
    }

    console.log('Payment methods loaded:', data);
    setPaymentMethods(data || []);
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'mpesa':
        return <Smartphone className="w-5 h-5" />;
      case 'paypal':
        return <CreditCard className="w-5 h-5" />;
      case 'bank_transfer':
        return <Building className="w-5 h-5" />;
      case 'benevity':
        return <Heart className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getMethodDisplayName = (type: string) => {
    switch (type) {
      case 'mpesa':
        return 'M-Pesa';
      case 'paypal':
        return 'PayPal';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'benevity':
        return 'Benevity';
      default:
        return type;
    }
  };

  if (showConfirmation && selectedMethod) {
    return (
      <PaymentConfirmation
        pledgeId={pledgeId}
        amount={amount}
        currency={currency}
        paymentMethod={selectedMethod}
        onBack={() => {
          setShowConfirmation(false);
          setSelectedMethod(null);
        }}
        onComplete={onClose}
      />
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-2xl border-primary/10">
      <CardHeader className="bg-gradient-success text-white rounded-t-lg">
        <CardTitle>Choose Payment Method</CardTitle>
        <CardDescription className="text-success-foreground/90">
          Select how you'd like to complete your donation of {currency} {amount}
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
          {paymentMethods.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No payment methods available. Please contact the administrator.
            </p>
          ) : (
            paymentMethods.map((method) => (
              <Button
                key={method.id}
                onClick={() => {
                  setSelectedMethod(method);
                  setShowConfirmation(true);
                }}
                className="w-full justify-between"
                variant="outline"
                size="lg"
              >
                <span className="flex items-center gap-2">
                  {getMethodIcon(method.type)}
                  <span>
                    {method.name}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({getMethodDisplayName(method.type)})
                    </span>
                  </span>
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ))
          )}
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground text-center mb-4">
            You will receive payment instructions for your selected method
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