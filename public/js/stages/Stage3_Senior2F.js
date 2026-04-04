/* ================================================================
   Stage 3 - Senior 2F: Ryde Public School Senior Class 2nd Floor
   Side-scroll stage. Year 6 classrooms + Miss Kumarwitch boss arena.
   Darker, creepier atmosphere - flickering lights, bugs crawling.

   Layout (worldWidth: 5600):
     Section 1 (x:0-1600):    Classroom - 7 bugs + 3 seniors + 2 moths + 1 mimic
     Section 2 (x:1600-3200): Classroom - 8 bugs + 4 seniors + 3 moths + 1 mimic + 2 ink
     Section 3 (x:3200-4400): Classroom - 9 bugs + 3 seniors + 2 moths + 1 mimic + 2 ink
     Boss Arena (x:4400-5600): Miss Kumarwitch's lair (spider form)

   Shortcut: Shift+W loads this stage
   ================================================================ */

/* ========== BUG CREATURE ========== */
class BugCreature extends Enemy {
  constructor(game, cfg) {
    var bugType = cfg.bugType || "cockroach";
    var colors = { cockroach: "#5c3318", spider: "#1a1a1a", centipede: "#7a3020" };
    super(game, {
      x: cfg.x, y: cfg.y,
      width: 16, height: 12,
      speed: 2.2,
      color: colors[bugType] || "#5c3318",
      enemyType: "bugCreature",
      name: bugType.charAt(0).toUpperCase() + bugType.slice(1),
      hp: 15, atk: 7, def: 1,
      contactDamage: 8,
      ai: "chase",
      aggroRange: 80,
      expReward: 4
    });
    this.bugType = bugType;
    this._age = 0;
    this._legFrame = 0;
  }
  update(dt) {
    if (!this.alive || !this.active) return;
    this._age += dt;
    this._legFrame = Math.floor(this._age * 12) % 4;
    super.update(dt);
  }
  render(ctx, camera) {
    if (!this.alive || !this.visible) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x + this.width < 0 || sp.x > 480) return;
    var sx = sp.x, sy = sp.y;
    var lf = this._legFrame;

    if (this.bugType === "cockroach") {
      // Brown oval body
      ctx.fillStyle = "#5c3318";
      ctx.fillRect(sx + 3, sy + 2, 10, 8);
      ctx.fillStyle = "#7a4a28";
      ctx.fillRect(sx + 4, sy + 3, 8, 6);
      // Legs (3 pairs, animated)
      ctx.fillStyle = "#3a2010";
      for (var i = 0; i < 3; i++) {
        var off = (lf + i) % 4 < 2 ? -1 : 1;
        ctx.fillRect(sx + 3 + i * 3, sy + 10, 1, 2 + off);
        ctx.fillRect(sx + 10 + i * 1, sy + 10, 1, 2 - off);
      }
      // Antennae
      ctx.fillStyle = "#3a2010";
      ctx.fillRect(sx + 2, sy, 1, 3);
      ctx.fillRect(sx + 13, sy, 1, 3);
    } else if (this.bugType === "spider") {
      // Black round body
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(sx + 4, sy + 2, 8, 8);
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(sx + 5, sy + 3, 6, 6);
      // 8 legs (4 per side)
      ctx.fillStyle = "#111";
      for (var i = 0; i < 4; i++) {
        var off = (lf + i) % 4 < 2 ? -1 : 1;
        ctx.fillRect(sx + 1 + i * 1, sy + 4 + i * 1, 3, 1);
        ctx.fillRect(sx + 1 + i * 1, sy + 5 + i * 1 + off, 1, 2);
        ctx.fillRect(sx + 12 - i * 1, sy + 4 + i * 1, 3, 1);
        ctx.fillRect(sx + 14 - i * 1, sy + 5 + i * 1 - off, 1, 2);
      }
      // Red eyes
      ctx.fillStyle = "#f00";
      ctx.fillRect(sx + 6, sy + 4, 1, 1);
      ctx.fillRect(sx + 9, sy + 4, 1, 1);
    } else {
      // Centipede: long red-brown body
      ctx.fillStyle = "#7a3020";
      ctx.fillRect(sx + 1, sy + 4, 14, 4);
      ctx.fillStyle = "#9a4a30";
      for (var i = 0; i < 5; i++) {
        ctx.fillRect(sx + 1 + i * 3, sy + 4, 2, 4);
      }
      // Many legs
      ctx.fillStyle = "#5a2010";
      for (var i = 0; i < 6; i++) {
        var off = (lf + i) % 4 < 2 ? 0 : 1;
        ctx.fillRect(sx + 1 + i * 2, sy + 8, 1, 2 + off);
      }
      // Antennae
      ctx.fillStyle = "#5a2010";
      ctx.fillRect(sx, sy + 3, 2, 1);
      ctx.fillRect(sx, sy + 2, 1, 1);
    }

    // HP bar
    if (this.hp < this.maxHp) {
      ctx.fillStyle = "#300";
      ctx.fillRect(sp.x, sp.y - 4, this.width, 2);
      ctx.fillStyle = "#e84855";
      ctx.fillRect(sp.x, sp.y - 4, Math.floor(this.width * (this.hp / this.maxHp)), 2);
    }
  }
}

/* ========== ZOMBIE SENIOR (Year 6) ========== */
class ZombieSenior extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: 32, height: 36,
      speed: 1.32,
      color: "#4a7a4a",
      enemyType: "zombieSenior",
      name: "Zombie Year 6",
      hp: 35, atk: 13, def: 4,
      contactDamage: 15,
      ai: "stationary",
      aggroRange: 120,
      expReward: 12
    });
    this._activated = false;
    this._age = 0;
    this._legFrame = 0;
    this.direction = "left"; // facing away initially
    this.chaseSpeed = 1.32 * 1.4;
  }
  update(dt) {
    if (!this.alive || !this.active) return;
    this._age += dt;
    this._legFrame = Math.floor(this._age * 6) % 4;

    var p = this.game.localPlayer;
    if (!p || !p.alive) return;

    // Activate when player passes (player is to the right of this enemy)
    if (!this._activated) {
      if (p.x > this.x - 32) {
        this._activated = true;
        this.ai = "chase";
        this.aggroed = true;
        this.direction = "right";
        if (this.game.sound) {
          try {
            var s = this.game.sound;
            if (s.ctx && !s.muted) {
              var t = s.ctx.currentTime;
              var o = s.ctx.createOscillator(), g = s.ctx.createGain();
              o.type = "sawtooth";
              o.frequency.setValueAtTime(150, t);
              o.frequency.exponentialRampToValueAtTime(80, t + 0.2);
              g.gain.setValueAtTime(0.15, t);
              g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
              o.connect(g); g.connect(s.sfxGain);
              o.start(t); o.stop(t + 0.2);
            }
          } catch (e) {}
        }
      }
      return;
    }

    // Chase from behind
    this._chase(p, dt);
  }
  render(ctx, camera) {
    if (!this.alive || !this.visible) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x + this.width < 0 || sp.x > 480) return;
    var sx = sp.x, sy = sp.y;
    var lf = this._legFrame;
    var faceRight = this.direction === "right";

    // Legs (green zombie skin, grey shorts)
    var legOff = this._activated ? ((lf % 2 === 0) ? 2 : -2) : 0;
    ctx.fillStyle = "#4a7a4a";
    ctx.fillRect(sx + 8, sy + 24, 6, 12 + legOff);
    ctx.fillRect(sx + 18, sy + 24, 6, 12 - legOff);
    // Grey shorts
    ctx.fillStyle = "#555";
    ctx.fillRect(sx + 6, sy + 20, 20, 6);

    // Body - pale blue polo (torn/dirty)
    ctx.fillStyle = "#8aaac8";
    ctx.fillRect(sx + 6, sy + 8, 20, 14);
    // Torn effect - dark patches
    ctx.fillStyle = "#6a8aa0";
    ctx.fillRect(sx + 8, sy + 12, 4, 3);
    ctx.fillRect(sx + 18, sy + 10, 3, 4);
    // Dirt patches
    ctx.fillStyle = "#5a6a50";
    ctx.fillRect(sx + 12, sy + 15, 3, 2);
    ctx.fillRect(sx + 22, sy + 12, 2, 3);

    // Arms (green zombie skin)
    ctx.fillStyle = "#4a7a4a";
    var armOff = this._activated ? Math.sin(this._age * 6) * 3 : 0;
    ctx.fillRect(sx + 2, sy + 10 + armOff, 5, 10);
    ctx.fillRect(sx + 25, sy + 10 - armOff, 5, 10);

    // Head (green zombie skin)
    ctx.fillStyle = "#5a9a5a";
    ctx.fillRect(sx + 8, sy, 16, 10);
    // Hair (dark, messy)
    ctx.fillStyle = "#2a2a1a";
    ctx.fillRect(sx + 7, sy - 2, 18, 4);
    // Eyes (red zombie eyes)
    ctx.fillStyle = "#f44";
    if (faceRight) {
      ctx.fillRect(sx + 17, sy + 3, 3, 2);
      ctx.fillRect(sx + 21, sy + 3, 3, 2);
    } else {
      ctx.fillRect(sx + 8, sy + 3, 3, 2);
      ctx.fillRect(sx + 12, sy + 3, 3, 2);
    }
    // Mouth
    ctx.fillStyle = "#300";
    ctx.fillRect(sx + 12, sy + 7, 8, 2);

    // "!" indicator if not activated yet
    if (!this._activated) {
      ctx.fillStyle = "#888";
      ctx.font = "7px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("zzZ", sx + 16, sy - 6);
    }

    // HP bar
    if (this.hp < this.maxHp) {
      ctx.fillStyle = "#300";
      ctx.fillRect(sp.x, sp.y - 5, this.width, 3);
      ctx.fillStyle = "#e84855";
      ctx.fillRect(sp.x, sp.y - 5, Math.floor(this.width * (this.hp / this.maxHp)), 3);
    }
  }
}

/* ========== FLYING MOTH ========== */
class FlyingMoth extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: 18, height: 14,
      speed: 2.75,
      color: "#8a7a6a",
      enemyType: "flyingMoth",
      name: "Giant Moth",
      hp: 12, atk: 9, def: 0,
      contactDamage: 10,
      ai: "chase",
      aggroRange: 100,
      expReward: 6
    });
    this._age = 0;
    this._wingFrame = 0;
    this._baseY = cfg.y;
    this._swooping = false;
    this._swoopTimer = 0;
    this._swoopCooldown = 0;
  }
  update(dt) {
    if (!this.alive || !this.active) return;
    this._age += dt;
    this._wingFrame = Math.floor(this._age * 10) % 4;

    var p = this.game.localPlayer;
    if (!p || !p.alive) return;

    var dx = p.x - this.x;
    var dist = Math.abs(dx);

    // Sine wave flight pattern
    this.y = this._baseY - 30 + Math.sin(this._age * 2.5) * 18;

    // Swoop attack when close
    this._swoopCooldown -= dt;
    if (!this._swooping && dist < 80 && this._swoopCooldown <= 0) {
      this._swooping = true;
      this._swoopTimer = 0.6;
    }
    if (this._swooping) {
      this._swoopTimer -= dt;
      this.y += 80 * dt;
      if (this._swoopTimer <= 0) {
        this._swooping = false;
        this._swoopCooldown = 2.0;
      }
    }

    // Horizontal chase
    if (dist > 8) {
      this.x += (dx > 0 ? 1 : -1) * this.speed * dt * 60;
    }

    this._checkPlayerCollision(p);
  }
  _checkPlayerCollision(p) {
    if (!p || !p.alive || p.invincible) return;
    var cx = this.x + this.width / 2, cy = this.y + this.height / 2;
    var px = p.x + p.width / 2, py = p.y + p.height / 2;
    var dist = Math.sqrt((cx - px) * (cx - px) + (cy - py) * (cy - py));
    if (dist < 18) {
      p.takeDamage(this.contactDamage, { x: this.x, y: this.y });
    }
  }
  render(ctx, camera) {
    if (!this.alive || !this.visible) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x + this.width < 0 || sp.x > 480) return;
    var sx = sp.x, sy = sp.y;
    var wf = this._wingFrame;

    // Body (fuzzy grey-brown)
    ctx.fillStyle = "#7a6a5a";
    ctx.fillRect(sx + 6, sy + 4, 6, 8);
    ctx.fillStyle = "#8a7a6a";
    ctx.fillRect(sx + 7, sy + 5, 4, 6);

    // Wings (fluttering)
    var wingUp = wf < 2;
    ctx.fillStyle = "#9a8a78";
    if (wingUp) {
      // Wings up
      ctx.fillRect(sx, sy + 1, 7, 6);
      ctx.fillRect(sx + 11, sy + 1, 7, 6);
      ctx.fillStyle = "#b0a090";
      ctx.fillRect(sx + 1, sy + 2, 5, 4);
      ctx.fillRect(sx + 12, sy + 2, 5, 4);
    } else {
      // Wings down
      ctx.fillRect(sx, sy + 5, 7, 6);
      ctx.fillRect(sx + 11, sy + 5, 7, 6);
      ctx.fillStyle = "#b0a090";
      ctx.fillRect(sx + 1, sy + 6, 5, 4);
      ctx.fillRect(sx + 12, sy + 6, 5, 4);
    }

    // Wing patterns (small dots)
    ctx.fillStyle = "#6a5a4a";
    ctx.fillRect(sx + 3, sy + (wingUp ? 3 : 7), 2, 2);
    ctx.fillRect(sx + 13, sy + (wingUp ? 3 : 7), 2, 2);

    // Head + antennae
    ctx.fillStyle = "#6a5a4a";
    ctx.fillRect(sx + 7, sy + 2, 4, 3);
    ctx.fillRect(sx + 6, sy, 1, 3);
    ctx.fillRect(sx + 11, sy, 1, 3);

    // Eyes (small white dots)
    ctx.fillStyle = "#fff";
    ctx.fillRect(sx + 7, sy + 3, 1, 1);
    ctx.fillRect(sx + 10, sy + 3, 1, 1);

    // HP bar
    if (this.hp < this.maxHp) {
      ctx.fillStyle = "#300";
      ctx.fillRect(sp.x, sp.y - 4, this.width, 2);
      ctx.fillStyle = "#e84855";
      ctx.fillRect(sp.x, sp.y - 4, Math.floor(this.width * (this.hp / this.maxHp)), 2);
    }
  }
}

