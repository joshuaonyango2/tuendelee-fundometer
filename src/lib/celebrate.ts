import confetti from "canvas-confetti";
import { DEFAULT_CELEBRATION_SETTINGS, type CelebrationSettings } from "@/lib/celebrationSettings";

export const MILESTONES = [25, 50, 75, 100] as const;
export type Milestone = (typeof MILESTONES)[number];

/**
 * Playback settings are admin-controlled (stored in site_content) and mirrored
 * here so any component can play a celebration with the right volume.
 */
let runtimeSettings: CelebrationSettings = { ...DEFAULT_CELEBRATION_SETTINGS };

export function applyCelebrationSettings(settings: CelebrationSettings) {
  runtimeSettings = {
    muted: settings.muted,
    volume: Math.min(1, Math.max(0, settings.volume)),
  };
}

export function isCelebrationMuted(): boolean {
  return runtimeSettings.muted;
}

export function getCelebrationVolume(): number {
  return runtimeSettings.volume;
}

/* ------------------------------------------------------------------ *
 * Single-channel audio guard: only one celebration sound at a time.
 * ------------------------------------------------------------------ */

let activeAudio: HTMLAudioElement | null = null;
let activeContext: AudioContext | null = null;
let activeUntil = 0;

/** True while a celebration sound is still playing. */
export function isCelebrationSoundPlaying(): boolean {
  return Date.now() < activeUntil;
}

/** Stop whatever celebration sound is currently playing. */
export function stopCelebrationSound() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudio = null;
  }
  if (activeContext) {
    const ctx = activeContext;
    activeContext = null;
    void ctx.close().catch(() => undefined);
  }
  activeUntil = 0;
}

/**
 * Play an audio URL through the shared celebration channel so overlapping
 * milestones never stack on top of each other.
 */
export function playCelebrationAudio(url: string, approxDurationMs = 12000): boolean {
  if (isCelebrationMuted()) return true;
  stopCelebrationSound();
  try {
    const audio = new Audio(url);
    audio.volume = getCelebrationVolume();
    audio.onended = () => {
      if (activeAudio === audio) stopCelebrationSound();
    };
    void audio.play().catch(() => undefined);
    activeAudio = audio;
    activeUntil = Date.now() + approxDurationMs;
    return true;
  } catch {
    return false;
  }
}

function prefersReducedMotion() {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Default celebration: warm African ululation (fast warbling voice-like tone)
 * layered over a crowd of clapping hands, synthesised with WebAudio so no
 * asset download is needed. Longer and fuller the closer we are to the goal.
 */
export function playDefaultCelebration(milestone: Milestone = 100): boolean {
  if (isCelebrationMuted()) return true;
  stopCelebrationSound();

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return false;

    const ctx = new AudioCtx();
    activeContext = ctx;

    const master = ctx.createGain();
    master.gain.value = getCelebrationVolume();
    master.connect(ctx.destination);

    const seconds = milestone === 100 ? 5 : milestone === 75 ? 4 : milestone === 50 ? 3.4 : 2.8;
    const claps = Math.round(seconds * (milestone === 100 ? 26 : 18));

    // --- Clapping: short filtered noise bursts scattered like a crowd ---
    const noiseLength = Math.floor(ctx.sampleRate * 0.12);
    const noiseBuffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLength; i++) {
      const decay = Math.pow(1 - i / noiseLength, 7);
      channel[i] = (Math.random() * 2 - 1) * decay;
    }

    for (let i = 0; i < claps; i++) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.playbackRate.value = 0.85 + Math.random() * 0.5;

      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 1100 + Math.random() * 1900;
      band.Q.value = 0.9;

      const gain = ctx.createGain();
      const start = ctx.currentTime + 0.05 + Math.random() * seconds;
      gain.gain.setValueAtTime(0.16 + Math.random() * 0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);

      src.connect(band);
      band.connect(gain);
      gain.connect(master);
      src.start(start);
      src.stop(start + 0.16);
    }

    // --- Ululation: warbling vowel-like tone, a couple of overlapping voices ---
    const voices = milestone === 100 ? 3 : 2;
    for (let v = 0; v < voices; v++) {
      const start = ctx.currentTime + 0.2 + v * 0.55;
      const end = start + seconds * (0.75 - v * 0.08);

      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      const base = 620 + v * 90 + Math.random() * 60;
      osc.frequency.setValueAtTime(base, start);

      // Trill: rapid pitch wobble, the signature of an ululation.
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 8.5 + v * 1.2;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 85;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      // Formant-ish filter gives it a voice colour instead of a raw buzz.
      const formant = ctx.createBiquadFilter();
      formant.type = "bandpass";
      formant.frequency.value = 950 + v * 120;
      formant.Q.value = 4;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.12);
      gain.gain.setValueAtTime(0.1, end - 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(formant);
      formant.connect(gain);
      gain.connect(master);

      osc.start(start);
      lfo.start(start);
      osc.stop(end);
      lfo.stop(end);
    }

    const totalMs = (seconds + 0.6) * 1000;
    activeUntil = Date.now() + totalMs;
    window.setTimeout(() => {
      if (activeContext === ctx) stopCelebrationSound();
    }, totalMs + 200);

    return true;
  } catch {
    return false;
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

/** Highest milestone reached by a percentage, or null below 25%. */
export function milestoneFor(percentage: number): Milestone | null {
  let reached: Milestone | null = null;
  for (const m of MILESTONES) {
    if (percentage >= m) reached = m;
  }
  return reached;
}

/**
 * Fire the confetti + sound celebration for a reached milestone.
 * Pass `{ sound: false }` when an admin-configured sound is playing instead.
 */
export function celebrateMilestone(milestone: Milestone, options?: { sound?: boolean }) {
  burstConfetti(milestone);
  if (options?.sound !== false) playDefaultCelebration(milestone);
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
