const MIN_GAIN = 0.0001;

export class AudioManager {
  constructor(contextFactory = () => new window.AudioContext()) {
    this.contextFactory = contextFactory;
    this.context = null;
    this.audioBlocked = false;
  }

  async unlock() {
    if (this.audioBlocked) {
      return null;
    }

    try {
      if (!this.context) {
        this.context = this.contextFactory();
      }

      if (this.context?.resume) {
        await this.context.resume();
      }

      return this.context;
    } catch {
      this.context = null;
      this.audioBlocked = true;
      return null;
    }
  }

  playEnemyHit() {
    return this.playTone({ duration: 0.06, frequency: 170, gain: 0.03, slideTo: 120, type: 'square' });
  }

  playEliteWarning() {
    return this.playTone({ duration: 0.22, frequency: 210, gain: 0.05, slideTo: 250, type: 'sawtooth' });
  }

  playChestOpen() {
    return this.playTone({ duration: 0.24, frequency: 460, gain: 0.04, slideTo: 680, type: 'triangle' });
  }

  playLevelUp() {
    return this.playTone({ duration: 0.3, frequency: 320, gain: 0.04, slideTo: 520, type: 'triangle' });
  }

  playPickup() {
    return this.playTone({ duration: 0.08, frequency: 520, gain: 0.025, slideTo: 660, type: 'sine' });
  }

  playEnemyDeath() {
    return this.playTone({ duration: 0.12, frequency: 180, gain: 0.035, slideTo: 90, type: 'sawtooth' });
  }

  playEliteDeath() {
    return this.playTone({ duration: 0.3, frequency: 240, gain: 0.05, slideTo: 80, type: 'sawtooth' });
  }

  playPlayerHurt() {
    return this.playTone({ duration: 0.1, frequency: 230, gain: 0.04, slideTo: 140, type: 'square' });
  }

  playGameOver() {
    return this.playTone({ duration: 0.45, frequency: 190, gain: 0.05, slideTo: 70, type: 'triangle' });
  }

  playTone({ frequency, duration, gain, type, slideTo = null }) {
    try {
      const context = this.context;

      if (!context) {
        return null;
      }

      const oscillator = context.createOscillator?.();
      const gainNode = context.createGain?.();

      if (!oscillator || !gainNode) {
        return null;
      }

      const now = context.currentTime ?? 0;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);

      if (slideTo !== null) {
        oscillator.frequency.linearRampToValueAtTime(slideTo, now + duration);
      }

      gainNode.gain.setValueAtTime(Math.max(gain, MIN_GAIN), now);
      gainNode.gain.exponentialRampToValueAtTime(MIN_GAIN, now + duration);
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration);

      return oscillator;
    } catch {
      return null;
    }
  }
}