/* ========== DESK MIMIC ========== */
class DeskMimic extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: 32, height: 24,
      speed: 0.66,
      color: "#8a6a40",
      enemyType: "deskMimic",
      name: "Desk Mimic",
      hp: 40, atk: 17, def: 9,
      contactDamage: 20,
      ai: "stationary",
      aggroRange: 60,
      expReward: 15
    });
    this._activated = false;
    this._age = 0;
    this._legFrame = 0;
    this._shakeTimer = 0;
  }
  update(dt) {
    if (!this.alive || !this.active) return;
    this._age += dt;

    var p = this.game.localPlayer;
    if (!p || !p.alive) return;

    if (!this._activated) {
      var dx = p.x - this.x;
      var dy = p.y - this.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 60) {
        this._activated = true;
        this._shakeTimer = 0.4;
        this.ai = "chase";
        this.aggroed = true;
        if (this.game.sound) {
          try {
            var s = this.game.sound;
            if (s.ctx && !s.muted) {
              var t = s.ctx.currentTime;
              var o = s.ctx.createOscillator(), g = s.ctx.createGain();
              o.type = "square";
              o.frequency.setValueAtTime(200, t);
              o.frequency.exponentialRampToValueAtTime(60, t + 0.3);
              g.gain.setValueAtTime(0.18, t);
              g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
              o.connect(g); g.connect(s.sfxGain);
              o.start(t); o.stop(t + 0.3);
            }
          } catch (e) {}
        }
        this.game.combat.spawnDamageNumber(this.x + 8, this.y - 10, "!!", "#f44");
      }
      return;
    }

    this._shakeTimer -= dt;
    this._legFrame = Math.floor(this._age * 5) % 4;
    this._chase(p, dt);
  }
  render(ctx, camera) {
    if (!this.alive || !this.visible) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x + this.width < 0 || sp.x > 480) return;
    var sx = sp.x, sy = sp.y;
    var shake = this._shakeTimer > 0 ? (Math.random() - 0.5) * 3 : 0;
    sx += shake;

    if (!this._activated) {
      // Looks like a normal desk
      // Desk top
      ctx.fillStyle = "#8a6a40";
      ctx.fillRect(sx + 1, sy + 4, 30, 5);
      ctx.fillStyle = "#a07a50";
      ctx.fillRect(sx + 2, sy + 5, 28, 3);
      // Desk legs (static)
      ctx.fillStyle = "#6a5030";
      ctx.fillRect(sx + 3, sy + 9, 3, 15);
      ctx.fillRect(sx + 26, sy + 9, 3, 15);
      // Drawer
      ctx.fillStyle = "#7a5a38";
      ctx.fillRect(sx + 8, sy + 9, 16, 8);
      ctx.fillStyle = "#9a7a50";
      ctx.fillRect(sx + 14, sy + 12, 4, 2);
    } else {
      // Activated - desk with legs and angry face
      var lf = this._legFrame;
      var legOff = (lf % 2 === 0) ? 2 : -2;

      // Desk top (body)
      ctx.fillStyle = "#8a6a40";
      ctx.fillRect(sx + 1, sy + 2, 30, 8);
      ctx.fillStyle = "#a07a50";
      ctx.fillRect(sx + 2, sy + 3, 28, 6);

      // Sprouted legs (4 legs, animated)
      ctx.fillStyle = "#6a4020";
      ctx.fillRect(sx + 2, sy + 10, 4, 10 + legOff);
      ctx.fillRect(sx + 10, sy + 10, 4, 10 - legOff);
      ctx.fillRect(sx + 18, sy + 10, 4, 10 + legOff);
      ctx.fillRect(sx + 26, sy + 10, 4, 10 - legOff);

      // Angry face on front
      ctx.fillStyle = "#f44";
      ctx.fillRect(sx + 8, sy + 4, 4, 2);
      ctx.fillRect(sx + 20, sy + 4, 4, 2);
      // Angry eyebrows
      ctx.fillStyle = "#300";
      ctx.fillRect(sx + 7, sy + 3, 5, 1);
      ctx.fillRect(sx + 20, sy + 3, 5, 1);
      // Mouth (jagged)
      ctx.fillStyle = "#300";
      ctx.fillRect(sx + 10, sy + 7, 12, 2);
      ctx.fillStyle = "#fff";
      ctx.fillRect(sx + 12, sy + 7, 2, 1);
      ctx.fillRect(sx + 16, sy + 7, 2, 1);
      ctx.fillRect(sx + 20, sy + 7, 2, 1);
    }

    // HP bar (only show when activated and damaged)
    if (this._activated && this.hp < this.maxHp) {
      ctx.fillStyle = "#300";
      ctx.fillRect(sp.x, sp.y - 4, this.width, 3);
      ctx.fillStyle = "#e84855";
      ctx.fillRect(sp.x, sp.y - 4, Math.floor(this.width * (this.hp / this.maxHp)), 3);
    }
  }
}

/* ========== INK BLOB ========== */
class InkBlob extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: 16, height: 14,
      speed: 1.98,
      color: "#1a1a3a",
      enemyType: "inkBlob",
      name: "Ink Blob",
      hp: 18, atk: 10, def: 2,
      contactDamage: 8,
      ai: "chase",
      aggroRange: 90,
      expReward: 7
    });
    this._age = 0;
    this._blobFrame = 0;
    this._inkTrail = [];
    this._trailTimer = 0;
  }
  update(dt) {
    if (!this.alive || !this.active) return;
    this._age += dt;
    this._blobFrame = Math.floor(this._age * 6) % 4;

    // Leave ink trail
    this._trailTimer -= dt;
    if (this._trailTimer <= 0) {
      this._trailTimer = 0.3;
      this._inkTrail.push({ x: this.x + this.width / 2, y: this.y + this.height, age: 0 });
      if (this._inkTrail.length > 20) this._inkTrail.shift();
    }
    for (var i = this._inkTrail.length - 1; i >= 0; i--) {
      this._inkTrail[i].age += dt;
      if (this._inkTrail[i].age > 4) { this._inkTrail.splice(i, 1); }
    }

    super.update(dt);
  }
  render(ctx, camera) {
    if (!this.alive || !this.visible) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x + this.width < 0 || sp.x > 480) return;
    var sx = sp.x, sy = sp.y;
    var bf = this._blobFrame;

    // Ink trail (visual only)
    for (var i = 0; i < this._inkTrail.length; i++) {
      var t = this._inkTrail[i];
      var tp = camera.worldToScreen(t.x, t.y);
      if (tp.x < -8 || tp.x > 488) continue;
      var alpha = Math.max(0, 1 - t.age / 4);
      ctx.fillStyle = "rgba(20,20,50," + (alpha * 0.5).toFixed(2) + ")";
      ctx.fillRect(tp.x - 2, tp.y - 1, 5, 2);
    }

    // Amorphous blob body (shifts shape with frame)
    var wobble = bf < 2 ? 1 : -1;
    ctx.fillStyle = "#1a1a3a";
    ctx.fillRect(sx + 2 - wobble, sy + 2, 12 + wobble * 2, 10);
    ctx.fillStyle = "#222248";
    ctx.fillRect(sx + 3, sy + 3, 10, 8);
    // Blobby edges
    ctx.fillStyle = "#1a1a3a";
    ctx.fillRect(sx + 1, sy + 5, 2, 4);
    ctx.fillRect(sx + 13 + wobble, sy + 5, 2, 4);
    ctx.fillRect(sx + 4, sy + 11, 8, 2 + (bf % 2));

    // Dark blue sheen
    ctx.fillStyle = "#2a2a5a";
    ctx.fillRect(sx + 5, sy + 4, 3, 2);

    // White eyes
    ctx.fillStyle = "#fff";
    ctx.fillRect(sx + 5, sy + 5, 2, 3);
    ctx.fillRect(sx + 10, sy + 5, 2, 3);
    // Pupils
    ctx.fillStyle = "#111";
    ctx.fillRect(sx + 5, sy + 6, 1, 2);
    ctx.fillRect(sx + 11, sy + 6, 1, 2);

    // HP bar
    if (this.hp < this.maxHp) {
      ctx.fillStyle = "#300";
      ctx.fillRect(sp.x, sp.y - 4, this.width, 2);
      ctx.fillStyle = "#e84855";
      ctx.fillRect(sp.x, sp.y - 4, Math.floor(this.width * (this.hp / this.maxHp)), 2);
    }
  }
}

