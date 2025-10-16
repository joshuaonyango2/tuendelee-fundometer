import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, Target, CheckCircle, Clock } from 'lucide-react';

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

  // Generate dynamic calibration marks
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
    
    // Generate marks - maximum 6 marks
    const marks = [];
    let step = 100;
    
    if (maxAmount > 1000000) step = 250000;
    else if (maxAmount > 500000) step = 100000;
    else if (maxAmount > 100000) step = 50000;
    else if (maxAmount > 50000) step = 25000;
    else if (maxAmount > 10000) step = 5000;
    else if (maxAmount > 5000) step = 2500;
    else if (maxAmount > 1000) step = 500;
    
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
        labelUSD: `GOAL: ${formatLabelUSD(goalAmountUSD)}`,
        labelKES: `GOAL: ${formatLabelKES(goalAmountUSD * 128)}`,
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

  const getUnpaidHeight = () => {
    if (unpaidAmountUSD === 0) return 0;
    return Math.min((unpaidAmountUSD / maxCalibration) * 100, 100);
  };

  const getTotalHeight = () => {
    if (totalPledgedUSD === 0) return 0;
    return Math.min((totalPledgedUSD / maxCalibration) * 100, 100);
  };

  const paidHeight = getPaidHeight();
  const unpaidHeight = getUnpaidHeight();
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
  const paidPercentage = goalAmountUSD > 0 ? (paidAmountUSD / goalAmountUSD) * 100 : 0;

  return (
    <div className={cn("flex flex-col items-center justify-center w-full max-w-6xl mx-auto", className)}>
      
      {/* Summary Cards - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8">
        {/* Total Pledged Card */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl p-6 border border-blue-500/30 shadow-lg">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Target className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-semibold text-blue-600">Total Pledged</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">${formatAmount(totalPledgedUSD)}</p>
            <p className="text-lg text-muted-foreground">KSh {formatAmount(totalPledgedKES)}</p>
            <div className="pt-3">
              <p className="text-sm text-muted-foreground">Of Goal</p>
              <p className="text-2xl font-bold text-blue-600">{totalPledgedPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Paid Pledges Card */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl p-6 border border-emerald-500/30 shadow-lg">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-semibold text-emerald-600">Paid Pledges</h3>
            </div>
            <p className="text-3xl font-bold text-emerald-600">${formatAmount(displayPaidUSD)}</p>
            <p className="text-lg text-muted-foreground">KSh {formatAmount(displayPaidKES)}</p>
            <div className="pt-3">
              <p className="text-sm text-muted-foreground">Of Goal</p>
              <p className="text-2xl font-bold text-emerald-600">{paidPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Unpaid Pledges Card */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl p-6 border border-amber-500/30 shadow-lg">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-semibold text-amber-600">Unpaid Pledges</h3>
            </div>
            <p className="text-3xl font-bold text-amber-600">${formatAmount(displayUnpaidUSD)}</p>
            <p className="text-lg text-muted-foreground">KSh {formatAmount(displayUnpaidKES)}</p>
            <div className="pt-3">
              <p className="text-sm text-muted-foreground">Of Total</p>
              <p className="text-2xl font-bold text-amber-600">
                {totalPledgedUSD > 0 ? ((unpaidAmountUSD / totalPledgedUSD) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Thermometer */}
      <div className="flex items-center justify-center min-h-[500px] lg:min-h-[600px] w-full">
        <div className="relative h-full w-full flex items-end justify-center px-16 lg:px-24">
          
          {/* Left Side - USD Labels */}
          <div className="absolute left-0 h-full flex flex-col justify-between py-8">
            {/* Paid amount mark */}
            {paidAmountUSD > 0 && (
              <div 
                className="absolute flex items-center gap-2"
                style={{ bottom: `${paidHeight}%` }}
              >
                <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                  Paid: ${formatAmount(paidAmountUSD)}
                </span>
                <div className="h-0.5 w-4 bg-emerald-500" />
              </div>
            )}
            
            {/* Total pledged mark */}
            {totalPledgedUSD > paidAmountUSD && (
              <div 
                className="absolute flex items-center gap-2"
                style={{ bottom: `${totalHeight}%` }}
              >
                <span className="text-sm font-bold text-blue-600 whitespace-nowrap">
                  Total: ${formatAmount(totalPledgedUSD)}
                </span>
                <div className="h-0.5 w-4 bg-blue-500" />
              </div>
            )}

            {/* Calibration marks */}
            {calibrationMarks.map((mark, index) => (
              <div 
                key={index} 
                className="absolute flex items-center gap-2"
                style={{ bottom: `${getMarkPosition(mark.valueUSD)}%` }}
              >
                <span className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  mark.isGoal ? "text-primary font-bold" : "text-muted-foreground"
                )}>
                  {mark.labelUSD}
                </span>
                <div className={cn(
                  "h-px",
                  mark.isGoal ? "w-4 bg-primary" : "w-2 bg-border"
                )} />
              </div>
            ))}
          </div>

          {/* Thermometer Tube */}
          <div className="relative flex flex-col items-center h-full pb-2">
            {/* Thermometer tube container */}
            <div className="relative w-24 lg:w-28 flex-1 bg-muted/20 rounded-full border-4 border-border shadow-inner overflow-hidden">
              
              {/* Goal line */}
              <div 
                className="absolute w-full border-t-2 border-dashed border-primary/60 z-20"
                style={{ bottom: `${getMarkPosition(goalAmountUSD)}%` }}
              />

              {/* Unpaid pledges fill (cream/yellow) */}
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-amber-200 via-amber-100 to-amber-50 transition-all duration-1000 ease-out rounded-b-full border-b-4 border-amber-300"
                style={{ height: `${totalHeight}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent" />
              </div>

              {/* Paid pledges fill (solid green) */}
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400 transition-all duration-1000 ease-out rounded-b-full shadow-lg z-[15] border-b-4 border-emerald-500"
                style={{ height: `${paidHeight}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent" />
                
                {/* Temperature effect - bubbles */}
                {paidHeight > 20 && (
                  <div className="absolute inset-0 overflow-hidden rounded-b-full">
                    <div className="absolute bottom-0 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
                    <div className="absolute bottom-4 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-pulse" />
                    <div className="absolute bottom-8 left-1/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse" />
                  </div>
                )}
              </div>
            </div>

            {/* Thermometer bulb */}
            <div className="w-32 h-32 lg:w-36 lg:h-36 rounded-full bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-400 shadow-2xl border-4 border-border mt-2 relative overflow-hidden z-[15]">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <TrendingUp className="w-12 h-12 lg:w-14 lg:h-14 text-white" />
              </div>
              
              {/* Heat effect in bulb */}
              {paidHeight > 30 && (
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 to-orange-200/10 rounded-full animate-pulse" />
              )}
            </div>
          </div>

          {/* Right Side - KES Labels */}
          <div className="absolute right-0 h-full flex flex-col justify-between py-8">
            {/* Paid amount mark in KES */}
            {paidAmountKES > 0 && (
              <div 
                className="absolute flex items-center gap-2"
                style={{ bottom: `${paidHeight}%` }}
              >
                <div className="h-0.5 w-4 bg-emerald-500" />
                <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                  Paid: KES {formatAmount(paidAmountKES)}
                </span>
              </div>
            )}
            
            {/* Total pledged mark in KES */}
            {totalPledgedKES > paidAmountKES && (
              <div 
                className="absolute flex items-center gap-2"
                style={{ bottom: `${totalHeight}%` }}
              >
                <div className="h-0.5 w-4 bg-blue-500" />
                <span className="text-sm font-bold text-blue-600 whitespace-nowrap">
                  Total: KES {formatAmount(totalPledgedKES)}
                </span>
              </div>
            )}

            {/* Calibration marks */}
            {calibrationMarks.map((mark, index) => (
              <div 
                key={index} 
                className="absolute flex items-center gap-2"
                style={{ bottom: `${getMarkPosition(mark.valueUSD)}%` }}
              >
                <div className={cn(
                  "h-px",
                  mark.isGoal ? "w-4 bg-primary" : "w-2 bg-border"
                )} />
                <span className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  mark.isGoal ? "text-primary font-bold" : "text-muted-foreground"
                )}>
                  {mark.labelKES}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mt-8">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded"></div>
          <span className="text-sm text-muted-foreground">Paid Pledges</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-200 rounded"></div>
          <span className="text-sm text-muted-foreground">Unpaid Pledges</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 border-t-2 border-dashed border-primary/60"></div>
          <span className="text-sm text-muted-foreground">Goal Target</span>
        </div>
      </div>
    </div>
  );
}
