import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface FundraisingThermometerProps {
  paidAmount: number;
  unpaidAmount: number;
  goalAmount: number;
  currency: string;
  className?: string;
  paidColor?: string; // Optional: Custom class for paid fill (default: bg-gradient-secondary)
  unpaidColor?: string; // Optional: Custom class for unpaid fill (default: bg-gradient-secondary/50 with stripes)
}

export function FundraisingThermometer({
  paidAmount,
  unpaidAmount,
  goalAmount,
  currency,
  className,
  paidColor = "bg-gradient-secondary",
  unpaidColor = "bg-gradient-secondary/50 bg-stripes", // Add stripes for distinction
}: FundraisingThermometerProps) {
  const [displayPaid, setDisplayPaid] = useState(0);
  const [displayUnpaid, setDisplayUnpaid] = useState(0);
  const totalPledges = paidAmount + unpaidAmount;
  const paidPercentage = Math.min((paidAmount / goalAmount) * 100, 100);
  const totalPercentage = Math.min((totalPledges / goalAmount) * 100, 100);
  const unpaidPercentage = totalPercentage - paidPercentage;

  // Animate the displayed amounts
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const paidIncrement = paidAmount / steps;
    const unpaidIncrement = unpaidAmount / steps;
    let currentPaid = 0;
    let currentUnpaid = 0;

    const timer = setInterval(() => {
      currentPaid += paidIncrement;
      currentUnpaid += unpaidIncrement;
      if (currentPaid >= paidAmount && currentUnpaid >= unpaidAmount) {
        setDisplayPaid(paidAmount);
        setDisplayUnpaid(unpaidAmount);
        clearInterval(timer);
      } else {
        setDisplayPaid(Math.min(currentPaid, paidAmount));
        setDisplayUnpaid(Math.min(currentUnpaid, unpaidAmount));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [paidAmount, unpaidAmount]);

  const getMotivationalMessage = () => {
    if (totalPercentage >= 100) return "🎉 Goal Achieved! Thank you!";
    if (totalPercentage >= 75) return "🔥 We're almost there! Keep going!";
    if (totalPercentage >= 50) return "💪 Halfway to our goal!";
    if (totalPercentage >= 25) return "🚀 Great start! Let's keep the momentum!";
    return "🌟 Every contribution counts!";
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={cn("w-full max-w-md mx-auto", className)} role="region" aria-label="Fundraising Progress Thermometer">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          {formatAmount(displayPaid + displayUnpaid)}
        </h3>
        <p className="text-muted-foreground mt-1">
          pledged of {formatAmount(goalAmount)} goal
        </p>
        <p className="text-lg font-semibold text-primary mt-2">
          {totalPercentage.toFixed(1)}% Complete
        </p>
        {/* New: Breakdown of paid/unpaid/total */}
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Paid: {formatAmount(displayPaid)}</p>
          <p>Unpaid: {formatAmount(displayUnpaid)}</p>
          <p>Total Pledges: {formatAmount(displayPaid + displayUnpaid)}</p>
        </div>
      </div>

      <div className="relative">
        {/* Thermometer Container */}
        <div 
          className="relative w-24 h-64 mx-auto"
          role="progressbar"
          aria-valuenow={totalPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Fundraising progress: ${totalPercentage.toFixed(1)}% towards goal`}
        >
          {/* Glass tube */}
          <div className="absolute inset-0 bg-white rounded-full border-4 border-primary/20 shadow-lg overflow-hidden">
            {/* Paid fill (solid, bottom) */}
            <div 
              className={cn("absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out rounded-b-full", paidColor)}
              style={{ height: `${paidPercentage}%` }}
            >
              {/* Animated bubbles for paid */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="animate-pulse absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/30 rounded-full" />
                <div className="animate-pulse delay-150 absolute top-6 left-1/3 w-1.5 h-1.5 bg-white/30 rounded-full" />
              </div>
            </div>

            {/* Unpaid fill (striped/lighter, stacked on paid) */}
            <div 
              className={cn("absolute left-0 right-0 transition-all duration-1000 ease-out", unpaidColor)}
              style={{ bottom: `${paidPercentage}%`, height: `${unpaidPercentage}%` }}
            >
              {/* Subtler bubbles for unpaid */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="animate-pulse delay-300 absolute top-10 right-1/3 w-1 h-1 bg-white/20 rounded-full" />
              </div>
            </div>

            {/* Percentage markers */}
            {[25, 50, 75].map((mark) => (
              <div
                key={mark}
                className="absolute left-0 right-0 border-t-2 border-primary/10"
                style={{ bottom: `${mark}%` }}
              />
            ))}
          </div>

          {/* Bulb at bottom */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-secondary rounded-full border-4 border-primary/20 shadow-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {totalPercentage.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Side labels */}
        <div className="absolute top-0 -left-16 text-sm text-muted-foreground">
          {formatAmount(goalAmount)}
        </div>
        <div className="absolute bottom-8 -left-16 text-sm text-muted-foreground">
          {formatAmount(0)}
        </div>
      </div>

      {/* Motivational message */}
      <div className="text-center mt-12 p-4 bg-accent rounded-lg">
        <p className="text-lg font-semibold text-accent-foreground animate-pulse">
          {getMotivationalMessage()}
        </p>
      </div>
    </div>
  );
}
