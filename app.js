document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'home') initHomePage();
  if (page === 'leaderboard') initLeaderboardPage();
});


async function initHomePage() {
  const homeState = { selectedCategoryId: null, difficulty: 'mixed', questionCount: 10 };

  let data;
  try {
    const res = await fetch('data/questions.json');
    data = await res.json();
  } catch (err) {
    UI.toast("Couldn't load categories. Try refreshing the page.", 'error', 5000);
    return;
  }

  renderCategoryGrid(data.categories, homeState);
  prefillUsername();
  bindSegmentedControl('difficultyControl', (value) => { homeState.difficulty = value; });
  bindSegmentedControl('countControl', (value) => { homeState.questionCount = Number(value); });
  bindSetupForm(homeState, data.categories);
  renderStatsPreview();
  renderLeaderboardPreview(data.categories);

  const usernameInput = document.getElementById('username');
  if (usernameInput) {
    usernameInput.addEventListener('input', debounceStats(() => renderStatsPreview()));
  }
}

function renderCategoryGrid(categories, homeState) {
  const grid = document.getElementById('categoryGrid');
  if (!grid) return;
  grid.innerHTML = '';

  categories.forEach((cat) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'category-card';
    card.dataset.categoryId = cat.id;
    card.style.setProperty('--card-color', cat.color);
    card.setAttribute('aria-pressed', 'false');
    card.innerHTML = `
      <span class="category-icon">${cat.icon}</span>
      <span class="category-name">${Utils.escapeHtml(cat.name)}</span>
      <span class="category-tagline">${Utils.escapeHtml(cat.tagline)}</span>
    `;
    card.addEventListener('click', () => {
      grid.querySelectorAll('.category-card').forEach(c => {
        c.classList.remove('is-selected');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('is-selected');
      card.setAttribute('aria-pressed', 'true');
      homeState.selectedCategoryId = cat.id;
      const err = document.getElementById('categoryError');
      if (err) err.textContent = '';
    });
    grid.appendChild(card);
  });
}

function bindSegmentedControl(controlId, onChange) {
  const control = document.getElementById(controlId);
  if (!control) return;
  const segments = control.querySelectorAll('.segment');
  segments.forEach(seg => {
    seg.addEventListener('click', () => {
      segments.forEach(s => {
        s.classList.remove('active');
        s.setAttribute('aria-checked', 'false');
      });
      seg.classList.add('active');
      seg.setAttribute('aria-checked', 'true');
      onChange(seg.dataset.value);
    });
  });
}

function prefillUsername() {
  const input = document.getElementById('username');
  const saved = Storage.getUsername();
  if (input && saved) input.value = saved;
}

function bindSetupForm(homeState, categories) {
  const form = document.getElementById('setupForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('username');
    const { valid, fields } = Validation.validateSetupForm({
      username: usernameInput.value,
      categoryId: homeState.selectedCategoryId
    });

    document.getElementById('usernameError').textContent = fields.username.valid ? '' : fields.username.message;
    document.getElementById('categoryError').textContent = fields.category.valid ? '' : fields.category.message;

    if (!valid) {
      if (!fields.username.valid) usernameInput.focus();
      return;
    }

    const cleanName = usernameInput.value.trim();
    Storage.setUsername(cleanName);
    Storage.setQuizConfig({
      username: cleanName,
      categoryId: homeState.selectedCategoryId,
      difficulty: homeState.difficulty,
      questionCount: homeState.questionCount
    });
    window.location.href = 'quiz.html';
  });
}

function debounceStats(fn) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), 300);
  };
}

function renderStatsPreview() {
  const section = document.getElementById('statsPreview');
  if (!section) return;
  const usernameInput = document.getElementById('username');
  const name = (usernameInput && usernameInput.value.trim()) || Storage.getUsername();

  if (!name) {
    section.hidden = true;
    return;
  }
  const best = Storage.getBestResultFor(name);
  if (!best) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  section.innerHTML = `
    <div class="container">
      <div class="stats-preview-card">
        <span class="stats-preview-icon">🎯</span>
        <p>Welcome back, <strong>${Utils.escapeHtml(name)}</strong>. Your best round is
          <strong>${best.score}/${best.total}</strong> (${best.percentage}%) in
          <strong>${best.categoryIcon} ${Utils.escapeHtml(best.categoryName)}</strong>.</p>
      </div>
    </div>
  `;
}

