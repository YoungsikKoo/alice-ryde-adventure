/* ================================================================
   Stage 2 - 2F: Fitness First Gym (Top-View)
   Australian Fitness First interior. Red/dark grey theme.
   5 Zones → Aerobics King Boss after all zones cleared.

   Zones (proximity-triggered):
     1. Treadmill Zone   → 3 Treadmill Zombies
     2. Yoga Studio      → 5 Yoga Rollers (Indian BGM)
     3. Spinning Room    → 4 Spinning Cyclists
     4. Bench Press Area → 3 Bench Press Strongmen
     5. Swimming Pool    → 5 Dolphins + Whirlpool drain

   Boss: Aerobics King Instructor
     100-50%  Aerobic kick attacks + whistle stun
      <50%    5 students merge into MEGA form (hp*2, atk*2)
        0%    Victory → Stage 2 complete
   ================================================================ */

/* ========== GYM MACHINE (destroyable zone anchor, extends Enemy) ========== */
class GymMachine extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: cfg.w || 48, height: cfg.h || 40,
      speed: 0, color: cfg.color || "#444",
      enemyType: "gymMachine",
      name: cfg.name || "Gym Equipment",
      hp: cfg.hp || 60,
      atk: 0, def: 3,
      contactDamage: 3,
      ai: "stationary",
      aggroRange: 0,
      expReward: 12
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
    this._spawned = false;
  }
  update(dt) {
    if (!this.alive) return;
    this._age += dt;
    var p = this.game.localPlayer;
    if (!p) return;
    var dx = p.x+8 - (this.x+this.width/2), dy = p.y+8 - (this.y+this.height/2);
    var dist = Math.sqrt(dx*dx+dy*dy);
    if (!this._activated && dist < this._triggerRange) {
      this._activated = true;
      if (this.game.sound) this.game.sound.playMachineActivate();
      if (this._onActivate) this._onActivate(this);
    }
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
    this._renderBase(ctx, sp);
    ctx.fillStyle = "#300";
    ctx.fillRect(sp.x, sp.y - 6, this.width, 3);
    ctx.fillStyle = this._activated ? "#e44" : "#888";
    ctx.fillRect(sp.x, sp.y - 6, this.width * (this.hp/this.maxHp), 3);
    ctx.fillStyle = this._activated ? "#f0d060" : "#ccc";
    ctx.font = "7px Courier New"; ctx.textAlign = "center";
    ctx.fillText(this._label, sp.x + this.width/2, sp.y - 9);
  }
  _renderBase(ctx, sp) {
    ctx.fillStyle = this._color;
    ctx.fillRect(sp.x, sp.y, this.width, this.height);
  }
}

/* ========== 1. TREADMILL ZONE ========== */
class TreadmillMachine extends GymMachine {
  constructor(game, cfg) {
    super(game, Object.assign({
      name: "Treadmill", machineType: "treadmill", color: "#555",
      hp: 60, label: "TREADMILL", triggerRange: 70
    }, cfg));
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this._activated) return;
    if (!this._spawned) {
      this._spawned = true;
      if (this.game.sound) this.game.sound.playHeavyStomp();
      this.game.hud.addChatMessage("Treadmill runner went BERSERK!", "#f44");
      this.game.camera.shake(2, 0.2);
      this.game.addEntity(new TreadmillZombie(this.game, {
        x: this.x + 8, y: this.y + this.height + 8
      }));
    }
  }
  _renderBase(ctx, sp) {
    // Treadmill body
    ctx.fillStyle = "#333";
    ctx.fillRect(sp.x, sp.y, 48, 40);
    // Running belt
    ctx.fillStyle = "#222";
    ctx.fillRect(sp.x+4, sp.y+12, 40, 20);
    // Belt lines (animated)
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
    var offset = (this._age * 40) % 8;
    for (var i = 0; i < 6; i++) {
      var ly = sp.y + 14 + i*4 - offset%4;
      if (ly > sp.y+12 && ly < sp.y+30) {
        ctx.beginPath(); ctx.moveTo(sp.x+6, ly); ctx.lineTo(sp.x+42, ly); ctx.stroke();
      }
    }
    // Display panel
    ctx.fillStyle = "#1a3a1a";
    ctx.fillRect(sp.x+12, sp.y+2, 24, 8);
    ctx.fillStyle = "#0f0";
    ctx.font = "5px Courier New"; ctx.textAlign = "center";
    ctx.fillText("SPD:99", sp.x+24, sp.y+8);
    // Handles
    ctx.fillStyle = "#666";
    ctx.fillRect(sp.x+2, sp.y+4, 3, 28);
    ctx.fillRect(sp.x+43, sp.y+4, 3, 28);
    // Red accent (Fitness First)
    var glow = this._activated ? 0.5+Math.sin(this._age*4)*0.5 : 0.3;
    ctx.strokeStyle = "rgba(220,40,40,"+glow+")";
    ctx.lineWidth = 1;
    ctx.strokeRect(sp.x+1, sp.y+1, 46, 38);
  }
}

class TreadmillZombie extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y, width: 20, height: 24,
      speed: 3.5, color: "#556b2f",
      enemyType: "treadmillZombie",
      name: "Treadmill Zombie",
      hp: 35, atk: 9, def: 3,
      ai: "chase", aggroRange: 150,
      expReward: 8
    });
    this.aggroed = true;
    this._runAnim = 0;
  }
  update(dt) {
    this._runAnim += dt;
    super.update(dt);
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var bob = Math.sin(this._runAnim*12)*2;
    // Body (gym clothes)
    ctx.fillStyle = "#2a4a2a";
    ctx.fillRect(sp.x+4, sp.y+8+bob, 12, 10);
    // Head
    ctx.fillStyle = "#7a7";
    ctx.fillRect(sp.x+6, sp.y+2+bob, 8, 7);
    // Zombie eyes
    ctx.fillStyle = "#f00";
    ctx.fillRect(sp.x+7, sp.y+4+bob, 2, 2);
    ctx.fillRect(sp.x+11, sp.y+4+bob, 2, 2);
    // Running legs (animated)
    ctx.fillStyle = "#333";
    var legOff = Math.sin(this._runAnim*16)*3;
    ctx.fillRect(sp.x+5, sp.y+18+bob, 3, 6+legOff);
    ctx.fillRect(sp.x+12, sp.y+18+bob, 3, 6-legOff);
    // Sneakers
    ctx.fillStyle = "#e44";
    ctx.fillRect(sp.x+4, sp.y+23+bob+legOff, 5, 2);
    ctx.fillRect(sp.x+11, sp.y+23+bob-legOff, 5, 2);
    // HP bar
    if (this.hp < this.maxHp) {
      ctx.fillStyle = "#300"; ctx.fillRect(sp.x, sp.y-4, 20, 3);
      ctx.fillStyle = "#e44"; ctx.fillRect(sp.x, sp.y-4, 20*(this.hp/this.maxHp), 3);
    }
  }
}

