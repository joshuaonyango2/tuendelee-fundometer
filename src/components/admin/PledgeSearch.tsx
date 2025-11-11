import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { formatAmountWithKES } from '@/lib/currencyUtils';
import { Badge } from '@/components/ui/badge';

interface Pledge {
  id: string;
  name: string;
  email: string;
  donor_phone: string;
  amount: number;
  amount_in_usd: number;
  amount_in_kes: number;
  currency: string;
  payment_type: string;
  payment_method: string;
  payment_reference: string;
  is_confirmed: boolean;
  created_at: string;
  message: string;
  payment_deadline?: string | null;
}

interface PledgeSearchProps {
  pledges: Pledge[];
}

export function PledgeSearch({ pledges }: PledgeSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPledge, setSelectedPledge] = useState<Pledge | null>(null);

  const filteredPledges = pledges.filter((pledge) => {
    const term = searchTerm.toLowerCase();
    return (
      pledge.name.toLowerCase().includes(term) ||
      pledge.email?.toLowerCase().includes(term) ||
      pledge.donor_phone?.includes(searchTerm)
    );
  });

  const showResults = searchTerm.length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {showResults && filteredPledges.length > 0 && (
        <Card className="absolute z-50 w-full mt-2 max-h-96 overflow-y-auto">
          <CardContent className="p-2">
            {filteredPledges.map((pledge) => (
              <button
                key={pledge.id}
                onClick={() => {
                  setSelectedPledge(pledge);
                  setSearchTerm('');
                }}
                className="w-full text-left p-3 hover:bg-accent rounded-md transition-colors"
              >
                <div className="font-medium">{pledge.name}</div>
                <div className="text-sm text-muted-foreground">
                  {pledge.email} • {pledge.donor_phone}
                </div>
                <div className="text-sm font-medium mt-1">
                  {formatAmountWithKES(pledge.amount, pledge.currency, pledge.amount_in_kes).primary}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {showResults && filteredPledges.length === 0 && (
        <Card className="absolute z-50 w-full mt-2">
          <CardContent className="p-4 text-center text-muted-foreground">
            No pledges found
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedPledge} onOpenChange={() => setSelectedPledge(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pledge Details</DialogTitle>
          </DialogHeader>
          
          {selectedPledge && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Donor Name</div>
                  <div className="font-medium">{selectedPledge.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant={selectedPledge.is_confirmed ? "default" : "secondary"}>
                    {selectedPledge.is_confirmed ? 'Paid' : 'Pending'}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{selectedPledge.email || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium">{selectedPledge.donor_phone || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Amount</div>
                  <div className="font-medium">
                    {formatAmountWithKES(selectedPledge.amount, selectedPledge.currency, selectedPledge.amount_in_kes).primary}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatAmountWithKES(selectedPledge.amount, selectedPledge.currency, selectedPledge.amount_in_kes).kes}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Payment Method</div>
                  <div className="font-medium">{selectedPledge.payment_method || selectedPledge.payment_type}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Payment Reference</div>
                  <div className="font-medium font-mono text-sm">{selectedPledge.payment_reference || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date Created</div>
                  <div className="font-medium">{format(new Date(selectedPledge.created_at), 'PPP')}</div>
                </div>
                {selectedPledge.payment_deadline && (
                  <div>
                    <div className="text-sm text-muted-foreground">Payment Due</div>
                    <div className="font-medium">{format(new Date(selectedPledge.payment_deadline), 'PPP')}</div>
                  </div>
                )}
              </div>
              
              {selectedPledge.message && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Message</div>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <p className="text-sm">{selectedPledge.message}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
