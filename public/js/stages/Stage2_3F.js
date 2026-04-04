/* ================================================================
   Stage 2 - 3F: EVENT CINEMA (Top-View, 3D Isometric Feel)
   The FINALE of Stage 2 / Part 1 of Alice Ryde Adventure.
   Map: 72x60 (20% larger). Event Cinema Australia interior.

   Layout: Central lobby + 4 Cinema Halls
     Cinema 1 (top-left):  Romance → 11 Vampire mobs
     Cinema 2 (top-right): War → 12 Soldiers
     Cinema 3 (bot-left):  Zombie → 12 Zombies
     Cinema 4 (bot-right): Ryde PS OC → 12 Math Monsters + Boss

   Doors open sequentially: 1 → 2 → 3 → 4 (after 1-3 cleared)
   Magic Sword in Cinema 1 (after RUN!!! sequence)
   Final Boss: Miss Kumarwitch (grows bigger, stronger)
   ================================================================ */

/* ========== SWORD ITEM ========== */
class MagicSword extends Entity {
  constructor(game, cfg) {
    super(game, { x:cfg.x, y:cfg.y, width:16, height:16, speed:0, color:"#ff0", type:"item", tags:["item"] });
    this._age = 0; this.alive = true;
  }
  update(dt) {
    if (!this.alive) return;
    this._age += dt;
    var p = this.game.localPlayer;
    if (!p || !p.alive) return;
    var dx = p.x - this.x, dy = p.y - this.y;
    if (Math.sqrt(dx*dx+dy*dy) < 22) {
      this.alive = false; this.destroy();
      // Upgrade player
      p._hasSword = true;
      p.atk += 8;
      p.attackRange = 32;
      p.def += 3;
      this.game.camera.shake(6, 0.5);
      if (this.game.sound && this.game.sound.playSwordPickup) this.game.sound.playSwordPickup();
      this.game.hud.addChatMessage("MAGIC SWORD acquired! ATK+8, DEF+3!", "#ff0");
      this.game.hud.addChatMessage("You are now ARMED! Hunt the math monsters!", "#50c878");
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var float = Math.sin(this._age*3)*4;
    var glow = 0.4 + Math.sin(this._age*5)*0.3;
    // Glow aura
    ctx.save();
    ctx.shadowColor = "#ff0"; ctx.shadowBlur = 12+Math.sin(this._age*4)*6;
    // Blade
    ctx.fillStyle = "#ddf";
    ctx.fillRect(sp.x+6, sp.y-4+float, 4, 14);
    // Edge highlight
    ctx.fillStyle = "#fff";
    ctx.fillRect(sp.x+7, sp.y-3+float, 2, 12);
    // Crossguard
    ctx.fillStyle = "#fa0";
    ctx.fillRect(sp.x+3, sp.y+9+float, 10, 3);
    // Handle
    ctx.fillStyle = "#840";
    ctx.fillRect(sp.x+6, sp.y+12+float, 4, 5);
    // Pommel
    ctx.fillStyle = "#fa0";
    ctx.beginPath(); ctx.arc(sp.x+8, sp.y+18+float, 2, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    // Sparkles
    for (var i=0; i<3; i++) {
      var sx = sp.x+8+Math.sin(this._age*4+i*2.1)*8;
      var sy = sp.y+6+float+Math.cos(this._age*3+i*1.7)*8;
      ctx.fillStyle = "rgba(255,255,0,"+glow+")";
      ctx.fillRect(sx-1, sy-1, 2, 2);
    }
    // Label
    ctx.fillStyle = "#ff0"; ctx.font = "bold 7px Courier New"; ctx.textAlign = "center";
    ctx.fillText("SWORD", sp.x+8, sp.y-10+float);
  }
}

/* ========== CINEMA HEALTH PILL ========== */
class CinemaHealthPill extends Entity {
  constructor(game, cfg) {
    super(game, { x:cfg.x, y:cfg.y, width:10, height:10, speed:0, color:"#50c878", type:"item", tags:["item"] });
    this._heal = cfg.heal || 20; this._age = 0; this._lifetime = 15; this.alive = true;
  }
  update(dt) {
    if (!this.alive) return;
    this._age += dt;
    if (this._age > this._lifetime) { this.alive = false; this.destroy(); return; }
    var p = this.game.localPlayer;
    if (!p) return;
    if (Math.sqrt(Math.pow(p.x-this.x,2)+Math.pow(p.y-this.y,2)) < 18) {
      p.hp = Math.min(p.maxHp, p.hp + this._heal);
      this.game.hud.addChatMessage("Health +" + this._heal + "!", "#50c878");
      if (this.game.sound) { this.game.sound.playPickup(); this.game.sound.playPillPickup(); }
      this.alive = false; this.destroy();
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var pulse = 0.7 + Math.sin(this._age*5)*0.3;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.ellipse(sp.x+5,sp.y+5,5,4,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#e44";
    ctx.beginPath(); ctx.ellipse(sp.x+5,sp.y+5,5,4,0,0,Math.PI); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "6px Courier New"; ctx.textAlign = "center";
    ctx.fillText("+", sp.x+5, sp.y+7);
    ctx.globalAlpha = 1;
  }
}

/* ========== CINEMA 1: ROMANCE MOBS → VAMPIRES ========== */
class RomanceMob extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x:cfg.x, y:cfg.y, width:20, height:24, speed:1.2, color:"#ff69b4",
      enemyType:"romanceMob", name: cfg.gender==="m" ? "Romeo" : "Juliet",
      hp:38, atk:10, def:4, contactDamage:12, ai:"chase", aggroRange:120, expReward:6
    });
    this.aggroed = false;
    this._gender = cfg.gender || "f";
    this._age = 0;
    this._transformed = false;
    this._kissTimer = 2 + Math.random()*2;
    this._speechTimer = 0;
    this._speech = "";
    this._speeches = ["Saranghae~","Kiss me!","I love you!","Hold me~","Darling~"];
    this._hitSpeeches = ["Byundukjangi!","Nappun akma!","Mianhae...","Dorawa jwo~","Kiss me~","Saranghae~","Nappun nom!","Ddaeriji ma!"];
  }
  update(dt) {
    if (!this.alive) return;
    this._age += dt;
    this._speechTimer -= dt;
    // Auto-aggro when player gets close (proximity fallback)
    if (!this.aggroed) {
      var p = this.game.localPlayer;
      if (p && p.alive) {
        var dx = p.x - this.x, dy = p.y - this.y;
        if (Math.sqrt(dx*dx + dy*dy) < 160) this.aggroed = true;
      }
      if (!this.aggroed) return;
    }
    this._kissTimer -= dt;
    // Kiss attack (approach and kiss)
    if (!this._transformed && this._kissTimer <= 0) {
      this._kissTimer = 3 + Math.random()*2;
      var p = this.game.localPlayer;
      if (p && p.alive) {
        var dist = Math.sqrt(Math.pow(p.x-this.x,2)+Math.pow(p.y-this.y,2));
        if (dist < 30) {
          if (this.game.sound && this.game.sound.playKissSound) this.game.sound.playKissSound();
          p.takeDamage(8, this);
          this._speech = "Mwah~!"; this._speechTimer = 1.5;
        }
      }
    }
    // Random love speech
    if (this._speechTimer <= 0 && Math.random() < 0.01) {
      this._speech = this._speeches[Math.floor(Math.random()*this._speeches.length)];
      this._speechTimer = 2;
    }
    // Separation from other romance mobs
    var ents = this.game.entities;
    for (var i=0; i<ents.length; i++) {
      var e = ents[i];
      if (e === this || !e.alive || e.enemyType !== "romanceMob") continue;
      var dx = this.x-e.x, dy = this.y-e.y;
      var dist = Math.sqrt(dx*dx+dy*dy);
      if (dist < 18 && dist > 0) {
        this.x += (dx/dist)*1.5;
        this.y += (dy/dist)*1.5;
      }
    }
    super.update(dt);
  }
  takeDamage(amt, atk) {
    if (!this.alive) return;
    // Transform to vampire on first hit
    if (!this._transformed) {
      this._transformed = true;
      this.hp = 45; this.maxHp = 45; // Vampire has more HP
      this.atk = 10; this.contactDamage = 14;
      this.speed = 2.2; this.chaseSpeed = 3.0;
      this._speech = this._hitSpeeches[Math.floor(Math.random()*this._hitSpeeches.length)];
      this._speechTimer = 2;
      if (this.game.sound && this.game.sound.playVampireHiss) this.game.sound.playVampireHiss();
      this.game.camera.shake(3, 0.2);
      this.game.hud.addChatMessage(this.name + " transformed into a VAMPIRE!", "#f44");
      return; // Don't take damage on transform hit
    }
    this.hp -= amt;
    this._speech = this._hitSpeeches[Math.floor(Math.random()*this._hitSpeeches.length)];
    this._speechTimer = 1.5;
    if (atk) {
      var dx = this.x-atk.x, dy = this.y-atk.y, d = Math.sqrt(dx*dx+dy*dy)||1;
      this.vx = (dx/d)*5; this.vy = (dy/d)*5;
    }
    if (this.hp <= 0) { this.hp = 0; this.alive = false; }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var bob = Math.sin(this._age*4)*1.5;
    if (this._transformed) {
      // VAMPIRE FORM - detailed
      // Cape
      ctx.fillStyle = "#300";
      ctx.fillRect(sp.x-1, sp.y+4+bob, 22, 18);
      ctx.fillStyle = "#600";
      ctx.beginPath();
      ctx.moveTo(sp.x-2, sp.y+4+bob); ctx.lineTo(sp.x+10, sp.y+22+bob); ctx.lineTo(sp.x+22, sp.y+4+bob);
      ctx.fill();
      // Body
      ctx.fillStyle = "#222";
      ctx.fillRect(sp.x+3, sp.y+6+bob, 14, 12);
      // Face - pale
      ctx.fillStyle = "#e8d8d8";
      ctx.fillRect(sp.x+4, sp.y-1+bob, 12, 10);
      // Red eyes
      ctx.fillStyle = "#f00";
      ctx.fillRect(sp.x+6, sp.y+2+bob, 3, 2);
      ctx.fillRect(sp.x+11, sp.y+2+bob, 3, 2);
      // Eye pupils
      ctx.fillStyle = "#000";
      ctx.fillRect(sp.x+7, sp.y+3+bob, 1, 1);
      ctx.fillRect(sp.x+12, sp.y+3+bob, 1, 1);
      // Fangs
      ctx.fillStyle = "#fff";
      ctx.fillRect(sp.x+7, sp.y+7+bob, 2, 3);
      ctx.fillRect(sp.x+11, sp.y+7+bob, 2, 3);
      // Blood drip
      ctx.fillStyle = "#f00";
      ctx.fillRect(sp.x+8, sp.y+9+bob, 1, 2);
      ctx.fillRect(sp.x+12, sp.y+9+bob, 1, 2);
      // Hair
      ctx.fillStyle = "#111";
      ctx.fillRect(sp.x+3, sp.y-3+bob, 14, 4);
      ctx.fillRect(sp.x+2, sp.y-2+bob, 2, 6);
      ctx.fillRect(sp.x+16, sp.y-2+bob, 2, 6);
      // Legs
      ctx.fillStyle = "#222";
      ctx.fillRect(sp.x+5, sp.y+18+bob, 4, 5);
      ctx.fillRect(sp.x+11, sp.y+18+bob, 4, 5);
    } else {
      // CUTE ROMANCE FORM
      if (this._gender === "m") {
        // Male - suit
        ctx.fillStyle = "#336";
        ctx.fillRect(sp.x+3, sp.y+8+bob, 14, 12);
        // Tie
        ctx.fillStyle = "#e44";
        ctx.fillRect(sp.x+9, sp.y+8+bob, 3, 8);
        // Face
        ctx.fillStyle = "#ffd5b4";
        ctx.fillRect(sp.x+4, sp.y+bob, 12, 10);
        // Eyes (hearts)
        ctx.fillStyle = "#f44";
        ctx.font = "5px serif"; ctx.textAlign = "center";
        ctx.fillText("\u2665", sp.x+8, sp.y+6+bob);
        ctx.fillText("\u2665", sp.x+13, sp.y+6+bob);
        // Smile
        ctx.fillStyle = "#c44";
        ctx.fillRect(sp.x+8, sp.y+7+bob, 5, 2);
        // Hair
        ctx.fillStyle = "#432";
        ctx.fillRect(sp.x+3, sp.y-2+bob, 14, 4);
      } else {
        // Female - dress
        ctx.fillStyle = "#f69";
        ctx.fillRect(sp.x+2, sp.y+8+bob, 16, 14);
        ctx.fillStyle = "#f9b";
        ctx.beginPath();
        ctx.moveTo(sp.x+2, sp.y+14+bob); ctx.lineTo(sp.x+10, sp.y+22+bob); ctx.lineTo(sp.x+18, sp.y+14+bob);
        ctx.fill();
        // Face
        ctx.fillStyle = "#ffd5b4";
        ctx.fillRect(sp.x+4, sp.y+bob, 12, 10);
        // Eyes (hearts)
        ctx.fillStyle = "#f44";
        ctx.font = "5px serif"; ctx.textAlign = "center";
        ctx.fillText("\u2665", sp.x+8, sp.y+6+bob);
        ctx.fillText("\u2665", sp.x+13, sp.y+6+bob);
        // Blush
        ctx.fillStyle = "rgba(255,100,100,0.3)";
        ctx.fillRect(sp.x+4, sp.y+5+bob, 4, 3);
        ctx.fillRect(sp.x+12, sp.y+5+bob, 4, 3);
        // Hair
        ctx.fillStyle = "#c62";
        ctx.fillRect(sp.x+2, sp.y-3+bob, 16, 5);
        ctx.fillRect(sp.x+1, sp.y-1+bob, 3, 10);
        ctx.fillRect(sp.x+16, sp.y-1+bob, 3, 10);
      }
      // Legs
      ctx.fillStyle = "#333";
      ctx.fillRect(sp.x+5, sp.y+20+bob, 4, 4);
      ctx.fillRect(sp.x+11, sp.y+20+bob, 4, 4);
    }
    // HP bar
    if (this.hp < this.maxHp) {
      ctx.fillStyle = "#300"; ctx.fillRect(sp.x-2, sp.y-8+bob, 24, 3);
      ctx.fillStyle = this._transformed ? "#800" : "#f69";
      ctx.fillRect(sp.x-2, sp.y-8+bob, 24*(this.hp/this.maxHp), 3);
    }
    // Speech bubble
    if (this._speechTimer > 0 && this._speech) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      var tw = ctx.measureText ? 6*this._speech.length : 40;
      ctx.fillRect(sp.x+10-tw/2-2, sp.y-20+bob, tw+4, 10);
      ctx.fillStyle = this._transformed ? "#f44" : "#ffa";
      ctx.font = "6px Courier New"; ctx.textAlign = "center";
      ctx.fillText(this._speech, sp.x+10, sp.y-12+bob);
    }
  }
}

