let players = []; // Сюди будемо пушити об'єкти {name, status, statusTurns}
const colors = ['#e74c3c', '#9b59b6', '#3498db', '#1abc9c', '#f1c40f', '#e67e22', '#2c3e50'];

// ЛОГІКА ПРАВИЛ
let turnsUntilNextRule = 5; 
let activeRuleText = null;     
let ruleRemainingTurns = 0; 
let activeRulePlayer = null;

// 1. РЕЄСТРАЦІЯ ГРАВЦІВ (ЯК ОБ'ЄКТІВ)
function addPlayer() {
    const input = document.getElementById('player-input');
    const name = input.value.trim();
    if (name) {
        if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            alert("Гравець з таким іменем вже є!");
            return;
        }

        // Пушимо об'єкт
        players.push({
            name: name,
            status: null,
            statusTurns: 0
        });
        
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

// 2. ОНОВЛЕННЯ СТАТУС-БАРУ ЗВЕРХУ ЕКРАНУ ГРИ
function updateStatusesBar() {
    const bar = document.getElementById('statuses-bar');
    if (!bar) return; 
    
    // Беремо лише тих, у кого є активний статус
    const activeStatuses = players.filter(p => p.status !== null);
    
    bar.innerHTML = activeStatuses.map(p => `
        <div class="status-badge">
            ${p.name}: ${p.status} (${p.statusTurns} ⏳)
        </div>
    `).join('');
}

function startGame() {
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    turnsUntilNextRule = Math.floor(Math.random() * 5) + 5;
    updateStatusesBar(); // Очищаємо бар при старті
}

// 3. ГОЛОВНИЙ ЦИКЛ ГРИ
function nextTask() {
    const taskTextElement = document.getElementById('task-text');
    const gameScreen = document.getElementById('game-screen');
    
    let shuffled = [...players].sort(() => 0.5 - Math.random());

    // Зменшуємо лічильники статусів на початку кожного ходу
    players.forEach(p => {
        if (p.status !== null) {
            p.statusTurns--;
            if (p.statusTurns <= 0) {
                p.status = null; 
            }
        }
    });
    updateStatusesBar(); 

    // --- КРОК 0: МАКСИМАЛЬНИЙ ШТРАФ (5% шанс) ---
    let chance = Math.floor(Math.random() * 100);
    if (chance < 5) {
        let penaltyTemplate = penaltyTemplates[Math.floor(Math.random() * penaltyTemplates.length)];
        let finalPenalty = penaltyTemplate.replace('{p1}', shuffled[0].name);
        if (shuffled[1]) finalPenalty = finalPenalty.replace('{p2}', shuffled[1].name);

        taskTextElement.innerText = finalPenalty;
        gameScreen.style.backgroundColor = "black"; 
        
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
        return; 
    }

    // --- КРОК 0.5: КОЛЕСО ФОРТУНИ (10% шанс) ---
    let fortuneChance = Math.floor(Math.random() * 100);
    if (fortuneChance < 10) {
        let statusObj = fortuneStatuses[Math.floor(Math.random() * fortuneStatuses.length)];
        
        // Знаходимо гравця в оригінальному масиві і міняємо йому статус
        let targetPlayer = players.find(p => p.name === shuffled[0].name);
        if (targetPlayer) {
            targetPlayer.status = statusObj.title;
            targetPlayer.statusTurns = statusObj.turns;
        }

        let fortuneText = `🎉 КОЛЕСО ФОРТУНИ КРУТИТЬСЯ...\n\n` + statusObj.desc.replace('{p1}', shuffled[0].name) + `\n\n(Діє ходів: ${statusObj.turns})`;

        taskTextElement.innerText = fortuneText;
        gameScreen.style.backgroundColor = "#9b59b6"; // Фіолетовий під колесо
        
        updateStatusesBar(); 
        if (navigator.vibrate) navigator.vibrate([60, 60, 60]);
        return;
    }

    // --- КРОК 1: ПЕРЕВІРКА: ЧИ ЗАКІНЧИЛОСЯ ДІЮЧЕ ПРАВИЛО? ---
    if (activeRuleText !== null) {
        ruleRemainingTurns--;
        if (ruleRemainingTurns <= 0) {
            taskTextElement.innerText = `🚫 ПРАВИЛО СКАСОВАНО!\n${activeRulePlayer} може більше не виконувати: ${activeRuleText}`;
            activeRuleText = null;
            activeRulePlayer = null;
            gameScreen.style.backgroundColor = "#27ae60"; 
            turnsUntilNextRule = Math.floor(Math.random() * 10) + 5;
            return;
        }
    }

    // --- КРОК 2: ПЕРЕВІРКА: ЧИ ПОРА ВВОДИТИ НОВЕ ПРАВИЛО? ---
    if (activeRuleText === null) {
        turnsUntilNextRule--;
        if (turnsUntilNextRule <= 0) {
            let ruleTemplate = ruleTemplates[Math.floor(Math.random() * ruleTemplates.length)];
            activeRulePlayer = shuffled[0].name;
            let ruleDescription = ruleTemplate.replace('{p1}', shuffled[0].name);
            if (shuffled[1]) ruleDescription = ruleDescription.replace('{p2}', shuffled[1].name);
            
            activeRuleText = ruleDescription;
            ruleRemainingTurns = Math.floor(Math.random() * 10) + 5; 
            
            taskTextElement.innerText = `⚠️ НОВЕ ПРАВИЛО!\n${activeRuleText}\n(Діє ходів: ${ruleRemainingTurns})`;
            gameScreen.style.backgroundColor = "#ffbb00"; 
            return;
        }
    }

    // --- КРОК 3: ЗВИЧАЙНЕ ЗАВДАННЯ ---
    let template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
    let finalTask = template.replace('{p1}', shuffled[0].name);
    if (shuffled[1]) finalTask = finalTask.replace('{p2}', shuffled[1].name);

    taskTextElement.innerText = finalTask;
    gameScreen.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    if (navigator.vibrate) navigator.vibrate(50);
}

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
    if (event.target == modal) {
        modal.style.display = "none";
    }
}