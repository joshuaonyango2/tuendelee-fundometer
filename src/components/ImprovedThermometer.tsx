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

  // Exchange rate (you can make this dynamic if needed)
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

  // Smart calibration marks that adapt to pledge amounts
  const generateCalibrationMarks = () => {
    const maxAmount = Math.max(goalAmountUSD, totalPledgedUSD, paidAmountUSD);
    
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

    // Determine optimal step size based on amounts
    const getStepSize = () => {
      const range = Math.max(maxAmount, goalAmountUSD * 1.2);
      
      if (range <= 1000) return 200;
      if (range <= 5000) return 1000;
      if (range <= 10000) return 2500;
      if (range <= 50000) return 10000;
      if (range <= 100000) return 25000;
      if (range <= 500000) return 100000;
      if (range <= 1000000) return 250000;
      return 500000;
    };

    const step = getStepSize();
    const marks = [];

    // Generate base marks
    for (let value = step; value <= maxAmount * 1.3; value += step) {
      if (marks.length >= 8) break; // Limit number of marks
      
      const kesValue = Math.round(value * exchangeRate);
      marks.push({ 
        valueUSD: value, 
        valueKES: kesValue,
        labelUSD: formatLabelUSD(value),
        labelKES: formatLabelKES(kesValue),
        isGoal: false,
        isPaid: false,
        isTotal: false
      });
    }

    // Always include goal as a special mark
    const goalMark = {
      valueUSD: goalAmountUSD,
      valueKES: Math.round(goalAmountUSD * exchangeRate),
      labelUSD: `$${formatLabelUSD(goalAmountUSD).replace('$', '')}`,
      labelKES: `KSh ${formatLabelKES(goalAmountUSD * exchangeRate).replace('KSh ', '')}`,
      isGoal: true,
      isPaid: false,
      isTotal: false
    };

    // Add goal if not already close to an existing mark
    const hasCloseGoal = marks.some(mark => 
      Math.abs(mark.valueUSD - goalAmountUSD) < step * 0.3
    );
    if (!hasCloseGoal) {
      marks.push(goalMark);
    }

    // Add current paid amount as a special mark if significant
    if (paidAmountUSD > goalAmountUSD * 0.05 && !marks.some(mark => 
      Math.abs(mark.valueUSD - paidAmountUSD) < step * 0.3
    )) {
      marks.push({
        valueUSD: paidAmountUSD,
        valueKES: paidAmountKES,
        labelUSD: `$${formatLabelUSD(paidAmountUSD).replace('$', '')}`,
        labelKES: `KSh ${formatLabelKES(paidAmountKES).replace('KSh ', '')}`,
        isGoal: false,
        isPaid: true,
        isTotal: false
      });
    }

    // Add total pledged as a special mark if different from paid
    if (totalPledgedUSD > paidAmountUSD * 1.1 && !marks.some(mark => 
      Math.abs(mark.valueUSD - totalPledgedUSD) < step * 0.3
    )) {
      marks.push({
        valueUSD: totalPledgedUSD,
        valueKES: totalPledgedKES,
        labelUSD: `$${formatLabelUSD(totalPledgedUSD).replace('$', '')}`,
        labelKES: `KSh ${formatLabelKES(totalPledgedKES).replace('KSh ', '')}`,
        isGoal: false,
        isPaid: false,
        isTotal: true
      });
    }

    return marks.sort((a, b) => a.valueUSD - b.valueUSD);
  };

  const calibrationMarks = generateCalibrationMarks();
  const maxCalibration = Math.max(...calibrationMarks.map(m => m.valueUSD), goalAmountUSD * 1.2);

  // Calculate heights
  const getPaidHeight = () => Math.min((paidAmountUSD / maxCalibration) * 100, 100);
  const getTotalHeight = () => Math.min((totalPledgedUSD / maxCalibration) * 100, 100);

  const paidHeight = getPaidHeight();
  const totalHeight = getTotalHeight();

  const getMarkPosition = (valueUSD: number) => (valueUSD / maxCalibration) * 100;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const totalPledgedPercentage = goalAmountUSD > 0 ? (totalPledgedUSD / goalAmountUSD) * 100 : 0;
  const paidPercentage = goalAmountUSD > 0 ? (paidAmountUSD / goalAmountUSD) * 100 : 0;

  // Get dynamic color based on progress
  const getProgressColor = () => {
    const progress = totalPledgedPercentage;
    if (progress < 25) return 'from-red-500 to-red-600';
    if (progress < 50) return 'from-orange-500 to-orange-600';
    if (progress < 75) return 'from-yellow-500 to-yellow-600';
    if (progress < 100) return 'from-green-500 to-green-600';
    return 'from-emerald-500 to-emerald-600';
  };

  return (
    <div className={cn("w-full max-w-7xl mx-auto py-8 px-4", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
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

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
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

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
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
            <span className="text-lg">US Dollars (USD)</span>
          </div>
        </div>
        <div className="w-16"></div> {/* Spacer for thermometer */}
        <div className="lg:w-48 text-center">
          <div className="flex items-center justify-start gap-2 text-green-600 font-bold">
            <TrendingUp className="w-5 h-5" />
            <span className="text-lg">Kenya Shillings (KSh)</span>
          </div>
        </div>
      </div>

      {/* Modern Thermometer with Dynamic Calibrations */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
        {/* Left Labels - USD */}
        <div className="lg:w-48 order-2 lg:order-1">
          <div className="space-y-0 text-right">
            {calibrationMarks.map((mark, index) => (
              <div
                key={index}
                className={cn(
                  "py-3 transition-all duration-300 border-r-2",
                  mark.isGoal 
                    ? "border-red-500 bg-red-50 pr-4 -mr-2 rounded-l-lg" 
                    : mark.isPaid
                    ? "border-emerald-500 bg-emerald-50 pr-4 -mr-2 rounded-l-lg"
                    : mark.isTotal
                    ? "border-blue-500 bg-blue-50 pr-4 -mr-2 rounded-l-lg"
                    : "border-gray-300 pr-3"
                )}
                style={{ 
                  marginTop: index === 0 ? '0' : '-12px',
                }}
              >
                <div className="flex items-center justify-end gap-2">
                  {mark.isGoal && <Target className="w-4 h-4 text-red-500" />}
                  {mark.isPaid && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  {mark.isTotal && <TrendingUp className="w-4 h-4 text-blue-500" />}
                  <span className={cn(
                    "text-sm font-semibold block",
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
                <div className={cn(
                  "text-xs font-medium mt-1",
                  mark.isGoal ? "text-red-500" :
                  mark.isPaid ? "text-emerald-500" :
                  mark.isTotal ? "text-blue-500" :
                  "text-gray-500"
                )}>
                  {mark.isGoal && "🎯 GOAL"}
                  {mark.isPaid && "✅ PAID"}
                  {mark.isTotal && "📊 TOTAL"}
                  {!mark.isGoal && !mark.isPaid && !mark.isTotal && "USD"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thermometer Center */}
        <div className="order-1 lg:order-2 flex flex-col items-center">
          {/* Thermometer Container */}
          <div className="relative">
            {/* Thermometer Tube */}
            <div className="w-16 bg-gradient-to-b from-gray-100 to-gray-50 rounded-full border-4 border-gray-300 shadow-2xl overflow-hidden relative h-96 lg:h-[500px]">
              
              {/* Glass Reflection */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white/60 to-transparent z-10" />
              
              {/* Unpaid Pledges Background (Amber) */}
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-amber-400/20 via-amber-300/30 to-amber-400/20 transition-all duration-1000 ease-out"
                style={{ height: `${totalHeight}%` }}
              >
                {/* Subtle pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200/40 via-transparent to-transparent" />
              </div>

              {/* Paid Pledges Fill (Dynamic Color) */}
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 bg-gradient-to-b transition-all duration-1000 ease-out rounded-t-full shadow-inner z-20",
                  getProgressColor()
                )}
                style={{ height: `${paidHeight}%` }}
              >
                {/* Shine Effect */}
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-full" />
                
                {/* Rising Bubbles */}
                {paidHeight > 10 && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute bottom-8 left-3 w-1.5 h-1.5 bg-white/40 rounded-full animate-float" />
                    <div className="absolute bottom-16 right-4 w-1 h-1 bg-white/50 rounded-full animate-float" style={{ animationDelay: '0.7s' }} />
                    <div className="absolute bottom-24 left-4 w-2 h-2 bg-white/30 rounded-full animate-float" style={{ animationDelay: '1.4s' }} />
                  </div>
                )}
              </div>

              {/* Dynamic Calibration Marks Inside */}
              {calibrationMarks.map((mark, index) => (
                <div
                  key={index}
                  className="absolute left-0 right-0 flex justify-between px-1 z-15"
                  style={{ bottom: `${getMarkPosition(mark.valueUSD)}%` }}
                >
                  <div className={cn(
                    "h-0.5 rounded-full",
                    mark.isGoal 
                      ? "w-3 bg-red-500" 
                      : mark.isPaid
                      ? "w-3 bg-emerald-500"
                      : mark.isTotal
                      ? "w-3 bg-blue-500"
                      : "w-2 bg-gray-400"
                  )} />
                  <div className={cn(
                    "h-0.5 rounded-full",
                    mark.isGoal 
                      ? "w-3 bg-red-500" 
                      : mark.isPaid
                      ? "w-3 bg-emerald-500"
                      : mark.isTotal
                      ? "w-3 bg-blue-500"
                      : "w-2 bg-gray-400"
                  )} />
                </div>
              ))}

              {/* Goal Line */}
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed border-red-500 z-25 shadow-lg"
                style={{ bottom: `${getMarkPosition(goalAmountUSD)}%` }}
              />
            </div>

            {/* Thermometer Bulb */}
            <div className={cn(
              "w-24 h-24 -mt-3 mx-auto rounded-full bg-gradient-to-br shadow-2xl border-4 border-white relative overflow-hidden z-30",
              getProgressColor()
            )}>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame className="w-10 h-10 text-white animate-pulse" />
              </div>
              {/* Bulb Shine */}
              <div className="absolute top-2 left-2 w-8 h-8 bg-white/30 rounded-full blur-sm" />
            </div>

            {/* Current Progress Indicators */}
            <div className="mt-6 space-y-4 text-center">
              {paidAmountUSD > 0 && (
                <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-bold">Paid: ${formatAmount(paidAmountUSD)}</span>
                  </div>
                  <div className="text-sm opacity-90 mt-1">
                    KSh {formatAmount(paidAmountKES)}
                  </div>
                </div>
              )}
              
              {totalPledgedUSD > paidAmountUSD && (
                <div className="bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center justify-center gap-2">
                    <ArrowUp className="w-4 h-4" />
                    <span className="font-bold">Total: ${formatAmount(totalPledgedUSD)}</span>
                  </div>
                  <div className="text-sm opacity-90 mt-1">
                    KSh {formatAmount(totalPledgedKES)}
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
                  "py-3 transition-all duration-300 border-l-2",
                  mark.isGoal 
                    ? "border-red-500 bg-red-50 pl-4 -ml-2 rounded-r-lg" 
                    : mark.isPaid
                    ? "border-emerald-500 bg-emerald-50 pl-4 -ml-2 rounded-r-lg"
                    : mark.isTotal
                    ? "border-blue-500 bg-blue-50 pl-4 -ml-2 rounded-r-lg"
                    : "border-gray-300 pl-3"
                )}
                style={{ 
                  marginTop: index === 0 ? '0' : '-12px',
                }}
              >
                <div className="flex items-center justify-start gap-2">
                  <span className={cn(
                    "text-sm font-semibold block",
                    mark.isGoal 
                      ? "text-red-600" 
                      : mark.isPaid
                      ? "text-emerald-600"
                      : mark.isTotal
                      ? "text-blue-600"
                      : "text-gray-700"
                  )}>
                    {mark.labelKES}
                  </span>
                  {mark.isGoal && <Target className="w-4 h-4 text-red-500" />}
                  {mark.isPaid && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  {mark.isTotal && <TrendingUp className="w-4 h-4 text-blue-500" />}
                </div>
                <div className={cn(
                  "text-xs font-medium mt-1",
                  mark.isGoal ? "text-red-500" :
                  mark.isPaid ? "text-emerald-500" :
                  mark.isTotal ? "text-blue-500" :
                  "text-gray-500"
                )}>
                  {mark.isGoal && "🎯 LENGO"}
                  {mark.isPaid && "✅ IMELIPWA"}
                  {mark.isTotal && "📊 JUMLA"}
                  {!mark.isGoal && !mark.isPaid && !mark.isTotal && "KSh"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exchange Rate Info */}
      <div className="text-center mt-8 text-sm text-gray-600">
        <p>Exchange Rate: 1 USD = {exchangeRate} KSh • Updates in real-time with pledges</p>
      </div>

      {/* Progress Animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-10px) scale(1.1); opacity: 1; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