/* ========== CINEMA 2: WAR SOLDIERS ========== */
class WarSoldier extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x:cfg.x, y:cfg.y, width:20, height:26, speed:0.9, color:"#556b2f",
      enemyType:"warSoldier", name:"Soldier",
      hp:50, atk:16, def:6, contactDamage:18, ai:"chase", aggroRange:160, expReward:8
    });
    this.aggroed = false;
    this._age = 0;
    this._shootTimer = 2 + Math.random()*2;
    this._grenadeTimer = 6 + Math.random()*4;
    this._hiding = false;
    this._hideTimer = 0;
    this._alpha = 1;
    this._deathSpeech = false;
  }
  update(dt) {
    if (!this.alive) return;
    this._age += dt;
    // Auto-aggro when player gets close (proximity fallback)
    if (!this.aggroed) {
      var p = this.game.localPlayer;
      if (p && p.alive) {
        var dx = p.x - this.x, dy = p.y - this.y;
        if (Math.sqrt(dx*dx + dy*dy) < 180) this.aggroed = true;
      }
      if (!this.aggroed) return;
    }
    this._shootTimer -= dt;
    this._grenadeTimer -= dt;
    // Random hide
    if (!this._hiding && Math.random() < 0.003) {
      this._hiding = true; this._hideTimer = 2 + Math.random()*2;
      this._alpha = 0.25; this.speed = 0;
    }
    if (this._hiding) {
      this._hideTimer -= dt;
      if (this._hideTimer <= 0) { this._hiding = false; this._alpha = 1; this.speed = 0.9; }
    }
    // Shoot
    if (this._shootTimer <= 0) {
      this._shootTimer = 2.5 + Math.random()*1.5;
      var p = this.game.localPlayer;
      if (p && p.alive) {
        if (this.game.sound && this.game.sound.playGunBurst) this.game.sound.playGunBurst();
        var a = Math.atan2(p.y-this.y, p.x-this.x);
        for (var i = -1; i <= 1; i++) {
          this.game.addEntity(new SoldierBullet(this.game, {
            x:this.x+10, y:this.y+13, dirX:Math.cos(a+i*0.15), dirY:Math.sin(a+i*0.15)
          }));
        }
      }
    }
    // Grenade
    if (this._grenadeTimer <= 0) {
      this._grenadeTimer = 8 + Math.random()*4;
      var p = this.game.localPlayer;
      if (p && p.alive) {
        this.game.addEntity(new SoldierGrenade(this.game, { x:this.x+10, y:this.y, tx:p.x, ty:p.y }));
      }
    }
    // Separation from other soldiers
    var ents = this.game.entities;
    for (var i=0; i<ents.length; i++) {
      var e = ents[i];
      if (e === this || !e.alive || e.enemyType !== "warSoldier") continue;
      var dx = this.x-e.x, dy = this.y-e.y;
      var dist = Math.sqrt(dx*dx+dy*dy);
      if (dist < 20 && dist > 0) {
        this.x += (dx/dist)*1.5;
        this.y += (dy/dist)*1.5;
      }
    }
    super.update(dt);
  }
  takeDamage(amt, atk) {
    if (!this.alive) return;
    this._hiding = false; this._alpha = 1; this.speed = 0.9;
    this.hp -= amt;
    if (atk) { var dx=this.x-atk.x,dy=this.y-atk.y,d=Math.sqrt(dx*dx+dy*dy)||1; this.vx=(dx/d)*4; this.vy=(dy/d)*4; }
    if (this.hp <= 0) {
      this.hp = 0; this.alive = false;
      this.game.combat.spawnDamageNumber(this.x+10, this.y-10, "PEACE!", "#fff", 1.2);
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var bob = Math.sin(this._age*3)*1;
    ctx.globalAlpha = this._alpha;
    // Helmet
    ctx.fillStyle = "#3a4a2a";
    ctx.fillRect(sp.x+3, sp.y-2+bob, 14, 6);
    ctx.fillRect(sp.x+2, sp.y+2+bob, 16, 3);
    // Face
    ctx.fillStyle = "#c9a87c";
    ctx.fillRect(sp.x+5, sp.y+4+bob, 10, 8);
    // Eyes
    ctx.fillStyle = "#333";
    ctx.fillRect(sp.x+7, sp.y+6+bob, 2, 2);
    ctx.fillRect(sp.x+11, sp.y+6+bob, 2, 2);
    // Camo body
    ctx.fillStyle = "#4a5a3a";
    ctx.fillRect(sp.x+2, sp.y+12+bob, 16, 10);
    // Camo pattern
    ctx.fillStyle = "#3a4a2a";
    ctx.fillRect(sp.x+4, sp.y+14+bob, 4, 3);
    ctx.fillRect(sp.x+12, sp.y+16+bob, 3, 3);
    ctx.fillStyle = "#5a6a4a";
    ctx.fillRect(sp.x+8, sp.y+13+bob, 3, 4);
    // Gun
    ctx.fillStyle = "#333";
    ctx.fillRect(sp.x+16, sp.y+13+bob, 6, 2);
    ctx.fillRect(sp.x+14, sp.y+12+bob, 3, 4);
    // Legs
    ctx.fillStyle = "#4a5a3a";
    ctx.fillRect(sp.x+4, sp.y+22+bob, 5, 4);
    ctx.fillRect(sp.x+11, sp.y+22+bob, 5, 4);
    // Boots
    ctx.fillStyle = "#2a2a1a";
    ctx.fillRect(sp.x+3, sp.y+25+bob, 6, 2);
    ctx.fillRect(sp.x+11, sp.y+25+bob, 6, 2);
    ctx.globalAlpha = 1;
    // HP bar
    if (this.hp < this.maxHp) {
      ctx.fillStyle = "#300"; ctx.fillRect(sp.x-2, sp.y-6+bob, 24, 3);
      ctx.fillStyle = "#4a4"; ctx.fillRect(sp.x-2, sp.y-6+bob, 24*(this.hp/this.maxHp), 3);
    }
  }
}

