/* ================================================================
   Stage 2 - 1F: Game Zone Arcade (Top-View)
   Australian Timezone-style arcade. Neon lights, carpet floor.
   7 arcade machines (destroyable) + KFC Colonel King Boss.
   Boss appears only after ALL 7 machines are destroyed.

   Machines (proximity-triggered, destroyable):
     1. Racing Game  → cars burst out, drops health pill on car kill
     2. Shooting Game → bullets + grenades
     3. Drum Rhythm  → zombie drummers transform
     4. Bowling Alley → balls + pins, drops health pill on ball kill
     5. Claw Machine  → 5 funny dolls come alive
     6. Whack-a-Mole  → moles pop up from ground
     7. Pump Dance    → hip-hop dancer transforms, drops health pill

   King Boss: KFC Colonel Harland Sanders King Demon
     (only after all 7 machines destroyed)
     100-70%  Throws potato chips (creepy laugh)
      70-50%  Throws drumsticks (atk up)
      50-25%  Hot fried chicken form (chicken scream)
      <25%    5 Zinger Burgers (KFC jingle, def up)
        0%    Melts to ice cream → "Chicken is always right" → elevator to 2F
   ================================================================ */

/* ========== HEALTH PILL DROP ========== */
class HealthPill extends Entity {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y, width: 10, height: 10,
      speed: 0, color: "#50c878", type: "item", tags: ["item"]
    });
    this._heal = cfg.heal || 20;
    this._age = 0;
    this._lifetime = 12;
    this.alive = true;
  }
  update(dt) {
    if (!this.alive) return;
    this._age += dt;
    if (this._age > this._lifetime) { this.alive = false; this.destroy(); return; }
    var p = this.game.localPlayer;
    if (!p) return;
    var dx = p.x - this.x, dy = p.y - this.y;
    if (Math.sqrt(dx*dx+dy*dy) < 18) {
      p.hp = Math.min(p.maxHp, p.hp + this._heal);
      this.game.hud.addChatMessage("Health +" + this._heal + "!", "#50c878");
      if (this.game.sound) { this.game.sound.playPickup(); this.game.sound.playPillPickup(); }
      this.alive = false; this.destroy();
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var pulse = 0.7 + Math.sin(this._age * 5) * 0.3;
    ctx.globalAlpha = pulse;
    // Capsule shape
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.ellipse(sp.x+5, sp.y+5, 5, 4, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#e44";
    ctx.beginPath(); ctx.ellipse(sp.x+5, sp.y+5, 5, 4, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "6px Courier New"; ctx.textAlign = "center";
    ctx.fillText("+", sp.x+5, sp.y+7);
    ctx.globalAlpha = 1;
  }
}

/* ========== ARCADE MACHINE (destroyable, extends Enemy) ========== */
class ArcadeMachine extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: cfg.w || 48, height: cfg.h || 40,
      speed: 0, color: cfg.color || "#444",
      enemyType: "machine",
      name: cfg.name || "Machine",
      hp: cfg.hp || 92,
      atk: 0, def: 7,
      contactDamage: 7,
      ai: "stationary",
      aggroRange: 0,
      expReward: 15
    });
    this.showHP = true;
    this._machineType = cfg.machineType || "generic";
    this._color = cfg.color || "#444";
    this._activated = false;
    this._triggerRange = cfg.triggerRange || 70;
    this._spawnTimer = 0;
    this._spawnInterval = cfg.spawnInterval || 2.5;
    this._onDestroy = cfg.onDestroy || null;
    this._onActivate = cfg.onActivate || null;
    this._age = 0;
    this._label = cfg.label || this.name;
  }
  update(dt) {
    if (!this.alive) return;
    this._age += dt;
    var p = this.game.localPlayer;
    if (!p) return;
    var dx = p.x+8 - (this.x+this.width/2), dy = p.y+8 - (this.y+this.height/2);
    var dist = Math.sqrt(dx*dx+dy*dy);

    // Proximity activation
    if (!this._activated && dist < this._triggerRange) {
      this._activated = true;
      if (this.game.sound) this.game.sound.playMachineActivate();
      if (this._onActivate) this._onActivate(this);
    }
    // Spawn hazards when active
    if (this._activated) {
      this._spawnTimer -= dt;
    }
  }
  takeDamage(amt, atk) {
    if (!this.alive) return;
    this.hp -= amt;
    if (atk) {
      var dx = this.x - atk.x, dy = this.y - atk.y, d = Math.sqrt(dx*dx+dy*dy) || 1;
      this.vx = (dx/d)*2; this.vy = (dy/d)*2;
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.game.camera.shake(4, 0.3);
      if (this.game.sound) this.game.sound.playMachineDestroy();
      if (this._onDestroy) this._onDestroy(this);
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x+this.width < 0 || sp.x > 480 || sp.y+this.height < 0 || sp.y > 320) return;
    // Custom pixel art
    this._renderBase(ctx, sp);
    // HP bar (always show)
    ctx.fillStyle = "#300";
    ctx.fillRect(sp.x, sp.y - 6, this.width, 3);
    ctx.fillStyle = this._activated ? "#e44" : "#888";
    ctx.fillRect(sp.x, sp.y - 6, this.width * (this.hp/this.maxHp), 3);
    // Label
    ctx.fillStyle = this._activated ? "#f0d060" : "#ccc";
    ctx.font = "7px Courier New"; ctx.textAlign = "center";
    ctx.fillText(this._label, sp.x + this.width/2, sp.y - 9);
  }
  _renderBase(ctx, sp) {
    ctx.fillStyle = this._color;
    ctx.fillRect(sp.x, sp.y, this.width, this.height);
  }
}

/* ========== 1. RACING GAME MACHINE ========== */
class RacingMachine extends ArcadeMachine {
  constructor(game, cfg) {
    super(game, Object.assign({
      name: "Racing Game", machineType: "racing", color: "#e84855",
      hp: 92, label: "RACING", spawnInterval: 3, triggerRange: 80
    }, cfg));
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this._activated) return;
    if (this._spawnTimer <= 0) {
      this._spawnTimer = this._spawnInterval + Math.random();
      if (this.game.sound) { this.game.sound.playEngineRev(); this.game.sound.playCarHorn(); }
      var p = this.game.localPlayer;
      if (p) {
        var a = Math.atan2(p.y-this.y-this.height/2, p.x-this.x-this.width/2);
        this.game.addEntity(new ArcadeCar(this.game, {
          x: this.x+this.width/2, y: this.y+this.height, dirX: Math.cos(a), dirY: Math.sin(a)
        }));
      }
    }
  }
  _renderBase(ctx, sp) {
    // Cabinet body
    ctx.fillStyle = "#333";
    ctx.fillRect(sp.x, sp.y, 48, 40);
    // Screen
    ctx.fillStyle = "#1a1a3a";
    ctx.fillRect(sp.x+4, sp.y+2, 40, 20);
    // Road on screen
    ctx.fillStyle = "#555";
    ctx.fillRect(sp.x+10, sp.y+8, 28, 12);
    ctx.fillStyle = "#ff0";
    for (var i=0;i<4;i++) ctx.fillRect(sp.x+14+i*7, sp.y+13, 3, 2);
    // Mini car on screen
    ctx.fillStyle = "#e84855";
    ctx.fillRect(sp.x+20, sp.y+10, 8, 6);
    // Steering wheel
    ctx.fillStyle = "#666";
    ctx.fillRect(sp.x+18, sp.y+26, 12, 10);
    ctx.fillStyle = "#222";
    ctx.beginPath(); ctx.arc(sp.x+24, sp.y+31, 5, 0, Math.PI*2); ctx.fill();
    // Seat
    ctx.fillStyle = "#e84855";
    ctx.fillRect(sp.x+16, sp.y+34, 16, 6);
    // Neon trim
    var glow = this._activated ? 0.5+Math.sin(this._age*4)*0.5 : 0.3;
    ctx.strokeStyle = "rgba(255,0,0,"+glow+")";
    ctx.lineWidth = 1;
    ctx.strokeRect(sp.x+1, sp.y+1, 46, 38);
  }
}

