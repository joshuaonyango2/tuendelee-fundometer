import { useEffect, useState } from "react";
import { cn } from "@/lib/utils"; // keep your cn utility, or replace with classnames

interface FundraisingThermometerProps {
  /** Amount already paid (in primary currency) */
  paidAmount: number;
  /** Amount pledged but not yet paid */
  unpaidAmount: number;
  /** Fundraising goal (in primary currency) */
  goalAmount: number;
  /** Primary currency code, e.g. "USD" */
  primaryCurrency: string;
  /** Secondary currency code, e.g. "KES" */
  secondaryCurrency: string;
  /** Exchange rate: 1 primary = X secondary */
  exchangeRate: number;
  /** Optional extra Tailwind classes for the wrapper */
  className?: string;
}

/**
 * Formats a number with optional abbreviation (K, M, B) and currency symbol.
 */
function formatAmount(
  amount: number,
  currency: string,
  useAbbrev = true
): string {
  let abbrev = "";
  let value = amount;

  if (useAbbrev) {
    if (amount >= 1_000_000_000) {
      value = amount / 1_000_000_000;
      abbrev = "B";
    } else if (amount >= 1_000_000) {
      value = amount / 1_000_000;
      abbrev = "M";
    } else if (amount >= 1_000) {
      value = amount / 1_000;
      abbrev = "K";
    }
  }

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: value < 10 ? 1 : 0,
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value);

  if (currency === "USD") return `$${formatted}${abbrev}`;
  return `${currency} ${formatted}${abbrev}`;
}

/**
 * Main thermometer component
 */
