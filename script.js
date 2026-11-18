const difficultyBtns = document.querySelectorAll('.diff-btn');
const attemptsLeftEl = document.getElementById('attemptsLeft');
const guessesMadeEl = document.getElementById('guessesMade');
const bestScoreEl = document.getElementById('bestScore');
const feedbackBox = document.getElementById('feedbackBox');
const guessForm = document.getElementById('guessForm');
const guessInput = document.getElementById('guessInput');
const guessBtn = document.getElementById('guessBtn');
const historyList = document.getElementById('historyList');
const restartBtn = document.getElementById('restartBtn');

let maxRange = 100;
let maxAttempts = 10;
let secretNumber = 0;
let attemptsLeft = 10;
let guesses = [];
let gameOver = false;

// Store best scores (fewest guesses) per difficulty in localStorage
const bestScores = JSON.parse(localStorage.getItem('numGuessBestScores')) || {};

function initGame() {
  secretNumber = Math.floor(Math.random() * maxRange) + 1;
  attemptsLeft = maxAttempts;
  guesses = [];
  gameOver = false;

  attemptsLeftEl.textContent = attemptsLeft;
  guessesMadeEl.textContent = '0';
  bestScoreEl.textContent = bestScores[maxRange] ? `${bestScores[maxRange]} tries` : '-';

  feedbackBox.className = 'feedback-box';
  feedbackBox.innerHTML = `I'm thinking of a number between <strong>1</strong> and <strong>${maxRange}</strong>.`;

  guessInput.min = 1;
  guessInput.max = maxRange;
  guessInput.value = '';
  guessInput.disabled = false;
  guessBtn.disabled = false;
  guessInput.focus();

  historyList.innerHTML = '<span class="empty-history">No guesses yet</span>';
}

function addGuessPill(num, type) {
  if (guesses.length === 1) {
    historyList.innerHTML = '';
  }

  const pill = document.createElement('span');
  pill.className = `guess-pill ${type}`;
  const arrow = type === 'high' ? '↓' : type === 'low' ? '↑' : '✓';
  pill.textContent = `${num} ${arrow}`;
  historyList.appendChild(pill);
}

function triggerShake() {
  feedbackBox.classList.remove('shake');
  void feedbackBox.offsetWidth; // trigger reflow
  feedbackBox.classList.add('shake');
}

function endGame(isWin) {
  gameOver = true;
  guessInput.disabled = true;
  guessBtn.disabled = true;

  if (isWin) {
    const tries = guesses.length;
    if (!bestScores[maxRange] || tries < bestScores[maxRange]) {
      bestScores[maxRange] = tries;
      localStorage.setItem('numGuessBestScores', JSON.stringify(bestScores));
      bestScoreEl.textContent = `${tries} tries`;
    }
  }
}

guessForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (gameOver) return;

  const userGuess = parseInt(guessInput.value, 10);
  guessInput.value = '';
  guessInput.focus();

  // Validation
  if (isNaN(userGuess) || userGuess < 1 || userGuess > maxRange) {
    feedbackBox.className = 'feedback-box high';
    feedbackBox.textContent = `Please enter a valid number between 1 and ${maxRange}.`;
    triggerShake();
    return;
  }

  if (guesses.includes(userGuess)) {
    feedbackBox.className = 'feedback-box high';
    feedbackBox.textContent = `You already guessed ${userGuess}! Try a different number.`;
    triggerShake();
    return;
  }

  guesses.push(userGuess);
  attemptsLeft--;
  attemptsLeftEl.textContent = attemptsLeft;
  guessesMadeEl.textContent = guesses.length;

  // Check Win
  if (userGuess === secretNumber) {
    feedbackBox.className = 'feedback-box win';
    feedbackBox.innerHTML = `🎉 Correct! The number was <strong>${secretNumber}</strong>. You got it in <strong>${guesses.length}</strong> ${guesses.length === 1 ? 'try' : 'tries'}!`;
    addGuessPill(userGuess, 'win');
    endGame(true);
    return;
  }

  // Check Loss
  if (attemptsLeft === 0) {
    const type = userGuess > secretNumber ? 'high' : 'low';
    addGuessPill(userGuess, type);
    feedbackBox.className = 'feedback-box lose';
    feedbackBox.innerHTML = `💀 Game Over! You ran out of attempts. The number was <strong>${secretNumber}</strong>.`;
    triggerShake();
    endGame(false);
    return;
  }

  // Proximity Hint
  const diff = Math.abs(userGuess - secretNumber);
  const closeThreshold = Math.max(3, Math.ceil(maxRange * 0.05));
  const isClose = diff <= closeThreshold;

  if (userGuess > secretNumber) {
    feedbackBox.className = 'feedback-box high';
    feedbackBox.innerHTML = isClose
      ? `🔥 <strong>Very close!</strong> Just a little lower than <strong>${userGuess}</strong>.`
      : `📉 Too high! Try a number lower than <strong>${userGuess}</strong>.`;
    addGuessPill(userGuess, 'high');
  } else {
    feedbackBox.className = 'feedback-box low';
    feedbackBox.innerHTML = isClose
      ? `🔥 <strong>Very close!</strong> Just a little higher than <strong>${userGuess}</strong>.`
      : `📈 Too low! Try a number higher than <strong>${userGuess}</strong>.`;
    addGuessPill(userGuess, 'low');
  }

  triggerShake();
});

difficultyBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    difficultyBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    maxRange = parseInt(btn.dataset.max, 10);
    maxAttempts = parseInt(btn.dataset.attempts, 10);
    initGame();
  });
});

restartBtn.addEventListener('click', initGame);

// Start game on load
initGame();