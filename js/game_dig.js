// --- GAME 5: DINO DIG ---
window.DigGame = (function() {
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const CW = 540, CH = 960;
    
    const imgs = { bones: new Image() };
    imgs.bones.src = 'assets/images/bones.svg';

    let state = 'READY'; // READY, PLAYING, GAMEOVER
    let score = 0, animId = null;
    let timer = 1000; // 10 seconds (10.00)
    let grid = new Set();
    
    // An offscreen canvas specifically for the dirt layer so we can use destination-out
    let dirtCanvas = document.createElement('canvas');
    dirtCanvas.width = CW; dirtCanvas.height = CH;
    let dirtCtx = dirtCanvas.getContext('2d');

    function initDirt() {
        dirtCtx.globalCompositeOperation = 'source-over';
        // Fill dirt
        let grad = dirtCtx.createLinearGradient(0,0,0,CH);
        grad.addColorStop(0, '#5D4037');
        grad.addColorStop(1, '#3E2723');
        dirtCtx.fillStyle = grad;
        dirtCtx.fillRect(0,0,CW,CH);
        
        // Add some noise/rocks to dirt
        dirtCtx.fillStyle = '#795548';
        for(let i=0; i<300; i++) {
            dirtCtx.beginPath();
            dirtCtx.arc(Math.random()*CW, Math.random()*CH, Math.random()*15+5, 0, Math.PI*2);
            dirtCtx.fill();
        }
    }

    function erase(x, y) {
        if(state !== 'PLAYING') return;
        
        dirtCtx.globalCompositeOperation = 'destination-out';
        dirtCtx.beginPath();
        dirtCtx.arc(x, y, 60, 0, Math.PI*2); // Increased Brush size
        dirtCtx.fill();
        
        // Track unique grid cells for scoring
        let gx = Math.floor(x / (CW/10));
        let gy = Math.floor(y / (CH/10));
        let cellId = `${gx},${gy}`;
        
        if(!grid.has(cellId)) {
            grid.add(cellId);
            window.playSynth('flap'); // subtle scratching sound
            score = Math.floor(grid.size * 1.5);
            document.getElementById('current-score').innerText = score;
        }
        
        // Add particle occasionally
        if(Math.random() < 0.2) {
            particles.push({x: x, y: y, vx: (Math.random()-0.5)*10, vy: Math.random()*-10, life: 1});
        }
    }

    function handleMove(e) {
        if(e.cancelable) e.preventDefault();
        if(state === 'READY') {
            state = 'PLAYING';
            lastTime = performance.now();
        }
        if(state !== 'PLAYING') return;
        
        let rect = canvas.getBoundingClientRect();
        let scaleX = CW / rect.width;
        let scaleY = CH / rect.height;
        
        if(e.touches) {
            for(let i=0; i<e.touches.length; i++) {
                let x = (e.touches[i].clientX - rect.left) * scaleX;
                let y = (e.touches[i].clientY - rect.top) * scaleY;
                erase(x, y);
            }
        } else {
            if(e.buttons > 0) { // Mouse down and dragging
                let x = (e.clientX - rect.left) * scaleX;
                let y = (e.clientY - rect.top) * scaleY;
                erase(x, y);
            }
        }
    }

    let particles = [];
    let lastTime = 0;

    function loop(time) {
        if(state === 'GAMEOVER') return;
        
        ctx.clearRect(0,0,CW,CH);
        
        // 1. Draw solid rock background
        ctx.fillStyle = '#212121'; ctx.fillRect(0,0,CW,CH);
        
        // 2. Draw Bones
        if(imgs.bones.complete) {
            // Draw a few bones at different spots
            ctx.drawImage(imgs.bones, CW/2 - 150, CH/2 - 150, 300, 200);
            
            ctx.save(); ctx.translate(100, 200); ctx.rotate(0.5);
            ctx.drawImage(imgs.bones, -100, -50, 200, 100); ctx.restore();
            
            ctx.save(); ctx.translate(400, 800); ctx.rotate(-0.8);
            ctx.drawImage(imgs.bones, -100, -50, 200, 100); ctx.restore();
        }

        // 3. Draw Dirt Canvas over it
        ctx.drawImage(dirtCanvas, 0, 0);

        // 4. Particles (dirt flying)
        ctx.fillStyle = '#4E342E';
        for(let i=0; i<particles.length; i++) {
            let p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.5; p.life -= 0.02;
            if(p.life <= 0) { particles.splice(i,1); i--; continue; }
            ctx.beginPath(); ctx.arc(p.x, p.y, p.life*8, 0, Math.PI*2); ctx.fill();
        }

        // Timer Logic
        if(state === 'PLAYING') {
            let dt = time - lastTime;
            lastTime = time;
            timer -= dt/15; // Convert to roughly 15 seconds instead of 10
            if(timer <= 0) {
                timer = 0;
                state = 'GAMEOVER';
                window.playSynth('score');
                window.showGameOver(score);
            }
        }
        
        // Draw Timer HUD
        if(state === 'PLAYING' || state === 'READY') {
            ctx.fillStyle = 'white'; ctx.font = '40px "Fredoka One"'; ctx.textAlign = 'center';
            ctx.lineWidth = 5; ctx.strokeStyle = 'black';
            let t = (timer / 100).toFixed(1);
            ctx.strokeText("Time: " + t, CW/2, 60);
            ctx.fillText("Time: " + t, CW/2, 60);
            
            // Draw progress bar
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(CW/2 - 150, 80, 300, 20);
            ctx.fillStyle = timer > 300 ? '#4CAF50' : '#F44336';
            ctx.fillRect(CW/2 - 150, 80, 300 * (timer/1000), 20);
        }

        if(state === 'READY') {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,CW,CH);
            ctx.fillStyle = 'white'; ctx.textAlign='center'; ctx.font='50px "Fredoka One"'; ctx.lineWidth=6; ctx.strokeStyle='black';
            ctx.strokeText("Dino Dig!", CW/2, CH/2-50); ctx.fillText("Dino Dig!", CW/2, CH/2-50);
            ctx.font='30px "Fredoka One"'; ctx.strokeText("Swipe fast to dig dirt!", CW/2, CH/2+20); ctx.fillText("Swipe fast to dig dirt!", CW/2, CH/2+20);
        } else if(state === 'PAUSED') {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,CW,CH);
            ctx.fillStyle = 'white'; ctx.textAlign='center'; ctx.font='50px "Fredoka One"'; ctx.lineWidth=6; ctx.strokeStyle='black';
            ctx.strokeText("PAUSED", CW/2, CH/2); ctx.fillText("PAUSED", CW/2, CH/2);
        }
        
        if(state !== 'GAMEOVER') animId = requestAnimationFrame(loop);
    }

    return {
        start: function() {
            initDirt();
            grid.clear();
            score = 0; timer = 1000; particles = [];
            state = 'READY';
            
            document.getElementById('current-score').innerText = score;
            document.getElementById('hud').classList.remove('hidden');
            document.getElementById('btn-pause').classList.remove('hidden');
            document.getElementById('btn-pause').innerHTML = '⏸️';
            
            canvas.onmousemove = null; canvas.ontouchmove = null; canvas.onmousedown = null; canvas.ontouchstart = null;
            canvas.addEventListener('touchmove', handleMove, {passive:false});
            canvas.addEventListener('mousemove', handleMove);
            canvas.addEventListener('touchstart', handleMove, {passive:false});
            canvas.addEventListener('mousedown', handleMove);
            
            let pb = document.getElementById('btn-pause');
            let newPb = pb.cloneNode(true); pb.parentNode.replaceChild(newPb, pb);
            newPb.addEventListener('click', () => {
                if(state === 'PLAYING') { state='PAUSED'; newPb.innerHTML='▶️';}
                else if(state === 'PAUSED'){ state='PLAYING'; lastTime = performance.now(); newPb.innerHTML='⏸️';}
            });

            cancelAnimationFrame(animId);
            animId = requestAnimationFrame(loop);
        },
        stop: function() {
            state = 'GAMEOVER';
            cancelAnimationFrame(animId);
        }
    };
})();
