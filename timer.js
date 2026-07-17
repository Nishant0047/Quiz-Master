/**
 * timer.js
 * A small countdown timer class driving the per-question stopwatch ring
 * on the quiz page. Ticks once a second; reports progress via callbacks
 * so the caller owns all rendering.
 */

class Timer {
  /**
   * @param {Object} opts
   * @param {number} opts.duration - total seconds to count down from
   * @param {(remaining:number, elapsedRatio:number)=>void} [opts.onTick]
   * @param {()=>void} [opts.onExpire]
   */
  constructor({ duration, onTick, onExpire }) {
    this.duration = duration;
    this.remaining = duration;
    this.onTick = onTick;
    this.onExpire = onExpire;
    this._intervalId = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._emit();
    this._intervalId = setInterval(() => {
      this.remaining -= 1;
      if (this.remaining <= 0) {
        this.remaining = 0;
        this._emit();
        this.stop();
        if (this.onExpire) this.onExpire();
        return;
      }
      this._emit();
    }, 1000);
  }

  stop() {
    if (this._intervalId) clearInterval(this._intervalId);
    this._intervalId = null;
    this.isRunning = false;
  }

  reset(newDuration = this.duration) {
    this.stop();
    this.duration = newDuration;
    this.remaining = newDuration;
  }

  _emit() {
    if (this.onTick) {
      const elapsedRatio = this.duration ? 1 - this.remaining / this.duration : 0;
      this.onTick(this.remaining, elapsedRatio);
    }
  }
}