/* ========== 2. SHOOTING GAME MACHINE ========== */
class ShootingMachine extends ArcadeMachine {
  constructor(game, cfg) {
    super(game, Object.assign({
      name: "Shooting Game", machineType: "shooting", color: "#556b2f",
      hp: 92, label: "SHOOTER", spawnInterval: 2, triggerRange: 80
    }, cfg));
    this._grenadeChance = 0.25;
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this._activated) return;
    if (this._spawnTimer <= 0) {
      this._spawnTimer = this._spawnInterval + Math.random()*0.5;
      if (this.game.sound) this.game.sound.playGunshot();
      var p = this.game.localPlayer;
      if (p) {
        var a = Math.atan2(p.y-this.y-this.height/2, p.x-this.x-this.width/2);
        for (var i=-1;i<=1;i++) {
          this.game.addEntity(new ArcadeBullet(this.game, {
            x: this.x+this.width/2, y: this.y+this.height,
            dirX: Math.cos(a+i*0.2), dirY: Math.sin(a+i*0.2)
          }));
        }
        if (Math.random() < this._grenadeChance) {
          this.game.addEntity(new ArcadeGrenade(this.game, {
            x: this.x+this.width/2, y: this.y+this.height,
            dirX: Math.cos(a), dirY: Math.sin(a)
          }));
        }
      }
    }
  }
  _renderBase(ctx, sp) {
    // Cabinet
    ctx.fillStyle = "#2a3a2a";
    ctx.fillRect(sp.x, sp.y, 48, 40);
    // Screen
    ctx.fillStyle = "#1a2a1a";
    ctx.fillRect(sp.x+4, sp.y+2, 40, 22);
    // Crosshair on screen
    ctx.strokeStyle = "#0f0";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sp.x+24, sp.y+6); ctx.lineTo(sp.x+24, sp.y+20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sp.x+14, sp.y+13); ctx.lineTo(sp.x+34, sp.y+13); ctx.stroke();
    ctx.beginPath(); ctx.arc(sp.x+24, sp.y+13, 5, 0, Math.PI*2); ctx.stroke();
    // Gun controllers
    ctx.fillStyle = "#444";
    ctx.fillRect(sp.x+8, sp.y+28, 6, 12);
    ctx.fillRect(sp.x+34, sp.y+28, 6, 12);
    ctx.fillStyle = "#f80";
    ctx.fillRect(sp.x+8, sp.y+26, 6, 3);
    ctx.fillRect(sp.x+34, sp.y+26, 6, 3);
    // Neon
    var glow = this._activated ? 0.5+Math.sin(this._age*4)*0.5 : 0.3;
    ctx.strokeStyle = "rgba(0,255,0,"+glow+")";
    ctx.lineWidth = 1;
    ctx.strokeRect(sp.x+1, sp.y+1, 46, 38);
  }
}

/* ========== 3. DRUM RHYTHM MACHINE ========== */
class DrumRhythmMachine extends ArcadeMachine {
  constructor(game, cfg) {
    super(game, Object.assign({
      name: "Drum Rhythm", machineType: "drum", color: "#8b4513",
      hp: 92, label: "TAIKO DRUM", spawnInterval: 5, triggerRange: 70
    }, cfg));
    this._spawned = false;
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this._activated) return;
    if (!this._spawned) {
      this._spawned = true;
      if (this.game.sound) { this.game.sound.playScream(); this.game.sound.playTaikoHit(); this.game.sound.playZombieGroan(); }
      this.game.hud.addChatMessage("Drummers turned into ZOMBIES!", "#f44");
      this.game.camera.shake(3, 0.3);
      for (var i=0; i<3; i++) {
        this.game.addEntity(new ZombieDrummer(this.game, {
          x: this.x - 20 + i*30, y: this.y + this.height + 10
        }));
      }
    }
  }
  _renderBase(ctx, sp) {
    // Cabinet
    ctx.fillStyle = "#3a2010";
    ctx.fillRect(sp.x, sp.y, 48, 40);
    // Screen
    ctx.fillStyle = "#1a1020";
    ctx.fillRect(sp.x+4, sp.y+2, 40, 18);
    // Notes on screen
    ctx.fillStyle = "#f44";
    for (var i=0; i<5; i++) {
      ctx.beginPath();
      ctx.arc(sp.x+8+i*8, sp.y+8+Math.sin(this._age*3+i)*4, 3, 0, Math.PI*2);
      ctx.fill();
    }
    // Drum surface
    ctx.fillStyle = "#d4880a";
    ctx.beginPath(); ctx.ellipse(sp.x+24, sp.y+30, 16, 8, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#f0d060";
    ctx.beginPath(); ctx.ellipse(sp.x+24, sp.y+30, 10, 5, 0, 0, Math.PI*2); ctx.fill();
    // Drumsticks
    ctx.fillStyle = "#8b4513";
    ctx.save();
    ctx.translate(sp.x+12, sp.y+24);
    ctx.rotate(-0.4+Math.sin(this._age*6)*0.3);
    ctx.fillRect(0, 0, 2, 14);
    ctx.restore();
    ctx.save();
    ctx.translate(sp.x+36, sp.y+24);
    ctx.rotate(0.4-Math.sin(this._age*6)*0.3);
    ctx.fillRect(-2, 0, 2, 14);
    ctx.restore();
    // Neon
    var glow = this._activated ? 0.5+Math.sin(this._age*4)*0.5 : 0.3;
    ctx.strokeStyle = "rgba(255,100,0,"+glow+")";
    ctx.lineWidth = 1;
    ctx.strokeRect(sp.x+1, sp.y+1, 46, 38);
  }
}

/* ========== 4. BOWLING ALLEY MACHINE ========== */
class BowlingMachine extends ArcadeMachine {
  constructor(game, cfg) {
    super(game, Object.assign({
      name: "Bowling Alley", machineType: "bowling", color: "#4a90d9",
      hp: 104, label: "BOWLING", spawnInterval: 2.5, triggerRange: 80,
      w: 56, h: 44
    }, cfg));
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this._activated) return;
    if (this._spawnTimer <= 0) {
      this._spawnTimer = this._spawnInterval + Math.random();
      if (this.game.sound) { this.game.sound.playBowlingStrike(); this.game.sound.playPinScatter(); }
      var p = this.game.localPlayer;
      if (p) {
        var a = Math.atan2(p.y-this.y-this.height/2, p.x-this.x-this.width/2);
        this.game.addEntity(new BowlingBall(this.game, {
          x: this.x+this.width/2, y: this.y+this.height, dirX: Math.cos(a), dirY: Math.sin(a)
        }));
        for (var i=0; i<3; i++) {
          var pa = a + (Math.random()-0.5)*1.5;
          this.game.addEntity(new BowlingPin(this.game, {
            x: this.x+this.width/2, y: this.y+this.height,
            dirX: Math.cos(pa), dirY: Math.sin(pa)
          }));
        }
      }
    }
  }
  _renderBase(ctx, sp) {
    // Lane
    ctx.fillStyle = "#c8a060";
    ctx.fillRect(sp.x, sp.y, 56, 44);
    // Lane stripes
    ctx.fillStyle = "#b08848";
    for (var i=0; i<7; i++) ctx.fillRect(sp.x+4+i*8, sp.y, 2, 44);
    // Pin triangle at back
    ctx.fillStyle = "#fff";
    var pins = [[24,4],[20,8],[28,8],[16,12],[24,12],[32,12],[12,16],[20,16],[28,16],[36,16]];
    for (var i=0; i<pins.length; i++) {
      ctx.beginPath(); ctx.arc(sp.x+pins[i][0], sp.y+pins[i][1], 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle="#e44"; ctx.fillRect(sp.x+pins[i][0]-1, sp.y+pins[i][1], 2, 1); ctx.fillStyle="#fff";
    }
    // Ball return
    ctx.fillStyle = "#222";
    ctx.beginPath(); ctx.arc(sp.x+28, sp.y+36, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#1a1a4a";
    ctx.beginPath(); ctx.arc(sp.x+28, sp.y+36, 3, 0, Math.PI*2); ctx.fill();
    // Gutter
    ctx.fillStyle = "#888";
    ctx.fillRect(sp.x, sp.y, 3, 44);
    ctx.fillRect(sp.x+53, sp.y, 3, 44);
    // Neon
    var glow = this._activated ? 0.5+Math.sin(this._age*4)*0.5 : 0.3;
    ctx.strokeStyle = "rgba(74,144,217,"+glow+")";
    ctx.lineWidth = 1;
    ctx.strokeRect(sp.x, sp.y, 56, 44);
  }
}

/* ========== 5. CLAW MACHINE ========== */
class ClawMachineCabinet extends ArcadeMachine {
  constructor(game, cfg) {
    super(game, Object.assign({
      name: "Claw Machine", machineType: "claw", color: "#ff69b4",
      hp: 81, label: "UFO CATCHER", spawnInterval: 4, triggerRange: 65
    }, cfg));
    this._spawned = false;
    this._dollColors = ["#ff69b4","#50c878","#f0d060","#4a90d9","#e040e0"];
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this._activated) return;
    if (!this._spawned) {
      this._spawned = true;
      if (this.game.sound) { this.game.sound.playFrogCroak(); this.game.sound.playDollSqueak(); }
      this.game.hud.addChatMessage("Dolls are ALIVE! They're attacking!", "#ff69b4");
      for (var i=0; i<5; i++) {
        this.game.addEntity(new LivingDoll(this.game, {
          x: this.x + 8 + (i%3)*14, y: this.y + this.height + 5 + Math.floor(i/3)*14,
          dollColor: this._dollColors[i]
        }));
      }
    }
    // Respawn dolls if all dead
    if (this._spawned) {
      this._spawnTimer -= 0; // already decremented in super
      var dollCount = this.game.entities.filter(function(e){return e instanceof LivingDoll && e.alive}).length;
      if (dollCount === 0 && this._spawnTimer <= 0) {
        this._spawnTimer = 6;
        if (this.game.sound) this.game.sound.playFrogCroak();
        for (var i=0; i<3; i++) {
          this.game.addEntity(new LivingDoll(this.game, {
            x: this.x + 10 + i*14, y: this.y + this.height + 5,
            dollColor: this._dollColors[Math.floor(Math.random()*5)]
          }));
        }
      }
    }
  }
  _renderBase(ctx, sp) {
    // Glass case
    ctx.fillStyle = "#e8e8f0";
    ctx.globalAlpha = 0.4;
    ctx.fillRect(sp.x+2, sp.y+2, 44, 28);
    ctx.globalAlpha = 1;
    // Frame
    ctx.strokeStyle = "#ff69b4";
    ctx.lineWidth = 2;
    ctx.strokeRect(sp.x+1, sp.y+1, 46, 30);
    // Top banner
    ctx.fillStyle = "#ff69b4";
    ctx.fillRect(sp.x, sp.y-2, 48, 6);
    ctx.fillStyle = "#fff";
    ctx.font = "5px Courier New"; ctx.textAlign = "center";
    ctx.fillText("UFO CATCHER", sp.x+24, sp.y+3);
    // Claw arm
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sp.x+24, sp.y+4);
    ctx.lineTo(sp.x+24, sp.y+14);
    ctx.moveTo(sp.x+20, sp.y+14);
    ctx.lineTo(sp.x+24, sp.y+18);
    ctx.lineTo(sp.x+28, sp.y+14);
    ctx.stroke();
    // Mini dolls inside
    var dc = this._dollColors;
    for (var i=0; i<5; i++) {
      ctx.fillStyle = dc[i];
      ctx.fillRect(sp.x+6+i*8, sp.y+20, 6, 8);
      ctx.fillStyle = "#000";
      ctx.fillRect(sp.x+7+i*8, sp.y+22, 2, 1);
      ctx.fillRect(sp.x+10+i*8, sp.y+22, 2, 1);
    }
    // Base/coin slot
    ctx.fillStyle = "#444";
    ctx.fillRect(sp.x+4, sp.y+32, 40, 8);
    ctx.fillStyle = "#f0d060";
    ctx.fillRect(sp.x+20, sp.y+34, 8, 4);
    // Neon
    var glow = this._activated ? 0.5+Math.sin(this._age*4)*0.5 : 0.3;
    ctx.strokeStyle = "rgba(255,105,180,"+glow+")";
    ctx.lineWidth = 1;
    ctx.strokeRect(sp.x, sp.y, 48, 40);
  }
}

