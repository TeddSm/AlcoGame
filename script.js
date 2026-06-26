let players = []; // Об'єкти {name, status, statusTurns}
const colors = ['#e74c3c', '#9b59b6', '#3498db', '#1abc9c', '#f1c40f', '#e67e22', '#2c3e50'];

// ЛОГІКА ГЛОБАЛЬНИХ ПРАВИЛ
let turnsUntilNextRule = 5; 
let currentRule = {
    text: null,       // Текст глобального правила
    turnsLeft: 0      // Скільки ходів воно діє
};

// ЛІЧИЛЬНИКИ КРОКІВ ДЛЯ ЗАХИСТУ ВІД ЧАСТОГО ВИПАДАННЯ (КУЛДАУНИ)
let turnsSinceLastRule = 0;    // Кроки з моменту останнього правила
let turnsSinceLastPenalty = 0; // Кроки з моменту останнього штрафу
let turnsSinceLastWheel = 0;   // Кроки з моменту останнього Колеса

// ==========================================
// 1. СЕРВІСНІ ФУНКЦІЇ (ІНТЕРФЕЙС ТА НАЛАШТУВАННЯ)
// ==========================================

function addPlayer() {
    const input = document.getElementById('player-input');
    const name = input.value.trim();
    if (name) {
        if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            alert("Гравець з таким іменем вже є!");
            return;
        }
        players.push({ name: name, status: null, statusTurns: 0 });
        input.value = '';
        updatePlayerList();
    }
}

function removePlayer(index) {
    players.splice(index, 1);
    updatePlayerList();
}

function updatePlayerList() {
    const list = document.getElementById('player-list');
    const btn = document.getElementById('start-btn');
    
    list.innerHTML = players.map((player, index) => `
        <li class="player-item">${player.name}<span onclick="removePlayer(${index})" style="cursor:pointer">✕</span></li>
    `).join('');
    
    btn.disabled = players.length < 2;
    btn.innerText = players.length < 2 ? "МІНІМУМ 2 ГРАВЦІ!" : "ПОГНАЛИ!";
}

function updateStatusesBar() {
    const bar = document.getElementById('statuses-bar');
    if (!bar) return; 
    
    let htmlContent = "";

    // 1. Якщо є активне глобальне правило, виводимо його першим (жовтим кольором)
    if (currentRule.text !== null) {
        htmlContent += `
            <div class="status-badge" style="background: #ffbb00; color: #000; font-weight: bold;">
                ⚠️ ПРАВИЛО (${currentRule.turnsLeft} ⏳)
            </div>
        `;
    }

    // 2. Виводимо індивідуальні статуси гравців з Колеса Фортуни
    const activeStatuses = players.filter(p => p.status !== null);
    htmlContent += activeStatuses.map(p => `
        <div class="status-badge">${p.name}: ${p.status} (${p.statusTurns} ⏳)</div>
    `).join('');
    
    bar.innerHTML = htmlContent;
}

function startGame() {
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';

    document.body.classList.add('game-active');
    
    // Повне скидання правил та лічильників при старті нової гри
    currentRule.text = null;
    currentRule.turnsLeft = 0;
    turnsSinceLastRule = 15;     // Дозволяємо випадіння зі старту гри
    turnsSinceLastPenalty = 20;
    turnsSinceLastWheel = 15;
    
    turnsUntilNextRule = Math.floor(Math.random() * 5) + 5;
    checkOrientationBeforeStart();
    updateStatusesBar();
}

function checkOrientationBeforeStart() {
    const taskTextElement = document.getElementById('task-text');
    
    // Перевіряємо, чи ми на самому початку гри (ще не було тапу)
    if (taskTextElement.innerText.includes("почати") || taskTextElement.innerText.includes("Переверніть")) {
        
        // window.innerHeight > window.innerWidth означає, що екран ВЕРТИКАЛЬНИЙ
        if (window.innerHeight > window.innerWidth) {
            taskTextElement.innerHTML = "🔄<br><br>Переверніть телефон горизонтально для початку гри!<br>Натисніть на екран, щоб почати!";
        } else {
            taskTextElement.innerText = "Натисніть на екран, щоб почати!";
        }
    }
}

