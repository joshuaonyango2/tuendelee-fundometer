import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { z } from 'zod';
import standardCharteredLogo from "@/assets/standard-chartered-logo.jpg";

interface PaymentConfirmationProps {
  pledgeId: string;
  amount: number;
  currency: string;
  paymentMethod: any;
  onBack: () => void;
  onComplete: () => void;
}

export function PaymentConfirmation({ 
  pledgeId, 
  amount, 
  currency, 
  paymentMethod,
  onBack,
  onComplete 
}: PaymentConfirmationProps) {
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    reference: '',
    mpesaCode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Input validation schema
  const paymentSchema = z.object({
    phone: z.string()
      .min(10, 'Phone must be at least 10 digits')
      .max(20, 'Phone too long')
      .regex(/^[\+]?[0-9\s\-]+$/, 'Invalid phone format'),
    address: z.string().max(500, 'Address too long').optional(),
    mpesaCode: z.string()
      .regex(/^[A-Z0-9]{10}$/, 'Invalid M-Pesa code format (10 alphanumeric characters)')
      .optional(),
    reference: z.string().max(100, 'Reference too long').optional()
  });

  const handleSubmit = async () => {
    // Validate inputs
    const validationData = {
      phone: formData.phone,
      address: formData.address || undefined,
      mpesaCode: paymentMethod.type === 'mpesa' ? formData.mpesaCode : undefined,
      reference: paymentMethod.type !== 'mpesa' ? formData.reference : undefined
    };

    const result = paymentSchema.safeParse(validationData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    if (paymentMethod.type === 'mpesa' && !formData.mpesaCode) {
      toast.error('Please enter the M-Pesa transaction code');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get session token from localStorage
      const sessionData = localStorage.getItem('event_session');
      if (!sessionData) {
        toast.error('Session expired. Please rejoin the event.');
        return;
      }
      
      const { sessionToken } = JSON.parse(sessionData);

      // Use secure RPC instead of direct update
      const { error } = await supabase.rpc('confirm_pledge_payment', {
        p_pledge_id: pledgeId,
        p_payment_method: paymentMethod.type,
        p_payment_reference: paymentMethod.type === 'mpesa' ? formData.mpesaCode : formData.reference || null,
        p_donor_phone: formData.phone,
        p_donor_address: formData.address || null,
        p_session_token: sessionToken
      });

      if (error) throw error;

      toast.success('Payment confirmed successfully!');
      onComplete();
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast.error(error.message || 'Failed to confirm payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPaymentInstructions = () => {
    const details = paymentMethod.account_details;

    switch (paymentMethod.type) {
      case 'mpesa':
        return (
          <div className="bg-accent p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">M-Pesa Payment Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Go to M-Pesa on your phone</li>
              <li>Select "Lipa na M-Pesa"</li>
              <li>Select "Pay Bill"</li>
              <li>Enter Business Number: <strong>{details.paybill}</strong></li>
              <li>Enter Account Number: <strong>{details.account_name}</strong></li>
              <li>Enter Amount: <strong>{currency} {amount}</strong></li>
              <li>Enter your M-Pesa PIN and confirm</li>
              <li>Enter the transaction code below</li>
            </ol>
            {details.instructions && (
              <p className="mt-2 text-sm text-muted-foreground">{details.instructions}</p>
            )}
          </div>
        );

      case 'paypal':
        return (
          <div className="bg-accent p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">PayPal Payment Instructions:</h4>
            <p className="text-sm mb-2">Send payment to:</p>
            <p className="font-mono font-semibold">{details.email}</p>
            <p className="text-sm mt-2">Amount: <strong>{currency} {amount}</strong></p>
            {details.instructions && (
              <p className="mt-2 text-sm text-muted-foreground">{details.instructions}</p>
            )}
          </div>
        );

      case 'bank_transfer':
        return (
          <div className="bg-accent p-4 rounded-lg mb-4">
            <div className="flex items-center gap-3 mb-3">
              <img src={standardCharteredLogo} alt="Standard Chartered" className="h-12 object-contain bg-white p-1 rounded" />
            </div>
            <h4 className="font-semibold mb-2">Bank Transfer Details:</h4>
            <div className="space-y-2 text-sm">
              <div className="border-b border-border pb-2">
                <p><strong>Bank:</strong> Standard Chartered</p>
                <p><strong>Account Name:</strong> TUENDELEE FOUNDATION</p>
              </div>
              <div>
                <p className="font-semibold text-primary">Account Number (KES):</p>
                <p className="font-mono text-base">0102853403700</p>
              </div>
              <div>
                <p className="font-semibold text-primary">Account Number (USD):</p>
                <p className="font-mono text-base">8702853403700</p>
              </div>
              <div className="border-t border-border pt-2 space-y-1">
                <p><strong>Branch:</strong> KENYATTA AVENUE</p>
                <p><strong>SWIFT Code:</strong> SCBLKENXXXX</p>
              </div>
              <p className="mt-2 pt-2 border-t border-border"><strong>Amount:</strong> {currency} {amount}</p>
            </div>
          </div>
        );

      case 'benevity':
        return (
          <div className="bg-accent p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">Benevity Donation Instructions:</h4>
            <p className="text-sm mb-2">Organization Name:</p>
            <p className="font-semibold">{details.account_name}</p>
            <p className="text-sm mt-2">Amount: <strong>{currency} {amount}</strong></p>
            <p className="text-sm mt-2 text-muted-foreground">
              Please complete your donation through your company's Benevity portal
            </p>
            {details.instructions && (
              <p className="mt-2 text-sm text-muted-foreground">{details.instructions}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="w-fit mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <CardTitle>Confirm Your Payment</CardTitle>
        <CardDescription>
          Please follow the instructions and confirm your payment
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderPaymentInstructions()}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+254 XXX XXX XXX"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address (Optional)</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter your address"
            />
          </div>

          {paymentMethod.type === 'mpesa' && (
            <div className="space-y-2">
              <Label htmlFor="mpesaCode">M-Pesa Transaction Code *</Label>
              <Input
                id="mpesaCode"
                value={formData.mpesaCode}
                onChange={(e) => setFormData({ ...formData, mpesaCode: e.target.value })}
                placeholder="e.g., QA12B3C4D5"
                required
              />
            </div>
          )}

          {paymentMethod.type !== 'mpesa' && (
            <div className="space-y-2">
              <Label htmlFor="reference">Transaction Reference (Optional)</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Enter transaction reference"
              />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              'Confirming...'
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Payment
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}