import { useState, useEffect } from "react";
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
import { Search, CreditCard, Clock, CheckCircle2, ArrowRight, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PaymentConfirmation } from "./PaymentConfirmation";
import { PledgeReceipt } from "./PledgeReceipt";
import { useLanguage } from "@/contexts/LanguageContext";

interface FindMyPledgeProps {
  eventId: string;
}

interface Pledge {
  id: string;
  name: string;
  email: string;
  amount: number;
  amount_in_kes: number;
  currency: string;
  payment_type: string;
  is_confirmed: boolean;
  created_at: string;
  payment_deadline: string | null;
  message: string | null;
  payment_method: string | null;
  payment_reference: string | null;
}

export function FindMyPledge({ eventId }: FindMyPledgeProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [selectedPledge, setSelectedPledge] = useState<Pledge | null>(null);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [showPaymentMethodSelector, setShowPaymentMethodSelector] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [eventTitle, setEventTitle] = useState("");

  useEffect(() => {
    loadPaymentMethods();
    loadEventDetails();
  }, [eventId]);

  const loadEventDetails = async () => {
    const { data, error } = await supabase
      .from('fundraising_events')
      .select('title')
      .eq('id', eventId)
      .single();

    if (!error && data) {
      setEventTitle(data.title);
    }
  };

  const loadPaymentMethods = async () => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error loading payment methods:', error);
      return;
    }

    setPaymentMethods(data || []);
    // Default to first payment method (usually M-Pesa)
    if (data && data.length > 0) {
      setSelectedPaymentMethod(data[0]);
    }
  };

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
        // Map the data to include the missing fields with default values
        const mappedData = data.map((pledge: any) => ({
          ...pledge,
          email: pledge.email || '',
          amount_in_kes: pledge.amount_in_kes || pledge.amount * 128
        }));
        setPledges(mappedData);
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
    
    // Find and set the payment method that was originally chosen as default
    if (pledge.payment_method && paymentMethods.length > 0) {
      const matchedMethod = paymentMethods.find(
        pm => pm.name.toLowerCase() === pledge.payment_method?.toLowerCase()
      );
      if (matchedMethod) {
        setSelectedPaymentMethod(matchedMethod);
      } else if (paymentMethods.length > 0) {
        setSelectedPaymentMethod(paymentMethods[0]);
      }
    } else if (paymentMethods.length > 0) {
      setSelectedPaymentMethod(paymentMethods[0]);
    }
    
    setShowPaymentMethodSelector(true);
  };

  const handleProceedToPayment = () => {
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    setShowPaymentMethodSelector(false);
    setShowPaymentConfirmation(true);
  };

  const handlePaymentComplete = () => {
    setShowPaymentConfirmation(false);
    setShowPaymentMethodSelector(false);
    setSelectedPledge(null);
    setSelectedPaymentMethod(null);
    // Refresh the pledges list
    handleSearch();
    toast.success(`${t("find.updated")} 🎉`);
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
    <div className="text-center space-y-3">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg py-3 px-4 shadow-md">
        <p className="text-sm font-bold flex items-center justify-center gap-2">
          <CreditCard className="w-4 h-4" />
          {t("find.banner")}
        </p>
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="default" 
            size="lg"
            className="gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base py-3 px-6 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Search className="w-5 h-5" />
            {t("find.button")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t("find.dialogTitle")}</DialogTitle>
            <DialogDescription className="text-base">
              {t("find.dialogDescription")}
            </DialogDescription>
          </DialogHeader>

          {!showPaymentConfirmation && !showPaymentMethodSelector ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="search-term" className="text-base font-medium">
                      {t("find.searchLabel")}
                    </Label>
                    <Input
                      id="search-term"
                      type="text"
                      placeholder="e.g., john@example.com or John Doe or +254712345678"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleSearch} 
                      disabled={isSearching}
                      size="lg"
                      className="h-12 px-6"
                    >
                      {isSearching ? t("find.searching") : t("find.search")}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {t("find.searchHint")}
                </p>
              </div>

              {pledges.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">{t("find.yourPledges")}</h3>
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
                                {t("find.pledgedOn")} {formatDate(pledge.created_at)}
                              </CardDescription>
                            </div>
                            <Badge variant={pledge.is_confirmed ? "default" : "secondary"} className="text-sm">
                              {pledge.is_confirmed ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  {t("find.paid")}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {t("find.pending")}
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
                                  <span className="font-medium">{t("find.dueIn")}</span>{" "}
                                  <span className={daysRemaining <= 3 ? "text-red-600 font-semibold" : "text-orange-600"}>
                                    {daysRemaining > 0 ? `${daysRemaining} ${t("find.days")}` : t("find.overdue")}
                                  </span>
                                </p>
                              )}
                              
                              <Button 
                                onClick={() => handlePayPledge(pledge)}
                                className="w-full gap-2 h-11 text-base font-medium"
                                size="lg"
                              >
                                <CreditCard className="w-5 h-5" />
                                {t("find.completePayment")}
                              </Button>
                            </>
                          )}
                          
                          {pledge.is_confirmed && (
                            <div className="space-y-3">
                              <p className="text-sm text-green-700 font-medium">
                                ✓ {t("find.thankYouPaid")}
                              </p>
                              <PledgeReceipt pledge={pledge} eventTitle={eventTitle} />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ) : showPaymentMethodSelector && selectedPledge ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">{t("find.selectMethod")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("find.paying")} {formatAmount(selectedPledge.amount, selectedPledge.currency)}
                </p>
              </div>

              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <Card 
                    key={method.id}
                    className={`cursor-pointer transition-all ${
                      selectedPaymentMethod?.id === method.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPaymentMethod(method)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedPaymentMethod?.id === method.id
                            ? 'border-primary bg-primary'
                            : 'border-gray-300'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{method.type}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 h-11"
                  onClick={() => {
                    setShowPaymentMethodSelector(false);
                    setSelectedPledge(null);
                    setSelectedPaymentMethod(null);
                  }}
                >
                  {t("find.cancel")}
                </Button>
                <Button 
                  className="flex-1 h-11"
                  onClick={handleProceedToPayment}
                  disabled={!selectedPaymentMethod}
                >
                  {t("find.continue")}
                </Button>
              </div>
            </div>
          ) : selectedPledge && selectedPaymentMethod && (
            <PaymentConfirmation
              pledgeId={selectedPledge.id}
              amount={selectedPledge.amount}
              currency={selectedPledge.currency}
              paymentMethod={selectedPaymentMethod}
              onBack={() => {
                setShowPaymentConfirmation(false);
                setShowPaymentMethodSelector(true);
              }}
              onComplete={handlePaymentComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
