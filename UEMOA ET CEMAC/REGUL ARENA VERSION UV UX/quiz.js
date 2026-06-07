/**
 * REGUL ARENA - Module Quiz (Frontend)
 *
 * Architecture vanilla JS, aucun framework requis.
 * Dépend de : quiz-data.js (window.QUIZ_BANK + window.QuizDataHelpers)
 *
 * Usage minimal dans index.html :
 *   <script src="js/quiz-data.js"></script>
 *   <script src="js/quiz.js"></script>
 *   <script>
 *     const quiz = new RegulArenaQuiz({
 *       container: document.getElementById('quiz-root'),
 *       playerLevel: 5,
 *       onComplete: (result) => console.log(result),
 *       apiBase: '/api'   // optionnel, pour scoring serveur-côté
 *     });
 *     quiz.start();
 *   </script>
 *
 * Le module respecte le design system (variables CSS --primary, --secondary, etc.)
 */

class RegulArenaQuiz {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.playerLevel = options.playerLevel || 1;
    this.questionCount = options.questionCount || 10;
    this.timePerQuestion = options.timePerQuestion || 20; // secondes
    this.category = options.category || null; // null = toutes
    this.onComplete = options.onComplete || (() => {});
    this.apiBase = options.apiBase || null;
    this.authToken = options.authToken || null;

