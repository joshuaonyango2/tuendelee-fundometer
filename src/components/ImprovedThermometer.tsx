import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, DollarSign } from 'lucide-react';

interface ImprovedThermometerProps {
  paidAmountUSD: number;
  paidAmountKES: number;
  unpaidAmountUSD: number;
  unpaidAmountKES: number;
  goalAmountUSD?: number;
  className?: string;
}

export function ImprovedThermometer({ 
  paidAmountUSD,
  paidAmountKES,
  unpaidAmountUSD,
  unpaidAmountKES,
  goalAmountUSD = 50000,
  className 
}: ImprovedThermometerProps) {
  const [displayPaidUSD, setDisplayPaidUSD] = useState(0);
  const [displayPaidKES, setDisplayPaidKES] = useState(0);
  const [displayUnpaidUSD, setDisplayUnpaidUSD] = useState(0);
  const [displayUnpaidKES, setDisplayUnpaidKES] = useState(0);

  const totalPledgedUSD = paidAmountUSD + unpaidAmountUSD;
  const totalPledgedKES = paidAmountKES + unpaidAmountKES;

  useEffect(() => {
    // Animate the numbers
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

  // Generate dynamic calibration marks based on goal and current amount
  const generateCalibrationMarks = () => {
    const maxAmount = Math.max(goalAmountUSD * 1.2, totalPledgedUSD * 1.2, 1000);
    
    const formatLabelUSD = (value: number) => {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
      return `$${value}`;
    };
    
    const formatLabelKES = (value: number) => {
      if (value >= 1000000) return `KSh ${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `KSh ${(value / 1000).toFixed(0)}K`;
      return `KSh ${value}`;
    };
    
    // Generate fewer marks for cleaner look - maximum 6 marks
    const marks = [];
    let step = 100;
    
    if (maxAmount > 1000000) step = 250000;
    else if (maxAmount > 500000) step = 100000;
    else if (maxAmount > 100000) step = 50000;
    else if (maxAmount > 50000) step = 25000;
    else if (maxAmount > 10000) step = 5000;
    else if (maxAmount > 5000) step = 2500;
    else if (maxAmount > 1000) step = 500;
    
    // Limit to maximum 6 calibration marks
    let count = 0;
    for (let value = step; value <= maxAmount && count < 6; value += step) {
      const kesValue = value * 128;
      marks.push({ 
        valueUSD: value, 
        valueKES: kesValue,
        labelUSD: formatLabelUSD(value),
        labelKES: formatLabelKES(kesValue)
      });
      count++;
    }
    
    // Always add the goal as a special mark
    if (!marks.find(m => m.valueUSD === goalAmountUSD)) {
      marks.push({ 
        valueUSD: goalAmountUSD, 
        valueKES: goalAmountUSD * 128,
        labelUSD: formatLabelUSD(goalAmountUSD),
        labelKES: formatLabelKES(goalAmountUSD * 128),
        isGoal: true
      });
    }
    
    return marks.sort((a, b) => a.valueUSD - b.valueUSD);
  };

  const calibrationMarks = generateCalibrationMarks();
  const maxCalibration = Math.max(...calibrationMarks.map(m => m.valueUSD), goalAmountUSD * 1.2);

  // Calculate thermometer heights
  const getPaidHeight = () => {
    if (paidAmountUSD === 0) return 0;
    return Math.min((paidAmountUSD / maxCalibration) * 100, 100);
  };

  const getTotalHeight = () => {
    if (totalPledgedUSD === 0) return 0;
    return Math.min((totalPledgedUSD / maxCalibration) * 100, 100);
  };

  const paidHeight = getPaidHeight();
  const totalHeight = getTotalHeight();

  const getMarkPosition = (valueUSD: number) => {
    return (valueUSD / maxCalibration) * 100;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const goalKES = goalAmountUSD * 128;

  const paidPercentage = goalAmountUSD > 0 ? (paidAmountUSD / goalAmountUSD) * 100 : 0;
  const totalPledgedPercentage = goalAmountUSD > 0 ? (totalPledgedUSD / goalAmountUSD) * 100 : 0;
  const unpaidPercentage = goalAmountUSD > 0 ? (unpaidAmountUSD / goalAmountUSD) * 100 : 0;

  return (
    <div className={cn("flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center", className)}>
      {/* Left side cards */}
      <div className="flex flex-col gap-4 w-full lg:w-64">
        {/* Paid Card */}
        <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-xl p-6 border border-success/30 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold text-success uppercase tracking-wide">Paid Pledges</h3>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-3xl font-bold text-success">${formatAmount(displayPaidUSD)}</p>
              <p className="text-sm text-muted-foreground">KSh {formatAmount(displayPaidKES)}</p>
            </div>
            <div className="pt-2 border-t border-success/20">
              <p className="text-xs text-success/70">
                {paidPercentage.toFixed(1)}% of goal achieved
              </p>
            </div>
          </div>
        </div>

        {/* Unpaid Card */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl p-6 border border-amber-500/30 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Unpaid Pledges</h3>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-3xl font-bold text-amber-600">${formatAmount(displayUnpaidUSD)}</p>
              <p className="text-sm text-muted-foreground">KSh {formatAmount(displayUnpaidKES)}</p>
            </div>
            <div className="pt-2 border-t border-amber-500/20">
              <p className="text-xs text-amber-600/70">
                {unpaidPercentage.toFixed(1)}% of goal pending
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Thermometer */}
      <div className="flex-1 flex items-center justify-center min-h-[600px] w-full max-w-2xl">
        <div className="relative h-full w-full flex items-end justify-center px-12">
          {/* Calibration marks on the left */}
          <div className="absolute left-0 h-full flex flex-col justify-between py-4">
            {calibrationMarks.map((mark, index) => (
              <div 
                key={index} 
                className="absolute flex items-center gap-2"
                style={{ bottom: `${getMarkPosition(mark.valueUSD)}%` }}
              >
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {mark.labelUSD}
                </span>
                <div className={cn(
                  "h-px bg-border",
                  mark.isGoal ? "w-3" : "w-2"
                )} />
              </div>
            ))}
          </div>

          {/* Thermometer bulb and tube */}
          <div className="relative flex flex-col items-center h-full pb-2">
            {/* Thermometer tube container */}
            <div className="relative w-24 flex-1 bg-muted/30 rounded-full border-4 border-border shadow-inner overflow-hidden">
              {/* Goal line */}
              <div 
                className="absolute w-full border-t-2 border-dashed border-primary/60 z-10"
                style={{ bottom: `${getMarkPosition(goalAmountUSD)}%` }}
              >
                <span className="absolute -right-16 -top-3 text-xs font-semibold text-primary whitespace-nowrap">
                  Goal
                </span>
              </div>

              {/* Total pledged fill (background layer - lighter) */}
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-primary/30 to-primary/20 transition-all duration-1000 ease-out rounded-b-full"
                style={{ height: `${totalHeight}%` }}
              />

              {/* Paid amount fill (foreground layer - solid) */}
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-success via-success/90 to-success/70 transition-all duration-1000 ease-out rounded-b-full shadow-lg"
                style={{ height: `${paidHeight}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
              </div>
            </div>

            {/* Thermometer bulb */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-success via-success to-success/80 shadow-xl border-4 border-border mt-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <TrendingUp className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>

          {/* Calibration marks on the right (KES) */}
          <div className="absolute right-0 h-full flex flex-col justify-between py-4">
            {calibrationMarks.map((mark, index) => (
              <div 
                key={index} 
                className="absolute flex items-center gap-2"
                style={{ bottom: `${getMarkPosition(mark.valueUSD)}%` }}
              >
                <div className={cn(
                  "h-px bg-border",
                  mark.isGoal ? "w-3" : "w-2"
                )} />
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {mark.labelKES}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side cards */}
      <div className="flex flex-col gap-4 w-full lg:w-64">
        {/* Total Pledged Card */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/30 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Total Pledged</h3>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-3xl font-bold text-primary">${formatAmount(displayPaidUSD + displayUnpaidUSD)}</p>
              <p className="text-sm text-muted-foreground">KSh {formatAmount(displayPaidKES + displayUnpaidKES)}</p>
            </div>
            <div className="pt-2 border-t border-primary/20">
              <p className="text-xs text-primary/70">
                {totalPledgedPercentage.toFixed(1)}% of goal
              </p>
            </div>
          </div>
        </div>

        {/* Goal Card */}
        <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl p-6 border-2 border-dashed border-primary/40 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-foreground" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Campaign Goal</h3>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-3xl font-bold text-foreground">${formatAmount(goalAmountUSD)}</p>
              <p className="text-sm text-muted-foreground">KSh {formatAmount(goalKES)}</p>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground font-medium">Live Updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}