const STORAGE_KEYS = {
  USER: 'quizmaster_user',
  THEME: 'quizmaster_theme',
  SOUND: 'quizmaster_sound_enabled',
  LEADERBOARD: 'quizmaster_leaderboard'
};

const SESSION_KEYS = {
  QUIZ_CONFIG: 'quizmaster_quiz_config',
  QUIZ_RESULT: 'quizmaster_quiz_result'
};

const Storage = {
  _getLocal(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('[Storage] read failed for', key, e);
      return fallback;
    }
  },

  _setLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[Storage] write failed for', key, e);
      return false;
    }
  },

  _getSession(key, fallback = null) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('[Storage] session read failed for', key, e);
      return fallback;
    }
  },

  _setSession(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[Storage] session write failed for', key, e);
      return false;
    }
  },

  getUsername() {
    return this._getLocal(STORAGE_KEYS.USER, '');
  },
  setUsername(name) {
    return this._setLocal(STORAGE_KEYS.USER, name);
  },

  getTheme() {
    return this._getLocal(STORAGE_KEYS.THEME, null);
  },
  setTheme(theme) {
    return this._setLocal(STORAGE_KEYS.THEME, theme);
  },

  isSoundEnabled() {
    return this._getLocal(STORAGE_KEYS.SOUND, true);
  },
  setSoundEnabled(enabled) {
    return this._setLocal(STORAGE_KEYS.SOUND, enabled);
  },

  getLeaderboard() {
    return this._getLocal(STORAGE_KEYS.LEADERBOARD, []);
  },
  addLeaderboardEntry(entry) {
    const board = this.getLeaderboard();
    board.push(entry);
    board.sort((a, b) => b.percentage - a.percentage || b.score - a.score || a.timeTaken - b.timeTaken);
    this._setLocal(STORAGE_KEYS.LEADERBOARD, board);
    return board;
  },
  clearLeaderboard() {
    return this._setLocal(STORAGE_KEYS.LEADERBOARD, []);
  },
  getBestResultFor(username) {
    if (!username) return null;
    const board = this.getLeaderboard();
    const mine = board.filter(e => e.username.toLowerCase() === username.toLowerCase());
    if (!mine.length) return null;
    return mine.reduce((best, cur) => (cur.percentage > best.percentage ? cur : best), mine[0]);
  },

  getQuizConfig() {
    return this._getSession(SESSION_KEYS.QUIZ_CONFIG, null);
  },
  setQuizConfig(config) {
    return this._setSession(SESSION_KEYS.QUIZ_CONFIG, config);
  },

  getQuizResult() {
    return this._getSession(SESSION_KEYS.QUIZ_RESULT, null);
  },
  setQuizResult(result) {
    return this._setSession(SESSION_KEYS.QUIZ_RESULT, result);
  }
};