function renderLeaderboardPreview() {
  const container = document.getElementById('leaderboardPreview');
  if (!container) return;
  const board = Storage.getLeaderboard().slice(0, 3);

  if (board.length === 0) {
    container.innerHTML = `<p class="leaderboard-preview-empty">No scores yet — be the first on the board.</p>`;
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  container.innerHTML = board.map((entry, i) => `
    <div class="preview-row">
      <span class="preview-rank">${medals[i]}</span>
      <span class="preview-name">${Utils.escapeHtml(entry.username)}</span>
      <span class="preview-category">${entry.categoryIcon} ${Utils.escapeHtml(entry.categoryName)}</span>
      <span class="preview-score">${entry.percentage}%</span>
    </div>
  `).join('');
}


function initLeaderboardPage() {
  const lbState = { categoryId: 'all', sortBy: 'percentage', categories: [] };

  fetch('data/questions.json')
    .then(res => res.json())
    .then(data => {
      lbState.categories = data.categories;
      populateCategoryFilter(data.categories);
      renderLeaderboardPage(lbState);
    })
    .catch(() => {
      lbState.categories = [];
      renderLeaderboardPage(lbState);
    });

  const categoryFilter = document.getElementById('categoryFilter');
  const sortFilter = document.getElementById('sortFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      lbState.categoryId = categoryFilter.value;
      renderLeaderboardPage(lbState);
    });
  }
  if (sortFilter) {
    sortFilter.addEventListener('change', () => {
      lbState.sortBy = sortFilter.value;
      renderLeaderboardPage(lbState);
    });
  }

  const clearBtn = document.getElementById('clearLeaderboardBtn');
  if (clearBtn) clearBtn.addEventListener('click', () => UI.openModal('clearModal'));
  const cancelClear = document.getElementById('cancelClear');
  const confirmClear = document.getElementById('confirmClear');
  if (cancelClear) cancelClear.addEventListener('click', () => UI.closeModal('clearModal'));
  if (confirmClear) confirmClear.addEventListener('click', () => {
    Storage.clearLeaderboard();
    UI.closeModal('clearModal');
    UI.toast('Leaderboard cleared.', 'info');
    renderLeaderboardPage(lbState);
  });
}

function populateCategoryFilter(categories) {
  const select = document.getElementById('categoryFilter');
  if (!select) return;
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.icon} ${cat.name}`;
    select.appendChild(opt);
  });
}

function getFilteredLeaderboard(lbState) {
  let board = Storage.getLeaderboard();
  if (lbState.categoryId !== 'all') {
    board = board.filter(e => e.categoryId === lbState.categoryId);
  }
  board = [...board];
  if (lbState.sortBy === 'date') {
    board.sort((a, b) => b.date - a.date);
  } else {
    board.sort((a, b) => b.percentage - a.percentage || b.score - a.score || a.timeTaken - b.timeTaken);
  }
  return board;
}

function renderLeaderboardPage(lbState) {
  const board = getFilteredLeaderboard(lbState);
  const listEl = document.getElementById('leaderboardList');
  const emptyEl = document.getElementById('emptyState');
  const podiumEl = document.getElementById('podium');
  const clearBtn = document.getElementById('clearLeaderboardBtn');

  if (clearBtn) clearBtn.disabled = Storage.getLeaderboard().length === 0;

  if (board.length === 0) {
    listEl.innerHTML = '';
    if (podiumEl) podiumEl.innerHTML = '';
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  if (podiumEl) renderPodium(podiumEl, board.slice(0, 3));
  renderLeaderboardList(listEl, board);
}

function renderPodium(podiumEl, top3) {
  if (top3.length === 0) {
    podiumEl.innerHTML = '';
    return;
  }
  const order = [top3[1], top3[0], top3[2]];
  const heights = ['podium--second', 'podium--first', 'podium--third'];
  const medals = ['🥈', '🥇', '🥉'];

  podiumEl.innerHTML = order.map((entry, i) => {
    if (!entry) return `<div class="podium-slot ${heights[i]} podium-slot--empty"></div>`;
    return `
      <div class="podium-slot ${heights[i]}">
        <span class="podium-medal">${medals[i]}</span>
        <span class="podium-name">${Utils.escapeHtml(entry.username)}</span>
        <span class="podium-score">${entry.percentage}%</span>
        <div class="podium-block"></div>
      </div>
    `;
  }).join('');
}

function renderLeaderboardList(listEl, board) {
  listEl.innerHTML = board.map((entry, index) => {
    const rank = index + 1;
    const rankDisplay = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`;
    return `
      <div class="leaderboard-row">
        <div class="lb-primary">
          <span class="lb-rank">${rankDisplay}</span>
          <span class="lb-name">${Utils.escapeHtml(entry.username)}</span>
          <span class="lb-percentage">${entry.percentage}%</span>
        </div>
        <div class="lb-meta">
          <span class="lb-category" style="--chip-color:${entry.categoryColor || 'var(--color-primary)'}">${entry.categoryIcon} ${Utils.escapeHtml(entry.categoryName)}</span>
          <span class="lb-difficulty">${Utils.escapeHtml(entry.difficulty)}</span>
          <span class="lb-score">${entry.score}/${entry.total}</span>
          <span class="lb-date">${Utils.formatDate(entry.date)}</span>
        </div>
      </div>
    `;
  }).join('');
}