class SoldierBullet extends Entity {
  constructor(game, cfg) {
    super(game, { x:cfg.x, y:cfg.y, width:4, height:4, speed:5, color:"#ff0", type:"enemy", tags:["enemy"] });
    this._dirX = cfg.dirX; this._dirY = cfg.dirY; this._age = 0;
    this.contactDamage = 8;
  }
  update(dt) {
    this._age += dt;
    if (this._age > 3) { this.destroy(); return; }
    this.x += this._dirX*this.speed*60*dt;
    this.y += this._dirY*this.speed*60*dt;
    var p = this.game.localPlayer;
    if (p && p.alive && Math.sqrt(Math.pow(p.x+8-this.x,2)+Math.pow(p.y+8-this.y,2)) < 14) {
      p.takeDamage(this.contactDamage, this);
      this.destroy();
    }
  }
  render(ctx, camera) {
    var sp = camera.worldToScreen(this.x, this.y);
    ctx.fillStyle = "#ff0"; ctx.fillRect(sp.x, sp.y, 4, 4);
    ctx.fillStyle = "#f80"; ctx.fillRect(sp.x+1, sp.y+1, 2, 2);
  }
}

class SoldierGrenade extends Entity {
  constructor(game, cfg) {
    super(game, { x:cfg.x, y:cfg.y, width:8, height:8, speed:0, color:"#4a4", type:"enemy", tags:["enemy"] });
    this._tx = cfg.tx; this._ty = cfg.ty; this._age = 0; this._fuse = 1.5;
    this._sx = cfg.x; this._sy = cfg.y;
  }
  update(dt) {
    this._age += dt;
    var t = Math.min(this._age / this._fuse, 1);
    this.x = this._sx + (this._tx - this._sx)*t;
    this.y = this._sy + (this._ty - this._sy)*t - Math.sin(t*Math.PI)*60;
    if (this._age >= this._fuse) {
      // Explode!
      if (this.game.sound && this.game.sound.playBombDrop) this.game.sound.playBombDrop();
      this.game.camera.shake(8, 0.5);
      var p = this.game.localPlayer;
      if (p && p.alive) {
        var dist = Math.sqrt(Math.pow(p.x-this._tx,2)+Math.pow(p.y-this._ty,2));
        if (dist < 50) p.takeDamage(15, this);
      }
      // Spawn debris
      for (var i = 0; i < 6; i++) {
        this.game.addEntity(new Debris(this.game, { x:this._tx, y:this._ty }));
      }
      this.destroy();
    }
  }
  render(ctx, camera) {
    var sp = camera.worldToScreen(this.x, this.y);
    ctx.fillStyle = "#4a4"; ctx.beginPath(); ctx.arc(sp.x+4, sp.y+4, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#222"; ctx.fillRect(sp.x+3, sp.y-2, 2, 4);
    // Fuse spark
    ctx.fillStyle = "#f80";
    ctx.fillRect(sp.x+3+Math.random()*2, sp.y-3+Math.random()*2, 2, 2);
  }
}

class Debris extends Entity {
  constructor(game, cfg) {
    super(game, { x:cfg.x, y:cfg.y, width:6, height:6, speed:0, color:"#888", type:"decoration" });
    this._vx = (Math.random()-0.5)*8; this._vy = (Math.random()-0.5)*8 - 3;
    this._age = 0; this._lifetime = 1.5;
    this._color = ["#888","#654","#999","#543","#876"][Math.floor(Math.random()*5)];
  }
  update(dt) {
    this._age += dt;
    if (this._age > this._lifetime) { this.destroy(); return; }
    this.x += this._vx*60*dt; this.y += this._vy*60*dt;
    this._vy += 12*dt; // gravity
  }
  render(ctx, camera) {
    var sp = camera.worldToScreen(this.x, this.y);
    ctx.globalAlpha = 1 - this._age/this._lifetime;
    ctx.fillStyle = this._color;
    ctx.fillRect(sp.x, sp.y, 4+Math.random()*4, 3+Math.random()*3);
    ctx.globalAlpha = 1;
  }
}

/* Bomb falling from sky (Cinema 2 hazard) */
class FallingBomb extends Entity {
  constructor(game, cfg) {
    super(game, { x:cfg.x, y:cfg.y-80, width:12, height:12, speed:0, color:"#333", type:"enemy", tags:["enemy"] });
    this._targetY = cfg.y; this._age = 0; this._exploded = false;
  }
  update(dt) {
    this._age += dt;
    this.y += 120*dt;
    if (this.y >= this._targetY && !this._exploded) {
      this._exploded = true;
      if (this.game.sound) this.game.sound.playExplosion();
      this.game.camera.shake(10, 0.6);
      var p = this.game.localPlayer;
      if (p && p.alive) {
        var dist = Math.sqrt(Math.pow(p.x-this.x,2)+Math.pow(p.y-this._targetY,2));
        if (dist < 60) p.takeDamage(20, this);
      }
      for (var i = 0; i < 8; i++) this.game.addEntity(new Debris(this.game, {x:this.x, y:this._targetY}));
      this.destroy();
    }
  }
  render(ctx, camera) {
    var sp = camera.worldToScreen(this.x, this.y);
    // Shadow on ground
    var gsp = camera.worldToScreen(this.x, this._targetY);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath(); ctx.ellipse(gsp.x+6, gsp.y+6, 8, 4, 0, 0, Math.PI*2); ctx.fill();
    // Bomb
    ctx.fillStyle = "#333";
    ctx.beginPath(); ctx.arc(sp.x+6, sp.y+6, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#666"; ctx.fillRect(sp.x+4, sp.y-2, 4, 4);
    // Red blink
    if (Math.sin(this._age*20) > 0) {
      ctx.fillStyle = "#f00"; ctx.fillRect(sp.x+5, sp.y+4, 2, 2);
    }
  }
}

/* ========== CINEMA 3: ZOMBIE VIEWERS ========== */
class ZombieViewer extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x:cfg.x, y:cfg.y, width:20, height:26, speed:0, color:"#7a7",
      enemyType:"zombieViewer", name:"Zombie",
      hp:44, atk:13, def:5, contactDamage:19, ai:"stationary", aggroRange:0, expReward:7
    });
    this._age = 0;
    this._transformed = false;
    this._transformDelay = cfg.delay || 4;
    this._playerEntered = false;
    this._enterTimer = 0;
    this._vomitTimer = 0;
    this._isVomiting = false;
    this._deathMsgs = [
      "So unfair...","Ugh...restore me","Mommmyyy","I'm not usually like this",
      "Why did you revive me for this","Ugh...not feeling it today","My lines aren't done yet",
      "Not like this...","Ew, rude.","Why me though...","Okay, embarrassing.",
      "Yeah nah, I'm done.","This is not cute.","Mate, tragic.",
      "I hate this for me.","So unfair...","Actually rude."
    ];
    this._speech = ""; this._speechTimer = 0;
  }
  update(dt) {
    if (!this.alive) return;
    this._age += dt;
    this._speechTimer -= dt;
    // Stay idle until player enters cinema 3
    if (!this._playerEntered) return;
    // Count time since player entered
    this._enterTimer += dt;
    // Transform after delay from player entry
    if (!this._transformed && this._enterTimer >= this._transformDelay) {
      this._transformed = true;
      this.speed = 2.0; this.chaseSpeed = 2.8;
      this.ai = "chase"; this.aggroRange = 200;
      this.aggroed = true;
      this._speech = "Nan hangsang baegopda!"; this._speechTimer = 2;
      if (this.game.sound && this.game.sound.playZombieTransform) this.game.sound.playZombieTransform();
    }
    // Hungry speech
    if (this._transformed && this._speechTimer <= 0 && Math.random() < 0.008) {
      this._speech = "Nan hangsang baegopda!";
      this._speechTimer = 2;
    }
    // Separation from other zombies when transformed
    if (this._transformed) {
      var ents = this.game.entities;
      for (var i=0; i<ents.length; i++) {
        var e = ents[i];
        if (e === this || !e.alive || e.enemyType !== "zombieViewer") continue;
        var dx = this.x-e.x, dy = this.y-e.y;
        var dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < 22 && dist > 0) {
          this.x += (dx/dist)*1.5;
          this.y += (dy/dist)*1.5;
        }
      }
    }
    super.update(dt);
  }
  takeDamage(amt, atk) {
    if (!this.alive) return;
    this.hp -= amt;
    this._isVomiting = true;
    setTimeout(function() { this._isVomiting = false; }.bind(this), 500);
    if (atk) { var dx=this.x-atk.x,dy=this.y-atk.y,d=Math.sqrt(dx*dx+dy*dy)||1; this.vx=(dx/d)*4; this.vy=(dy/d)*4; }
    if (this.hp <= 0) {
      this.hp = 0; this.alive = false;
      var msg = this._deathMsgs[Math.floor(Math.random()*this._deathMsgs.length)];
      this.game.combat.spawnDamageNumber(this.x+10, this.y-10, msg, "#7f7", 1.3);
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var bob = this._transformed ? Math.sin(this._age*5)*2 : 0;
    if (this._transformed) {
      // ZOMBIE FORM - detailed
      // Tattered clothes
      ctx.fillStyle = "#4a4a3a";
      ctx.fillRect(sp.x+2, sp.y+10+bob, 16, 12);
      ctx.fillStyle = "#3a3a2a";
      ctx.fillRect(sp.x+4, sp.y+12+bob, 4, 8);
      ctx.fillRect(sp.x+14, sp.y+14+bob, 3, 5);
      // Rotting skin
      ctx.fillStyle = "#7a9a5a";
      ctx.fillRect(sp.x+4, sp.y+bob, 12, 11);
      // Exposed bone
      ctx.fillStyle = "#ddd";
      ctx.fillRect(sp.x+6, sp.y+5+bob, 2, 3);
      // Sunken eyes
      ctx.fillStyle = "#000";
      ctx.fillRect(sp.x+6, sp.y+3+bob, 3, 3);
      ctx.fillRect(sp.x+11, sp.y+3+bob, 3, 3);
      ctx.fillStyle = "#ff0";
      ctx.fillRect(sp.x+7, sp.y+4+bob, 1, 1);
      ctx.fillRect(sp.x+12, sp.y+4+bob, 1, 1);
      // Mouth/jaw
      ctx.fillStyle = "#333";
      ctx.fillRect(sp.x+7, sp.y+8+bob, 6, 3);
      ctx.fillStyle = "#ddd"; // teeth
      ctx.fillRect(sp.x+8, sp.y+8+bob, 1, 1);
      ctx.fillRect(sp.x+10, sp.y+8+bob, 1, 1);
      ctx.fillRect(sp.x+12, sp.y+8+bob, 1, 1);
      // Green vomit when hit
      if (this._isVomiting) {
        ctx.fillStyle = "#0f0";
        for (var v=0; v<4; v++) {
          ctx.fillRect(sp.x+8+Math.random()*6, sp.y+10+bob+Math.random()*8, 3, 2);
        }
      }
      // Arms reaching out
      ctx.fillStyle = "#7a9a5a";
      var armReach = Math.sin(this._age*3)*3;
      ctx.fillRect(sp.x-3, sp.y+10+bob+armReach, 6, 4);
      ctx.fillRect(sp.x+17, sp.y+10+bob-armReach, 6, 4);
      // Legs (shambling)
      ctx.fillStyle = "#4a4a3a";
      var legShuffle = Math.sin(this._age*6)*2;
      ctx.fillRect(sp.x+4, sp.y+22+bob, 5, 4+legShuffle);
      ctx.fillRect(sp.x+11, sp.y+22+bob, 5, 4-legShuffle);
    } else {
      // Normal viewer (sitting, watching movie)
      ctx.fillStyle = "#555";
      ctx.fillRect(sp.x+3, sp.y+10, 14, 14);
      ctx.fillStyle = "#dca";
      ctx.fillRect(sp.x+5, sp.y+2, 10, 9);
      ctx.fillStyle = "#333";
      ctx.fillRect(sp.x+7, sp.y+5, 2, 2);
      ctx.fillRect(sp.x+11, sp.y+5, 2, 2);
      ctx.fillStyle = "#432";
      ctx.fillRect(sp.x+4, sp.y, 12, 4);
    }
    // HP bar
    if (this._transformed && this.hp < this.maxHp) {
      ctx.fillStyle = "#300"; ctx.fillRect(sp.x-2, sp.y-8+bob, 24, 3);
      ctx.fillStyle = "#7a7"; ctx.fillRect(sp.x-2, sp.y-8+bob, 24*(this.hp/this.maxHp), 3);
    }
    // Speech bubble
    if (this._speechTimer > 0 && this._speech) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(sp.x-8, sp.y-18+bob, 40, 10);
      ctx.fillStyle = "#7f7"; ctx.font = "5px Courier New"; ctx.textAlign = "center";
      ctx.fillText(this._speech, sp.x+10, sp.y-10+bob);
    }
  }
}

