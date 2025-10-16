import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Target, CheckCircle, Clock, Flame, ArrowUp, DollarSign, TrendingUp } from 'lucide-react';

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
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const totalPledgedPercentage = goalAmountUSD > 0 ? (totalPledgedUSD / goalAmountUSD) * 100 : 0;
  const paidPercentage = goalAmountUSD > 0 ? (paidAmountUSD / goalAmountUSD) * 100 : 0;

  return (
    <div className={cn("w-full max-w-7xl mx-auto py-8 px-4", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-2xl">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Target className="w-6 h-6" />
              <h3 className="text-lg font-bold">Total Pledged</h3>
            </div>
            <p className="text-3xl font-bold">${formatAmount(totalPledgedUSD)}</p>
            <p className="text-blue-100">KSh {formatAmount(totalPledgedKES)}</p>
            <div className="pt-3">
              <p className="text-blue-200 text-sm">Of Goal</p>
              <p className="text-2xl font-bold">{totalPledgedPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-6 shadow-2xl">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Paid Pledges</h3>
            </div>
            <p className="text-3xl font-bold">${formatAmount(displayPaidUSD)}</p>
            <p className="text-emerald-100">KSh {formatAmount(displayPaidKES)}</p>
            <div className="pt-3">
              <p className="text-emerald-200 text-sm">Of Goal</p>
              <p className="text-2xl font-bold">{paidPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-6 shadow-2xl">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-6 h-6" />
              <h3 className="text-lg font-bold">Unpaid Pledges</h3>
            </div>
            <p className="text-3xl font-bold">${formatAmount(displayUnpaidUSD)}</p>
            <p className="text-amber-100">KSh {formatAmount(displayUnpaidKES)}</p>
            <div className="pt-3">
              <p className="text-amber-200 text-sm">Of Total</p>
              <p className="text-2xl font-bold">
                {totalPledgedUSD > 0 ? ((unpaidAmountUSD / totalPledgedUSD) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Currency Headers */}
      <div className="flex justify-center items-center gap-16 mb-6">
        <div className="lg:w-48 text-center">
          <div className="flex items-center justify-end gap-2 text-blue-600 font-bold">
            <DollarSign className="w-5 h-5" />
            <span className="text-lg">US Dollars</span>
          </div>
        </div>
        <div className="w-16"></div>
        <div className="lg:w-48 text-center">
          <div className="flex items-center justify-start gap-2 text-green-600 font-bold">
            <TrendingUp className="w-5 h-5" />
            <span className="text-lg">Kenya Shillings</span>
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
                  {mark.isGoal && <Target className="w-3 h-3 text-red-500" />}
                  {mark.isPaid && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                  {mark.isTotal && <TrendingUp className="w-3 h-3 text-blue-500" />}
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
            <div className="w-14 bg-gradient-to-b from-gray-50 to-gray-100 rounded-full border-2 border-gray-300 shadow-xl overflow-hidden relative h-96 lg:h-[500px]">
              
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
      <style jsx>{`
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