/* ========== 6. WHACK-A-MOLE MACHINE ========== */
class WhackAMoleMachine extends ArcadeMachine {
  constructor(game, cfg) {
    super(game, Object.assign({
      name: "Whack-a-Mole", machineType: "mole", color: "#8b6914",
      hp: 86, label: "WHACK-A-MOLE", spawnInterval: 4, triggerRange: 70
    }, cfg));
    this._spawned = false;
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this._activated) return;
    if (!this._spawned) {
      this._spawned = true;
      if (this.game.sound) this.game.sound.playMoleDigSfx();
      this.game.hud.addChatMessage("Moles escaping from the machine!", "#8b6914");
      for (var i=0; i<3; i++) {
        this.game.addEntity(new ArcadeMole(this.game, {
          x: this.x + 10 + i*14, y: this.y + this.height + 10
        }));
      }
    }
    // Respawn
    var moleCount = this.game.entities.filter(function(e){return e instanceof ArcadeMole && e.alive}).length;
    if (moleCount === 0 && this._spawnTimer <= 0) {
      this._spawnTimer = 5;
      this.game.addEntity(new ArcadeMole(this.game, {
        x: this.x + 20, y: this.y + this.height + 10
      }));
    }
  }
  _renderBase(ctx, sp) {
    // Table surface
    ctx.fillStyle = "#2a6a2a";
    ctx.fillRect(sp.x, sp.y, 48, 40);
    // Mole holes (3x3 grid)
    ctx.fillStyle = "#1a3a1a";
    for (var hy=0; hy<3; hy++) {
      for (var hx=0; hx<3; hx++) {
        ctx.beginPath();
        ctx.ellipse(sp.x+10+hx*14, sp.y+10+hy*12, 5, 3, 0, 0, Math.PI*2);
        ctx.fill();
      }
    }
    // Mole popping up (animated)
    var holeIdx = Math.floor(this._age * 2) % 9;
    var mx = sp.x + 10 + (holeIdx%3)*14;
    var my = sp.y + 10 + Math.floor(holeIdx/3)*12;
    var pop = Math.sin(this._age*6) > 0 ? -4 : 0;
    ctx.fillStyle = "#8b6914";
    ctx.beginPath(); ctx.ellipse(mx, my+pop, 4, 3, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#000";
    ctx.fillRect(mx-2, my-2+pop, 1, 1);
    ctx.fillRect(mx+1, my-2+pop, 1, 1);
    // Hammer
    ctx.fillStyle = "#e84855";
    ctx.fillRect(sp.x+38, sp.y+2, 8, 6);
    ctx.fillStyle = "#8b4513";
    ctx.fillRect(sp.x+41, sp.y+8, 2, 10);
    // Border
    ctx.strokeStyle = "#f0d060";
    ctx.lineWidth = 2;
    ctx.strokeRect(sp.x+1, sp.y+1, 46, 38);
    // Neon
    var glow = this._activated ? 0.5+Math.sin(this._age*4)*0.5 : 0.3;
    ctx.strokeStyle = "rgba(255,200,0,"+glow+")";
    ctx.lineWidth = 1;
    ctx.strokeRect(sp.x, sp.y, 48, 40);
  }
}

/* ========== 7. PUMP DANCE MACHINE ========== */
class PumpDanceMachine extends ArcadeMachine {
  constructor(game, cfg) {
    super(game, Object.assign({
      name: "Pump It Up", machineType: "pump", color: "#e040e0",
      hp: 92, label: "PUMP IT UP", spawnInterval: 6, triggerRange: 70,
      w: 52, h: 44
    }, cfg));
    this._spawned = false;
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this._activated) return;
    if (!this._spawned) {
      this._spawned = true;
      if (this.game.sound) this.game.sound.playHipHopBeat();
      this.game.hud.addChatMessage("Dancer transforms and attacks!", "#e040e0");
      for (var i=0; i<2; i++) {
        this.game.addEntity(new HipHopDancer(this.game, {
          x: this.x + 10 + i*30, y: this.y + this.height + 10
        }));
      }
    }
    var dancerCount = this.game.entities.filter(function(e){return e instanceof HipHopDancer && e.alive}).length;
    if (dancerCount === 0 && this._spawnTimer <= 0) {
      this._spawnTimer = 7;
      this.game.addEntity(new HipHopDancer(this.game, {
        x: this.x + 20, y: this.y + this.height + 10
      }));
    }
  }
  _renderBase(ctx, sp) {
    // Cabinet (tall, two screens)
    ctx.fillStyle = "#1a1a2a";
    ctx.fillRect(sp.x, sp.y, 52, 24);
    // Two screens
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(sp.x+2, sp.y+2, 23, 18);
    ctx.fillRect(sp.x+27, sp.y+2, 23, 18);
    // Arrows on screens (5-panel diamond pattern)
    var arrows = [{dx:12,dy:6,c:"#e040e0"},{dx:8,dy:10,c:"#4a90d9"},
                  {dx:12,dy:10,c:"#f0d060"},{dx:16,dy:10,c:"#50c878"},{dx:12,dy:14,c:"#e84855"}];
    for (var s=0; s<2; s++) {
      var ox = sp.x + 2 + s*25;
      for (var i=0; i<arrows.length; i++) {
        var blink = Math.sin(this._age*8+i+s*2) > 0;
        ctx.fillStyle = blink ? arrows[i].c : "#333";
        ctx.beginPath();
        var ax=ox+arrows[i].dx, ay=sp.y+arrows[i].dy;
        ctx.moveTo(ax, ay-2); ctx.lineTo(ax+2, ay); ctx.lineTo(ax, ay+2); ctx.lineTo(ax-2, ay);
        ctx.fill();
      }
    }
    // Dance platform
    ctx.fillStyle = "#444";
    ctx.fillRect(sp.x+2, sp.y+24, 48, 18);
    // Arrow pads (5 per side)
    var padColors = ["#e040e0","#4a90d9","#f0d060","#50c878","#e84855"];
    for (var s=0; s<2; s++) {
      for (var i=0; i<5; i++) {
        var px = sp.x + 4 + s*24 + (i%3)*7;
        var py = sp.y + 26 + Math.floor(i/3)*7;
        var lit = Math.sin(this._age*6+i+s*3) > 0.3;
        ctx.fillStyle = lit ? padColors[i] : "#222";
        ctx.fillRect(px, py, 5, 5);
      }
    }
    // Safety bar
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sp.x+6, sp.y+42); ctx.lineTo(sp.x+6, sp.y+36);
    ctx.lineTo(sp.x+46, sp.y+36); ctx.lineTo(sp.x+46, sp.y+42);
    ctx.stroke();
    // Speakers
    ctx.fillStyle = "#333";
    ctx.fillRect(sp.x, sp.y+20, 8, 6);
    ctx.fillRect(sp.x+44, sp.y+20, 8, 6);
    ctx.fillStyle = "#555";
    ctx.beginPath(); ctx.arc(sp.x+4, sp.y+23, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(sp.x+48, sp.y+23, 2, 0, Math.PI*2); ctx.fill();
    // Neon
    var glow = this._activated ? 0.5+Math.sin(this._age*4)*0.5 : 0.3;
    ctx.strokeStyle = "rgba(224,64,224,"+glow+")";
    ctx.lineWidth = 1;
    ctx.strokeRect(sp.x, sp.y, 52, 44);
  }
}