/* ========== CINEMA 4: MATH MONSTERS ========== */
class MathMonster extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x:cfg.x, y:cfg.y, width:22, height:26, speed:2.72, color:"#a0f",
      enemyType:"mathMonster", name:cfg.name||"Math Monster",
      hp:56, atk:17, def:6, contactDamage:22, ai:"chase", aggroRange:400, expReward:9
    });
    this.aggroed = true;
    this._age = 0;
    this._formulas = ["\u03C0r\u00B2","E=mc\u00B2","a\u00B2+b\u00B2","sin\u03B8","\u222Bf(x)dx","\u0394y/\u0394x","lim n\u2192\u221E","P(A|B)","log\u2082n","\u03A3n=1"];
    this._formula = this._formulas[Math.floor(Math.random()*this._formulas.length)];
    this._mumbleTimer = 0;
    this._stuckTimer = 0;
    this._lastX = cfg.x; this._lastY = cfg.y;
    // Diverse movement: each mob gets a unique behavior pattern
    var patterns = ["chase","zigzag","flank","pause","circle"];
    this._movePattern = patterns[Math.floor(Math.random()*patterns.length)];
    this._patternTimer = 0;
    this._zigzagDir = 1;
    this._pauseTimer = 0;
    this._circleAngle = Math.random()*Math.PI*2;
  }
  update(dt) {
    if (!this.alive) return;
    this._age += dt;
    this._mumbleTimer -= dt;
    this._patternTimer += dt;
    // Check if stuck
    var moved = Math.abs(this.x-this._lastX)+Math.abs(this.y-this._lastY);
    if (moved < 0.5) {
      this._stuckTimer += dt;
      if (this._stuckTimer > 0.5) {
        this.vx = (Math.random()-0.5)*6;
        this.vy = (Math.random()-0.5)*6;
        this._stuckTimer = 0;
      }
    } else { this._stuckTimer = 0; }
    this._lastX = this.x; this._lastY = this.y;
    // Mumble formula
    if (this._mumbleTimer <= 0) {
      this._formula = this._formulas[Math.floor(Math.random()*this._formulas.length)];
      this._mumbleTimer = 2 + Math.random()*3;
    }
    if (this.game.sound && this.game.sound.playMathMumble && Math.random() < 0.005) {
      this.game.sound.playMathMumble();
    }
    // Diverse movement patterns instead of all chasing directly
    var p = this.game.localPlayer;
    if (p && p.alive) {
      var dx = p.x - this.x, dy = p.y - this.y;
      var dist = Math.sqrt(dx*dx+dy*dy) || 1;
      var spd = this.speed;
      if (this._movePattern === "zigzag") {
        // Zigzag toward player
        if (this._patternTimer > 0.6) { this._patternTimer = 0; this._zigzagDir *= -1; }
        var perpX = -dy/dist, perpY = dx/dist;
        this.moveWithCollision((dx/dist)*spd + perpX*spd*0.6*this._zigzagDir, (dy/dist)*spd + perpY*spd*0.6*this._zigzagDir, this.game.tileMap);
      } else if (this._movePattern === "flank") {
        // Circle around to flank from the side
        var angle = Math.atan2(dy, dx) + Math.PI*0.4;
        if (dist < 60) angle = Math.atan2(dy, dx); // close enough, go direct
        this.moveWithCollision(Math.cos(angle)*spd, Math.sin(angle)*spd, this.game.tileMap);
      } else if (this._movePattern === "pause") {
        // Chase then pause periodically
        this._pauseTimer -= dt;
        if (this._pauseTimer <= 0) {
          this._pauseTimer = 1.5 + Math.random()*2;
          this._pausing = !this._pausing;
        }
        if (!this._pausing) {
          this.moveWithCollision((dx/dist)*spd*1.2, (dy/dist)*spd*1.2, this.game.tileMap);
        }
      } else if (this._movePattern === "circle") {
        // Orbit around player at distance, occasionally dart in
        this._circleAngle += dt*1.5;
        if (dist > 100) {
          this.moveWithCollision((dx/dist)*spd, (dy/dist)*spd, this.game.tileMap);
        } else {
          var cx = Math.cos(this._circleAngle)*spd*0.8, cy = Math.sin(this._circleAngle)*spd*0.8;
          if (Math.sin(this._age*2) > 0.8) { cx = (dx/dist)*spd*1.3; cy = (dy/dist)*spd*1.3; }
          this.moveWithCollision(cx, cy, this.game.tileMap);
        }
      } else {
        // Default chase (via super.update)
        super.update(dt);
        return;
      }
      // Direction for rendering
      if (Math.abs(dx) > Math.abs(dy)) this.direction = dx > 0 ? "right" : "left";
      else this.direction = dy > 0 ? "down" : "up";
    }
    // Separation from other math monsters
    var ents = this.game.entities;
    for (var i=0; i<ents.length; i++) {
      var e = ents[i];
      if (e === this || !e.alive || e.enemyType !== "mathMonster") continue;
      var sdx = this.x-e.x, sdy = this.y-e.y;
      var sdist = Math.sqrt(sdx*sdx+sdy*sdy);
      if (sdist < 24 && sdist > 0) { this.x += (sdx/sdist)*1.5; this.y += (sdy/sdist)*1.5; }
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var bob = Math.sin(this._age*6)*2;
    var wobble = Math.sin(this._age*8)*1;
    // Body (school uniform mutated)
    ctx.fillStyle = "#336";
    ctx.fillRect(sp.x+2+wobble, sp.y+8+bob, 18, 14);
    // Equation symbols floating on body
    ctx.fillStyle = "rgba(0,255,255,0.5)";
    ctx.font = "6px monospace"; ctx.textAlign = "center";
    ctx.fillText("\u03C0", sp.x+8+wobble, sp.y+16+bob);
    ctx.fillText("\u03A3", sp.x+14+wobble, sp.y+18+bob);
    // Oversized head (big brain)
    ctx.fillStyle = "#c8b8f8";
    ctx.fillRect(sp.x+1+wobble, sp.y-4+bob, 20, 14);
    // Brain bump on top
    ctx.fillStyle = "#d8c8ff";
    ctx.beginPath(); ctx.arc(sp.x+11+wobble, sp.y-5+bob, 6, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = "#a898d8"; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(sp.x+7+wobble, sp.y-5+bob);
    ctx.quadraticCurveTo(sp.x+11+wobble, sp.y-8+bob, sp.x+15+wobble, sp.y-5+bob); ctx.stroke();
    // Spiral eyes
    ctx.strokeStyle = "#f0f"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(sp.x+6+wobble, sp.y+2+bob, 2, 0, Math.PI*4); ctx.stroke();
    ctx.beginPath(); ctx.arc(sp.x+15+wobble, sp.y+2+bob, 2, 0, Math.PI*4); ctx.stroke();
    // Crazed mouth
    ctx.fillStyle = "#000";
    ctx.fillRect(sp.x+7+wobble, sp.y+6+bob, 8, 3);
    ctx.fillStyle = "#fff";
    for (var ti=0; ti<4; ti++) ctx.fillRect(sp.x+8+ti*2+wobble, sp.y+6+bob, 1, 2);
    // Arms (reaching)
    ctx.fillStyle = "#c8b8f8";
    var armW = Math.sin(this._age*5)*4;
    ctx.fillRect(sp.x-4+wobble, sp.y+8+bob+armW, 6, 4);
    ctx.fillRect(sp.x+18+wobble, sp.y+8+bob-armW, 6, 4);
    // Legs
    ctx.fillStyle = "#334";
    ctx.fillRect(sp.x+4+wobble, sp.y+22+bob, 5, 4);
    ctx.fillRect(sp.x+13+wobble, sp.y+22+bob, 5, 4);
    // Formula speech bubble
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(sp.x-4, sp.y-18+bob, 30, 10);
    ctx.fillStyle = "#0ff"; ctx.font = "6px monospace"; ctx.textAlign = "center";
    ctx.fillText(this._formula, sp.x+11, sp.y-10+bob);
    // HP bar
    if (this.hp < this.maxHp) {
      ctx.fillStyle = "#300"; ctx.fillRect(sp.x-2, sp.y-22+bob, 26, 3);
      ctx.fillStyle = "#a0f"; ctx.fillRect(sp.x-2, sp.y-22+bob, 26*(this.hp/this.maxHp), 3);
    }
  }
}

/* ========== MISS KUMARWITCH - FINAL BOSS ========== */
class MissKumarwitch extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x:cfg.x, y:cfg.y, width:36, height:40, speed:1.8, color:"#800080",
      enemyType:"kumarwitch", name:"Miss Kumarwitch",
      hp:375, atk:40, def:16, contactDamage:45, ai:"chase", aggroRange:350, expReward:200
    });
    this.aggroed = false; // Starts idle, activated by dialogue
    this._age = 0;
    this._originalMaxHp = 375;
    this._scaleLevel = 0; // grows each 15% HP lost
    this._lastHpThreshold = 1.0;
    this._attackTimer = 0;
    this._mathProjectileTimer = 0;
    this._onDeath = cfg.onDeath || null;
    this._fled = false;
    this._fleeing = false;
    this._fleeAngle = 0;
    this._fleeLaps = 0;
    this._fleeSpeed = 6;
    this._fleeCenterX = 0;
    this._fleeCenterY = 0;
    this._fleeRadius = 0;
    this._fleeDialogueDone = false;
    this._flashTimer = 0;
  }
  takeDamage(amt, atk) {
    if (!this.alive || this._fled) return;
    this.hp -= amt;
    this._playHurtSound();
    if (atk) {
      var dx = this.x - atk.x, dy = this.y - atk.y, d = Math.sqrt(dx*dx+dy*dy) || 1;
      this.vx = (dx/d)*6; this.vy = (dy/d)*6;
    }
    this._flashTimer = 0.15;
    // Every hit: grow 10% size, +10% ATK, +5% DEF
    this._hitCount = (this._hitCount || 0) + 1;
    this.width = Math.floor(36 * (1 + this._hitCount * 0.1));
    this.height = Math.floor(40 * (1 + this._hitCount * 0.1));
    this.atk = Math.floor(40 * (1 + this._hitCount * 0.1));
    this.contactDamage = Math.floor(45 * (1 + this._hitCount * 0.1));
    this.def = Math.floor(16 * (1 + this._hitCount * 0.05));
    if (this._hitCount % 3 === 0) {
      this.game.addEntity(new CinemaHealthPill(this.game, { x:this.x+20, y:this.y+30, heal:25 }));
    }
    if (this.game.sound) this.game.sound.playBossPhaseUp();
    this.game.hud.addChatMessage("Miss Kumarwitch grows BIGGER! (Hit " + this._hitCount + ")", "#f0f");
    this.game.camera.shake(3, 0.2);
    // At 5% HP: trigger flee sequence
    var hpRatio = this.hp / this._originalMaxHp;
    if ((hpRatio <= 0.05 || this.hp <= 0) && !this._fled) {
      this.hp = 1;
      this._fled = true;
      this.contactDamage = 0;
      // Pause game, start flee animation immediately
      this._fleeing = true;
      this._fleeCenterX = 53.5 * 16;
      this._fleeCenterY = 47 * 16;
      this._fleeRadius = 10 * 16;
      this._fleeAngle = 0;
      this.game.camera.shake(8, 0.5);
      this.game.hud.addChatMessage("Miss Kumarwitch is PANICKING! She's running away!!!", "#f0f");
    }
  }
  update(dt) {
    if (!this.alive || !this.aggroed) return;
    this._age += dt;
    this._flashTimer = Math.max(0, this._flashTimer - dt);

    // FLEEING: counterclockwise 5 laps, then pause for dialogue, then victory
    if (this._fleeing) {
      this._fleeAngle -= dt * 3.5;
      var laps = Math.abs(this._fleeAngle) / (Math.PI * 2);
      this.x = this._fleeCenterX + Math.cos(this._fleeAngle) * this._fleeRadius;
      this.y = this._fleeCenterY + Math.sin(this._fleeAngle) * this._fleeRadius;
      this.width = Math.max(36, this.width - dt * 8);
      this.height = Math.max(40, this.height - dt * 9);
      if (Math.random() < 0.03) {
        var panics = ["AAAHHHH!!","NOT FAIR!","I HATE THIS!","MY EQUATIONS!","WAIT STOP!","THIS IS SO UNFAIR!"];
        this.game.combat.spawnDamageNumber(this.x+18, this.y-10, panics[Math.floor(Math.random()*panics.length)], "#f0f");
      }
      // After 5 laps: set flag for Stage2_3F controller to handle dialogue
      if (laps >= 5 && !this._fleeComplete) {
        this._fleeComplete = true;
        this._fleeing = false;
      }
      return;
    }

    this._attackTimer -= dt;
    this._mathProjectileTimer -= dt;
    // Growth is now handled per-hit in takeDamage, remove old threshold logic
    var hpRatio = this.hp / this._originalMaxHp;
    // Safety fallback for flee trigger
    if (hpRatio <= 0.05 && !this._fled) {
      this._fled = true;
      this.hp = 1;
      this.contactDamage = 0;
      this.def = 999; // invincible during flee
      this.game.camera.shake(8, 0.5);
      this.game.hud.addChatMessage("Miss Kumarwitch is PANICKING! She's running away!!!", "#f0f");
      if (this.game.sound && this.game.sound.playKidsScream) this.game.sound.playKidsScream();
      return;
    }
    // Math projectile attack
    if (this._mathProjectileTimer <= 0) {
      this._mathProjectileTimer = 2.0 - this._scaleLevel * 0.15;
      var p = this.game.localPlayer;
      if (p && p.alive) {
        var a = Math.atan2(p.y-this.y, p.x-this.x);
        this.game.addEntity(new MathProjectile(this.game, {
          x:this.x+this.width/2, y:this.y+this.height/2, dirX:Math.cos(a), dirY:Math.sin(a)
        }));
      }
    }
    super.update(dt);
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var w = this.width, h = this.height;
    var bob = Math.sin(this._age*3)*2;
    var scale = 1 + (this._hitCount || 0) * 0.1;
    // Flash
    if (this._flashTimer > 0) { ctx.fillStyle = "#fff"; ctx.fillRect(sp.x-2, sp.y-2+bob, w+4, h+4); }
    // Witch robe
    ctx.fillStyle = "#4a0060";
    ctx.fillRect(sp.x+2, sp.y+Math.floor(h*0.25)+bob, w-4, Math.floor(h*0.55));
    // Robe flare
    ctx.fillStyle = "#5a0080";
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y+h*0.7+bob); ctx.lineTo(sp.x+w/2, sp.y+h+bob); ctx.lineTo(sp.x+w, sp.y+h*0.7+bob);
    ctx.fill();
    // Cape
    ctx.fillStyle = "#2a0040";
    ctx.fillRect(sp.x+w*0.1, sp.y+h*0.2+bob, w*0.8, h*0.3);
    // Face
    ctx.fillStyle = "#e8c8e8";
    ctx.fillRect(sp.x+w*0.2, sp.y+bob, w*0.6, h*0.3);
    // Witch hat
    ctx.fillStyle = "#2a0040";
    ctx.fillRect(sp.x+w*0.1, sp.y-h*0.05+bob, w*0.8, h*0.1);
    ctx.beginPath();
    ctx.moveTo(sp.x+w*0.25, sp.y-h*0.05+bob);
    ctx.lineTo(sp.x+w*0.5, sp.y-h*0.35+bob);
    ctx.lineTo(sp.x+w*0.75, sp.y-h*0.05+bob);
    ctx.fill();
    // Hat buckle
    ctx.fillStyle = "#fa0";
    ctx.fillRect(sp.x+w*0.35, sp.y-h*0.07+bob, w*0.3, h*0.05);
    // Eyes (glowing)
    ctx.fillStyle = "#f0f";
    ctx.fillRect(sp.x+w*0.3, sp.y+h*0.08+bob, w*0.12, h*0.06);
    ctx.fillRect(sp.x+w*0.58, sp.y+h*0.08+bob, w*0.12, h*0.06);
    // Sinister smile
    ctx.strokeStyle = "#f0f"; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sp.x+w*0.5, sp.y+h*0.18+bob, w*0.15, 0, Math.PI);
    ctx.stroke();
    // Staff
    ctx.fillStyle = "#840";
    ctx.fillRect(sp.x+w+2, sp.y+h*0.1+bob, 3, h*0.8);
    // Staff orb
    ctx.fillStyle = "#f0f";
    ctx.beginPath(); ctx.arc(sp.x+w+3.5, sp.y+h*0.08+bob, 4, 0, Math.PI*2); ctx.fill();
    // Aura
    var auraGlow = 0.15 + Math.sin(this._age*3)*0.1;
    ctx.fillStyle = "rgba(160,0,255,"+auraGlow+")";
    ctx.beginPath(); ctx.arc(sp.x+w/2, sp.y+h/2+bob, w*0.7, 0, Math.PI*2); ctx.fill();
    // HP bar
    ctx.fillStyle = "#300"; ctx.fillRect(sp.x-4, sp.y-h*0.4+bob, w+8, 5);
    ctx.fillStyle = "#f0f"; ctx.fillRect(sp.x-4, sp.y-h*0.4+bob, (w+8)*(this.hp/this.maxHp), 5);
    // Name
    ctx.fillStyle = "#f0f"; ctx.font = "bold 7px Courier New"; ctx.textAlign = "center";
    ctx.fillText("Miss Kumarwitch", sp.x+w/2, sp.y-h*0.45+bob);
  }
}