// ==========================================
// 2. ОКРЕМІ МОДУЛІ ЛОГІКИ (ОПТИМІЗОВАНІ ФУНКЦІЇ)
// ==========================================

function resetVisualEffects(gameScreen, taskTextElement) {
    gameScreen.classList.remove('fortune-gradient');
    taskTextElement.classList.remove('neon-glow');
    gameScreen.style.pointerEvents = "auto";
}

// Крок 0: Максимальний штраф (5% шанс)
function triggerMaxPenalty(taskTextElement, gameScreen, shuffled) {
    let template = penaltyTemplates[Math.floor(Math.random() * penaltyTemplates.length)];
    let finalPenalty = template.replaceAll('{p1}', shuffled[0].name);
    if (shuffled[1]) finalPenalty = finalPenalty.replaceAll('{p2}', shuffled[1].name);

    taskTextElement.innerText = finalPenalty;
    gameScreen.style.backgroundColor = "black"; 
    
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
}

// Крок 0.5: Колесо Фортуни (10% шанс) — З ЕФЕКТОМ УПОВІЛЬНЕННЯ
function triggerFortuneWheel(taskTextElement, gameScreen, shuffled) {
    let statusObj = fortuneStatuses[Math.floor(Math.random() * fortuneStatuses.length)];
    
    gameScreen.style.pointerEvents = "none";
    gameScreen.classList.add('fortune-gradient');
    taskTextElement.classList.add('neon-glow');

    let duration = 4000;      // Загальний час сцени (3 секунди)
    let elapsed = 0;
    let intervalTime = 60;    // Початкова швидкість перебору

    function spin() {
        let randomPlayer = players[Math.floor(Math.random() * players.length)];
        taskTextElement.innerText = `🎉 КОЛЕСО КРУТИТЬСЯ...\n\n👉 ${randomPlayer.name} 👈`;
        
        if (navigator.vibrate) navigator.vibrate(12);
        elapsed += intervalTime;

        if (elapsed < duration) {
            // Ефект плавної зупинки рулетки на другій половині часу
            if (elapsed > duration * 0.5) {
                intervalTime += 20; 
            }
            setTimeout(spin, intervalTime);
        } else {
            // Зупинка та фінал
            let targetPlayer = players.find(p => p.name === shuffled[0].name);
            if (targetPlayer) {
                targetPlayer.status = statusObj.title;
                targetPlayer.statusTurns = statusObj.turns;
            }

            taskTextElement.innerText = `🎉 КОЛЕСО ЗУПИНИЛОСЬ!\n\n` + statusObj.desc.replaceAll('{p1}', shuffled[0].name) + `\n\n(Діє ходів: ${statusObj.turns})`;
            if (navigator.vibrate) navigator.vibrate([150, 80, 150]);

            gameScreen.style.pointerEvents = "auto";
            updateStatusesBar();
        }
    }
    setTimeout(spin, intervalTime);
}

// Крок 1 та 2: Керування глобальними правилами
function handleRulesLogic(taskTextElement, gameScreen, shuffled) {
    // 1. Чи закінчилося діюче глобальне правило?
    if (currentRule.text !== null) {
        currentRule.turnsLeft--;
        if (currentRule.turnsLeft <= 0) {
            taskTextElement.innerText = `🚫 ГЛОБАЛЬНЕ ПРАВИЛО СКАСОВАНО!\nВсі можуть розслабитися, закон більше не діє:\n\n${currentRule.text}`;
            currentRule.text = null; // Скидаємо правило
            
            gameScreen.style.backgroundColor = "#27ae60"; 
            turnsUntilNextRule = Math.floor(Math.random() * 10) + 20;
            return true; 
        }
    }

    // 2. Чи пора вводити нове глобальне правило для всіх?
    if (currentRule.text === null) {
        turnsUntilNextRule--;
        // Перевіряємо зарезервовані ходи ТА лічильник turnsSinceLastRule
        if (turnsUntilNextRule <= 0 && turnsSinceLastRule >= 15) {
            let ruleTemplate = ruleTemplates[Math.floor(Math.random() * ruleTemplates.length)];
            
            currentRule.text = ruleTemplate;
            currentRule.turnsLeft = Math.floor(Math.random() * 10) + 5; 
            turnsSinceLastRule = 0; // Скидаємо лічильник правил
            
            taskTextElement.innerText = `⚠️ ЗАГАЛЬНЕ ПРАВИЛО ДЛЯ ВСІХ!\n\n${currentRule.text}\n\n(Діє ходів: ${currentRule.turnsLeft})`;
            gameScreen.style.backgroundColor = "#ffbb00"; 
            return true; 
        }
    }
    return false; 
}