/* ========== 2. YOGA STUDIO (one big studio, 5 yoga students) ========== */
class YogaStudio extends GymMachine {
  constructor(game, cfg) {
    super(game, Object.assign({
      name: "Yoga Studio", machineType: "yoga", color: "#8b6fcf",
      hp: 120, label: "YOGA STUDIO", w: 160, h: 96, triggerRange: 100
    }, cfg));
    this._students = [];
    this._onStudentDeath = cfg.onStudentDeath || null;
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this._activated) return;
    if (!this._spawned) {
      this._spawned = true;
      if (this.game.sound) this.game.sound.playKiai();
      this.game.hud.addChatMessage("Yoga class ACTIVATED! Namaste... NOT!", "#f44");
      this.game.camera.shake(3, 0.3);
      if (this.game.sound) this.game.sound.playBGM("yoga_indian");
      var positions = [
        {x:this.x+20, y:this.y+20},{x:this.x+60, y:this.y+20},{x:this.x+100, y:this.y+20},
        {x:this.x+40, y:this.y+60},{x:this.x+80, y:this.y+60}
      ];
      for (var i=0; i<5; i++) {
        var s = new YogaStudent(this.game, { x:positions[i].x, y:positions[i].y });
        this.game.addEntity(s);
        this._students.push(s);
      }
    }
  }
  _renderBase(ctx, sp) {
    // Studio floor
    ctx.fillStyle = "#6a3d8a";
    ctx.fillRect(sp.x, sp.y, 160, 96);
    // Mat outlines
    ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1;
    for (var i=0; i<5; i++) {
      var mx = sp.x+10+(i%3)*50, my = sp.y+8+Math.floor(i/3)*48;
      ctx.strokeRect(mx, my, 30, 40);
    }
    // Om symbol
    ctx.globalAlpha = 0.3; ctx.fillStyle = "#fff";
    ctx.font = "18px serif"; ctx.textAlign = "center";
    ctx.fillText("\u0950", sp.x+80, sp.y+55);
    ctx.globalAlpha = 1;
    // Border glow
    var glow = this._activated ? 0.5+Math.sin(this._age*3)*0.5 : 0.2;
    ctx.strokeStyle = "rgba(155,89,182,"+glow+")"; ctx.lineWidth = 2;
    ctx.strokeRect(sp.x, sp.y, 160, 96);
    // Label
    ctx.fillStyle = "#fff"; ctx.font = "7px Courier New"; ctx.textAlign = "center";
    ctx.fillText("YOGA STUDIO", sp.x+80, sp.y-2);
  }
}

class YogaStudent extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y, width: 18, height: 22,
      speed: 0, color: "#9b59b6",
      enemyType: "yogaStudent",
      name: "Yoga Student",
      hp: 30, atk: 7, def: 2,
      ai: "stationary", aggroRange: 0,
      expReward: 6
    });
    this._age = 0;
    this._transformed = false;
    this._fleeTimer = 0;
    this._fleeing = false;
    this._attackTimer = 1 + Math.random()*2;
  }
  update(dt) {
    if (!this.alive) return;
    this._age += dt;
    // Transform on first hit (handled in takeDamage)
    if (this._transformed) {
      this._attackTimer -= dt;
      // Flee/attack pattern
      if (this._fleeing) {
        this._fleeTimer -= dt;
        if (this._fleeTimer <= 0) { this._fleeing = false; this._attackTimer = 1.5+Math.random(); }
        // Flee away from player
        var p = this.game.localPlayer;
        if (p && p.alive) {
          var dx = this.x-p.x, dy = this.y-p.y, d = Math.sqrt(dx*dx+dy*dy)||1;
          this.moveWithCollision((dx/d)*this.speed, (dy/d)*this.speed, this.game.tileMap);
          if (Math.abs(dx)>Math.abs(dy)) this.direction=dx>0?"right":"left";
          else this.direction=dy>0?"down":"up";
        }
      } else {
        // Chase and attack
        if (this._attackTimer <= 0) {
          this._fleeing = true; this._fleeTimer = 1.5+Math.random();
          this._attackTimer = 2+Math.random();
        }
        var p = this.game.localPlayer;
        if (p && p.alive) {
          var dx = p.x-this.x, dy = p.y-this.y, d = Math.sqrt(dx*dx+dy*dy)||1;
          this.moveWithCollision((dx/d)*this.speed, (dy/d)*this.speed, this.game.tileMap);
          if (Math.abs(dx)>Math.abs(dy)) this.direction=dx>0?"right":"left";
          else this.direction=dy>0?"down":"up";
        }
      }
      // Separation from other yoga students
      var ents = this.game.entities;
      for (var i=0; i<ents.length; i++) {
        var e = ents[i];
        if (e===this||!e.alive||e.enemyType!=="yogaStudent") continue;
        var sdx=this.x-e.x,sdy=this.y-e.y,sd=Math.sqrt(sdx*sdx+sdy*sdy);
        if (sd<20&&sd>0){this.x+=(sdx/sd)*1.5;this.y+=(sdy/sd)*1.5;}
      }
    }
    super.update(dt);
  }
  takeDamage(amt, atk) {
    if (!this.alive) return;
    if (!this._transformed) {
      this._transformed = true;
      this.speed = 1.8 * 0.7; // 30% slower after transform
      this.chaseSpeed = this.speed * 1.4;
      this.ai = "chase"; this.aggroRange = 200;
      this.aggroed = true;
      if (this.game.sound) this.game.sound.playKiai();
      this.game.camera.shake(2, 0.2);
      this.game.hud.addChatMessage("Yoga student transforms! 2-LEGS OVER HEAD!", "#f44");
      return; // No damage on transform hit
    }
    this.hp -= amt;
    if (atk) { var dx=this.x-atk.x,dy=this.y-atk.y,d=Math.sqrt(dx*dx+dy*dy)||1; this.vx=(dx/d)*5; this.vy=(dy/d)*5; }
    if (this.hp<=0) { this.hp=0; this.alive=false; }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var bob = this._transformed ? Math.sin(this._age*5)*1.5 : 0;
    if (!this._transformed) {
      // HANDSTAND POSE (upside down person)
      // Arms (on ground)
      ctx.fillStyle = "#dca";
      ctx.fillRect(sp.x+3, sp.y+16, 4, 6);
      ctx.fillRect(sp.x+11, sp.y+16, 4, 6);
      // Body (inverted)
      ctx.fillStyle = "#9b59b6";
      ctx.fillRect(sp.x+2, sp.y+4, 14, 12);
      // Head (at bottom)
      ctx.fillStyle = "#dca";
      ctx.fillRect(sp.x+5, sp.y+14, 8, 6);
      // Eyes (upside down)
      ctx.fillStyle = "#333";
      ctx.fillRect(sp.x+7, sp.y+16, 2, 1);
      ctx.fillRect(sp.x+11, sp.y+16, 2, 1);
      // Legs pointing UP
      ctx.fillStyle = "#333";
      ctx.fillRect(sp.x+4, sp.y-2, 4, 7);
      ctx.fillRect(sp.x+10, sp.y-2, 4, 7);
      // Feet (at top)
      ctx.fillStyle = "#f69";
      ctx.fillRect(sp.x+3, sp.y-4, 5, 3);
      ctx.fillRect(sp.x+10, sp.y-4, 5, 3);
    } else {
      // 2-LEG OVER HEAD POSE (scorpion-like backbend)
      var sway = Math.sin(this._age*4)*2;
      // Body bent backwards
      ctx.fillStyle = "#9b59b6";
      ctx.fillRect(sp.x+2+sway, sp.y+6+bob, 14, 10);
      // Head (facing up from bend)
      ctx.fillStyle = "#dca";
      ctx.fillRect(sp.x+5+sway, sp.y+bob, 8, 7);
      // Strained eyes
      ctx.fillStyle = "#f00";
      ctx.fillRect(sp.x+7+sway, sp.y+2+bob, 2, 2);
      ctx.fillRect(sp.x+11+sway, sp.y+2+bob, 2, 2);
      // Grimace
      ctx.fillStyle = "#333";
      ctx.fillRect(sp.x+8+sway, sp.y+5+bob, 4, 1);
      // Legs arching OVER head
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.moveTo(sp.x+5+sway, sp.y+16+bob);
      ctx.quadraticCurveTo(sp.x+9, sp.y-6+bob, sp.x+6+sway, sp.y-2+bob);
      ctx.lineTo(sp.x+9+sway, sp.y-2+bob);
      ctx.quadraticCurveTo(sp.x+12, sp.y-6+bob, sp.x+9+sway, sp.y+16+bob);
      ctx.fill();
      // Feet over head
      ctx.fillStyle = "#f69";
      ctx.fillRect(sp.x+4+sway, sp.y-4+bob, 4, 3);
      ctx.fillRect(sp.x+10+sway, sp.y-4+bob, 4, 3);
      // Arms on ground
      ctx.fillStyle = "#dca";
      ctx.fillRect(sp.x+sway, sp.y+14+bob, 5, 4);
      ctx.fillRect(sp.x+13+sway, sp.y+14+bob, 5, 4);
      // Flee indicator
      if (this._fleeing) {
        ctx.fillStyle = "#ff0"; ctx.font = "6px Courier New"; ctx.textAlign = "center";
        ctx.fillText("!!", sp.x+9, sp.y-8+bob);
      }
    }
    // HP bar
    if (this.hp < this.maxHp) {
      ctx.fillStyle = "#300"; ctx.fillRect(sp.x-2, sp.y-10+bob, 22, 3);
      ctx.fillStyle = "#9b5"; ctx.fillRect(sp.x-2, sp.y-10+bob, 22*(this.hp/this.maxHp), 3);
    }
  }
}

