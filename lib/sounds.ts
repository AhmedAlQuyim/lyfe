/**
 * Web Audio API — plays a short ascending chime when a task is completed.
 * Reads the 'lyfe-sound' localStorage flag before playing — safe to call unconditionally.
 */
export function playCompletionSound() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem('lyfe-sound') !== 'true') return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx() as AudioContext;

    // A-major arpeggio: A5 → C#6 → E6
    const notes = [880, 1108.73, 1318.51];
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  } catch {
    // AudioContext may be blocked by browser policy — silently ignore
  }
}
