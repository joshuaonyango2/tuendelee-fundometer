import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, CreditCard, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PaymentConfirmation } from "./PaymentConfirmation";

interface FindMyPledgeProps {
  eventId: string;
}

interface Pledge {
  id: string;
  name: string;
  amount: number;
  currency: string;
  payment_type: string;
  is_confirmed: boolean;
  created_at: string;
  payment_deadline: string | null;
  message: string | null;
}

export function FindMyPledge({ eventId }: FindMyPledgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [selectedPledge, setSelectedPledge] = useState<Pledge | null>(null);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      toast.error("Please enter at least 2 characters to search");
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.rpc('find_my_pledges', {
        p_event_id: eventId,
        p_search_term: searchTerm.trim()
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.info("No pledges found. Try searching with your email, full name, or phone number.");
        setPledges([]);
      } else {
        setPledges(data);
        toast.success(`Found ${data.length} pledge${data.length > 1 ? 's' : ''}`);
      }
    } catch (error: any) {
      console.error('Error searching pledges:', error);
      const msg = error?.message || 'Unknown error';
      const code = error?.code ? ` (${error.code})` : '';
      toast.error(`Unable to search pledges${code}: ${msg}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePayPledge = (pledge: Pledge) => {
    setSelectedPledge(pledge);
    setShowPaymentConfirmation(true);
  };

  const handlePaymentComplete = () => {
    setShowPaymentConfirmation(false);
    setSelectedPledge(null);
    // Refresh the pledges list
    handleSearch();
    toast.success("Payment confirmation submitted successfully!");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Search className="w-4 h-4" />
          Find My Pledge
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Find & Pay Your Pledge</DialogTitle>
          <DialogDescription>
            Search using your email, full name, or phone number
          </DialogDescription>
        </DialogHeader>

        {!showPaymentConfirmation ? (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="search-term">Email, Name, or Phone</Label>
                <Input
                  id="search-term"
                  type="text"
                  placeholder="e.g., john@example.com or John Doe or +254712345678"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>

            {pledges.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Your Pledges</h3>
                {pledges.map((pledge) => {
                  const daysRemaining = getDaysRemaining(pledge.payment_deadline);
                  return (
                    <Card key={pledge.id} className={pledge.is_confirmed ? "border-green-200 bg-green-50/50" : "border-orange-200 bg-orange-50/50"}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {formatAmount(pledge.amount, pledge.currency)}
                            </CardTitle>
                            <CardDescription>
                              Pledged on {formatDate(pledge.created_at)}
                            </CardDescription>
                          </div>
                          <Badge variant={pledge.is_confirmed ? "default" : "secondary"}>
                            {pledge.is_confirmed ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Paid
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {pledge.message && (
                          <p className="text-sm text-muted-foreground italic">
                            "{pledge.message}"
                          </p>
                        )}
                        
                        {!pledge.is_confirmed && (
                          <>
                            {daysRemaining !== null && (
                              <p className="text-sm">
                                <span className="font-medium">Payment due in:</span>{" "}
                                <span className={daysRemaining <= 3 ? "text-red-600 font-semibold" : "text-orange-600"}>
                                  {daysRemaining > 0 ? `${daysRemaining} days` : "Overdue"}
                                </span>
                              </p>
                            )}
                            
                            <Button 
                              onClick={() => handlePayPledge(pledge)}
                              className="w-full gap-2"
                            >
                              <CreditCard className="w-4 h-4" />
                              Complete Payment
                            </Button>
                          </>
                        )}
                        
                        {pledge.is_confirmed && (
                          <p className="text-sm text-green-700 font-medium">
                            ✓ Thank you for your payment!
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : selectedPledge && (
          <PaymentConfirmation
            pledgeId={selectedPledge.id}
            amount={selectedPledge.amount}
            currency={selectedPledge.currency}
            paymentMethod={{ type: 'mpesa', name: 'M-Pesa' }}
            onBack={() => setShowPaymentConfirmation(false)}
            onComplete={handlePaymentComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