/* ========== PROJECTILES (reused from before) ========== */

class ArcadeProjectile extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: cfg.w || 10, height: cfg.h || 10,
      speed: 0, color: cfg.color || "#fff",
      enemyType: cfg.enemyType || "projectile",
      name: cfg.name || "Projectile",
      hp: 1, atk: cfg.damage || 7, def: 0,
      contactDamage: cfg.damage || 7,
      ai: "stationary", aggroRange: 0, expReward: 0
    });
    this.damage = cfg.damage || 5;
    this.dirX = cfg.dirX || 0;
    this.dirY = cfg.dirY || 0;
    this.flySpeed = cfg.flySpeed || 120;
    this.lifetime = cfg.lifetime || 3;
    this.showHP = false;
    this._age = 0;
    this._color = cfg.color || "#fff";
    this._dropsPill = cfg.dropsPill || false;
  }
  update(dt) {
    if (!this.alive) return;
    this.x += this.dirX * this.flySpeed * dt;
    this.y += this.dirY * this.flySpeed * dt;
    this._age += dt;
    this.lifetime -= dt;
    if (this.lifetime <= 0 || this.x < -40 || this.x > 1200 || this.y < -40 || this.y > 900) {
      this.alive = false; this.destroy();
    }
  }
  takeDamage(amt, atk) {
    this.hp -= amt;
    if (this.hp <= 0) {
      this.alive = false;
      if (this._dropsPill) {
        this.game.addEntity(new HealthPill(this.game, { x: this.x, y: this.y, heal: 15 }));
      }
      this.destroy();
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -20 || sp.x > 500 || sp.y < -20 || sp.y > 340) return;
    ctx.fillStyle = this._color;
    ctx.fillRect(sp.x, sp.y, this.width, this.height);
  }
}

class ArcadeCar extends ArcadeProjectile {
  constructor(game, cfg) {
    super(game, Object.assign({ w: 20, h: 14, damage: 12, color: "#e84855", name: "Car", flySpeed: 140, lifetime: 4, dropsPill: true }, cfg));
    this._carColor = ["#e84855","#4a90d9","#f0d060","#50c878"][Math.floor(Math.random()*4)];
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -30 || sp.x > 510) return;
    ctx.fillStyle = this._carColor;
    ctx.fillRect(sp.x, sp.y+2, 20, 10);
    ctx.fillStyle = "#aaddff";
    ctx.fillRect(sp.x+4, sp.y+3, 5, 4);
    ctx.fillRect(sp.x+12, sp.y+3, 5, 4);
    ctx.fillStyle = "#333";
    ctx.fillRect(sp.x+2, sp.y+10, 5, 4);
    ctx.fillRect(sp.x+13, sp.y+10, 5, 4);
    ctx.fillStyle = "#ff0";
    ctx.fillRect(sp.x+(this.dirX > 0 ? 18 : 0), sp.y+4, 2, 3);
  }
}

