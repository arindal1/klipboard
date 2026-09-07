"use client";

// Opt-in save feedback: a short synthesized chime (Web Audio API, no audio
// asset needed) and a haptic pulse on supported devices. Both are
// decorative - any failure/unsupported API is silently swallowed.

export function playSaveChime() {
  try {
    const AudioContextCtor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
    osc.onended = () => ctx.close();
  } catch {
    // Web Audio unsupported/blocked - feedback is decorative only.
  }
}

export function triggerSaveHaptic() {
  navigator.vibrate?.(15);
}