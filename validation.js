const Validation = {
  validateUsername(rawName) {
    const name = (rawName || '').trim();
    if (!name) {
      return { valid: false, message: 'Enter your name to continue.' };
    }
    if (name.length < 2) {
      return { valid: false, message: 'Name needs at least 2 characters.' };
    }
    if (name.length > 24) {
      return { valid: false, message: 'Keep your name under 24 characters.' };
    }
    if (!/^[\p{L}0-9\s'.-]+$/u.test(name)) {
      return { valid: false, message: 'Use letters, numbers, spaces, - or \' only.' };
    }
    return { valid: true, message: '' };
  },

  validateCategory(categoryId) {
    if (!categoryId) {
      return { valid: false, message: 'Pick a category to play.' };
    }
    return { valid: true, message: '' };
  },

  validateSetupForm({ username, categoryId }) {
    const fields = {
      username: this.validateUsername(username),
      category: this.validateCategory(categoryId)
    };
    const firstInvalid = Object.values(fields).find(f => !f.valid);
    return {
      valid: !firstInvalid,
      fields
    };
  }
};
