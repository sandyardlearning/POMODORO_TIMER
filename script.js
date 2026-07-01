// DOM Elements
const timerDisplay = document.getElementById('time-left');
const sessionLabel = document.getElementById('session-label');
const roundLabel = document.getElementById('round-label');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const skipBtn = document.getElementById('skip-btn');
const modeBtns = document.querySelectorAll('.mode-btn');

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const pomodoroInput = document.getElementById('pomodoro-input');
const shortBreakInput = document.getElementById('short-break-input');
const longBreakInput = document.getElementById('long-break-input');
const autoStartToggle = document.getElementById('auto-start-toggle');
const themeSelect = document.getElementById('theme-select');

const statPomodoros = document.getElementById('stat-pomodoros');
const statFocusTime = document.getElementById('stat-focus-time');
const statStreaks = document.getElementById('stat-streaks');

const circle = document.querySelector('.progress-ring__circle');
const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;

// Timer Logic Variables
let timerState = {
    mode: 'pomodoro', // pomodoro, shortBreak, longBreak
    timeLeft: 25 * 60,
    totalDuration: 25 * 60,
    isRunning: false,
    timerId: null,
    round: 1,
    pomodorosCount: 0,
    focusTimeToday: 0, // In seconds
    streaks: 0
};

// Settings Object
let settings = {
    pomodoroTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    autoStart: true,
    theme: 'theme-ocean'
};

// Initialize
function init() {
    loadSettings();
    loadStats();
    applyTheme(settings.theme);
    setupCircle();
    switchMode('pomodoro');
    setupEventListeners();
    requestNotificationPermission();
    window.addEventListener('beforeunload', saveStats);
}

// UI & Animations
function setupCircle() {
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
}

function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
}

function updateDisplay() {
    const minutes = Math.floor(timerState.timeLeft / 60);
    const seconds = timerState.timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.title = `${timerDisplay.textContent} - ${sessionLabel.textContent}`;
    
    // Calculate progress
    const progress = ((timerState.totalDuration - timerState.timeLeft) / timerState.totalDuration) * 100;
    setProgress(progress);
}

// Timer Controls
function startTimer() {
    if (timerState.isRunning) return;
    
    timerState.isRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    timerState.timerId = setInterval(() => {
        timerState.timeLeft--;
        
        if (timerState.mode === 'pomodoro') {
            timerState.focusTimeToday += 1;
            updateStatsDisplay();
        }

        updateDisplay();
        
        if (timerState.timeLeft <= 0) {
            handleTimerComplete();
        }
    }, 1000);
}

