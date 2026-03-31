# Flappy Pterodactyl Game Template

A customizable, touch-friendly HTML5 game template for young children featuring a "Flappy Bird" style game with a Pterodactyl, big touch-friendly buttons, high score local storage, a global league QR code generator, and a sticker collection reward system.

## Setup Instructions

1. **Customization**
   Open `js/config.js` to change the `BRAND_NAME`, `MASCOT_NAME`, `LEAGUE_TABLE_URL`, and gameplay settings (gravity, gap size, flap strength).

2. **Colors & Styling**
   Open `css/styles.css` and update the root CSS variables at the top of the file:
   ```css
   :root {
       --primary-color: #4CAF50;
       --accent-color: #FF9800;
       /* ... */
   }
   ```

3. **Assets Exchange**
   Replace the placeholder files in the `assets/images/` and `assets/audio/` directories with your own assets. Make sure to keep the filenames the same, or update the references in `app.js` and `styles.css`.
   
   *Required Images:*
   - `pterodactyl.svg` (The player)
   - `tree-top.svg` / `tree-bottom.svg` (Obstacles)
   - `background.svg` (Scrolling background)
   - `logo.svg` (Main menu logo)
   - `sticker1.svg` to `sticker5.svg`

   *Required Audio:*
   - `bgm.mp3` (Background Music)
   - `flap.mp3`
   - `score.mp3`
   - `crash.mp3`

## Running Locally

To run the game, simply open `index.html` in any modern web browser. 

**For Windows Touch Screens (Kiosk Mode):**
1. Install Google Chrome.
2. Create a shortcut to Chrome.
3. Right-click the shortcut > Properties.
4. In the "Target" field, append `--kiosk "C:\Path\To\DinoGame\index.html"`.
   Example: `"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk "C:\Path\To\DinoGame\index.html"`
5. Double-click the shortcut to open the game fullscreen without browser UI.

## File Structure

- `index.html` - The main structure containing game screens (Home, Game, UI Overlays, Leaderboard, Stickers).
- `css/styles.css` - Pure CSS implementing the bright cartoon 2D aesthetic.
- `js/config.js` - Easy-to-edit configuration variables.
- `js/app.js` - The main logic file (game loop, state management, audio, QR code).
- `js/qrcode.min.js` - Library for generating QR codes.
