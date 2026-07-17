(function () {
  const DURATIONS_BY_DIFFICULTY = { easy: 15, medium: 20, hard: 25 };
  const ADVANCE_HINT_DELAY = 400;

  const state = {
    config: null,
    category: null,
    questions: [],
    currentIndex: 0,
    score: 0,
    answers: [],
    startTime: null,
    timer: null,
    answeredCurrent: false
  };

  const els = {};

  function cacheEls() {
    els.quitBtn = document.getElementById('quitBtn');
    els.categoryBadge = document.getElementById('categoryBadge');
    els.questionCounter = document.getElementById('questionCounter');
    els.progressFill = document.getElementById('progressFill');
    els.timerRing = document.getElementById('timerRingFill');
    els.timerText = document.getElementById('timerText');
    els.timerDisplay = document.getElementById('timerDisplay');
    els.liveScore = document.getElementById('liveScore');
    els.liveTotal = document.getElementById('liveTotal');
    els.difficultyTag = document.getElementById('difficultyTag');
    els.questionText = document.getElementById('questionText');
    els.optionsGrid = document.getElementById('optionsGrid');
    els.explanationBox = document.getElementById('explanationBox');
    els.nextBtn = document.getElementById('nextBtn');
    els.quizMain = document.getElementById('quizMain');
    els.errorState = document.getElementById('errorState');
  }

  async function init() {
    cacheEls();
    state.config = Storage.getQuizConfig();

    if (!state.config || !state.config.categoryId) {
      window.location.href = 'index.html';
      return;
    }

    let data;
    try {
      const res = await fetch('data/questions.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (err) {
      showLoadError();
      return;
    }

    state.category = data.categories.find(c => c.id === state.config.categoryId) || null;
    buildQuestionSet(data.questions);

    if (state.questions.length === 0) {
      showLoadError();
      return;
    }

    applyCategoryTheme();
    els.liveTotal.textContent = String(state.questions.length);
    state.startTime = Date.now();
    setupEventListeners();
    renderQuestion();
  }

  function buildQuestionSet(allQuestions) {
    let pool = allQuestions.filter(q => q.categoryId === state.config.categoryId);
    if (state.config.difficulty && state.config.difficulty !== 'mixed') {
      pool = pool.filter(q => q.difficulty === state.config.difficulty);
    }
    pool = Utils.shuffleArray(pool);
    const requested = state.config.questionCount || 10;
    if (pool.length < requested) {
      UI.toast(`Only ${pool.length} questions available for this setup — starting with those.`, 'info', 4000);
    }
    state.questions = pool.slice(0, Math.min(requested, pool.length));
  }

  function applyCategoryTheme() {
    if (!state.category) return;
    document.documentElement.style.setProperty('--category-color', state.category.color);
    els.categoryBadge.textContent = `${state.category.icon} ${state.category.name}`;
  }

  function showLoadError() {
    if (els.quizMain) els.quizMain.hidden = true;
    if (els.errorState) els.errorState.hidden = false;
  }

  function renderQuestion() {
    const q = state.questions[state.currentIndex];
    state.answeredCurrent = false;

    els.questionCounter.textContent = `Question ${state.currentIndex + 1} of ${state.questions.length}`;
    els.progressFill.style.width = `${(state.currentIndex / state.questions.length) * 100}%`;
    els.difficultyTag.textContent = q.difficulty;
    els.difficultyTag.className = `difficulty-tag difficulty-${q.difficulty}`;
    els.questionText.textContent = q.question;
    els.explanationBox.hidden = true;
    els.explanationBox.textContent = '';
    els.nextBtn.disabled = true;
    els.nextBtn.textContent = state.currentIndex === state.questions.length - 1 ? 'See Results' : 'Next Question';

    QuestionView.renderOptions(q, els.optionsGrid, handleAnswer);

    els.questionText.focus();
    startTimer(q);
  }

  function startTimer(question) {
    const duration = DURATIONS_BY_DIFFICULTY[question.difficulty] || 20;
    if (state.timer) state.timer.stop();

    const circumference = initTimerRing();
    els.timerText.textContent = String(duration);
    els.timerDisplay.classList.remove('timer-display--danger');

    state.timer = new Timer({
      duration,
      onTick: (remaining, elapsedRatio) => {
        els.timerText.textContent = String(remaining);
        if (els.timerRing) {
          els.timerRing.style.strokeDashoffset = String(circumference * elapsedRatio);
        }
        els.timerDisplay.classList.toggle('timer-display--danger', remaining <= 5);
      },
      onExpire: () => handleAnswer(null)
    });
    state.timer.start();
  }

  function initTimerRing() {
    if (!els.timerRing) return 0;
    const radius = els.timerRing.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    els.timerRing.style.strokeDasharray = String(circumference);
    els.timerRing.style.strokeDashoffset = '0';
    return circumference;
  }

  function handleAnswer(selectedIndex) {
    if (state.answeredCurrent) return;
    state.answeredCurrent = true;
    if (state.timer) state.timer.stop();

    const q = state.questions[state.currentIndex];
    const isCorrect = selectedIndex === q.correctIndex;

    if (isCorrect) {
      state.score++;
      SoundFX.play('correct');
    } else {
      SoundFX.play('incorrect');
    }

    state.answers.push({
      questionId: q.id,
      question: q.question,
      options: q.options,
      selectedIndex,
      correctIndex: q.correctIndex,
      correct: isCorrect,
      explanation: q.explanation
    });

    QuestionView.showFeedback(els.optionsGrid, selectedIndex, q.correctIndex);
    els.liveScore.textContent = String(state.score);
    els.explanationBox.hidden = false;
    els.explanationBox.textContent = q.explanation;

    setTimeout(() => {
      els.nextBtn.disabled = false;
      els.nextBtn.focus();
    }, ADVANCE_HINT_DELAY);
  }

  function goToNext() {
    if (!state.answeredCurrent || els.nextBtn.disabled) return;
    state.currentIndex++;
    if (state.currentIndex >= state.questions.length) {
      finishQuiz();
    } else {
      renderQuestion();
    }
  }

  function finishQuiz() {
    if (state.timer) state.timer.stop();
    els.progressFill.style.width = '100%';

    const timeTaken = Math.round((Date.now() - state.startTime) / 1000);
    const total = state.questions.length;
    const percentage = Utils.calculatePercentage(state.score, total);

    const result = {
      id: Utils.generateId(),
      username: state.config.username,
      categoryId: state.config.categoryId,
      categoryName: state.category ? state.category.name : state.config.categoryId,
      categoryIcon: state.category ? state.category.icon : '🧠',
      categoryColor: state.category ? state.category.color : '#7C5CFC',
      difficulty: state.config.difficulty,
      score: state.score,
      total,
      percentage,
      timeTaken,
      answers: state.answers,
      date: Date.now()
    };

    Storage.setQuizResult(result);
    window.location.href = 'result.html';
  }

  function setupEventListeners() {
    els.nextBtn.addEventListener('click', goToNext);
    els.quitBtn.addEventListener('click', () => UI.openModal('quitModal'));

    const cancelBtn = document.getElementById('cancelQuit');
    const confirmBtn = document.getElementById('confirmQuit');
    if (cancelBtn) cancelBtn.addEventListener('click', () => UI.closeModal('quitModal'));
    if (confirmBtn) confirmBtn.addEventListener('click', () => {
      if (state.timer) state.timer.stop();
      window.location.href = 'index.html';
    });

    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('quitModal');
      if (modal && !modal.hidden) return;

      if (['1', '2', '3', '4'].includes(e.key) && !state.answeredCurrent) {
        const index = Number(e.key) - 1;
        const btn = els.optionsGrid.querySelector(`[data-index="${index}"]`);
        if (btn) btn.click();
      } else if (e.key === 'Enter' && !els.nextBtn.disabled) {
        goToNext();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
