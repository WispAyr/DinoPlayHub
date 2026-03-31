// Configuration for easy rebranding and customization
const GAME_CONFIG = {
    // Brand details
    BRAND_NAME: "Flappy Pterodactyl",
    MASCOT_NAME: "Terry the Pterodactyl",
    
    // Remote URLs
    LEAGUE_TABLE_URL: "https://YOUR-LEAGUE-WEBSITE.com/submit", // Will have ?score=XXXX&game=Brand&device=TouchScreen appended
    
    // UI Colors (ensure these complement the CSS)
    PRIMARY_COLOR: "#4CAF50", // Soft Green
    ACCENT_COLOR: "#FF9800", // Bright Orange
    
    // Gameplay settings
    GRAVITY: 0.25,
    FLAP_STRENGTH: -5.5,
    PIPE_SPEED: 3,
    PIPE_SPAWN_RATE: 1500, // ms
    PIPE_GAP: 200, // Gap between top and bottom pipes
    
    // Sticker Unlocks (Score required to unlock)
    STICKER_THRESHOLDS: {
        sticker1: 5,
        sticker2: 15,
        sticker3: 30,
        sticker4: 50,
        sticker5: 100
    }
};