/* ========== 3. SPINNING ROOM ========== */
class SpinBike extends GymMachine {
  constructor(game, cfg) {
    super(game, Object.assign({
      name: "Spin Bike", machineType: "spinning", color: "#e67e22",
      hp: 55, label: "SPIN BIKE", w: 28, h: 32, triggerRange: 65
    }, cfg));
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this._activated) return;
    if (!this._spawned) {
      this._spawned = true;
      if (this.game.sound) { this.game.sound.playBicycleBell(); this.game.sound.playManiacLaugh(); }
      this.game.hud.addChatMessage("Spin bike rider gone MAD!", "#f44");
      this.game.camera.shake(2, 0.2);
      this.game.addEntity(new SpinCyclist(this.game, {
        x: this.x + 4, y: this.y + this.height + 8
      }));
    }
  }
  _renderBase(ctx, sp) {
    var pa = (this._age*4)%(Math.PI*2);
    // Floor mat
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(sp.x, sp.y+26, 28, 6);
    // Base/stabilizer bar
    ctx.fillStyle = "#555";
    ctx.fillRect(sp.x+2, sp.y+28, 24, 2);
    // Rear support leg
    ctx.fillStyle = "#444";
    ctx.fillRect(sp.x+18, sp.y+24, 3, 6);
    // Front support leg
    ctx.fillRect(sp.x+6, sp.y+24, 3, 6);
    // Flywheel (front, large circle)
    ctx.strokeStyle = "#777"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sp.x+9, sp.y+20, 6, 0, Math.PI*2); ctx.stroke();
    // Flywheel spokes (animated)
    ctx.strokeStyle = "#999"; ctx.lineWidth = 1;
    for (var si=0; si<3; si++) {
      var sa = pa+si*(Math.PI*2/3);
      ctx.beginPath();
      ctx.moveTo(sp.x+9, sp.y+20);
      ctx.lineTo(sp.x+9+Math.cos(sa)*5, sp.y+20+Math.sin(sa)*5);
      ctx.stroke();
    }
    // Frame tube (seat to flywheel, angled)
    ctx.strokeStyle = "#444"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sp.x+20, sp.y+12); ctx.lineTo(sp.x+10, sp.y+20); ctx.stroke();
    // Seat post (vertical)
    ctx.fillStyle = "#444";
    ctx.fillRect(sp.x+19, sp.y+12, 2, 12);
    // Seat (shaped)
    ctx.fillStyle = "#e67e22";
    ctx.fillRect(sp.x+16, sp.y+10, 8, 3);
    ctx.fillRect(sp.x+15, sp.y+11, 2, 2);
    // Handlebar stem
    ctx.fillStyle = "#555";
    ctx.fillRect(sp.x+7, sp.y+6, 2, 8);
    // Handlebar grips
    ctx.fillStyle = "#333";
    ctx.fillRect(sp.x+3, sp.y+4, 10, 3);
    // Resistance knob
    ctx.fillStyle = "#c0392b";
    ctx.beginPath(); ctx.arc(sp.x+14, sp.y+18, 2, 0, Math.PI*2); ctx.fill();
    // Pedals (animated, crank arms)
    ctx.fillStyle = "#666";
    var pcx = sp.x+14, pcy = sp.y+22;
    ctx.fillRect(pcx+Math.cos(pa)*4-2, pcy+Math.sin(pa)*4-1, 5, 2);
    ctx.fillRect(pcx+Math.cos(pa+Math.PI)*4-2, pcy+Math.sin(pa+Math.PI)*4-1, 5, 2);
    // Display console
    ctx.fillStyle = "#1a2a1a";
    ctx.fillRect(sp.x+4, sp.y, 8, 5);
    ctx.fillStyle = this._activated ? "#0f0" : "#040";
    ctx.font = "3px Courier New"; ctx.textAlign = "center";
    ctx.fillText("RPM", sp.x+8, sp.y+4);
    // Activation glow
    if (this._activated) {
      var glow = 0.3+Math.sin(this._age*5)*0.2;
      ctx.strokeStyle = "rgba(230,126,34,"+glow+")";
      ctx.lineWidth = 1;
      ctx.strokeRect(sp.x+1, sp.y+1, 26, 30);
    }
  }
}

class SpinCyclist extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y, width: 18, height: 22,
      speed: 3.0, color: "#e67e22",
      enemyType: "spinCyclist",
      name: "Spin Cyclist",
      hp: 30, atk: 8, def: 3,
      ai: "chase", aggroRange: 140,
      expReward: 7
    });
    this.aggroed = true;
    this._pedalAngle = 0;
    this._bellTimer = 3 + Math.random()*3;
  }
  update(dt) {
    this._pedalAngle += dt * 10;
    this._bellTimer -= dt;
    if (this._bellTimer <= 0) {
      this._bellTimer = 2 + Math.random()*3;
      if (this.game.sound) this.game.sound.playBicycleBell();
    }
    super.update(dt);
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    // Bike wheel
    ctx.strokeStyle = "#888"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(sp.x+9, sp.y+18, 5, 0, Math.PI*2); ctx.stroke();
    // Pedal (animated)
    var px = Math.cos(this._pedalAngle)*3, py = Math.sin(this._pedalAngle)*3;
    ctx.fillStyle = "#555";
    ctx.fillRect(sp.x+7+px, sp.y+16+py, 4, 2);
    // Body
    ctx.fillStyle = "#e67e22";
    ctx.fillRect(sp.x+4, sp.y+6, 10, 10);
    // Head with helmet
    ctx.fillStyle = "#ffd";
    ctx.fillRect(sp.x+5, sp.y+1, 8, 6);
    ctx.fillStyle = "#333";
    ctx.fillRect(sp.x+4, sp.y, 10, 3);
    // Angry eyes
    ctx.fillStyle = "#f00";
    ctx.fillRect(sp.x+6, sp.y+3, 2, 2);
    ctx.fillRect(sp.x+10, sp.y+3, 2, 2);
    // HP bar
    if (this.hp < this.maxHp) {
      ctx.fillStyle = "#300"; ctx.fillRect(sp.x, sp.y-4, 18, 3);
      ctx.fillStyle = "#e44"; ctx.fillRect(sp.x, sp.y-4, 18*(this.hp/this.maxHp), 3);
    }
  }
}