    // État interne
    this.questions = [];
    this.currentIndex = 0;
    this.timer = null;
    this.timeLeft = this.timePerQuestion;
    this.answers = []; // {questionId, selectedIndex, timeSpent, isCorrect, xpEarned}
    this.totalXp = 0;
    this.startedAt = null;
  }

  // ════════════════════════════════════════════════════════
  //  CYCLE DE VIE
  // ════════════════════════════════════════════════════════

  start() {
    if (!window.QUIZ_BANK || !window.QuizDataHelpers) {
      this._renderError("Banque de questions non chargée. Vérifiez que quiz-data.js est inclus avant quiz.js.");
      return;
    }

    // Sélection des questions
    if (this.category) {
      const pool = window.QuizDataHelpers.byCategory(this.category);
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      this.questions = shuffled.slice(0, this.questionCount);
    } else {
      this.questions = window.QuizDataHelpers.randomSet(this.questionCount, this.playerLevel);
    }

    if (this.questions.length === 0) {
      this._renderError("Aucune question disponible pour cette catégorie.");
      return;
    }

    this.startedAt = Date.now();
    this.currentIndex = 0;
    this.answers = [];
    this.totalXp = 0;
    this._renderQuestion();
  }

  // ════════════════════════════════════════════════════════
  //  RENDU DES VUES
  // ════════════════════════════════════════════════════════

  _renderQuestion() {
    const q = this.questions[this.currentIndex];
    const progress = ((this.currentIndex) / this.questions.length) * 100;
    const difficultyStars = '⭐'.repeat(q.difficulty) + '☆'.repeat(5 - q.difficulty);

    this.container.innerHTML = `
      <div class="ra-quiz-wrapper">
        <!-- En-tête : progression + catégorie + difficulté -->
        <div class="ra-quiz-header">
          <div class="ra-quiz-meta">
            <span class="ra-quiz-cat">${this._escapeHtml(q.category)}</span>
            <span class="ra-quiz-diff" title="Niveau de difficulté">${difficultyStars}</span>
            <span class="ra-quiz-xp-tag">+${q.xp} XP</span>
          </div>
          <div class="ra-quiz-progress-text">
            Question ${this.currentIndex + 1} / ${this.questions.length}
          </div>
        </div>

        <div class="ra-quiz-progress-bar">
          <div class="ra-quiz-progress-fill" style="width:${progress}%"></div>
        </div>

        <!-- Timer -->
        <div class="ra-quiz-timer-wrapper">
          <div class="ra-quiz-timer" id="ra-timer">${this.timePerQuestion}s</div>
          <div class="ra-quiz-timer-bar">
            <div class="ra-quiz-timer-fill" id="ra-timer-fill" style="width:100%"></div>
          </div>
        </div>

        <!-- Question -->
        <div class="ra-quiz-question">${this._escapeHtml(q.question)}</div>

        <!-- Options -->
        <div class="ra-quiz-options" id="ra-options">
          ${q.options.map((opt, i) => `
            <button class="ra-quiz-option" data-index="${i}">
              <span class="ra-quiz-option-letter">${String.fromCharCode(65 + i)}</span>
              <span class="ra-quiz-option-text">${this._escapeHtml(opt)}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    // Attacher les event listeners
    this.container.querySelectorAll('.ra-quiz-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        this._handleAnswer(idx);
      });
    });

    this._startTimer();
  }

  _startTimer() {
    this.timeLeft = this.timePerQuestion;
    const timerEl = this.container.querySelector('#ra-timer');
    const fillEl = this.container.querySelector('#ra-timer-fill');

    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (timerEl) timerEl.textContent = `${this.timeLeft}s`;
      if (fillEl) {
        const pct = (this.timeLeft / this.timePerQuestion) * 100;
        fillEl.style.width = `${pct}%`;
        // Urgence visuelle sous 10s
        if (this.timeLeft <= 10) fillEl.classList.add('ra-urgent');
        if (this.timeLeft <= 5) fillEl.classList.add('ra-critical');
      }
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this._handleAnswer(-1); // -1 = timeout
      }
    }, 1000);
  }

  _handleAnswer(selectedIndex) {
    clearInterval(this.timer);
    const q = this.questions[this.currentIndex];
    const isCorrect = selectedIndex === q.correctIndex;
    const timeSpent = this.timePerQuestion - this.timeLeft;

    // Bonus rapidité : si répondu en <50% du temps, +25% XP
    let xpEarned = 0;
    if (isCorrect) {
      xpEarned = q.xp;
      if (timeSpent < this.timePerQuestion * 0.5) {
        xpEarned = Math.round(q.xp * 1.25);
      }
      this.totalXp += xpEarned;
    }

    this.answers.push({
      questionId: q.id,
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect,
      timeSpent,
      xpEarned
    });

    // Feedback visuel sur les options
    this.container.querySelectorAll('.ra-quiz-option').forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.correctIndex) btn.classList.add('ra-correct');
      else if (i === selectedIndex) btn.classList.add('ra-wrong');
    });

    // Popup XP si gagné
    if (xpEarned > 0) this._showXpPopup(xpEarned);

    // Afficher l'explication après 800ms (laisse le temps de voir le feedback)
    setTimeout(() => this._renderExplanation(q, isCorrect, xpEarned), 800);
  }

  _renderExplanation(q, isCorrect, xpEarned) {
    const explanationHtml = `
      <div class="ra-quiz-explanation ${isCorrect ? 'correct' : 'wrong'}">
        <div class="ra-quiz-result-icon">${isCorrect ? '✓' : '✗'}</div>
        <div class="ra-quiz-result-title">
          ${isCorrect ? `Bonne réponse ! +${xpEarned} XP` : 'Réponse incorrecte'}
        </div>
        <div class="ra-quiz-explanation-text">
          ${this._escapeHtml(q.explanation)}
        </div>
        <div class="ra-quiz-source">
          📖 <strong>Source :</strong> ${this._escapeHtml(q.source)}
        </div>
        <button class="ra-quiz-next-btn" id="ra-next-btn">
          ${this.currentIndex + 1 < this.questions.length ? 'Question suivante →' : 'Voir mon score 🏆'}
        </button>
      </div>
    `;

    // Insérer en bas, sans détruire la question (pour que l'utilisateur voie sa réponse + l'explication)
    const wrapper = this.container.querySelector('.ra-quiz-wrapper');
    if (wrapper) {
      const div = document.createElement('div');
      div.innerHTML = explanationHtml;
      wrapper.appendChild(div.firstElementChild);
      wrapper.querySelector('.ra-quiz-explanation').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const nextBtn = this.container.querySelector('#ra-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentIndex++;
        if (this.currentIndex < this.questions.length) {
          this._renderQuestion();
        } else {
          this._renderFinalScore();
        }
      });
    }
  }

  async _renderFinalScore() {
    const correctCount = this.answers.filter(a => a.isCorrect).length;
    const total = this.questions.length;
    const percentage = Math.round((correctCount / total) * 100);
    const durationSec = Math.round((Date.now() - this.startedAt) / 1000);

    // Détermination du rank visuel
    let rank, rankColor, rankMsg;
    if (percentage >= 90)      { rank = 'S';  rankColor = 'var(--secondary)'; rankMsg = 'Performance exceptionnelle !'; }
    else if (percentage >= 75) { rank = 'A';  rankColor = 'var(--accent)';    rankMsg = 'Excellent travail !'; }
    else if (percentage >= 60) { rank = 'B';  rankColor = 'var(--primary)';   rankMsg = 'Bon résultat, continuez !'; }
    else if (percentage >= 40) { rank = 'C';  rankColor = '#FFB347';          rankMsg = 'À retravailler.'; }
    else                       { rank = 'D';  rankColor = '#FF4444';          rankMsg = 'Révisez vos sources et retentez.'; }

    this.container.innerHTML = `
      <div class="ra-quiz-result-screen">
        <div class="ra-quiz-rank-badge" style="border-color:${rankColor}; color:${rankColor};">
          ${rank}
        </div>
        <h2 class="ra-quiz-result-headline">${rankMsg}</h2>

        <div class="ra-quiz-stats-grid">
          <div class="ra-stat">
            <div class="ra-stat-value">${correctCount}/${total}</div>
            <div class="ra-stat-label">Bonnes réponses</div>
          </div>
          <div class="ra-stat">
            <div class="ra-stat-value">${percentage}%</div>
            <div class="ra-stat-label">Précision</div>
          </div>
          <div class="ra-stat">
            <div class="ra-stat-value" style="color:var(--secondary)">+${this.totalXp}</div>
            <div class="ra-stat-label">XP gagnés</div>
          </div>
          <div class="ra-stat">
            <div class="ra-stat-value">${durationSec}s</div>
            <div class="ra-stat-label">Durée totale</div>
          </div>
        </div>

        <div class="ra-quiz-actions">
          <button class="ra-btn-primary" id="ra-replay-btn">🔁 Rejouer</button>
          <button class="ra-btn-secondary" id="ra-back-btn">← Retour dashboard</button>
        </div>
      </div>
    `;

    this.container.querySelector('#ra-replay-btn')?.addEventListener('click', () => this.start());
    this.container.querySelector('#ra-back-btn')?.addEventListener('click', () => {
      if (typeof window.showDashboard === 'function') window.showDashboard();
    });

    // Envoi du score au serveur (si configuré)
    const result = {
      score: correctCount,
      total,
      percentage,
      xpEarned: this.totalXp,
      durationSec,
      rank,
      answers: this.answers,
      category: this.category || 'mixte',
      playerLevel: this.playerLevel
    };

    if (this.apiBase) {
      try {
        await this._submitScore(result);
      } catch (err) {
        console.warn('[Regul Arena] Score non sauvegardé sur le serveur :', err.message);
      }
    }

    this.onComplete(result);
  }

  async _submitScore(result) {
    const url = `${this.apiBase}/quiz/submit`;
    const headers = { 'Content-Type': 'application/json' };
    if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(result)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  _showXpPopup(amount) {
    const popup = document.createElement('div');
    popup.className = 'ra-xp-popup';
    popup.textContent = `+${amount} XP`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1800);
  }

  _renderError(msg) {
    this.container.innerHTML = `
      <div class="ra-quiz-error">
        <div class="ra-quiz-error-icon">⚠️</div>
        <div>${this._escapeHtml(msg)}</div>
      </div>
    `;
  }

  _escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
}