class ArcadeBullet extends ArcadeProjectile {
  constructor(game, cfg) {
    super(game, Object.assign({ w: 4, h: 4, damage: 6, color: "#ff0", name: "Bullet", flySpeed: 200, lifetime: 2.5 }, cfg));
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    ctx.fillStyle = "#ff0";
    ctx.beginPath(); ctx.arc(sp.x+2, sp.y+2, 2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#fa0";
    ctx.beginPath(); ctx.arc(sp.x+2, sp.y+2, 1, 0, Math.PI*2); ctx.fill();
  }
}

class ArcadeGrenade extends ArcadeProjectile {
  constructor(game, cfg) {
    super(game, Object.assign({ w: 8, h: 8, damage: 15, color: "#4a4", name: "Grenade", flySpeed: 80, lifetime: 1.5 }, cfg));
    this._exploded = false;
  }
  update(dt) {
    if (!this.alive) return;
    this.x += this.dirX * this.flySpeed * dt;
    this.y += this.dirY * this.flySpeed * dt;
    this._age += dt;
    this.lifetime -= dt;
    if (this.lifetime <= 0 && !this._exploded) {
      this._exploded = true;
      if (this.game.sound) this.game.sound.playExplosion();
      this.game.camera.shake(4, 0.3);
      for (var i=0; i<6; i++) {
        var a = (Math.PI*2/6)*i;
        this.game.addEntity(new ArcadeProjectile(this.game, {
          x: this.x, y: this.y, dirX: Math.cos(a), dirY: Math.sin(a),
          damage: 8, color: "#f80", flySpeed: 100, lifetime: 0.8, w: 6, h: 6, name: "Shrapnel"
        }));
      }
      this.alive = false; this.destroy();
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    ctx.fillStyle = "#4a6a2a";
    ctx.fillRect(sp.x, sp.y, 8, 8);
    ctx.fillStyle = "#f80";
    ctx.fillRect(sp.x+3, sp.y-3, 2, 3);
  }
}

class BowlingBall extends ArcadeProjectile {
  constructor(game, cfg) {
    super(game, Object.assign({ w: 10, h: 10, damage: 10, color: "#222", name: "Ball", flySpeed: 110, lifetime: 3.5, dropsPill: true }, cfg));
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath(); ctx.arc(sp.x+5, sp.y+5, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#444";
    ctx.fillRect(sp.x+2, sp.y+2, 2, 2);
    ctx.fillRect(sp.x+5, sp.y+2, 2, 2);
    ctx.fillRect(sp.x+3, sp.y+5, 2, 2);
  }
}

class BowlingPin extends ArcadeProjectile {
  constructor(game, cfg) {
    super(game, Object.assign({ w: 6, h: 10, damage: 7, color: "#fff", name: "Pin", flySpeed: 140, lifetime: 2.5 }, cfg));
    this._spin = 0;
  }
  update(dt) { super.update(dt); this._spin += dt*8; }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    ctx.save();
    ctx.translate(sp.x+3, sp.y+5);
    ctx.rotate(this._spin);
    ctx.fillStyle = "#fff";
    ctx.fillRect(-3, -5, 6, 10);
    ctx.fillStyle = "#e44";
    ctx.fillRect(-3, -1, 6, 2);
    ctx.restore();
  }
}

/* ========== MOB ENTITIES ========== */

class LivingDoll extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y, width: 14, height: 14,
      speed: 1.2, color: "#50c878",
      enemyType: "doll", name: "Doll",
      hp: cfg.hp || 29, atk: cfg.atk || 11, def: 1,
      aggroRange: 150, ai: "chase", expReward: 5
    });
    this.aggroed = true; // Attack immediately on spawn
    this._sfxTimer = 2+Math.random()*3;
    this._dollColor = cfg.dollColor || ["#50c878","#ff69b4","#f0d060","#4a90d9","#e040e0"][Math.floor(Math.random()*5)];
    this._dollType = Math.floor(Math.random()*5);
    this._age = 0;
  }
  update(dt) {
    if (!this.alive) return;
    this._age += dt;
    super.update(dt);
    this._sfxTimer -= dt;
    if (this._sfxTimer <= 0) {
      this._sfxTimer = 3+Math.random()*4;
      if (this.game.sound) this.game.sound.playFrogCroak();
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var bob = Math.sin(this._age*5)*2;
    var t = this._dollType;
    // 5 funny doll designs
    if (t===0) { // Round blob
      ctx.fillStyle = this._dollColor;
      ctx.beginPath(); ctx.arc(sp.x+7, sp.y+7+bob, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle="#000"; ctx.fillRect(sp.x+3,sp.y+5+bob,3,3); ctx.fillRect(sp.x+9,sp.y+5+bob,3,3);
      ctx.fillStyle="#f44"; ctx.fillRect(sp.x+4,sp.y+10+bob,6,3);
    } else if (t===1) { // Star shape
      ctx.fillStyle = this._dollColor;
      ctx.fillRect(sp.x+2,sp.y+4+bob,10,6);
      ctx.fillRect(sp.x+5,sp.y+bob,4,14);
      ctx.fillStyle="#fff"; ctx.fillRect(sp.x+4,sp.y+5+bob,2,2); ctx.fillRect(sp.x+8,sp.y+5+bob,2,2);
    } else if (t===2) { // Long legs
      ctx.fillStyle = this._dollColor;
      ctx.fillRect(sp.x+3,sp.y+bob,8,6);
      ctx.fillStyle = this._dollColor;
      ctx.fillRect(sp.x+4,sp.y+6+bob,2,8);
      ctx.fillRect(sp.x+8,sp.y+6+bob,2,8);
      ctx.fillStyle="#000"; ctx.fillRect(sp.x+4,sp.y+2+bob,2,2); ctx.fillRect(sp.x+8,sp.y+2+bob,2,2);
    } else if (t===3) { // Big head
      ctx.fillStyle = this._dollColor;
      ctx.beginPath(); ctx.arc(sp.x+7,sp.y+5+bob,6,0,Math.PI*2); ctx.fill();
      ctx.fillRect(sp.x+5,sp.y+10+bob,4,4);
      ctx.fillStyle="#fff"; ctx.fillRect(sp.x+3,sp.y+3+bob,3,3); ctx.fillRect(sp.x+8,sp.y+3+bob,3,3);
      ctx.fillStyle="#000"; ctx.fillRect(sp.x+4,sp.y+4+bob,1,1); ctx.fillRect(sp.x+9,sp.y+4+bob,1,1);
    } else { // Tentacle
      ctx.fillStyle = this._dollColor;
      ctx.fillRect(sp.x+2,sp.y+bob,10,8);
      for (var i=0;i<4;i++) {
        var tx = sp.x+2+i*3;
        var tw = Math.sin(this._age*4+i)*3;
        ctx.fillRect(tx, sp.y+8+bob, 2, 6+tw);
      }
      ctx.fillStyle="#f00"; ctx.fillRect(sp.x+3,sp.y+2+bob,3,2); ctx.fillRect(sp.x+8,sp.y+2+bob,3,2);
    }
  }
}

class ArcadeMole extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y, width: 14, height: 14,
      speed: 1.5, color: "#8b6914",
      enemyType: "mole", name: "Mole",
      hp: cfg.hp || 35, atk: cfg.atk || 12, def: 2,
      aggroRange: 120, ai: "stationary", expReward: 6
    });
    this.aggroed = true;
    this._state = "underground"; this._timer = 0.5+Math.random()*0.5;
    this._originX = cfg.x; this._originY = cfg.y; this._visible = false;
  }
  update(dt) {
    super.update(dt); if (!this.alive) return;
    this._timer -= dt;
    if (this._state === "underground") {
      this._visible = false;
      if (this._timer <= 0) {
        this._state = "surfacing"; this._timer = 0.3;
        var p = this.game.localPlayer;
        if (p) { this.x = p.x+(Math.random()-0.5)*60; this.y = p.y+(Math.random()-0.5)*60; }
        if (this.game.sound) this.game.sound.playMoleDigSfx();
      }
    } else if (this._state === "surfacing") {
      this._visible = true;
      if (this._timer <= 0) { this._state = "attacking"; this._timer = 2+Math.random(); }
    } else if (this._state === "attacking") {
      this._visible = true;
      var p = this.game.localPlayer;
      if (p) {
        var dx = p.x-this.x, dy = p.y-this.y, dist = Math.sqrt(dx*dx+dy*dy);
        if (dist > 0 && dist < 120) {
          this.x += (dx/dist)*this.speed*60*dt;
          this.y += (dy/dist)*this.speed*60*dt;
        }
      }
      if (this._timer <= 0) {
        this._state = "underground"; this._timer = 1.5+Math.random()*2;
        this.x = this._originX+(Math.random()-0.5)*80;
        this.y = this._originY+(Math.random()-0.5)*80;
        if (this.game.sound) this.game.sound.playMoleDigSfx();
      }
    }
  }
  render(ctx, camera) {
    if (!this.alive || !this._visible) return;
    var sp = camera.worldToScreen(this.x, this.y);
    // Dirt mound
    ctx.fillStyle = "#6a4a14";
    ctx.beginPath(); ctx.ellipse(sp.x+7, sp.y+12, 8, 3, 0, 0, Math.PI*2); ctx.fill();
    // Body
    ctx.fillStyle = "#8b6914";
    ctx.beginPath(); ctx.ellipse(sp.x+7, sp.y+6, 6, 5, 0, 0, Math.PI*2); ctx.fill();
    // Face
    ctx.fillStyle = "#000";
    ctx.fillRect(sp.x+3, sp.y+4, 2, 2);
    ctx.fillRect(sp.x+9, sp.y+4, 2, 2);
    ctx.fillStyle = "#f4a0a0";
    ctx.fillRect(sp.x+5, sp.y+7, 4, 3);
    // Claws
    ctx.fillStyle = "#c8a040";
    ctx.fillRect(sp.x, sp.y+8, 3, 2);
    ctx.fillRect(sp.x+11, sp.y+8, 3, 2);
  }
}

class ZombieDrummer extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y, width: 16, height: 20,
      speed: 1.0, color: "#6a6",
      enemyType: "zombie_drummer", name: "Zombie Drummer",
      hp: cfg.hp || 40, atk: cfg.atk || 14, def: 4,
      aggroRange: 130, ai: "chase", expReward: 8
    });
    this._transformed = false; this._transformTimer = 0.5+Math.random()*0.5;
    this._swingTimer = 0;
  }
  update(dt) {
    if (!this.alive) return;
    if (!this._transformed) {
      this._transformTimer -= dt;
      if (this._transformTimer <= 0) { this._transformed = true; this.aggroed = true; }
    }
    super.update(dt);
    this._swingTimer += dt;
    var p = this.game.localPlayer; if (!p) return;
    var dx = p.x-this.x, dy = p.y-this.y, dist = Math.sqrt(dx*dx+dy*dy);
    if (dist > 0 && dist < 130) {
      this.x += (dx/dist)*this.speed*60*dt;
      this.y += (dy/dist)*this.speed*60*dt;
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (!this._transformed) {
      // Normal human
      ctx.fillStyle = "#ddb890"; ctx.fillRect(sp.x+2,sp.y,12,10);
      ctx.fillStyle = "#4a90d9"; ctx.fillRect(sp.x,sp.y+10,16,10);
      ctx.fillStyle = "#333";
      ctx.fillRect(sp.x+4,sp.y+3,3,2); ctx.fillRect(sp.x+9,sp.y+3,3,2);
      ctx.fillStyle = "#888"; ctx.fillRect(sp.x+14,sp.y+4,6,2);
      return;
    }
    // Zombie
    ctx.fillStyle = "#4a8a4a"; ctx.fillRect(sp.x,sp.y,16,20);
    ctx.fillStyle = "#2a5a2a"; ctx.fillRect(sp.x+2,sp.y+2,12,8);
    ctx.fillStyle = "#f44";
    ctx.fillRect(sp.x+3,sp.y+4,4,3); ctx.fillRect(sp.x+9,sp.y+4,4,3);
    ctx.fillStyle = "#300"; ctx.fillRect(sp.x+4,sp.y+14,8,3);
    // Drumstick weapon
    var swing = Math.sin(this._swingTimer*10)*8;
    ctx.fillStyle = "#8b4513"; ctx.fillRect(sp.x+14, sp.y+2+swing, 8, 3);
    ctx.fillStyle = "#d4a040"; ctx.fillRect(sp.x+20, sp.y+1+swing, 4, 5);
  }
}

