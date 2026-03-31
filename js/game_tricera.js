// --- GAME 3: TRICERA-CHARGE ---
window.TriceraGame = (function() {
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const CW = 540, CH = 960, GROUND_H = 150;
    
    const imgs = {
        bg: new Image(), ground: new Image(),
        tricera: new Image(), rock: new Image(), tarpit: new Image()
    };
    imgs.bg.src = 'assets/images/background.svg';
    imgs.ground.src = 'assets/images/ground.svg';
    imgs.tricera.src = 'assets/images/sticker2.svg'; // Reuse Triceratops head
    imgs.rock.src = 'assets/images/rock.svg';
    imgs.tarpit.src = 'assets/images/tarpit.svg';

    let state = 'READY'; // READY, PLAYING, GAMEOVER, PAUSED
    let score = 0, lives = 3, frames = 0, animId = null;
    let bgOff = 0, grOff = 0, speed = 4;
    
    // 3 Lanes (Y coordinates for items to spawn on, from top to bottom)
    const lanes = [CH - GROUND_H - 220, CH - GROUND_H - 120, CH - GROUND_H - 20];
    
    const player = {
        lane: 1, // 0=Top, 1=Middle, 2=Bottom
        x: 100, y: lanes[1], w: 100, h: 100, targetY: lanes[1],
        update: function() {
            this.targetY = lanes[this.lane];
            this.y += (this.targetY - this.y) * 0.2; // Smooth lane change
        },
        draw: function() {
            ctx.save();
            ctx.translate(this.x + this.w/2, this.y - this.h/2);
            // Bobbing animation while running
            let bob = (state === 'PLAYING') ? Math.sin(frames*0.3)*5 : 0;
            if(imgs.tricera.complete) ctx.drawImage(imgs.tricera, -this.w/2, -this.h/2 + bob, this.w, this.h);
            ctx.restore();
        }
    };

    const obstacles = {
        list: [],
        spawn: function() {
            let laneIndex = Math.floor(Math.random() * 3);
            let type = Math.random() > 0.4 ? 'rock' : 'tarpit';
            this.list.push({
                x: CW + 100, y: lanes[laneIndex], lane: laneIndex,
                type: type, w: 90, h: 90, passed: false
            });
        },
        update: function() {
            let spawnRate = Math.max(60, 110 - Math.floor(score/2));
            if(frames % spawnRate === 0) this.spawn();
            
            for(let i=0; i<this.list.length; i++){
                let ob = this.list[i];
                ob.x -= speed;
                
                // Collision
                if(ob.lane === player.lane) {
                    if(ob.x < player.x + player.w - 30 && ob.x + ob.w > player.x + 30) {
                        if(ob.type === 'rock') {
                            // Smash rock!
                            window.playSynth('score');
                            score += 2; document.getElementById('current-score').innerText = score;
                            
                            // Visual smash particles immediately
                            let f = document.createElement('div'); f.className = 'flash-active';
                            document.getElementById('game-container').appendChild(f);
                            setTimeout(()=>f.remove(), 50);
                            
                            this.list.splice(i, 1); i--; continue;
                        } else if(ob.type === 'tarpit') {
                            // Hit Tar pit
                            lives--; window.playSynth('crash');
                            let f = document.createElement('div'); f.className = 'flash-active'; f.style.background = 'black';
                            document.getElementById('game-container').appendChild(f);
                            setTimeout(()=>f.remove(), 200);
                            if(lives <= 0) crash();
                            this.list.splice(i, 1); i--; continue;
                        }
                    }
                }
                
                // Score for passing tarpit
                if(ob.type === 'tarpit' && ob.x + ob.w < player.x && !ob.passed) {
                    ob.passed = true; score++; document.getElementById('current-score').innerText = score;
                }
                
                if(ob.x < -150) { this.list.splice(i, 1); i--; }
            }
        },
        draw: function() {
            // Draw back to front to preserve depth
            for(let l=0; l<3; l++){
                for(let ob of this.list) {
                    if(ob.lane !== l) continue;
                    let img = imgs[ob.type];
                    // Tarpits lay flat on ground
                    let yOff = ob.type === 'tarpit' ? -ob.h/2 + 20 : -ob.h;
                    if(img && img.complete) ctx.drawImage(img, ob.x, ob.y + yOff, ob.w, ob.h);
                }
                if(player.lane === l) player.draw();
            }
        }
    };

    function crash() {
        state = 'GAMEOVER';
        window.playSynth('crash');
        window.showGameOver(score);
    }

    let touchStartY = 0;
    function handleTouchStart(e) {
        if(e.cancelable) e.preventDefault();
        if(state === 'READY') state = 'PLAYING';
        touchStartY = e.touches ? e.touches[0].clientY : e.clientY;
    }
    
    function handleTouchEnd(e) {
        if(e.cancelable && e.type !== 'mouseup') e.preventDefault();
        if(state !== 'PLAYING') return;
        let touchEndY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        let diff = touchEndY - touchStartY;
        
        if(Math.abs(diff) > 30) { // minimum swipe distance
            if(diff < 0) {
                // Swiped up
                if(player.lane > 0) { player.lane--; window.playSynth('flap'); }
            } else {
                // Swiped down
                if(player.lane < 2) { player.lane++; window.playSynth('flap'); }
            }
        } else {
            // Tap to unpause check is handled by the buttons
        }
    }

    function loop() {
        if(state === 'GAMEOVER') return;
        
        ctx.clearRect(0,0,CW,CH);
        
        if(state !== 'PAUSED') {
            bgOff -= speed*0.1; if(bgOff <= -CW) bgOff = 0;
            // Ground scrolls fast
            grOff -= speed; if(grOff <= -CW) grOff = 0;
        }

        if(imgs.bg.complete) {
            ctx.drawImage(imgs.bg, bgOff, 0, CW, CH);
            ctx.drawImage(imgs.bg, bgOff+CW, 0, CW, CH);
        }
        
        // Custom 3-lane ground
        ctx.fillStyle = '#6D4C41'; ctx.fillRect(0, CH-GROUND_H - 250, CW, GROUND_H + 250);
        
        // Draw lane markers scrolling
        ctx.fillStyle = '#8D6E63';
        for(let l=0; l<3; l++){
            let ly = lanes[l];
            for(let i=0; i<10; i++) {
                ctx.fillRect(grOff + i*100, ly - 50, 60, 5);
                ctx.fillRect(grOff + CW + i*100, ly - 50, 60, 5);
            }
        }

        if(state === 'PLAYING') { frames++; speed = Math.min(10, 4 + score*0.05); obstacles.update(); player.update(); }
        else if(state === 'READY') { frames++; }

        obstacles.draw(); // Player is drawn inside obstacles to preserve depth sorting
        
        if(state === 'READY' || state === 'PLAYING') {
            ctx.fillStyle='red'; ctx.font='30px sans-serif'; ctx.textAlign='left';
            let hts = ''; for(let i=0; i<lives; i++) hts+='❤️';
            ctx.fillText(hts, 20, 50);
        }

        if(state === 'READY') {
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0,0,CW,CH);
            ctx.fillStyle = 'white'; ctx.textAlign='center'; ctx.font='50px "Fredoka One"'; ctx.lineWidth=6; ctx.strokeStyle='black';
            ctx.strokeText("Tricera-Charge!", CW/2, CH/2-50); ctx.fillText("Tricera-Charge!", CW/2, CH/2-50);
            ctx.font='30px "Fredoka One"'; ctx.strokeText("Swipe UP/DOWN to swap lanes", CW/2, CH/2+20); ctx.fillText("Swipe UP/DOWN to swap lanes", CW/2, CH/2+20);
            ctx.strokeText("Smash rocks! Avoid tar!", CW/2, CH/2+60); ctx.fillText("Smash rocks! Avoid tar!", CW/2, CH/2+60);
        } else if(state === 'PAUSED') {
            ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0,0,CW,CH);
            ctx.fillStyle = 'white'; ctx.textAlign='center'; ctx.font='50px "Fredoka One"'; ctx.lineWidth=6; ctx.strokeStyle='black';
            ctx.strokeText("PAUSED", CW/2, CH/2); ctx.fillText("PAUSED", CW/2, CH/2);
        }
        
        animId = requestAnimationFrame(loop);
    }

    return {
        start: function() {
            player.lane = 1; speed = 4;
            obstacles.list = []; score = 0; lives = 3; frames = 0;
            state = 'READY';
            document.getElementById('current-score').innerText = score;
            document.getElementById('hud').classList.remove('hidden');
            document.getElementById('btn-pause').classList.remove('hidden');
            document.getElementById('btn-pause').innerHTML = '⏸️';
            
            canvas.onmousedown = null; canvas.onmouseup = null; canvas.ontouchstart = null; canvas.ontouchend = null;
            canvas.addEventListener('touchstart', handleTouchStart, {passive:false});
            canvas.addEventListener('touchend', handleTouchEnd);
            canvas.addEventListener('mousedown', handleTouchStart);
            canvas.addEventListener('mouseup', handleTouchEnd);
            
            let pb = document.getElementById('btn-pause');
            let newPb = pb.cloneNode(true); pb.parentNode.replaceChild(newPb, pb);
            newPb.addEventListener('click', () => {
                if(state === 'PLAYING') { state='PAUSED'; newPb.innerHTML='▶️';}
                else if(state === 'PAUSED'){ state='PLAYING'; newPb.innerHTML='⏸️';}
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