// ════════════════════════════════════════════════════════
//  STYLES CSS injectés automatiquement (utilisent les variables du design system)
// ════════════════════════════════════════════════════════

(function injectQuizStyles() {
  if (document.getElementById('ra-quiz-styles')) return;
  const style = document.createElement('style');
  style.id = 'ra-quiz-styles';
  style.textContent = `
    .ra-quiz-wrapper {
      max-width: 720px;
      margin: 2rem auto;
      padding: 2rem;
      background: rgba(26, 26, 46, 0.6);
      border: 1px solid rgba(0, 102, 255, 0.2);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }
    .ra-quiz-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .ra-quiz-meta { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
    .ra-quiz-cat {
      background: rgba(0, 102, 255, 0.2);
      color: var(--primary, #0066FF);
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .ra-quiz-diff { font-size: 0.9rem; letter-spacing: 2px; }
    .ra-quiz-xp-tag {
      background: rgba(255, 215, 0, 0.2);
      color: var(--secondary, #FFD700);
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 700;
    }
    .ra-quiz-progress-text { color: var(--muted, #999); font-size: 0.9rem; }

    .ra-quiz-progress-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }
    .ra-quiz-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary, #0066FF), var(--accent, #00FF66));
      transition: width 0.4s ease;
    }

    .ra-quiz-timer-wrapper {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .ra-quiz-timer {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--secondary, #FFD700);
      min-width: 60px;
    }
    .ra-quiz-timer-bar {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }
    .ra-quiz-timer-fill {
      height: 100%;
      background: var(--accent, #00FF66);
      transition: width 1s linear, background-color 0.3s ease;
    }
    .ra-quiz-timer-fill.ra-urgent  { background: #FFB347; }
    .ra-quiz-timer-fill.ra-critical{ background: #FF4444; animation: ra-pulse 0.6s ease-in-out infinite; }

    .ra-quiz-question {
      font-size: 1.15rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
      font-weight: 500;
      color: var(--light, #F0F0F5);
    }

    .ra-quiz-options { display: flex; flex-direction: column; gap: 0.75rem; }
    .ra-quiz-option {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: var(--light, #F0F0F5);
      font-size: 1rem;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .ra-quiz-option:hover:not(:disabled) {
      transform: scale(1.02);
      border-color: var(--primary, #0066FF);
      background: rgba(0, 102, 255, 0.1);
      box-shadow: 0 0 20px rgba(0, 102, 255, 0.3);
    }
    .ra-quiz-option:disabled { cursor: not-allowed; opacity: 0.7; }
    .ra-quiz-option-letter {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0, 102, 255, 0.3);
      font-weight: 700;
      flex-shrink: 0;
    }
    .ra-quiz-option.ra-correct {
      border-color: var(--accent, #00FF66);
      background: rgba(0, 255, 102, 0.15);
      animation: ra-pop 0.4s ease;
    }
    .ra-quiz-option.ra-correct .ra-quiz-option-letter { background: var(--accent, #00FF66); color: var(--dark, #1A1A2E); }
    .ra-quiz-option.ra-wrong {
      border-color: #FF4444;
      background: rgba(255, 68, 68, 0.15);
      animation: ra-shake 0.4s ease;
    }
    .ra-quiz-option.ra-wrong .ra-quiz-option-letter { background: #FF4444; }

    .ra-quiz-explanation {
      margin-top: 1.5rem;
      padding: 1.25rem;
      border-radius: 12px;
      animation: ra-slide-up 0.4s ease;
    }
    .ra-quiz-explanation.correct { background: rgba(0, 255, 102, 0.1); border-left: 4px solid var(--accent, #00FF66); }
    .ra-quiz-explanation.wrong   { background: rgba(255, 68, 68, 0.1); border-left: 4px solid #FF4444; }
    .ra-quiz-result-icon { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
    .ra-quiz-explanation.correct .ra-quiz-result-icon { color: var(--accent, #00FF66); }
    .ra-quiz-explanation.wrong   .ra-quiz-result-icon { color: #FF4444; }
    .ra-quiz-result-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.75rem; }
    .ra-quiz-explanation-text { line-height: 1.5; margin-bottom: 1rem; color: var(--light, #F0F0F5); }
    .ra-quiz-source {
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      font-size: 0.9rem;
      color: var(--muted, #999);
      margin-bottom: 1rem;
    }
    .ra-quiz-source strong { color: var(--secondary, #FFD700); }
    .ra-quiz-next-btn {
      width: 100%;
      padding: 0.9rem 1.5rem;
      background: linear-gradient(135deg, var(--primary, #0066FF), var(--accent, #00FF66));
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      font-family: inherit;
    }
    .ra-quiz-next-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 102, 255, 0.4);
    }

    /* Écran final */
    .ra-quiz-result-screen {
      max-width: 600px;
      margin: 3rem auto;
      padding: 2.5rem;
      background: rgba(26, 26, 46, 0.6);
      border: 1px solid rgba(0, 102, 255, 0.2);
      border-radius: 20px;
      text-align: center;
      backdrop-filter: blur(10px);
    }
    .ra-quiz-rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 120px;
      height: 120px;
      border: 4px solid;
      border-radius: 50%;
      font-size: 3.5rem;
      font-weight: 900;
      margin: 0 auto 1.5rem;
      animation: ra-zoom-rotate 0.6s ease;
    }
    .ra-quiz-result-headline { font-size: 1.5rem; margin-bottom: 2rem; color: var(--light, #F0F0F5); }
    .ra-quiz-stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .ra-stat {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }
    .ra-stat-value {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--light, #F0F0F5);
      font-family: 'JetBrains Mono', monospace;
    }
    .ra-stat-label { font-size: 0.85rem; color: var(--muted, #999); margin-top: 0.25rem; }

    .ra-quiz-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
    .ra-btn-primary, .ra-btn-secondary {
      padding: 0.9rem 1.5rem;
      border: none;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: transform 0.2s ease;
    }
    .ra-btn-primary {
      background: linear-gradient(135deg, var(--primary, #0066FF), var(--accent, #00FF66));
      color: white;
    }
    .ra-btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: var(--light, #F0F0F5);
    }
    .ra-btn-primary:hover, .ra-btn-secondary:hover { transform: translateY(-2px); }

    /* XP Popup */
    .ra-xp-popup {
      position: fixed;
      bottom: 30px;
      right: 30px;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, var(--secondary, #FFD700), #FFA500);
      color: var(--dark, #1A1A2E);
      border-radius: 12px;
      font-weight: 800;
      font-size: 1.2rem;
      box-shadow: 0 8px 24px rgba(255, 215, 0, 0.5);
      animation: ra-xp-fly 1.8s ease forwards;
      z-index: 9999;
      pointer-events: none;
    }

    .ra-quiz-error {
      text-align: center;
      padding: 3rem;
      color: var(--muted, #999);
    }
    .ra-quiz-error-icon { font-size: 3rem; margin-bottom: 1rem; }

    /* Animations */
    @keyframes ra-pulse {
      0%, 100% { transform: scaleY(1); opacity: 1; }
      50%      { transform: scaleY(1.4); opacity: 0.7; }
    }
    @keyframes ra-pop {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.06); }
      100% { transform: scale(1); }
    }
    @keyframes ra-shake {
      0%, 100% { transform: translateX(0); }
      25%      { transform: translateX(-6px); }
      75%      { transform: translateX(6px); }
    }
    @keyframes ra-slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ra-zoom-rotate {
      from { opacity: 0; transform: scale(0.3) rotate(-15deg); }
      to   { opacity: 1; transform: scale(1) rotate(0); }
    }
    @keyframes ra-xp-fly {
      0%   { opacity: 0; transform: translateY(20px) scale(0.8); }
      20%  { opacity: 1; transform: translateY(0) scale(1.1); }
      80%  { opacity: 1; transform: translateY(-30px) scale(1); }
      100% { opacity: 0; transform: translateY(-80px) scale(0.9); }
    }

    /* Mobile */
    @media (max-width: 600px) {
      .ra-quiz-wrapper { padding: 1.25rem; margin: 1rem; }
      .ra-quiz-question { font-size: 1rem; }
      .ra-quiz-stats-grid { grid-template-columns: 1fr 1fr; }
      .ra-quiz-rank-badge { width: 90px; height: 90px; font-size: 2.5rem; }
    }
  `;
  document.head.appendChild(style);
})();

// Export pour usage modulaire (si tu migres vers Vite/Webpack plus tard)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RegulArenaQuiz;
} else {
  window.RegulArenaQuiz = RegulArenaQuiz;
}