/* ========== 4. BENCH PRESS AREA ========== */
class BenchPressStation extends GymMachine {
  constructor(game, cfg) {
    super(game, Object.assign({
      name: "Bench Press", machineType: "benchPress", color: "#c0392b",
      hp: 80, label: "BENCH PRESS", w: 48, h: 36, triggerRange: 70
    }, cfg));
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this._activated) return;
    if (!this._spawned) {
      this._spawned = true;
      if (this.game.sound) { this.game.sound.playHeavyStomp(); this.game.sound.playBarbelThrow(); }
      this.game.hud.addChatMessage("Strongman throwing BARBELLS!", "#f44");
      this.game.camera.shake(3, 0.3);
      this.game.addEntity(new BenchStrongman(this.game, {
        x: this.x + 12, y: this.y + this.height + 8
      }));
    }
  }
  _renderBase(ctx, sp) {
    // Bench body
    ctx.fillStyle = "#333";
    ctx.fillRect(sp.x, sp.y, 48, 36);
    // Bench pad (red Fitness First branding)
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(sp.x+8, sp.y+10, 32, 16);
    // Barbell rack
    ctx.fillStyle = "#888";
    ctx.fillRect(sp.x+4, sp.y+4, 4, 28);
    ctx.fillRect(sp.x+40, sp.y+4, 4, 28);
    // Barbell
    ctx.fillStyle = "#aaa";
    ctx.fillRect(sp.x+2, sp.y+14, 44, 3);
    // Weight plates
    ctx.fillStyle = "#222";
    ctx.fillRect(sp.x, sp.y+12, 6, 7);
    ctx.fillRect(sp.x+42, sp.y+12, 6, 7);
    // Neon
    var glow = this._activated ? 0.5+Math.sin(this._age*4)*0.5 : 0.3;
    ctx.strokeStyle = "rgba(192,57,43,"+glow+")";
    ctx.lineWidth = 1;
    ctx.strokeRect(sp.x+1, sp.y+1, 46, 34);
  }
}

class BenchStrongman extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y, width: 24, height: 28,
      speed: 1.4, color: "#c0392b",
      enemyType: "benchStrongman",
      name: "Strongman",
      hp: 50, atk: 12, def: 6,
      ai: "chase", aggroRange: 130,
      expReward: 10
    });
    this.aggroed = true;
    this._throwTimer = 2 + Math.random();
    this._flexAnim = 0;
  }
  update(dt) {
    this._flexAnim += dt;
    this._throwTimer -= dt;
    if (this._throwTimer <= 0 && this.alive) {
      this._throwTimer = 2.5 + Math.random();
      var p = this.game.localPlayer;
      if (p && p.alive) {
        var a = Math.atan2(p.y-this.y, p.x-this.x);
        if (this.game.sound) this.game.sound.playBarbelThrow();
        this.game.addEntity(new BarbellProjectile(this.game, {
          x: this.x+12, y: this.y+14, dirX: Math.cos(a), dirY: Math.sin(a)
        }));
      }
    }
    super.update(dt);
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var flex = Math.sin(this._flexAnim*3)*2;
    // Big body
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(sp.x+2, sp.y+10, 20, 14);
    // Arms (flexing)
    ctx.fillStyle = "#daa";
    ctx.fillRect(sp.x-2, sp.y+10-flex, 6, 10+flex);
    ctx.fillRect(sp.x+18, sp.y+10-flex, 6, 10+flex);
    // Head
    ctx.fillStyle = "#daa";
    ctx.fillRect(sp.x+6, sp.y+2, 12, 9);
    // Angry face
    ctx.fillStyle = "#f00";
    ctx.fillRect(sp.x+8, sp.y+4, 3, 2);
    ctx.fillRect(sp.x+13, sp.y+4, 3, 2);
    ctx.fillStyle = "#333";
    ctx.fillRect(sp.x+9, sp.y+8, 6, 2);
    // Legs
    ctx.fillStyle = "#333";
    ctx.fillRect(sp.x+4, sp.y+24, 6, 4);
    ctx.fillRect(sp.x+14, sp.y+24, 6, 4);
    // HP bar
    if (this.hp < this.maxHp) {
      ctx.fillStyle = "#300"; ctx.fillRect(sp.x, sp.y-4, 24, 3);
      ctx.fillStyle = "#e44"; ctx.fillRect(sp.x, sp.y-4, 24*(this.hp/this.maxHp), 3);
    }
  }
}

class BarbellProjectile extends Entity {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y, width: 16, height: 6,
      speed: 3.5, color: "#aaa", type: "enemy", tags: ["enemy"]
    });
    this._dirX = cfg.dirX; this._dirY = cfg.dirY;
    this._age = 0; this._lifetime = 4;
    this.contactDamage = 20;
    this._spin = 0;
  }
  update(dt) {
    this._age += dt;
    this._spin += dt * 8;
    if (this._age > this._lifetime) { this.destroy(); return; }
    this.x += this._dirX * this.speed * 60 * dt;
    this.y += this._dirY * this.speed * 60 * dt;
    var p = this.game.localPlayer;
    if (p && p.alive) {
      var dx = p.x+8-this.x-8, dy = p.y+8-this.y-3;
      if (Math.sqrt(dx*dx+dy*dy) < 16) {
        p.takeDamage(this.contactDamage, this);
        this.destroy();
      }
    }
  }
  render(ctx, camera) {
    var sp = camera.worldToScreen(this.x, this.y);
    ctx.save();
    ctx.translate(sp.x+8, sp.y+3);
    ctx.rotate(this._spin);
    // Bar
    ctx.fillStyle = "#aaa";
    ctx.fillRect(-8, -1, 16, 2);
    // Plates
    ctx.fillStyle = "#333";
    ctx.fillRect(-10, -3, 4, 6);
    ctx.fillRect(6, -3, 4, 6);
    ctx.restore();
  }
}

