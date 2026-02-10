// Sync notification utilities: sound, vibration, and visual popup

const SYNC_SOUND_FREQUENCY = 880; // Hz - pleasant chime
const SYNC_SOUND_DURATION = 200; // ms

let audioCtx: AudioContext | null = null;

export function playSyncSound() {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';

    // Play two-note chime
    const now = audioCtx.currentTime;
    oscillator.frequency.setValueAtTime(SYNC_SOUND_FREQUENCY, now);
    oscillator.frequency.setValueAtTime(SYNC_SOUND_FREQUENCY * 1.25, now + SYNC_SOUND_DURATION / 1000);

    // Gentle volume envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gainNode.gain.linearRampToValueAtTime(0.15, now + SYNC_SOUND_DURATION / 1000);
    gainNode.gain.linearRampToValueAtTime(0.3, now + (SYNC_SOUND_DURATION / 1000) + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, now + (SYNC_SOUND_DURATION * 2) / 1000);

    oscillator.start(now);
    oscillator.stop(now + (SYNC_SOUND_DURATION * 2) / 1000);
  } catch {
    // Audio not available - silently fail
  }
}

export function triggerVibration() {
  try {
    if ('vibrate' in navigator) {
      // Short double-pulse vibration pattern
      navigator.vibrate([100, 50, 100]);
    }
  } catch {
    // Vibration not available
  }
}

export type SyncResult = {
  synced: number;
  failed: number;
};
