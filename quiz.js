(() => {
  'use strict';

  const questions = Array.isArray(window.questions) ? window.questions : [];
  const state = { current: 0, answers: Array(questions.length).fill(null) };
  const $ = (id) => document.getElementById(id);
  const screens = { start: $('start-screen'), quiz: $('quiz-screen'), result: $('result-screen') };
  const answerLabels = ['أ', 'ب', 'ج', 'د'];

  const formatPage = (page) => {
    if (page === null || page === undefined) return 'الصفحة غير محددة';
    if (typeof page === 'object') return `الصفحة المطبوعة ${page.printed} · PDF ${page.pdf}`;
    return `الصفحة ${page}`;
  };

  const showScreen = (name) => {
    Object.entries(screens).forEach(([key, screen]) => {
      const active = key === name;
      screen.hidden = !active;
      screen.classList.toggle('is-active', active);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderMap = () => {
    const map = $('question-map');
    map.innerHTML = questions.map((question, index) => {
      const selected = state.answers[index] !== null;
      const current = index === state.current;
      return `<button class="map-dot${selected ? ' is-answered' : ''}${current ? ' is-current' : ''}" type="button" data-map-index="${index}" aria-label="السؤال ${index + 1}" aria-current="${current ? 'step' : 'false'}">${String(index + 1).padStart(2, '0')}</button>`;
    }).join('');
  };

  const renderQuestion = () => {
    if (!questions.length) return;
    const question = questions[state.current];
    const selectedAnswer = state.answers[state.current];
    const number = state.current + 1;
    const percent = Math.round((number / questions.length) * 100);
    const answered = state.answers.filter((answer) => answer !== null).length;

    $('topbar-progress').textContent = `السؤال ${String(number).padStart(2, '0')} / ${questions.length}`;
    $('question-number').textContent = String(number).padStart(2, '0');
    $('question-total').textContent = questions.length;
    $('unit-label').textContent = question.unit || 'وحدة غير محددة';
    $('lesson-label').textContent = question.lesson || 'درس غير محدد';
    $('question-text').textContent = question.question;
    $('main-progress-bar').style.width = `${percent}%`;
    $('rail-progress-bar').style.width = `${percent}%`;
    $('rail-percent').textContent = `${percent}%`;
    $('answered-count').textContent = answered;
    $('rail-total-count').textContent = questions.length;

    $('answers-list').innerHTML = question.answers.map((answer, index) => {
      const isSelected = selectedAnswer === index;
      const cleanAnswer = answer.replace(/^[أابجدد][.)：:]\s*/, '');
      return `<label class="answer-option${isSelected ? ' is-selected' : ''}"><input type="radio" name="question-${state.current}" value="${index}" ${isSelected ? 'checked' : ''} /><span class="answer-option__key">${answerLabels[index]}</span><span class="answer-option__text">${cleanAnswer}</span></label>`;
    }).join('');

    const reviewNote = question.needs_review ? '<span class="source-note--review">تنبيه: هذا السؤال موسوم للمراجعة البشرية.</span>' : '';
    $('source-note').innerHTML = `<strong>المصدر:</strong> ${formatPage(question.page)}${reviewNote ? ` · ${reviewNote}` : ''}`;
    $('prev-button').disabled = state.current === 0;
    $('next-button').hidden = state.current === questions.length - 1;
    $('finish-button').hidden = state.current !== questions.length - 1;
    $('action-status').textContent = selectedAnswer === null ? 'اختر إجابة للمتابعة' : 'تم حفظ اختيارك — يمكنك تغييره متى شئت';
    renderMap();
  };

  const beginQuiz = () => {
    state.current = 0;
    state.answers = Array(questions.length).fill(null);
    showScreen('quiz');
    renderQuestion();
  };

  const goTo = (index) => {
    if (index < 0 || index >= questions.length) return;
    state.current = index;
    renderQuestion();
    const card = document.querySelector('.question-card');
    if (card) card.animate([{ opacity: .6, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, easing: 'ease-out' });
  };

  const finishQuiz = () => {
    const unanswered = state.answers.filter((answer) => answer === null).length;
    if (unanswered > 0 && !window.confirm(`تبقى ${unanswered} أسئلة دون إجابة. هل تريد إنهاء الاختبار الآن؟`)) return;
    if (unanswered === 0 && !window.confirm('هل أنت مستعد لرؤية نتيجتك؟')) return;
    renderResult();
    showScreen('result');
  };

  const renderResult = () => {
    const correct = state.answers.reduce((total, answer, index) => total + (answer !== null && answer === questions[index].correct ? 1 : 0), 0);
    const unanswered = state.answers.filter((answer) => answer === null).length;
    const wrong = questions.length - correct - unanswered;
    const percent = questions.length ? Math.round((correct / questions.length) * 100) : 0;

    $('score-percent').textContent = `${percent}%`;
    $('score-correct').textContent = correct;
    $('score-total').textContent = questions.length;
    $('breakdown-correct').textContent = correct;
    $('breakdown-wrong').textContent = wrong;
    $('breakdown-empty').textContent = unanswered;
    $('review-count-label').textContent = `${questions.length} سؤالًا`;
    $('result-message').textContent = percent >= 80 ? 'إتقان رائع' : percent >= 60 ? 'بداية قوية' : 'فرصة جديدة للتقدم';
    $('score-ring').style.setProperty('--score', `${percent}%`);

    $('review-list').innerHTML = questions.map((question, index) => {
      const answer = state.answers[index];
      const isEmpty = answer === null;
      const isCorrect = !isEmpty && answer === question.correct;
      const statusClass = isEmpty ? 'empty' : isCorrect ? 'correct' : 'wrong';
      const status = isEmpty ? '—' : isCorrect ? '✓' : '×';
      const answerText = isEmpty ? 'لم يتم اختيار إجابة' : `${isCorrect ? 'إجابتك الصحيحة' : 'اختيارك'}: ${question.answers[answer]}`;
      return `<div class="review-item review-item--${statusClass}"><span class="review-item__status">${status}</span><div class="review-item__body"><span class="review-item__number">السؤال ${String(index + 1).padStart(2, '0')} · ${question.lesson || ''}</span><p class="review-item__question" title="${question.question.replace(/"/g, '&quot;')}">${question.question}</p><span class="review-item__answer">${answerText}${!isCorrect && !isEmpty ? ` · <strong>الصحيح: ${question.answers[question.correct]}</strong>` : ''}</span></div></div>`;
    }).join('');
  };

  $('total-count').textContent = questions.length;
  $('rail-total-count').textContent = questions.length;
  $('question-total').textContent = questions.length;
  $('review-count-label').textContent = `${questions.length} سؤالًا`;

  $('start-button').addEventListener('click', beginQuiz);
  $('restart-button').addEventListener('click', beginQuiz);
  $('prev-button').addEventListener('click', () => goTo(state.current - 1));
  $('next-button').addEventListener('click', () => goTo(state.current + 1));
  $('finish-button').addEventListener('click', finishQuiz);
  $('quit-button').addEventListener('click', () => {
    if (window.confirm('سيتم حذف اختيارات هذه المحاولة. هل تريد العودة؟')) showScreen('start');
  });

  $('answers-list').addEventListener('change', (event) => {
    if (!event.target.matches('input[type="radio"]')) return;
    state.answers[state.current] = Number(event.target.value);
    renderQuestion();
  });
  $('question-map').addEventListener('click', (event) => {
    const button = event.target.closest('[data-map-index]');
    if (button) goTo(Number(button.dataset.mapIndex));
  });
  document.addEventListener('keydown', (event) => {
    if ($('quiz-screen').hidden) return;
    if (event.key >= '1' && event.key <= '4') {
      state.answers[state.current] = Number(event.key) - 1;
      renderQuestion();
    } else if (event.key === 'ArrowLeft') {
      if (state.current === questions.length - 1) finishQuiz(); else goTo(state.current + 1);
    } else if (event.key === 'ArrowRight') {
      goTo(state.current - 1);
    }
  });
})();