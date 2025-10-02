import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'mpesa' | 'paypal' | 'bank_transfer' | 'benevity';
  account_details: {
    account_number?: string;
    account_name?: string;
    bank_name?: string;
    branch?: string;
    swift_code?: string;
    paybill?: string;
    email?: string;
    instructions?: string;
  };
  is_active: boolean;
}

export function PaymentMethodsManager() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<Partial<PaymentMethod>>({
    name: '',
    type: 'mpesa',
    account_details: {},
    is_active: true
  });

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load payment methods');
      return;
    }

    setMethods((data as PaymentMethod[]) || []);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingMethod) {
      const { error } = await supabase
        .from('payment_methods')
        .update({
          name: formData.name,
          type: formData.type,
          account_details: formData.account_details,
          is_active: formData.is_active
        })
        .eq('id', editingMethod.id);

      if (error) {
        toast.error('Failed to update payment method');
        return;
      }

      toast.success('Payment method updated successfully');
    } else {
      const { error } = await supabase
        .from('payment_methods')
        .insert({
          name: formData.name,
          type: formData.type,
          account_details: formData.account_details,
          is_active: formData.is_active
        });

      if (error) {
        toast.error('Failed to add payment method');
        return;
      }

      toast.success('Payment method added successfully');
    }

    setIsDialogOpen(false);
    setEditingMethod(null);
    setFormData({
      name: '',
      type: 'mpesa',
      account_details: {},
      is_active: true
    });
    loadPaymentMethods();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete payment method');
      return;
    }

    toast.success('Payment method deleted successfully');
    loadPaymentMethods();
  };

  const openEditDialog = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData(method);
    setIsDialogOpen(true);
  };

  const renderAccountDetailsForm = () => {
    switch (formData.type) {
      case 'mpesa':
        return (
          <>
            <div className="space-y-2">
              <Label>Paybill Number</Label>
              <Input
                value={formData.account_details?.paybill || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  account_details: { ...formData.account_details, paybill: e.target.value }
                })}
                placeholder="123456"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input
                value={formData.account_details?.account_name || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  account_details: { ...formData.account_details, account_name: e.target.value }
                })}
                placeholder="Organization Name"
              />
            </div>
          </>
        );
      case 'paypal':
        return (
          <div className="space-y-2">
            <Label>PayPal Email</Label>
            <Input
              type="email"
              value={formData.account_details?.email || ''}
              onChange={(e) => setFormData({
                ...formData,
                account_details: { ...formData.account_details, email: e.target.value }
              })}
              placeholder="organization@example.com"
            />
          </div>
        );
      case 'bank_transfer':
        return (
          <>
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input
                value={formData.account_details?.bank_name || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  account_details: { ...formData.account_details, bank_name: e.target.value }
                })}
                placeholder="Bank Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                value={formData.account_details?.account_number || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  account_details: { ...formData.account_details, account_number: e.target.value }
                })}
                placeholder="Account Number"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input
                value={formData.account_details?.account_name || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  account_details: { ...formData.account_details, account_name: e.target.value }
                })}
                placeholder="Account Holder Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Input
                value={formData.account_details?.branch || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  account_details: { ...formData.account_details, branch: e.target.value }
                })}
                placeholder="Branch Name"
              />
            </div>
            <div className="space-y-2">
              <Label>SWIFT Code (Optional)</Label>
              <Input
                value={formData.account_details?.swift_code || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  account_details: { ...formData.account_details, swift_code: e.target.value }
                })}
                placeholder="SWIFT Code"
              />
            </div>
          </>
        );
      case 'benevity':
        return (
          <div className="space-y-2">
            <Label>Organization Name</Label>
            <Input
              value={formData.account_details?.account_name || ''}
              onChange={(e) => setFormData({
                ...formData,
                account_details: { ...formData.account_details, account_name: e.target.value }
              })}
              placeholder="As registered on Benevity"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Configure payment methods for donations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Payment Method
          </Button>
        </div>

        <div className="space-y-4">
          {methods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">{method.name}</h4>
                <p className="text-sm text-muted-foreground capitalize">{method.type.replace('_', ' ')}</p>
                {method.type === 'mpesa' && method.account_details.paybill && (
                  <p className="text-sm">Paybill: {method.account_details.paybill}</p>
                )}
                {method.type === 'paypal' && method.account_details.email && (
                  <p className="text-sm">Email: {method.account_details.email}</p>
                )}
                {method.type === 'bank_transfer' && (
                  <p className="text-sm">
                    {method.account_details.bank_name} - {method.account_details.account_number}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(method)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(method.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </DialogTitle>
              <DialogDescription>
                Configure the payment method details
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Payment Method Name"
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="benevity">Benevity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderAccountDetailsForm()}

              <div className="space-y-2">
                <Label>Instructions (Optional)</Label>
                <Textarea
                  value={formData.account_details?.instructions || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    account_details: { ...formData.account_details, instructions: e.target.value }
                  })}
                  placeholder="Additional instructions for donors"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}