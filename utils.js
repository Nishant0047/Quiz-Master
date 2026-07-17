const Utils = {
  shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },

  formatTime(totalSeconds) {
    const safeSeconds = Math.max(0, Math.round(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  },

  formatDuration(totalSeconds) {
    const safeSeconds = Math.max(0, Math.round(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  },

  calculatePercentage(score, total) {
    if (!total) return 0;
    return Math.round((score / total) * 100);
  },

  getPerformanceMessage(percentage) {
    if (percentage === 100) return { headline: 'Flawless round.', emoji: '🏆' };
    if (percentage >= 80) return { headline: 'Sharp. Really sharp.', emoji: '🔥' };
    if (percentage >= 60) return { headline: 'Solid showing.', emoji: '⭐' };
    if (percentage >= 40) return { headline: 'Room to climb.', emoji: '📈' };
    return { headline: 'Tough round — go again.', emoji: '🎯' };
  },

  formatDate(timestamp) {
    try {
      return new Date(timestamp).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  },

  generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  },

  clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  },

  letterFor(index) {
    return String.fromCharCode(65 + index);
  }
};

const SoundFX = {
  _cache: {},

  isEnabled() {
    if (typeof Storage === 'undefined') return true;
    return Storage.isSoundEnabled();
  },

  play(name) {
    if (!this.isEnabled()) return;
    try {
      let audio = this._cache[name];
      if (!audio) {
        audio = new Audio(`assets/sounds/${name}.wav`);
        audio.volume = 0.45;
        this._cache[name] = audio;
      }
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(() => {
        });
      }
    } catch (e) {
    }
  }
};
