// Sound service for Notification & Ringtone playback
// Primary source: User's provided ringtone at /sounds/notification.mp3
// Fallback: Web Audio API synthesized crystal chime

let activeAudio: HTMLAudioElement | null = null;

export function playAlertSound(options?: { volume?: number; loop?: boolean }) {
  try {
    // Stop any currently playing alert audio
    stopAlertSound();

    const audio = new Audio("/sounds/notification.mp3");
    audio.volume = options?.volume ?? 0.9;
    audio.loop = options?.loop ?? false;

    activeAudio = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Audio file play blocked by browser, trying Web Audio API chime fallback:", err);
        playFallbackChime();
      });
    }
  } catch (err) {
    console.warn("Error playing notification sound:", err);
    playFallbackChime();
  }
}

export function stopAlertSound() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudio = null;
  }
}

// Synthesized pleasant crystal chime using Web Audio API as a fail-safe
export function playFallbackChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Melodic double chime
    playTone(587.33, 0.0, 0.35); // D5
    playTone(880.00, 0.15, 0.55); // A5
  } catch (e) {
    console.warn("Fallback chime error:", e);
  }
}