class MathProjectile extends Entity {
  constructor(game, cfg) {
    super(game, { x:cfg.x, y:cfg.y, width:10, height:10, speed:3.5, color:"#f0f", type:"enemy", tags:["enemy"] });
    this._dirX = cfg.dirX; this._dirY = cfg.dirY; this._age = 0;
    this.contactDamage = 12;
    this._symbol = ["\u03C0","\u03A3","\u221A","\u222B","\u0394","\u221E"][Math.floor(Math.random()*6)];
  }
  update(dt) {
    this._age += dt;
    if (this._age > 4) { this.destroy(); return; }
    this.x += this._dirX*this.speed*60*dt;
    this.y += this._dirY*this.speed*60*dt;
    var p = this.game.localPlayer;
    if (p && p.alive && Math.sqrt(Math.pow(p.x+8-this.x-5,2)+Math.pow(p.y+8-this.y-5,2)) < 16) {
      p.takeDamage(this.contactDamage, this);
      this.destroy();
    }
  }
  render(ctx, camera) {
    var sp = camera.worldToScreen(this.x, this.y);
    ctx.fillStyle = "rgba(160,0,255,0.5)";
    ctx.beginPath(); ctx.arc(sp.x+5, sp.y+5, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 8px monospace"; ctx.textAlign = "center";
    ctx.fillText(this._symbol, sp.x+5, sp.y+8);
  }
}


/* ================================================================
   STAGE 2 - 3F CONTROLLER
   ================================================================ */
class Stage2_3F {
  constructor(onComplete) {
    this._onComplete = onComplete;
    this.game = null;
    this._age = 0;
    this._mapW = 72;
    this._mapH = 60;
    // Cinema states
    this._cinema1Clear = false;
    this._cinema2Clear = false;
    this._cinema3Clear = false;
    this._cinema4Clear = false;
    this._cinema2Open = false;
    this._cinema3Open = false;
    this._cinema4Open = false;
    // Mob tracking
    this._cinema1Mobs = [];
    this._cinema2Mobs = [];
    this._cinema3Mobs = [];
    this._cinema4Mobs = [];
    // Cinema 4 special
    this._runSequenceActive = false;
    this._runSequenceTimer = 0;
    this._runTextSize = 10;
    this._swordSpawned = false;
    this._bossDialogueDone = false;
    this._boss = null;
    this._bossTriggered = false;
    this._allStudentsKilled = false;
    // Cinema 2 bomb timer
    this._bombTimer = 0;
    // BGM tracking
    this._cinema1BgmPlayed = false;
    this._cinema2BgmPlayed = false;
    this._cinema3Entered = false;
    this._cinema4Entered = false;
    // Door positions (tile coords) - will be set in init
    this._doors = {};
  }

