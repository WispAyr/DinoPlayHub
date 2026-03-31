// --- CONFIGURATION ---
const GAME_CONFIG = {
    BRAND_NAME: "Dino Play Hub",
    LEAGUE_TABLE_URL: "https://games.ayrpavilion.com/submit",
    HOST_URL: "https://games.ayrpavilion.com/", // The URL for the "Play on Phone" QR code
    
    // Unlocks per total combined score across games
    STICKER_THRESHOLDS: {
        sticker1: 20,
        sticker2: 50,
        sticker3: 100,
        sticker4: 200,
        sticker5: 500
    }
};

// --- WEB AUDIO SYNTHESIZER ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isAudioMuted = false;

function playSynth(type) {
    if(isAudioMuted || audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    
    if(type === 'flap' || type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if(type === 'score' || type === 'coin') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(900, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if(type === 'crash' || type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    }
}

// User interaction required to start audio context
document.body.addEventListener('click', () => {
    if(audioCtx.state === 'suspended') audioCtx.resume();
}, {once:true});

// --- GLOBAL STATE ---
const State = {
    gameLoop: null,
    currentGame: null,
    totalScore: 0,
    
    addScore: function(amount) {
        this.totalScore += amount;
        let s = parseInt(localStorage.getItem('DinoHub_TotalScore') || 0);
        localStorage.setItem('DinoHub_TotalScore', s + amount);
        this.checkStickers(s + amount);
    },
    
    checkStickers: function(currentTotal) {
        let unlocked = JSON.parse(localStorage.getItem('DinoHub_Stickers') || '{}');
        for(let id in GAME_CONFIG.STICKER_THRESHOLDS) {
            if(currentTotal >= GAME_CONFIG.STICKER_THRESHOLDS[id]) {
                unlocked[id] = true;
            }
        }
        localStorage.setItem('DinoHub_Stickers', JSON.stringify(unlocked));
    }
};

window.playSynth = playSynth;
window.GAME_CONFIG = GAME_CONFIG;
window.State = State;
window.isAudioMuted = isAudioMuted;