/* ========== 5. SWIMMING POOL (one big pool, 6 confined dolphins) ========== */
class BigPool extends GymMachine {
  constructor(game, cfg) {
    super(game, Object.assign({
      name: "Swimming Pool", machineType: "pool", color: "#3498db",
      hp: 150, label: "SWIMMING POOL", w: 240, h: 112, triggerRange: 120
    }, cfg));
    this._dolphins = [];
    this._whirlpoolActive = false;
    this._whirlpoolTimer = 8+Math.random()*4;
    // Pool bounds (world coords) for dolphin confinement
    this._poolLeft = cfg.x+8; this._poolRight = cfg.x+232;
    this._poolTop = cfg.y+8; this._poolBottom = cfg.y+104;
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this._activated) return;
    if (!this._spawned) {
      this._spawned = true;
      if (this.game.sound) { this.game.sound.playSplash && this.game.sound.playSplash(); this.game.sound.playDolphinSqueak(); }
      this.game.hud.addChatMessage("6 DOLPHINS splash inside the pool!", "#3af");
      this.game.camera.shake(4, 0.4);
      for (var i=0; i<6; i++) {
        var dx = 30+Math.floor(i%3)*70, dy = 24+Math.floor(i/3)*50;
        var d = new PoolDolphin(this.game, {
          x:this.x+dx, y:this.y+dy,
          poolLeft:this._poolLeft, poolRight:this._poolRight,
          poolTop:this._poolTop, poolBottom:this._poolBottom
        });
        this.game.addEntity(d);
        this._dolphins.push(d);
      }
    }
    // Whirlpool
    this._whirlpoolTimer -= dt;
    if (this._whirlpoolTimer<=0&&!this._whirlpoolActive) {
      this._whirlpoolActive = true; this._whirlpoolTimer = 10+Math.random()*5;
      if (this.game.sound) this.game.sound.playWhirlpool();
      var self = this;
      setTimeout(function(){self._whirlpoolActive=false;},3000);
    }
    if (this._whirlpoolActive) {
      var p = this.game.localPlayer;
      if (p&&p.alive) {
        var cx=this.x+this.width/2,cy=this.y+this.height/2;
        var pdx=cx-p.x,pdy=cy-p.y,pdist=Math.sqrt(pdx*pdx+pdy*pdy);
        if (pdist<100&&pdist>5) { p.x+=(pdx/pdist)*1.5;p.y+=(pdy/pdist)*1.5; }
        if (pdist<24) p.takeDamage(5,this);
      }
    }
  }
  _renderBase(ctx, sp) {
    // Pool border (tiles)
    ctx.fillStyle = "#bbb";
    ctx.fillRect(sp.x, sp.y, 240, 112);
    // Water surface
    ctx.fillStyle = this._whirlpoolActive ? "#1a5a9a" : "#3498db";
    ctx.fillRect(sp.x+4, sp.y+4, 232, 104);
    // Lane lines
    ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1;
    ctx.setLineDash([4,4]);
    for (var i=1; i<4; i++) {
      ctx.beginPath(); ctx.moveTo(sp.x+8, sp.y+4+i*26); ctx.lineTo(sp.x+232, sp.y+4+i*26); ctx.stroke();
    }
    ctx.setLineDash([]);
    // Ripples
    for (var r=0; r<6; r++) {
      var rx = sp.x+30+r*36+Math.sin(this._age*2+r)*6;
      var ry = sp.y+20+Math.cos(this._age*1.5+r*1.3)*8;
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath(); ctx.arc(rx, ry, 3+Math.sin(this._age*3+r)*1, 0, Math.PI*2); ctx.stroke();
    }
    // Whirlpool center
    if (this._whirlpoolActive) {
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2;
      var wcx=sp.x+120,wcy=sp.y+56;
      for (var s=0;s<3;s++) {
        var sr=8+s*8+Math.sin(this._age*4)*3;
        ctx.beginPath(); ctx.arc(wcx,wcy,sr,this._age*3+s,this._age*3+s+Math.PI*1.5); ctx.stroke();
      }
    }
    // Pool border glow
    var glow = this._activated ? 0.5+Math.sin(this._age*3)*0.5 : 0.2;
    ctx.strokeStyle = "rgba(52,152,219,"+glow+")"; ctx.lineWidth = 2;
    ctx.strokeRect(sp.x+1, sp.y+1, 238, 110);
  }
}

class PoolDolphin extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y, width: 20, height: 14,
      speed: 2.2, color: "#3498db",
      enemyType: "poolDolphin",
      name: "Pool Dolphin",
      hp: 28, atk: 9, def: 3,
      ai: "chase", aggroRange: 130,
      expReward: 6
    });
    this.aggroed = true;
    this._poolLeft = cfg.poolLeft||0; this._poolRight = cfg.poolRight||9999;
    this._poolTop = cfg.poolTop||0; this._poolBottom = cfg.poolBottom||9999;
    this._jumpAnim = 0;
    this._squeakTimer = 4 + Math.random()*3;
  }
  update(dt) {
    this._jumpAnim += dt;
    this._squeakTimer -= dt;
    if (this._squeakTimer <= 0) {
      this._squeakTimer = 3 + Math.random()*4;
      if (this.game.sound) this.game.sound.playDolphinSqueak();
    }
    super.update(dt);
    // Confine to pool bounds
    if (this.x < this._poolLeft) this.x = this._poolLeft;
    if (this.x+this.width > this._poolRight) this.x = this._poolRight-this.width;
    if (this.y < this._poolTop) this.y = this._poolTop;
    if (this.y+this.height > this._poolBottom) this.y = this._poolBottom-this.height;
    // Separation from other dolphins
    var ents = this.game.entities;
    for (var i=0;i<ents.length;i++) {
      var e=ents[i];
      if (e===this||!e.alive||e.enemyType!=="poolDolphin") continue;
      var sdx=this.x-e.x,sdy=this.y-e.y,sd=Math.sqrt(sdx*sdx+sdy*sdy);
      if (sd<22&&sd>0){this.x+=(sdx/sd)*1.2;this.y+=(sdy/sd)*1.2;}
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var jump = Math.abs(Math.sin(this._jumpAnim*4))*4;
    ctx.fillStyle = "#5dade2";
    ctx.beginPath(); ctx.ellipse(sp.x+10, sp.y+7-jump, 10, 6, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#aed6f1";
    ctx.beginPath(); ctx.ellipse(sp.x+10, sp.y+9-jump, 7, 3, 0, 0, Math.PI); ctx.fill();
    // Dorsal fin
    ctx.fillStyle = "#2e86c1";
    ctx.beginPath(); ctx.moveTo(sp.x+8,sp.y+2-jump); ctx.lineTo(sp.x+12,sp.y-2-jump); ctx.lineTo(sp.x+14,sp.y+3-jump); ctx.fill();
    // Tail
    ctx.beginPath(); ctx.moveTo(sp.x,sp.y+7-jump); ctx.lineTo(sp.x-4,sp.y+3-jump); ctx.lineTo(sp.x-4,sp.y+11-jump); ctx.fill();
    // Eye
    ctx.fillStyle = "#000"; ctx.fillRect(sp.x+14, sp.y+5-jump, 2, 2);
    // Smile
    ctx.strokeStyle = "#000"; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.arc(sp.x+16, sp.y+8-jump, 2, 0, Math.PI); ctx.stroke();
    // Splash
    if (jump>2) { ctx.fillStyle="rgba(52,152,219,0.4)"; ctx.beginPath(); ctx.arc(sp.x+10,sp.y+13,6,0,Math.PI*2); ctx.fill(); }
    // HP bar
    if (this.hp < this.maxHp) {
      ctx.fillStyle = "#300"; ctx.fillRect(sp.x, sp.y-6, 20, 3);
      ctx.fillStyle = "#3af"; ctx.fillRect(sp.x, sp.y-6, 20*(this.hp/this.maxHp), 3);
    }
  }
}

/* ========== HEALTH PILL (re-use from 1F or define locally) ========== */
class GymHealthPill extends Entity {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y, width: 10, height: 10,
      speed: 0, color: "#50c878", type: "item", tags: ["item"]
    });
    this._heal = cfg.heal || 25;
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

