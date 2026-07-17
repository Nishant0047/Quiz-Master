(function () {
  let result = null;

  function init() {
    result = Storage.getQuizResult();
    if (!result) {
      window.location.href = 'index.html';
      return;
    }

    applyCategoryTheme();
    renderHeadline();
    renderScoreRing();
    renderStats();
    renderReview();
    saveToLeaderboard();
    setupActions();
    SoundFX.play('complete');
  }

  function applyCategoryTheme() {
    document.documentElement.style.setProperty('--category-color', result.categoryColor || '#7C5CFC');
  }

  function renderHeadline() {
    const { headline, emoji } = Utils.getPerformanceMessage(result.percentage);
    document.getElementById('performanceEmoji').textContent = emoji;
    document.getElementById('performanceMessage').textContent = headline;
    const name = result.username ? Utils.escapeHtml(result.username) : 'Player';
    document.getElementById('scoreDetail').innerHTML =
      `Nice round, <strong>${name}</strong> — you answered <strong>${result.score}</strong> of <strong>${result.total}</strong> correctly in <strong>${result.categoryIcon} ${Utils.escapeHtml(result.categoryName)}</strong>.`;
  }

  function renderScoreRing() {
    const circle = document.getElementById('scoreRingFill');
    const label = document.getElementById('scorePercentage');
    if (!circle) return;

    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = String(circumference);
    circle.style.strokeDashoffset = String(circumference);

    const target = result.percentage;
    const start = performance.now();
    const animDuration = 1100;

    requestAnimationFrame(function frame(now) {
      const t = Utils.clamp((now - start) / animDuration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const current = Math.round(target * eased);
      label.textContent = `${current}%`;
      circle.style.strokeDashoffset = String(circumference * (1 - eased * (target / 100)));
      if (t < 1) requestAnimationFrame(frame);
      else {
        label.textContent = `${target}%`;
        circle.style.strokeDashoffset = String(circumference * (1 - target / 100));
      }
    });
  }

  function renderStats() {
    document.getElementById('statScore').textContent = `${result.score}/${result.total}`;
    document.getElementById('statTime').textContent = Utils.formatDuration(result.timeTaken);
    document.getElementById('statCategory').textContent = `${result.categoryIcon} ${result.categoryName}`;
  }

  function renderReview() {
    const list = document.getElementById('reviewList');
    list.innerHTML = '';

    result.answers.forEach((answer, index) => {
      const item = document.createElement('article');
      item.className = `review-item ${answer.correct ? 'review-item--correct' : 'review-item--incorrect'}`;

      const userAnswerText = answer.selectedIndex === null
        ? 'No answer — time ran out'
        : answer.options[answer.selectedIndex];

      item.innerHTML = `
        <div class="review-item-head">
          <span class="review-mark" aria-hidden="true">${answer.correct ? '✓' : '✗'}</span>
          <span class="review-number">Question ${index + 1}</span>
        </div>
        <p class="review-question">${Utils.escapeHtml(answer.question)}</p>
        <p class="review-answer-line">
          <span class="review-label">Your answer:</span>
          <span class="review-answer ${answer.correct ? '' : 'review-answer--wrong'}">${Utils.escapeHtml(userAnswerText)}</span>
        </p>
        ${!answer.correct ? `
        <p class="review-answer-line">
          <span class="review-label">Correct answer:</span>
          <span class="review-answer review-answer--right">${Utils.escapeHtml(answer.options[answer.correctIndex])}</span>
        </p>` : ''}
        <p class="review-explanation">${Utils.escapeHtml(answer.explanation)}</p>
      `;
      list.appendChild(item);
    });
  }

  function saveToLeaderboard() {
    if (result._saved) return;
    Storage.addLeaderboardEntry({
      id: result.id,
      username: result.username || 'Player',
      categoryId: result.categoryId,
      categoryName: result.categoryName,
      categoryIcon: result.categoryIcon,
      categoryColor: result.categoryColor,
      difficulty: result.difficulty,
      score: result.score,
      total: result.total,
      percentage: result.percentage,
      timeTaken: result.timeTaken,
      date: result.date
    });
    result._saved = true;
    Storage.setQuizResult(result);
  }

  function setupActions() {
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        Storage.setQuizConfig({
          username: result.username,
          categoryId: result.categoryId,
          difficulty: result.difficulty,
          questionCount: result.total
        });
        window.location.href = 'quiz.html';
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