export function FundraisingThermometer({
  paidAmount,
  unpaidAmount,
  goalAmount,
  primaryCurrency,
  secondaryCurrency,
  exchangeRate,
  className,
}: FundraisingThermometerProps) {
  /* ------------------------------------------------------------------ */
  /*  State for smooth animation of the displayed numbers                */
  /* ------------------------------------------------------------------ */
  const [displayPaid, setDisplayPaid] = useState(0);
  const [displayUnpaid, setDisplayUnpaid] = useState(0);

  const totalPledges = paidAmount + unpaidAmount;
  const paidPct = Math.min((paidAmount / goalAmount) * 100, 100);
  const totalPct = Math.min((totalPledges / goalAmount) * 100, 100);
  const unpaidPct = totalPct - paidPct;

  // Animate displayed amounts
  useEffect(() => {
    const duration = 2000; // ms
    const steps = 60;
    const paidInc = paidAmount / steps;
    const unpaidInc = unpaidAmount / steps;
    let curPaid = 0;
    let curUnpaid = 0;

    const timer = setInterval(() => {
      curPaid += paidInc;
      curUnpaid += unpaidInc;
      if (curPaid >= paidAmount && curUnpaid >= unpaidAmount) {
        setDisplayPaid(paidAmount);
        setDisplayUnpaid(unpaidAmount);
        clearInterval(timer);
      } else {
        setDisplayPaid(Math.min(curPaid, paidAmount));
        setDisplayUnpaid(Math.min(curUnpaid, unpaidAmount));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [paidAmount, unpaidAmount]);

  /* ------------------------------------------------------------------ */
  /*  Motivational message based on total progress                      */
  /* ------------------------------------------------------------------ */
  const motivationalMessage = (() => {
    if (totalPct >= 100) return "Goal Achieved! Thank you!";
    if (totalPct >= 75) return "We're almost there! Keep going!";
    if (totalPct >= 50) return "Halfway to our goal!";
    if (totalPct >= 25) return "Great start! Let's keep the momentum!";
    return "Every contribution counts!";
  })();

  /* ------------------------------------------------------------------ */
  /*  Currency conversions for secondary labels                         */
  /* ------------------------------------------------------------------ */
  const secPaid = paidAmount * exchangeRate;
  const secTotal = totalPledges * exchangeRate;
  const secGoal = goalAmount * exchangeRate;

  return (
    <div
      className={cn("w-full max-w-md mx-auto", className)}
      role="region"
      aria-label="Fundraising progress thermometer"
    >
      {/* ---------- Header (total pledged + % complete) ---------- */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          {formatAmount(displayPaid + displayUnpaid, primaryCurrency)}
        </h3>
        <p className="text-muted-foreground mt-1">
          pledged of {formatAmount(goalAmount, primaryCurrency)} goal
        </p>
        <p className="text-lg font-semibold text-primary mt-2">
          {totalPct.toFixed(1)}% Complete
        </p>

        {/* Paid / Unpaid breakdown */}
        <div className="mt-4 text-sm text-muted-foreground space-y-1">
          <p>
            Paid: {formatAmount(displayPaid, primaryCurrency)} (
            {formatAmount(secPaid, secondaryCurrency)})
          </p>
          <p>
            Unpaid: {formatAmount(displayUnpaid, primaryCurrency)} (
            {formatAmount(secTotal - secPaid, secondaryCurrency)})
          </p>
          <p>
            Total Pledges: {formatAmount(displayPaid + displayUnpaid, primaryCurrency)} (
            {formatAmount(secTotal, secondaryCurrency)})
          </p>
        </div>
      </div>

      {/* ---------- Thermometer visual ---------- */}
      <div className="relative h-96 flex items-center justify-center">
        {/* Tube (glass) */}
        <div
          className="relative w-14 h-80 bg-white rounded-t-full border-2 border-gray-300 shadow-lg overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(totalPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress ${totalPct.toFixed(1)}% of goal`}
        >
          {/* ---- Paid fill (green, solid) ---- */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-green-500 transition-all duration-1000 ease-out"
            style={{ height: `${paidPct}%` }}
          />

          {/* ---- Unpaid fill (light-yellow, optional stripes) ---- */}
          <div
            className={cn(
              "absolute left-0 right-0 bg-yellow-100 transition-all duration-1000 ease-out",
              "bg-stripes-unpaid" // comment out if you don't have the Tailwind pattern
            )}
            style={{
              bottom: `${paidPct}%`,
              height: `${unpaidPct}%`,
            }}
          />

          {/* ---- Meniscus (curved top for total) ---- */}
          <div
            className="absolute left-0 right-0 bg-yellow-100 rounded-t-full overflow-hidden"
            style={{
              bottom: `${totalPct}%`,
              height: "1rem",
              transform: "translateY(-50%)",
            }}
          >
            {/* tiny semi-circle to create the meniscus effect */}
            <div className="absolute inset-x-0 top-0 h-2 bg-white rounded-t-full opacity-30" />
          </div>

          {/* ---- Tick marks (calibrated to goal) ---- */}
          {[0, 25, 50, 75, 100].map((mark) => (
            <div
              key={mark}
              className="absolute right-0 w-3 border-t-2 border-gray-400"
              style={{ bottom: `${mark}%` }}
            />
          ))}
        </div>

        {/* ---- Bulb at bottom (green) ---- */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-green-500 rounded-full border-2 border-gray-300 shadow-lg" />

        {/* ---------- Dynamic horizontal labels ---------- */}
        {/* Goal (top) */}
        <LabelRow
          bottomPct={100}
          left={formatAmount(goalAmount, primaryCurrency)}
          right={formatAmount(secGoal, secondaryCurrency)}
          leftColor="text-gray-600"
          rightColor="text-gray-600"
          lineColor="border-gray-400"
        />

        {/* Total pledge level (meniscus) */}
        <LabelRow
          bottomPct={totalPct}
          left={formatAmount(totalPledges, primaryCurrency)}
          right={formatAmount(secTotal, secondaryCurrency)}
          leftColor="text-blue-600"
          rightColor="text-green-600"
          lineColor="border-blue-500"
        />

        {/* Paid level */}
        <LabelRow
          bottomPct={paidPct}
          left={formatAmount(paidAmount, primaryCurrency)}
          right={formatAmount(secPaid, secondaryCurrency)}
          leftColor="text-green-600"
          rightColor="text-green-600"
          lineColor="border-green-500"
        />

        {/* Zero (bottom) */}
        <LabelRow
          bottomPct={0}
          left="$0"
          right={`${secondaryCurrency} 0`}
          leftColor="text-gray-600"
          rightColor="text-gray-600"
          lineColor="border-gray-400"
        />
      </div>

      {/* ---------- Motivational message ---------- */}
      <div className="text-center mt-8 p-4 bg-accent rounded-lg">
        <p className="text-lg font-semibold text-accent-foreground animate-pulse">
          {motivationalMessage}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helper component – one horizontal label row (left / line / right)   */
/* ------------------------------------------------------------------ */
function LabelRow({
  bottomPct,
  left,
  right,
  leftColor,
  rightColor,
  lineColor,
}: {
  bottomPct: number;
  left: string;
  right: string;
  leftColor: string;
  rightColor: string;
  lineColor: string;
}) {
  return (
    <div
      className="absolute flex items-center w-full px-10"
      style={{
        bottom: `${bottomPct}%`,
        transform: "translateY(50%)",
      }}
    >
      {/* Left amount */}
      <div className={cn("font-medium pr-2", leftColor)}>{left}</div>

      {/* Central line */}
      <div className={cn("flex-1 border-t-2", lineColor)} />

      {/* Small coloured tick */}
      <div className={cn("w-4 border-t-2", lineColor)} />

      {/* Right amount */}
      <div className={cn("flex-1 border-t-2", lineColor)} />
      <div className={cn("font-medium pl-2", rightColor)}>{right}</div>
    </div>
  );
}
