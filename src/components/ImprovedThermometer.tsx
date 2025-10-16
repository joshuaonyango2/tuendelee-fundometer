import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Pledge {
  id: string;
  amountInUSD: number;
  amountInKES: number;
  status: 'paid' | 'unpaid';
  timestamp?: string; // Optional for compatibility
}

interface FundraisingThermometerProps {
  goalAmountUSD?: number;
  goalAmountKES?: number;
  className?: string;
}

export function FundraisingThermometer({
  goalAmountUSD = 50000,
  goalAmountKES = goalAmountUSD * 128,
  className,
}: FundraisingThermometerProps) {
  const [displayPaidUSD, setDisplayPaidUSD] = useState(0);
  const [displayPaidKES, setDisplayPaidKES] = useState(0);
  const [displayUnpaidUSD, setDisplayUnpaidUSD] = useState(0);
  const [displayUnpaidKES, setDisplayUnpaidKES] = useState(0);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial pledges
  useEffect(() => {
    const fetchPledges = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('pledges')
          .select('id, amountInUSD, amountInKES, status')
          .order('timestamp', { ascending: false });
        if (error) throw new Error(error.message);
        setPledges(data || []);
      } catch (err) {
        setError((err as Error).message || 'Failed to fetch pledges');
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPledges();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('pledges-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pledges' }, (payload) => {
        setPledges((prev) => {
          let updated = [...prev];
          if (payload.eventType === 'INSERT') updated = [payload.new as Pledge, ...updated];
          else if (payload.eventType === 'UPDATE') updated = updated.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p);
          else if (payload.eventType === 'DELETE') updated = updated.filter(p => p.id !== payload.old.id);
          return updated;
        });
      })
      .subscribe((status, err) => {
        if (err) console.error('Subscription error:', err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate totals
  const paidAmountUSD = pledges.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amountInUSD, 0);
  const paidAmountKES = pledges.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amountInKES, 0);
  const unpaidAmountUSD = pledges.filter(p => p.status === 'unpaid').reduce((sum, p) => sum + p.amountInUSD, 0);
  const unpaidAmountKES = pledges.filter(p => p.status === 'unpaid').reduce((sum, p) => sum + p.amountInKES, 0);
  const totalPledgedUSD = paidAmountUSD + unpaidAmountUSD;
  const totalPledgedKES = paidAmountKES + unpaidAmountKES;

  // Animate displays
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increments = {
      paidUSD: paidAmountUSD / steps,
      paidKES: paidAmountKES / steps,
      unpaidUSD: unpaidAmountUSD / steps,
      unpaidKES: unpaidAmountKES / steps,
    };
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setDisplayPaidUSD(prev => Math.min(prev + increments.paidUSD, paidAmountUSD));
        setDisplayPaidKES(prev => Math.min(prev + increments.paidKES, paidAmountKES));
        setDisplayUnpaidUSD(prev => Math.min(prev + increments.unpaidUSD, unpaidAmountUSD));
        setDisplayUnpaidKES(prev => Math.min(prev + increments.unpaidKES, unpaidAmountKES));
      } else {
        clearInterval(timer);
        setDisplayPaidUSD(paidAmountUSD);
        setDisplayPaidKES(paidAmountKES);
        setDisplayUnpaidUSD(unpaidAmountUSD);
        setDisplayUnpaidKES(unpaidAmountKES);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [paidAmountUSD, paidAmountKES, unpaidAmountUSD, unpaidAmountKES]);

  // Generate calibration marks
  const generateCalibrationMarks = () => {
    const maxAmountUSD = Math.max(goalAmountUSD * 1.2, totalPledgedUSD * 1.2, 1000);
    const maxAmountKES = maxAmountUSD * 128; // Assuming 128 KES per USD

    const formatLabel = (value: number, currency: string) => {
      const abbr = value >= 1000000 ? 'M' : value >= 1000 ? 'K' : '';
      const divided = value / (abbr === 'M' ? 1000000 : abbr === 'K' ? 1000 : 1);
      return currency === 'USD' ? `$${divided.toFixed(abbr ? 1 : 0)}${abbr}` : `KSh ${divided.toFixed(abbr ? 1 : 0)}${abbr}`;
    };

    const marks = [];
    let stepUSD = Math.pow(10, Math.floor(Math.log10(maxAmountUSD)) - 1) * 5;
    stepUSD = Math.max(stepUSD, 500);

    for (let valueUSD = stepUSD; valueUSD <= maxAmountUSD; valueUSD += stepUSD) {
      const valueKES = valueUSD * 128;
      marks.push({
        valueUSD,
        valueKES,
        labelUSD: formatLabel(valueUSD, 'USD'),
        labelKES: formatLabel(valueKES, 'KES'),
      });
    }

    if (!marks.find(m => m.valueUSD === goalAmountUSD)) {
      marks.push({
        valueUSD: goalAmountUSD,
        valueKES: goalAmountKES,
        labelUSD: formatLabel(goalAmountUSD, 'USD'),
        labelKES: formatLabel(goalAmountKES, 'KES'),
        isGoal: true,
      });
    }

    return marks.sort((a, b) => a.valueUSD - b.valueUSD).slice(0, 6); // Limit to 6 marks
  };

  const calibrationMarks = generateCalibrationMarks();
  const maxCalibrationUSD = Math.max(...calibrationMarks.map(m => m.valueUSD), goalAmountUSD * 1.2);

  const paidHeight = paidAmountUSD > 0 ? Math.min((paidAmountUSD / maxCalibrationUSD) * 100, 100) : 0;
  const totalHeight = totalPledgedUSD > 0 ? Math.min((totalPledgedUSD / maxCalibrationUSD) * 100, 100) : 0;

  const getMarkPosition = (valueUSD: number) => (valueUSD / maxCalibrationUSD) * 100;

  const formatAmount = (amount: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const totalPercentage = goalAmountUSD > 0 ? (totalPledgedUSD / goalAmountUSD) * 100 : 0;

  if (isLoading) return <div className="flex justify-center items-center h-96">Loading...</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;

  return (
    <div className={cn("w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 justify-center items-stretch", className)}>
      {/* Left Side: Unpaid and Paid+Unpaid Cards */}
      <div className="w-full lg:w-1/4 space-y-6">
        <Card className="h-full shadow-xl border-amber-500/20">
          <CardHeader className="bg-amber-500/10">
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <DollarSign className="w-5 h-5" /> Unpaid Pledges
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-full">
            <p className="text-3xl font-bold text-amber-600">${formatAmount(displayUnpaidUSD)}</p>
            <p className="text-lg text-muted-foreground">KSh {formatAmount(displayUnpaidKES)}</p>
          </CardContent>
        </Card>
        <Card className="h-full shadow-xl border-primary/20">
          <CardHeader className="bg-primary/10">
            <CardTitle className="flex items-center gap-2 text-primary">
              <TrendingUp className="w-5 h-5" /> Total Pledges
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-full">
            <p className="text-3xl font-bold text-primary">${formatAmount(displayPaidUSD + displayUnpaidUSD)}</p>
            <p className="text-lg text-muted-foreground">KSh {formatAmount(displayPaidKES + displayUnpaidKES)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Center: Thermometer */}
      <div className="w-full lg:w-1/2 flex justify-center items-center">
        <div className="relative w-full max-w-md h-[600px] flex items-end justify-center px-4">
          {/* Left Calibration (USD) */}
          <div className="absolute left-0 h-full flex flex-col justify-end pb-16">
            {calibrationMarks.map((mark, i) => (
              <div key={i} className="absolute flex items-center" style={{ bottom: `${getMarkPosition(mark.valueUSD)}%` }}>
                <span className="text-xs font-medium text-muted-foreground mr-2">{mark.labelUSD}</span>
                <div className={cn("h-px bg-border", mark.isGoal ? "w-4 border-dashed border-primary" : "w-2")} />
              </div>
            ))}
            {/* Paid and Total Marks */}
            {paidAmountUSD > 0 && (
              <div className="absolute flex items-center" style={{ bottom: `${paidHeight}%` }}>
                <span className="text-xs font-bold text-emerald-600 mr-2">${formatAmount(paidAmountUSD)}</span>
                <div className="h-px w-4 bg-emerald-500" />
              </div>
            )}
            {totalPledgedUSD > paidAmountUSD && (
              <div className="absolute flex items-center" style={{ bottom: `${totalHeight}%` }}>
                <span className="text-xs font-bold text-amber-600 mr-2">${formatAmount(totalPledgedUSD)}</span>
                <div className="h-px w-4 bg-amber-500" />
              </div>
            )}
          </div>

          {/* Thermometer Tube */}
          <div className="relative w-16 bg-white rounded-t-full border-4 border-gray-300 shadow-lg overflow-hidden h-[80%]">
            {/* Unpaid Fill (Amber) */}
            <div
              className="absolute bottom-0 w-full bg-amber-100 transition-height duration-1000 rounded-b-full"
              style={{ height: `${Math.max(0, totalHeight - paidHeight)}%` }}
            />
            {/* Paid Fill (Emerald) */}
            <div
              className="absolute bottom-0 w-full bg-emerald-500 transition-height duration-1000 rounded-b-full"
              style={{ height: `${paidHeight}%` }}
            />
            {/* Goal Line */}
            <div
              className="absolute w-full border-t-2 border-dashed border-primary"
              style={{ bottom: `${(goalAmountUSD / maxCalibrationUSD) * 100}%` }}
            />
          </div>

          {/* Bulb */}
          <div className="w-32 h-32 rounded-full bg-emerald-500 shadow-2xl mt-4 flex items-center justify-center">
            <span className="text-white text-xl font-bold">{totalPercentage.toFixed(1)}%</span>
          </div>

          {/* Right Calibration (KES) */}
          <div className="absolute right-0 h-full flex flex-col justify-end pb-16">
            {calibrationMarks.map((mark, i) => (
              <div key={i} className="absolute flex items-center" style={{ bottom: `${getMarkPosition(mark.valueUSD)}%` }}>
                <div className={cn("h-px bg-border", mark.isGoal ? "w-4 border-dashed border-primary" : "w-2")} />
                <span className="text-xs font-medium text-muted-foreground ml-2">{mark.labelKES}</span>
              </div>
            ))}
            {/* Paid and Total Marks in KES */}
            {paidAmountKES > 0 && (
              <div className="absolute flex items-center" style={{ bottom: `${paidHeight}%` }}>
                <div className="h-px w-4 bg-emerald-500" />
                <span className="text-xs font-bold text-emerald-600 ml-2">KSh {formatAmount(paidAmountKES)}</span>
              </div>
            )}
            {totalPledgedKES > paidAmountKES && (
              <div className="absolute flex items-center" style={{ bottom: `${totalHeight}%` }}>
                <div className="h-px w-4 bg-amber-500" />
                <span className="text-xs font-bold text-amber-600 ml-2">KSh {formatAmount(totalPledgedKES)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side: Paid and Total Target Cards */}
      <div className="w-full lg:w-1/4 space-y-6">
        <Card className="h-full shadow-xl border-emerald-500/20">
          <CardHeader className="bg-emerald-500/10">
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <DollarSign className="w-5 h-5" /> Paid Pledges
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-full">
            <p className="text-3xl font-bold text-emerald-600">${formatAmount(displayPaidUSD)}</p>
            <p className="text-lg text-muted-foreground">KSh {formatAmount(displayPaidKES)}</p>
          </CardContent>
        </Card>
        <Card className="h-full shadow-xl border-primary/20">
          <CardHeader className="bg-primary/10">
            <CardTitle className="flex items-center gap-2 text-primary">
              <TrendingUp className="w-5 h-5" /> Total Target
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-full">
            <p className="text-3xl font-bold text-primary">${formatAmount(goalAmountUSD)}</p>
            <p className="text-lg text-muted-foreground">KSh {formatAmount(goalAmountKES)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
