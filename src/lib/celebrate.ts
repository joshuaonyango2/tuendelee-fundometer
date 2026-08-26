import confetti from "canvas-confetti";

const MUTE_KEY = "fundometer_celebration_muted";

export const MILESTONES = [25, 50, 75, 100] as const;
export type Milestone = (typeof MILESTONES)[number];

export function isCelebrationMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setCelebrationMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "true" : "false");
  } catch {
    // ignore storage failures (private mode)
  }
}

/** Highest milestone reached by a percentage, or null below 25%. */
export function milestoneFor(percentage: number): Milestone | null {
  let reached: Milestone | null = null;
  for (const m of MILESTONES) {
    if (percentage >= m) reached = m;
  }
  return reached;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function playChime(milestone: Milestone) {
  if (isCelebrationMuted()) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    // Longer, brighter fanfare the closer we get to the goal.
    const notes =
      milestone === 100
        ? [523.25, 659.25, 783.99, 1046.5]
        : milestone === 75
        ? [523.25, 659.25, 783.99]
        : milestone === 50
        ? [523.25, 659.25]
        : [523.25];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.16;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.55);
    });

    setTimeout(() => void ctx.close(), 1600);
  } catch {
    // audio is a nice-to-have only
  }
}

function burstConfetti(milestone: Milestone) {
  if (prefersReducedMotion()) return;
  const colors = ["#10b981", "#3b82f6", "#a855f7", "#f97316", "#fbbf24"];
  const shots = milestone === 100 ? 5 : milestone === 75 ? 3 : 2;

  for (let i = 0; i < shots; i++) {
    setTimeout(() => {
      confetti({
        particleCount: milestone === 100 ? 120 : 70,
        spread: 75,
        startVelocity: 45,
        origin: { x: 0.5, y: 0.7 },
        colors,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 40,
        angle: i % 2 === 0 ? 60 : 120,
        spread: 60,
        origin: { x: i % 2 === 0 ? 0.05 : 0.95, y: 0.8 },
        colors,
        disableForReducedMotion: true,
      });
    }, i * 320);
  }
}

/** Fire the confetti + sound celebration for a reached milestone. */
export function celebrateMilestone(milestone: Milestone) {
  burstConfetti(milestone);
  playChime(milestone);
}

/** Small burst used whenever the thermometer rises from a new pledge. */
export function celebrateRise() {
  if (prefersReducedMotion()) return;
  confetti({
    particleCount: 26,
    spread: 55,
    startVelocity: 32,
    scalar: 0.8,
    origin: { x: 0.5, y: 0.75 },
    colors: ["#10b981", "#3b82f6", "#fbbf24"],
    disableForReducedMotion: true,
  });
}

export const MILESTONE_MESSAGES: Record<Milestone, string> = {
  25: "🚀 Quarter of the way there! The thermometer is climbing.",
  50: "💪 Halfway to the goal — incredible generosity!",
  75: "🔥 Three quarters done! One final push to the top.",
  100: "🎉 Goal reached! Thank you, Tuendelee family!",
};