class HipHopDancer extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y, width: 16, height: 20,
      speed: 1.8, color: "#f0d060",
      enemyType: "hiphop_dancer", name: "Hip-Hop Dancer",
      hp: cfg.hp || 46, atk: cfg.atk || 16, def: 2,
      aggroRange: 140, ai: "chase", expReward: 10
    });
    this._transformed = false; this._transformTimer = 0.5+Math.random()*0.5;
    this._danceTimer = 0; this._beatTimer = 0;
    this._dropsPill = true;
  }
  update(dt) {
    if (!this.alive) return;
    if (!this._transformed) {
      this._transformTimer -= dt;
      if (this._transformTimer <= 0) {
        this._transformed = true;
        this.aggroed = true;
        if (this.game.sound) this.game.sound.playHipHopBeat();
      }
    }
    super.update(dt);
    this._danceTimer += dt;
    this._beatTimer -= dt;
    if (this._beatTimer <= 0) {
      this._beatTimer = 2.5+Math.random();
      if (this.game.sound) this.game.sound.playHipHopBeat();
    }
    var p = this.game.localPlayer; if (!p) return;
    var dx = p.x-this.x, dy = p.y-this.y, dist = Math.sqrt(dx*dx+dy*dy);
    if (dist > 0 && dist < 140) {
      var angle = Math.atan2(dy,dx) + Math.sin(this._danceTimer*3)*0.8;
      this.x += Math.cos(angle)*this.speed*60*dt;
      this.y += Math.sin(angle)*this.speed*60*dt;
    }
    if (this.hp <= 0 && this._dropsPill) {
      this.game.addEntity(new HealthPill(this.game, { x: this.x, y: this.y, heal: 20 }));
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (!this._transformed) {
      ctx.fillStyle = "#ddb890"; ctx.fillRect(sp.x+2,sp.y,12,10);
      ctx.fillStyle = "#333"; ctx.fillRect(sp.x,sp.y+10,16,10);
      ctx.fillStyle = "#333";
      ctx.fillRect(sp.x+4,sp.y+3,3,2); ctx.fillRect(sp.x+9,sp.y+3,3,2);
      return;
    }
    var bob = Math.sin(this._danceTimer*8)*3;
    // Body
    ctx.fillStyle = "#e040e0"; ctx.fillRect(sp.x,sp.y+bob,16,20);
    // Cap
    ctx.fillStyle = "#f0d060"; ctx.fillRect(sp.x+1,sp.y-4+bob,14,6);
    ctx.fillRect(sp.x-2,sp.y+bob,6,3);
    // Sunglasses
    ctx.fillStyle = "#000";
    ctx.fillRect(sp.x+2,sp.y+5+bob,5,3); ctx.fillRect(sp.x+9,sp.y+5+bob,5,3);
    ctx.fillRect(sp.x+7,sp.y+6+bob,2,1);
    // Chain
    ctx.fillStyle = "#f0d060";
    ctx.fillRect(sp.x+5,sp.y+12+bob,6,2);
    // Arms dancing
    var armL = Math.sin(this._danceTimer*6)*10;
    var armR = Math.cos(this._danceTimer*6)*10;
    ctx.strokeStyle = "#e040e0"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sp.x,sp.y+10+bob); ctx.lineTo(sp.x-6,sp.y+4+armL+bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sp.x+16,sp.y+10+bob); ctx.lineTo(sp.x+22,sp.y+4+armR+bob); ctx.stroke();
  }
}

/* ========== BOSS PROJECTILES ========== */

class ChipProjectile extends ArcadeProjectile {
  constructor(game, cfg) {
    super(game, Object.assign({ w: 8, h: 6, damage: 8, color: "#f0d060", name: "Chip", flySpeed: 110, lifetime: 3 }, cfg));
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    ctx.fillStyle = "#f0d060"; ctx.fillRect(sp.x, sp.y, 8, 5);
    ctx.fillStyle = "#d4a020"; ctx.fillRect(sp.x+1, sp.y+1, 6, 3);
  }
}

class DrumstickProjectile extends ArcadeProjectile {
  constructor(game, cfg) {
    super(game, Object.assign({ w: 10, h: 8, damage: 14, color: "#c8782a", name: "Drumstick", flySpeed: 130, lifetime: 3 }, cfg));
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    ctx.fillStyle = "#c8782a";
    ctx.beginPath(); ctx.ellipse(sp.x+5,sp.y+4,5,3,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#f5deb3"; ctx.fillRect(sp.x+8,sp.y+2,4,2);
  }
}

class FriedChickenProjectile extends ArcadeProjectile {
  constructor(game, cfg) {
    super(game, Object.assign({ w: 12, h: 10, damage: 18, color: "#d4880a", name: "HotChicken", flySpeed: 100, lifetime: 3.5 }, cfg));
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var pulse = 0.7+Math.sin(this._age*10)*0.3;
    ctx.fillStyle = "rgba(212,136,10,"+pulse+")";
    ctx.beginPath(); ctx.ellipse(sp.x+6,sp.y+5,6,5,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#f44"; ctx.font = "6px Courier New"; ctx.textAlign = "center";
    ctx.fillText("HOT!", sp.x+6, sp.y-2);
  }
}

/* ========== ZINGER BURGER CLONE ========== */
class ZingerBurgerClone extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y, width: 18, height: 16,
      speed: 1.3, color: "#d4880a",
      enemyType: "zinger", name: "Zinger Burger",
      hp: cfg.hp || 69, atk: cfg.atk || 14, def: cfg.def || 9,
      aggroRange: 160, ai: "chase", expReward: 15
    });
    this.isBoss = false;
    this.aggroed = true;
    this._parentBoss = cfg.parentBoss;
    this._age = 0; this._atkTimer = 1+Math.random();
  }
  update(dt) {
    super.update(dt); if (!this.alive) return;
    this._age += dt;
    var p = this.game.localPlayer; if (!p) return;
    var dx = p.x-this.x, dy = p.y-this.y, dist = Math.sqrt(dx*dx+dy*dy);
    if (dist > 0 && dist < 160) {
      this.x += (dx/dist)*this.speed*60*dt;
      this.y += (dy/dist)*this.speed*60*dt;
    }
    this._atkTimer -= dt;
    if (this._atkTimer <= 0) {
      this._atkTimer = 1.5+Math.random();
      var a = Math.atan2(p.y-this.y, p.x-this.x);
      this.game.addEntity(new FriedChickenProjectile(this.game, {
        x: this.x, y: this.y, dirX: Math.cos(a), dirY: Math.sin(a), damage: 10
      }));
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var bob = Math.sin(this._age*4)*2;
    ctx.fillStyle = "#d4880a"; ctx.fillRect(sp.x,sp.y+bob,18,6);
    ctx.fillStyle = "#c8782a"; ctx.fillRect(sp.x+2,sp.y+5+bob,14,5);
    ctx.fillStyle = "#50c878"; ctx.fillRect(sp.x+2,sp.y+4+bob,14,2);
    ctx.fillStyle = "#d4880a"; ctx.fillRect(sp.x,sp.y+10+bob,18,6);
  }
}

