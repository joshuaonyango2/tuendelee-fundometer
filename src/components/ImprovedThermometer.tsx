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
  // Other fields as needed
}

interface FundraisingThermometerProps {
  goalAmountUSD?: number;
  goalAmountKES?: number;
  className?: string;
}

export function FundraisingThermometer({
  goalAmountUSD = 50000,
  goalAmountKES = goalAmountUSD * 128, // Assuming exchange rate of 128 KES per USD
  className,
}: FundraisingThermometerProps) {
  const [displayPaidUSD, setDisplayPaidUSD] = useState(0);
  const [displayPaidKES, setDisplayPaidKES] = useState(0);
  const [displayUnpaidUSD, setDisplayUnpaidUSD] = useState(0);
  const [displayUnpaidKES, setDisplayUnpaidKES] = useState(0);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial pledges
  useEffect(() => {
    const fetchPledges = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('pledges')
        .select('id, amountInUSD, amountInKES, status')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching pledges:', error);
        return;
      }

      setPledges(data || []);
      setIsLoading(false);
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
          if (payload.eventType === 'INSERT') {
            updated = [payload.new as Pledge, ...updated];
          } else if (payload.eventType === 'UPDATE') {
            updated = updated.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p);
          } else if (payload.eventType === 'DELETE') {
            updated = updated.filter(p => p.id !== payload.old.id);
          }
          return updated;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate totals from pledges
  const paidAmountUSD = pledges.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amountInUSD, 0);
  const paidAmountKES = pledges.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amountInKES, 0);
  const unpaidAmountUSD = pledges.filter(p => p.status === 'unpaid').reduce((sum, p) => sum + p.amountInUSD, 0);
  const unpaidAmountKES = pledges.filter(p => p.status === 'unpaid').reduce((sum, p) => sum + p.amountInKES, 0);
  const totalPledgedUSD = paidAmountUSD + unpaidAmountUSD;
  const totalPledgedKES = paidAmountKES + unpaidAmountKES;

  // Animate displays when totals change
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const incrementPaidUSD = paidAmountUSD / steps;
    const incrementPaidKES = paidAmountKES / steps;
    const incrementUnpaidUSD = unpaidAmountUSD / steps;
    const incrementUnpaidKES = unpaidAmountKES / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setDisplayPaidUSD(prev => Math.min(prev + incrementPaidUSD, paidAmountUSD));
        setDisplayPaidKES(prev => Math.min(prev + incrementPaidKES, paidAmountKES));
        setDisplayUnpaidUSD(prev => Math.min(prev + incrementUnpaidUSD, unpaidAmountUSD));
        setDisplayUnpaidKES(prev => Math.min(prev + incrementUnpaidKES, unpaidAmountKES));
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

  // Generate dynamic calibration marks
  const generateCalibrationMarks = () => {
    const maxAmountUSD = Math.max(goalAmountUSD * 1.2, totalPledgedUSD * 1.2, 1000);
    const maxAmountKES = Math.max(goalAmountKES * 1.2, totalPledgedKES * 1.2, 128000); // Assuming exchange rate

    const formatLabel = (value: number, currency: string) => {
      const abbr = value >= 1000000 ? 'M' : value >= 1000 ? 'K' : '';
      const divided = value / (abbr === 'M' ? 1000000 : abbr === 'K' ? 1000 : 1);
      const formatted = divided.toFixed(abbr && divided < 10 ? 1 : 0);
      return currency === 'USD' ? `$${formatted}${abbr}` : `KSh ${formatted}${abbr}`;
    };

    const marks = [];
    let stepUSD = Math.pow(10, Math.floor(Math.log10(maxAmountUSD)) - 1);
    stepUSD = Math.max(stepUSD, 100); // Minimum step

    let count = 0;
    for (let valueUSD = stepUSD; valueUSD <= maxAmountUSD && count < 5; valueUSD += stepUSD) {
      const valueKES = valueUSD * (goalAmountKES / goalAmountUSD); // Proportional
      marks.push({ 
        valueUSD, 
        valueKES,
        labelUSD: formatLabel(valueUSD, 'USD'),
        labelKES: formatLabel(valueKES, 'KES')
      });
      count++;
    }

    // Add goal if not included
    if (!marks.find(m => m.valueUSD === goalAmountUSD)) {
      marks.push({ 
        valueUSD: goalAmountUSD, 
        valueKES: goalAmountKES,
        labelUSD: formatLabel(goalAmountUSD, 'USD'),
        labelKES: formatLabel(goalAmountKES, 'KES'),
        isGoal: true
      });
    }

    return marks.sort((a, b) => a.valueUSD - b.valueUSD);
  };

  const calibrationMarks = generateCalibrationMarks();
  const maxCalibrationUSD = Math.max(...calibrationMarks.map(m => m.valueUSD), goalAmountUSD * 1.2);

  const paidHeight = paidAmountUSD > 0 ? Math.min((paidAmountUSD / maxCalibrationUSD) * 100, 100) : 0;
  const totalHeight = totalPledgedUSD > 0 ? Math.min((totalPledgedUSD / maxCalibrationUSD) * 100, 100) : 0;

  const getMarkPosition = (valueUSD: number) => (valueUSD / maxCalibrationUSD) * 100;

  const formatAmount = (amount: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const totalPercentage = goalAmountUSD > 0 ? (totalPledgedUSD / goalAmountUSD) * 100 : 0;

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Loading pledges...</div>;
  }

  return (
    <div className={cn("w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 justify-center items-stretch", className)}>
      {/* Left Side: Unpaid and Paid+Unpaid Cards */}
      <div className="w-full lg:w-1/4 space-y-6">
        <Card className="h-full flex flex-col shadow-xl border-amber-500/20">
          <CardHeader className="bg-amber-500/10">
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <DollarSign className="w-5 h-5" /> Unpaid Pledges
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <p className="text-3xl font-bold text-amber-600">${formatAmount(displayUnpaidUSD)}</p>
            <p className="text-lg text-muted-foreground">KSh {formatAmount(displayUnpaidKES)}</p>
          </CardContent>
        </Card>
        <Card className="h-full flex flex-col shadow-xl border-primary/20">
          <CardHeader className="bg-primary/10">
            <CardTitle className="flex items-center gap-2 text-primary">
              <TrendingUp className="w-5 h-5" /> Paid + Unpaid
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <p className="text-3xl font-bold text-primary">${formatAmount(displayPaidUSD + displayUnpaidUSD)}</p>
            <p className="text-lg text-muted-foreground">KSh {formatAmount(displayPaidKES + displayUnpaidKES)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Center: Thermometer */}
      <div className="w-full lg:w-1/2 flex justify-center items-center">
        <div className="relative w-full max-w-md h-[600px] flex items-end justify-center">
          {/* Left Calibration (USD) */}
          <div className="absolute left-0 h-full flex flex-col justify-end pb-16">
            {calibrationMarks.map((mark, i) => (
              <div key={i} className="absolute flex items-center" style={{ bottom: `${getMarkPosition(mark.valueUSD)}%` }}>
                <span className="text-xs font-medium text-muted-foreground mr-2">{mark.labelUSD}</span>
                <div className={cn("h-px bg-border", mark.isGoal ? "w-4 border-dashed" : "w-2")} />
              </div>
            ))}
          </div>

          {/* Thermometer Tube */}
          <div className="relative w-16 bg-white rounded-t-full border-4 border-border shadow-2xl overflow-hidden h-[80%]">
            {/* Unpaid Fill (Yellow) */}
            <div className="absolute bottom-0 w-full bg-amber-100/80 transition-height duration-1000" style={{ height: `${totalHeight}%` }} />
            {/* Paid Fill (Green) */}
            <div className="absolute bottom-0 w-full bg-emerald-500 transition-height duration-1000" style={{ height: `${paidHeight}%` }} />
            {/* Goal Line */}
            <div className="absolute w-full border-t-2 border-primary border-dashed" style={{ bottom: `${(goalAmountUSD / maxCalibrationUSD) * 100}%` }} />
          </div>

          {/* Bulb */}
          <div className="w-32 h-32 rounded-full bg-emerald-500 shadow-2xl mt-4" />

          {/* Right Calibration (KES) */}
          <div className="absolute right-0 h-full flex flex-col justify-end pb-16">
            {calibrationMarks.map((mark, i) => (
              <div key={i} className="absolute flex items-center" style={{ bottom: `${getMarkPosition(mark.valueUSD)}%` }}>
                <div className={cn("h-px bg-border", mark.isGoal ? "w-4 border-dashed" : "w-2")} />
                <span className="text-xs font-medium text-muted-foreground ml-2">{mark.labelKES}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Paid and Total Target Cards */}
      <div className="w-full lg:w-1/4 space-y-6">
        <Card className="h-full flex flex-col shadow-xl border-emerald-500/20">
          <CardHeader className="bg-emerald-500/10">
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <DollarSign className="w-5 h-5" /> Paid Pledges
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <p className="text-3xl font-bold text-emerald-600">${formatAmount(displayPaidUSD)}</p>
            <p className="text-lg text-muted-foreground">KSh {formatAmount(displayPaidKES)}</p>
          </CardContent>
        </Card>
        <Card className="h-full flex flex-col shadow-xl border-primary/20">
          <CardHeader className="bg-primary/10">
            <CardTitle className="flex items-center gap-2 text-primary">
              <TrendingUp className="w-5 h-5" /> Total Target
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <p className="text-3xl font-bold text-primary">${formatAmount(goalAmountUSD)}</p>
            <p className="text-lg text-muted-foreground">KSh {formatAmount(goalAmountKES)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
