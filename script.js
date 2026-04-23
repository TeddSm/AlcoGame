let players = [];
const colors = ['#e74c3c', '#9b59b6', '#3498db', '#1abc9c', '#f1c40f', '#e67e22', '#2c3e50'];

let turnsUntilNextRule = 5; 
let activeRuleText = null;     
let ruleRemainingTurns = 0; 
let activeRulePlayer = null;

function addPlayer() {
    const input = document.getElementById('player-input');
    const name = input.value.trim();
    if (name) {
        players.push(name);
        input.value = '';
        updatePlayerList();
    }
}

function updatePlayerList() {
    const list = document.getElementById('player-list');
    const btn = document.getElementById('start-btn');
    list.innerHTML = players.map((name, index) => `
        <li class="player-item">${name}<span onclick="removePlayer(${index})" style="cursor:pointer">✕</span></li>
    `).join('');
    btn.disabled = players.length < 2;
    btn.innerText = players.length < 2 ? "МІНІМУМ 2 ГРАВЦІ!" : "ПОГНАЛИ!";
}

function removePlayer(index) {
    players.splice(index, 1);
    updatePlayerList();
}

function startGame() {
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    turnsUntilNextRule = Math.floor(Math.random() * 5) + 5;
}

function nextTask() {
    const taskTextElement = document.getElementById('task-text');
    const gameScreen = document.getElementById('game-screen');
    let shuffled = [...players].sort(() => 0.5 - Math.random());

    // --- 0. ПЕРЕВІРКА НА 5% ШАНС (МАКСИМАЛЬНИЙ ШТРАФ) ---
    let chance = Math.floor(Math.random() * 100);
    if (chance < 5) {
        let penaltyTemplate = penaltyTemplates[Math.floor(Math.random() * penaltyTemplates.length)];
        let finalPenalty = penaltyTemplate.replace('{p1}', shuffled[0]);
        if (shuffled[1]) finalPenalty = finalPenalty.replace('{p2}', shuffled[1]);

        taskTextElement.innerText = finalPenalty;
        gameScreen.style.backgroundColor = "black"; 
        
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
        return; 
    }

    // --- 1. ПЕРЕВІРКА: ЧИ ЗАКІНЧИЛОСЯ ДІЮЧЕ ПРАВИЛО? ---
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

    // --- 2. ПЕРЕВІРКА: ЧИ ПОРА ВВОДИТИ НОВЕ ПРАВИЛО? ---
    if (activeRuleText === null) {
        turnsUntilNextRule--;
        if (turnsUntilNextRule <= 0) {
            let ruleTemplate = ruleTemplates[Math.floor(Math.random() * ruleTemplates.length)];
            activeRulePlayer = shuffled[0];
            let ruleDescription = ruleTemplate.replace('{p1}', shuffled[0]);
            if (shuffled[1]) ruleDescription = ruleDescription.replace('{p2}', shuffled[1]);
            
            activeRuleText = ruleDescription;
            ruleRemainingTurns = Math.floor(Math.random() * 10) + 5; 
            
            taskTextElement.innerText = `⚠️ НОВЕ ПРАВИЛО!\n${activeRuleText}\n(Діє ходів: ${ruleRemainingTurns})`;
            gameScreen.style.backgroundColor = "#ffbb00"; 
            return;
        }
    }

    // --- 3. ЗВИЧАЙНЕ ЗАВДАННЯ ---
    let template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
    let finalTask = template.replace('{p1}', shuffled[0]);
    if (shuffled[1]) finalTask = finalTask.replace('{p2}', shuffled[1]);

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
    // Якщо ми викликаємо це з кнопки всередині гри, 
    // треба зупинити клік, щоб не спрацювало наступне завдання
    if (event) event.stopPropagation();

    const modal = document.getElementById('settings-modal');
    
    if (modal.style.display === "block") {
        modal.style.display = "none";
    } else {
        modal.style.display = "block";
    }
}

// Також додамо закриття вікна, якщо клікнути просто по фону поза ним
window.onclick = function(event) {
    const modal = document.getElementById('settings-modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}