/* ========== SCHOOL SPIDER ========== */
class SchoolSpider extends Enemy {
  constructor(g, c) {
    super(g, {
      ...c,
      enemyType: "schoolSpider",
      name: "Spider",
      hp: c.hp || 18,
      atk: c.atk || 8,
      def: c.def || 1,
      speed: c.speed || 2.42,
      contactDamage: c.contactDamage || 9,
      color: "#1a1a1a",
      aggroRange: 100,
      ai: "chase",
      expReward: 4,
      width: 20,
      height: 16
    });
    this._age = 0;
    this._legFrame = 0;
    this._bodyColor = c.bodyColor || ["#1a1a1a","#2a1a10","#3a2a1a","#1a0a0a"][Math.floor(Math.random()*4)];
    this._eyeColor = ["#ff0000","#ff4444","#ffaa00","#44ff44"][Math.floor(Math.random()*4)];
    this._size = 0.8 + Math.random() * 0.5;
  }
  update(dt) {
    if (!this.alive || !this.active) return;
    this._age += dt;
    this._legFrame = Math.floor(this._age * 14) % 8;
    super.update(dt);
  }
  render(ctx, camera) {
    if (!this.alive || !this.visible) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x + 24 < 0 || sp.x > 500) return;
    var sx = sp.x, sy = sp.y, sc = this._size;
    var lf = this._legFrame;
    ctx.save();
    /* 8 Legs with 2 segments each */
    ctx.strokeStyle = this._bodyColor;
    ctx.lineWidth = Math.max(1, 1.5 * sc);
    for (var i = 0; i < 4; i++) {
      var baseY = sy + 4*sc + i * 3*sc;
      var wave = Math.sin(this._age * 10 + i * 1.8) * 2*sc;
      var wave2 = Math.sin(this._age * 10 + i * 1.8 + 1) * 1.5*sc;
      var lx1 = sx - 2*sc, ly1 = baseY;
      var lx2 = sx - 7*sc, ly2 = baseY + wave;
      var lx3 = sx - 11*sc, ly3 = baseY + wave + 3*sc;
      ctx.beginPath(); ctx.moveTo(lx1,ly1); ctx.lineTo(lx2,ly2); ctx.lineTo(lx3,ly3); ctx.stroke();
      ctx.fillStyle = this._bodyColor;
      ctx.fillRect(Math.floor(lx2)-1, Math.floor(ly2)-1, 2, 2);
      var rx1 = sx + 20*sc + 2*sc, ry1 = baseY;
      var rx2 = sx + 20*sc + 7*sc, ry2 = baseY + wave2;
      var rx3 = sx + 20*sc + 11*sc, ry3 = baseY + wave2 + 3*sc;
      ctx.beginPath(); ctx.moveTo(rx1,ry1); ctx.lineTo(rx2,ry2); ctx.lineTo(rx3,ry3); ctx.stroke();
      ctx.fillRect(Math.floor(rx2)-1, Math.floor(ry2)-1, 2, 2);
    }
    /* Cephalothorax */
    ctx.fillStyle = this._bodyColor;
    var headW = 10*sc, headH = 7*sc;
    ctx.beginPath();
    ctx.ellipse(sx + 10*sc, sy + 5*sc, headW/2, headH/2, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.ellipse(sx + 9*sc, sy + 3.5*sc, headW/4, headH/4, 0, 0, Math.PI*2);
    ctx.fill();
    /* Abdomen */
    ctx.fillStyle = this._bodyColor;
    var abdW = 12*sc, abdH = 9*sc;
    ctx.beginPath();
    ctx.ellipse(sx + 10*sc, sy + 11*sc, abdW/2, abdH/2, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.ellipse(sx + 10*sc, sy + 10*sc, abdW/3, abdH/3, 0, 0, Math.PI*2);
    ctx.fill();
    /* Hourglass marking */
    ctx.fillStyle = "rgba(200,50,50,0.4)";
    ctx.fillRect(sx + 9*sc, sy + 9*sc, 2*sc, 4*sc);
    /* Eyes (8 eyes in 2 rows) */
    ctx.fillStyle = this._eyeColor;
    var glow = 0.6 + Math.sin(this._age*5)*0.4;
    ctx.globalAlpha = glow;
    ctx.fillRect(sx+5*sc, sy+2*sc, 2*sc, 2*sc);
    ctx.fillRect(sx+8*sc, sy+1.5*sc, 2.5*sc, 2.5*sc);
    ctx.fillRect(sx+11*sc, sy+1.5*sc, 2.5*sc, 2.5*sc);
    ctx.fillRect(sx+14*sc, sy+2*sc, 2*sc, 2*sc);
    ctx.fillRect(sx+6*sc, sy+4*sc, 1.5*sc, 1.5*sc);
    ctx.fillRect(sx+9*sc, sy+4.5*sc, 1.5*sc, 1.5*sc);
    ctx.fillRect(sx+12*sc, sy+4.5*sc, 1.5*sc, 1.5*sc);
    ctx.fillRect(sx+15*sc, sy+4*sc, 1.5*sc, 1.5*sc);
    ctx.globalAlpha = 1;
    /* Fangs */
    ctx.fillStyle = "#ddd";
    ctx.fillRect(sx+8*sc, sy+6*sc, 1.5*sc, 2.5*sc);
    ctx.fillRect(sx+12*sc, sy+6*sc, 1.5*sc, 2.5*sc);
    /* Spinnerets */
    ctx.fillStyle = "rgba(180,180,180,0.3)";
    ctx.fillRect(sx+9*sc, sy+15*sc, 3*sc, 1.5*sc);
    ctx.restore();
    /* HP bar */
    if (this.hp < this.maxHp) {
      var pr = this.hp / this.maxHp;
      ctx.fillStyle = "#300";
      ctx.fillRect(sx, sy - 4, 20, 2);
      ctx.fillStyle = "#e84855";
      ctx.fillRect(sx, sy - 4, Math.floor(20 * pr), 2);
    }
  }
}

/* ========== SCHOOL SCORPION ========== */
class SchoolScorpion extends Enemy {
  constructor(g, c) {
    super(g, {
      ...c,
      enemyType: "schoolScorpion",
      name: "Scorpion",
      hp: c.hp || 25,
      atk: c.atk || 11,
      def: c.def || 3,
      speed: c.speed || 1.98,
      contactDamage: c.contactDamage || 12,
      color: "#5a3a1a",
      aggroRange: 90,
      ai: "chase",
      expReward: 6,
      width: 18,
      height: 14
    });
    this._age = 0;
    this._legFrame = 0;
    this._tailPhase = 0;
  }
  update(dt) {
    if (!this.alive || !this.active) return;
    this._age += dt;
    this._legFrame = Math.floor(this._age * 12) % 4;
    this._tailPhase += dt * 3;
    super.update(dt);
  }
  render(ctx, camera) {
    if (!this.alive || !this.visible) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x + this.width < 0 || sp.x > 480) return;
    var sx = sp.x, sy = sp.y;
    var lf = this._legFrame;
    var tailSwing = Math.sin(this._tailPhase) * 3;

    /* Body - dark brown oval */
    ctx.fillStyle = "#5a3a1a";
    ctx.fillRect(sx + 4, sy + 5, 10, 7);
    ctx.fillStyle = "#6a4a28";
    ctx.fillRect(sx + 5, sy + 6, 8, 5);

    /* Segmented body plates */
    ctx.fillStyle = "#4a2a10";
    ctx.fillRect(sx + 5, sy + 6, 8, 1);
    ctx.fillRect(sx + 5, sy + 8, 8, 1);

    /* 8 legs (4 per side, animated) */
    ctx.fillStyle = "#3a2010";
    for (var i = 0; i < 4; i++) {
      var off = (lf + i) % 4 < 2 ? -1 : 1;
      ctx.fillRect(sx + 2 + i * 2, sy + 12, 1, 2 + off);
      ctx.fillRect(sx + 11 + i * 2, sy + 12, 1, 2 - off);
    }

    /* Pincers (front claws) */
    ctx.fillStyle = "#5a3a1a";
    /* Left pincer */
    ctx.fillRect(sx, sy + 4, 4, 2);
    ctx.fillRect(sx - 1, sy + 3, 2, 2);
    ctx.fillRect(sx, sy + 2, 2, 2);
    /* Right pincer */
    ctx.fillRect(sx + 14, sy + 4, 4, 2);
    ctx.fillRect(sx + 17, sy + 3, 2, 2);
    ctx.fillRect(sx + 16, sy + 2, 2, 2);

    /* Pincer tips (darker) */
    ctx.fillStyle = "#2a1508";
    ctx.fillRect(sx - 1, sy + 2, 1, 2);
    ctx.fillRect(sx + 18, sy + 2, 1, 2);

    /* Tail - curling upward with segments */
    ctx.fillStyle = "#5a3a1a";
    var tx = sx + 8 + tailSwing * 0.3;
    ctx.fillRect(tx, sy + 1, 3, 5);
    ctx.fillRect(tx + tailSwing * 0.2, sy - 2, 3, 4);
    ctx.fillRect(tx + tailSwing * 0.4, sy - 5, 3, 4);
    /* Tail segments (darker rings) */
    ctx.fillStyle = "#4a2a10";
    ctx.fillRect(tx, sy + 3, 3, 1);
    ctx.fillRect(tx + tailSwing * 0.2, sy, 3, 1);
    ctx.fillRect(tx + tailSwing * 0.4, sy - 3, 3, 1);

    /* Stinger (bright, dangerous) */
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(tx + tailSwing * 0.5, sy - 7, 2, 3);
    ctx.fillStyle = "#cc2222";
    ctx.fillRect(tx + tailSwing * 0.5, sy - 8, 1, 2);

    /* Eyes (small, dark) */
    ctx.fillStyle = "#111";
    ctx.fillRect(sx + 5, sy + 5, 1, 1);
    ctx.fillRect(sx + 12, sy + 5, 1, 1);

    /* HP bar */
    if (this.hp < this.maxHp) {
      ctx.fillStyle = "#300";
      ctx.fillRect(sp.x, sp.y - 4, this.width, 2);
      ctx.fillStyle = "#e84855";
      ctx.fillRect(sp.x, sp.y - 4, Math.floor(this.width * (this.hp / this.maxHp)), 2);
    }
  }
}

/* ========== WEB PROJECTILE ========== */
class WebProjectile extends Entity {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: 10, height: 10,
      speed: 0,
      color: "#ccc",
      type: "projectile",
      tags: ["projectile", "enemyProjectile"]
    });
    this.vx = cfg.vx || 0;
    this.vy = cfg.vy || 0;
    this.damage = cfg.damage || 10;
    this.slowDuration = 3.0;
    this.slowFactor = 0.5;
    this._age = 0;
    this._lifetime = 5;
    this.alive = true;
  }
  update(dt) {
    if (!this.alive) return;
    this._age += dt;
    if (this._age > this._lifetime) { this.alive = false; this.destroy(); return; }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    var p = this.game.localPlayer;
    if (!p || !p.alive || p.invincible) return;
    var dx = (p.x + p.width / 2) - (this.x + 5);
    var dy = (p.y + p.height / 2) - (this.y + 5);
    if (Math.sqrt(dx * dx + dy * dy) < 20) {
      p.takeDamage(this.damage, { x: this.x, y: this.y });
      // Apply slow
      p._webSlowed = true;
      p._webSlowTimer = this.slowDuration;
      p._origSpeed = p._origSpeed || p.speed;
      p.speed = p._origSpeed * this.slowFactor;
      this.game.hud.addChatMessage("Stuck in web! Speed reduced!", "#aaa");
      this.game.combat.spawnDamageNumber(p.x + 8, p.y - 12, "SLOWED!", "#ccc");
      this.alive = false;
      this.destroy();
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -16 || sp.x > 496) return;
    // White/grey web sprite
    ctx.fillStyle = "rgba(220,220,220,0.9)";
    ctx.fillRect(sp.x + 2, sp.y + 2, 6, 6);
    // Web strands
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y); ctx.lineTo(sp.x + 10, sp.y + 10);
    ctx.moveTo(sp.x + 10, sp.y); ctx.lineTo(sp.x, sp.y + 10);
    ctx.moveTo(sp.x + 5, sp.y); ctx.lineTo(sp.x + 5, sp.y + 10);
    ctx.moveTo(sp.x, sp.y + 5); ctx.lineTo(sp.x + 10, sp.y + 5);
    ctx.stroke();
    // Spinning animation
    var spin = this._age * 8;
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.translate(sp.x + 5, sp.y + 5);
    ctx.rotate(spin);
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();
  }
}

/* ========== POISON PROJECTILE ========== */
class PoisonProjectile extends Entity {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: 8, height: 8,
      speed: 0,
      color: "#3a2",
      type: "projectile",
      tags: ["projectile", "enemyProjectile"]
    });
    this.vx = cfg.vx || 0;
    this.vy = cfg.vy || 0;
    this.damage = 20;
    this.poisonDPS = 3;
    this.poisonDuration = 5;
    this._age = 0;
    this._lifetime = 5;
    this.alive = true;
  }
  update(dt) {
    if (!this.alive) return;
    this._age += dt;
    if (this._age > this._lifetime) { this.alive = false; this.destroy(); return; }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    var p = this.game.localPlayer;
    if (!p || !p.alive || p.invincible) return;
    var dx = (p.x + p.width / 2) - (this.x + 4);
    var dy = (p.y + p.height / 2) - (this.y + 4);
    if (Math.sqrt(dx * dx + dy * dy) < 18) {
      p.takeDamage(this.damage, { x: this.x, y: this.y });
      // Apply poison DOT
      p._poisoned = true;
      p._poisonTimer = this.poisonDuration;
      p._poisonDPS = this.poisonDPS;
      // Electric shock effect
      p._electricShock = true;
      p._electricShockTimer = 0.5;
      this.game.hud.addChatMessage("POISONED! Taking damage over time!", "#5f2");
      this.game.combat.spawnDamageNumber(p.x + 8, p.y - 12, "POISON!", "#5f2");
      this.alive = false;
      this.destroy();
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -16 || sp.x > 496) return;
    // Green poison glob
    var pulse = 0.7 + Math.sin(this._age * 10) * 0.3;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#3a2";
    ctx.beginPath();
    ctx.arc(sp.x + 4, sp.y + 4, 4, 0, Math.PI * 2);
    ctx.fill();
    // Bubbles
    ctx.fillStyle = "#5f4";
    ctx.fillRect(sp.x + 1, sp.y, 2, 2);
    ctx.fillRect(sp.x + 6, sp.y + 1, 2, 2);
    // Drip trail
    ctx.fillStyle = "rgba(50,170,30,0.5)";
    ctx.fillRect(sp.x + 3, sp.y + 8, 2, 3);
    ctx.globalAlpha = 1;
  }
}

