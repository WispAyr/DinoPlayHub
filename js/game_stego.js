// --- GAME 2: STEGO SNACK STACK ---
window.StegoGame = (function() {
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const CW = 540, CH = 960, GROUND_H = 150;
    
    const imgs = {
        bg: new Image(), ground: new Image(),
        stego: new Image(), apple: new Image(), leaf: new Image(), bomb: new Image()
    };
    imgs.bg.src = 'assets/images/background.svg';
    imgs.ground.src = 'assets/images/ground.svg';
    imgs.stego.src = 'assets/images/sticker3.svg'; // Reuse stegosaurus head
    imgs.apple.src = 'assets/images/food-apple.svg';
    imgs.leaf.src = 'assets/images/food-leaf.svg';
    imgs.bomb.src = 'assets/images/bomb.svg';

    let state = 'READY'; // READY, PLAYING, GAMEOVER, PAUSED
    let score = 0, lives = 3, animId = null;
    let fallbackTimer = 0;
    
    // Player object
    const player = {
        x: CW/2, y: CH - GROUND_H - 10, w: 100, h: 100, targetX: CW/2,
        update: function() {
            // smooth follow touch
            this.x += (this.targetX - this.x) * 0.15;
            if(this.x < this.w/2) this.x = this.w/2;
            if(this.x > CW - this.w/2) this.x = CW - this.w/2;
        },
        draw: function() {
            ctx.save();
            ctx.translate(this.x, this.y);
            // Tilt slightly based on movement speed
            let tilt = (this.targetX - this.x) * 0.005;
            ctx.rotate(Math.max(-0.2, Math.min(0.2, tilt)));
            if(imgs.stego.complete) ctx.drawImage(imgs.stego, -this.w/2, -this.h+20, this.w, this.h);
            ctx.restore();
        }
    };

    const items = {
        list: [],
        spawn: function() {
            let type = Math.random() > 0.8 ? 'bomb' : (Math.random() > 0.5 ? 'apple' : 'leaf');
            this.list.push({
                x: Math.random() * (CW-60) + 30, y: -50,
                type: type, speed: 4 + Math.random() * 3 + (score*0.1),
                w: 60, h: 60, rot: Math.random()*Math.PI*2, rotSpd: (Math.random()-0.5)*0.1
            });
        },
        update: function() {
            fallbackTimer++;
            let spawnRate = Math.max(30, 90 - score*2);
            if(fallbackTimer > spawnRate) {
                this.spawn(); fallbackTimer = 0;
            }
            
            for(let i=0; i<this.list.length; i++){
                let p = this.list[i];
                p.y += p.speed;
                p.rot += p.rotSpd;
                
                // Catch detection
                // Hitbox of stego head is roughly player.x-40 to player.x+40, player.y-60 to player.y
                if(p.y + p.h/2 > player.y - player.h && p.y - p.h/2 < player.y) {
                    if(Math.abs(p.x - player.x) < player.w/2) {
                        // Caught!
                        if(p.type === 'bomb') {
                            lives--; window.playSynth('crash');
                            let f = document.createElement('div'); f.className = 'flash-active'; f.style.background = 'red';
                            document.getElementById('game-container').appendChild(f);
                            setTimeout(()=>f.remove(), 200);
                            if(lives <= 0) crash();
                        } else {
                            score++; document.getElementById('current-score').innerText = score; window.playSynth('coin');
                        }
                        this.list.splice(i, 1); i--; continue;
                    }
                }
                
                // Miss detection
                if(p.y > CH) {
                    this.list.splice(i, 1); i--;
                }
            }
        },
        draw: function() {
            for(let p of this.list) {
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
                let img = imgs[p.type];
                if(img && img.complete) ctx.drawImage(img, -p.w/2, -p.h/2, p.w, p.h);
                ctx.restore();
            }
        }
    };

    function crash() {
        state = 'GAMEOVER';
        window.playSynth('crash');
        window.showGameOver(score);
    }

    function onMove(e) {
        if(e.cancelable) e.preventDefault();
        if(state === 'READY') state = 'PLAYING';
        if(state !== 'PLAYING') return;
        
        let rect = canvas.getBoundingClientRect();
        let clientX = e.touches ? e.touches[0].clientX : e.clientX;
        // Scale coordinate based on actual canvas CSS size vs internal size
        let scaleX = CW / rect.width;
        player.targetX = (clientX - rect.left) * scaleX;
    }

    function loop() {
        if(state === 'GAMEOVER') return;
        
        ctx.clearRect(0,0,CW,CH);
        if(imgs.bg.complete) { ctx.drawImage(imgs.bg, 0, 0, CW, CH); }
        else { ctx.fillStyle='#B3E5FC'; ctx.fillRect(0,0,CW,CH); }
        
        if(imgs.ground.complete) { ctx.drawImage(imgs.ground, 0, CH-GROUND_H, CW, GROUND_H); }
        else { ctx.fillStyle='#8BC34A'; ctx.fillRect(0,CH-GROUND_H,CW,GROUND_H); }

        if(state === 'PLAYING') {
            player.update();
            items.update();
        }
        
        items.draw();
        player.draw();
        
        // Draw Lives HUD
        if(state === 'PLAYING' || state === 'READY') {
            ctx.fillStyle='red'; ctx.font='30px sans-serif'; ctx.textAlign='left';
            let hearts = ''; for(let i=0; i<lives; i++) hearts+='❤️';
            ctx.fillText(hearts, 20, CH - 20);
        }

        if(state === 'READY') {
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0,0,CW,CH);
            ctx.fillStyle = 'white'; ctx.textAlign='center'; ctx.font='50px "Fredoka One"'; ctx.lineWidth=5; ctx.strokeStyle='black';
            ctx.strokeText("Snack Stack!", CW/2, CH/2-50); ctx.fillText("Snack Stack!", CW/2, CH/2-50);
            ctx.font='30px "Fredoka One"'; ctx.strokeText("Drag Stego to catch food!", CW/2, CH/2+20); ctx.fillText("Drag Stego to catch food!", CW/2, CH/2+20);
            ctx.strokeText("Avoid the bombs!", CW/2, CH/2+60); ctx.fillText("Avoid the bombs!", CW/2, CH/2+60);
        } else if(state === 'PAUSED') {
            ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0,0,CW,CH);
            ctx.fillStyle = 'white'; ctx.textAlign='center'; ctx.font='50px "Fredoka One"'; ctx.lineWidth=6; ctx.strokeStyle='black';
            ctx.strokeText("PAUSED", CW/2, CH/2); ctx.fillText("PAUSED", CW/2, CH/2);
        }
        animId = requestAnimationFrame(loop);
    }

    return {
        start: function() {
            player.x = CW/2; player.targetX = CW/2;
            items.list = []; score = 0; lives = 3; fallbackTimer = 0;
            state = 'READY';
            document.getElementById('current-score').innerText = score;
            document.getElementById('hud').classList.remove('hidden');
            document.getElementById('btn-pause').classList.remove('hidden');
            document.getElementById('btn-pause').innerHTML = '⏸️';
            
            // Clean old listeners
            canvas.onmousemove = null; canvas.ontouchmove = null; canvas.onmousedown = null; canvas.ontouchstart = null;
            canvas.addEventListener('touchmove', onMove, {passive:false});
            canvas.addEventListener('mousemove', onMove);
            canvas.addEventListener('touchstart', onMove, {passive:false});
            canvas.addEventListener('mousedown', onMove);
            
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
