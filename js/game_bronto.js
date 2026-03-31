// --- GAME 4: BRONTO'S BIG REACH ---
window.BrontoGame = (function() {
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const CW = 540, CH = 960, GROUND_H = 150;
    
    const imgs = {
        bg: new Image(), ground: new Image(),
        head: new Image(), leaf: new Image()
    };
    imgs.bg.src = 'assets/images/background.svg';
    imgs.ground.src = 'assets/images/ground.svg';
    imgs.head.src = 'assets/images/sticker4.svg'; // Bronto Head
    imgs.leaf.src = 'assets/images/food-leaf.svg';

    let state = 'READY'; // READY, TIMING, REACHING, RETURNING, GAMEOVER
    let score = 0, animId = null;
    let meter = 0, meterDir = 1, meterSpeed = 0.02;
    let targetHeight = 0;
    
    const bronto = {
        x: CW/2, y: CH - GROUND_H + 50, // Base of neck
        headY: CH - GROUND_H - 100, // Current head position
        draw: function() {
            // Draw body base
            ctx.fillStyle = '#9CCC65';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 80, Math.PI, 0);
            ctx.fill();
            ctx.lineWidth = 6; ctx.strokeStyle = '#33691E'; ctx.stroke();
            
            // Draw neck
            ctx.fillStyle = '#AED581';
            ctx.fillRect(this.x - 30, this.headY + 40, 60, this.y - this.headY - 40);
            ctx.strokeRect(this.x - 30, this.headY + 40, 60, this.y - this.headY - 40);
            
            // Draw Head
            if(imgs.head.complete) {
                // face right
                ctx.save();
                ctx.translate(this.x, this.headY);
                ctx.scale(-1, 1);
                ctx.drawImage(imgs.head, -50, -50, 100, 100);
                ctx.restore();
            }
        }
    };

    let stars = [];

    function endGame(finalScore) {
        score = finalScore;
        state = 'GAMEOVER';
        window.showGameOver(score);
    }

    function handleTap() {
        if(state === 'READY') {
            state = 'TIMING';
            meter = 0;
        } else if(state === 'TIMING') {
            state = 'REACHING';
            // meter goes from 0 to 1
            // Convert to height: 1.0 = reaches y=100 (top of screen)
            targetHeight = (CH - GROUND_H - 100) - (meter * (CH - GROUND_H - 200));
            window.playSynth('jump');
        } else if(state === 'PAUSED') {
            document.getElementById('btn-pause').innerHTML = '⏸️';
            state = 'TIMING'; // resume
        }
    }

    function loop() {
        if(state === 'GAMEOVER') return;
        
        ctx.clearRect(0,0,CW,CH);
        
        // Draw background statically, but shifted down if reaching very high? 
        // For simplicity, just stretch it or keep static.
        if(imgs.bg.complete) { ctx.drawImage(imgs.bg, 0, 0, CW, CH); }
        else { ctx.fillStyle='#B3E5FC'; ctx.fillRect(0,0,CW,CH); }

        // Draw canopy leaves at the top
        if(imgs.leaf.complete) {
            for(let i=0; i<6; i++) {
                ctx.drawImage(imgs.leaf, i*100 - 20, -20, 120, 120);
                ctx.drawImage(imgs.leaf, i*100 + 30, 40, 100, 100);
            }
        }
        
        if(state === 'TIMING') {
            meter += meterSpeed * meterDir;
            if(meter >= 1) { meter = 1; meterDir = -1; window.playSynth('flap'); }
            if(meter <= 0) { meter = 0; meterDir = 1; window.playSynth('flap'); }
        } else if(state === 'REACHING') {
            bronto.headY -= 15;
            if(bronto.headY <= targetHeight) {
                state = 'RETURNING';
                // calculate score based on meter (0 to 10)
                let earned = Math.floor(meter * 10);
                if(earned === 10) { window.playSynth('score'); window.playSynth('coin'); } // jackpot
                else if(earned > 0) window.playSynth('score');
                else window.playSynth('crash');
                
                document.getElementById('current-score').innerText = earned;
                
                // Spawn stars
                for(let i=0; i<earned; i++) {
                    stars.push({x: bronto.x + (Math.random()-0.5)*100, y: bronto.headY, vy: Math.random()*-10, vx: (Math.random()-0.5)*5});
                }
            }
        } else if(state === 'RETURNING') {
            bronto.headY += 10;
            if(bronto.headY >= CH - GROUND_H - 100) {
                bronto.headY = CH - GROUND_H - 100;
                let earned = Math.floor(meter * 10);
                endGame(earned);
            }
        }

        // Draw stars
        ctx.fillStyle = '#FFC107';
        for(let s of stars) {
            s.x += s.vx; s.y += s.vy; s.vy += 0.5; // gravity
            ctx.beginPath(); ctx.arc(s.x, s.y, 10, 0, Math.PI*2); ctx.fill();
        }

        if(imgs.ground.complete) { ctx.drawImage(imgs.ground, 0, CH-GROUND_H, CW, GROUND_H); }
        else { ctx.fillStyle='#8BC34A'; ctx.fillRect(0,CH-GROUND_H,CW,GROUND_H); }

        bronto.draw();

        // Draw timing meter
        if(state === 'TIMING' || state === 'REACHING' || state === 'RETURNING') {
            let cx = CW - 60, cy = CH/2, mh = 400, mw = 40;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(cx - mw/2, cy - mh/2, mw, mh);
            
            // Gradient fill based on height
            let grad = ctx.createLinearGradient(0, cy + mh/2, 0, cy - mh/2);
            grad.addColorStop(0, 'red'); grad.addColorStop(0.5, 'yellow'); grad.addColorStop(1, 'green');
            ctx.fillStyle = grad;
            
            let fillH = meter * mh;
            ctx.fillRect(cx - mw/2, cy + mh/2 - fillH, mw, fillH);
            
            ctx.lineWidth = 4; ctx.strokeStyle = 'white';
            ctx.strokeRect(cx - mw/2, cy - mh/2, mw, mh);
        }

        if(state === 'READY') {
            ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0,0,CW,CH);
            ctx.fillStyle = 'white'; ctx.textAlign='center'; ctx.font='50px "Fredoka One"'; ctx.lineWidth=6; ctx.strokeStyle='black';
            ctx.strokeText("Big Reach!", CW/2, CH/2-50); ctx.fillText("Big Reach!", CW/2, CH/2-50);
            ctx.font='30px "Fredoka One"'; ctx.strokeText("Tap to start timing meter", CW/2, CH/2+20); ctx.fillText("Tap to start timing meter", CW/2, CH/2+20);
        } else if(state === 'PAUSED') {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,CW,CH);
            ctx.fillStyle = 'white'; ctx.textAlign='center'; ctx.font='50px "Fredoka One"'; ctx.lineWidth=6; ctx.strokeStyle='black';
            ctx.strokeText("PAUSED", CW/2, CH/2); ctx.fillText("PAUSED", CW/2, CH/2);
        }
        
        animId = requestAnimationFrame(loop);
    }

    return {
        start: function() {
            bronto.headY = CH - GROUND_H - 100;
            meter = 0; meterDir = 1; stars = []; score = 0;
            state = 'READY';
            document.getElementById('current-score').innerText = score;
            document.getElementById('hud').classList.remove('hidden');
            document.getElementById('btn-pause').classList.remove('hidden');
            document.getElementById('btn-pause').innerHTML = '⏸️';
            
            canvas.onmousedown = null; canvas.ontouchstart = null;
            canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleTap(); }, {passive:false});
            canvas.addEventListener('mousedown', handleTap);
            
            let pb = document.getElementById('btn-pause');
            let newPb = pb.cloneNode(true); pb.parentNode.replaceChild(newPb, pb);
            newPb.addEventListener('click', () => {
                if(state === 'TIMING') { state='PAUSED'; newPb.innerHTML='▶️';}
                else if(state === 'PAUSED'){ state='TIMING'; newPb.innerHTML='⏸️';}
            });

            cancelAnimationFrame(animId);
            loop();
        },
        stop: function() {
            state = 'GAMEOVER';
            cancelAnimationFrame(animId);
        }
    };
})();
