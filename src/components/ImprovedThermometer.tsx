import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, DollarSign } from 'lucide-react';

interface ImprovedThermometerProps {
  currentAmountUSD: number;
  currentAmountKES: number;
  goalAmountUSD?: number;
  className?: string;
}

export function ImprovedThermometer({ 
  currentAmountUSD, 
  currentAmountKES,
  goalAmountUSD = 50000,
  className 
}: ImprovedThermometerProps) {
  const [displayUSD, setDisplayUSD] = useState(0);
  const [displayKES, setDisplayKES] = useState(0);

  useEffect(() => {
    // Animate the numbers
    const duration = 2000;
    const steps = 60;
    const incrementUSD = currentAmountUSD / steps;
    const incrementKES = currentAmountKES / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setDisplayUSD(prev => Math.min(prev + incrementUSD, currentAmountUSD));
        setDisplayKES(prev => Math.min(prev + incrementKES, currentAmountKES));
      } else {
        clearInterval(timer);
        setDisplayUSD(currentAmountUSD);
        setDisplayKES(currentAmountKES);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [currentAmountUSD, currentAmountKES]);

  // Generate dynamic calibration marks based on goal and current amount
  const generateCalibrationMarks = () => {
    const maxAmount = Math.max(goalAmountUSD * 1.2, currentAmountUSD * 1.5, 1000);
    
    const formatLabelUSD = (value: number) => {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
      return `$${value}`;
    };
    
    const formatLabelKES = (value: number) => {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
      return `${value}`;
    };
    
    // Generate marks at nice round numbers
    const marks = [];
    let step = 100;
    
    if (maxAmount > 100000) step = 50000;
    else if (maxAmount > 50000) step = 10000;
    else if (maxAmount > 10000) step = 5000;
    else if (maxAmount > 5000) step = 1000;
    else if (maxAmount > 1000) step = 500;
    
    for (let value = step; value <= maxAmount; value += step) {
      const kesValue = value * 128.1;
      marks.push({ 
        valueUSD: value, 
        valueKES: kesValue,
        labelUSD: formatLabelUSD(value),
        labelKES: formatLabelKES(kesValue)
      });
    }
    
    // Always add the goal if not already present
    if (!marks.find(m => m.valueUSD === goalAmountUSD)) {
      marks.push({ 
        valueUSD: goalAmountUSD, 
        valueKES: goalAmountUSD * 128.1,
        labelUSD: `${formatLabelUSD(goalAmountUSD)} (Goal)`,
        labelKES: `${formatLabelKES(goalAmountUSD * 128.1)} (Goal)`
      });
    }
    
    return marks.sort((a, b) => a.valueUSD - b.valueUSD);
  };

  const calibrationMarks = generateCalibrationMarks();
  const maxCalibration = Math.max(...calibrationMarks.map(m => m.valueUSD), goalAmountUSD * 1.2);

  // Calculate thermometer height based on current amount relative to max calibration
  const getThermometerHeight = () => {
    if (currentAmountUSD === 0) return 0;
    return Math.min((currentAmountUSD / maxCalibration) * 100, 100);
  };

  const thermometerHeight = getThermometerHeight();

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

  const goalKES = goalAmountUSD * 128.1;

  return (
    <div className={cn("relative", className)}>
      {/* Header */}
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-bold text-primary mb-2">
          Tuendelee Foundation Fundraising Thermometer (Fundometer)
        </h3>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Live updates enabled - Showing paid pledges only
          </span>
        </div>
      </div>

      <div className="flex items-start gap-20">
        {/* Thermometer */}
        <div className="relative flex-shrink-0">
          <div className="relative w-20 h-[500px]">
            {/* Calibration marks - USD on left, KES on right */}
            <div className="absolute -left-32 top-0 h-full w-28">
              {calibrationMarks.map((mark) => {
                const position = getMarkPosition(mark.valueUSD);
                if (position > 100) return null;
                const isGoal = mark.valueUSD === goalAmountUSD;
                return (
                  <div
                    key={mark.valueUSD}
                    className="absolute flex items-center justify-end"
                    style={{ bottom: `${position}%`, left: 0, right: 0 }}
                  >
                    <span className={cn(
                      "text-sm font-bold mr-2",
                      isGoal ? "text-primary" : "text-foreground"
                    )}>
                      {mark.labelUSD}
                    </span>
                    <div className={cn(
                      "w-4 h-0.5",
                      isGoal ? "bg-primary" : "bg-foreground/60"
                    )} />
                  </div>
                );
              })}
            </div>

            {/* KES marks on the right */}
            <div className="absolute -right-32 top-0 h-full w-28">
              {calibrationMarks.map((mark) => {
                const position = getMarkPosition(mark.valueUSD);
                if (position > 100) return null;
                const isGoal = mark.valueUSD === goalAmountUSD;
                return (
                  <div
                    key={`kes-${mark.valueUSD}`}
                    className="absolute flex items-center"
                    style={{ bottom: `${position}%`, left: 0, right: 0 }}
                  >
                    <div className={cn(
                      "w-4 h-0.5",
                      isGoal ? "bg-success" : "bg-foreground/60"
                    )} />
                    <span className={cn(
                      "text-sm font-bold ml-2",
                      isGoal ? "text-success" : "text-foreground"
                    )}>
                      {mark.labelKES}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Thermometer tube */}
            <div className="absolute inset-0 bg-gradient-to-t from-muted to-muted/50 rounded-full overflow-hidden shadow-inner border-2 border-border">
              {/* Animated fill */}
              <div 
                className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
                style={{ height: `${thermometerHeight}%` }}
              >
                <div className="h-full bg-gradient-to-t from-success via-success-light to-primary animate-pulse rounded-full" />
              </div>
              
              {/* Glass effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full" />
            </div>

            {/* Bulb at bottom */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-radial from-success to-success-light rounded-full shadow-lg animate-pulse border-2 border-border">
              <div className="absolute inset-2 bg-gradient-to-br from-white/30 to-transparent rounded-full" />
            </div>
          </div>
        </div>

        {/* Amount displays - Two columns side by side */}
        <div className="flex-1 space-y-6">
          {/* Paid Pledges Section */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-3">Paid Pledges</h4>
            <div className="grid grid-cols-2 gap-4">
              {/* USD Display */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/30">
                <p className="text-sm font-medium text-muted-foreground mb-2">US Dollars</p>
                <p className="text-3xl font-bold text-primary">
                  ${formatAmount(displayUSD)}
                </p>
              </div>

              {/* KES Display */}
              <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-6 border-2 border-success/30">
                <p className="text-sm font-medium text-muted-foreground mb-2">Kenyan Shillings</p>
                <p className="text-3xl font-bold text-success">
                  KES {formatAmount(displayKES)}
                </p>
              </div>
            </div>
          </div>

          {/* Goal Section */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-3">Target Goal</h4>
            <div className="grid grid-cols-2 gap-4">
              {/* USD Goal */}
              <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-lg p-6 border-2 border-dashed border-primary/40">
                <p className="text-sm font-medium text-muted-foreground mb-2">US Dollars</p>
                <p className="text-3xl font-bold text-primary/80">
                  ${formatAmount(goalAmountUSD)}
                </p>
              </div>

              {/* KES Goal */}
              <div className="bg-gradient-to-br from-success/5 to-transparent rounded-lg p-6 border-2 border-dashed border-success/40">
                <p className="text-sm font-medium text-muted-foreground mb-2">Kenyan Shillings</p>
                <p className="text-3xl font-bold text-success/80">
                  KES {formatAmount(goalKES)}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Percentage */}
          <div className="bg-gradient-to-r from-primary/5 via-success/5 to-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Progress to Goal</span>
              <span className="text-2xl font-bold text-primary">
                {((displayUSD / goalAmountUSD) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}