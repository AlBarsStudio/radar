class SoundSystem {
  constructor() {
    this.ctx = null;
    this.lastPingTime = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playRadarPing(dist = 100) {
    if (!this.ctx) return;
    const now = Date.now();
    const minInterval = Math.min(2000, Math.max(350, dist * 15));
    if (now - this.lastPingTime < minInterval) return;
    this.lastPingTime = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = Math.max(480, 1100 - dist * 5);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playSegmentUnlock() {
    if (!this.ctx) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.26);
      }, i * 110);
    });

    if (navigator.vibrate) {
      navigator.vibrate([120, 80, 120]);
    }
  }
}

export const sounds = new SoundSystem();
    