function pauseTimer() {
    if (!timerState.isRunning) return;
    clearInterval(timerState.timerId);
    timerState.isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

function resetTimer() {
    clearInterval(timerState.timerId);
    timerState.isRunning = false;
    timerState.timeLeft = timerState.totalDuration;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    updateDisplay();
}

function skipTimer() {
    handleTimerComplete();
}

function handleTimerComplete() {
    clearInterval(timerState.timerId);
    timerState.isRunning = false;
    
    const completedMode = timerState.mode;
    playNotification();
    showBrowserNotification(completedMode);
    
    if (completedMode === 'pomodoro') {
        timerState.pomodorosCount++;
        timerState.streaks++;
        statStreaks.textContent = timerState.streaks;
        saveStats();
        
        if (timerState.round < 4) {
            timerState.round++;
            switchMode('shortBreak');
        } else {
            timerState.round = 1;
            switchMode('longBreak');
        }
    } else {
        switchMode('pomodoro');
    }
    
    if (settings.autoStart) {
        startTimer();
    }
}

function switchMode(modeType) {
    timerState.mode = modeType;
    
    modeBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-mode="${modeType}"]`).classList.add('active');
    
    if (modeType === 'pomodoro') {
        timerState.totalDuration = settings.pomodoroTime * 60;
        sessionLabel.textContent = "Focus Time";
    } else if (modeType === 'shortBreak') {
        timerState.totalDuration = settings.shortBreakTime * 60;
        sessionLabel.textContent = "Short Break";
    } else if (modeType === 'longBreak') {
        timerState.totalDuration = settings.longBreakTime * 60;
        sessionLabel.textContent = "Long Break";
    }

    roundLabel.textContent = `Round ${timerState.round}/4`;
    timerState.timeLeft = timerState.totalDuration;
    updateDisplay();
}

// Settings Handlers
function toggleSettingsModal() {
    settingsModal.classList.toggle('hidden');
}

function getValidatedDuration(value, fallback) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1) return fallback;
    return number;
}

function saveSettings() {
    settings.pomodoroTime = getValidatedDuration(pomodoroInput.value, settings.pomodoroTime);
    settings.shortBreakTime = getValidatedDuration(shortBreakInput.value, settings.shortBreakTime);
    settings.longBreakTime = getValidatedDuration(longBreakInput.value, settings.longBreakTime);
    settings.autoStart = autoStartToggle.checked;
    settings.theme = themeSelect.value;

    pomodoroInput.value = settings.pomodoroTime;
    shortBreakInput.value = settings.shortBreakTime;
    longBreakInput.value = settings.longBreakTime;
    themeSelect.value = settings.theme;
    
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    applyTheme(settings.theme);
    resetTimer();
    switchMode(timerState.mode);
}

function loadSettings() {
    const saved = localStorage.getItem('pomodoroSettings');
    if (saved) {
        const parsed = JSON.parse(saved);
        settings.pomodoroTime = getValidatedDuration(parsed.pomodoroTime, settings.pomodoroTime);
        settings.shortBreakTime = getValidatedDuration(parsed.shortBreakTime, settings.shortBreakTime);
        settings.longBreakTime = getValidatedDuration(parsed.longBreakTime, settings.longBreakTime);
        settings.autoStart = parsed.autoStart !== false;
        settings.theme = parsed.theme || settings.theme;

        pomodoroInput.value = settings.pomodoroTime;
        shortBreakInput.value = settings.shortBreakTime;
        longBreakInput.value = settings.longBreakTime;
        autoStartToggle.checked = settings.autoStart;
        themeSelect.value = settings.theme;
    }
}

function applyTheme(themeName) {
    document.body.className = themeName;
}

// Statistics
function saveStats() {
    localStorage.setItem('pomodorosCount', timerState.pomodorosCount);
    localStorage.setItem('focusTimeToday', timerState.focusTimeToday);
    localStorage.setItem('streaks', timerState.streaks);
}

function loadStats() {
    timerState.pomodorosCount = parseInt(localStorage.getItem('pomodorosCount')) || 0;
    timerState.focusTimeToday = parseInt(localStorage.getItem('focusTimeToday')) || 0;
    timerState.streaks = parseInt(localStorage.getItem('streaks')) || 0;
    updateStatsDisplay();
}

function updateStatsDisplay() {
    statPomodoros.textContent = timerState.pomodorosCount;
    const hours = Math.floor(timerState.focusTimeToday / 3600);
    const minutes = Math.floor((timerState.focusTimeToday % 3600) / 60);
    statFocusTime.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    statStreaks.textContent = timerState.streaks;
}

// Notifications
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

function showBrowserNotification(completedMode) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const title = completedMode === 'pomodoro' ? 'Pomodoro finished!' : 'Break finished!';
        const body = completedMode === 'pomodoro' ? 'Time for a well-deserved break!' : 'Time to get back to work!';
        new Notification(title, { body });
    }
}

function playNotification() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = 880;
        gain.gain.value = 0.08;

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start();
        oscillator.stop(context.currentTime + 0.12);
        oscillator.onended = () => context.close();
    } catch (e) {
        console.log('Notification sound unavailable:', e);
    }
}

// Event Listeners
function setupEventListeners() {
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    skipBtn.addEventListener('click', skipTimer);

    modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchMode(e.target.dataset.mode);
        });
    });

    settingsBtn.addEventListener('click', toggleSettingsModal);
    closeSettingsBtn.addEventListener('click', toggleSettingsModal);

    // Save settings on change
    [pomodoroInput, shortBreakInput, longBreakInput, autoStartToggle, themeSelect].forEach(element => {
        element.addEventListener('change', saveSettings);
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (timerState.isRunning) pauseTimer();
            else startTimer();
        } else if (e.code === 'KeyR') {
            resetTimer();
        } else if (e.code === 'KeyS') {
            toggleSettingsModal();
        }
    });
}

// Start
init();