  init(game) {
    this.game = game;
    var p = game.localPlayer;
    p.sideScrollMode = false;
    p.x = 36*16; p.y = 30*16; // Center lobby
    p.vx = 0; p.vy = 0;

    var W = this._mapW, H = this._mapH;
    var ground = [], collision = [];

    for (var y = 0; y < H; y++) {
      var gr = [], cr = [];
      for (var x = 0; x < W; x++) {
        if (x === 0 || x === W-1 || y === 0 || y === H-1) {
          gr.push(4); cr.push(1);
        } else if (y >= 26 && y <= 34) {
          // Central lobby - polished dark floor with red carpet
          var isRedCarpet = (x >= 30 && x <= 42);
          gr.push(isRedCarpet ? 2 : 12);
          cr.push(0);
        } else if ((x >= 2 && x <= 34 && y >= 2 && y <= 24) ||
                   (x >= 37 && x <= 70 && y >= 2 && y <= 24) ||
                   (x >= 2 && x <= 34 && y >= 36 && y <= 58) ||
                   (x >= 37 && x <= 70 && y >= 36 && y <= 58)) {
          // Cinema halls - dark floor with seat patterns
          var isScreen = (y === 3 || y === 37); // screen rows
          var isSeat = !isScreen && ((y-5)%3===0 || (y-39)%3===0);
          if (isScreen) { gr.push(11); cr.push(0); }
          else if (isSeat && x%2===0) { gr.push(13); cr.push(0); }
          else { gr.push(12); cr.push(0); }
        } else {
          gr.push(4); cr.push(1); // walls between areas
        }
      }
      ground.push(gr); collision.push(cr);
    }

    // Cinema divider walls
    // Horizontal walls between lobby and cinemas
    for (var x=1; x<W-1; x++) {
      if (x < 35 || x > 36) { // Leave some gaps for doors
        if (ground[25]) { ground[25][x] = 5; collision[25][x] = 1; }
        if (ground[35]) { ground[35][x] = 5; collision[35][x] = 1; }
      }
    }
    // Vertical divider between left/right cinemas
    for (var y=1; y<H-1; y++) {
      if (y < 26 || y > 34) {
        if (x < W) { ground[y][35] = 5; collision[y][35] = 1; ground[y][36] = 5; collision[y][36] = 1; }
      }
    }

    // Cinema doors (gaps in walls)
    // Cinema 1 (top-left) - door at bottom, always open
    this._doors.c1 = { x:16, y:25 };
    collision[25][16] = 0; collision[25][17] = 0; collision[25][18] = 0;
    ground[25][16] = 12; ground[25][17] = 12; ground[25][18] = 12;

    // Cinema 2 (top-right) - door, initially closed
    this._doors.c2 = { x:52, y:25 };
    // Cinema 3 (bottom-left) - door, initially closed
    this._doors.c3 = { x:16, y:35 };
    // Cinema 4 (bottom-right) - door, initially closed
    this._doors.c4 = { x:52, y:35 };

    // Seat rows (collision) inside cinemas - rows of chairs
    // Every 4 tiles vertically (row of seats), every 3 tiles horizontally (2-tile aisle between)
    // Leave center aisle (x=17-19 for left cinemas, x=52-54 for right cinemas)
    var seatAreas = [
      { sx:4, ex:32, sy:6, ey:20, aisleX1:16, aisleX2:19 },  // Cinema 1
      { sx:39, ex:68, sy:6, ey:20, aisleX1:52, aisleX2:55 }, // Cinema 2
      { sx:4, ex:32, sy:40, ey:54, aisleX1:16, aisleX2:19 }, // Cinema 3
      { sx:39, ex:68, sy:40, ey:54, aisleX1:52, aisleX2:55 } // Cinema 4
    ];
    for (var ai=0; ai<seatAreas.length; ai++) {
      var sa = seatAreas[ai];
      for (var sy=sa.sy; sy<=sa.ey; sy+=4) {
        for (var sx=sa.sx; sx<=sa.ex; sx+=3) {
          // Skip center aisle tiles
          if (sx >= sa.aisleX1 && sx <= sa.aisleX2) continue;
          if (sx < W && sy < H) { collision[sy][sx] = 1; }
        }
      }
    }

    game.tileMap = new TileMap(game);
    game.tileMap.load({ width:W, height:H, ground:ground, collision:collision, above:[], events:[], spawns:{}, exits:[] }, null);

    game.camera.setMapBounds(W*16, H*16);

    if (game.sound) { game.sound.stopBGM(); game.sound.resetTempo(); }

    game.hud.showStageName("Stage 2-3F: Top Ryde City - Event Cinema");
    game.hud.addChatMessage("Welcome to Event Cinema! 4 screenings await...", "#50c878");
    game.hud.addChatMessage("Cinema 1 is OPEN! Enter through the lobby.", "#88bbff");

    this._spawnCinema1();
  }

  _spawnCinema1() {
    var game = this.game, self = this;
    // BGM plays when player enters cinema 1 (tracked in update)
    this._cinema1BgmPlayed = false;
    // 9 romance mobs (4 male, 5 female) inside Cinema 1
    // Place on aisle positions (odd tiles to avoid seat collision)
    var genders = ["m","m","m","m","m","f","f","f","f","f","f"];
    var positions = [
      {x:17,y:8},{x:18,y:8},{x:17,y:12},{x:18,y:12},
      {x:17,y:16},{x:9,y:8},{x:12,y:12},{x:23,y:8},{x:26,y:12},
      {x:9,y:12},{x:23,y:16}
    ];
    for (var i = 0; i < 11; i++) {
      var mob = new RomanceMob(game, { x:positions[i].x*16, y:positions[i].y*16, gender:genders[i] });
      game.addEntity(mob);
      self._cinema1Mobs.push(mob);
    }
  }

  _openDoor(cinema) {
    var game = this.game;
    var door = this._doors[cinema];
    if (!door) return;
    // Open door tiles - modify tileMap.collision directly (not .data)
    for (var dx = 0; dx < 3; dx++) {
      var tx = door.x + dx, ty = door.y;
      if (game.tileMap && game.tileMap.collision && game.tileMap.collision[ty]) {
        game.tileMap.collision[ty][tx] = 0;
      }
      if (game.tileMap && game.tileMap.ground && game.tileMap.ground[ty]) {
        game.tileMap.ground[ty][tx] = 12;
      }
    }
    if (game.sound && game.sound.playDoorCreak) game.sound.playDoorCreak();
    game.camera.shake(3, 0.3);
  }

  _spawnCinema2() {
    var game = this.game, self = this;
    this._cinema2Open = true;
    this._openDoor("c2");
    game.hud.addChatMessage("Cinema 2 OPEN! War movie screening!", "#f80");
    // BGM changes when player enters cinema 2 (tracked in update)
    this._cinema2BgmPlayed = false;
    // 12 soldiers - center aisle (x=53-54) and between seat rows (y=8,12,16)
    var positions = [
      {x:53,y:8},{x:54,y:8},{x:53,y:12},{x:54,y:12},{x:53,y:16},
      {x:54,y:16},{x:44,y:8},{x:47,y:12},{x:58,y:8},{x:61,y:12},
      {x:44,y:16},{x:61,y:8}
    ];
    for (var i = 0; i < 12; i++) {
      var mob = new WarSoldier(game, { x:positions[i].x*16, y:positions[i].y*16 });
      game.addEntity(mob);
      self._cinema2Mobs.push(mob);
    }
  }

  _spawnCinema3() {
    var game = this.game, self = this;
    this._cinema3Open = true;
    this._openDoor("c3");
    game.hud.addChatMessage("Cinema 3 OPEN! Zombie movie screening...", "#7a7");
    // 12 zombie viewers - placed on aisle positions
    var positions = [
      {x:17,y:42},{x:18,y:42},{x:17,y:46},{x:18,y:46},{x:17,y:50},
      {x:18,y:50},{x:9,y:42},{x:12,y:46},{x:23,y:42},{x:26,y:46},
      {x:9,y:50},{x:26,y:42}
    ];
    for (var i = 0; i < 12; i++) {
      var mob = new ZombieViewer(game, { x:positions[i].x*16, y:positions[i].y*16, delay:4+Math.random()*0.5 });
      game.addEntity(mob);
      self._cinema3Mobs.push(mob);
    }
  }

  _initCinema4Dialogue() {
    var game = this.game, self = this;
    this._cinema4Open = true;
    this._openDoor("c4");
    if (game.sound && game.sound.playDoorCreak) game.sound.playDoorCreak();
    game.hud.addChatMessage("Cinema 4 door CREAKS open...", "#f0f");
  }

  _startCinema4Dialogue() {
    var game = this.game, self = this;
    game.startDialogue([
      { speaker:"Miss Kumarwitch", text:"To get to Ryde Public School, you must defeat ALL of us." },
      { speaker:"Miss Kumarwitch", text:"If you lose, you'll NEVER graduate!!!" },
      { speaker:"Miss Kumarwitch", text:"You can't beat us - we're annoyingly SMART!!!" },
      { speaker:"Miss Kumarwitch", text:"*mumbles math formulas*" },
      { speaker:"Alice", text:"Fine. Let me show you how annoyingly DUMB you all are." },
      { speaker:"Alice", text:"Try to catch me~~~~!!!" }
    ], function() {
      // Kids scream
      if (game.sound && game.sound.playKidsScream) game.sound.playKidsScream();
      // Start RUN!!! sequence (keep state "playing" so stage update runs the timer)
      self._runSequenceActive = true;
      self._runSequenceTimer = 0;
      self._runTextSize = 10;
    });
  }