/* ========== SPIDER KUMARWITCH (FINAL BOSS) ========== */
class SpiderKumarwitch extends Enemy {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: 64, height: 56,
      speed: 1.5,
      color: "#3a1050",
      enemyType: "kumarwitch",
      name: "MISS KUMARWITCH",
      hp: 500, atk: 50, def: 20,
      contactDamage: 50,
      ai: "chase",
      aggroRange: 600,
      expReward: 200
    });
    this.isBoss = true;
    this.active = false;
    this.visible = false;
    this._age = 0;
    this._legFrame = 0;
    this._baseWidth = 64;
    this._baseHeight = 56;
    this._scale = 1.0;
    this._lastHpPercent = 100;

    // Attack timers
    this._webTimer = 2.5;
    this._poisonTimer = 4.0;
    this._swipeTimer = 1.5;
    this._swipeCooldown = 2.0;

    // Phase
    this._phase = 1;

    // Death animation
    this._dying = false;
    this._deathTimer = 0;
    this._deathDuration = 2.5;

    // Green blood particles
    this._particles = [];
    this._hitFlash = 0;

    // Mouth open flag (for poison fire animation)
    this._mouthOpen = false;

    // Projectiles list (managed by stage)
    this._projectiles = [];
  }

  update(dt) {
    if (!this.alive) return;

    // Death animation with funny dying quotes (runs even if active=false)
    if (this._dying) {
      this._deathTimer += dt;
      this._scale = Math.max(0, 1.0 - (this._deathTimer / this._deathDuration));
      this.width = Math.floor(this._baseWidth * this._scale);
      this.height = Math.floor(this._baseHeight * this._scale);
      // Funny dying quotes at intervals
      if (!this._deathQuoteIndex) this._deathQuoteIndex = 0;
      var deathQuotes = [
        "My... my beautiful legs... all EIGHT of them...",
        "I should have stayed in TEACHING...",
        "This was NOT in my horoscope!!",
        "Tell my spiders... I loved them...",
        "At least I don't have to mark homework anymore...",
        "I'm SHRINKING! Is this what my students felt during exams?!",
        "My cape... my beautiful cape... dry clean ONLY!",
        "I regret nothing! Except maybe the spider transformation...",
        "Who's going to feed my 847 spider babies?!",
        "I'll give you an A+... if you STOP HITTING ME!"
      ];
      var quoteInterval = this._deathDuration / (deathQuotes.length + 1);
      var nextQuoteTime = (this._deathQuoteIndex + 1) * quoteInterval;
      if (this._deathTimer >= nextQuoteTime && this._deathQuoteIndex < deathQuotes.length) {
        this.game.combat.spawnDamageNumber(
          this.x + this.width/2, this.y - 10 - this._deathQuoteIndex * 4,
          deathQuotes[this._deathQuoteIndex], "#f0f"
        );
        this._deathQuoteIndex++;
      }
      // Curl legs inward during death
      if (this._deathTimer >= this._deathDuration) {
        this.alive = false;
        this.visible = false;
      }
      this._updateParticles(dt);
      return;
    }

    this._age += dt;
    this._legFrame = Math.floor(this._age * 8) % 8;
    this._hitFlash = Math.max(0, this._hitFlash - dt);

    // Size shrink: every 5% HP lost, shrink 5%
    var hpPercent = (this.hp / this.maxHp) * 100;
    var shrinkSteps = Math.floor((100 - hpPercent) / 5);
    this._scale = Math.max(0.25, 1.0 - shrinkSteps * 0.05);
    this.width = Math.max(16, Math.floor(this._baseWidth * this._scale));
    this.height = Math.max(14, Math.floor(this._baseHeight * this._scale));

    // Update phase
    if (hpPercent <= 25) {
      this._phase = 3;
    } else if (hpPercent <= 50) {
      this._phase = 2;
    } else {
      this._phase = 1;
    }

    // Web/Poison/Glue debuffs are now handled in Player.js update()
    var p = this.game.localPlayer;

    // Electric shock visual timer countdown
    if (p && p._electricShock) {
      p._electricShockTimer -= dt;
      if (p._electricShockTimer <= 0) {
        p._electricShock = false;
        p._electricShockTimer = 0;
      }
    }

    // Chase player
    if (p && p.alive) {
      var dx = p.x - this.x, dy = p.y - this.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var spd = this.speed * (this._phase >= 2 ? 1.4 : 1.0) * (this._phase >= 3 ? 1.8 : 1.0);
      this.x += (dx / d) * spd * 60 * dt;
      this.direction = dx > 0 ? "right" : "left";

      // Attack logic - scales with damage taken (smaller = more aggressive)
      var fury = 1.0 + (1.0 - this._scale) * 2.5; // 1.0 at full HP, up to 2.9x at minimum size
      this._webTimer -= dt;
      this._poisonTimer -= dt;
      this._swipeTimer -= dt;

      // Web shot - faster as she shrinks
      var webInterval = Math.max(0.4, 2.5 / fury);
      if (this._webTimer <= 0) {
        this._webTimer = webInterval;
        this._fireWeb(p);
        // Fire extra webs when desperate
        if (this._phase >= 3) this._fireWeb(p);
      }

      // Poison spit - ALL phases, faster as she shrinks
      var poisonInterval = Math.max(0.6, 3.5 / fury);
      if (this._poisonTimer <= 0) {
        this._poisonTimer = poisonInterval;
        this._firePoison(p);
        // Double poison in phase 3
        if (this._phase >= 3) {
          var self2 = this;
          setTimeout(function() { if (self2.alive && !self2._dying) self2._firePoison(p); }, 200);
        }
      }

      // Leg swipe (close range)
      if (d < 48 && this._swipeTimer <= 0) {
        this._swipeTimer = this._swipeCooldown;
        this._legSwipe(p);
      }
    }

    this._updateParticles(dt);

    // Update projectiles
    for (var i = this._projectiles.length - 1; i >= 0; i--) {
      if (!this._projectiles[i].alive) {
        this._projectiles.splice(i, 1);
      }
    }
  }

  _fireWeb(target) {
    if (this._dying || !this.alive) return;
    // Fire from abdomen rear (spinnerets) - opposite of facing direction
    var cx = this.direction === "right" ? this.x : this.x + this.width;
    var cy = this.y + this.height * 0.7;
    var dx = target.x + target.width / 2 - cx;
    var dy = target.y + target.height / 2 - cy;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var speed = 140;
    var proj = new WebProjectile(this.game, {
      x: cx, y: cy,
      vx: (dx / d) * speed,
      vy: (dy / d) * speed,
      damage: 12
    });
    this._projectiles.push(proj);
    this.game.addEntity(proj);
    // Chat bubble "SWOOSH!!" above abdomen
    this.game.combat.spawnDamageNumber(cx, cy - 16, "SWOOSH!!", "#ccc");
    // Sound: "SWOOSH!!" swoosh - rapid frequency sweep double burst
    try {
      var s = this.game.sound;
      if (s && s.ctx && !s.muted) {
        var t = s.ctx.currentTime;
        // First SWOOSH - sweep 2000Hz -> 200Hz in 0.08s
        var o1 = s.ctx.createOscillator(), g1 = s.ctx.createGain();
        o1.type = "sawtooth";
        o1.frequency.setValueAtTime(2000, t);
        o1.frequency.exponentialRampToValueAtTime(200, t + 0.08);
        g1.gain.setValueAtTime(0.25, t);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        o1.connect(g1); g1.connect(s.sfxGain);
        o1.start(t); o1.stop(t + 0.1);
        // Second SWOOSH - sweep 1800Hz -> 150Hz in 0.06s
        var o2 = s.ctx.createOscillator(), g2 = s.ctx.createGain();
        o2.type = "sawtooth";
        o2.frequency.setValueAtTime(1800, t + 0.12);
        o2.frequency.exponentialRampToValueAtTime(150, t + 0.18);
        g2.gain.setValueAtTime(0.25, t + 0.12);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        o2.connect(g2); g2.connect(s.sfxGain);
        o2.start(t + 0.12); o2.stop(t + 0.2);
      }
    } catch (e) {}
  }

  _firePoison(target) {
    if (this._dying || !this.alive) return;
    // Fire from mouth area (head level)
    var cx = this.direction === "right" ? this.x + this.width * 0.8 : this.x + this.width * 0.2;
    var cy = this.y + this.height * 0.2;
    var dx = target.x + target.width / 2 - cx;
    var dy = target.y + target.height / 2 - cy;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var speed = 120;
    var proj = new PoisonProjectile(this.game, {
      x: cx, y: cy,
      vx: (dx / d) * speed,
      vy: (dy / d) * speed
    });
    this._projectiles.push(proj);
    this.game.addEntity(proj);
    // Chat bubble "PZEW!!!" above mouth
    this.game.combat.spawnDamageNumber(cx, cy - 12, "PZEW!!!", "#5f2");
    // Mouth open flag for render
    this._mouthOpen = true;
    var self = this;
    setTimeout(function() { self._mouthOpen = false; }, 400);
    // Sound: "PZEW!!! PZEW!!!" high-pitched descending whistle
    try {
      var s = this.game.sound;
      if (s && s.ctx && !s.muted) {
        var t = s.ctx.currentTime;
        // First PZEW - sweep 1600Hz -> 400Hz in 0.15s
        var o1 = s.ctx.createOscillator(), g1 = s.ctx.createGain();
        o1.type = "sine";
        o1.frequency.setValueAtTime(1600, t);
        o1.frequency.exponentialRampToValueAtTime(400, t + 0.15);
        g1.gain.setValueAtTime(0.2, t);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        o1.connect(g1); g1.connect(s.sfxGain);
        o1.start(t); o1.stop(t + 0.18);
        // Second PZEW - sweep 1400Hz -> 350Hz in 0.12s
        var o2 = s.ctx.createOscillator(), g2 = s.ctx.createGain();
        o2.type = "sine";
        o2.frequency.setValueAtTime(1400, t + 0.2);
        o2.frequency.exponentialRampToValueAtTime(350, t + 0.32);
        g2.gain.setValueAtTime(0.2, t + 0.2);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        o2.connect(g2); g2.connect(s.sfxGain);
        o2.start(t + 0.2); o2.stop(t + 0.35);
      }
    } catch (e) {}
  }

  _legSwipe(target) {
    if (this._dying || !this.alive) return;
    if (!target.alive || target.invincible) return;
    target.takeDamage(30, { x: this.x, y: this.y });
    // Knockback
    var dx = target.x - this.x;
    var dir = dx > 0 ? 1 : -1;
    target.x += dir * 40;
    target.svy = -150;
    this.game.camera.shake(6, 0.4);
    this.game.combat.spawnDamageNumber(target.x + 8, target.y - 16, "SWIPE!", "#f44");
    // Sound
    try {
      var s = this.game.sound;
      if (s && s.ctx && !s.muted) {
        var t = s.ctx.currentTime;
        var o = s.ctx.createOscillator(), g = s.ctx.createGain();
        o.type = "sawtooth"; o.frequency.setValueAtTime(150, t);
        o.frequency.exponentialRampToValueAtTime(50, t + 0.12);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        o.connect(g); g.connect(s.sfxGain);
        o.start(t); o.stop(t + 0.12);
      }
    } catch (e) {}
  }

  takeDamage(amt, atk) {
    if (!this.alive || this._dying) return;
    this.hp -= amt;
    this._hitFlash = 0.15;

    // Green blood particles
    for (var i = 0; i < 6; i++) {
      this._particles.push({
        x: this.x + this.width / 2 + (Math.random() - 0.5) * this.width,
        y: this.y + this.height / 2 + (Math.random() - 0.5) * this.height,
        vx: (Math.random() - 0.5) * 80,
        vy: -Math.random() * 60 - 20,
        life: 0.6 + Math.random() * 0.4,
        size: 2 + Math.random() * 3
      });
    }

    // Green damage numbers
    this.game.combat.spawnDamageNumber(
      this.x + this.width / 2,
      this.y - 8,
      "-" + amt,
      "#5f2"
    );

    if (atk) {
      var dx = this.x - atk.x, dy = this.y - atk.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      this.vx = (dx / d) * 3;
      this.vy = (dy / d) * 3;
    }

    if (this.hp <= 0 && !this._dying) {
      this.hp = 1; // keep hp > 0 so Combat.onEnemyDeath() doesn't trigger
      this._dying = true;
      this._deathTimer = 0;
      this.contactDamage = 0;
      this.aggroRange = 0;
      this.game.camera.shake(10, 1.0);
      // Destroy all active projectiles
      for (var pi = 0; pi < this._projectiles.length; pi++) {
        if (this._projectiles[pi].alive) {
          this._projectiles[pi].alive = false;
          this._projectiles[pi].destroy();
        }
      }
      this._projectiles = [];
    }
  }

  _updateParticles(dt) {
    for (var i = this._particles.length - 1; i >= 0; i--) {
      var p = this._particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt; // gravity
      p.life -= dt;
      if (p.life <= 0) this._particles.splice(i, 1);
    }
  }

  render(ctx, camera) {
    if (!this.visible) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x + this.width < -20 || sp.x > 500) return;

    var sx = sp.x, sy = sp.y;
    var sc = this._scale;
    var lf = this._legFrame;
    var faceRight = this.direction === "right";
    var p = this.game.localPlayer;

    ctx.save();

    // Hit flash - flash white
    if (this._hitFlash > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(this._hitFlash * 40) * 0.5;
    }

    // Death curl effect
    if (this._dying) {
      ctx.globalAlpha = Math.max(0, 1.0 - (this._deathTimer / this._deathDuration));
    }

    var cw = this.width;
    var ch = this.height;
    var curlFactor = this._dying ? Math.min(1, this._deathTimer / this._deathDuration) : 0;

    // === SPIDER LOWER BODY ===

    // Large oval abdomen - dark purple with striped pattern
    var abdX = sx + cw * 0.1;
    var abdY = sy + ch * 0.42;
    var abdW = cw * 0.8;
    var abdH = ch * 0.54;

    // Abdomen base - dark purple oval shape
    ctx.fillStyle = "#2a0838";
    // Draw oval using rounded rect approximation
    var abdCx = abdX + abdW / 2, abdCy = abdY + abdH / 2;
    ctx.beginPath();
    ctx.ellipse(abdCx, abdCy, abdW / 2, abdH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Inner lighter fill
    ctx.fillStyle = "#351045";
    ctx.beginPath();
    ctx.ellipse(abdCx, abdCy, abdW / 2 - 2, abdH / 2 - 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Striped pattern on abdomen - alternating dark/light purple stripes
    var stripeCount = 6;
    for (var si = 0; si < stripeCount; si++) {
      var stripeY = abdY + (si / stripeCount) * abdH;
      var stripeH = abdH / stripeCount;
      // Clip to oval shape by calculating width at this Y
      var relY = (stripeY + stripeH / 2 - abdCy) / (abdH / 2);
      var stripeW = Math.sqrt(Math.max(0, 1 - relY * relY)) * abdW;
      if (stripeW < 1) continue;
      ctx.fillStyle = si % 2 === 0 ? "#2a0838" : "#4a1868";
      ctx.fillRect(abdCx - stripeW / 2, stripeY, stripeW, stripeH);
    }

    // Spinnerets - small protrusion at rear of abdomen
    var spinX = faceRight ? abdX - 4 * sc : abdX + abdW;
    var spinY = abdCy + abdH * 0.1;
    ctx.fillStyle = "#1f0628";
    ctx.fillRect(spinX, spinY - 2 * sc, 5 * sc, 4 * sc);
    ctx.fillStyle = "#2a0838";
    ctx.fillRect(spinX + (faceRight ? -1 : 4) * sc, spinY - 1 * sc, 2 * sc, 2 * sc);

    // 8 spider legs (4 per side) with 3 segments each (coxa, femur, tarsus)
    var legBaseLen = cw * 0.35;
    for (var i = 0; i < 4; i++) {
      var baseY = abdY + (i + 0.5) * (abdH / 4);
      var wave = Math.sin(this._age * 6 + i * 1.5) * (4 * sc);
      var curl = curlFactor * (legBaseLen * 0.9);
      var legThick = Math.max(1, 2 * sc);

      // -- Left legs --
      // Coxa (short, from body)
      var lcxStart = abdX;
      var lcxEnd = abdX - legBaseLen * 0.2 + curl * 0.3;
      var lcyBase = baseY + wave;
      ctx.fillStyle = "#1a0828";
      ctx.fillRect(lcxEnd, lcyBase, lcxStart - lcxEnd, legThick + 1);
      // Femur (medium, angled up)
      var lfxEnd = lcxEnd - legBaseLen * 0.45 + curl * 0.4;
      var lfyEnd = lcyBase - 5 * sc + wave * 0.5 + curl * 2;
      ctx.strokeStyle = "#1a0828";
      ctx.lineWidth = legThick;
      ctx.beginPath();
      ctx.moveTo(lcxEnd, lcyBase);
      ctx.lineTo(lfxEnd, lfyEnd);
      ctx.stroke();
      // Joint dot
      ctx.fillStyle = "#2a1040";
      ctx.fillRect(lcxEnd - 1, lcyBase - 1, 3, 3);
      // Tarsus (angled down, pointed tip)
      var ltxEnd = lfxEnd - legBaseLen * 0.35 + curl * 0.3;
      var ltyEnd = baseY + 6 * sc + curl * 3;
      ctx.beginPath();
      ctx.moveTo(lfxEnd, lfyEnd);
      ctx.lineTo(ltxEnd, ltyEnd);
      ctx.stroke();
      // Joint dot at femur-tarsus
      ctx.fillStyle = "#2a1040";
      ctx.fillRect(lfxEnd - 1, lfyEnd - 1, 3, 3);
      // Pointed tip
      ctx.fillStyle = "#0a0418";
      ctx.fillRect(ltxEnd - 1, ltyEnd, 2, Math.max(1, 2 * sc));

      // -- Right legs --
      var rcxStart = abdX + abdW;
      var rcxEnd = rcxStart + legBaseLen * 0.2 - curl * 0.3;
      var rcyBase = baseY - wave;
      ctx.fillStyle = "#1a0828";
      ctx.fillRect(rcxStart, rcyBase, rcxEnd - rcxStart, legThick + 1);
      // Femur
      var rfxEnd = rcxEnd + legBaseLen * 0.45 - curl * 0.4;
      var rfyEnd = rcyBase - 5 * sc - wave * 0.5 + curl * 2;
      ctx.strokeStyle = "#1a0828";
      ctx.lineWidth = legThick;
      ctx.beginPath();
      ctx.moveTo(rcxEnd, rcyBase);
      ctx.lineTo(rfxEnd, rfyEnd);
      ctx.stroke();
      // Joint dot
      ctx.fillStyle = "#2a1040";
      ctx.fillRect(rcxEnd - 1, rcyBase - 1, 3, 3);
      // Tarsus
      var rtxEnd = rfxEnd + legBaseLen * 0.35 - curl * 0.3;
      var rtyEnd = baseY + 6 * sc + curl * 3;
      ctx.beginPath();
      ctx.moveTo(rfxEnd, rfyEnd);
      ctx.lineTo(rtxEnd, rtyEnd);
      ctx.stroke();
      // Joint dot
      ctx.fillStyle = "#2a1040";
      ctx.fillRect(rfxEnd - 1, rfyEnd - 1, 3, 3);
      // Pointed tip
      ctx.fillStyle = "#0a0418";
      ctx.fillRect(rtxEnd - 1, rtyEnd, 2, Math.max(1, 2 * sc));
    }

    // === HUMAN UPPER BODY (Hunched) ===
    var torsoX = sx + cw * 0.22;
    var torsoY = sy;
    var torsoW = cw * 0.56;
    var torsoH = ch * 0.46;

    // === Cape - black with purple inner lining, billows when moving ===
    var capeBillow = Math.sin(this._age * 3) * 3 * sc;
    // Outer cape - black
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.moveTo(torsoX - 6 * sc + capeBillow, torsoY + torsoH * 0.15);
    ctx.lineTo(torsoX - 8 * sc - capeBillow, torsoY + torsoH * 0.95);
    ctx.lineTo(torsoX + torsoW + 8 * sc + capeBillow, torsoY + torsoH * 0.95);
    ctx.lineTo(torsoX + torsoW + 6 * sc - capeBillow, torsoY + torsoH * 0.15);
    ctx.fill();
    // Inner lining - purple
    ctx.fillStyle = "#3a1050";
    ctx.beginPath();
    ctx.moveTo(torsoX - 3 * sc + capeBillow * 0.5, torsoY + torsoH * 0.2);
    ctx.lineTo(torsoX - 5 * sc - capeBillow * 0.5, torsoY + torsoH * 0.9);
    ctx.lineTo(torsoX + torsoW + 5 * sc + capeBillow * 0.5, torsoY + torsoH * 0.9);
    ctx.lineTo(torsoX + torsoW + 3 * sc - capeBillow * 0.5, torsoY + torsoH * 0.2);
    ctx.fill();

    // Hunched torso body with curved spine (hunchback)
    ctx.fillStyle = "#1a1a1a";
    // Main torso
    ctx.fillRect(torsoX + 2 * sc, torsoY + torsoH * 0.28, torsoW - 4 * sc, torsoH * 0.55);
    // Hunch/hump on upper back
    var hunchX = torsoX + torsoW * 0.3;
    var hunchY = torsoY + torsoH * 0.18;
    ctx.beginPath();
    ctx.ellipse(hunchX + torsoW * 0.2, hunchY, torsoW * 0.25, torsoH * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1a1a";
    ctx.fill();
    // Spine curve visible through robes (subtle highlight)
    ctx.strokeStyle = "#2a2a3a";
    ctx.lineWidth = Math.max(1, 1.5 * sc);
    ctx.beginPath();
    ctx.moveTo(torsoX + torsoW * 0.5, torsoY + torsoH * 0.15);
    ctx.quadraticCurveTo(torsoX + torsoW * 0.6, torsoY + torsoH * 0.35, torsoX + torsoW * 0.45, torsoY + torsoH * 0.7);
    ctx.stroke();

    // Thin dark arms - sometimes raised when casting (phase check)
    var armRaise = (this._mouthOpen || this._phase >= 2) ? Math.sin(this._age * 8) * 4 * sc : 0;
    ctx.fillStyle = "#5a4030";
    // Left arm
    ctx.save();
    var laX = torsoX - 1 * sc;
    var laY = torsoY + torsoH * 0.32 - armRaise;
    ctx.fillRect(laX, laY, Math.max(1, 3 * sc), Math.max(4, 12 * sc));
    // Left hand
    ctx.fillStyle = "#4a3525";
    ctx.fillRect(laX - 1, laY + 12 * sc, Math.max(1, 4 * sc), Math.max(1, 3 * sc));
    ctx.restore();
    // Right arm
    ctx.fillStyle = "#5a4030";
    var raX = torsoX + torsoW - 2 * sc;
    var raY = torsoY + torsoH * 0.32 + armRaise;
    ctx.fillRect(raX, raY, Math.max(1, 3 * sc), Math.max(4, 12 * sc));
    ctx.fillStyle = "#4a3525";
    ctx.fillRect(raX - 1, raY + 12 * sc, Math.max(1, 4 * sc), Math.max(1, 3 * sc));

    // === HEAD ===
    var headW = torsoW * 0.65;
    var headH = torsoH * 0.5;
    var headX = torsoX + (torsoW - headW) / 2;
    var headY = torsoY - headH * 0.15;

    // Long black hair flowing behind
    ctx.fillStyle = "#111";
    var hairSide = faceRight ? headX - 4 * sc : headX + headW - 2 * sc;
    // Multiple hair strands
    for (var hi = 0; hi < 5; hi++) {
      var hairWave = Math.sin(this._age * 2 + hi * 0.8) * 2 * sc;
      var hx = hairSide + (faceRight ? -hi * 1.5 * sc : hi * 1.5 * sc) + hairWave;
      var hy = headY + headH * 0.1 + hi * 1.5 * sc;
      var hLen = headH * 0.6 + hi * 2 * sc;
      ctx.fillRect(hx, hy, Math.max(1, 2 * sc), hLen);
    }
    // Hair on top of head
    ctx.fillStyle = "#111";
    ctx.fillRect(headX - 2 * sc, headY + headH * 0.2, headW + 4 * sc, headH * 0.2);

    // Dark brown skin face (#5a4030)
    ctx.fillStyle = "#5a4030";
    ctx.fillRect(headX, headY + headH * 0.25, headW, headH * 0.75);
    // Slightly lighter forehead
    ctx.fillStyle = "#6a5040";
    ctx.fillRect(headX + 1, headY + headH * 0.25, headW - 2, headH * 0.15);

    // Cheekbone highlights
    ctx.fillStyle = "#6a5040";
    if (faceRight) {
      ctx.fillRect(headX + headW * 0.55, headY + headH * 0.5, headW * 0.15, headH * 0.1);
    } else {
      ctx.fillRect(headX + headW * 0.3, headY + headH * 0.5, headW * 0.15, headH * 0.1);
    }

    // === EYES - Large, fierce, bulging with tracking pupils ===
    var eyeGlow = 0.7 + Math.sin(this._age * 4) * 0.3;
    var baseAlpha = this._dying ? Math.max(0, 1.0 - (this._deathTimer / this._deathDuration)) : 1;

    // Eye positions based on facing direction
    var eyeW = Math.max(2, 4 * sc);
    var eyeH = Math.max(2, 3 * sc);
    var eye1X, eye2X, eyeY;
    if (faceRight) {
      eye1X = headX + headW * 0.4;
      eye2X = headX + headW * 0.65;
    } else {
      eye1X = headX + headW * 0.15;
      eye2X = headX + headW * 0.4;
    }
    eyeY = headY + headH * 0.4;

    // White sclera
    ctx.fillStyle = "#e8e8e0";
    ctx.globalAlpha = baseAlpha;
    ctx.fillRect(eye1X - 1, eyeY - 1, eyeW + 2, eyeH + 2);
    ctx.fillRect(eye2X - 1, eyeY - 1, eyeW + 2, eyeH + 2);

    // Red glowing iris
    ctx.fillStyle = "#ff3333";
    ctx.globalAlpha = baseAlpha * eyeGlow;
    ctx.fillRect(eye1X, eyeY, eyeW, eyeH);
    ctx.fillRect(eye2X, eyeY, eyeW, eyeH);

    // Black pupils that track player direction
    var pupOffX = 0, pupOffY = 0;
    if (p && p.alive) {
      var pdx = p.x - this.x, pdy = p.y - this.y;
      var pd = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
      pupOffX = (pdx / pd) * Math.max(1, 1.5 * sc);
      pupOffY = (pdy / pd) * Math.max(1, 1 * sc);
    }
    ctx.fillStyle = "#000";
    ctx.globalAlpha = baseAlpha;
    var pupW = Math.max(1, 2 * sc);
    var pupH = Math.max(1, 2 * sc);
    ctx.fillRect(eye1X + (eyeW - pupW) / 2 + pupOffX, eyeY + (eyeH - pupH) / 2 + pupOffY, pupW, pupH);
    ctx.fillRect(eye2X + (eyeW - pupW) / 2 + pupOffX, eyeY + (eyeH - pupH) / 2 + pupOffY, pupW, pupH);

    // Mole/beauty mark below left eye (2x2 pixel dot)
    ctx.fillStyle = "#000";
    var moleX = faceRight ? eye1X + eyeW * 0.3 : eye2X + eyeW * 0.3;
    ctx.fillRect(moleX, eyeY + eyeH + 2, 2, 2);

    // === NOSE - Prominent hooked/aquiline nose ===
    var noseBaseX = faceRight ? headX + headW * 0.7 : headX + headW * 0.1;
    ctx.fillStyle = "#4a3525";
    // Nose bridge (vertical)
    ctx.fillRect(noseBaseX, headY + headH * 0.45, Math.max(1, 3 * sc), Math.max(2, 5 * sc));
    // Hook pointing down (horizontal tip)
    var hookDir = faceRight ? 1 : -1;
    ctx.fillRect(noseBaseX + hookDir * 2 * sc, headY + headH * 0.55, Math.max(1, 3 * sc), Math.max(1, 3 * sc));
    ctx.fillRect(noseBaseX + hookDir * 3 * sc, headY + headH * 0.6, Math.max(1, 2 * sc), Math.max(1, 2 * sc));
    // Nostril
    ctx.fillStyle = "#2a1a10";
    ctx.fillRect(noseBaseX + hookDir * 1 * sc, headY + headH * 0.62, Math.max(1, 2 * sc), Math.max(1, 1 * sc));

    // === MOUTH ===
    ctx.globalAlpha = baseAlpha;
    var mouthX = headX + headW * 0.25;
    var mouthY = headY + headH * 0.75;
    var mouthW = headW * 0.5;
    var mouthH = Math.max(1, 2 * sc);

    if (this._mouthOpen) {
      // Mouth open - showing green glow inside (firing poison)
      ctx.fillStyle = "#1a0a00";
      ctx.fillRect(mouthX, mouthY, mouthW, Math.max(2, 4 * sc));
      // Green glow inside mouth
      ctx.fillStyle = "#3a2";
      ctx.globalAlpha = baseAlpha * (0.6 + Math.sin(this._age * 20) * 0.4);
      ctx.fillRect(mouthX + 2, mouthY + 1, mouthW - 4, Math.max(1, 2 * sc));
      ctx.globalAlpha = baseAlpha;
    } else {
      // Thin cruel smile
      ctx.fillStyle = "#2a0a00";
      ctx.fillRect(mouthX, mouthY, mouthW, mouthH);
      // Slight upward curve at corners (cruel smile)
      ctx.fillRect(mouthX - 1, mouthY - 1, 2, 1);
      ctx.fillRect(mouthX + mouthW - 1, mouthY - 1, 2, 1);
    }

    // === WITCH HAT - tall pointed, slightly bent at tip ===
    ctx.fillStyle = "#0a0a15";
    // Hat brim
    ctx.fillRect(headX - 4 * sc, headY + headH * 0.2, headW + 8 * sc, Math.max(2, 3 * sc));
    // Hat brim shadow
    ctx.fillStyle = "#050510";
    ctx.fillRect(headX - 3 * sc, headY + headH * 0.2 + 2 * sc, headW + 6 * sc, Math.max(1, 1 * sc));

    // Hat cone with bent tip
    var hatMid = headX + headW / 2;
    var hatTipX = hatMid + 4 * sc; // bent slightly to one side
    var hatTipY = headY - headH * 0.8;
    ctx.fillStyle = "#0a0a15";
    ctx.beginPath();
    ctx.moveTo(hatMid - headW * 0.4, headY + headH * 0.22);
    ctx.lineTo(hatMid - 2 * sc, hatTipY + headH * 0.3);
    ctx.lineTo(hatTipX, hatTipY); // bent tip
    ctx.lineTo(hatMid + 2 * sc, hatTipY + headH * 0.3);
    ctx.lineTo(hatMid + headW * 0.4, headY + headH * 0.22);
    ctx.fill();
    // Hat highlight edge
    ctx.strokeStyle = "#15152a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hatMid - 2 * sc, hatTipY + headH * 0.3);
    ctx.lineTo(hatTipX, hatTipY);
    ctx.lineTo(hatMid + 2 * sc, hatTipY + headH * 0.3);
    ctx.stroke();

    // Gold buckle on hat (#ffd700)
    ctx.fillStyle = "#ffd700";
    var buckleY = headY + headH * 0.1;
    ctx.fillRect(hatMid - 3 * sc, buckleY, 6 * sc, Math.max(2, 3 * sc));
    // Buckle inner detail
    ctx.fillStyle = "#b8960a";
    ctx.fillRect(hatMid - 1.5 * sc, buckleY + 1, 3 * sc, Math.max(1, 1.5 * sc));

    ctx.restore();

    // === Green blood particles (kept from original) ===
    for (var i = 0; i < this._particles.length; i++) {
      var part = this._particles[i];
      var psp = camera.worldToScreen(part.x, part.y);
      ctx.globalAlpha = Math.max(0, part.life);
      ctx.fillStyle = "#5f2";
      ctx.fillRect(psp.x, psp.y, part.size, part.size);
    }
    ctx.globalAlpha = 1;

    // === Electric shock visual on player ===
    if (p && p._electricShock && p._electricShockTimer > 0) {
      var psp2 = camera.worldToScreen(p.x, p.y);
      var shockFlash = Math.sin(p._electricShockTimer * 40) > 0;
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = shockFlash ? "#aaeeff" : "#ffffff";
      ctx.fillRect(psp2.x - 2, psp2.y - 2, p.width + 4, p.height + 4);
      // Electric arc lines
      ctx.strokeStyle = shockFlash ? "#44ccff" : "#88eeff";
      ctx.lineWidth = 1;
      for (var ei = 0; ei < 4; ei++) {
        ctx.beginPath();
        var esx = psp2.x + Math.random() * p.width;
        var esy = psp2.y + Math.random() * p.height;
        ctx.moveTo(esx, esy);
        ctx.lineTo(esx + (Math.random() - 0.5) * 12, esy + (Math.random() - 0.5) * 12);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // HP bar (boss - large)
    if (this.active && !this._dying) {
      ctx.fillStyle = "#300";
      ctx.fillRect(sp.x - 4, sp.y - 10, this._baseWidth + 8, 5);
      ctx.fillStyle = "#5f2";
      ctx.fillRect(sp.x - 4, sp.y - 10, Math.floor((this._baseWidth + 8) * (this.hp / this.maxHp)), 5);
      // HP bar border
      ctx.strokeStyle = "#1a0828";
      ctx.lineWidth = 1;
      ctx.strokeRect(sp.x - 4, sp.y - 10, this._baseWidth + 8, 5);
    }
  }
}

/* ================================================================
   STAGE CLASS: Stage3_Senior2F
   ================================================================ */
class Stage3_Senior2F {
  constructor(onComplete) {
    this.game = null;
    this.onComplete = onComplete;
    this.complete = false;
    this.ss = null;
    this.enemies = [];
    this.boss = null;
    this.bossTriggered = false;
    this.bossDefeated = false;
    this._flickerTimer = 0;
    this._flickerAlpha = 1;
    this._doorOpen = false;
    this._section1Cleared = false;
    this._section2Cleared = false;
    this._section3Cleared = false;
    this._allCleared = false;
    this._age = 0;
    this._cobwebs = [];
    this._candles = [];
    // Section enemy trackers
    this._sec1Enemies = [];
    this._sec2Enemies = [];
    this._sec3Enemies = [];
  }

  async init(game) {
    this.game = game;
    this.ss = new SideScroll(game);
    this.ss.activate({
      groundY: 272,
      worldWidth: 5600,
      platforms: [
        // Section 1: Classroom desks and shelves
        { x: 160,  y: 248, w: 64, h: 12, color: "#7a6040", topColor: "#5a4020" },
        { x: 320,  y: 240, w: 48, h: 12, color: "#7a6040", topColor: "#5a4020" },
        { x: 500,  y: 232, w: 80, h: 12, color: "#8a7050", topColor: "#6a5030" },
        { x: 700,  y: 248, w: 56, h: 12, color: "#7a6040", topColor: "#5a4020" },
        { x: 880,  y: 224, w: 64, h: 12, color: "#8a7050", topColor: "#6a5030" },
        { x: 1050, y: 240, w: 48, h: 12, color: "#7a6040", topColor: "#5a4020" },
        { x: 1250, y: 232, w: 72, h: 12, color: "#8a7050", topColor: "#6a5030" },
        { x: 1450, y: 248, w: 56, h: 12, color: "#7a6040", topColor: "#5a4020" },
        // Section 2: More desks, bookshelves
        { x: 1700, y: 240, w: 64, h: 12, color: "#7a6040", topColor: "#5a4020" },
        { x: 1900, y: 228, w: 80, h: 12, color: "#8a7050", topColor: "#6a5030" },
        { x: 2080, y: 248, w: 48, h: 12, color: "#7a6040", topColor: "#5a4020" },
        { x: 2240, y: 236, w: 72, h: 12, color: "#8a7050", topColor: "#6a5030" },
        { x: 2440, y: 248, w: 56, h: 12, color: "#7a6040", topColor: "#5a4020" },
        { x: 2620, y: 224, w: 64, h: 12, color: "#8a7050", topColor: "#6a5030" },
        { x: 2820, y: 240, w: 48, h: 12, color: "#7a6040", topColor: "#5a4020" },
        { x: 3000, y: 248, w: 64, h: 12, color: "#7a6040", topColor: "#5a4020" },
        // Section 3: Desks and overturned furniture
        { x: 3300, y: 240, w: 80, h: 12, color: "#7a6040", topColor: "#5a4020" },
        { x: 3500, y: 228, w: 56, h: 12, color: "#8a7050", topColor: "#6a5030" },
        { x: 3680, y: 248, w: 64, h: 12, color: "#7a6040", topColor: "#5a4020" },
        { x: 3850, y: 232, w: 72, h: 12, color: "#8a7050", topColor: "#6a5030" },
        { x: 4050, y: 244, w: 48, h: 12, color: "#7a6040", topColor: "#5a4020" },
        { x: 4200, y: 236, w: 56, h: 12, color: "#8a7050", topColor: "#6a5030" },
        // Boss Arena: Few platforms for dodging
        { x: 4600, y: 240, w: 80, h: 12, color: "#4a3050", topColor: "#3a2040" },
        { x: 4850, y: 220, w: 64, h: 12, color: "#4a3050", topColor: "#3a2040" },
        { x: 5100, y: 236, w: 72, h: 12, color: "#4a3050", topColor: "#3a2040" },
        { x: 5350, y: 224, w: 56, h: 12, color: "#4a3050", topColor: "#3a2040" }
      ],
      hazards: []
    });

    game.tileMap = null;
    game.camera.setMapBounds(5600, 320);

    var p = game.localPlayer;
    p.x = 48;
    p.y = 220;
    p.svx = 0;
    p.svy = 0;
    game.camera.x = 0;
    game.camera.y = 0;
    game.camera.follow(p);

    game.hud.showStageName("Stage 3-2F: Ryde Public School - Senior Class (Year 6)");
    game.hud.addChatMessage("Something feels wrong up here...", "#aaa");

    this._spawnEnemies();
    this._spawnItems();
    this._initCobwebs();

    setTimeout(function () {
      game.startDialogue([
        { speaker: "Alice", text: "The 2nd floor... it's so dark up here." },
        { speaker: "Alice", text: "I can hear bugs crawling... and those Year 6 seniors look... wrong." },
        { speaker: "Alice", text: "Better sneak past them if I can..." }
      ], function () {
        if (game.sound) game.sound.playBGM("sub1");
      });
    }, 500);
  }

  _spawnEnemies() {
    var g = this.game;

    // Section 1 (x:0-1600): 7 bugs + 3 seniors + 2 moths + 1 mimic = 13
    var sec1 = [
      { cls: BugCreature, cfg: { x: 200, y: 260, bugType: "cockroach" } },
      { cls: BugCreature, cfg: { x: 450, y: 260, bugType: "spider" } },
      { cls: BugCreature, cfg: { x: 750, y: 260, bugType: "centipede" } },
      { cls: BugCreature, cfg: { x: 1100, y: 260, bugType: "cockroach" } },
      { cls: BugCreature, cfg: { x: 320, y: 256, bugType: "spider" } },
      { cls: BugCreature, cfg: { x: 1000, y: 256, bugType: "spider" } },
      { cls: BugCreature, cfg: { x: 1400, y: 260, bugType: "centipede" } },
      { cls: ZombieSenior, cfg: { x: 350, y: 236 } },
      { cls: ZombieSenior, cfg: { x: 650, y: 236 } },
      { cls: ZombieSenior, cfg: { x: 1300, y: 236 } },
      { cls: FlyingMoth, cfg: { x: 550, y: 220 } },
      { cls: FlyingMoth, cfg: { x: 1200, y: 208 } },
      { cls: DeskMimic, cfg: { x: 900, y: 248 } }
    ];

    // Section 2 (x:1600-3200): 8 bugs + 4 seniors + 3 moths + 1 mimic + 2 ink = 18
    var sec2 = [
      { cls: BugCreature, cfg: { x: 1750, y: 260, bugType: "spider" } },
      { cls: BugCreature, cfg: { x: 2000, y: 260, bugType: "cockroach" } },
      { cls: BugCreature, cfg: { x: 2200, y: 260, bugType: "centipede" } },
      { cls: BugCreature, cfg: { x: 2500, y: 260, bugType: "spider" } },
      { cls: BugCreature, cfg: { x: 2850, y: 260, bugType: "cockroach" } },
      { cls: BugCreature, cfg: { x: 1680, y: 256, bugType: "spider" } },
      { cls: BugCreature, cfg: { x: 2400, y: 256, bugType: "spider" } },
      { cls: BugCreature, cfg: { x: 3050, y: 260, bugType: "centipede" } },
      { cls: ZombieSenior, cfg: { x: 1850, y: 236 } },
      { cls: ZombieSenior, cfg: { x: 2150, y: 236 } },
      { cls: ZombieSenior, cfg: { x: 2600, y: 236 } },
      { cls: ZombieSenior, cfg: { x: 2950, y: 236 } },
      { cls: FlyingMoth, cfg: { x: 1950, y: 210 } },
      { cls: FlyingMoth, cfg: { x: 2700, y: 215 } },
      { cls: FlyingMoth, cfg: { x: 3100, y: 205 } },
      { cls: DeskMimic, cfg: { x: 2350, y: 248 } },
      { cls: InkBlob, cfg: { x: 2750, y: 258 } },
      { cls: InkBlob, cfg: { x: 2100, y: 254 } }
    ];

    // Section 3 (x:3200-4400): 9 bugs + 3 seniors + 2 moths + 1 mimic + 2 ink = 17
    var sec3 = [
      { cls: BugCreature, cfg: { x: 3350, y: 260, bugType: "cockroach" } },
      { cls: BugCreature, cfg: { x: 3500, y: 260, bugType: "spider" } },
      { cls: BugCreature, cfg: { x: 3650, y: 260, bugType: "centipede" } },
      { cls: BugCreature, cfg: { x: 3800, y: 260, bugType: "cockroach" } },
      { cls: BugCreature, cfg: { x: 3950, y: 260, bugType: "spider" } },
      { cls: BugCreature, cfg: { x: 4100, y: 260, bugType: "centipede" } },
      { cls: BugCreature, cfg: { x: 3280, y: 256, bugType: "spider" } },
      { cls: BugCreature, cfg: { x: 4200, y: 256, bugType: "spider" } },
      { cls: BugCreature, cfg: { x: 4300, y: 260, bugType: "centipede" } },
      { cls: ZombieSenior, cfg: { x: 3450, y: 236 } },
      { cls: ZombieSenior, cfg: { x: 3750, y: 236 } },
      { cls: ZombieSenior, cfg: { x: 4050, y: 236 } },
      { cls: FlyingMoth, cfg: { x: 3600, y: 212 } },
      { cls: FlyingMoth, cfg: { x: 4250, y: 204 } },
      { cls: DeskMimic, cfg: { x: 3900, y: 248 } },
      { cls: InkBlob, cfg: { x: 4150, y: 258 } },
      { cls: InkBlob, cfg: { x: 3550, y: 254 } }
    ];

    var self = this;

    function spawnGroup(arr, tracker) {
      for (var i = 0; i < arr.length; i++) {
        var s = arr[i];
        var e = new s.cls(g, s.cfg);
        e.sideScrollMode = true;
        e.svy = 0;
        self.enemies.push(e);
        tracker.push(e);
        g.addEntity(e);
      }
    }

    spawnGroup(sec1, this._sec1Enemies);
    spawnGroup(sec2, this._sec2Enemies);
    spawnGroup(sec3, this._sec3Enemies);

    // Extra 45 mobs spread across the entire map (x:50 to x:5400)
    // 15 SchoolSpider, 15 Cockroach (BugCreature), 15 SchoolScorpion
    var extraMobs = [];
    // 15 SchoolSpiders evenly spaced
    var spiderXs = [80, 440, 800, 1160, 1520, 1880, 2240, 2600, 2960, 3320, 3680, 4040, 4400, 4760, 5120];
    for (var si = 0; si < spiderXs.length; si++) {
      extraMobs.push({ cls: SchoolSpider, cfg: { x: spiderXs[si], y: 240 + Math.floor(Math.random() * 20) } });
    }
    // 15 Cockroaches evenly spaced (offset from spiders)
    var roachXs = [200, 560, 920, 1280, 1640, 2000, 2360, 2720, 3080, 3440, 3800, 4160, 4520, 4880, 5240];
    for (var ri = 0; ri < roachXs.length; ri++) {
      extraMobs.push({ cls: BugCreature, cfg: { x: roachXs[ri], y: 240 + Math.floor(Math.random() * 20), bugType: "cockroach" } });
    }
    // 15 SchoolScorpions evenly spaced (offset from both)
    var scorpXs = [320, 680, 1040, 1400, 1760, 2120, 2480, 2840, 3200, 3560, 3920, 4280, 4640, 5000, 5360];
    for (var sci = 0; sci < scorpXs.length; sci++) {
      extraMobs.push({ cls: SchoolScorpion, cfg: { x: scorpXs[sci], y: 240 + Math.floor(Math.random() * 20) } });
    }
    var _extraTracker = [];
    spawnGroup(extraMobs, _extraTracker);

    // Boss: SpiderKumarwitch - created on trigger, NOT at init
    this.boss = null;
  }

  _spawnItems() {
    var g = this.game;
    var items = [
      // Section 1 health pickups
      { x: 500, y: 216, item: { name: "Juice Box", type: "consumable", heal: 15, color: "#f90", pickupMessage: "Apple juice! +15 HP" } },
      { x: 1000, y: 252, item: { name: "Tim Tam", type: "consumable", heal: 20, color: "#4a2810", pickupMessage: "Tim Tam! +20 HP" } },
      // Section 2 health + shield
      { x: 2100, y: 232, item: { name: "Vegemite Sanga", type: "consumable", heal: 25, color: "#4a3520", pickupMessage: "Vegemite sandwich! +25 HP" } },
      { x: 2500, y: 252, item: { name: "Rusty Shield", type: "armor", equipSlot: "armor", def: 3, color: "#8a8a6a", pickupMessage: "Rusty Shield! DEF+3!" } },
      { x: 2900, y: 252, item: { name: "Meat Pie", type: "consumable", heal: 30, color: "#c8a060", pickupMessage: "Meat pie! +30 HP" } },
      // Section 3 health pickups
      { x: 3600, y: 252, item: { name: "Golden Gaytime", type: "consumable", heal: 25, color: "#f0d060", pickupMessage: "Golden Gaytime! +25 HP" } },
      { x: 4100, y: 252, item: { name: "Lamington", type: "consumable", heal: 35, color: "#5a3020", pickupMessage: "Lamington! +35 HP" } },
      // Boss arena health
      { x: 4700, y: 252, item: { name: "Fairy Bread", type: "consumable", heal: 40, color: "#f8c8d8", pickupMessage: "Fairy bread! +40 HP" } },
      { x: 5200, y: 252, item: { name: "Shapes BBQ", type: "consumable", heal: 30, color: "#f0d060", pickupMessage: "Shapes! +30 HP" } }
    ];

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var d = new ItemDrop(g, { x: it.x, y: it.y, itemData: it.item });
      d.lifetime = 99999;
      g.addEntity(d);
    }
  }

  _initCobwebs() {
    // Cobwebs in boss arena corners and scattered in sections
    this._cobwebs = [
      { x: 400, y: 0, w: 40, h: 30 },
      { x: 1200, y: 0, w: 50, h: 35 },
      { x: 2400, y: 0, w: 45, h: 30 },
      { x: 3100, y: 0, w: 50, h: 35 },
      // Boss arena - large cobwebs
      { x: 4420, y: 0, w: 80, h: 50 },
      { x: 4420, y: 242, w: 60, h: 30 },
      { x: 5520, y: 0, w: 80, h: 50 },
      { x: 5520, y: 242, w: 60, h: 30 },
      { x: 4900, y: 0, w: 60, h: 40 },
      { x: 5300, y: 0, w: 60, h: 40 }
    ];
    // Candles in boss arena
    this._candles = [
      { x: 4500, y: 258 },
      { x: 4750, y: 258 },
      { x: 5000, y: 258 },
      { x: 5250, y: 258 },
      { x: 5450, y: 258 }
    ];
  }

  update(dt) {
    if (!this.ss) return;
    this.ss.update(dt);
    this._age += dt;
    this._updateEnemyGravity(dt);
    this._updateFlicker(dt);
    this._checkSectionsCleared();
    this._checkBossTrigger();
    this._checkBossDefeated();
  }

  _updateEnemyGravity(dt) {
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.alive || !e.active || !e.sideScrollMode) continue;
      e.svy = (e.svy || 0) + this.ss.gravity * dt;
      var ny = e.y + e.svy * dt;
      if (ny + e.height >= this.ss.groundY) {
        e.y = this.ss.groundY - e.height;
        e.svy = 0;
      } else {
        var landed = false;
        if (e.svy > 0) {
          for (var j = 0; j < this.ss.platforms.length; j++) {
            var pl = this.ss.platforms[j];
            if (e.x + e.width > pl.x && e.x < pl.x + pl.w &&
                ny + e.height >= pl.y && e.y + e.height <= pl.y + 8) {
              e.y = pl.y - e.height;
              e.svy = 0;
              landed = true;
              break;
            }
          }
        }
        if (!landed) e.y = ny;
      }
    }
  }

  _updateFlicker(dt) {
    this._flickerTimer -= dt;
    if (this._flickerTimer <= 0) {
      this._flickerTimer = 0.05 + Math.random() * 0.15;
      this._flickerAlpha = 0.6 + Math.random() * 0.4;
    }
  }

  _checkSectionsCleared() {
    if (this._allCleared) return;

    if (!this._section1Cleared) {
      var allDead = true;
      for (var i = 0; i < this._sec1Enemies.length; i++) {
        if (this._sec1Enemies[i].alive) { allDead = false; break; }
      }
      if (allDead) {
        this._section1Cleared = true;
        this.game.hud.addChatMessage("Classroom 1 cleared!", "#50c878");
      }
    }

    if (!this._section2Cleared) {
      var allDead = true;
      for (var i = 0; i < this._sec2Enemies.length; i++) {
        if (this._sec2Enemies[i].alive) { allDead = false; break; }
      }
      if (allDead) {
        this._section2Cleared = true;
        this.game.hud.addChatMessage("Classroom 2 cleared!", "#50c878");
      }
    }

    if (!this._section3Cleared) {
      var allDead = true;
      for (var i = 0; i < this._sec3Enemies.length; i++) {
        if (this._sec3Enemies[i].alive) { allDead = false; break; }
      }
      if (allDead) {
        this._section3Cleared = true;
        this.game.hud.addChatMessage("Classroom 3 cleared!", "#50c878");
      }
    }

    if (this._section1Cleared && this._section2Cleared && this._section3Cleared && !this._doorOpen) {
      this._doorOpen = true;
      this._allCleared = true;
      this.game.hud.addChatMessage("All classrooms cleared! The door to the lair opens...", "#f0d060");
      this.game.camera.shake(4, 0.5);
    }
  }

  _checkBossTrigger() {
    if (this.bossTriggered || this.bossDefeated) return;
    if (!this._doorOpen) return;

    var p = this.game.localPlayer;
    if (!p) return;

    if (p.x > 4500) {
      this.bossTriggered = true;
      var self = this;
      var g = this.game;
      this.game.startDialogue([
        { speaker: "???", text: "You made it to MY classroom... how annoying." },
        { speaker: "Miss Kumarwitch", text: "This time I won't hold back. BEHOLD MY TRUE FORM!" },
        { speaker: "Miss Kumarwitch", text: "SCREEEECH!" }
      ], function () {
        // Create boss NOW (not at init) to prevent ghost appearance
        self.boss = new SpiderKumarwitch(g, { x: 5000, y: 216 });
        self.boss.sideScrollMode = true;
        self.boss.svy = 0;
        self.boss.active = true;
        self.boss.visible = true;
        self.boss.aggroed = true;
        self.enemies.push(self.boss);
        g.addEntity(self.boss);
        g.camera.shake(8, 0.8);
        g.hud.setBoss(self.boss, "MISS KUMARWITCH");
        g.hud.addChatMessage("BOSS: SPIDER KUMARWITCH!", "#f44");
      });
    }
  }

  _checkBossDefeated() {
    if (!this.bossTriggered || this.bossDefeated) return;
    if (!this.boss) return;

    if (!this.boss.alive) {
      this.bossDefeated = true;
      this.complete = true;
      this.game.hud.clearBoss();
      this.game.hud.addChatMessage("MISS KUMARWITCH DEFEATED!", "#50c878");

      // Clean up web slow and poison
      var p = this.game.localPlayer;
      if (p) {
        if (p._webSlowed) {
          p._webSlowed = false;
          p.speed = p._origSpeed || p.speed;
          p._origSpeed = null;
        }
        p._poisoned = false;
        p._poisonTimer = 0;
      }

      var self = this;
      this.game.startDialogue([
        { speaker: "Miss Kumarwitch", text: "Wait... WAIT! Before I die... I have something... important to say..." },
        { speaker: "Alice", text: "Oh here we go..." },
        { speaker: "Miss Kumarwitch", text: "I... I just want you to know... your homework is STILL due Monday." },
        { speaker: "Alice", text: "You're literally DYING and you're worried about HOMEWORK?!" },
        { speaker: "Miss Kumarwitch", text: "Also... I never actually knew how to do long division. I just Googled it every time." },
        { speaker: "Alice", text: "WHAT?! You gave me an F for getting it wrong!!" },
        { speaker: "Miss Kumarwitch", text: "And... *cough*... that science experiment? The volcano? I used baking soda from the staff room." },
        { speaker: "Alice", text: "We ALL knew that, Miss. The whole class knew." },
        { speaker: "Miss Kumarwitch", text: "I... I also ate your lunch that one time. The one with the Tim Tams." },
        { speaker: "Alice", text: "THAT WAS YOU?! I blamed Sarah for THREE WEEKS!" },
        { speaker: "Miss Kumarwitch", text: "Tell Mr. Taha... he still owes me $5 from the staff Christmas party..." },
        { speaker: "Alice", text: "I'm not telling him ANYTHING for you!" },
        { speaker: "Miss Kumarwitch", text: "And my spider babies... please feed them... they like... maths worksheets..." },
        { speaker: "Alice", text: "Absolutely NOT. No. Never. Goodbye." },
        { speaker: "Miss Kumarwitch", text: "One more thing... I... I actually thought you were... a good student..." },
        { speaker: "Alice", text: "...Did she just compliment me while dying? That's the nicest thing she's EVER said." },
        { speaker: "Miss Kumarwitch", text: "Kids... please... put me in the toilet... and flush me down~~~~ Please~~~~" },
        { speaker: "Alice", text: "...WHAT?!" },
        { speaker: "Miss Kumarwitch", text: "It's my... dying wish... just... flush... me... *dies*" },
        { speaker: "Alice", text: "That is the WEIRDEST last request I have EVER heard." },
        { speaker: "Alice", text: "We literally JUST fought a Toilet King downstairs. This school is CURSED." },
        { speaker: "Alice", text: "Anyway... she's gone. NOT flushing her though. Moving on!" },
        { speaker: "System", text: "BOSS DEFEATED: Miss Kumarwitch (Spider Form)" },
        { speaker: "System", text: "Senior Class 2F CLEARED! Moving to Assembly Hall..." }
      ], function () {
        if (self.game.transition) {
          self.game.transition.startFade(function () {
            if (self.onComplete) self.onComplete("hall");
          });
        } else {
          if (self.onComplete) self.onComplete("hall");
        }
      });
    }
  }

  render(ctx, camera) {
    if (!this.ss) return;

    // Dark background instead of sky
    this._renderBackground(ctx, camera);

    // Platforms & ground (rendered by SideScroll)
    this.ss.render(ctx, camera);

    // Classroom decorations
    this._renderClassrooms(ctx, camera);

    // Cobwebs
    this._renderCobwebs(ctx, camera);

    // Door to boss arena
    this._renderDoor(ctx, camera);

    // Boss arena decorations
    this._renderBossArena(ctx, camera);

    // Flickering light overlay
    this._renderFlicker(ctx, camera);
  }

  _renderBackground(ctx, camera) {
    var ox = camera.offsetX;

    // Dark school interior
    ctx.fillStyle = "#1a1520";
    ctx.fillRect(0, 0, 480, 320);

    // Ceiling
    ctx.fillStyle = "#252030";
    ctx.fillRect(0, 0, 480, 20);

    // Walls (parallax)
    var wallX = -ox * 0.3;
    ctx.fillStyle = "#2a2535";
    ctx.fillRect(0, 20, 480, 252);

    // Wall tiles pattern (subtle)
    ctx.fillStyle = "rgba(40,35,50,0.5)";
    for (var x = 0; x < 5600; x += 64) {
      var sx = x - ox * 0.8;
      if (sx < -64 || sx > 544) continue;
      ctx.fillRect(sx, 20, 1, 252);
    }
    for (var y = 20; y < 272; y += 40) {
      ctx.fillRect(0, y, 480, 1);
    }

    // Broken windows (dim light)
    var windows = [
      { x: 300, y: 30, w: 40, h: 50 },
      { x: 900, y: 30, w: 40, h: 50 },
      { x: 1500, y: 30, w: 40, h: 50 },
      { x: 2100, y: 30, w: 40, h: 50 },
      { x: 2700, y: 30, w: 40, h: 50 },
      { x: 3400, y: 30, w: 40, h: 50 },
      { x: 4000, y: 30, w: 40, h: 50 }
    ];
    for (var i = 0; i < windows.length; i++) {
      var w = windows[i];
      var sx = w.x - ox;
      if (sx < -50 || sx > 530) continue;
      // Window frame
      ctx.fillStyle = "#3a3545";
      ctx.fillRect(sx - 2, w.y - 2, w.w + 4, w.h + 4);
      // Dim moonlight through window
      ctx.fillStyle = "rgba(80,80,120," + (0.15 + Math.sin(this._age * 0.5 + i) * 0.05) + ")";
      ctx.fillRect(sx, w.y, w.w, w.h);
      // Broken glass effect
      ctx.strokeStyle = "rgba(100,100,140,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + w.w * 0.3, w.y);
      ctx.lineTo(sx + w.w * 0.6, w.y + w.h);
      ctx.moveTo(sx, w.y + w.h * 0.4);
      ctx.lineTo(sx + w.w, w.y + w.h * 0.6);
      ctx.stroke();
    }

    // Floor (dark)
    ctx.fillStyle = "#1a1218";
    ctx.fillRect(0, 272 - camera.offsetY, 480, 48);
    ctx.fillStyle = "#221a20";
    ctx.fillRect(0, 272 - camera.offsetY, 480, 2);
  }

  _renderClassrooms(ctx, camera) {
    var ox = camera.offsetX;

    // Section dividers (doorframes)
    var dividers = [1600, 3200, 4400];
    for (var i = 0; i < dividers.length; i++) {
      var dx = dividers[i] - ox;
      if (dx < -20 || dx > 500) continue;
      ctx.fillStyle = "#3a3040";
      ctx.fillRect(dx - 8, 20, 16, 252);
      ctx.fillStyle = "#4a4050";
      ctx.fillRect(dx - 4, 20, 8, 252);
      // Room number
      ctx.fillStyle = "#666";
      ctx.font = "7px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("6-" + (i + 1), dx, 16);
    }

    // Overturned desks (background decoration)
    var desks = [
      { x: 120, y: 252, w: 32, h: 16, tilt: false },
      { x: 280, y: 256, w: 28, h: 12, tilt: true },
      { x: 560, y: 254, w: 30, h: 14, tilt: false },
      { x: 820, y: 256, w: 32, h: 12, tilt: true },
      { x: 1150, y: 252, w: 28, h: 16, tilt: false },
      { x: 1680, y: 254, w: 32, h: 14, tilt: true },
      { x: 2050, y: 256, w: 30, h: 12, tilt: false },
      { x: 2380, y: 252, w: 28, h: 16, tilt: true },
      { x: 2700, y: 254, w: 32, h: 14, tilt: false },
      { x: 3080, y: 256, w: 30, h: 12, tilt: true },
      { x: 3400, y: 252, w: 28, h: 16, tilt: false },
      { x: 3700, y: 256, w: 32, h: 12, tilt: true },
      { x: 3900, y: 254, w: 30, h: 14, tilt: false },
      { x: 4150, y: 256, w: 28, h: 12, tilt: true }
    ];

    for (var i = 0; i < desks.length; i++) {
      var d = desks[i];
      var sx = d.x - ox;
      if (sx < -40 || sx > 520) continue;
      ctx.save();
      if (d.tilt) {
        ctx.translate(sx + d.w / 2, d.y + d.h / 2);
        ctx.rotate(0.3);
        ctx.translate(-(sx + d.w / 2), -(d.y + d.h / 2));
      }
      // Desk body
      ctx.fillStyle = "#5a4a38";
      ctx.fillRect(sx, d.y, d.w, d.h);
      ctx.fillStyle = "#6a5a48";
      ctx.fillRect(sx + 2, d.y + 2, d.w - 4, d.h - 4);
      // Legs
      ctx.fillStyle = "#444";
      ctx.fillRect(sx + 2, d.y + d.h, 2, 4);
      ctx.fillRect(sx + d.w - 4, d.y + d.h, 2, 4);
      ctx.restore();
    }

    // Papers on floor
    ctx.fillStyle = "rgba(220,215,200,0.3)";
    var papers = [150, 380, 520, 780, 950, 1200, 1500, 1800, 2100, 2400, 2750, 3050, 3350, 3600, 3850, 4100];
    for (var i = 0; i < papers.length; i++) {
      var px = papers[i] - ox;
      if (px < -10 || px > 490) continue;
      ctx.fillRect(px, 264 + (i % 3) * 2, 8, 6);
    }
  }

  _renderCobwebs(ctx, camera) {
    var ox = camera.offsetX;
    ctx.strokeStyle = "rgba(200,200,200,0.2)";
    ctx.lineWidth = 1;

    for (var i = 0; i < this._cobwebs.length; i++) {
      var cw = this._cobwebs[i];
      var sx = cw.x - ox;
      if (sx < -100 || sx > 580) continue;

      // Draw cobweb strands
      ctx.beginPath();
      // Corner anchor
      ctx.moveTo(sx, cw.y);
      ctx.lineTo(sx + cw.w, cw.y + cw.h);
      ctx.moveTo(sx + cw.w, cw.y);
      ctx.lineTo(sx, cw.y + cw.h);
      ctx.moveTo(sx + cw.w / 2, cw.y);
      ctx.lineTo(sx + cw.w / 2, cw.y + cw.h);
      ctx.moveTo(sx, cw.y + cw.h / 2);
      ctx.lineTo(sx + cw.w, cw.y + cw.h / 2);
      ctx.stroke();

      // Concentric arcs
      ctx.beginPath();
      for (var r = 1; r <= 3; r++) {
        var rad = r * (cw.w / 6);
        ctx.moveTo(sx + cw.w / 2 + rad, cw.y + cw.h / 2);
        ctx.arc(sx + cw.w / 2, cw.y + cw.h / 2, rad, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
  }

  _renderDoor(ctx, camera) {
    var ox = camera.offsetX;
    var doorX = 4400 - ox;
    if (doorX < -40 || doorX > 520) return;

    // Door frame
    ctx.fillStyle = "#4a4050";
    ctx.fillRect(doorX - 6, 180, 12, 92);

    if (this._doorOpen) {
      // Open door - dark passage
      ctx.fillStyle = "#0a0812";
      ctx.fillRect(doorX - 4, 182, 8, 88);
      // Green glow indicating passage
      ctx.fillStyle = "rgba(80,200,120,0.15)";
      ctx.fillRect(doorX - 10, 178, 20, 96);
      // Arrow
      ctx.fillStyle = "#50c878";
      ctx.font = "8px Courier New";
      ctx.textAlign = "center";
      ctx.fillText(">>>", doorX, 175);
    } else {
      // Closed/locked door
      ctx.fillStyle = "#3a2828";
      ctx.fillRect(doorX - 4, 182, 8, 88);
      // Lock
      ctx.fillStyle = "#f44";
      ctx.fillRect(doorX - 2, 220, 4, 4);
      // Text
      ctx.fillStyle = "#f44";
      ctx.font = "6px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("LOCKED", doorX, 175);
    }
  }

  _renderBossArena(ctx, camera) {
    var ox = camera.offsetX;

    // Only render when in view
    var arenaStart = 4400 - ox;
    if (arenaStart > 520) return;

    // Dark purple lighting overlay for boss arena
    if (this.game.localPlayer && this.game.localPlayer.x > 4300) {
      var intensity = Math.min(1, (this.game.localPlayer.x - 4300) / 200);
      ctx.fillStyle = "rgba(30,10,40," + (intensity * 0.3) + ")";
      ctx.fillRect(0, 0, 480, 320);
    }

    // Candles
    for (var i = 0; i < this._candles.length; i++) {
      var c = this._candles[i];
      var sx = c.x - ox;
      if (sx < -10 || sx > 490) continue;

      // Candle body
      ctx.fillStyle = "#ddc";
      ctx.fillRect(sx, c.y, 4, 10);
      // Flame (animated)
      var flicker = Math.sin(this._age * 8 + i * 2) * 2;
      ctx.fillStyle = "#fa0";
      ctx.fillRect(sx, c.y - 4 + flicker, 4, 4);
      ctx.fillStyle = "#ff0";
      ctx.fillRect(sx + 1, c.y - 3 + flicker, 2, 2);
      // Light glow
      ctx.fillStyle = "rgba(255,180,50,0.06)";
      ctx.beginPath();
      ctx.arc(sx + 2, c.y - 2, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _renderFlicker(ctx, camera) {
    // Flickering darkness overlay - creepy atmosphere
    var flicker = this._flickerAlpha;
    // More intense flicker occasionally
    if (Math.random() < 0.02) flicker = 0.3 + Math.random() * 0.3;

    ctx.fillStyle = "rgba(10,8,15," + (1.0 - flicker) * 0.4 + ")";
    ctx.fillRect(0, 0, 480, 320);

    // Occasional full-darkness flicker (lights out moment)
    if (Math.random() < 0.003) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, 480, 320);
    }
  }
}