// Крок 3: Звичайне випадкове завдання
function triggerStandardTask(taskTextElement, gameScreen, shuffled) {
    let template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
    let finalTask = template.replaceAll('{p1}', shuffled[0].name);
    if (shuffled[1]) finalTask = finalTask.replaceAll('{p2}', shuffled[1].name);

    taskTextElement.innerText = finalTask;
    gameScreen.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    if (navigator.vibrate) navigator.vibrate(50);
}

// ==========================================
// 3. ЧИСТИЙ І КРАСИВИЙ ДИСПЕТЧЕР ГРИ
// ==========================================

function nextTask() {
    const taskTextElement = document.getElementById('task-text');
    const gameScreen = document.getElementById('game-screen');
    
    // Повертаємо стилі у дефолтний стан
    resetVisualEffects(gameScreen, taskTextElement);
    
    // Перемішуємо копію масиву об'єктів
    let shuffled = [...players].sort(() => 0.5 - Math.random());

    // Тікання ходів для індивідуальних статусів
    players.forEach(p => {
        if (p.status !== null) {
            p.statusTurns--;
            if (p.statusTurns <= 0) p.status = null; 
        }
    });
    updateStatusesBar(); 

    // Збільшуємо лічильники кроків для кулдаунів
    turnsSinceLastRule++;
    turnsSinceLastPenalty++;
    turnsSinceLastWheel++;

    // Розрахунок ймовірностей (Диспетчер подій)
    let diceRoll = Math.floor(Math.random() * 100);

    // [0-2] -> Штраф (Шанс спрацює лише якщо пройшло 20 кроків)
    if (diceRoll < 3 && turnsSinceLastPenalty >= 20) {
        turnsSinceLastPenalty = 0;
        triggerMaxPenalty(taskTextElement, gameScreen, shuffled);
        return;
    }

    // [3-4] -> Колесо фортуни (Шанс спрацює лише якщо пройшло 15 кроків)
    if (diceRoll < 10 && turnsSinceLastWheel >= 15) {
        turnsSinceLastWheel = 0;
        triggerFortuneWheel(taskTextElement, gameScreen, shuffled);
        return;
    }

    // Перевірка логіки загальних правил (введення / скасування)
    let ruleTriggered = handleRulesLogic(taskTextElement, gameScreen, shuffled);
    if (ruleTriggered) return;

    // Якщо жоден особливий режим не випав або заблокований кулдауном — граємо звичайну карту
    triggerStandardTask(taskTextElement, gameScreen, shuffled);
}

// ==========================================
// 4. ІНШІ ОБРОБНИКИ ПОДІЙ
// ==========================================

function goBack(event) {
    event.stopPropagation();
    document.getElementById('setup-screen').style.display = 'flex';
    document.getElementById('game-screen').style.display = 'none';
}

function toggleSettings(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('settings-modal');
    modal.style.display = modal.style.display === "block" ? "none" : "block";
}

window.onclick = function(event) {
    const modal = document.getElementById('settings-modal');
    if (event.target == modal) modal.style.display = "none";
}

window.addEventListener('resize', checkOrientationBeforeStart);