  _spawnCinema4Monsters() {
    var game = this.game, self = this;
    var names = ["Ethan","Sophia","Liam","Olivia","Noah","Emma","Jack","Mia","Leo","Chloe","Aiden","Zoe"];
    // Aisle-safe positions: center aisle x=53-54, between seat rows y=41-43,45-47,49-51
    var positions = [
      {x:43,y:41},{x:46,y:43},{x:49,y:41},{x:53,y:42},{x:54,y:42},
      {x:58,y:41},{x:61,y:43},{x:64,y:41},{x:53,y:49},{x:54,y:49},
      {x:46,y:49},{x:61,y:49}
    ];
    for (var i = 0; i < 12; i++) {
      var mob = new MathMonster(game, { x:positions[i].x*16, y:positions[i].y*16, name:names[i] });
      game.addEntity(mob);
      self._cinema4Mobs.push(mob);
    }
    // Open ALL doors for chase
    this._openDoor("c1"); this._openDoor("c2"); this._openDoor("c3");
    game.hud.addChatMessage("HINT: Find the Magic Sword in Cinema 1!", "#ff0");
    game.hud.addChatMessage("Dodge the monsters! They're FAST but clumsy!", "#88bbff");
  }

  _spawnSword() {
    var game = this.game;
    // Spawn sword in Cinema 1 center
    var sword = new MagicSword(game, { x:18*16, y:12*16 });
    game.addEntity(sword);
    this._swordSpawned = true;
  }

  _triggerBoss() {
    var game = this.game, self = this;
    game.hud.addChatMessage("All students defeated! Return to Cinema 4!", "#50c878");
    game.hud.addChatMessage(">> Miss Kumarwitch awaits in Cinema 4! >>", "#f0f");
  }

  _startBossDialogue() {
    var game = this.game, self = this;
    this._bossDialogueDone = true;
    game.startDialogue([
      { speaker:"Miss Kumarwitch", text:"I was supposed to win. That's literally the vibe." },
      { speaker:"Miss Kumarwitch", text:"Excuse me?! I had, like, three more dramatic speeches ready!" },
      { speaker:"Miss Kumarwitch", text:"Now I'll show you how this is REALLY done. Prepare for my JUDGMENT!" }
    ], function() {
      // Spawn boss
      var boss = new MissKumarwitch(game, {
        x:54*16, y:46*16
      });
      boss.aggroed = true;
      self._boss = boss;
      self._bossVictoryStarted = false;
      game.addEntity(boss);
      game.hud.setBoss(boss, "Miss Kumarwitch");
      if (game.sound && game.sound.playBGM) game.sound.playBGM("boss_kumarwitch");
      game.hud.addChatMessage("FINAL BATTLE! Miss Kumarwitch is GROWING!", "#f44");
    });
  }

  _showVictory() {
    var game = this.game, self = this;
    if (game.sound) game.sound.stopBGM();
    game.camera.shake(12, 1.0);
    if (game.sound && game.sound.playVictoryFanfare) game.sound.playVictoryFanfare();
    setTimeout(function() {
      game.startDialogue([
        { speaker:"Miss Kumarwitch", text:"I'll be waiting at Ryde Public School... This isn't over!" },
        { speaker:"Alice", text:"Bring it on. I've got a MAGIC SWORD now!" },
        { speaker:"System", text:"Stage 2 - 3F COMPLETE! Event Cinema conquered!" },
        { speaker:"System", text:"Next: Stage 3 - Ryde Public School!" }
      ], function() {
        game.hud.addChatMessage("STAGE 2 COMPLETE! Heading to Ryde Public School!", "#50c878");
        if(game.transition)game.transition.startFade(function(){if(self._onComplete)self._onComplete("complete")});
        else if(self._onComplete)self._onComplete("complete");
      });
    }, 1000);
  }

  update(dt) {
    if (!this.game) return;
    this._age += dt;

    // RUN!!! sequence overlay
    if (this._runSequenceActive) {
      this._runSequenceTimer += dt;
      this._runTextSize += (480 / 2) * dt; // grow to fill screen in 2 sec
      if (this._runSequenceTimer >= 2.0) {
        this._runSequenceActive = false;
        this.game.state = "playing";
        this._spawnCinema4Monsters();
        this._spawnSword();
        if (this.game.sound && this.game.sound.playBGM) this.game.sound.playBGM("boss_kumarwitch");
      }
      return;
    }

    // Cinema 1: play BGM and aggro mobs when player enters
    var p = this.game.localPlayer;
    if (p && !this._cinema1BgmPlayed && p.y < 25*16 && p.x < 35*16) {
      this._cinema1BgmPlayed = true;
      if (this.game.sound && this.game.sound.playBGM) this.game.sound.playBGM("romance_cinema");
      // Aggro all cinema 1 mobs
      for (var i=0; i<this._cinema1Mobs.length; i++) {
        if (this._cinema1Mobs[i].alive) this._cinema1Mobs[i].aggroed = true;
      }
      this.game.hud.addChatMessage("The couples spot you... ATTACK!", "#f69");
    }

    // Cinema 2: play BGM and aggro soldiers when player enters
    if (p && this._cinema2Open && !this._cinema2BgmPlayed && p.y < 25*16 && p.x > 36*16) {
      this._cinema2BgmPlayed = true;
      if (this.game.sound && this.game.sound.playBGM) this.game.sound.playBGM("war_cinema");
      // Aggro all cinema 2 soldiers
      for (var i=0; i<this._cinema2Mobs.length; i++) {
        if (this._cinema2Mobs[i].alive) this._cinema2Mobs[i].aggroed = true;
      }
      this.game.hud.addChatMessage("Soldiers spotted! FIRE!", "#f80");
      this.game.camera.shake(4, 0.3);
    }

    // Check Cinema 1 cleared
    if (!this._cinema1Clear) {
      var alive1 = 0;
      for (var i=0; i<this._cinema1Mobs.length; i++) if (this._cinema1Mobs[i].alive) alive1++;
      if (alive1 === 0 && this._cinema1Mobs.length > 0) {
        this._cinema1Clear = true;
        this.game.hud.addChatMessage("Cinema 1 CLEARED! Romance defeated!", "#50c878");
        this._spawnCinema2();
      }
    }

    // Check Cinema 2 cleared
    if (!this._cinema2Clear && this._cinema2Open) {
      var alive2 = 0;
      for (var i=0; i<this._cinema2Mobs.length; i++) if (this._cinema2Mobs[i].alive) alive2++;
      if (alive2 === 0 && this._cinema2Mobs.length > 0) {
        this._cinema2Clear = true;
        this.game.hud.addChatMessage("Cinema 2 CLEARED! War is over!", "#50c878");
        this._spawnCinema3();
      }
      // Bomb drops during Cinema 2
      if (!this._cinema2Clear && alive2 > 0) {
        this._bombTimer -= dt;
        if (this._bombTimer <= 0) {
          this._bombTimer = 4 + Math.random()*3;
          var bx = (39 + Math.random()*28)*16;
          var by = (6 + Math.random()*16)*16;
          this.game.addEntity(new FallingBomb(this.game, { x:bx, y:by }));
        }
      }
    }

    // Cinema 3: activate zombies and play BGM when player enters
    if (p && this._cinema3Open && !this._cinema3Entered && p.y > 35*16 && p.x < 35*16) {
      this._cinema3Entered = true;
      if (this.game.sound && this.game.sound.playBGM) this.game.sound.playBGM("horror_cinema");
      // Signal all zombies that player entered
      for (var i=0; i<this._cinema3Mobs.length; i++) {
        if (this._cinema3Mobs[i].alive) this._cinema3Mobs[i]._playerEntered = true;
      }
      // Horror scream after delay
      var game = this.game;
      setTimeout(function() {
        if (game.sound && game.sound.playHorrorScream) game.sound.playHorrorScream();
        game.camera.shake(8, 0.5);
        game.hud.addChatMessage("*AAAAHHH!!!* The viewers are TRANSFORMING!", "#f44");
      }, 3500);
    }

    // Check Cinema 3 cleared
    if (!this._cinema3Clear && this._cinema3Open) {
      var alive3 = 0;
      for (var i=0; i<this._cinema3Mobs.length; i++) if (this._cinema3Mobs[i].alive) alive3++;
      if (alive3 === 0 && this._cinema3Mobs.length > 0) {
        this._cinema3Clear = true;
        this.game.hud.addChatMessage("Cinema 3 CLEARED! Zombies re-dead!", "#50c878");
        this._initCinema4Dialogue();
      }
    }

    // Cinema 4: play BGM when player enters (relaxed bounds to catch door area)
    if (p && this._cinema4Open && !this._cinema4Entered && p.y >= 34*16 && p.x > 36*16) {
      this._cinema4Entered = true;
      if (this.game.sound && this.game.sound.playBGM) this.game.sound.playBGM("anthem_australia");
    }

    // Cinema 4: detect player approaching Miss Kumarwitch area for dialogue
    if (this._cinema4Open && !this._runSequenceActive && this._cinema4Mobs.length === 0 && !this._bossTriggered) {
      if (p && p.x > 50*16 && p.y > 44*16 && p.y < 52*16) {
        this._startCinema4Dialogue();
      }
    }

    // Check all math monsters killed
    if (this._cinema4Mobs.length > 0 && !this._allStudentsKilled) {
      var alive4 = 0;
      for (var i=0; i<this._cinema4Mobs.length; i++) if (this._cinema4Mobs[i].alive) alive4++;
      if (alive4 === 0) {
        this._allStudentsKilled = true;
        this._triggerBoss();
      }
    }

    // Boss flee complete → farewell dialogue → victory dialogue → Stage 3
    if (this._boss && this._boss._fleeComplete && !this._bossVictoryStarted) {
      this._bossVictoryStarted = true;
      var game = this.game, self = this, boss = this._boss;
      // Step 1: Farewell dialogue (game pauses in dialogue mode)
      game.startDialogue([
        { speaker:"Miss Kumarwitch", text:"Okay okay FINE you win!! But like... that was literally SO unfair." },
        { speaker:"Miss Kumarwitch", text:"You only won because I forgot to charge my magic wand last night." },
        { speaker:"Miss Kumarwitch", text:"Also my horoscope said 'avoid conflict today' and I DIDN'T LISTEN." },
        { speaker:"Miss Kumarwitch", text:"Tell anyone I ran and I'll give you TRIPLE homework at Ryde Public School!!!" },
        { speaker:"Miss Kumarwitch", text:"BYEEE! *trips over cape* ...I MEANT TO DO THAT!" },
        { speaker:"Alice", text:"...Did she just trip over her own cape? Iconic." }
      ], function() {
        // Step 2: Remove boss, play victory effects
        boss.alive = false;
        boss.destroy();
        game.hud.clearBoss();
        if (game.sound) game.sound.stopBGM();
        game.camera.shake(12, 1.0);
        if (game.sound && game.sound.playVictoryFanfare) game.sound.playVictoryFanfare();
        // Step 3: Victory dialogue after 1 second
        setTimeout(function() {
          game.startDialogue([
            { speaker:"Miss Kumarwitch", text:"I'll be waiting at Ryde Public School... This isn't over!" },
            { speaker:"Alice", text:"Bring it on. I've got a MAGIC SWORD now!" },
            { speaker:"System", text:"Stage 2 - 3F COMPLETE! Event Cinema conquered!" },
            { speaker:"System", text:"Next: Stage 3 - Ryde Public School!" }
          ], function() {
            // Step 4: Transition to Stage 3
            game.hud.addChatMessage("STAGE 2 COMPLETE! Heading to Ryde Public School!", "#50c878");
            if (game.transition) {
              game.transition.startFade(function() {
                if (self._onComplete) self._onComplete("complete");
              }, function(){});
            } else {
              if (self._onComplete) self._onComplete("complete");
            }
          });
        }, 1000);
      });
    }

    // Boss dialogue trigger
    if (this._allStudentsKilled && !this._bossDialogueDone && !this._bossTriggered) {
      var p = this.game.localPlayer;
      if (p && p.x > 48*16 && p.y > 40*16 && p.x < 68*16 && p.y < 56*16) {
        this._bossTriggered = true;
        this._startBossDialogue();
      }
    }
  }

