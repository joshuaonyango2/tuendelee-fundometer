import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface FundraisingThermometerProps {
  currentAmount: number;
  goalAmount: number;
  currency: string;
  className?: string;
}

export function FundraisingThermometer({ 
  currentAmount, 
  goalAmount, 
  currency,
  className 
}: FundraisingThermometerProps) {
  const [displayAmount, setDisplayAmount] = useState(0);
  const percentage = Math.min((currentAmount / goalAmount) * 100, 100);
  
  // Animate the thermometer filling
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = currentAmount / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= currentAmount) {
        setDisplayAmount(currentAmount);
        clearInterval(timer);
      } else {
        setDisplayAmount(current);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [currentAmount]);

  const getMotivationalMessage = () => {
    if (percentage >= 100) return "🎉 Goal Achieved! Thank you!";
    if (percentage >= 75) return "🔥 We're almost there! Keep going!";
    if (percentage >= 50) return "💪 Halfway to our goal!";
    if (percentage >= 25) return "🚀 Great start! Let's keep the momentum!";
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
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          {formatAmount(displayAmount)}
        </h3>
        <p className="text-muted-foreground mt-1">
          raised of {formatAmount(goalAmount)} goal
        </p>
        <p className="text-lg font-semibold text-primary mt-2">
          {percentage.toFixed(1)}% Complete
        </p>
      </div>
      
      <div className="relative">
        {/* Thermometer Container */}
        <div className="relative w-24 h-64 mx-auto">
          {/* Glass tube */}
          <div className="absolute inset-0 bg-white rounded-full border-4 border-primary/20 shadow-lg overflow-hidden">
            {/* Mercury fill */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-gradient-secondary transition-all duration-1000 ease-out rounded-b-full"
              style={{ height: `${percentage}%` }}
            >
              {/* Animated bubbles */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="animate-pulse absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/30 rounded-full" />
                <div className="animate-pulse delay-150 absolute top-6 left-1/3 w-1.5 h-1.5 bg-white/30 rounded-full" />
                <div className="animate-pulse delay-300 absolute top-10 right-1/3 w-1 h-1 bg-white/30 rounded-full" />
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
              {percentage.toFixed(0)}%
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