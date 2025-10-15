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
    <div className={cn("relative max-w-7xl mx-auto px-4", className)}>
      {/* Header */}
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-bold text-primary mb-2">
          Tuendelee Foundation Fundraising Thermometer (Fundometer)
        </h3>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Live updates enabled - Showing paid and unpaid pledges
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-24">
        {/* Paid Pledges Card - Left */}
        <div className="flex-shrink-0 w-full max-w-[190px] lg:mt-32">
          <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-3 border-2 border-success/30 shadow-lg">
            <h4 className="text-sm font-bold text-success mb-2 flex items-center gap-1.5">
              <div className="w-2 h-2 bg-success rounded-full" />
              Paid Pledges
            </h4>
            <div className="space-y-1.5">
              <div>
                <p className="text-xs text-muted-foreground">USD</p>
                <p className="text-xl font-bold text-success">${formatAmount(displayPaidUSD)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">KSh</p>
                <p className="text-lg font-bold text-success">KSh {formatAmount(displayPaidKES)}</p>
              </div>
              <div className="pt-1 border-t border-success/20">
                <p className="text-xs text-muted-foreground">Of Goal</p>
                <p className="text-lg font-bold text-success">{paidPercentage.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Thermometer - Center */}
        <div className="relative flex-shrink-0">
          <div className="relative w-24 h-[600px]">
            {/* Calibration marks - USD on left, KES on right */}
            <div className="absolute -left-28 top-0 h-full w-32">
              {calibrationMarks.map((mark, index) => {
                const position = getMarkPosition(mark.valueUSD);
                if (position > 100) return null;
                const isGoal = mark.isGoal || mark.valueUSD === goalAmountUSD;
                return (
                  <div
                    key={`usd-${mark.valueUSD}-${index}`}
                    className="absolute flex items-center justify-end"
                    style={{ bottom: `${position}%`, left: 0, right: 0 }}
                  >
                    <span className={cn(
                      "text-sm font-semibold mr-3",
                      isGoal ? "text-primary" : "text-muted-foreground"
                    )}>
                      {mark.labelUSD}
                    </span>
                    <div className={cn(
                      "w-6 h-0.5 rounded",
                      isGoal ? "bg-primary" : "bg-border"
                    )} />
                  </div>
                );
              })}
            </div>

            {/* KES marks on the right */}
            <div className="absolute -right-28 top-0 h-full w-32">
              {calibrationMarks.map((mark, index) => {
                const position = getMarkPosition(mark.valueUSD);
                if (position > 100) return null;
                const isGoal = mark.isGoal || mark.valueUSD === goalAmountUSD;
                return (
                  <div
                    key={`kes-${mark.valueUSD}-${index}`}
                    className="absolute flex items-center"
                    style={{ bottom: `${position}%`, left: 0, right: 0 }}
                  >
                    <div className={cn(
                      "w-6 h-0.5 rounded",
                      isGoal ? "bg-success" : "bg-border"
                    )} />
                    <span className={cn(
                      "text-sm font-semibold ml-3",
                      isGoal ? "text-success" : "text-muted-foreground"
                    )}>
                      {mark.labelKES}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Thermometer tube */}
            <div className="absolute inset-0 bg-gradient-to-t from-muted/30 to-muted/10 rounded-full overflow-hidden shadow-lg border-4 border-border">
              {/* Total pledged (unpaid) - lighter background */}
              <div 
                className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
                style={{ height: `${totalHeight}%` }}
              >
                <div className="h-full bg-gradient-to-t from-amber-400/40 via-amber-300/30 to-amber-200/20 rounded-full shadow-inner" />
              </div>

              {/* Paid pledges - solid green on top */}
              <div 
                className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
                style={{ height: `${paidHeight}%` }}
              >
                <div className="h-full bg-gradient-to-t from-success/90 via-success/70 to-success/60 rounded-full shadow-inner" />
              </div>
              
              {/* Glass effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-full pointer-events-none" />
            </div>

            {/* Paid meniscus calibration mark */}
            {paidHeight > 0 && (
              <div 
                className="absolute -left-28 w-32 flex items-center justify-end transition-all duration-1000 ease-out translate-y-4"
                style={{ bottom: `${paidHeight}%` }}
              >
                <div className="text-right mr-3">
                  <div className="text-sm font-bold text-success">${formatAmount(displayPaidUSD)}</div>
                  <div className="text-xs text-success/70">KSh {formatAmount(displayPaidKES)}</div>
                </div>
                <div className="w-8 h-0.5 bg-success shadow-lg" />
              </div>
            )}

            {/* Unpaid meniscus calibration mark */}
            {unpaidAmountUSD > 0 && totalHeight > 0 && (
              <div 
                className="absolute -right-28 w-32 flex items-center transition-all duration-1000 ease-out translate-y-4"
                style={{ bottom: `${totalHeight}%` }}
              >
                <div className="w-8 h-0.5 bg-amber-500 shadow-lg" />
                <div className="text-left ml-3">
                  <div className="text-sm font-bold text-amber-600">${formatAmount(displayUnpaidUSD)}</div>
                  <div className="text-xs text-amber-600/70">KSh {formatAmount(displayUnpaidKES)}</div>
                </div>
              </div>
            )}

            {/* Bulb at bottom */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-gradient-to-br from-success to-success/80 rounded-full shadow-xl border-4 border-border">
              <div className="absolute inset-3 bg-gradient-to-br from-white/20 to-transparent rounded-full" />
            </div>
          </div>
        </div>

        {/* Unpaid Pledges Card - Right */}
        <div className="flex-shrink-0 w-full max-w-[190px] lg:mt-32">
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-lg p-3 border-2 border-amber-500/30 shadow-lg">
            <h4 className="text-sm font-bold text-amber-600 mb-2 flex items-center gap-1.5">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              Unpaid Pledges
            </h4>
            <div className="space-y-1.5">
              <div>
                <p className="text-xs text-muted-foreground">USD</p>
                <p className="text-xl font-bold text-amber-600">${formatAmount(displayUnpaidUSD)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">KSh</p>
                <p className="text-lg font-bold text-amber-600">KSh {formatAmount(displayUnpaidKES)}</p>
              </div>
              <div className="pt-1 border-t border-amber-500/20">
                <p className="text-xs text-muted-foreground">Of Goal</p>
                <p className="text-lg font-bold text-amber-600">{unpaidPercentage.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats display - below thermometer */}
      <div className="w-full max-w-4xl mx-auto space-y-6 mt-12">
        {/* Total Pledged */}
        <div className="bg-gradient-to-r from-primary/10 via-success/10 to-primary/10 rounded-xl p-4 sm:p-6 border-2 border-primary/30 shadow-lg">
          <h4 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Total Pledged (Paid + Unpaid)</h4>
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">USD</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary break-all">${formatAmount(displayPaidUSD + displayUnpaidUSD)}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">KSh</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-success break-all">KSh {formatAmount(displayPaidKES + displayUnpaidKES)}</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-primary/20">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm sm:text-base font-semibold text-foreground">Progress to Goal</span>
              <span className="text-2xl sm:text-3xl font-bold text-primary">
                {totalPledgedPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Goal */}
        <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl p-4 sm:p-6 border-2 border-dashed border-primary/40 shadow-md">
          <h4 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Target Goal</h4>
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">KSh</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-success/80 break-all">KSh {formatAmount(goalKES)}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">USD</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary/80 break-all">${formatAmount(goalAmountUSD)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}