  render(ctx, camera) {
    if (!this.game) return;

    // Cinema screen glow effects
    var screens = [
      { x:4, y:3, w:28, color: this._cinema1Clear ? "rgba(100,100,100,0.3)" : "rgba(255,150,200,0.3)" },
      { x:39, y:3, w:28, color: this._cinema2Clear ? "rgba(100,100,100,0.3)" : "rgba(200,150,50,0.3)" },
      { x:4, y:37, w:28, color: this._cinema3Clear ? "rgba(100,100,100,0.3)" : "rgba(50,150,50,0.3)" },
      { x:39, y:37, w:28, color: this._cinema4Open ? "rgba(160,100,255,0.3)" : "rgba(50,50,50,0.3)" }
    ];
    for (var si = 0; si < screens.length; si++) {
      var scr = screens[si];
      var ssp = camera.worldToScreen(scr.x*16, scr.y*16);
      // Screen flickering
      var flicker = 0.5 + Math.sin(this._age*8+si*2)*0.2 + Math.random()*0.1;
      ctx.fillStyle = scr.color;
      ctx.globalAlpha = flicker;
      ctx.fillRect(ssp.x, ssp.y, scr.w*16, 16);
      ctx.globalAlpha = 1;
    }

    // Screen labels (bold, black on light badge for readability)
    var labels = ["CINEMA 1: Romance", "CINEMA 2: War", "CINEMA 3: Zombie", "CINEMA 4: OC Class"];
    var labelPos = [{x:18,y:2},{x:53,y:2},{x:18,y:55},{x:53,y:55}];
    ctx.font = "bold 9px Courier New"; ctx.textAlign = "center";
    for (var li = 0; li < 4; li++) {
      var lsp = camera.worldToScreen(labelPos[li].x*16, labelPos[li].y*16);
      var tw = ctx.measureText(labels[li]).width;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(lsp.x - tw/2 - 4, lsp.y - 10, tw + 8, 14);
      ctx.fillStyle = "#000";
      ctx.fillText(labels[li], lsp.x, lsp.y);
    }

    // Lobby "EVENT CINEMA" sign
    var lobbySign = camera.worldToScreen(30*16, 27*16);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(lobbySign.x, lobbySign.y, 12*16, 16);
    ctx.fillStyle = "#fa0"; ctx.font = "bold 10px Courier New"; ctx.textAlign = "center";
    ctx.fillText("EVENT CINEMA", lobbySign.x+6*16, lobbySign.y+12);

    // Door status indicators
    var doorStatus = [
      { pos:this._doors.c1, open:true, label:"CINEMA 1" },
      { pos:this._doors.c2, open:this._cinema2Open, label:"CINEMA 2" },
      { pos:this._doors.c3, open:this._cinema3Open, label:"CINEMA 3" },
      { pos:this._doors.c4, open:this._cinema4Open, label:"CINEMA 4" }
    ];
    for (var di = 0; di < doorStatus.length; di++) {
      var ds = doorStatus[di];
      if (!ds.pos) continue;
      var dsp = camera.worldToScreen(ds.pos.x*16, ds.pos.y*16);
      if (!ds.open) {
        // Closed door
        ctx.fillStyle = "#654";
        ctx.fillRect(dsp.x, dsp.y, 48, 16);
        ctx.fillStyle = "#432";
        ctx.fillRect(dsp.x+2, dsp.y+2, 20, 12);
        ctx.fillRect(dsp.x+26, dsp.y+2, 20, 12);
        ctx.fillStyle = "#fa0"; ctx.fillRect(dsp.x+20, dsp.y+6, 8, 4); // lock
        ctx.fillStyle = "#f44"; ctx.font = "6px Courier New"; ctx.textAlign = "center";
        ctx.fillText("LOCKED", dsp.x+24, dsp.y-2);
      } else {
        // Open door
        ctx.fillStyle = "#654";
        ctx.fillRect(dsp.x-2, dsp.y, 4, 16);
        ctx.fillRect(dsp.x+46, dsp.y, 4, 16);
        ctx.fillStyle = "#50c878"; ctx.font = "6px Courier New"; ctx.textAlign = "center";
        ctx.fillText("OPEN", dsp.x+24, dsp.y-2);
      }
    }

    // Cinema seat rendering (match collision layout: every 4 rows, every 3 cols, center aisle)
    var seatRenderAreas = [
      { sx:4, sy:6, ex:32, ey:20, aisleX1:16, aisleX2:19 },
      { sx:39, sy:6, ex:68, ey:20, aisleX1:52, aisleX2:55 },
      { sx:4, sy:40, ex:32, ey:54, aisleX1:16, aisleX2:19 },
      { sx:39, sy:40, ex:68, ey:54, aisleX1:52, aisleX2:55 }
    ];
    for (var ci = 0; ci < seatRenderAreas.length; ci++) {
      var ca = seatRenderAreas[ci];
      for (var sy = ca.sy; sy <= ca.ey; sy += 4) {
        for (var sx = ca.sx; sx <= ca.ex; sx += 3) {
          if (sx >= ca.aisleX1 && sx <= ca.aisleX2) continue;
          var seatSp = camera.worldToScreen(sx*16, sy*16);
          if (seatSp.x > -16 && seatSp.x < 496 && seatSp.y > -16 && seatSp.y < 336) {
            ctx.fillStyle = "#633";
            ctx.fillRect(seatSp.x+2, seatSp.y, 12, 6);
            ctx.fillStyle = "#844";
            ctx.fillRect(seatSp.x+1, seatSp.y+6, 14, 8);
            ctx.fillStyle = "#555";
            ctx.fillRect(seatSp.x, seatSp.y+4, 2, 10);
            ctx.fillRect(seatSp.x+14, seatSp.y+4, 2, 10);
          }
        }
      }
    }

    // Clear status UI
    ctx.fillStyle = "#fff"; ctx.font = "8px Courier New"; ctx.textAlign = "left";
    var status = "C1:" + (this._cinema1Clear?"OK":"...") +
                 " C2:" + (this._cinema2Clear?"OK":(this._cinema2Open?"...":"\uD83D\uDD12")) +
                 " C3:" + (this._cinema3Clear?"OK":(this._cinema3Open?"...":"\uD83D\uDD12")) +
                 " C4:" + (this._cinema4Clear?"OK":(this._cinema4Open?"...":"\uD83D\uDD12"));
    ctx.fillText(status, 8, 310);

    // RUN!!! overlay
    if (this._runSequenceActive) {
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillRect(0, 0, 480, 320);
      var size = Math.min(this._runTextSize, 120);
      var shake = Math.sin(this._age*30)*3;
      var blink = Math.sin(this._age*15) > 0;
      if (blink) {
        ctx.fillStyle = "#f00";
        ctx.font = "bold " + Math.floor(size) + "px Courier New";
        ctx.textAlign = "center";
        ctx.fillText("RUN!!!", 240+shake, 160+size*0.3+Math.cos(this._age*25)*2);
      }
    }

    // Sword indicator arrow if sword exists and player doesn't have it
    if (this._swordSpawned && this.game.localPlayer && !this.game.localPlayer._hasSword) {
      var p = this.game.localPlayer;
      var swordX = 18*16, swordY = 12*16;
      var dx = swordX - p.x, dy = swordY - p.y;
      var a = Math.atan2(dy, dx);
      ctx.save();
      ctx.translate(240, 30);
      ctx.rotate(a);
      ctx.fillStyle = "#ff0";
      ctx.beginPath(); ctx.moveTo(15,0); ctx.lineTo(-5,-5); ctx.lineTo(-5,5); ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#ff0"; ctx.font = "7px Courier New"; ctx.textAlign = "center";
      ctx.fillText("SWORD \u2192 Cinema 1", 240, 18);
    }

    // Sword swing effect when player has sword and attacking
    if (this.game.localPlayer && this.game.localPlayer._hasSword && this.game.localPlayer.attacking) {
      var p = this.game.localPlayer;
      var psp = camera.worldToScreen(p.x, p.y);
      var cx = psp.x+16, cy = psp.y+16;
      // Sword arc based on direction
      ctx.save();
      ctx.translate(cx, cy);
      var angle = 0;
      if (p.direction==="right") angle = 0;
      else if (p.direction==="down") angle = Math.PI/2;
      else if (p.direction==="left") angle = Math.PI;
      else angle = -Math.PI/2;
      ctx.rotate(angle);
      // Sword blade
      ctx.fillStyle = "#ddf";
      ctx.fillRect(10, -2, 22, 4);
      ctx.fillStyle = "#fff";
      ctx.fillRect(12, -1, 18, 2);
      // Arc slash effect
      ctx.strokeStyle = "rgba(255,255,200,0.6)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 28, -0.6, 0.6); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,100,0.4)";
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, 24, -0.4, 0.4); ctx.stroke();
      // Crossguard
      ctx.fillStyle = "#fa0";
      ctx.fillRect(8, -4, 4, 8);
      ctx.restore();
      // Play sword sound
      if (this.game.sound && this.game.sound.playSwordSwing && !this._lastSwingFrame) {
        this.game.sound.playSwordSwing();
      }
      this._lastSwingFrame = true;
    } else {
      this._lastSwingFrame = false;
    }

    // Sword on player back (when has sword, not attacking)
    if (this.game.localPlayer && this.game.localPlayer._hasSword && !this.game.localPlayer.attacking) {
      var p = this.game.localPlayer;
      var psp = camera.worldToScreen(p.x, p.y);
      // Small sword on back
      ctx.fillStyle = "#aac";
      ctx.fillRect(psp.x+22, psp.y+4, 3, 16);
      ctx.fillStyle = "#fa0";
      ctx.fillRect(psp.x+20, psp.y+18, 7, 2);
      ctx.fillStyle = "#840";
      ctx.fillRect(psp.x+22, psp.y+20, 3, 5);
    }
  }
}
