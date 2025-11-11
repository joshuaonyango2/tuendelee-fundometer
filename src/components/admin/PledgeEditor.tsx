import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { Pencil } from 'lucide-react';

interface PledgeEditorProps {
  pledge: {
    id: string;
    name: string;
    email: string | null;
    donor_phone: string | null;
    amount: number;
    currency: string;
    payment_method: string | null;
    payment_reference: string | null;
    message: string | null;
    is_confirmed: boolean;
  };
  onUpdate: () => void;
}

export function PledgeEditor({ pledge, onUpdate }: PledgeEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: pledge.name,
    email: pledge.email || '',
    phone: pledge.donor_phone || '',
    amount: pledge.amount.toString(),
    currency: pledge.currency,
    paymentMethod: pledge.payment_method || '',
    paymentReference: pledge.payment_reference || '',
    message: pledge.message || '',
    isPaid: pledge.is_confirmed
  });

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

      const { error } = await supabase.rpc('update_pledge_by_admin', {
        p_pledge_id: pledge.id,
        p_name: formData.name,
        p_email: formData.email || null,
        p_amount: amount,
        p_currency: formData.currency,
        p_payment_method: formData.paymentMethod || null,
        p_payment_reference: formData.paymentReference || null,
        p_donor_phone: formData.phone || null,
        p_donor_address: '',
        p_message: formData.message || null,
        p_is_confirmed: formData.isPaid
      });

      if (error) throw error;

      toast.success('Updated successfully! Thank you for supporting the Tuendelee Foundation. Let\'s progress together! 🎉');
      setIsOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating pledge:', error);
      toast.error(error?.message || 'Failed to update pledge');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-8 w-8 p-0"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pledge</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Donor Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-currency">Currency *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger id="edit-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="KES">KES</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-paymentMethod">Payment Method</Label>
                <Input
                  id="edit-paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-reference">Payment Reference</Label>
                <Input
                  id="edit-reference"
                  value={formData.paymentReference}
                  onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                />
              </div>

              <div className="space-y-2 flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="edit-isPaid"
                  checked={formData.isPaid}
                  onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="edit-isPaid" className="cursor-pointer">
                  Mark as paid
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-message">Message (Optional)</Label>
              <Textarea
                id="edit-message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Pledge'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
