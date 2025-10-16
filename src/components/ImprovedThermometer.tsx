import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

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

  const totalPledgedPercentage = goalAmountUSD > 0 ? (totalPledgedUSD / goalAmountUSD) * 100 : 0;

  return (
    <div className={cn("flex flex-col items-center justify-center w-full", className)}>
      {/* Title showing unpaid pledges - visible only on mobile */}
      <div className="lg:hidden w-full text-center mb-4">
        <p className="text-muted-foreground">unpaid pledges</p>
      </div>

      {/* Top card - visible only on mobile */}
      <div className="lg:hidden w-full max-w-md mb-6">
        <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-xl p-6 border border-success/30 shadow-lg">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">KSh</p>
            <p className="text-4xl font-bold text-success">KSh {formatAmount(displayPaidKES + displayUnpaidKES)}</p>
            <div className="pt-3">
              <p className="text-sm text-muted-foreground">Of Goal</p>
              <p className="text-5xl font-bold text-success">{totalPledgedPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Thermometer */}
      <div className="flex items-center justify-center min-h-[500px] lg:min-h-[700px] w-full max-w-3xl">
        <div className="relative h-full w-full flex items-end justify-center px-16 lg:px-24">
          {/* Calibration marks on the left (USD) */}
          <div className="absolute left-0 h-full flex flex-col justify-between py-8">
            {/* Paid amount mark */}
            {paidAmountUSD > 0 && (
              <div 
                className="absolute flex items-center gap-2"
                style={{ bottom: `${paidHeight}%` }}
              >
                <span className="text-sm font-bold text-success whitespace-nowrap">
                  ${formatAmount(paidAmountUSD)}
                </span>
                <div className="h-0.5 w-4 bg-success" />
              </div>
            )}
            
            {/* Total pledged mark */}
            {totalPledgedUSD > paidAmountUSD && (
              <div 
                className="absolute flex items-center gap-2"
                style={{ bottom: `${totalHeight}%` }}
              >
                <span className="text-sm font-bold text-amber-600 whitespace-nowrap">
                  ${formatAmount(totalPledgedUSD)}
                </span>
                <div className="h-0.5 w-4 bg-amber-500" />
              </div>
            )}

            {/* Additional calibration marks */}
            {calibrationMarks.slice(0, 4).map((mark, index) => (
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
            <div className="relative w-24 lg:w-28 flex-1 bg-muted/20 rounded-full border-4 border-border shadow-inner overflow-hidden">
              {/* Goal line */}
              <div 
                className="absolute w-full border-t-2 border-dashed border-primary/60 z-10"
                style={{ bottom: `${getMarkPosition(goalAmountUSD)}%` }}
              />

              {/* Unpaid pledges fill (background layer - cream/yellow) */}
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-amber-100 via-amber-50 to-amber-100/50 transition-all duration-1000 ease-out rounded-b-full"
                style={{ height: `${totalHeight}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent" />
              </div>

              {/* Paid pledges fill (foreground layer - solid green) */}
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 via-emerald-400 to-emerald-500/80 transition-all duration-1000 ease-out rounded-b-full shadow-lg z-[5]"
                style={{ height: `${paidHeight}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
              </div>
            </div>

            {/* Thermometer bulb */}
            <div className="w-32 h-32 lg:w-36 lg:h-36 rounded-full bg-gradient-to-br from-emerald-500 via-emerald-400 to-emerald-500/80 shadow-2xl border-4 border-border mt-2 relative overflow-hidden z-[5]">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <TrendingUp className="w-12 h-12 lg:w-14 lg:h-14 text-white" />
              </div>
            </div>
          </div>

          {/* Calibration marks on the right (KES) */}
          <div className="absolute right-0 h-full flex flex-col justify-between py-8">
            {/* Paid amount mark in KES */}
            {paidAmountKES > 0 && (
              <div 
                className="absolute flex items-center gap-2"
                style={{ bottom: `${paidHeight}%` }}
              >
                <div className="h-0.5 w-4 bg-success" />
                <span className="text-sm font-bold text-success whitespace-nowrap">
                  KES {formatAmount(paidAmountKES)}
                </span>
              </div>
            )}
            
            {/* Total pledged mark in KES */}
            {totalPledgedKES > paidAmountKES && (
              <div 
                className="absolute flex items-center gap-2"
                style={{ bottom: `${totalHeight}%` }}
              >
                <div className="h-0.5 w-4 bg-amber-500" />
                <span className="text-sm font-bold text-amber-600 whitespace-nowrap">
                  KES {formatAmount(totalPledgedKES)}
                </span>
              </div>
            )}

            {/* Additional calibration marks */}
            {calibrationMarks.slice(0, 4).map((mark, index) => (
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

      {/* Bottom card - visible only on mobile */}
      <div className="lg:hidden w-full max-w-md mt-6">
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl p-6 border border-amber-500/30 shadow-lg">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
              <h3 className="text-base font-semibold text-amber-600">Unpaid Pledges</h3>
            </div>
            <p className="text-4xl font-bold text-amber-600">${formatAmount(displayUnpaidUSD)}</p>
            <p className="text-lg text-muted-foreground">KSh {formatAmount(displayUnpaidKES)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