/* ========== AEROBICS KING BOSS ========== */
class AerobicsKingBoss extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y, width: 32, height: 36,
      speed: 2.0, color: "#ff1493",
      enemyType: "aerobicsKing",
      name: "Aerobics King",
      hp: 200, atk: 15, def: 6,
      ai: "chase", aggroRange: 300,
      expReward: 100
    });
    this.aggroed = true;
    this._phase = 1; // 1=normal, 2=merged
    this._age = 0;
    this._kickTimer = 0;
    this._whistleTimer = 5;
    this._students = [];
    this._merged = false;
    this._mergeTriggered = false;
    this._onDeath = cfg.onDeath || null;
    this._originalMaxHp = this.maxHp;
    this._flashTimer = 0;
  }
  update(dt) {
    if (!this.alive) return;
    this._age += dt;
    this._flashTimer = Math.max(0, this._flashTimer - dt);

    // Phase check: merge at 50%
    if (!this._mergeTriggered && this.hp <= this._originalMaxHp * 0.5) {
      this._mergeTriggered = true;
      this._triggerMerge();
    }

    // Kick attack
    this._kickTimer -= dt;
    if (this._kickTimer <= 0) {
      this._kickTimer = this._phase === 2 ? 1.2 : 2.0;
      this._doKick();
    }

    // Whistle stun
    this._whistleTimer -= dt;
    if (this._whistleTimer <= 0) {
      this._whistleTimer = this._phase === 2 ? 4 : 6;
      this._doWhistle();
    }

    super.update(dt);
  }

  _doKick() {
    var p = this.game.localPlayer;
    if (!p || !p.alive) return;
    var dx = p.x - this.x, dy = p.y - this.y;
    var dist = Math.sqrt(dx*dx+dy*dy);
    if (dist < 50) {
      var dmg = this._phase === 2 ? 18 : 12;
      this.game.combat.applyDamage(p, dmg, this);
      if (this.game.sound) this.game.sound.playKiai();
      this.game.camera.shake(3, 0.2);
      // Knockback
      var d = dist || 1;
      p.vx = (dx/d)*8; p.vy = (dy/d)*8;
    }
  }

  _doWhistle() {
    if (this.game.sound) this.game.sound.playAerobicWhistle();
    this.game.hud.addChatMessage("*TWEEEEET!* Whistle stun!", "#ff1493");
    var p = this.game.localPlayer;
    if (p && p.alive) {
      var dx = p.x - this.x, dy = p.y - this.y;
      var dist = Math.sqrt(dx*dx+dy*dy);
      if (dist < 100) {
        // Brief stun - slow player
        var origSpeed = p.speed;
        p.speed = origSpeed * 0.3;
        setTimeout(function() { p.speed = origSpeed; }, 1500);
      }
    }
  }

  _triggerMerge() {
    if (this.game.sound) { this.game.sound.playMergeSound(); this.game.sound.playManiacLaugh(); }
    this.game.hud.addChatMessage("Aerobics King: 'STUDENTS! MERGE WITH ME!'", "#ff1493");
    this.game.camera.shake(8, 1.0);

    // Spawn 5 students that run toward boss and merge
    var self = this;
    for (var i = 0; i < 5; i++) {
      var angle = (i/5)*Math.PI*2;
      var student = new AerobicStudent(this.game, {
        x: self.x + Math.cos(angle)*80,
        y: self.y + Math.sin(angle)*80,
        boss: self
      });
      self._students.push(student);
      this.game.addEntity(student);
    }

    // After 3 seconds, complete merge
    setTimeout(function() {
      // Kill remaining students
      for (var j = 0; j < self._students.length; j++) {
        if (self._students[j].alive) {
          self._students[j].alive = false;
          self._students[j].destroy();
        }
      }
      self._phase = 2;
      self._merged = true;
      self.maxHp = self._originalMaxHp * 2;
      self.hp = Math.min(self.hp + self._originalMaxHp, self.maxHp);
      self.atk *= 2;
      self.width = 44;
      self.height = 48;
      self.chaseSpeed = 3.0;
      self._flashTimer = 1;
      if (self.game.sound) { self.game.sound.playBossPhaseUp(); self.game.sound.playBGM("aerobic_boss"); }
      self.game.hud.addChatMessage("MEGA AEROBICS KING! HP and ATK doubled!", "#f44");
      self.game.camera.shake(10, 0.8);
    }, 3000);
  }

  takeDamage(amt, atk) {
    if (!this.alive) return;
    this.hp -= amt;
    this._flashTimer = 0.1;
    if (atk) {
      var dx = this.x - atk.x, dy = this.y - atk.y, d = Math.sqrt(dx*dx+dy*dy) || 1;
      this.vx = (dx/d)*3; this.vy = (dy/d)*3;
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.game.camera.shake(10, 1.0);
      if (this.game.sound) this.game.sound.playMachineDestroy();
      if (this._onDeath) this._onDeath();
    }
  }

  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var bob = Math.sin(this._age*4)*2;
    var w = this.width, h = this.height;

    // Flash on hit
    if (this._flashTimer > 0) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(sp.x-2, sp.y-2+bob, w+4, h+4);
    }

    if (this._phase === 2) {
      // MEGA form - bigger, glowing
      ctx.save();
      ctx.shadowColor = "#ff1493";
      ctx.shadowBlur = 10 + Math.sin(this._age*6)*5;

      // Body (muscular)
      ctx.fillStyle = "#ff1493";
      ctx.fillRect(sp.x+4, sp.y+14+bob, 36, 22);
      // Head with headband
      ctx.fillStyle = "#ffd";
      ctx.fillRect(sp.x+10, sp.y+2+bob, 24, 14);
      ctx.fillStyle = "#f00";
      ctx.fillRect(sp.x+8, sp.y+4+bob, 28, 4);
      // Angry eyes
      ctx.fillStyle = "#f00";
      ctx.fillRect(sp.x+14, sp.y+9+bob, 4, 3);
      ctx.fillRect(sp.x+24, sp.y+9+bob, 4, 3);
      // Arms (flexed wide)
      ctx.fillStyle = "#ffd";
      ctx.fillRect(sp.x-2, sp.y+14+bob, 8, 16);
      ctx.fillRect(sp.x+38, sp.y+14+bob, 8, 16);
      // Legs
      ctx.fillStyle = "#ff1493";
      ctx.fillRect(sp.x+8, sp.y+36+bob, 10, 10);
      ctx.fillRect(sp.x+26, sp.y+36+bob, 10, 10);
      // Crown
      ctx.fillStyle = "#ff0";
      ctx.fillRect(sp.x+12, sp.y-2+bob, 20, 5);
      ctx.fillRect(sp.x+14, sp.y-5+bob, 4, 4);
      ctx.fillRect(sp.x+20, sp.y-6+bob, 4, 5);
      ctx.fillRect(sp.x+26, sp.y-5+bob, 4, 4);

      ctx.restore();
      // "MEGA" label
      ctx.fillStyle = "#ff0";
      ctx.font = "bold 7px Courier New"; ctx.textAlign = "center";
      ctx.fillText("MEGA", sp.x+w/2, sp.y-8+bob);
    } else {
      // Normal form
      // Body (leotard)
      ctx.fillStyle = "#ff1493";
      ctx.fillRect(sp.x+4, sp.y+10+bob, 24, 16);
      // Head
      ctx.fillStyle = "#ffd";
      ctx.fillRect(sp.x+8, sp.y+2+bob, 16, 10);
      // Headband
      ctx.fillStyle = "#f00";
      ctx.fillRect(sp.x+6, sp.y+3+bob, 20, 3);
      // Eyes
      ctx.fillStyle = "#333";
      ctx.fillRect(sp.x+10, sp.y+6+bob, 3, 2);
      ctx.fillRect(sp.x+19, sp.y+6+bob, 3, 2);
      // Smile
      ctx.fillStyle = "#fff";
      ctx.fillRect(sp.x+13, sp.y+9+bob, 6, 2);
      // Arms (aerobic pose)
      ctx.fillStyle = "#ffd";
      var armUp = Math.sin(this._age*6)*4;
      ctx.fillRect(sp.x, sp.y+8+bob-armUp, 5, 12);
      ctx.fillRect(sp.x+27, sp.y+8+bob+armUp, 5, 12);
      // Legs
      ctx.fillStyle = "#ff69b4";
      var legKick = Math.sin(this._age*8)*3;
      ctx.fillRect(sp.x+6, sp.y+26+bob, 6, 8+legKick);
      ctx.fillRect(sp.x+20, sp.y+26+bob, 6, 8-legKick);
      // Sneakers
      ctx.fillStyle = "#fff";
      ctx.fillRect(sp.x+4, sp.y+33+bob+legKick, 8, 3);
      ctx.fillRect(sp.x+18, sp.y+33+bob-legKick, 8, 3);
      // Whistle
      ctx.fillStyle = "#888";
      ctx.fillRect(sp.x+15, sp.y+12+bob, 6, 3);
    }

    // HP bar
    ctx.fillStyle = "#300";
    ctx.fillRect(sp.x-2, sp.y-12+bob, w+4, 4);
    ctx.fillStyle = this._phase >= 2 ? "#f80" : "#e44";
    ctx.fillRect(sp.x-2, sp.y-12+bob, (w+4)*(this.hp/this.maxHp), 4);
  }
}

