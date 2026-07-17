const QuestionView = {
  /**
   * @param {Object} question
   * @param {HTMLElement} optionsGrid
   * @param {(index:number)=>void} onSelect
   */
  renderOptions(question, optionsGrid, onSelect) {
    optionsGrid.innerHTML = '';
    let answered = false;

    question.options.forEach((optionText, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-card';
      btn.setAttribute('data-index', String(index));

      const letter = document.createElement('span');
      letter.className = 'option-letter';
      letter.textContent = Utils.letterFor(index);

      const text = document.createElement('span');
      text.className = 'option-text';
      text.textContent = optionText;

      btn.appendChild(letter);
      btn.appendChild(text);

      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        onSelect(index);
      });

      optionsGrid.appendChild(btn);
    });
  },

  /**
   * @param {HTMLElement} optionsGrid
   * @param {number|null} selectedIndex
   * @param {number} correctIndex
   */
  showFeedback(optionsGrid, selectedIndex, correctIndex) {
    const buttons = optionsGrid.querySelectorAll('.option-card');
    buttons.forEach(btn => {
      const index = Number(btn.getAttribute('data-index'));
      btn.disabled = true;
      btn.classList.add('is-locked');

      if (index === correctIndex) {
        btn.classList.add('is-correct');
      }
      if (selectedIndex !== null && index === selectedIndex && selectedIndex !== correctIndex) {
        btn.classList.add('is-incorrect');
      }
      if (selectedIndex === null && index === correctIndex) {
        btn.classList.add('is-missed');
      }
    });
  }
};
