(() => {
  'use strict';

  console.log('APP JS يعمل');

  // =========================
  // البيانات الأساسية
  // =========================

  const allQuestions = Array.isArray(window.questions)
    ? window.questions
    : [];

  const state = {
    current: 0,
    answers: [],
    questions: allQuestions,
    mode: 'all',
    selectedUnit: null
  };

  const STORAGE_KEY =
    'falsafa_quiz_progress';

  const $ = (id) =>
    document.getElementById(id);

  const screens = {
    start: $('start-screen'),
    quiz: $('quiz-screen'),
    result: $('result-screen')
  };

  const answerLabels = [
    'أ',
    'ب',
    'ج',
    'د'
  ];

  // =========================
  // الأسئلة والوحدات
  // =========================

  const getUnitQuestions = (unit) => {
    return allQuestions.filter(
      (question) =>
        question.unit === unit
    );
  };

  const getUnits = () => {
    return [
      ...new Set(
        allQuestions
          .map(
            (question) =>
              question.unit
          )
          .filter(Boolean)
      )
    ];
  };

  // =========================
  // أدوات عامة
  // =========================

  const formatPage = (page) => {
    if (
      page === null ||
      page === undefined
    ) {
      return 'الصفحة غير محددة';
    }

    if (
      typeof page === 'object'
    ) {
      return `الصفحة المطبوعة ${page.printed} · PDF ${page.pdf}`;
    }

    return `الصفحة ${page}`;
  };

  // =========================
  // الحفظ
  // =========================

  const saveProgress = () => {
    const progress = {
      current: state.current,
      answers: state.answers,
      mode: state.mode,
      selectedUnit:
        state.selectedUnit,
      completed: false
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(progress)
    );

    updateResumeBox();
  };

  const clearProgress = () => {
    localStorage.removeItem(
      STORAGE_KEY
    );

    state.current = 0;

    state.answers = Array(
      state.questions.length
    ).fill(null);

    updateResumeBox();
  };

  const markQuizCompleted = () => {
    localStorage.removeItem(
      STORAGE_KEY
    );

    updateResumeBox();
  };

  // =========================
  // استرجاع الاختبار
  // =========================

  const loadProgress = () => {
    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!saved) {
      return false;
    }

    try {
      const progress =
        JSON.parse(saved);

      if (
        !Array.isArray(
          progress.answers
        )
      ) {
        localStorage.removeItem(
          STORAGE_KEY
        );

        return false;
      }

      if (
        progress.completed === true
      ) {
        localStorage.removeItem(
          STORAGE_KEY
        );

        return false;
      }

      const savedMode =
        progress.mode || 'all';

      let savedQuestions =
        allQuestions;

      if (
        savedMode === 'unit' &&
        progress.selectedUnit !== null &&
        progress.selectedUnit !== undefined
      ) {
        savedQuestions =
          getUnitQuestions(
            progress.selectedUnit
          );
      }

      if (
        progress.answers.length !==
        savedQuestions.length
      ) {
        localStorage.removeItem(
          STORAGE_KEY
        );

        return false;
      }

      state.mode =
        savedMode;

      state.selectedUnit =
        progress.selectedUnit ??
        null;

      state.questions =
        savedQuestions;

      state.current =
        Math.min(
          Math.max(
            Number(
              progress.current
            ) || 0,
            0
          ),
          Math.max(
            state.questions.length - 1,
            0
          )
        );

      state.answers =
        progress.answers.map(
          (answer) => {
            if (answer === null) {
              return null;
            }

            const number =
              Number(answer);

            return Number.isInteger(
              number
            )
              ? number
              : null;
          }
        );

      return state.answers.some(
        (answer) =>
          answer !== null
      );

    } catch (error) {
      console.error(
        'تعذر استرجاع التقدم:',
        error
      );

      localStorage.removeItem(
        STORAGE_KEY
      );

      return false;
    }
  };

  // =========================
  // صندوق استكمال الاختبار
  // =========================

  const updateResumeBox = () => {
    const resumeBox =
      $('resume-box');

    const resumeProgress =
      $('resume-progress');

    if (
      !resumeBox ||
      !resumeProgress
    ) {
      return;
    }

    const hasAnswers =
      state.answers.some(
        (answer) =>
          answer !== null
      );

    if (!hasAnswers) {
      resumeBox.hidden = true;
      return;
    }

    const answered =
      state.answers.filter(
        (answer) =>
          answer !== null
      ).length;

    const modeText =
      state.mode === 'unit' &&
      state.selectedUnit
        ? ` · ${state.selectedUnit}`
        : ' · الاختبار الشامل';

    resumeProgress.textContent =
      `أجبت عن ${answered} من ${state.questions.length} سؤالًا${modeText}`;

    resumeBox.hidden = false;
  };

  // =========================
  // عرض الصفحات
  // =========================

  const showScreen = (name) => {
    Object.entries(
      screens
    ).forEach(
      ([key, screen]) => {
        if (!screen) {
          return;
        }

        const active =
          key === name;

        screen.hidden =
          !active;

        screen.classList.toggle(
          'is-active',
          active
        );
      }
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // =========================
  // خريطة الأسئلة
  // =========================

  const renderMap = () => {
    const map =
      $('question-map');

    if (!map) {
      return;
    }

    map.innerHTML =
      state.questions
        .map(
          (
            question,
            index
          ) => {
            const selected =
              state.answers[
                index
              ] !== null;

            const current =
              index ===
              state.current;

            return `
              <button
                class="map-dot${selected ? ' is-answered' : ''}${current ? ' is-current' : ''}"
                type="button"
                data-map-index="${index}"
                aria-label="السؤال ${index + 1}"
                aria-current="${current ? 'step' : 'false'}"
              >
                ${String(index + 1).padStart(2, '0')}
              </button>
            `;
          }
        )
        .join('');
  };

  // =========================
  // عرض السؤال
  // =========================

  const renderQuestion = () => {
    if (
      !state.questions.length
    ) {
      return;
    }

    const question =
      state.questions[
        state.current
      ];

    const selectedAnswer =
      state.answers[
        state.current
      ];

    const number =
      state.current + 1;

    const percent =
      Math.round(
        (number /
          state.questions.length) *
          100
      );

    const answered =
      state.answers.filter(
        (answer) =>
          answer !== null
      ).length;

    $('topbar-progress').textContent =
      `السؤال ${String(number).padStart(2, '0')} / ${state.questions.length}`;

    $('question-number').textContent =
      String(number).padStart(
        2,
        '0'
      );

    $('question-total').textContent =
      state.questions.length;

    $('unit-label').textContent =
      question.unit ||
      'وحدة غير محددة';

    $('lesson-label').textContent =
      question.lesson ||
      'درس غير محدد';

    $('question-text').textContent =
      question.question;

    $('main-progress-bar').style.width =
      `${percent}%`;

    $('rail-progress-bar').style.width =
      `${percent}%`;

    $('rail-percent').textContent =
      `${percent}%`;

    $('answered-count').textContent =
      answered;

    $('rail-total-count').textContent =
      state.questions.length;

    $('answers-list').innerHTML =
      question.answers
        .map(
          (
            answer,
            index
          ) => {
            const isSelected =
              selectedAnswer ===
              index;

            const cleanAnswer =
              answer.replace(
                /^[أابجدد][.)：:]\s*/,
                ''
              );

            return `
              <label class="answer-option${isSelected ? ' is-selected' : ''}">

                <input
                  type="radio"
                  name="question-${state.current}"
                  value="${index}"
                  ${isSelected ? 'checked' : ''}
                />

                <span class="answer-option__key">
                  ${answerLabels[index]}
                </span>

                <span class="answer-option__text">
                  ${cleanAnswer}
                </span>

              </label>
            `;
          }
        )
        .join('');

    const reviewNote =
      question.needs_review
        ? '<span class="source-note--review">تنبيه: هذا السؤال موسوم للمراجعة البشرية.</span>'
        : '';

    $('source-note').innerHTML =
      `<strong>المصدر:</strong> ${formatPage(question.page)}${reviewNote ? ` · ${reviewNote}` : ''}`;

    $('prev-button').disabled =
      state.current === 0;

    $('next-button').hidden =
      state.current ===
      state.questions.length - 1;

    $('finish-button').hidden =
      state.current !==
      state.questions.length - 1;

    $('action-status').textContent =
      selectedAnswer === null
        ? 'اختر إجابة للمتابعة'
        : 'تم حفظ اختيارك — يمكنك تغييره متى شئت';

    renderMap();
  };

  // =========================
  // بدء الاختبار
  // =========================

  const startQuiz = (
    mode = 'all',
    unit = null
  ) => {
    state.mode =
      mode;

    state.selectedUnit =
      unit;

    state.questions =
      mode === 'unit'
        ? getUnitQuestions(unit)
        : allQuestions;

    state.current = 0;

    state.answers =
      Array(
        state.questions.length
      ).fill(null);

    clearProgress();

    showScreen(
      'quiz'
    );

    renderQuestion();
  };

  // =========================
  // الاختبار الشامل
  // =========================

  const beginFullQuiz = () => {
    startQuiz(
      'all',
      null
    );
  };

  // =========================
  // اختبار وحدة
  // =========================

  const beginUnitQuiz = (
    unit
  ) => {
    if (!unit) {
      return;
    }

    startQuiz(
      'unit',
      unit
    );
  };

  // =========================
  // متابعة اختبار محفوظ
  // =========================

  const continueQuiz = () => {
    const restored =
      loadProgress();

    if (!restored) {
      beginFullQuiz();
      return;
    }

    showScreen(
      'quiz'
    );

    renderQuestion();
  };

  // =========================
  // الانتقال بين الأسئلة
  // =========================

  const goTo = (
    index
  ) => {
    if (
      index < 0 ||
      index >=
        state.questions.length
    ) {
      return;
    }

    state.current =
      index;

    saveProgress();

    renderQuestion();

    const card =
      document.querySelector(
        '.question-card'
      );

    if (card) {
      card.animate(
        [
          {
            opacity: 0.6,
            transform:
              'translateY(5px)'
          },
          {
            opacity: 1,
            transform:
              'translateY(0)'
          }
        ],
        {
          duration: 220,
          easing:
            'ease-out'
        }
      );
    }
  };

  // =========================
  // إنهاء الاختبار
  // =========================

  const finishQuiz = () => {
    const unanswered =
      state.answers.filter(
        (answer) =>
          answer === null
      ).length;

    if (
      unanswered > 0
    ) {
      if (
        !window.confirm(
          `تبقى ${unanswered} أسئلة دون إجابة. هل تريد إنهاء الاختبار الآن؟`
        )
      ) {
        return;
      }
    } else {
      if (
        !window.confirm(
          'هل أنت مستعد لرؤية نتيجتك؟'
        )
      ) {
        return;
      }
    }

    markQuizCompleted();

    renderResult();

    showScreen(
      'result'
    );
  };

  // =========================
  // النتيجة
  // =========================

  const renderResult = () => {
    const correct =
      state.answers.reduce(
        (
          total,
          answer,
          index
        ) =>
          total +
          (
            answer !== null &&
            answer ===
              state.questions[
                index
              ].correct
              ? 1
              : 0
          ),
        0
      );

    const unanswered =
      state.answers.filter(
        (answer) =>
          answer === null
      ).length;

    const wrong =
      state.questions.length -
      correct -
      unanswered;

    const percent =
      state.questions.length
        ? Math.round(
            (correct /
              state.questions.length) *
              100
          )
        : 0;

    $('score-percent').textContent =
      `${percent}%`;

    $('score-correct').textContent =
      correct;

    $('score-total').textContent =
      state.questions.length;

    $('breakdown-correct').textContent =
      correct;

    $('breakdown-wrong').textContent =
      wrong;

    $('breakdown-empty').textContent =
      unanswered;

    $('review-count-label').textContent =
      `${state.questions.length} سؤالًا`;

    $('result-message').textContent =
      percent >= 80
        ? 'إتقان رائع'
        : percent >= 60
          ? 'بداية قوية'
          : 'فرصة جديدة للتقدم';

    $('score-ring').style.setProperty(
      '--score',
      `${percent}%`
    );

    $('review-list').innerHTML =
      state.questions
        .map(
          (
            question,
            index
          ) => {
            const answer =
              state.answers[
                index
              ];

            const isEmpty =
              answer === null;

            const isCorrect =
              !isEmpty &&
              answer ===
                question.correct;

            const statusClass =
              isEmpty
                ? 'empty'
                : isCorrect
                  ? 'correct'
                  : 'wrong';

            const status =
              isEmpty
                ? '—'
                : isCorrect
                  ? '✓'
                  : '×';

            const answerText =
              isEmpty
                ? 'لم يتم اختيار إجابة'
                : `${
                    isCorrect
                      ? 'إجابتك الصحيحة'
                      : 'اختيارك'
                  }: ${
                    question.answers[
                      answer
                    ]
                  }`;

            return `
              <div class="review-item review-item--${statusClass}">

                <span class="review-item__status">
                  ${status}
                </span>

                <div class="review-item__body">

                  <span class="review-item__number">
                    السؤال ${String(index + 1).padStart(2, '0')} · ${question.lesson || ''}
                  </span>

                  <p
                    class="review-item__question"
                    title="${question.question.replace(/"/g, '&quot;')}"
                  >
                    ${question.question}
                  </p>

                  <span class="review-item__answer">
                    ${answerText}

                    ${
                      !isCorrect &&
                      !isEmpty
                        ? ` · <strong>الصحيح: ${question.answers[question.correct]}</strong>`
                        : ''
                    }
                  </span>

                </div>

              </div>
            `;
          }
        )
        .join('');
  };

  // =========================
  // التهيئة
  // =========================

  loadProgress();

  if ($('total-count')) {
    $('total-count').textContent =
      allQuestions.length;
  }

  if ($('rail-total-count')) {
    $('rail-total-count').textContent =
      state.questions.length;
  }

  if ($('question-total')) {
    $('question-total').textContent =
      state.questions.length;
  }

  if ($('review-count-label')) {
    $('review-count-label').textContent =
      `${state.questions.length} سؤالًا`;
  }

  updateResumeBox();

  // =========================
  // زر الاختبار الشامل
  // =========================

  const startButton =
    $('start-button');

  if (startButton) {
    startButton.addEventListener(
      'click',
      beginFullQuiz
    );
  }

  // =========================
  // اختيار الوحدة
  // =========================

  const unitSelectButton =
    $('unit-select-button');

  if (unitSelectButton) {
    unitSelectButton.addEventListener(
      'click',
      () => {
        const units =
          getUnits();

        const existingPicker =
          document.getElementById(
            'unit-picker'
          );

        if (existingPicker) {
          existingPicker.remove();
          return;
        }

        const picker =
          document.createElement(
            'div'
          );

        picker.id =
          'unit-picker';

        picker.className =
          'unit-picker';

        picker.innerHTML = `
          <div class="unit-picker__header">
            <strong>اختر الوحدة</strong>
            <span>ابدأ اختبارًا خاصًا بوحدة واحدة</span>
          </div>

          <div class="unit-picker__list">
            ${units
              .map(
                (unit) => `
                  <button
                    class="button button--ghost unit-picker__button"
                    type="button"
                    data-unit="${unit}"
                  >
                    ${unit}
                    <span aria-hidden="true">←</span>
                  </button>
                `
              )
              .join('')}
          </div>
        `;

        document.body.appendChild(
          picker
        );

        // شكل النافذة
        picker.style.position =
          'fixed';

        picker.style.inset =
          '0';

        picker.style.zIndex =
          '9999';

        picker.style.background =
          'rgba(20, 33, 61, 0.45)';

        picker.style.display =
          'flex';

        picker.style.alignItems =
          'center';

        picker.style.justifyContent =
          'center';

        picker.style.padding =
          '20px';

        picker.style.boxSizing =
          'border-box';

        // صندوق الوحدات
        const pickerBox =
          picker.querySelector(
            '.unit-picker__list'
          );

        if (pickerBox) {
          pickerBox.style.background =
            '#fff';

          pickerBox.style.borderRadius =
            '14px';

          pickerBox.style.padding =
            '20px';

          pickerBox.style.width =
            'min(100%, 520px)';

          pickerBox.style.maxHeight =
            '80vh';

          pickerBox.style.overflowY =
            'auto';
        }

        // أزرار الوحدات
        picker
          .querySelectorAll(
            '[data-unit]'
          )
          .forEach(
            (button) => {
              button.addEventListener(
                'click',
                () => {
                  const selectedUnit =
                    button.dataset.unit;

                  picker.remove();

                  beginUnitQuiz(
                    selectedUnit
                  );
                }
              );
            }
          );
      }
    );
  }

  // =========================
  // إعادة الاختبار
  // =========================

  const restartButton =
    $('restart-button');

  if (restartButton) {
    restartButton.addEventListener(
      'click',
      beginFullQuiz
    );
  }

  // =========================
  // متابعة الاختبار
  // =========================

  const continueButton =
    $('continue-button');

  if (continueButton) {
    continueButton.addEventListener(
      'click',
      continueQuiz
    );
  }

  // =========================
  // اختبار جديد
  // =========================

  const newTestButton =
    $('new-test-button');

  if (newTestButton) {
    newTestButton.addEventListener(
      'click',
      beginFullQuiz
    );
  }

  // =========================
  // زر السابق
  // =========================

  const prevButton =
    $('prev-button');

  if (prevButton) {
    prevButton.addEventListener(
      'click',
      () => {
        goTo(
          state.current - 1
        );
      }
    );
  }

  // =========================
  // زر التالي
  // =========================

  const nextButton =
    $('next-button');

  if (nextButton) {
    nextButton.addEventListener(
      'click',
      () => {
        goTo(
          state.current + 1
        );
      }
    );
  }

  // =========================
  // زر إنهاء الاختبار
  // =========================

  const finishButton =
    $('finish-button');

  if (finishButton) {
    finishButton.addEventListener(
      'click',
      finishQuiz
    );
  }

  // =========================
  // زر إنهاء / الخروج
  // =========================

  const quitButton =
    $('quit-button');

  if (quitButton) {
    quitButton.addEventListener(
      'click',
      () => {
        if (
          window.confirm(
            'هل تريد إنهاء الاختبار الآن وعرض نتيجتك؟'
          )
        ) {
          renderResult();

          showScreen(
            'result'
          );
        }
      }
    );
  }

  // =========================
  // اختيار الإجابة
  // =========================

  const answersList =
    $('answers-list');

  if (answersList) {
    answersList.addEventListener(
      'change',
      (event) => {
        if (
          !event.target.matches(
            'input[type="radio"]'
          )
        ) {
          return;
        }

        state.answers[
          state.current
        ] =
          Number(
            event.target.value
          );

        saveProgress();

        renderQuestion();
      }
    );
  }

  // =========================
  // خريطة الأسئلة
  // =========================

  const questionMap =
    $('question-map');

  if (questionMap) {
    questionMap.addEventListener(
      'click',
      (event) => {
        const button =
          event.target.closest(
            '[data-map-index]'
          );

        if (button) {
          goTo(
            Number(
              button.dataset.mapIndex
            )
          );
        }
      }
    );
  }

  // =========================
  // لوحة المفاتيح
  // =========================

  document.addEventListener(
    'keydown',
    (event) => {
      const quizScreen =
        $('quiz-screen');

      if (
        !quizScreen ||
        quizScreen.hidden
      ) {
        return;
      }

      // 1 - 4 لاختيار الإجابة
      if (
        event.key >= '1' &&
        event.key <= '4'
      ) {
        state.answers[
          state.current
        ] =
          Number(event.key) - 1;

        saveProgress();

        renderQuestion();

        return;
      }

      // السهم الأيسر
      if (
        event.key ===
        'ArrowLeft'
      ) {
        if (
          state.current ===
          state.questions.length - 1
        ) {
          finishQuiz();
        } else {
          goTo(
            state.current + 1
          );
        }

        return;
      }

      // السهم الأيمن
      if (
        event.key ===
        'ArrowRight'
      ) {
        goTo(
          state.current - 1
        );
      }
    }
  );

})();