class AerobicStudent extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y, width: 16, height: 20,
      speed: 4.0, color: "#ff69b4",
      enemyType: "aerobicStudent",
      name: "Aerobic Student",
      hp: 15, atk: 5, def: 1,
      ai: "chase", aggroRange: 200,
      expReward: 4
    });
    this.aggroed = true;
    this._boss = cfg.boss;
    this._age = 0;
    this._mergeTarget = true;
  }
  update(dt) {
    if (!this.alive) return;
    this._age += dt;
    // Run toward boss to merge
    if (this._boss && this._boss.alive) {
      var dx = this._boss.x - this.x, dy = this._boss.y - this.y;
      var dist = Math.sqrt(dx*dx+dy*dy);
      if (dist < 20) {
        // Merged!
        this.alive = false;
        this.destroy();
        if (this.game.sound) this.game.sound.playMergeSound();
        return;
      }
      if (dist > 5) {
        this.moveWithCollision((dx/dist)*this.speed*1.5, (dy/dist)*this.speed*1.5, this.game.tileMap);
      }
    } else {
      // Boss dead, just chase player
      super.update(dt);
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    var bob = Math.sin(this._age*8)*2;
    // Body
    ctx.fillStyle = "#ff69b4";
    ctx.fillRect(sp.x+2, sp.y+6+bob, 12, 10);
    // Head
    ctx.fillStyle = "#ffd";
    ctx.fillRect(sp.x+4, sp.y+bob, 8, 7);
    // Headband
    ctx.fillStyle = "#f0f";
    ctx.fillRect(sp.x+3, sp.y+1+bob, 10, 2);
    // Legs
    ctx.fillStyle = "#333";
    ctx.fillRect(sp.x+3, sp.y+16+bob, 4, 4);
    ctx.fillRect(sp.x+9, sp.y+16+bob, 4, 4);
    // Merge glow
    ctx.fillStyle = "rgba(255,20,147," + (0.3+Math.sin(this._age*6)*0.2) + ")";
    ctx.beginPath(); ctx.arc(sp.x+8, sp.y+10+bob, 12, 0, Math.PI*2); ctx.fill();
  }
}


/* ================================================================
   STAGE 2 - 2F CONTROLLER
   ================================================================ */
class Stage2_2F {
  constructor(onComplete) {
    this._onComplete = onComplete;
    this.game = null;
    this._machines = [];
    this._machinesDestroyed = 0;
    this._totalMachines = 12; // 3+1+4+3+1
    this._boss = null;
    this._bossTriggered = false;
    this._age = 0;
    this._mapW = 60;
    this._mapH = 50;
    this._victoryShown = false;
  }