/* ========== KFC KING BOSS ========== */
class KFCKingBoss extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y, width: 28, height: 32,
      speed: 1.0, color: "#fff",
      enemyType: "kfc_king", name: "Col. Sanders King Demon",
      hp: cfg.hp || 575, atk: 21, def: 9,
      aggroRange: 200, ai: "chase", expReward: 80
    });
    this.isBoss = true;
    this.aggroed = true;
    this._phase = 1; this._atkTimer = 2; this._laughTimer = 4; this._age = 0;
    this._zingers = []; this._splitDone = false; this._chickenForm = false;
    this._onDefeat = cfg.onDefeat || null;
    this._defeated = false;
  }
  takeDamage(amt, atk) {
    if (!this.alive) return;
    this.hp -= amt;
    this._playHurtSound();
    if (atk) {
      var dx = this.x - atk.x, dy = this.y - atk.y, d = Math.sqrt(dx*dx+dy*dy) || 1;
      this.vx = (dx/d)*6; this.vy = (dy/d)*6;
    }
    // Don't set alive=false here - let update() handle death with onDefeat callback
    if (this.hp <= 0) this.hp = 0;
  }
  update(dt) {
    if (this._defeated) return;
    super.update(dt); if (!this.alive) return;
    this._age += dt;
    var pct = this.hp / this.maxHp;
    var p = this.game.localPlayer;
    if (pct <= 0.7 && this._phase === 1) {
      this._phase = 2; this.atk = 29;
      if (this.game.sound) this.game.sound.playBossPhaseUp();
      this.game.hud.addChatMessage("Colonel throws drumsticks! ATK UP!", "#f44");
    }
    if (pct <= 0.5 && this._phase === 2) {
      this._phase = 3; this._chickenForm = true;
      this.width = 32; this.height = 32;
      if (this.game.sound) { this.game.sound.playChickenScream(); this.game.sound.stopBGM(); this.game.sound.playBGM("kfc_boss"); }
      this.game.hud.addChatMessage("Transformed into HOT FRIED CHICKEN!", "#f80");
      this.game.camera.shake(6, 0.5);
    }
    if (pct <= 0.25 && this._phase === 3 && !this._splitDone) {
      this._phase = 4; this._splitDone = true; this.def = 18;
      if (this.game.sound) this.game.sound.playBossPhaseUp();
      this.game.hud.addChatMessage("Splits into 5 ZINGER BURGERS! DEF UP!", "#f0d060");
      if (this.game.sound) { this.game.sound.stopBGM(); this.game.sound.playBGM("kfc_final"); this.game.sound.playKFCJingle(); }
      for (var i=0; i<5; i++) {
        var angle = (Math.PI*2/5)*i;
        var z = new ZingerBurgerClone(this.game, {
          x: this.x+Math.cos(angle)*40, y: this.y+Math.sin(angle)*40,
          hp: 69, atk: 14, def: 9, parentBoss: this
        });
        this._zingers.push(z); this.game.addEntity(z);
      }
    }
    if (p) {
      var dx = p.x-this.x, dy = p.y-this.y, dist = Math.sqrt(dx*dx+dy*dy);
      if (dist > 40 && dist < 200) {
        this.x += (dx/dist)*this.speed*60*dt;
        this.y += (dy/dist)*this.speed*60*dt;
      }
    }
    this._atkTimer -= dt;
    if (this._atkTimer <= 0 && p) {
      var a = Math.atan2(p.y-this.y, p.x-this.x);
      if (this._phase === 1) {
        this._atkTimer = 1.2;
        for (var i=-1;i<=1;i++) this.game.addEntity(new ChipProjectile(this.game, {
          x: this.x+14, y: this.y+16, dirX: Math.cos(a+i*0.3), dirY: Math.sin(a+i*0.3)
        }));
      } else if (this._phase === 2) {
        this._atkTimer = 0.9;
        this.game.addEntity(new DrumstickProjectile(this.game, {
          x: this.x+14, y: this.y+16, dirX: Math.cos(a), dirY: Math.sin(a)
        }));
      } else if (this._phase === 3) {
        this._atkTimer = 0.7;
        for (var i=0;i<4;i++) {
          var ra = a+(Math.random()-0.5)*1.2;
          this.game.addEntity(new FriedChickenProjectile(this.game, {
            x: this.x+16, y: this.y+16, dirX: Math.cos(ra), dirY: Math.sin(ra)
          }));
        }
        if (this.game.sound && Math.random()<0.3) this.game.sound.playChickenScream();
      } else {
        this._atkTimer = 1.0;
        for (var i=0;i<3;i++) {
          var ra = a+(Math.random()-0.5)*0.8;
          this.game.addEntity(new FriedChickenProjectile(this.game, {
            x: this.x+16, y: this.y+16, dirX: Math.cos(ra), dirY: Math.sin(ra), damage: 12
          }));
        }
      }
    }
    this._laughTimer -= dt;
    if (this._laughTimer <= 0) {
      this._laughTimer = 3+Math.random()*2;
      if (this.game.sound) this.game.sound.playCreepyLaugh();
    }
    if (this.hp <= 0 && !this._defeated) {
      this._defeated = true;
      this.alive = false;
      this.active = false;
      this._zingers.forEach(function(z){if(z.alive){z.hp=0;z.alive=false;z.destroy()}});
      if (this.game.sound) { this.game.sound.stopBGM(); this.game.sound.playIceCreamMelt(); }
      this.game.hud.clearBoss();
      this.game.hud.addChatMessage("Melts into ice cream...", "#88ddff");
      this.game.hud.addChatMessage("\"Chicken is always right!\"", "#f0d060");
      this.game.camera.shake(8, 1.0);
      if (this._onDefeat) this._onDefeat();
      var self = this;
      setTimeout(function(){ self.destroy(); }, 500);
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var bob = Math.sin(this._age*3)*2;
    if (this._chickenForm) {
      var pulse = 0.8+Math.sin(this._age*8)*0.2;
      ctx.fillStyle = "rgba(212,136,10,"+pulse+")";
      ctx.beginPath(); ctx.ellipse(sp.x+16,sp.y+16+bob,16,14,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = "#f80";
      ctx.beginPath(); ctx.ellipse(sp.x+16,sp.y+16+bob,12,10,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = "#f00";
      ctx.fillRect(sp.x+8,sp.y+12+bob,5,4); ctx.fillRect(sp.x+19,sp.y+12+bob,5,4);
      for (var i=0;i<3;i++) {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillRect(sp.x+8+i*8, sp.y-4+bob+Math.sin(this._age*4+i)*3, 3, 3);
      }
    } else {
      ctx.fillStyle = "#fff"; ctx.fillRect(sp.x+4,sp.y+10+bob,20,22);
      ctx.fillStyle = "#f5deb3"; ctx.fillRect(sp.x+6,sp.y+bob,16,14);
      ctx.fillStyle = "#fff"; ctx.fillRect(sp.x+4,sp.y-2+bob,20,5);
      ctx.fillStyle = "#333";
      ctx.fillRect(sp.x+7,sp.y+5+bob,5,3); ctx.fillRect(sp.x+16,sp.y+5+bob,5,3);
      ctx.fillRect(sp.x+12,sp.y+6+bob,4,1);
      ctx.fillStyle = "#fff"; ctx.fillRect(sp.x+10,sp.y+11+bob,8,4);
      ctx.fillStyle = "#000"; ctx.fillRect(sp.x+12,sp.y+12+bob,4,10);
      if (this._phase >= 2) {
        ctx.fillStyle = "rgba(255,0,0,0.15)";
        ctx.fillRect(sp.x-2,sp.y-4+bob,32,38);
      }
    }
    ctx.fillStyle = "#300"; ctx.fillRect(sp.x-2,sp.y-8+bob,32,4);
    ctx.fillStyle = this._phase>=3?"#f80":"#e44";
    ctx.fillRect(sp.x-2,sp.y-8+bob,32*(this.hp/this.maxHp),4);
  }
}


/* ================================================================
   STAGE 2 - 1F CONTROLLER
   ================================================================ */
class Stage2_1F {
  constructor(onComplete) {
    this._onComplete = onComplete;
    this.game = null;
    this._machines = [];
    this._machinesDestroyed = 0;
    this._totalMachines = 8;
    this._boss = null;
    this._bossTriggered = false;
    this._age = 0;
    this._mapW = 60;
    this._mapH = 50;
    this._elevatorShown = false;
  }

  init(game) {
    this.game = game;
    var p = game.localPlayer;
    p.sideScrollMode = false;
    p.x = 480; p.y = 700;
    p.vx = 0; p.vy = 0;

    var W = this._mapW, H = this._mapH;
    var ground = [], collision = [];
    for (var y = 0; y < H; y++) {
      var gr = [], cr = [];
      for (var x = 0; x < W; x++) {
        if (x === 0 || x === W-1 || y === 0 || y === H-1) {
          gr.push(4); cr.push(1); // walls
        } else {
          // Arcade carpet pattern (alternating dark tiles)
          var carpet = ((x+y)%4 === 0) ? 9 : ((x+y)%3 === 0) ? 10 : 11;
          gr.push(carpet); cr.push(0);
        }
      }
      ground.push(gr); collision.push(cr);
    }

    // Decorative walls/pillars
    var pillars = [[10,15],[30,15],[50,15],[10,30],[30,30],[50,30]];
    for (var i=0; i<pillars.length; i++) {
      var px = pillars[i][0], py = pillars[i][1];
      if (px < W && py < H) { ground[py][px] = 5; collision[py][px] = 1; }
    }

    game.tileMap = new TileMap(game);
    game.tileMap.load({ width: W, height: H, ground: ground, collision: collision, above: [], events: [], spawns: {}, exits: [] }, null);

    // BGM
    if (game.sound) { game.sound.stopBGM(); game.sound.resetTempo(); game.sound.playBGM("arcade_1f"); }

    game.hud.showStageName("1F - GAME ZONE ARCADE");
    game.hud.addChatMessage("Welcome to the Arcade! Destroy all 7 machines!", "#50c878");
    game.hud.addChatMessage("Get close to activate, then ATTACK to destroy!", "#88bbff");

    var self = this;
    var onMachineDestroy = function(machine) {
      self._machinesDestroyed++;
      game.hud.addChatMessage(machine.name + " DESTROYED! (" + self._machinesDestroyed + "/" + self._totalMachines + ")", "#f0d060");
      // Drop health pill on machine destroy
      game.addEntity(new HealthPill(game, { x: machine.x+20, y: machine.y+20, heal: 25 }));
      if (self._machinesDestroyed >= self._totalMachines && !self._bossTriggered) {
        setTimeout(function() { self._spawnBoss(); }, 1500);
      }
    };

    // 1. Racing Game (top-left area)
    var m1 = new RacingMachine(game, { x: 3*16, y: 4*16, onDestroy: onMachineDestroy,
      onActivate: function(m) { game.hud.addChatMessage("Racing machine activated! Cars incoming!", "#e84855"); }
    });
    // 2. Shooting Game (top-center)
    var m2 = new ShootingMachine(game, { x: 16*16, y: 4*16, onDestroy: onMachineDestroy,
      onActivate: function(m) { game.hud.addChatMessage("Shooter activated! Dodge the bullets!", "#556b2f"); }
    });
    // 3. Drum Rhythm (top-right)
    var m3 = new DrumRhythmMachine(game, { x: 30*16, y: 4*16, onDestroy: onMachineDestroy,
      onActivate: function(m) { game.hud.addChatMessage("Drum machine activated!", "#8b4513"); }
    });
    // 4. Bowling Alley (middle-left)
    var m4 = new BowlingMachine(game, { x: 3*16, y: 18*16, onDestroy: onMachineDestroy,
      onActivate: function(m) { game.hud.addChatMessage("Bowling alley! Balls & pins flying!", "#4a90d9"); }
    });
    // 5. Claw Machine (middle-center)
    var m5 = new ClawMachineCabinet(game, { x: 18*16, y: 18*16, onDestroy: onMachineDestroy,
      onActivate: function(m) { game.hud.addChatMessage("Claw machine! Dolls are alive!", "#ff69b4"); }
    });
    // 6. Whack-a-Mole (middle-right)
    var m6 = new WhackAMoleMachine(game, { x: 33*16, y: 18*16, onDestroy: onMachineDestroy,
      onActivate: function(m) { game.hud.addChatMessage("Whack-a-Mole! Moles escaping!", "#8b6914"); }
    });
    // 7. Pump It Up (bottom-center)
    var m7 = new PumpDanceMachine(game, { x: 18*16, y: 32*16, onDestroy: onMachineDestroy,
      onActivate: function(m) { game.hud.addChatMessage("Pump It Up! Dancer transformed!", "#e040e0"); }
    });
    // 8. Extra Shooting Game (bottom-left)
    var m8 = new ShootingMachine(game, { x: 5*16, y: 32*16, onDestroy: onMachineDestroy,
      onActivate: function(m) { game.hud.addChatMessage("Another shooter activated! More bullets!", "#556b2f"); }
    });

    this._machines = [m1, m2, m3, m4, m5, m6, m7, m8];
    for (var i=0; i<this._machines.length; i++) game.addEntity(this._machines[i]);
  }

  _spawnBoss() {
    var game = this.game;
    var self = this;
    this._bossTriggered = true;
    game.hud.addChatMessage("All machines destroyed!", "#50c878");
    game.hud.addChatMessage("KFC Colonel King Demon appears!", "#f44");
    if (game.sound) {
      game.sound.stopBGM();
      game.sound.playBossAppear();
      game.sound.playCreepyLaugh();
    }
    game.camera.shake(8, 1.0);

    game.startDialogue([
      { speaker: "???", text: "Heh heh heh... you destroyed my arcade..." },
      { speaker: "Col. Sanders", text: "But CHICKEN IS ALWAYS RIGHT!" },
      { speaker: "Col. Sanders", text: "Time to fry YOU up!" }
    ], function() {
      var boss = new KFCKingBoss(game, {
        x: 28*16, y: 10*16, hp: 575,
        onDefeat: function() {
          self._showElevator();
        }
      });
      self._boss = boss;
      game.addEntity(boss);
      game.hud.setBoss(boss, "Col. Sanders King Demon");
      setTimeout(function() { if(game.sound) game.sound.playBGM("kfc_boss"); }, 500);
    });
  }

  _showElevator() {
    var game = this.game;
    var self = this;
    game.startDialogue([
      { speaker: "Alice", text: "The Colonel melted into ice cream!" },
      { speaker: "Alice", text: "\"Chicken is always right!\" ...I guess?" },
      { speaker: "Alice", text: "Taking the elevator to 2F!" }
    ], function() {
      game.hud.addChatMessage("Taking elevator to 2F...","#50c878");
      if(game.sound){try{game.sound.playElevatorDing();game.sound.playFloorTransition()}catch(e){}}
      if(game.transition)game.transition.startFade(function(){if(self._onComplete)self._onComplete("2f")});
      else if(self._onComplete)self._onComplete("2f");
    });
  }

  update(dt) {
    if (!this.game) return;
    this._age += dt;

    // Check elevator arrival
    if (this._elevatorShown) {
      var p = this.game.localPlayer;
      if (p && p.x > (this._mapW-5)*16 && p.y < 5*16) {
        this._elevatorShown = false;
        this.game.hud.addChatMessage("Taking elevator to 2F...", "#50c878");
        if (this.game.sound) { this.game.sound.playElevatorDing(); this.game.sound.playFloorTransition(); }
        var self = this;
        this.game.transition.startFade(function() {
          if (self._onComplete) self._onComplete("2f");
        }, function(){});
      }
    }
  }

  render(ctx, camera) {
    if (!this.game) return;

    // Neon ceiling lights (decorative)
    for (var lx = 4; lx < this._mapW-4; lx += 8) {
      for (var ly = 2; ly < this._mapH-2; ly += 10) {
        var sp = camera.worldToScreen(lx*16, ly*16);
        var flicker = 0.3 + Math.sin(this._age*2+lx+ly)*0.2;
        ctx.fillStyle = "rgba(100,200,255," + flicker + ")";
        ctx.fillRect(sp.x, sp.y, 48, 2);
      }
    }

    // Machine counter UI
    ctx.fillStyle = "#fff";
    ctx.font = "9px Courier New"; ctx.textAlign = "left";
    ctx.fillText("Machines: " + this._machinesDestroyed + "/" + this._totalMachines, 8, 310);

    // Elevator indicator
    if (this._elevatorShown) {
      var ex = (this._mapW-3)*16, ey = 2*16;
      var esp = camera.worldToScreen(ex, ey);
      var pulse = 0.6 + Math.sin(this._age*3)*0.4;
      var bounce = Math.sin(this._age*5)*3;

      // Outer glow ring (pulsing)
      ctx.save();
      ctx.shadowColor = "#50c878";
      ctx.shadowBlur = 16 + Math.sin(this._age*4)*8;
      ctx.fillStyle = "rgba(80,200,120," + (pulse*0.4) + ")";
      ctx.fillRect(esp.x-8, esp.y-8, 64, 64);
      ctx.restore();

      // Elevator box
      ctx.fillStyle = "#333";
      ctx.fillRect(esp.x-4, esp.y-4, 56, 56);
      ctx.strokeStyle = "#50c878";
      ctx.lineWidth = 3;
      ctx.strokeRect(esp.x-4, esp.y-4, 56, 56);

      // Inner fill
      ctx.fillStyle = "rgba(80,200,120," + (0.3+pulse*0.3) + ")";
      ctx.fillRect(esp.x, esp.y, 48, 48);

      // Elevator doors (animated opening)
      var doorOpen = Math.min(1, (Math.sin(this._age*2)+1)*0.5);
      var doorW = 20*(1-doorOpen);
      ctx.fillStyle = "#666";
      ctx.fillRect(esp.x+2, esp.y+6, doorW, 36);
      ctx.fillRect(esp.x+46-doorW, esp.y+6, doorW, 36);

      // Arrow bouncing up
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Courier New"; ctx.textAlign = "center";
      ctx.fillText("▲", esp.x+24, esp.y+20+bounce);

      // Text labels
      ctx.fillStyle = "#50c878";
      ctx.font = "bold 10px Courier New";
      ctx.fillText("LIFT", esp.x+24, esp.y+38);
      ctx.fillStyle = "#ff0";
      ctx.font = "bold 12px Courier New";
      ctx.fillText("2F", esp.x+24, esp.y+52);

      // Floating arrow above elevator
      ctx.fillStyle = "#ff0";
      ctx.font = "bold 14px Courier New";
      ctx.fillText("▼▼▼", esp.x+24, esp.y-14+bounce);

      // "GO HERE" blinking text
      if (Math.sin(this._age*6) > 0) {
        ctx.fillStyle = "#ff0";
        ctx.font = "bold 9px Courier New";
        ctx.fillText(">> GO HERE <<", esp.x+24, esp.y-26);
      }
    }

    // Boss gate message
    if (!this._bossTriggered && this._machinesDestroyed < this._totalMachines) {
      var remaining = this._totalMachines - this._machinesDestroyed;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(140, 300, 200, 16);
      ctx.fillStyle = "#f0d060";
      ctx.font = "8px Courier New"; ctx.textAlign = "center";
      ctx.fillText("Destroy " + remaining + " more machine(s) to unlock BOSS!", 240, 310);
    }
  }
}
