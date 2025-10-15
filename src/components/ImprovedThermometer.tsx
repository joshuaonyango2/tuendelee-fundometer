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
    <div className={cn("w-full", className)}>
      {/* Compact cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Paid Pledges */}
        <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-3 border border-success/30">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 bg-success rounded-full" />
            <h4 className="text-xs font-semibold text-success">Paid</h4>
          </div>
          <p className="text-lg font-bold text-success">${formatAmount(displayPaidUSD)}</p>
          <p className="text-xs text-muted-foreground">KSh {formatAmount(displayPaidKES)}</p>
          <p className="text-xs text-success/70 mt-1">{paidPercentage.toFixed(1)}% of goal</p>
        </div>

        {/* Unpaid Pledges */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-lg p-3 border border-amber-500/30">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <h4 className="text-xs font-semibold text-amber-600">Unpaid</h4>
          </div>
          <p className="text-lg font-bold text-amber-600">${formatAmount(displayUnpaidUSD)}</p>
          <p className="text-xs text-muted-foreground">KSh {formatAmount(displayUnpaidKES)}</p>
          <p className="text-xs text-amber-600/70 mt-1">{unpaidPercentage.toFixed(1)}% of goal</p>
        </div>

        {/* Total Pledged */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/30">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3 h-3 text-primary" />
            <h4 className="text-xs font-semibold text-primary">Total</h4>
          </div>
          <p className="text-lg font-bold text-primary">${formatAmount(displayPaidUSD + displayUnpaidUSD)}</p>
          <p className="text-xs text-muted-foreground">KSh {formatAmount(displayPaidKES + displayUnpaidKES)}</p>
          <p className="text-xs text-primary/70 mt-1">{totalPledgedPercentage.toFixed(1)}% of goal</p>
        </div>

        {/* Goal */}
        <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-lg p-3 border border-dashed border-primary/40">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="w-3 h-3 text-foreground" />
            <h4 className="text-xs font-semibold text-foreground">Goal</h4>
          </div>
          <p className="text-lg font-bold text-foreground">${formatAmount(goalAmountUSD)}</p>
          <p className="text-xs text-muted-foreground">KSh {formatAmount(goalKES)}</p>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}