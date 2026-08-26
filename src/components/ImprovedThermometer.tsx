import { useEffect, useMemo, useRef, useState } from 'react';
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
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  celebrateMilestone,
  celebrateRise,
  isCelebrationMuted,
  setCelebrationMuted,
  milestoneFor,
  MILESTONE_MESSAGES,
  type Milestone,
} from '@/lib/celebrate';

interface ImprovedThermometerProps {
  paidAmountUSD: number;
  paidAmountKES: number;
  unpaidAmountUSD: number;
  unpaidAmountKES: number;
  goalAmountUSD?: number;
  className?: string;
}

const EXCHANGE_RATE = 128;

/** Palette shared with the four summary cards so the tube always matches them. */
const COLORS = {
  goal: 'purple',
  pledged: 'blue',
  paid: 'emerald',
  needed: 'orange',
} as const;

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
  const [muted, setMuted] = useState(false);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [riseAmount, setRiseAmount] = useState<number | null>(null);

  const celebratedRef = useRef<Set<Milestone>>(new Set());
  const previousTotalRef = useRef<number | null>(null);

  const totalPledgedUSD = paidAmountUSD + unpaidAmountUSD;
  const totalPledgedKES = paidAmountKES + unpaidAmountKES;

  useEffect(() => {
    setMuted(isCelebrationMuted());
  }, []);

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
  const remainingPercentage = Math.max(0, 100 - totalPledgedPercentage);
  const remainingAmountUSD = Math.max(0, goalAmountUSD - totalPledgedUSD);
  const remainingAmountKES = Math.max(0, goalAmountUSD * EXCHANGE_RATE - totalPledgedKES);

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
    celebrateMilestone(reached);
    const timeout = setTimeout(() => setMilestone(null), 9000);
    return () => clearTimeout(timeout);
  }, [totalPledgedPercentage]);

  const toggleMuted = () => {
    const next = !muted;
    setMuted(next);
    setCelebrationMuted(next);
  };

  /** Animated totals drive the scale so the calibration breathes with each gift. */
  const displayTotalUSD = displayPaidUSD + displayUnpaidUSD;

  /** Scale top: the goal, or a little above the total when the goal is beaten. */
  const maxScale = useMemo(
    () => Math.max(goalAmountUSD, displayTotalUSD * 1.15, 1),
    [goalAmountUSD, displayTotalUSD]
  );


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

  /** Bottom-up calibration: a tick every 10% of the live scale, bold at the quarters. */
  const ticks = useMemo(() => {
    const all = Array.from({ length: 11 }, (_, i) => {
      const percentOfScale = i * 10;
      const valueUSD = (maxScale * percentOfScale) / 100;
      const percentOfGoal = goalAmountUSD > 0 ? (valueUSD / goalAmountUSD) * 100 : 0;
      const isQuarter = [25, 50, 75, 100].some((q) => Math.abs(percentOfGoal - q) < 3.5);
      return {
        percentOfScale,
        valueUSD,
        valueKES: valueUSD * EXCHANGE_RATE,
        labelUSD: formatLabelUSD(valueUSD),
        labelKES: formatLabelKES(valueUSD * EXCHANGE_RATE),
        isQuarter,
        quarterLabel: isQuarter ? `${Math.round(percentOfGoal / 25) * 25}%` : null,
        reached: valueUSD > 0 && valueUSD <= displayTotalUSD,
        isNext: false,
      };
    });
    const next = all.find((t) => t.valueUSD > displayTotalUSD);
    if (next) next.isNext = true;
    return all;
  }, [maxScale, goalAmountUSD, displayTotalUSD]);

  const paidHeight = Math.min((displayPaidUSD / maxScale) * 100, 100);
  const unpaidHeight = Math.min((displayUnpaidUSD / maxScale) * 100, 100 - paidHeight);
  const totalHeight = Math.min(paidHeight + unpaidHeight, 100);
  const goalPosition = Math.min((goalAmountUSD / maxScale) * 100, 100);


  const progressLabel = `Fundraising progress: ${totalPledgedPercentage.toFixed(1)}% of goal. KSh ${formatAmount(
    totalPledgedKES
  )} pledged of a KSh ${formatAmount(goalAmountUSD * EXCHANGE_RATE)} goal (KSh ${formatAmount(
    paidAmountKES
  )} paid). KSh ${formatAmount(remainingAmountKES)} still needed.`;

  const cards = [
    {
      title: 'Campaign Goal',
      Icon: Trophy,
      gradient: 'from-purple-500 to-purple-700',
      usd: goalAmountUSD,
      kes: goalAmountUSD * EXCHANGE_RATE,
      subLabel: 'Target Amount',
      subValue: '100%',
      tint: 'text-purple-100',
    },
    {
      title: 'Total Pledged',
      Icon: Target,
      gradient: 'from-blue-500 to-blue-700',
      usd: displayPaidUSD + displayUnpaidUSD,
      kes: displayPaidKES + displayUnpaidKES,
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
              'relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-xl ring-1 ring-white/20 min-w-0',
              'bg-gradient-to-br transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl',
              gradient
            )}
          >
            <div className="absolute -right-8 -top-8 h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-white/10 blur-xl" />
            <div className="relative flex flex-col items-center text-center min-w-0">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 min-w-0">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <h3 className="text-[clamp(0.8rem,1.4vw,1.125rem)] font-bold tracking-tight leading-tight">
                  {title}
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

              <div className="mt-4 sm:mt-5 w-full border-t border-white/25 pt-3 sm:pt-4">
                <p className="text-[clamp(0.65rem,1vw,0.75rem)] font-medium uppercase tracking-wide text-white/80">
                  {subLabel}
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
      <div className="mx-auto mb-8 max-w-3xl rounded-2xl sm:rounded-3xl border border-primary/20 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-emerald-500/10 px-4 sm:px-6 py-4 sm:py-5 text-center shadow-md">
        <div className="flex items-center justify-center gap-3">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Live Progress
          </p>
          <button
            type="button"
            onClick={toggleMuted}
            aria-label={muted ? 'Turn celebration sounds on' : 'Turn celebration sounds off'}
            className="rounded-full border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-[clamp(1.75rem,5vw,3rem)] font-black leading-none tabular-nums text-foreground">
          {totalPledgedPercentage.toFixed(1)}%
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
      <div className="mx-auto grid max-w-4xl grid-cols-[1fr_auto_1fr] items-end gap-3 sm:gap-6 mb-4">

        <div className="flex items-center justify-end gap-2 text-blue-600 font-bold">
          <DollarSign className="h-5 w-5" />
          <span className="text-sm sm:text-lg">US Dollars</span>
        </div>
        <div className="w-20" />
        <div className="flex items-center justify-start gap-2 text-emerald-600 font-bold">
          <TrendingUp className="h-5 w-5" />
          <span className="text-sm sm:text-lg">Kenya Shillings</span>
        </div>
      </div>

      {/* Thermometer with aligned bottom-up calibration */}
      <div className="mx-auto grid max-w-4xl grid-cols-[1fr_auto_1fr] gap-3 sm:gap-6">
        {/* USD scale (left) */}
        <div className="relative h-[420px] lg:h-[560px]">
          {ticks.map((tick) => (
            <div
              key={tick.percentOfScale}
              className="absolute right-0 flex -translate-y-1/2 items-center justify-end gap-2 transition-all duration-700 ease-out"
              style={{ bottom: `${tick.percentOfScale}%` }}
            >
              <span
                className={cn(
                  'tabular-nums leading-none transition-all duration-700 ease-out',
                  tick.isQuarter
                    ? 'text-sm sm:text-base font-black'
                    : 'text-[0.7rem] sm:text-sm font-semibold',
                  tick.reached
                    ? 'scale-[1.06] text-emerald-600 drop-shadow-[0_1px_6px_rgba(16,185,129,0.35)]'
                    : tick.isQuarter
                    ? 'text-foreground'
                    : 'text-muted-foreground',
                  tick.isNext && 'animate-tick-beckon text-blue-600'
                )}
              >
                {tick.labelUSD}
              </span>
              <div
                className={cn(
                  'rounded-full transition-all duration-700 ease-out',
                  tick.reached
                    ? 'h-[3px] w-8 bg-emerald-500'
                    : tick.isQuarter
                    ? 'h-[3px] w-6 bg-blue-500'
                    : 'h-[2px] w-3 bg-border',
                  tick.isNext && 'h-[3px] w-7 animate-tick-beckon bg-blue-500'
                )}
              />
            </div>
          ))}

        </div>

        {/* Tube */}
        <div className="relative">
          <div
            className={cn(
              'relative h-[420px] w-20 overflow-hidden rounded-full border-[3px] border-border bg-gradient-to-b from-white to-gray-100 shadow-2xl lg:h-[560px]',
              totalPledgedPercentage >= 100 && 'animate-goal-glow'
            )}
            role="progressbar"
            aria-valuenow={Math.round(totalPledgedUSD)}
            aria-valuemin={0}
            aria-valuemax={Math.round(goalAmountUSD)}
            aria-valuetext={progressLabel}
            aria-label="Fundraising progress toward goal"
          >
            {/* Glass reflections */}
            <div className="absolute left-1 top-0 bottom-0 z-10 w-4 rounded-full bg-gradient-to-r from-white/70 to-transparent" />
            <div className="absolute right-1 top-0 bottom-0 z-10 w-2 rounded-full bg-gradient-to-l from-white/30 to-transparent" />

            {/* Still-needed zone (orange, matches the Still Needed card) */}
            <div
              className="absolute left-0 right-0 top-0 bg-gradient-to-b from-orange-100 to-orange-50/40 transition-all duration-1000 ease-out"
              style={{ height: `${100 - totalHeight}%` }}
            />

            {/* Unpaid pledges (blue, matches the Total Pledged card) */}
            {unpaidAmountUSD > 0 && (
              <div
                className="absolute left-0 right-0 z-20 overflow-hidden bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 transition-all duration-1000 ease-out"
                style={{ bottom: `${paidHeight}%`, height: `${unpaidHeight}%` }}
              >
                <div className="absolute left-0 right-0 top-0 h-3 rounded-b-full bg-blue-300" />
                <div className="absolute left-0 right-0 top-0 h-1/3 bg-gradient-to-b from-blue-200/50 to-transparent" />
                <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.55)_50%,transparent_65%)] bg-[length:200%_100%]" />
              </div>
            )}

            {/* Paid pledges (emerald, matches the Paid Pledges card) */}
            {paidAmountUSD > 0 && (
              <div
                className="absolute bottom-0 left-0 right-0 z-[15] overflow-hidden rounded-t-full bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 transition-all duration-1000 ease-out"
                style={{ height: `${paidHeight}%` }}
              >
                <div className="absolute left-0 right-0 top-0 h-3 animate-mercury-pulse rounded-t-full bg-emerald-300" />
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


            {/* Goal line (purple, matches the Campaign Goal card) */}
            <div
              className="absolute left-0 right-0 z-30 border-t-2 border-dashed border-purple-600"
              style={{ bottom: `${goalPosition}%` }}
            />
          </div>

          {/* Live level badge riding the mercury */}
          <div
            className="pointer-events-none absolute left-full z-40 ml-3 transition-all duration-1000 ease-out"
            style={{ bottom: `calc(${totalHeight}% - 1.25rem)` }}
          >
            <div className="flex flex-col items-start gap-0.5 whitespace-nowrap rounded-2xl bg-foreground px-4 py-2 text-background shadow-xl ring-1 ring-white/20">
              <span className="flex items-center gap-1.5 text-base font-black tabular-nums">
                <Flame className="h-4 w-4" />${formatCompact(displayTotalUSD)}
              </span>
              <span className="text-[0.7rem] font-semibold tabular-nums opacity-80">
                KSh {formatCompact(displayPaidKES + displayUnpaidKES)}
              </span>
            </div>

            {riseAmount !== null && (
              <div className="mt-2 animate-rise-bubble whitespace-nowrap rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-black text-white shadow-lg">
                +${formatCompact(riseAmount)} just in!
              </div>
            )}
          </div>

          {/* Bulb */}
          <div className="relative z-30 -mt-3 mx-auto h-24 w-24 animate-mercury-pulse overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-300/40 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Flame className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>

        {/* KES scale (right) */}
        <div className="relative h-[420px] lg:h-[560px]">
          {ticks.map((tick) => (
            <div
              key={tick.percentOfScale}
              className="absolute left-0 flex -translate-y-1/2 items-center justify-start gap-2 transition-all duration-700 ease-out"
              style={{ bottom: `${tick.percentOfScale}%` }}
            >
              <div
                className={cn(
                  'rounded-full transition-all duration-700 ease-out',
                  tick.reached
                    ? 'h-[3px] w-8 bg-emerald-500'
                    : tick.isQuarter
                    ? 'h-[3px] w-6 bg-emerald-500/70'
                    : 'h-[2px] w-3 bg-border',
                  tick.isNext && 'h-[3px] w-7 animate-tick-beckon bg-blue-500'
                )}
              />
              <span
                className={cn(
                  'tabular-nums leading-none transition-all duration-700 ease-out',
                  tick.isQuarter
                    ? 'text-sm sm:text-base font-black'
                    : 'text-[0.7rem] sm:text-sm font-semibold',
                  tick.reached
                    ? 'scale-[1.06] text-emerald-600 drop-shadow-[0_1px_6px_rgba(16,185,129,0.35)]'
                    : tick.isQuarter
                    ? 'text-foreground'
                    : 'text-muted-foreground',
                  tick.isNext && 'animate-tick-beckon text-blue-600'
                )}
              >
                {tick.labelKES}
              </span>
              {tick.quarterLabel && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[0.65rem] font-black transition-colors duration-700',
                    tick.reached
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-purple-100 text-purple-700'
                  )}
                >
                  {tick.quarterLabel}
                </span>
              )}
            </div>

          ))}
        </div>
      </div>
      </div>

      {/* Amount chips */}


      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {paidAmountUSD > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow-lg">
            <CheckCircle className="h-5 w-5" />
            <span className="text-lg font-bold tabular-nums">Paid: ${formatCompact(paidAmountUSD)}</span>
          </div>
        )}
        {unpaidAmountUSD > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-white shadow-lg">
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
          <span className="text-base font-semibold text-foreground">Paid pledges</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
          <div className="h-4 w-4 rounded-full bg-blue-500" />
          <span className="text-base font-semibold text-foreground">Pledged, not yet paid</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
          <div className="h-4 w-4 rounded-full bg-orange-400" />
          <span className="text-base font-semibold text-foreground">Still needed</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
          <div className="w-5 border-t-2 border-dashed border-purple-600" />
          <span className="text-base font-semibold text-foreground">Goal line</span>
        </div>
      </div>

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
