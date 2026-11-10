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

// Browser Text-To-Speech (English Voice) for Reminders
export function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Text-to-speech error:", err);
  }
}

// Birthday Celebration Musical Jingle + Personalized Voice Wish
export function playBirthdayCelebrationSound(personName: string) {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();

      // "Happy Birthday to You" notes frequency in Hz
      // Happy (C4 C4) Birth-(D4) -day (C4) to (F4) you (E4)
      // Happy (C4 C4) Birth-(D4) -day (C4) to (G4) you (F4)
      const notes = [
        { f: 261.63, d: 0.28 }, // Hap- (C4)
        { f: 261.63, d: 0.28 }, // py- (C4)
        { f: 293.66, d: 0.55 }, // Birth- (D4)
        { f: 261.63, d: 0.55 }, // day (C4)
        { f: 349.23, d: 0.55 }, // to (F4)
        { f: 329.63, d: 0.85 }, // you (E4)
        { f: 0,      d: 0.20 }, // rest
        { f: 261.63, d: 0.28 }, // Hap- (C4)
        { f: 261.63, d: 0.28 }, // py- (C4)
        { f: 293.66, d: 0.55 }, // Birth- (D4)
        { f: 261.63, d: 0.55 }, // day (C4)
        { f: 392.00, d: 0.55 }, // to (G4)
        { f: 349.23, d: 0.95 }, // you! (F4)
      ];

      let currentTime = ctx.currentTime + 0.1;

      notes.forEach((note) => {
        if (note.f > 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "triangle"; // Warm melodic organ/chime sound
          osc.frequency.setValueAtTime(note.f, currentTime);

          gain.gain.setValueAtTime(0, currentTime);
          gain.gain.linearRampToValueAtTime(0.35, currentTime + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, currentTime + note.d);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(currentTime);
          osc.stop(currentTime + note.d);
        }
        currentTime += note.d + 0.04;
      });
    }
  } catch (err) {
    console.warn("Birthday jingle music error:", err);
  }

  // Voice Announcement: "Happy Birthday [name of person]! Wishing you a wonderful day from Pixel Solution!"
  setTimeout(() => {
    speakText(`Happy Birthday ${personName}! Pixel Solution wishes you a fantastic and successful year ahead!`);
  }, 1600);
}


