import { T } from "@/components/T";
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Target,
  CheckCircle,
  Clock,
  Flame,
  ArrowUp,
  DollarSign,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import {
  celebrateMilestone,
  celebrateRise,
  milestoneFor,
  MILESTONE_MESSAGES,
  type Milestone,
} from '@/lib/celebrate';
import { useCelebrationSounds } from '@/hooks/useCelebrationSounds';



interface ImprovedThermometerProps {
  paidAmountUSD: number;
  paidAmountKES: number;
  unpaidAmountUSD: number;
  unpaidAmountKES: number;
  goalAmountUSD?: number;
  className?: string;
}

const EXCHANGE_RATE = 128;

export function ImprovedThermometer({
  paidAmountUSD,
  paidAmountKES,
  unpaidAmountUSD,
  unpaidAmountKES,
  goalAmountUSD = 50000,
  className,
}: ImprovedThermometerProps) {
  const [displayPaidUSD, setDisplayPaidUSD] = useState(0);
  const [displayPaidKES, setDisplayPaidKES] = useState(0);
  const [displayUnpaidUSD, setDisplayUnpaidUSD] = useState(0);
  const [displayUnpaidKES, setDisplayUnpaidKES] = useState(0);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [riseAmount, setRiseAmount] = useState<number | null>(null);
  const { play: playCelebrationSound, youtubeEmbed } = useCelebrationSounds();

  const celebratedRef = useRef<Set<Milestone>>(new Set());
  const previousTotalRef = useRef<number | null>(null);


  const totalPledgedUSD = paidAmountUSD + unpaidAmountUSD;
  const totalPledgedKES = paidAmountKES + unpaidAmountKES;



  /** Count-up animation for the headline figures. */
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const startPaidUSD = displayPaidUSD;
    const startPaidKES = displayPaidKES;
    const startUnpaidUSD = displayUnpaidUSD;
    const startUnpaidKES = displayUnpaidKES;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const t = Math.min(step / steps, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayPaidUSD(startPaidUSD + (paidAmountUSD - startPaidUSD) * ease);
      setDisplayPaidKES(startPaidKES + (paidAmountKES - startPaidKES) * ease);
      setDisplayUnpaidUSD(startUnpaidUSD + (unpaidAmountUSD - startUnpaidUSD) * ease);
      setDisplayUnpaidKES(startUnpaidKES + (unpaidAmountKES - startUnpaidKES) * ease);
      if (t >= 1) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paidAmountUSD, paidAmountKES, unpaidAmountUSD, unpaidAmountKES]);

  const totalPledgedPercentage = goalAmountUSD > 0 ? (totalPledgedUSD / goalAmountUSD) * 100 : 0;
  const paidPercentage = goalAmountUSD > 0 ? (paidAmountUSD / goalAmountUSD) * 100 : 0;
  const displayPercentage = goalAmountUSD > 0 ? displayTotalUSD / goalAmountUSD * 100 : 0;
  const remainingPercentage = Math.max(0, 100 - displayPercentage);
  const displayTotalUSD = displayPaidUSD + displayUnpaidUSD;
  const displayTotalKES = displayPaidKES + displayUnpaidKES;
  const displayRemainingUSD = Math.max(0, goalAmountUSD - displayTotalUSD);
  const displayRemainingKES = displayRemainingUSD * EXCHANGE_RATE;

  /** React to live rises: floating "+$X" bubble and a small confetti pop. */
  useEffect(() => {
    const previous = previousTotalRef.current;
    previousTotalRef.current = totalPledgedUSD;
    if (previous === null || totalPledgedUSD <= previous) return;

    const delta = totalPledgedUSD - previous;
    setRiseAmount(delta);
    celebrateRise();
    const timeout = setTimeout(() => setRiseAmount(null), 4200);
    return () => clearTimeout(timeout);
  }, [totalPledgedUSD]);

  /** Milestone celebrations — each one fires once per visit. */
  useEffect(() => {
    const reached = milestoneFor(totalPledgedPercentage);
    if (!reached || celebratedRef.current.has(reached)) return;
    celebratedRef.current.add(reached);
    setMilestone(reached);
    // Admin-configured sound wins; otherwise fall back to the built-in cheer.
    const handledByAdminSound = playCelebrationSound(reached);
    celebrateMilestone(reached, { sound: !handledByAdminSound });
    const timeout = setTimeout(() => setMilestone(null), 9000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPledgedPercentage]);



  /** Keep the four goal markers fixed at their actual goal values, even after overfunding. */
  const maxScale = Math.max(goalAmountUSD, totalPledgedUSD > goalAmountUSD ? totalPledgedUSD * 1.15 : goalAmountUSD, 1);


  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(amount));

  const formatCompact = (amount: number) => {
    const n = Math.round(amount);
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  };

  const formatLabelUSD = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
    return `$${Math.round(value).toLocaleString()}`;
  };

  const formatLabelKES = (value: number) => {
    if (value >= 1_000_000) return `KSh ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `KSh ${(value / 1_000).toFixed(0)}K`;
    return `KSh ${Math.round(value).toLocaleString()}`;
  };

  const ticks = [0, 25, 50, 75, 100].map((percentOfGoal) => {
    const valueUSD = goalAmountUSD * percentOfGoal / 100;
    return {
      percentOfScale: valueUSD / maxScale * 100,
      labelUSD: formatLabelUSD(valueUSD),
      labelKES: formatLabelKES(valueUSD * EXCHANGE_RATE),
      quarterLabel: percentOfGoal ? `${percentOfGoal}%` : null,
      isQuarter: percentOfGoal > 0,
      reached: percentOfGoal > 0 && valueUSD <= displayTotalUSD,
      isNext: percentOfGoal > 0 && displayTotalUSD < valueUSD && displayTotalUSD >= valueUSD - goalAmountUSD / 4,
    };
  });

  const paidHeight = Math.min((displayPaidUSD / maxScale) * 100, 100);
  const unpaidHeight = Math.min((displayUnpaidUSD / maxScale) * 100, 100 - paidHeight);
  const totalHeight = Math.min(paidHeight + unpaidHeight, 100);
  const goalPosition = Math.min((goalAmountUSD / maxScale) * 100, 100);


  const progressLabel = `Fundraising progress: ${totalPledgedPercentage.toFixed(1)}% of goal. KSh ${formatAmount(
    totalPledgedKES
  )} pledged of a KSh ${formatAmount(goalAmountUSD * EXCHANGE_RATE)} goal (KSh ${formatAmount(
    paidAmountKES
  )} paid). KSh ${formatAmount(Math.max(0, goalAmountUSD - totalPledgedUSD) * EXCHANGE_RATE)} still needed.`;

  const cards = [
    {
      title: 'Campaign Goal',
      Icon: Trophy,
      gradient: 'from-navy to-navy-deep',
      usd: goalAmountUSD,
      kes: goalAmountUSD * EXCHANGE_RATE,
      subLabel: 'Target Amount',
      subValue: '100%',
      tint: 'text-primary-foreground/80',
    },
    {
      title: 'Total Pledged',
      Icon: Target,
      gradient: 'from-primary to-primary-dark',
      usd: displayPaidUSD + displayUnpaidUSD,
      kes: displayPaidKES + displayUnpaidKES,
      subLabel: 'Of Goal',
      subValue: `${displayPercentage.toFixed(1)}%`,
      tint: 'text-primary-foreground/80',
    },
    {
      title: 'Paid Pledges',
      Icon: CheckCircle,
      gradient: 'from-success to-success-light',
      usd: displayPaidUSD,
      kes: displayPaidKES,
      subLabel: 'Of Goal',
      subValue: `${(goalAmountUSD > 0 ? displayPaidUSD / goalAmountUSD * 100 : 0).toFixed(1)}%`,
      tint: 'text-success-foreground/80',
    },
    {
      title: 'Still Needed',
      Icon: ArrowUp,
      gradient: 'from-secondary to-secondary-dark',
      usd: displayRemainingUSD,
      kes: displayRemainingKES,
      subLabel: 'To Reach Goal',
      subValue: `${remainingPercentage.toFixed(1)}%`,
      tint: 'text-secondary-foreground/80',
    },
  ];

  return (
    <div className={cn('w-full max-w-7xl mx-auto py-8 px-4', className)}>
      <p className="sr-only" role="status" aria-live="polite">
        {progressLabel}
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-8 min-w-0">
        {cards.map(({ title, Icon, gradient, usd, kes, subLabel, subValue, tint }) => (
          <div
            key={title}
            className={cn(
               'relative overflow-hidden rounded-lg p-4 sm:p-5 text-primary-foreground shadow-xl ring-1 ring-primary-foreground/20 min-w-0',
              'bg-gradient-to-br transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl',
              gradient
            )}
          >
            <div className="relative flex flex-col items-center text-center min-w-0">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 min-w-0">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <h3 className="text-[clamp(0.8rem,1.4vw,1.125rem)] font-bold tracking-tight leading-tight">
                   <T>{title}</T>
                </h3>
              </div>

              <p className="mt-3 sm:mt-4 w-full text-[clamp(1.5rem,3.2vw,2.25rem)] font-black leading-none tabular-nums tracking-tight break-words">
                ${formatCompact(usd)}
              </p>
              <p
                className={cn(
                  'mt-1 sm:mt-2 w-full text-[clamp(0.75rem,1.2vw,0.95rem)] font-semibold tabular-nums leading-snug break-words',
                  tint
                )}
              >
                KSh {formatCompact(kes)}
              </p>

               <div className="mt-4 sm:mt-5 w-full border-t border-primary-foreground/25 pt-3 sm:pt-4">
                 <p className="text-xs font-medium uppercase text-primary-foreground/80">
                   <T>{subLabel}</T>
                </p>
                <p className="mt-1 text-[clamp(1.125rem,2.2vw,1.75rem)] font-black tabular-nums leading-none">
                  {subValue}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Milestone celebration banner */}
      {milestone && (
        <div className="mx-auto mb-6 max-w-3xl animate-milestone-pop rounded-2xl bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 p-[2px] shadow-2xl">
          <div className="rounded-[calc(1rem-2px)] bg-background/95 px-5 py-4 text-center">
            <p className="text-[clamp(1.05rem,2.4vw,1.6rem)] font-black leading-tight text-foreground">
              {MILESTONE_MESSAGES[milestone]}
            </p>
          </div>
        </div>
      )}

      {/* Live progress banner */}
      <div className="mx-auto mb-8 max-w-3xl rounded-2xl sm:rounded-3xl border border-primary/20 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-emerald-500/10 px-4 sm:px-6 py-5 sm:py-6 text-center shadow-md">
        <p className="text-sm sm:text-base font-bold uppercase tracking-[0.18em] text-muted-foreground">
          <T>{"Live Progress"}</T>
        </p>

        <p className="mt-1 text-[clamp(1.75rem,5vw,3rem)] font-black leading-none tabular-nums text-foreground">
           {displayPercentage.toFixed(1)}%
        </p>
        <p className="mt-2 text-sm sm:text-base font-semibold text-foreground/80 leading-tight">
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

      {/* Thermometer panel */}
      <div className="rounded-3xl border border-border/70 bg-gradient-to-b from-card to-muted/40 p-4 sm:p-8 shadow-xl">
      {/* Currency headers */}
      <div className="mx-auto grid max-w-4xl grid-cols-[1fr_auto_1fr] items-end gap-3 sm:gap-8 mb-8 sm:mb-10">

        <div className="flex items-center justify-end gap-2 text-primary font-bold">
          <DollarSign className="h-5 w-5 shrink-0" />
          <span className="text-sm sm:text-lg whitespace-nowrap"><T>{"US Dollars"}</T></span>
        </div>
        <div className="w-20" />
        <div className="flex items-center justify-start gap-2 text-success font-bold">
          <TrendingUp className="h-5 w-5 shrink-0" />
          <span className="text-sm sm:text-lg whitespace-nowrap"><T>{"Kenya Shillings"}</T></span>
        </div>
      </div>

      {/* Thermometer with aligned bottom-up calibration */}
      <div className="mx-auto mt-2 grid max-w-4xl grid-cols-[1fr_auto_1fr] gap-3 sm:gap-8">

        {/* USD scale (left) */}
        <div className="relative h-[420px] lg:h-[560px]">
          {ticks.map((tick) => (
            <div
              key={tick.percentOfScale}
               className="absolute right-0 flex -translate-y-1/2 items-center justify-end gap-1 sm:gap-2 transition-all duration-700 ease-out"
              style={{ bottom: `${tick.percentOfScale}%` }}
            >
              <span
                className={cn(
                  'rounded-md bg-card/85 px-1.5 py-0.5 tabular-nums leading-none whitespace-nowrap backdrop-blur-sm transition-all duration-700 ease-out',
                  tick.isQuarter
                    ? 'text-sm sm:text-base font-black'
                    : 'text-[0.7rem] sm:text-sm font-semibold',
                   tick.reached
                     ? 'text-success'
                    : tick.isQuarter
                    ? 'text-foreground'
                    : 'text-muted-foreground',
                   tick.isNext && 'animate-tick-beckon text-primary'
                )}
              >
                {tick.labelUSD}
              </span>

              <div
                className={cn(
                  'rounded-full transition-all duration-700 ease-out',
                   tick.reached
                     ? 'h-[3px] w-8 bg-success'
                    : tick.isQuarter
                     ? 'h-[3px] w-6 bg-primary'
                    : 'h-[2px] w-3 bg-border',
                   tick.isNext && 'h-[3px] w-7 animate-tick-beckon bg-primary'
                )}
              />
            </div>
          ))}

        </div>

        {/* Tube */}
        <div className="relative">
          <div
            className={cn(
               'relative h-[420px] w-16 sm:w-20 overflow-hidden rounded-full border-[3px] border-border bg-card shadow-xl lg:h-[560px]',
              totalPledgedPercentage >= 100 && 'animate-goal-glow'
            )}
            role="progressbar"
             aria-valuenow={Math.min(Math.round(totalPledgedUSD), Math.round(goalAmountUSD))}
            aria-valuemin={0}
            aria-valuemax={Math.round(goalAmountUSD)}
            aria-valuetext={progressLabel}
            aria-label="Fundraising progress toward goal"
          >
            {/* Glass reflections */}
             <div className="absolute left-1 top-0 bottom-0 z-10 w-4 rounded-full bg-gradient-to-r from-primary-foreground/40 to-transparent" />

            {/* Still-needed zone (orange, matches the Still Needed card) */}
            <div
               className="absolute left-0 right-0 top-0 bg-secondary/15 transition-all duration-1000 ease-out"
              style={{ height: `${100 - totalHeight}%` }}
            />

            {/* Unpaid pledges (blue, matches the Total Pledged card) */}
            {unpaidAmountUSD > 0 && (
              <div
                 className="absolute left-0 right-0 z-20 overflow-hidden bg-primary transition-all duration-1000 ease-out"
                style={{ bottom: `${paidHeight}%`, height: `${unpaidHeight}%` }}
              >
                 <div className="absolute left-0 right-0 top-0 h-3 rounded-b-full bg-primary-light" />
                <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.55)_50%,transparent_65%)] bg-[length:200%_100%]" />
              </div>
            )}

            {/* Paid pledges (emerald, matches the Paid Pledges card) */}
            {paidAmountUSD > 0 && (
              <div
                 className="absolute bottom-0 left-0 right-0 z-[15] overflow-hidden rounded-t-full bg-success transition-all duration-1000 ease-out"
                style={{ height: `${paidHeight}%` }}
              >
                 <div className="absolute left-0 right-0 top-0 h-3 animate-mercury-pulse rounded-t-full bg-success-light" />
                <div className="absolute left-0 right-0 top-0 h-1/3 rounded-t-full bg-gradient-to-b from-emerald-200/60 to-transparent" />
                <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.5)_50%,transparent_65%)] bg-[length:200%_100%]" />
                {paidHeight > 10 && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute bottom-8 left-3 h-1.5 w-1.5 animate-float rounded-full bg-white/60" />
                    <div
                      className="absolute bottom-16 right-4 h-1 w-1 animate-float rounded-full bg-white/70"
                      style={{ animationDelay: '0.7s' }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Calibration ticks inside the tube — they light up as the level passes them */}
            {ticks.map((tick) => {
              const bar = cn(
                'rounded-full transition-all duration-700 ease-out',
                tick.reached
                  ? tick.isQuarter
                    ? 'h-[3px] w-6 bg-white/90'
                    : 'h-[2px] w-3 bg-white/70'
                  : tick.isQuarter
                  ? 'h-[3px] w-5 bg-foreground/70'
                  : 'h-[2px] w-2.5 bg-foreground/30',
                tick.isNext && 'animate-tick-beckon'
              );
              return (
                <div
                  key={tick.percentOfScale}
                  className="absolute left-0 right-0 z-30 flex items-center justify-between px-1"
                  style={{ bottom: `${tick.percentOfScale}%` }}
                >
                  <div className={bar} />
                  <div className={bar} />
                </div>
              );
            })}


             {/* Goal line at the campaign's actual 100% value */}
            <div
               className="absolute left-0 right-0 z-30 border-t-2 border-dashed border-navy"
              style={{ bottom: `${goalPosition}%` }}
            />
          </div>

          {/* Bulb */}
           <div className="relative z-30 -mt-3 mx-auto h-20 w-20 sm:h-24 sm:w-24 animate-mercury-pulse overflow-hidden rounded-full border-4 border-card bg-success shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-300/40 to-transparent" />
             <div className="absolute inset-0 flex items-center justify-center">
               <Flame className="h-10 w-10 text-success-foreground" />
            </div>
          </div>
        </div>

        {/* KES scale (right) */}
        <div className="relative h-[420px] lg:h-[560px]">
          {ticks.map((tick) => {
            return (
            <div
              key={tick.percentOfScale}
               className="absolute left-0 flex -translate-y-1/2 items-center justify-start gap-1 sm:gap-2 transition-all duration-700 ease-out"
              style={{ bottom: `${tick.percentOfScale}%` }}
            >

              <div
                className={cn(
                  'rounded-full transition-all duration-700 ease-out',
                  tick.reached
                     ? 'h-[3px] w-8 bg-success'
                    : tick.isQuarter
                     ? 'h-[3px] w-6 bg-success/70'
                    : 'h-[2px] w-3 bg-border',
                   tick.isNext && 'h-[3px] w-7 animate-tick-beckon bg-primary'
                )}
              />
              <span
                className={cn(
                  'rounded-md bg-card/85 px-1.5 py-0.5 tabular-nums leading-none whitespace-nowrap backdrop-blur-sm transition-all duration-700 ease-out',
                  tick.isQuarter
                    ? 'text-sm sm:text-base font-black'
                    : 'text-[0.7rem] sm:text-sm font-semibold',
                  tick.reached
                     ? 'text-success'
                    : tick.isQuarter
                    ? 'text-foreground'
                    : 'text-muted-foreground',
                   tick.isNext && 'animate-tick-beckon text-primary'
                )}
              >
                {tick.labelKES}
              </span>
              {tick.quarterLabel && (
                <span
                  className={cn(
                     'shrink-0 rounded-md px-1 sm:px-2 py-0.5 text-xs font-black transition-colors duration-700',
                    tick.reached
                       ? 'bg-success text-success-foreground shadow-sm'
                       : 'bg-accent text-accent-foreground'
                  )}
                >
                  {tick.quarterLabel}
                </span>
              )}
            </div>
            );
          })}

        </div>
      </div>
      </div>

       {/* Current pledge level and remaining gap stay with the changing total. */}
       <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold tabular-nums">
         <span className="rounded-md bg-primary px-3 py-2 text-primary-foreground"><T>{"Total pledged"}</T>: ${formatCompact(displayTotalUSD)} · KSh {formatCompact(displayTotalKES)}</span>
         <span className="rounded-md bg-secondary px-3 py-2 text-secondary-foreground"><T>{"Still needed"}</T>: ${formatCompact(displayRemainingUSD)} · KSh {formatCompact(displayRemainingKES)}</span>
         {riseAmount !== null && <span className="animate-rise-bubble text-success">+${formatCompact(riseAmount)} <T>{"just pledged"}</T></span>}
       </div>


      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {paidAmountUSD > 0 && (
           <div className="flex items-center gap-2 rounded-md bg-success px-5 py-2.5 text-success-foreground shadow-lg">
            <CheckCircle className="h-5 w-5" />
            <span className="text-lg font-bold tabular-nums">Paid: ${formatCompact(paidAmountUSD)}</span>
          </div>
        )}
        {unpaidAmountUSD > 0 && (
           <div className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-primary-foreground shadow-lg">
            <Clock className="h-5 w-5" />
            <span className="text-lg font-bold tabular-nums">
              Pledged, unpaid: ${formatCompact(unpaidAmountUSD)}
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
          <div className="h-4 w-4 rounded-full bg-emerald-500" />
          <span className="text-base font-semibold text-foreground"><T>{"Paid pledges"}</T></span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
          <div className="h-4 w-4 rounded-full bg-blue-500" />
          <span className="text-base font-semibold text-foreground"><T>{"Pledged, not yet paid"}</T></span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
          <div className="h-4 w-4 rounded-full bg-orange-400" />
          <span className="text-base font-semibold text-foreground"><T>{"Still needed"}</T></span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
          <div className="w-5 border-t-2 border-dashed border-purple-600" />
          <span className="text-base font-semibold text-foreground"><T>{"Goal line"}</T></span>
        </div>
      </div>

      {/* Admin-configured YouTube celebration sound (audio only) */}
      {youtubeEmbed && (
        <iframe
          title="Celebration sound"
          src={youtubeEmbed}
          allow="autoplay"
          className="pointer-events-none absolute h-px w-px opacity-0"
          aria-hidden="true"
        />
      )}



      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-8px) scale(1.05); opacity: 1; }
        }
        .animate-float { animation: float 2.5s ease-in-out infinite; }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -100% 0; }
        }
        .animate-shimmer { animation: shimmer 3.2s linear infinite; }
        @keyframes mercuryPulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.25); }
        }
        .animate-mercury-pulse { animation: mercuryPulse 2s ease-in-out infinite; }
        @keyframes goalGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.45); }
          50% { box-shadow: 0 0 34px 8px rgba(16,185,129,0.55); }
        }
        .animate-goal-glow { animation: goalGlow 2.2s ease-in-out infinite; }
        @keyframes riseBubble {
          0% { transform: translateY(10px) scale(0.9); opacity: 0; }
          15% { transform: translateY(0) scale(1); opacity: 1; }
          80% { transform: translateY(-6px) scale(1); opacity: 1; }
          100% { transform: translateY(-16px) scale(0.95); opacity: 0; }
        }
        .animate-rise-bubble { animation: riseBubble 4.2s ease-out forwards; }
        @keyframes milestonePop {
          0% { transform: scale(0.94); opacity: 0; }
          60% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-milestone-pop { animation: milestonePop 0.6s ease-out; }
        @keyframes tickBeckon {
          0%, 100% { opacity: 0.55; transform: translateX(0); }
          50% { opacity: 1; transform: translateX(2px); }
        }
        .animate-tick-beckon { animation: tickBeckon 1.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-float, .animate-shimmer, .animate-mercury-pulse, .animate-goal-glow,
          .animate-rise-bubble, .animate-milestone-pop, .animate-tick-beckon { animation: none; }
        }

      `}</style>
    </div>
  );
}
