// --- HUB UI LOGIC ---

// Initialize 'Play on Phone' QR Code
const qrContainer = document.getElementById('qr-phone');
new QRCode(qrContainer, {
    text: GAME_CONFIG.HOST_URL,
    width: 120,
    height: 120,
    colorDark: "#111",
    colorLight: "#fff",
    correctLevel: QRCode.CorrectLevel.L
});

document.getElementById('brand-title').innerHTML = GAME_CONFIG.BRAND_NAME.replace(' ', '<br>');

// Navigation
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.replace('active', 'hidden'));
    if(id) {
        let el = document.getElementById(id);
        if(el) el.classList.replace('hidden', 'active');
    }
}

document.querySelectorAll('.btn-close-panel').forEach(btn => {
    btn.addEventListener('click', () => { showScreen(btn.getAttribute('data-target')); });
});

// Sticker Book Logic
document.getElementById('btn-stickers').addEventListener('click', () => {
    let unlocked = JSON.parse(localStorage.getItem('DinoHub_Stickers') || '{}');
    let totalScore = parseInt(localStorage.getItem('DinoHub_TotalScore') || 0);
    document.getElementById('total-score-display').innerText = totalScore;
    
    let grid = document.getElementById('sticker-grid');
    grid.innerHTML = '';
    let i = 1;
    for(let id in GAME_CONFIG.STICKER_THRESHOLDS) {
        let isUnlocked = unlocked[id];
        let div = document.createElement('div');
        div.className = 'sticker-slot ' + (isUnlocked ? 'unlocked' : '');
        if(isUnlocked) {
            div.style.backgroundImage = `url('assets/images/sticker${i}.svg')`;
        } else {
            div.innerHTML = `<div>🔒<br><span style="font-size:12px">Score ${GAME_CONFIG.STICKER_THRESHOLDS[id]}</span></div>`;
        }
        grid.appendChild(div);
        i++;
    }
    showScreen('screen-stickers');
});

// Audio Toggle
document.getElementById('btn-audio').addEventListener('click', () => {
    window.isAudioMuted = !window.isAudioMuted;
    document.getElementById('btn-audio').innerHTML = window.isAudioMuted ? '🔇' : '🔊';
});

// Return to Hub
document.getElementById('btn-home').addEventListener('click', () => {
    if(State.currentGame && typeof State.currentGame.stop === 'function') {
        State.currentGame.stop();
    }
    document.getElementById('gameCanvas').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('btn-home').classList.add('hidden');
    document.getElementById('btn-pause').classList.add('hidden');
    showScreen('screen-hub');
});

// Handle Game Card Clicks
document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
        let gameId = card.getAttribute('data-game');
        
        showScreen(''); // Hide all screens
        document.getElementById('gameCanvas').classList.remove('hidden');
        document.getElementById('btn-home').classList.remove('hidden');
        
        if(gameId === 'flappy') {
            State.currentGame = window.FlappyGame;
            window.FlappyGame.start();
        } else if (gameId === 'stego') {
            State.currentGame = window.StegoGame;
            window.StegoGame.start();
        } else if (gameId === 'tricera') {
            State.currentGame = window.TriceraGame;
            window.TriceraGame.start();
        } else if (gameId === 'bronto') {
            State.currentGame = window.BrontoGame;
            window.BrontoGame.start();
        } else if (gameId === 'dig') {
            State.currentGame = window.DigGame;
            window.DigGame.start();
        } else {
            // Placeholder for unimplemented games
            document.getElementById('gameCanvas').classList.add('hidden');
            alert(gameId + " is coming soon! Try Flappy Ptero!");
            showScreen('screen-hub');
            document.getElementById('btn-home').classList.add('hidden');
        }
    });
});

// Global Function for Games to Call when Game Over occurs
window.showGameOver = function(score) {
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('btn-pause').classList.add('hidden');
    
    State.addScore(score); // Global persistent score
    document.getElementById('final-score').innerText = score;
    
    // QR Code for League
    let qrc = document.getElementById('qrcode-container');
    qrc.innerHTML = ''; 
    let submitUrl = `${GAME_CONFIG.LEAGUE_TABLE_URL}?score=${score}&game=${encodeURIComponent(GAME_CONFIG.BRAND_NAME)}&device=Kiosk`;
    new QRCode(qrc, {
        text: submitUrl, width: 200, height: 200,
        colorDark : "#111", colorLight : "#fff", correctLevel : QRCode.CorrectLevel.H
    });

    document.getElementById('btn-restart').onclick = () => {
        showScreen('');
        if(State.currentGame) State.currentGame.start();
    };

    setTimeout(() => {
        showScreen('screen-gameover');
    }, 600);
};
