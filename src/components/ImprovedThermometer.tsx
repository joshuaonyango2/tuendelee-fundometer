import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Target, CheckCircle, Clock, Flame, ArrowUp, DollarSign, TrendingUp, Trophy } from 'lucide-react';

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

  // Exchange rate
  const exchangeRate = 128;

  useEffect(() => {
    const duration = 1500;
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

  // Enhanced calibration marks that show beyond goal
  const generateCalibrationMarks = () => {
    // Calculate maximum amount to display (goal or 20% beyond current total, whichever is larger)
    const maxAmount = Math.max(
      goalAmountUSD, 
      totalPledgedUSD * 1.2,
      goalAmountUSD * 1.5 // Always show at least 50% beyond goal
    );
    
    const formatLabelUSD = (value: number) => {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
      return `$${value.toLocaleString()}`;
    };
    
    const formatLabelKES = (value: number) => {
      if (value >= 1000000) return `KSh ${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `KSh ${(value / 1000).toFixed(0)}K`;
      return `KSh ${value.toLocaleString()}`;
    };

    // Smart step calculation that considers the entire range
    const getStepSize = () => {
      const range = maxAmount;
      
      if (range <= 2000) return 500;
      if (range <= 5000) return 1000;
      if (range <= 15000) return 2500;
      if (range <= 30000) return 5000;
      if (range <= 75000) return 15000;
      if (range <= 150000) return 30000;
      if (range <= 300000) return 75000;
      if (range <= 750000) return 150000;
      if (range <= 1500000) return 300000;
      return 500000;
    };

    const step = getStepSize();
    const marks = [];

    // Generate marks from bottom to beyond goal
    for (let value = 0; value <= maxAmount; value += step) {
      if (value === 0) continue; // Skip zero
      
      const kesValue = Math.round(value * exchangeRate);
      const isGoal = Math.abs(value - goalAmountUSD) < step * 0.1;
      const isPaid = Math.abs(value - paidAmountUSD) < step * 0.1 && paidAmountUSD > 0;
      const isTotal = Math.abs(value - totalPledgedUSD) < step * 0.1 && totalPledgedUSD > paidAmountUSD;
      
      marks.push({ 
        valueUSD: value, 
        valueKES: kesValue,
        labelUSD: formatLabelUSD(value),
        labelKES: formatLabelKES(kesValue),
        isGoal,
        isPaid,
        isTotal
      });
      
      // Stop if we have enough marks or reached max
      if (marks.length >= 10) break;
    }

    // Ensure goal is always included
    const hasGoal = marks.some(mark => mark.isGoal);
    if (!hasGoal) {
      marks.push({
        valueUSD: goalAmountUSD,
        valueKES: Math.round(goalAmountUSD * exchangeRate),
        labelUSD: formatLabelUSD(goalAmountUSD),
        labelKES: formatLabelKES(goalAmountUSD * exchangeRate),
        isGoal: true,
        isPaid: false,
        isTotal: false
      });
    }

    // Ensure current amounts are marked if significant
    if (paidAmountUSD > goalAmountUSD * 0.1) {
      const hasPaid = marks.some(mark => mark.isPaid);
      if (!hasPaid) {
        marks.push({
          valueUSD: paidAmountUSD,
          valueKES: paidAmountKES,
          labelUSD: formatLabelUSD(paidAmountUSD),
          labelKES: formatLabelKES(paidAmountKES),
          isGoal: false,
          isPaid: true,
          isTotal: false
        });
      }
    }

    if (totalPledgedUSD > paidAmountUSD * 1.1) {
      const hasTotal = marks.some(mark => mark.isTotal);
      if (!hasTotal) {
        marks.push({
          valueUSD: totalPledgedUSD,
          valueKES: totalPledgedKES,
          labelUSD: formatLabelUSD(totalPledgedUSD),
          labelKES: formatLabelKES(totalPledgedKES),
          isGoal: false,
          isPaid: false,
          isTotal: true
        });
      }
    }

    return marks.sort((a, b) => a.valueUSD - b.valueUSD);
  };

  const calibrationMarks = generateCalibrationMarks();
  const maxCalibration = Math.max(...calibrationMarks.map(m => m.valueUSD));

  // Calculate heights
  const getPaidHeight = () => Math.min((paidAmountUSD / maxCalibration) * 100, 100);
  const getUnpaidHeight = () => Math.min((unpaidAmountUSD / maxCalibration) * 100, 100);
  const getTotalHeight = () => Math.min((totalPledgedUSD / maxCalibration) * 100, 100);

  const paidHeight = getPaidHeight();
  const unpaidHeight = getUnpaidHeight();
  const totalHeight = getTotalHeight();

  const getMarkPosition = (valueUSD: number) => (valueUSD / maxCalibration) * 100;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(amount));
  };

  // Compact formatter keeps big numbers from overflowing the cards
  const formatCompact = (amount: number) => {
    const n = Math.round(amount);
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (Math.abs(n) >= 100_000) return `${(n / 1_000).toFixed(0)}K`;
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  };


  const totalPledgedPercentage = goalAmountUSD > 0 ? (totalPledgedUSD / goalAmountUSD) * 100 : 0;
  const paidPercentage = goalAmountUSD > 0 ? (paidAmountUSD / goalAmountUSD) * 100 : 0;
  const remainingPercentage = Math.max(0, 100 - totalPledgedPercentage);
  const remainingAmountUSD = Math.max(0, goalAmountUSD - totalPledgedUSD);
  const remainingAmountKES = Math.max(0, goalAmountUSD * exchangeRate - totalPledgedKES);

  const progressLabel = `Fundraising progress: ${totalPledgedPercentage.toFixed(1)}% of goal. KSh ${formatAmount(totalPledgedKES)} pledged of a KSh ${formatAmount(goalAmountUSD * exchangeRate)} goal (KSh ${formatAmount(paidAmountKES)} paid). KSh ${formatAmount(remainingAmountKES)} still needed.`;

  return (
    <div className={cn("w-full max-w-7xl mx-auto py-8 px-4", className)}>
      <p className="sr-only" role="status" aria-live="polite">{progressLabel}</p>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6 mb-12">
        {[
          {
            title: 'Campaign Goal',
            Icon: Trophy,
            gradient: 'from-purple-500 to-purple-700',
            usd: goalAmountUSD,
            kes: goalAmountUSD * exchangeRate,
            subLabel: 'Target Amount',
            subValue: '100%',
            tint: 'text-purple-100',
          },
          {
            title: 'Total Pledged',
            Icon: Target,
            gradient: 'from-blue-500 to-blue-700',
            usd: totalPledgedUSD,
            kes: totalPledgedKES,
            subLabel: 'Of Goal',
            subValue: `${totalPledgedPercentage.toFixed(1)}%`,
            tint: 'text-blue-100',
          },
          {
            title: 'Paid Pledges',
            Icon: CheckCircle,
            gradient: 'from-emerald-500 to-emerald-700',
            usd: displayPaidUSD,
            kes: displayPaidKES,
            subLabel: 'Of Goal',
            subValue: `${paidPercentage.toFixed(1)}%`,
            tint: 'text-emerald-100',
          },
          {
            title: 'Still Needed',
            Icon: ArrowUp,
            gradient: 'from-orange-500 to-orange-700',
            usd: remainingAmountUSD,
            kes: remainingAmountKES,
            subLabel: 'To Reach Goal',
            subValue: `${remainingPercentage.toFixed(1)}%`,
            tint: 'text-orange-100',
          },
        ].map(({ title, Icon, gradient, usd, kes, subLabel, subValue, tint }) => (
          <div
            key={title}
            className={cn(
              'relative overflow-hidden rounded-3xl p-6 text-white shadow-xl ring-1 ring-white/20',
              'bg-gradient-to-br transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl',
              gradient
            )}
          >
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-xl" />
            <div className="relative flex flex-col items-center text-center">
              <div className="flex items-center justify-center gap-2 min-w-0">
                <Icon className="h-6 w-6 shrink-0" />
                <h3 className="text-xl font-extrabold tracking-tight leading-tight">{title}</h3>
              </div>

              <p className="mt-4 w-full text-[clamp(1.75rem,4.2vw,2.75rem)] font-black leading-none tabular-nums tracking-tight">
                ${formatCompact(usd)}
              </p>
              <p className={cn('mt-2 w-full text-base font-semibold tabular-nums leading-snug', tint)}>
                KSh {formatCompact(kes)}
              </p>

              <div className="mt-5 w-full border-t border-white/25 pt-4">
                <p className="text-sm font-medium uppercase tracking-wide text-white/80">{subLabel}</p>
                <p className="mt-1 text-3xl font-black tabular-nums leading-none">{subValue}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Big live progress banner */}
      <div className="mx-auto mb-10 max-w-3xl rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 px-6 py-5 text-center shadow-md">
        <p className="text-base font-semibold uppercase tracking-widest text-muted-foreground">Live Progress</p>
        <p className="mt-1 text-[clamp(2.25rem,7vw,4rem)] font-black leading-none tabular-nums text-foreground">
          {totalPledgedPercentage.toFixed(1)}%
        </p>
        <p className="mt-2 text-lg font-semibold text-foreground/80">
          {totalPledgedPercentage >= 100
            ? '🎉 Goal reached — thank you! Every extra gift goes further.'
            : totalPledgedPercentage >= 75
            ? '🔥 So close! Your gift can push the mercury to the top.'
            : totalPledgedPercentage >= 50
            ? '💪 Past halfway — add yours and watch it rise.'
            : totalPledgedPercentage >= 25
            ? '🚀 Momentum is building — make the level jump.'
            : '🌟 Be the spark — your pledge lifts the thermometer now.'}
        </p>
      </div>

      {/* Currency Headers */}
      <div className="flex justify-center items-center gap-10 sm:gap-16 mb-6">
        <div className="lg:w-48 text-center">
          <div className="flex items-center justify-center lg:justify-end gap-2 text-blue-600 font-bold">
            <DollarSign className="w-6 h-6" />
            <span className="text-xl">US Dollars</span>
          </div>
        </div>
        <div className="hidden lg:block w-16" />
        <div className="lg:w-48 text-center">
          <div className="flex items-center justify-center lg:justify-start gap-2 text-green-600 font-bold">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xl">Kenya Shillings</span>
          </div>
        </div>
      </div>


      {/* Enhanced Thermometer */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
        {/* Left Labels - USD */}
        <div className="lg:w-48 order-2 lg:order-1">
          <div className="space-y-0 text-right">
            {calibrationMarks.map((mark, index) => (
              <div
                key={index}
                className={cn(
                  "py-2 transition-all duration-300 border-r-2 relative",
                  mark.isGoal 
                    ? "border-red-500 bg-red-50 pr-4 -mr-2 rounded-l-lg" 
                    : mark.isPaid
                    ? "border-emerald-500 bg-emerald-50 pr-4 -mr-2 rounded-l-lg"
                    : mark.isTotal
                    ? "border-blue-500 bg-blue-50 pr-4 -mr-2 rounded-l-lg"
                    : "border-gray-200 pr-3"
                )}
                style={{ 
                  marginTop: index === 0 ? '0' : '-8px',
                }}
              >
                <div className="flex items-center justify-end gap-2">
                  {mark.isGoal && <Target className="w-4 h-4 text-red-500" />}
                  {mark.isPaid && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  {mark.isTotal && <TrendingUp className="w-4 h-4 text-blue-500" />}
                  <span className={cn(
                    "text-base font-bold tabular-nums block",
                    mark.isGoal 
                      ? "text-red-600" 
                      : mark.isPaid
                      ? "text-emerald-600"
                      : mark.isTotal
                      ? "text-blue-600"
                      : "text-gray-700"
                  )}>
                    {mark.labelUSD}
                  </span>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Thermometer Center */}
        <div className="order-1 lg:order-2 flex flex-col items-center">
          <div className="relative">
            {/* Thermometer Tube */}
            <div
              className="w-14 bg-gradient-to-b from-gray-50 to-gray-100 rounded-full border-2 border-gray-300 shadow-xl overflow-hidden relative h-96 lg:h-[500px]"
              role="progressbar"
              aria-valuenow={Math.round(totalPledgedUSD)}
              aria-valuemin={0}
              aria-valuemax={Math.round(goalAmountUSD)}
              aria-valuetext={progressLabel}
              aria-label="Fundraising progress toward goal"
            >
              
              {/* Glass Reflection */}
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-white/50 to-transparent z-10" />
              
              {/* Empty Tube Above Total */}
              <div 
                className="absolute top-0 left-0 right-0 bg-gradient-to-b from-gray-50 to-gray-100 transition-all duration-1000 ease-out"
                style={{ height: `${100 - totalHeight}%` }}
              />

              {/* Unpaid Pledges (Amber) - ON TOP of paid for meniscus effect */}
              {unpaidAmountUSD > 0 && (
                <div
                  className="absolute left-0 right-0 bg-gradient-to-b from-amber-400 via-amber-300 to-amber-400 transition-all duration-1000 ease-out z-20"
                  style={{ 
                    bottom: `${paidHeight}%`,
                    height: `${unpaidHeight}%`
                  }}
                >
                  {/* Meniscus Curve for Unpaid */}
                  <div className="absolute top-0 left-0 right-0 h-3 bg-amber-300 rounded-b-full" />
                  
                  {/* Shine Effect */}
                  <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-amber-200/40 to-transparent" />
                </div>
              )}

              {/* Paid Pledges (Emerald) - BASE layer */}
              {paidAmountUSD > 0 && (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-emerald-500 via-emerald-400 to-emerald-500 transition-all duration-1000 ease-out z-15 rounded-t-full"
                  style={{ height: `${paidHeight}%` }}
                >
                  {/* Meniscus Curve for Paid */}
                  <div className="absolute top-0 left-0 right-0 h-3 bg-emerald-400 rounded-t-full" />
                  
                  {/* Shine Effect */}
                  <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-emerald-300/50 to-transparent rounded-t-full" />
                  
                  {/* Rising Bubbles */}
                  {paidHeight > 10 && (
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute bottom-8 left-3 w-1.5 h-1.5 bg-emerald-300/60 rounded-full animate-float" />
                      <div className="absolute bottom-16 right-4 w-1 h-1 bg-emerald-200/70 rounded-full animate-float" style={{ animationDelay: '0.7s' }} />
                    </div>
                  )}
                </div>
              )}

              {/* Calibration Marks - Positioned at meniscus levels */}
              {calibrationMarks.map((mark, index) => (
                <div
                  key={index}
                  className="absolute left-0 right-0 flex justify-between items-center px-1 z-30"
                  style={{ bottom: `${getMarkPosition(mark.valueUSD)}%` }}
                >
                  {/* Left tick */}
                  <div className={cn(
                    "h-0.5 rounded-full transition-all duration-300",
                    mark.isGoal 
                      ? "w-4 bg-red-500" 
                      : mark.isPaid
                      ? "w-3 bg-emerald-500"
                      : mark.isTotal
                      ? "w-3 bg-blue-500"
                      : "w-2 bg-gray-500"
                  )} />
                  
                  {/* Right tick */}
                  <div className={cn(
                    "h-0.5 rounded-full transition-all duration-300",
                    mark.isGoal 
                      ? "w-4 bg-red-500" 
                      : mark.isPaid
                      ? "w-3 bg-emerald-500"
                      : mark.isTotal
                      ? "w-3 bg-blue-500"
                      : "w-2 bg-gray-500"
                  )} />
                </div>
              ))}

              {/* Current Level Indicators */}
              {/* Paid Level Indicator */}
              {paidAmountUSD > 0 && (
                <div 
                  className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-300 z-25"
                  style={{ bottom: `${paidHeight}%` }}
                />
              )}
              
              {/* Total Level Indicator */}
              {totalPledgedUSD > paidAmountUSD && (
                <div 
                  className="absolute left-0 right-0 border-t-2 border-dashed border-amber-300 z-25"
                  style={{ bottom: `${totalHeight}%` }}
                />
              )}

              {/* Goal Line - Always visible */}
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed border-red-500 z-30 shadow-sm"
                style={{ bottom: `${getMarkPosition(goalAmountUSD)}%` }}
              />
            </div>

            {/* Thermometer Bulb */}
            <div className="w-20 h-20 -mt-2 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg border-2 border-white relative overflow-hidden z-30">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/30 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Floating Amount Indicators */}
            <div className="mt-4 space-y-2 text-center">
              {paidAmountUSD > 0 && (
                <div className="bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-sm font-bold">Paid: ${formatAmount(paidAmountUSD)}</span>
                  </div>
                </div>
              )}
              
              {unpaidAmountUSD > 0 && (
                <div className="bg-amber-500 text-white px-4 py-2 rounded-full shadow-lg">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span className="text-sm font-bold">Unpaid: ${formatAmount(unpaidAmountUSD)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Labels - KES */}
        <div className="lg:w-48 order-3">
          <div className="space-y-0 text-left">
            {calibrationMarks.map((mark, index) => (
              <div
                key={index}
                className={cn(
                  "py-2 transition-all duration-300 border-l-2 relative",
                  mark.isGoal 
                    ? "border-red-500 bg-red-50 pl-4 -ml-2 rounded-r-lg" 
                    : mark.isPaid
                    ? "border-emerald-500 bg-emerald-50 pl-4 -ml-2 rounded-r-lg"
                    : mark.isTotal
                    ? "border-blue-500 bg-blue-50 pl-4 -ml-2 rounded-r-lg"
                    : "border-gray-200 pl-3"
                )}
                style={{ 
                  marginTop: index === 0 ? '0' : '-8px',
                }}
              >
                <div className="flex items-center justify-start gap-2">
                  <span className={cn(
                    "text-xs font-semibold block",
                    mark.isGoal 
                      ? "text-red-600" 
                      : mark.isPaid
                      ? "text-emerald-600"
                      : mark.isTotal
                      ? "text-blue-600"
                      : "text-gray-600"
                  )}>
                    {mark.labelKES}
                  </span>
                  {mark.isGoal && <Target className="w-3 h-3 text-red-500" />}
                  {mark.isPaid && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                  {mark.isTotal && <TrendingUp className="w-3 h-3 text-blue-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-8">
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">Paid Pledges</span>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
          <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">Unpaid Pledges</span>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
          <div className="w-4 h-1 border-t-2 border-dashed border-red-500"></div>
          <span className="text-sm font-medium text-gray-700">Goal Target</span>
        </div>
      </div>

      {/* Progress Animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-8px) scale(1.05); opacity: 1; }
        }
        .animate-float {
          animation: float 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
