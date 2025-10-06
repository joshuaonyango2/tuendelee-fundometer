import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, DollarSign } from 'lucide-react';

interface ImprovedThermometerProps {
  currentAmountUSD: number;
  currentAmountKES: number;
  className?: string;
}

export function ImprovedThermometer({ 
  currentAmountUSD, 
  currentAmountKES, 
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

  // Generate dynamic calibration marks based on current amount
  const generateCalibrationMarks = () => {
    const maxAmount = Math.max(currentAmountUSD * 1.5, 1000); // Show 50% above current or minimum $1000
    
    const formatLabel = (value: number) => {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
      return `$${value}`;
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
      marks.push({ value, label: formatLabel(value) });
    }
    
    return marks;
  };

  const calibrationMarks = generateCalibrationMarks();
  const maxCalibration = Math.max(...calibrationMarks.map(m => m.value), currentAmountUSD * 1.2);

  // Calculate thermometer height based on current amount relative to max calibration
  const getThermometerHeight = () => {
    if (currentAmountUSD === 0) return 0;
    return Math.min((currentAmountUSD / maxCalibration) * 100, 100);
  };

  const thermometerHeight = getThermometerHeight();

  const getMarkPosition = (value: number) => {
    return (value / maxCalibration) * 100;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-start gap-8">
        {/* Thermometer */}
        <div className="relative flex-shrink-0">
          <div className="relative w-20 h-[400px]">
            {/* Calibration marks */}
            <div className="absolute left-24 top-0 h-full w-32">
              {calibrationMarks.map((mark) => {
                const position = getMarkPosition(mark.value);
                if (position > 100) return null;
                return (
                  <div
                    key={mark.value}
                    className="absolute flex items-center"
                    style={{ bottom: `${position}%`, left: 0, right: 0 }}
                  >
                    <div className="w-2 h-px bg-muted-foreground/30" />
                    <span className="ml-2 text-xs text-muted-foreground">
                      {mark.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Thermometer tube */}
            <div className="absolute inset-0 bg-gradient-to-t from-muted to-muted/50 rounded-full overflow-hidden shadow-inner">
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
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-radial from-success to-success-light rounded-full shadow-lg animate-pulse">
              <div className="absolute inset-2 bg-gradient-to-br from-white/30 to-transparent rounded-full" />
            </div>
          </div>
        </div>

        {/* Amount displays */}
        <div className="flex-1 space-y-6 pt-8">
          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">
              Live Fundraising Progress
            </h3>
            
            {/* USD Display */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">US Dollars</p>
                  <p className="text-3xl font-bold text-primary">
                    ${formatAmount(displayUSD)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary/50" />
              </div>
            </div>

            {/* KES Display */}
            <div className="bg-gradient-to-r from-success/10 to-success/5 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Kenyan Shillings</p>
                  <p className="text-3xl font-bold text-success">
                    KES {formatAmount(displayKES)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-success/50" />
              </div>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Live updates enabled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}