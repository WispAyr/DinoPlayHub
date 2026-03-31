// --- GAME 1: FLAPPY PTERO ---
window.FlappyGame = (function() {
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const CW = 540, CH = 960, GROUND_H = 150;
    
    // Assets specific to this game
    const imgs = {
        bg: new Image(), ground: new Image(),
        bird: new Image(), pipeTop: new Image(), pipeBottom: new Image()
    };
    imgs.bg.src = 'assets/images/background.svg';
    imgs.ground.src = 'assets/images/ground.svg';
    imgs.bird.src = 'assets/images/pterodactyl.svg';
    imgs.pipeTop.src = 'assets/images/tree-top.svg';
    imgs.pipeBottom.src = 'assets/images/tree-bottom.svg';

    // Local State
    let state = 'READY'; // READY, PLAYING, GAMEOVER, PAUSED
    let score = 0, frames = 0, animId = null;
    let bgOff = 0, grOff = 0;
    
    // Settings (Adjusted for Young Kids)
    const set = { 
        GRAV: 0.15, FLAP: -4.5, SPD: 2, SPAWN: 2000, GAP: 300 
    };

    const particles = [];
    function addDust(x, y) {
        for(let i=0; i<5; i++){
            particles.push({ x: x-10+Math.random()*20, y: y+20+Math.random()*10, vx: (Math.random()-0.5)*2-2, vy: Math.random()*2, life: 1.0 });
        }
    }

    const bird = {
        x: CW/3, y: CH/2, w: 70, h: 55, vel: 0,
        jump: function() { this.vel = set.FLAP; window.playSynth('flap'); addDust(this.x, this.y); },
        update: function() {
            this.vel = Math.min(this.vel + set.GRAV, 12);
            this.y += this.vel;
            if(this.y + this.h >= CH - GROUND_H + 10) { this.y = CH - GROUND_H + 10 - this.h; crash(); }
            if(this.y <= -20) { this.y = -20; this.vel = 0; }
        },
        draw: function() {
            ctx.save();
            ctx.translate(this.x + this.w/2, this.y + this.h/2);
            ctx.rotate(Math.min(Math.PI/2, Math.max(-Math.PI/6, (this.vel * 0.12))));
            let yOff = (state === 'READY') ? Math.sin(frames*0.1) * 10 : 0;
            if(imgs.bird.complete) ctx.drawImage(imgs.bird, -this.w/2, -this.h/2 + yOff, this.w, this.h);
            ctx.restore();
        }
    };

    const pipes = {
        list: [], w: 90,
        add: function() {
            let minH = 100, maxH = CH - GROUND_H - set.GAP - 100;
            let topH = Math.max(minH, Math.min(maxH, Math.floor(Math.random()*(maxH-minH+1)+minH)));
            this.list.push({ x: CW, topH: topH, botY: topH + set.GAP, pass: false });
        },
        update: function() {
            if(frames % Math.floor(set.SPAWN / 16.6) === 0) this.add();
            for(let i=0; i<this.list.length; i++){
                let p = this.list[i];
                p.x -= set.SPD;
                let shrink = 10;
                if(bird.x+bird.w-shrink > p.x && bird.x+shrink < p.x+this.w) {
                    if(bird.y+shrink < p.topH || bird.y+bird.h-shrink > p.botY) crash();
                }
                if(p.x+this.w < bird.x && !p.pass) {
                    p.pass = true; score++; document.getElementById('current-score').innerText = score; window.playSynth('score');
                }
                if(p.x+this.w < -100) { this.list.shift(); i--; }
            }
        },
        draw: function() {
            for(let p of this.list) {
                if(imgs.pipeTop.complete) ctx.drawImage(imgs.pipeTop, p.x, p.topH - 600, this.w, 600);
                if(imgs.pipeBottom.complete) ctx.drawImage(imgs.pipeBottom, p.x, p.botY, this.w, 600);
            }
        }
    };

    function crash() {
        state = 'GAMEOVER';
        window.playSynth('crash');
        let f = document.createElement('div'); f.className = 'flash-active';
        document.getElementById('game-container').appendChild(f);
        setTimeout(()=>f.remove(), 200);
        window.showGameOver(score);
    }

    function input() {
        if(state === 'READY' || state === 'PLAYING') {
            if(state==='READY') state = 'PLAYING';
            bird.jump();
        } else if(state === 'PAUSED') {
            document.getElementById('btn-pause').innerHTML = '⏸️';
            state = 'PLAYING';
        }
    }
    
    // Using exactly one persistent listener by storing a reference, or just binding safely.
    // For games embedded in one canvas, it's safe to clear/re-add.
    function onTouch(e) { e.preventDefault(); input(); }
    function onDown() { input(); }
    
    function loop() {
        if(state === 'GAMEOVER') return; // Stop executing loop, let Hub UI take over
        
        ctx.clearRect(0,0,CW,CH);
        
        if(state !== 'PAUSED') {
            bgOff -= set.SPD*0.2; if(bgOff <= -CW) bgOff = 0;
            grOff -= set.SPD; if(grOff <= -CW) grOff = 0;
        }

        if(imgs.bg.complete) {
            ctx.drawImage(imgs.bg, bgOff, 0, CW, CH);
            ctx.drawImage(imgs.bg, bgOff+CW, 0, CW, CH);
        }
        
        if(state === 'PLAYING') { frames++; pipes.update(); bird.update(); }
        else if(state === 'READY') { frames++; }

        pipes.draw();

        if(imgs.ground.complete) {
            ctx.drawImage(imgs.ground, grOff, CH-GROUND_H, CW, GROUND_H);
            ctx.drawImage(imgs.ground, grOff+CW, CH-GROUND_H, CW, GROUND_H);
        }

        // Draw Dust
        if(state !== 'PAUSED') {
            for(let i=0; i<particles.length; i++){
                let p = particles[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.05;
                if(p.life<=0){ particles.splice(i,1); i--; continue;}
                ctx.fillStyle='rgba(255,255,255,'+p.life+')'; ctx.beginPath(); ctx.arc(p.x, p.y, 6*p.life, 0, Math.PI*2); ctx.fill();
            }
        }
        bird.draw();

        if(state === 'READY') {
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0,0,CW,CH);
            ctx.fillStyle = 'white'; ctx.textAlign='center'; ctx.font='50px "Fredoka One"'; ctx.lineWidth=6; ctx.strokeStyle='black';
            ctx.strokeText("Get Ready!", CW/2, CH/2-50); ctx.fillText("Get Ready!", CW/2, CH/2-50);
            ctx.font='30px "Fredoka One"'; ctx.strokeText("Tap to Flap", CW/2, CH/2+20); ctx.fillText("Tap to Flap", CW/2, CH/2+20);
        } else if(state === 'PAUSED') {
            ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0,0,CW,CH);
            ctx.fillStyle = 'white'; ctx.textAlign='center'; ctx.font='50px "Fredoka One"'; ctx.lineWidth=6; ctx.strokeStyle='black';
            ctx.strokeText("PAUSED", CW/2, CH/2); ctx.fillText("PAUSED", CW/2, CH/2);
        }
        animId = requestAnimationFrame(loop);
    }

    return {
        start: function() {
            bird.y = CH/2; bird.vel = 0; pipes.list = []; particles.length = 0; score = 0; frames = 0;
            state = 'READY';
            document.getElementById('current-score').innerText = score;
            document.getElementById('hud').classList.remove('hidden');
            document.getElementById('btn-pause').classList.remove('hidden');
            document.getElementById('btn-pause').innerHTML = '⏸️';
            
            // Clean old listeners to prevent double jumps
            canvas.removeEventListener('touchstart', onTouch);
            canvas.removeEventListener('mousedown', onDown);
            canvas.addEventListener('touchstart', onTouch, {passive:false});
            canvas.addEventListener('mousedown', onDown);
            
            // Re-bind pause button to THIS game
            let pb = document.getElementById('btn-pause');
            let newPb = pb.cloneNode(true);
            pb.parentNode.replaceChild(newPb, pb);
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
