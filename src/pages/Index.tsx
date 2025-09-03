import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/HeroSection";
import { FundraisingThermometer } from "@/components/FundraisingThermometer";
import { PledgeForm, PledgeData } from "@/components/PledgeForm";
import { PaymentOptions } from "@/components/PaymentOptions";
import { RecentPledges, Pledge } from "@/components/RecentPledges";
import { AdminDashboard } from "@/components/AdminDashboard";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { currencyService } from "@/services/currencyService";
import { Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [goalAmount, setGoalAmount] = useState(50000); // Default goal in USD
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentPledge, setCurrentPledge] = useState<PledgeData | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const { pledges, addPledge, resetPledges } = useRealtimeUpdates();

  // Calculate totals
  const totalRaisedUSD = pledges.reduce((sum, p) => sum + p.amountInUSD, 0);
  const totalRaisedKES = pledges.reduce((sum, p) => sum + p.amountInKES, 0);

  const handlePledgeSubmit = async (pledgeData: PledgeData) => {
    try {
      // Convert to KES and USD
      const conversions = await currencyService.convertToMultiple(
        pledgeData.amount,
        pledgeData.currency,
        ['KES', 'USD']
      );

      const newPledge: Pledge = {
        id: Date.now().toString(),
        name: pledgeData.name,
        amount: pledgeData.amount,
        currency: pledgeData.currency,
        message: pledgeData.message,
        timestamp: new Date(),
        amountInKES: conversions.KES || 0,
        amountInUSD: conversions.USD || 0,
      };

      addPledge(newPledge);
      setCurrentPledge(pledgeData);
      setShowPaymentDialog(true);
      
      toast.success("Pledge recorded! Please complete your payment.");
    } catch (error) {
      toast.error("Failed to process pledge. Please try again.");
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Date', 'Name', 'Amount', 'Currency', 'USD Value', 'KES Value', 'Message'],
      ...pledges.map(p => [
        p.timestamp.toISOString(),
        p.name,
        p.amount,
        p.currency,
        p.amountInUSD,
        p.amountInKES,
        p.message || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pledges_${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("CSV exported successfully!");
  };

  const handleAdminLogin = () => {
    // Simple password check - in production, use proper authentication
    if (adminPassword === "tuendelee2024") {
      setIsAdminMode(true);
      toast.success("Admin mode activated");
    } else {
      toast.error("Invalid password");
    }
  };

  // Load goal from localStorage
  useEffect(() => {
    const storedGoal = localStorage.getItem('fundraising_goal');
    if (storedGoal) {
      setGoalAmount(parseFloat(storedGoal));
    }
  }, []);

  const handleUpdateGoal = (newGoal: number) => {
    setGoalAmount(newGoal);
    localStorage.setItem('fundraising_goal', newGoal.toString());
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Admin Mode Toggle */}
      <div className="fixed top-4 right-4 z-50">
        {!isAdminMode ? (
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="px-3 py-1 text-sm rounded border"
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdminLogin}
            >
              <Lock className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAdminMode(false)}
          >
            <Unlock className="w-4 h-4 mr-2" />
            Exit Admin
          </Button>
        )}
      </div>

      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        {isAdminMode ? (
          <AdminDashboard
            goalAmount={goalAmount}
            onUpdateGoal={handleUpdateGoal}
            pledges={pledges}
            onReset={resetPledges}
            onExport={handleExportCSV}
          />
        ) : (
          <>
            {/* Campaign Progress Section */}
            <section className="mb-16">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Annual Fundraising Campaign
                </h2>
                <p className="text-lg text-muted-foreground">
                  Help us provide scholarships to deserving students
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 items-start">
                {/* Thermometer */}
                <div className="flex justify-center">
                  <FundraisingThermometer
                    currentAmount={totalRaisedUSD}
                    goalAmount={goalAmount}
                    currency="USD"
                  />
                </div>

                {/* Pledge Form */}
                <div className="flex justify-center">
                  <PledgeForm onSubmit={handlePledgeSubmit} />
                </div>
              </div>
            </section>

            {/* Currency Display */}
            <section className="mb-16">
              <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="bg-card p-6 rounded-lg shadow-lg border border-primary/10">
                  <h3 className="text-lg font-semibold mb-2">Total in USD</h3>
                  <p className="text-3xl font-bold text-primary">
                    ${totalRaisedUSD.toLocaleString()}
                  </p>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-lg border border-primary/10">
                  <h3 className="text-lg font-semibold mb-2">Total in KES</h3>
                  <p className="text-3xl font-bold text-primary">
                    KSh {totalRaisedKES.toLocaleString()}
                  </p>
                </div>
              </div>
            </section>

            {/* Recent Pledges */}
            <section className="max-w-4xl mx-auto">
              <RecentPledges pledges={pledges} />
            </section>
          </>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {currentPledge && (
            <PaymentOptions
              amount={currentPledge.amount}
              currency={currentPledge.currency}
              email={currentPledge.email}
              name={currentPledge.name}
              onClose={() => setShowPaymentDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