  init(game) {
    this.game = game;
    var p = game.localPlayer;
    p.sideScrollMode = false;
    p.x = 480; p.y = 720;
    p.vx = 0; p.vy = 0;

    var W = this._mapW, H = this._mapH;
    var ground = [], collision = [];
    for (var y = 0; y < H; y++) {
      var gr = [], cr = [];
      for (var x = 0; x < W; x++) {
        if (x === 0 || x === W-1 || y === 0 || y === H-1) {
          gr.push(4); cr.push(1); // walls
        } else if (y >= 30 && y <= 38 && x >= 35 && x <= 54) {
          // Pool area - blue water floor
          gr.push(3); cr.push(0);
        } else if (y >= 10 && y <= 18 && x >= 38 && x <= 50) {
          // Yoga studio - warm red/pink floor
          gr.push(6); cr.push(0);
        } else if (y >= 10 && y <= 18 && x >= 20 && x <= 34) {
          // Spinning room - dark floor
          gr.push(12); cr.push(0);
        } else {
          // Gym floor (Fitness First grey/red theme)
          var tile = ((x+y)%5 === 0) ? 5 : ((x+y)%3 === 0) ? 13 : 4;
          gr.push(tile); cr.push(0);
        }
      }
      ground.push(gr); collision.push(cr);
    }

    // Walls / dividers between zones
    var walls = [
      // Yoga studio walls
      [38,10],[38,11],[38,12],[38,13],[38,14],[38,15],[38,16],[38,17],[38,18],
      [50,10],[50,11],[50,12],[50,13],[50,14],[50,15],[50,16],[50,17],[50,18],
      [39,10],[40,10],[41,10],[42,10],[43,10],[44,10],[45,10],[46,10],[47,10],[48,10],[49,10],
      // Spinning room walls
      [20,10],[20,11],[20,12],[20,13],[20,14],[20,15],[20,16],[20,17],[20,18],
      [34,10],[34,11],[34,12],[34,13],[34,14],[34,15],[34,16],[34,17],[34,18],
      [21,10],[22,10],[23,10],[24,10],[25,10],[26,10],[27,10],[28,10],[29,10],[30,10],[31,10],[32,10],[33,10],
      // Pool perimeter
      [35,30],[35,31],[35,32],[35,33],[35,34],[35,35],[35,36],[35,37],[35,38],
      [54,30],[54,31],[54,32],[54,33],[54,34],[54,35],[54,36],[54,37],[54,38],
      [36,30],[37,30],[38,30],[39,30],[40,30],[41,30],[42,30],[43,30],[44,30],[45,30],[46,30],[47,30],[48,30],[49,30],[50,30],[51,30],[52,30],[53,30]
    ];
    // Leave entrances (gaps in walls)
    var entranceSet = {};
    // Yoga entrance
    entranceSet["44,18"] = true; entranceSet["45,18"] = true;
    // Spinning entrance
    entranceSet["27,18"] = true; entranceSet["28,18"] = true;
    // Pool entrance
    entranceSet["44,38"] = true; entranceSet["45,38"] = true; entranceSet["46,38"] = true;

    for (var wi = 0; wi < walls.length; wi++) {
      var wx = walls[wi][0], wy = walls[wi][1];
      var key = wx+","+wy;
      if (!entranceSet[key] && wx < W && wy < H) {
        ground[wy][wx] = 5; collision[wy][wx] = 1;
      }
    }

    // Pillars
    var pillars = [[10,8],[30,8],[50,8],[10,25],[30,25],[10,40],[30,40]];
    for (var i=0; i<pillars.length; i++) {
      var px = pillars[i][0], py = pillars[i][1];
      if (px < W && py < H) { ground[py][px] = 5; collision[py][px] = 1; }
    }

    game.tileMap = new TileMap(game);
    game.tileMap.load({ width: W, height: H, ground: ground, collision: collision, above: [], events: [], spawns: {}, exits: [] }, null);

    // BGM
    if (game.sound) { game.sound.stopBGM(); game.sound.resetTempo(); game.sound.playBGM("gym_2f"); }

    game.camera.setMapBounds(W*16, H*16);
    game.hud.showStageName("2F - FITNESS FIRST GYM");
    game.hud.addChatMessage("Welcome to Fitness First! Destroy all 12 machines!", "#50c878");
    game.hud.addChatMessage("Get close to activate, then ATTACK!", "#88bbff");

    var self = this;
    var onMachineDestroy = function(machine) {
      self._machinesDestroyed++;
      game.hud.addChatMessage(machine.name + " DESTROYED! (" + self._machinesDestroyed + "/" + self._totalMachines + ")", "#f0d060");
      // Drop health pill every 4 kills
      if (self._machinesDestroyed % 4 === 0) {
        game.addEntity(new GymHealthPill(game, { x: machine.x+8, y: machine.y+8, heal: 25 }));
      }
      if (self._machinesDestroyed >= self._totalMachines && !self._bossTriggered) {
        self._bossTriggered = true;
        self._spawnBoss();
      }
    };

    // ---- ZONE 1: 3 Treadmills (left side, spaced vertically) ----
    var treadmillPositions = [
      { x: 4*16, y: 20*16 },
      { x: 4*16, y: 24*16 },
      { x: 4*16, y: 28*16 }
    ];
    for (var ti = 0; ti < treadmillPositions.length; ti++) {
      var tm = new TreadmillMachine(game, {
        x: treadmillPositions[ti].x, y: treadmillPositions[ti].y,
        onDestroy: onMachineDestroy
      });
      game.addEntity(tm);
      self._machines.push(tm);
    }

    // ---- ZONE 2: 1 Yoga Studio (big studio, spawns 5 yoga students) ----
    var yogaStudio = new YogaStudio(game, {
      x: 39*16, y: 11*16,
      onDestroy: onMachineDestroy
    });
    game.addEntity(yogaStudio);
    self._machines.push(yogaStudio);

    // ---- ZONE 3: 4 Spin Bikes (inside spinning room, 2x2 grid) ----
    var spinPositions = [
      { x: 22*16, y: 12*16 },
      { x: 26*16, y: 12*16 },
      { x: 30*16, y: 12*16 },
      { x: 26*16, y: 16*16 }
    ];
    for (var si = 0; si < spinPositions.length; si++) {
      var sb = new SpinBike(game, {
        x: spinPositions[si].x, y: spinPositions[si].y,
        onDestroy: onMachineDestroy
      });
      game.addEntity(sb);
      self._machines.push(sb);
    }

    // ---- ZONE 4: 3 Bench Presses (bottom-left, spaced) ----
    var benchPositions = [
      { x: 4*16, y: 35*16 },
      { x: 10*16, y: 35*16 },
      { x: 16*16, y: 35*16 }
    ];
    for (var bi = 0; bi < benchPositions.length; bi++) {
      var bp = new BenchPressStation(game, {
        x: benchPositions[bi].x, y: benchPositions[bi].y,
        onDestroy: onMachineDestroy
      });
      game.addEntity(bp);
      self._machines.push(bp);
    }

    // ---- ZONE 5: 1 Big Pool (spawns 6 confined dolphins) ----
    var bigPool = new BigPool(game, {
      x: 36*16, y: 31*16,
      onDestroy: onMachineDestroy
    });
    game.addEntity(bigPool);
    self._machines.push(bigPool);
  }

  _spawnBoss() {
    var game = this.game;
    var self = this;

    game.hud.addChatMessage("ALL ZONES CLEARED!", "#50c878");
    game.camera.shake(6, 0.5);

    setTimeout(function() {
      game.startDialogue([
        { speaker: "???", text: "You think you can wreck MY gym?!" },
        { speaker: "Aerobics King", text: "I am the AEROBICS KING! Feel my cardio BURN!" },
        { speaker: "Alice", text: "Bring it on, dance boy!" }
      ], function() {
        var boss = new AerobicsKingBoss(game, {
          x: 30*16, y: 25*16,
          onDeath: function() {
            self._showVictory();
          }
        });
        self._boss = boss;
        game.addEntity(boss);
        game.hud.setBoss(boss, "Aerobics King Instructor");
        setTimeout(function() { if(game.sound) game.sound.playBGM("aerobic_boss"); }, 500);
      });
    }, 1500);
  }

  _showVictory() {
    var game = this.game;
    var self = this;
    this._victoryShown = true;

    if (game.sound) game.sound.stopBGM();
    game.camera.shake(12, 1.0);

    setTimeout(function() {
      game.startDialogue([
        { speaker: "Aerobics King", text: "Impossible... my cardio... was... maximum..." },
        { speaker: "Alice", text: "Looks like your membership just got CANCELLED!" },
        { speaker: "System", text: "Stage 2 - 2F Complete! Fitness First conquered!" },
        { speaker: "System", text: "Congratulations! You cleared the entire shopping centre!" }
      ], function() {
        game.hud.addChatMessage("STAGE 2 COMPLETE! You've conquered Top Ryde City!", "#50c878");
        if(game.transition)game.transition.startFade(function(){if(self._onComplete)self._onComplete("complete")});
        else if(self._onComplete)self._onComplete("complete");
      });
    }, 1000);
  }

  update(dt) {
    if (!this.game) return;
    this._age += dt;
  }

  render(ctx, camera) {
    if (!this.game) return;

    // Fitness First red accent lights on ceiling
    for (var lx = 3; lx < this._mapW-3; lx += 10) {
      for (var ly = 2; ly < this._mapH-2; ly += 12) {
        var sp = camera.worldToScreen(lx*16, ly*16);
        var flicker = 0.2 + Math.sin(this._age*2+lx+ly)*0.15;
        ctx.fillStyle = "rgba(220,40,40," + flicker + ")";
        ctx.fillRect(sp.x, sp.y, 40, 2);
      }
    }

    // Zone labels on map
    var zones = [
      { x: 5, y: 18, label: "TREADMILL ZONE" },
      { x: 41, y: 11, label: "YOGA STUDIO" },
      { x: 24, y: 11, label: "SPINNING ROOM" },
      { x: 5, y: 33, label: "BENCH PRESS" },
      { x: 38, y: 29, label: "SWIMMING POOL" }
    ];
    ctx.font = "7px Courier New"; ctx.textAlign = "center";
    for (var zi = 0; zi < zones.length; zi++) {
      var zsp = camera.worldToScreen(zones[zi].x*16, zones[zi].y*16);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(zones[zi].label, zsp.x+24, zsp.y);
    }

    // Machine counter UI
    ctx.fillStyle = "#fff";
    ctx.font = "9px Courier New"; ctx.textAlign = "left";
    ctx.fillText("Machines: " + this._machinesDestroyed + "/" + this._totalMachines, 8, 310);

    // Boss gate message
    if (!this._bossTriggered && this._machinesDestroyed < this._totalMachines) {
      var remaining = this._totalMachines - this._machinesDestroyed;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(130, 300, 220, 16);
      ctx.fillStyle = "#f0d060";
      ctx.font = "8px Courier New"; ctx.textAlign = "center";
      ctx.fillText("Destroy " + remaining + " more machine(s) to unlock BOSS!", 240, 310);
    }
  }
}
