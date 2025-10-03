import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { z } from 'zod';

interface ManualPledgeEntryProps {
  eventId: string;
}

export function ManualPledgeEntry({ eventId }: ManualPledgeEntryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    amount: '',
    currency: 'USD',
    paymentMethod: '',
    paymentReference: '',
    message: '',
    isPaid: false
  });

  // Input validation schema
  const pledgeSchema = z.object({
    name: z.string().trim().min(1, 'Name required').max(100, 'Name too long'),
    email: z.string().email('Invalid email').max(255, 'Email too long').optional().or(z.literal('')),
    phone: z.string()
      .regex(/^[\+]?[0-9\s\-]*$/, 'Invalid phone format')
      .max(20, 'Phone too long')
      .optional()
      .or(z.literal('')),
    amount: z.number().positive('Amount must be positive').max(10000000, 'Amount too large'),
    message: z.string().max(1000, 'Message too long').optional().or(z.literal('')),
    paymentReference: z.string().max(100, 'Reference too long').optional().or(z.literal('')),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);
      
      // Validate inputs
      const result = pledgeSchema.safeParse({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        amount,
        message: formData.message,
        paymentReference: formData.paymentReference
      });

      if (!result.success) {
        toast.error(result.error.errors[0].message);
        setIsSubmitting(false);
        return;
      }

      // Convert to USD and KES
      const exchangeRate = formData.currency === 'KES' ? 0.0077 : 1;
      const amountInUSD = formData.currency === 'USD' ? amount : amount * exchangeRate;
      const amountInKES = formData.currency === 'KES' ? amount : amount / exchangeRate;

      const { error } = await supabase
        .from('event_pledges')
        .insert({
          event_id: eventId,
          name: formData.name,
          email: formData.email || null,
          donor_phone: formData.phone || null,
          amount: amount,
          amount_in_usd: amountInUSD,
          amount_in_kes: amountInKES,
          currency: formData.currency,
          payment_type: 'manual',
          payment_method: formData.paymentMethod || null,
          payment_reference: formData.paymentReference || null,
          message: formData.message || null,
          is_confirmed: formData.isPaid
        });

      if (error) throw error;

      toast.success('Pledge added successfully!');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        amount: '',
        currency: 'USD',
        paymentMethod: '',
        paymentReference: '',
        message: '',
        isPaid: false
      });
    } catch (error) {
      console.error('Error adding pledge:', error);
      toast.error('Failed to add pledge');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Manual Pledge Entry
        </CardTitle>
        <CardDescription>
          Add pledges manually on behalf of donors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Donor Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+254 712 345 678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="100"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="KES">KES</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Input
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                placeholder="M-Pesa, Bank Transfer, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Payment Reference</Label>
              <Input
                id="reference"
                value={formData.paymentReference}
                onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                placeholder="Transaction ID or code"
              />
            </div>

            <div className="space-y-2 flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isPaid"
                checked={formData.isPaid}
                onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isPaid" className="cursor-pointer">
                Mark as paid
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Thank you message or notes..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Adding Pledge...' : 'Add Pledge'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
