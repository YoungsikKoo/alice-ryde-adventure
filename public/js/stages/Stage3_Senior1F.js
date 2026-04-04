/* ================================================================
   Stage 3 - Senior 1F: Ryde Public School Senior Classrooms
   Side-scroll substage: 3 classroom sections + bathroom boss arena

   Enemies:
     ZombieStudent       - initially still at desks, transforms when player is near
     CrazyCrayonKid      - student who throws crayon projectiles
     PaperPlaneAttacker  - stationary student who throws paper planes
     GlueMonster         - slow tanky glue blob that leaves sticky trails
     ToiletKing          - bathroom boss, spits dirty water projectiles
     CrayonProjectile    - small colored rectangle projectile
     PaperPlaneProjectile- fast straight-line paper plane projectile
     DirtyWaterProjectile - arcing projectile that creates puddles
   ================================================================ */

/* ---------- Dirty Water Projectile ---------- */
class DirtyWaterProjectile extends Entity {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: 8, height: 8,
      speed: 0, color: "#6b5b3a",
      type: "enemy", tags: ["enemy"]
    });
    this.damage = cfg.damage || 15;
    this.dirX = cfg.dirX || 0;
    this.dirY = cfg.dirY || -1;
    this.flySpeed = cfg.flySpeed || 140;
    this.gravity = cfg.gravity || 300;
    this.vyLocal = cfg.vyStart || -120;
    this.lifetime = 4;
    this.alive = true;
    this.hp = 1; this.maxHp = 1;
    this.atk = this.damage; this.def = 0;
    this.contactDamage = this.damage;
    this.showHP = false;
    this.name = "Dirty Water";
    this.enemyType = "dirtyWater";
    this.expReward = 0;
    this._age = 0;
    this._landed = false;
    this._ownerStage = cfg.ownerStage || null;
    this.groundY = cfg.groundY || 272;
  }

  update(dt) {
    if (!this.alive || this._landed) return;
    this.x += this.dirX * this.flySpeed * dt;
    this.vyLocal += this.gravity * dt;
    this.y += this.vyLocal * dt;
    this._age += dt;
    this.lifetime -= dt;

    /* Land on ground */
    if (this.y + this.height >= this.groundY) {
      this.y = this.groundY - this.height;
      this._landed = true;
      this.alive = false;
      /* Create puddle hazard */
      if (this._ownerStage && this._ownerStage.ss) {
        this._ownerStage._addDirtyPuddle(this.x, this.groundY - 6);
      }
      this.destroy();
      return;
    }

    if (this.lifetime <= 0 || this.x < -20 || this.x > 5200 || this.y < -40) {
      this.alive = false; this.destroy();
    }
  }

  takeDamage() { this.alive = false; this.destroy(); }

  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -10 || sp.x > 500 || sp.y < -10 || sp.y > 340) return;
    var pulse = 0.6 + Math.sin(this._age * 14) * 0.4;
    /* brown/green glob */
    ctx.fillStyle = "rgba(90,75,40," + pulse + ")";
    ctx.beginPath();
    ctx.arc(sp.x + 4, sp.y + 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(60,100,40,0.8)";
    ctx.beginPath();
    ctx.arc(sp.x + 4, sp.y + 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ---------- Dirty Tissue Projectile ---------- */
class DirtyTissueProjectile extends Entity {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: 10, height: 8,
      speed: 0, color: "#e8e0c0",
      type: "enemy", tags: ["enemy"]
    });
    this.damage = cfg.damage || 12;
    this.dirX = cfg.dirX || 0;
    this.flySpeed = cfg.flySpeed || 100;
    this.gravity = cfg.gravity || 250;
    this.vyLocal = cfg.vyStart || -90;
    this.lifetime = 5;
    this.alive = true;
    this.hp = 1; this.maxHp = 1;
    this.atk = this.damage; this.def = 0;
    this.contactDamage = this.damage;
    this.showHP = false;
    this.name = "Dirty Tissue";
    this.enemyType = "dirtyTissue";
    this.expReward = 0;
    this._age = 0;
    this._spin = 0;
    this._ownerStage = cfg.ownerStage || null;
    this.groundY = cfg.groundY || 272;
    this._stunDuration = 0.3;

    /* Play retching sound: "BLEGH!!!" */
    try {
      var s = game.sound;
      if (s && s.ctx && !s.muted) {
        var t = s.ctx.currentTime;
        /* First retch: low 80Hz rising to 400Hz then dropping to 60Hz */
        var o1 = s.ctx.createOscillator(), g1 = s.ctx.createGain();
        o1.type = "sawtooth";
        o1.frequency.setValueAtTime(80, t);
        o1.frequency.exponentialRampToValueAtTime(400, t + 0.08);
        o1.frequency.exponentialRampToValueAtTime(60, t + 0.25);
        g1.gain.setValueAtTime(0.2, t);
        g1.gain.exponentialRampToValueAtTime(0.05, t + 0.18);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        o1.connect(g1); g1.connect(s.sfxGain);
        o1.start(t); o1.stop(t + 0.25);
        /* Second burst: 100->300->50Hz in 0.15s */
        var o2 = s.ctx.createOscillator(), g2 = s.ctx.createGain();
        o2.type = "sawtooth";
        o2.frequency.setValueAtTime(100, t + 0.28);
        o2.frequency.exponentialRampToValueAtTime(300, t + 0.34);
        o2.frequency.exponentialRampToValueAtTime(50, t + 0.43);
        g2.gain.setValueAtTime(0.001, t);
        g2.gain.setValueAtTime(0.2, t + 0.28);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.43);
        o2.connect(g2); g2.connect(s.sfxGain);
        o2.start(t + 0.28); o2.stop(t + 0.43);
      }
    } catch (e) {}
  }

  update(dt) {
    if (!this.alive) return;
    this.x += this.dirX * this.flySpeed * dt;
    this.vyLocal += this.gravity * dt;
    this.y += this.vyLocal * dt;
    this._age += dt;
    this._spin += dt * 8;
    this.lifetime -= dt;

    /* Land on ground */
    if (this.y + this.height >= this.groundY) {
      this.y = this.groundY - this.height;
      this.alive = false;
      /* Create puddle hazard on landing */
      if (this._ownerStage && this._ownerStage.ss) {
        this._ownerStage._addDirtyPuddle(this.x, this.groundY - 6);
      }
      this.destroy();
      return;
    }

    if (this.lifetime <= 0 || this.x < -20 || this.x > 5200 || this.y < -40) {
      this.alive = false; this.destroy();
    }
  }

  takeDamage() { this.alive = false; this.destroy(); }

  onHitPlayer(player) {
    /* Apply stun effect: player can't move for 0.3s */
    if (player && !player._tissueStunned) {
      player._tissueStunned = true;
      if (!player._origSpeed) player._origSpeed = player.speed;
      player.speed = 0;
      var origSpd = player._origSpeed;
      setTimeout(function() {
        player.speed = origSpd || 2.2;
        player._tissueStunned = false;
        player._origSpeed = null;
      }, this._stunDuration * 1000);
    }
  }

  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -10 || sp.x > 500 || sp.y < -10 || sp.y > 340) return;

    ctx.save();
    ctx.translate(sp.x + 5, sp.y + 4);
    ctx.rotate(this._spin);

    /* Crumpled tissue base - irregular white shape */
    ctx.fillStyle = "#f5f0e0";
    ctx.beginPath();
    ctx.moveTo(-4, -3);
    ctx.lineTo(-2, -4);
    ctx.lineTo(2, -3);
    ctx.lineTo(5, -2);
    ctx.lineTo(4, 1);
    ctx.lineTo(3, 4);
    ctx.lineTo(0, 3);
    ctx.lineTo(-3, 4);
    ctx.lineTo(-5, 1);
    ctx.closePath();
    ctx.fill();

    /* Crumpled edges - slightly darker */
    ctx.fillStyle = "#e8e0c8";
    ctx.beginPath();
    ctx.moveTo(-3, -2);
    ctx.lineTo(0, -3);
    ctx.lineTo(2, -1);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1, 1);
    ctx.lineTo(3, 0);
    ctx.lineTo(4, 3);
    ctx.lineTo(1, 2);
    ctx.closePath();
    ctx.fill();

    /* Brown stains */
    ctx.fillStyle = "rgba(120,90,40,0.7)";
    ctx.fillRect(-2, -1, 3, 2);
    ctx.fillStyle = "rgba(140,110,30,0.5)";
    ctx.fillRect(1, 1, 2, 2);
    /* Yellow stain */
    ctx.fillStyle = "rgba(180,160,50,0.4)";
    ctx.fillRect(-3, 1, 2, 2);
    /* Dark brown spot */
    ctx.fillStyle = "rgba(80,60,20,0.6)";
    ctx.fillRect(0, -2, 2, 1);

    ctx.restore();
  }
}

/* ---------- Zombie Student ---------- */
class ZombieStudent extends Enemy {
  constructor(g, c) {
    super(g, {
      ...c,
      enemyType: c.enemyType || "zombieStudent",
      name: c.name || "Zombie Student",
      hp: c.hp || 25,
      atk: c.atk || 9,
      def: c.def || 2,
      speed: c.speed || 1.65,
      contactDamage: c.contactDamage || 10,
      color: "#87CEEB",
      aggroRange: 0,
      ai: "stationary",
      expReward: c.expReward || 6,
      width: c.width || 20,
      height: c.height || 28
    });
    this._transformed = false;
    this._transformRange = c.transformRange || 120;
    this._isBoy = c.isBoy !== undefined ? c.isBoy : (Math.random() > 0.5);
    this._deskY = c.deskY || null;
    this._transformTimer = 0;
    this._animPhase = 0;
    this._transforming = false;
    this._transformDuration = 0.5;
  }

  update(dt) {
    if (!this.alive || !this.active) return;
    this._animPhase += dt;

    /* Check proximity for transformation */
    if (!this._transformed) {
      var p = this._nearestPlayer();
      if (p && this.distanceTo(p) < this._transformRange) {
        this._startTransform();
      }
      return; /* Don't move until transformed */
    }

    /* Transforming animation */
    if (this._transforming) {
      this._transformTimer += dt;
      if (this._transformTimer >= this._transformDuration) {
        this._transforming = false;
        this.ai = "chase";
        this.aggroRange = 200;
        this.aggroed = true;
      }
      return;
    }

    /* Normal enemy update after transformation */
    super.update(dt);
  }

  _startTransform() {
    this._transformed = true;
    this._transforming = true;
    this._transformTimer = 0;
    this.speed = 1.5;
    this.chaseSpeed = 1.5 * 1.4;
    /* Play transform SFX */
    try {
      var s = this.game.sound;
      if (s && s.ctx && !s.muted) {
        var t = s.ctx.currentTime;
        var o = s.ctx.createOscillator(), g = s.ctx.createGain();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(200, t);
        o.frequency.exponentialRampToValueAtTime(80, t + 0.3);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        o.connect(g); g.connect(s.sfxGain);
        o.start(t); o.stop(t + 0.4);
      }
    } catch (e) {}
  }

  render(ctx, camera) {
    if (!this.alive || !this.visible) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -20 || sp.x > 500 || sp.y < -20 || sp.y > 340) return;

    var sx = Math.floor(sp.x), sy = Math.floor(sp.y);
    var w = this.width, h = this.height;

    if (!this._transformed) {
      /* Normal student sitting at desk */
      /* Body - pale blue polo shirt */
      ctx.fillStyle = "#87CEEB";
      ctx.fillRect(sx + 3, sy + 10, w - 6, h - 16);
      /* Head */
      ctx.fillStyle = this._isBoy ? "#f0c090" : "#f0c0a0";
      ctx.fillRect(sx + 5, sy, w - 10, 10);
      /* Hair */
      ctx.fillStyle = this._isBoy ? "#4a3520" : "#3a2510";
      ctx.fillRect(sx + 5, sy, w - 10, 4);
      /* Pink hair bow for girls */
      if (!this._isBoy) {
        ctx.fillStyle = "#ff69b4";
        ctx.fillRect(sx + w - 8, sy, 5, 4);
      }
      /* Navy shorts/skirt */
      ctx.fillStyle = "#1a1a4a";
      ctx.fillRect(sx + 4, sy + h - 8, w - 8, 8);
      /* Eyes */
      ctx.fillStyle = "#222";
      ctx.fillRect(sx + 7, sy + 4, 2, 2);
      ctx.fillRect(sx + w - 9, sy + 4, 2, 2);
    } else if (this._transforming) {
      /* Transforming - shaking, green tint flickering */
      var shake = Math.sin(this._transformTimer * 30) * 2;
      var greenAmt = this._transformTimer / this._transformDuration;
      ctx.save();
      ctx.globalAlpha = 0.5 + greenAmt * 0.5;
      /* Green tinted body */
      var r = Math.floor(135 * (1 - greenAmt) + 80 * greenAmt);
      var g = Math.floor(206 * (1 - greenAmt) + 180 * greenAmt);
      var b = Math.floor(235 * (1 - greenAmt) + 60 * greenAmt);
      ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
      ctx.fillRect(sx + 3 + shake, sy + 10, w - 6, h - 16);
      /* Head with green tint */
      ctx.fillStyle = "rgb(" + Math.floor(200 * (1 - greenAmt) + 120 * greenAmt) + "," +
                       Math.floor(180 * (1 - greenAmt) + 200 * greenAmt) + "," +
                       Math.floor(130 * (1 - greenAmt) + 80 * greenAmt) + ")";
      ctx.fillRect(sx + 5 + shake, sy, w - 10, 10);
      ctx.restore();
    } else {
      /* Zombie form - green tint, arms forward */
      var bob = Math.sin(this._animPhase * 4) * 1;
      /* Body - greenish polo */
      ctx.fillStyle = "#5a9a50";
      ctx.fillRect(sx + 3, sy + 10 + bob, w - 6, h - 16);
      /* Head - green tinted skin */
      ctx.fillStyle = "#7aaa60";
      ctx.fillRect(sx + 5, sy + bob, w - 10, 10);
      /* Zombie eyes - glowing */
      ctx.fillStyle = "#ff0";
      ctx.fillRect(sx + 7, sy + 4 + bob, 2, 2);
      ctx.fillRect(sx + w - 9, sy + 4 + bob, 2, 2);
      /* Arms forward */
      ctx.fillStyle = "#6a9a50";
      if (this.direction === "right") {
        ctx.fillRect(sx + w - 2, sy + 12 + bob, 8, 3);
        ctx.fillRect(sx + w - 2, sy + 17 + bob, 8, 3);
      } else {
        ctx.fillRect(sx - 6, sy + 12 + bob, 8, 3);
        ctx.fillRect(sx - 6, sy + 17 + bob, 8, 3);
      }
      /* Navy shorts/skirt */
      ctx.fillStyle = "#1a1a3a";
      ctx.fillRect(sx + 4, sy + h - 8 + bob, w - 8, 8);
      /* Drool */
      if (Math.sin(this._animPhase * 6) > 0.3) {
        ctx.fillStyle = "#5a8a40";
        ctx.fillRect(sx + 9, sy + 10 + bob, 2, 3);
      }
    }

    /* HP bar */
    if (this._transformed && this.hp < this.maxHp) {
      var pr = this.hp / this.maxHp;
      ctx.fillStyle = "#300";
      ctx.fillRect(sx, sy - 5, w, 3);
      ctx.fillStyle = "#e84855";
      ctx.fillRect(sx, sy - 5, Math.floor(w * pr), 3);
    }
  }
}

/* ---------- Crayon Projectile ---------- */
class CrayonProjectile extends Entity {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: 14, height: 8,
      speed: 0, color: cfg.color || "#e03030",
      type: "enemy", tags: ["enemy"]
    });
    this.damage = cfg.damage || 10;
    this.lifetime = 4;
    this.alive = true;
    this.hp = 1; this.maxHp = 1;
    this.atk = this.damage; this.def = 0;
    this.contactDamage = this.damage;
    this.showHP = false;
    this.name = "Crayon";
    this.enemyType = "crayonProjectile";
    this.expReward = 0;
    this._age = 0;
    this._crayonColor = cfg.color || "#e03030";
    /* Aim at player */
    var p = game.localPlayer;
    if (p) {
      var dx = (p.x+p.width/2) - cfg.x, dy = (p.y+p.height/2) - cfg.y;
      var d = Math.sqrt(dx*dx+dy*dy) || 1;
      this._vx = (dx/d) * 160;
      this._vy = (dy/d) * 160;
    } else {
      this._vx = (cfg.dirX || -1) * 160;
      this._vy = 0;
    }
    this.dirX = this._vx > 0 ? 1 : -1;
  }

  update(dt) {
    if (!this.alive) return;
    this.x += this._vx * dt;
    this.y += this._vy * dt;
    this._age += dt;
    this.lifetime -= dt;
    if (this.lifetime <= 0 || this.x < -20 || this.x > 5200 || this.y < -20 || this.y > 340) {
      this.alive = false; this.destroy(); return;
    }
    /* Direct player hit check */
    var p = this.game.localPlayer;
    if (p && p.alive && !p.invincible) {
      if (p.x+p.width > this.x && p.x < this.x+this.width && p.y+p.height > this.y && p.y < this.y+this.height) {
        p.takeDamage(this.damage, {x:this.x, y:this.y});
        this.alive = false; this.destroy(); return;
      }
    }
  }

  takeDamage() { this.alive = false; this.destroy(); }

  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -10 || sp.x > 500 || sp.y < -10 || sp.y > 340) return;
    /* Colored crayon rectangle */
    ctx.fillStyle = this._crayonColor;
    ctx.fillRect(sp.x, sp.y, 10, 4);
    /* Crayon tip */
    ctx.fillStyle = "#f8e8a0";
    if (this.dirX > 0) {
      ctx.fillRect(sp.x + 10, sp.y + 1, 3, 2);
    } else {
      ctx.fillRect(sp.x - 3, sp.y + 1, 3, 2);
    }
  }
}

/* ---------- Paper Plane Projectile ---------- */
class PaperPlaneProjectile extends Entity {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: 16, height: 10,
      speed: 0, color: "#f0f0f0",
      type: "enemy", tags: ["enemy"]
    });
    this.damage = cfg.damage || 7;
    this.lifetime = 5;
    this.alive = true;
    this.hp = 1; this.maxHp = 1;
    this.atk = this.damage; this.def = 0;
    this.contactDamage = this.damage;
    this.showHP = false;
    this.name = "Paper Plane";
    this.enemyType = "paperPlaneProjectile";
    this.expReward = 0;
    this._age = 0;
    /* Aim at player */
    var p = game.localPlayer;
    if (p) {
      var dx = (p.x+p.width/2) - cfg.x, dy = (p.y+p.height/2) - cfg.y;
      var d = Math.sqrt(dx*dx+dy*dy) || 1;
      this._vx = (dx/d) * 200;
      this._vy = (dy/d) * 200;
    } else {
      this._vx = (cfg.dirX || -1) * 200;
      this._vy = 0;
    }
    this.dirX = this._vx > 0 ? 1 : -1;
  }

  update(dt) {
    if (!this.alive) return;
    this.x += this._vx * dt;
    this.y += this._vy * dt;
    this._age += dt;
    this.lifetime -= dt;
    if (this.lifetime <= 0 || this.x < -20 || this.x > 5200 || this.y < -20 || this.y > 340) {
      this.alive = false; this.destroy(); return;
    }
    /* Direct player hit check */
    var p = this.game.localPlayer;
    if (p && p.alive && !p.invincible) {
      if (p.x+p.width > this.x && p.x < this.x+this.width && p.y+p.height > this.y && p.y < this.y+this.height) {
        p.takeDamage(this.damage, {x:this.x, y:this.y});
        this.alive = false; this.destroy(); return;
      }
    }
  }

  takeDamage() { this.alive = false; this.destroy(); }

  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -10 || sp.x > 500 || sp.y < -10 || sp.y > 340) return;
    var sx = sp.x, sy = sp.y;
    var flip = this.dirX > 0 ? 1 : -1;
    /* Paper plane shape */
    ctx.fillStyle = "#f0f0f0";
    ctx.beginPath();
    ctx.moveTo(sx + (flip > 0 ? 12 : 0), sy + 3);
    ctx.lineTo(sx + (flip > 0 ? 0 : 12), sy);
    ctx.lineTo(sx + (flip > 0 ? 0 : 12), sy + 6);
    ctx.closePath();
    ctx.fill();
    /* Fold line */
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(sx + (flip > 0 ? 12 : 0), sy + 3);
    ctx.lineTo(sx + (flip > 0 ? 0 : 12), sy + 3);
    ctx.stroke();
  }
}

/* ---------- Crazy Crayon Kid ---------- */
class CrazyCrayonKid extends Enemy {
  constructor(g, c) {
    super(g, {
      ...c,
      enemyType: c.enemyType || "crazyCrayonKid",
      name: c.name || "Crazy Crayon Kid",
      hp: c.hp || 20,
      atk: c.atk || 11,
      def: c.def || 1,
      speed: c.speed || 1.98,
      contactDamage: c.contactDamage || 8,
      color: "#ffcc00",
      aggroRange: 160,
      ai: "chase",
      expReward: c.expReward || 8,
      width: c.width || 18,
      height: c.height || 26
    });
    this._shootTimer = 0;
    this._shootInterval = 2.5;
    this._animPhase = 0;
    this._crayonColors = ["#e03030", "#3070e0", "#30a040", "#e0c020"];
    this._currentCrayon = 0;
    this._ownerStage = c.ownerStage || null;
  }

  update(dt) {
    if (!this.alive || !this.active) return;
    this._animPhase += dt;
    super.update(dt);

    /* Shoot crayons at player */
    this._shootTimer += dt;
    if (this._shootTimer >= this._shootInterval) {
      this._shootTimer = 0;
      this._throwCrayon();
    }
  }

  _throwCrayon() {
    var p = this._nearestPlayer();
    if (!p || this.distanceTo(p) > 200) return;
    var dirX = p.x > this.x ? 1 : -1;
    var color = this._crayonColors[this._currentCrayon % this._crayonColors.length];
    this._currentCrayon++;
    var proj = new CrayonProjectile(this.game, {
      x: this.x + (dirX > 0 ? this.width : -10),
      y: this.y + 10,
      dirX: dirX,
      damage: this.atk,
      color: color
    });
    proj.sideScrollMode = true;
    proj.svy = 0;
    this.game.addEntity(proj);
    if (this._ownerStage) this._ownerStage.enemies.push(proj);
  }

  render(ctx, camera) {
    if (!this.alive || !this.visible) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -20 || sp.x > 500 || sp.y < -20 || sp.y > 340) return;

    var sx = Math.floor(sp.x), sy = Math.floor(sp.y);
    var w = this.width, h = this.height;
    var bob = Math.sin(this._animPhase * 5) * 1;

    /* Body - yellow school shirt */
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(sx + 3, sy + 9 + bob, w - 6, h - 15);
    /* Head - skin */
    ctx.fillStyle = "#f0c090";
    ctx.fillRect(sx + 4, sy + bob, w - 8, 9);
    /* Messy hair - sticking up */
    ctx.fillStyle = "#6a4020";
    ctx.fillRect(sx + 4, sy - 2 + bob, w - 8, 5);
    ctx.fillRect(sx + 3, sy - 4 + bob, 3, 4);
    ctx.fillRect(sx + w - 6, sy - 4 + bob, 3, 4);
    ctx.fillRect(sx + 8, sy - 5 + bob, 3, 4);
    /* Eyes - wild */
    ctx.fillStyle = "#222";
    ctx.fillRect(sx + 6, sy + 4 + bob, 2, 2);
    ctx.fillRect(sx + w - 8, sy + 4 + bob, 2, 2);
    /* Mouth - grinning */
    ctx.fillStyle = "#c04040";
    ctx.fillRect(sx + 7, sy + 7 + bob, w - 14, 1);
    /* Navy shorts */
    ctx.fillStyle = "#1a1a4a";
    ctx.fillRect(sx + 4, sy + h - 8 + bob, w - 8, 8);
    /* Crayon in hand */
    var cColor = this._crayonColors[this._currentCrayon % this._crayonColors.length];
    ctx.fillStyle = cColor;
    if (this.direction === "right") {
      ctx.fillRect(sx + w, sy + 10 + bob, 8, 3);
    } else {
      ctx.fillRect(sx - 8, sy + 10 + bob, 8, 3);
    }

    /* HP bar */
    if (this.hp < this.maxHp) {
      var pr = this.hp / this.maxHp;
      ctx.fillStyle = "#300";
      ctx.fillRect(sx, sy - 5, w, 3);
      ctx.fillStyle = "#e84855";
      ctx.fillRect(sx, sy - 5, Math.floor(w * pr), 3);
    }
  }
}

/* ---------- Paper Plane Attacker ---------- */
class PaperPlaneAttacker extends Enemy {
  constructor(g, c) {
    super(g, {
      ...c,
      enemyType: c.enemyType || "paperPlaneAttacker",
      name: c.name || "Paper Plane Attacker",
      hp: c.hp || 15,
      atk: c.atk || 8,
      def: c.def || 0,
      speed: c.speed || 1.1,
      contactDamage: c.contactDamage || 6,
      color: "#b0b0b0",
      aggroRange: 0,
      ai: "stationary",
      expReward: c.expReward || 7,
      width: c.width || 20,
      height: c.height || 28
    });
    this._shootTimer = 0;
    this._shootInterval = 3.0;
    this._animPhase = 0;
    this._foldPhase = 0;
    this._ownerStage = c.ownerStage || null;
  }

  update(dt) {
    if (!this.alive || !this.active) return;
    this._animPhase += dt;
    this._foldPhase += dt;

    /* Throw paper planes at player */
    this._shootTimer += dt;
    if (this._shootTimer >= this._shootInterval) {
      this._shootTimer = 0;
      this._throwPlane();
    }
  }

  _throwPlane() {
    var p = this._nearestPlayer();
    if (!p || this.distanceTo(p) > 300) return;
    var dirX = p.x > this.x ? 1 : -1;
    var proj = new PaperPlaneProjectile(this.game, {
      x: this.x + (dirX > 0 ? this.width : -12),
      y: this.y + 8,
      dirX: dirX,
      damage: this.atk
    });
    proj.sideScrollMode = true;
    proj.svy = 0;
    this.game.addEntity(proj);
    if (this._ownerStage) this._ownerStage.enemies.push(proj);
  }

  render(ctx, camera) {
    if (!this.alive || !this.visible) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -20 || sp.x > 500 || sp.y < -20 || sp.y > 340) return;

    var sx = Math.floor(sp.x), sy = Math.floor(sp.y);
    var w = this.width, h = this.height;

    /* Body - pale blue polo shirt (sitting at desk) */
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(sx + 3, sy + 10, w - 6, h - 16);
    /* Head */
    ctx.fillStyle = "#f0c090";
    ctx.fillRect(sx + 5, sy, w - 10, 10);
    /* Hair - neat */
    ctx.fillStyle = "#3a2510";
    ctx.fillRect(sx + 5, sy, w - 10, 4);
    /* Glasses */
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(sx + 6, sy + 3, 4, 4);
    ctx.strokeRect(sx + w - 10, sy + 3, 4, 4);
    /* Eyes behind glasses */
    ctx.fillStyle = "#222";
    ctx.fillRect(sx + 7, sy + 5, 2, 1);
    ctx.fillRect(sx + w - 9, sy + 5, 2, 1);
    /* Navy shorts */
    ctx.fillStyle = "#1a1a4a";
    ctx.fillRect(sx + 4, sy + h - 8, w - 8, 8);
    /* Desk surface */
    ctx.fillStyle = "#c4a060";
    ctx.fillRect(sx - 4, sy + h - 10, w + 8, 3);
    /* Paper in hands - folding animation */
    var fold = Math.sin(this._foldPhase * 3) * 0.5 + 0.5;
    ctx.fillStyle = "#f8f8f0";
    ctx.fillRect(sx + 4, sy + 14, 6, Math.floor(4 * fold + 2));
    /* Stack of paper planes on desk */
    ctx.fillStyle = "#f0f0e8";
    ctx.fillRect(sx + w - 2, sy + h - 14, 8, 3);
    ctx.fillRect(sx + w - 1, sy + h - 17, 7, 3);

    /* HP bar */
    if (this.hp < this.maxHp) {
      var pr = this.hp / this.maxHp;
      ctx.fillStyle = "#300";
      ctx.fillRect(sx, sy - 5, w, 3);
      ctx.fillStyle = "#e84855";
      ctx.fillRect(sx, sy - 5, Math.floor(w * pr), 3);
    }
  }
}

/* ---------- Glue Monster ---------- */
class GlueMonster extends Enemy {
  constructor(g, c) {
    super(g, {
      ...c,
      enemyType: c.enemyType || "glueMonster",
      name: c.name || "Glue Monster",
      hp: c.hp || 30,
      atk: c.atk || 6,
      def: c.def || 7,
      speed: c.speed || 0.88,
      contactDamage: c.contactDamage || 12,
      color: "#e8e0d0",
      aggroRange: 120,
      ai: "chase",
      expReward: c.expReward || 10,
      width: c.width || 22,
      height: c.height || 20
    });
    this._animPhase = 0;
    this._trailTimer = 0;
    this._trailInterval = 1.2;
    this._ownerStage = c.ownerStage || null;
    this._stickyTrails = [];
  }

  update(dt) {
    if (!this.alive || !this.active) return;
    this._animPhase += dt;
    super.update(dt);

    /* Leave sticky trail */
    this._trailTimer += dt;
    if (this._trailTimer >= this._trailInterval) {
      this._trailTimer = 0;
      this._leaveTrail();
    }

    /* Check if player is in any sticky trail */
    this._updateStickyTrails(dt);
  }

  _leaveTrail() {
    this._stickyTrails.push({
      x: this.x, y: this.y + this.height - 4,
      w: 16, h: 4,
      lifetime: 6,
      age: 0
    });
    /* Limit trail count */
    if (this._stickyTrails.length > 8) {
      this._stickyTrails.shift();
    }
  }

  _updateStickyTrails(dt) {
    var p = this._nearestPlayer();
    for (var i = this._stickyTrails.length - 1; i >= 0; i--) {
      var t = this._stickyTrails[i];
      t.age += dt;
      if (t.age >= t.lifetime) {
        this._stickyTrails.splice(i, 1);
        continue;
      }
      /* Slow player if overlapping */
      if (p && p.x + p.width > t.x && p.x < t.x + t.w &&
          p.y + p.height > t.y && p.y < t.y + t.h + 6) {
        if (!p._glueSlowed) {
          p._glueSlowed = true;
          if (!p._origSpeed) p._origSpeed = p.speed;
          p.speed = p._origSpeed * 0.5;
        }
        p._glueSlowTimer = 3.0;
      }
    }
  }

  render(ctx, camera) {
    if (!this.alive || !this.visible) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -30 || sp.x > 510 || sp.y < -20 || sp.y > 340) return;

    var sx = Math.floor(sp.x), sy = Math.floor(sp.y);
    var w = this.width, h = this.height;
    var wobble = Math.sin(this._animPhase * 3) * 2;
    var squish = Math.sin(this._animPhase * 2) * 1;

    /* Render sticky trails */
    for (var i = 0; i < this._stickyTrails.length; i++) {
      var t = this._stickyTrails[i];
      var tsp = camera.worldToScreen(t.x, t.y);
      var alpha = 0.4 * (1 - t.age / t.lifetime);
      ctx.fillStyle = "rgba(230,225,210," + alpha + ")";
      ctx.fillRect(tsp.x, tsp.y, t.w, t.h);
      /* Shiny highlight */
      ctx.fillStyle = "rgba(255,255,255," + (alpha * 0.5) + ")";
      ctx.fillRect(tsp.x + 2, tsp.y, t.w - 4, 1);
    }

    /* Main body - gooey white blob */
    ctx.fillStyle = "rgba(235,230,215,0.9)";
    ctx.beginPath();
    ctx.ellipse(sx + w / 2 + wobble, sy + h / 2, w / 2 + squish, h / 2 - squish, 0, 0, Math.PI * 2);
    ctx.fill();
    /* Shiny surface */
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.beginPath();
    ctx.ellipse(sx + w / 2 - 2 + wobble, sy + h / 3, w / 4, h / 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    /* Dripping edges */
    ctx.fillStyle = "rgba(230,225,210,0.7)";
    ctx.fillRect(sx + 2 + wobble, sy + h - 2, 4, 4);
    ctx.fillRect(sx + w - 6 + wobble, sy + h - 3, 5, 5);
    /* Googly eyes */
    /* Left eye white */
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(sx + 7 + wobble, sy + 6, 4, 0, Math.PI * 2);
    ctx.fill();
    /* Right eye white */
    ctx.beginPath();
    ctx.arc(sx + w - 7 + wobble, sy + 6, 4, 0, Math.PI * 2);
    ctx.fill();
    /* Left pupil */
    var pupX = Math.sin(this._animPhase * 2) * 1.5;
    var pupY = Math.cos(this._animPhase * 1.5) * 1;
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(sx + 7 + pupX + wobble, sy + 6 + pupY, 2, 0, Math.PI * 2);
    ctx.fill();
    /* Right pupil */
    ctx.beginPath();
    ctx.arc(sx + w - 7 + pupX + wobble, sy + 6 + pupY, 2, 0, Math.PI * 2);
    ctx.fill();

    /* HP bar */
    if (this.hp < this.maxHp) {
      var pr = this.hp / this.maxHp;
      ctx.fillStyle = "#300";
      ctx.fillRect(sx, sy - 5, w, 3);
      ctx.fillStyle = "#e84855";
      ctx.fillRect(sx, sy - 5, Math.floor(w * pr), 3);
    }
  }
}

/* ---------- School Spider (high-res pixel art) ---------- */
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
    /* === 8 Legs with 2 segments each === */
    ctx.strokeStyle = this._bodyColor;
    ctx.lineWidth = Math.max(1, 1.5 * sc);
    for (var i = 0; i < 4; i++) {
      var baseY = sy + 4*sc + i * 3*sc;
      var wave = Math.sin(this._age * 10 + i * 1.8) * 2*sc;
      var wave2 = Math.sin(this._age * 10 + i * 1.8 + 1) * 1.5*sc;
      /* Left leg: 2 segments */
      var lx1 = sx - 2*sc, ly1 = baseY;
      var lx2 = sx - 7*sc, ly2 = baseY + wave;
      var lx3 = sx - 11*sc, ly3 = baseY + wave + 3*sc;
      ctx.beginPath(); ctx.moveTo(lx1,ly1); ctx.lineTo(lx2,ly2); ctx.lineTo(lx3,ly3); ctx.stroke();
      /* Joint dot */
      ctx.fillStyle = this._bodyColor;
      ctx.fillRect(Math.floor(lx2)-1, Math.floor(ly2)-1, 2, 2);
      /* Right leg: 2 segments */
      var rx1 = sx + 20*sc + 2*sc, ry1 = baseY;
      var rx2 = sx + 20*sc + 7*sc, ry2 = baseY + wave2;
      var rx3 = sx + 20*sc + 11*sc, ry3 = baseY + wave2 + 3*sc;
      ctx.beginPath(); ctx.moveTo(rx1,ry1); ctx.lineTo(rx2,ry2); ctx.lineTo(rx3,ry3); ctx.stroke();
      ctx.fillRect(Math.floor(rx2)-1, Math.floor(ry2)-1, 2, 2);
    }
    /* === Cephalothorax (head+body front section) === */
    ctx.fillStyle = this._bodyColor;
    var headW = 10*sc, headH = 7*sc;
    ctx.beginPath();
    ctx.ellipse(sx + 10*sc, sy + 5*sc, headW/2, headH/2, 0, 0, Math.PI*2);
    ctx.fill();
    /* Highlight */
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.ellipse(sx + 9*sc, sy + 3.5*sc, headW/4, headH/4, 0, 0, Math.PI*2);
    ctx.fill();
    /* === Abdomen (larger back section) === */
    ctx.fillStyle = this._bodyColor;
    var abdW = 12*sc, abdH = 9*sc;
    ctx.beginPath();
    ctx.ellipse(sx + 10*sc, sy + 11*sc, abdW/2, abdH/2, 0, 0, Math.PI*2);
    ctx.fill();
    /* Abdomen markings */
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.ellipse(sx + 10*sc, sy + 10*sc, abdW/3, abdH/3, 0, 0, Math.PI*2);
    ctx.fill();
    /* Hourglass/stripe marking */
    ctx.fillStyle = "rgba(200,50,50,0.4)";
    ctx.fillRect(sx + 9*sc, sy + 9*sc, 2*sc, 4*sc);
    /* === Eyes (8 eyes in 2 rows) === */
    ctx.fillStyle = this._eyeColor;
    var glow = 0.6 + Math.sin(this._age*5)*0.4;
    ctx.globalAlpha = glow;
    /* Front row: 4 eyes */
    ctx.fillRect(sx+5*sc, sy+2*sc, 2*sc, 2*sc);
    ctx.fillRect(sx+8*sc, sy+1.5*sc, 2.5*sc, 2.5*sc);
    ctx.fillRect(sx+11*sc, sy+1.5*sc, 2.5*sc, 2.5*sc);
    ctx.fillRect(sx+14*sc, sy+2*sc, 2*sc, 2*sc);
    /* Back row: 4 smaller eyes */
    ctx.fillRect(sx+6*sc, sy+4*sc, 1.5*sc, 1.5*sc);
    ctx.fillRect(sx+9*sc, sy+4.5*sc, 1.5*sc, 1.5*sc);
    ctx.fillRect(sx+12*sc, sy+4.5*sc, 1.5*sc, 1.5*sc);
    ctx.fillRect(sx+15*sc, sy+4*sc, 1.5*sc, 1.5*sc);
    ctx.globalAlpha = 1;
    /* === Fangs === */
    ctx.fillStyle = "#ddd";
    ctx.fillRect(sx+8*sc, sy+6*sc, 1.5*sc, 2.5*sc);
    ctx.fillRect(sx+12*sc, sy+6*sc, 1.5*sc, 2.5*sc);
    /* === Spinnerets (rear) === */
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

/* ---------- Toilet King Boss ---------- */
class ToiletKing extends Enemy {
  constructor(g, c) {
    super(g, {
      ...c,
      enemyType: c.enemyType || "toiletKing",
      name: c.name || "TOILET KING",
      hp: c.hp || 400,
      atk: c.atk || 22,
      def: c.def || 9,
      speed: 1.0,
      contactDamage: c.contactDamage || 30,
      color: "#f0f0e0",
      aggroRange: 300,
      ai: "chase",
      expReward: c.expReward || 80,
      width: c.width || 48,
      height: c.height || 56,
      lootTable: c.lootTable || [
        { item: { name: "Golden Plunger", type: "weapon", equipSlot: "weapon", atk: 18, color: "#ffd700", pickupMessage: "Golden Plunger! Royal weapon!" }, chance: 1 },
        { item: { name: "Porcelain Shield", type: "armor", equipSlot: "armor", def: 12, color: "#f0f0e0", pickupMessage: "Porcelain Shield! Sturdy!" }, chance: 1 },
        { item: { name: "Royal Flush Potion", type: "consumable", heal: 80, color: "#4a90d9", pickupMessage: "Royal Flush! Full restore!" }, chance: 1 }
      ]
    });
    this.isBoss = true;
    this._phase = 1; /* 1: >50%, 2: <50%, 3: <25% */
    this._shootTimer = 2.0;
    this._shootInterval = 1.8;
    this._shakeTimer = 0;
    this._shaking = false;
    this._crackLevel = 0; /* 0-5, visual cracks on hit */
    this._hitCount = 0;
    this._animPhase = 0;
    this._ownerStage = c.ownerStage || null;
    this._rapidFireTimer = 0;
    this._mouthOpen = false;
    this._mouthTimer = 0;
    this._lidAngle = 0;
    this._eyeGlow = 0;
  }

  update(dt) {
    if (!this.alive || !this.active) return;
    this._animPhase += dt;
    this._mouthTimer += dt;

    /* Chase player */
    var p = this._nearestPlayer();
    if (p && p.alive) {
      var dx = p.x - this.x;
      var chaseSpeed = this.speed * 60 * (this._phase >= 3 ? 1.8 : this._phase >= 2 ? 1.3 : 1.0);
      if (Math.abs(dx) > 20) {
        this.x += (dx > 0 ? 1 : -1) * chaseSpeed * dt;
        this.direction = dx > 0 ? "right" : "left";
      }
    }

    var hpRatio = this.hp / this.maxHp;

    /* Phase transitions */
    if (hpRatio <= 0.25 && this._phase < 3) {
      this._phase = 3;
      this._shootInterval = 0.5;
      this._shaking = true;
      if (this.game) {
        this.game.camera.shake(8, 1.0);
        this.game.hud.addChatMessage("TOILET KING is ENRAGED! RAPID FIRE!", "#f44");
      }
    } else if (hpRatio <= 0.5 && this._phase < 2) {
      this._phase = 2;
      this._shootInterval = 1.2;
      if (this.game) {
        this.game.camera.shake(5, 0.6);
        this.game.hud.addChatMessage("TOILET KING attacks in 3 directions + tissue!", "#f0d060");
        this.game.startDialogue([
          { speaker: "TOILET KING", text: "FLUSH YOU ALL! TISSUE ATTACK!" },
          { speaker: "Alice", text: "It's spraying EVERYWHERE AND throwing TISSUES! DODGE!" }
        ]);
      }
    }

    /* Shake animation in phase 3 */
    if (this._shaking) {
      this._shakeTimer += dt;
    }

    /* Shooting */
    this._shootTimer -= dt;
    if (this._shootTimer <= 0) {
      this._shootTimer = this._shootInterval;
      this._shoot();
      this._mouthOpen = true;
      this._mouthTimer = 0;
    }

    /* Close mouth after shooting */
    if (this._mouthOpen && this._mouthTimer > 0.3) {
      this._mouthOpen = false;
    }

    /* Lid bobbing */
    this._lidAngle = Math.sin(this._animPhase * 2) * 5;
    this._eyeGlow = 0.6 + Math.sin(this._animPhase * 3) * 0.4;
  }

  takeDamage(amt, atk) {
    if (!this.alive) return;
    this._hitCount++;
    /* Update crack level every ~4 hits, up to 5 */
    this._crackLevel = Math.min(5, Math.floor(this._hitCount / 4));

    /* Spawn dirty puddle on each hit */
    if (this._ownerStage) {
      var puddleX = this.x + (Math.random() - 0.5) * 80;
      if (Math.random() < 0.4) {
        this._ownerStage._addDirtyPuddle(puddleX, this._ownerStage.ss.groundY - 6);
      }
    }

    /* Camera shake on hit */
    if (this.game) this.game.camera.shake(2, 0.2);

    /* Call parent */
    super.takeDamage(amt, atk);
  }

  _shoot() {
    if (!this.game || !this._ownerStage) return;
    var cx = this.x + this.width / 2;
    var cy = this.y + 10;
    var groundY = this._ownerStage.ss ? this._ownerStage.ss.groundY : 272;

    /* Play spit SFX: "SPLAT!! SPLAT!!" - two quick splatting bursts */
    try {
      var s = this.game.sound;
      if (s && s.ctx && !s.muted) {
        var t = s.ctx.currentTime;
        /* First burst: sawtooth 100->40Hz over 0.1s */
        var o1 = s.ctx.createOscillator(), g1 = s.ctx.createGain();
        o1.type = "sawtooth";
        o1.frequency.setValueAtTime(100, t);
        o1.frequency.exponentialRampToValueAtTime(40, t + 0.1);
        g1.gain.setValueAtTime(0.3, t);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        o1.connect(g1); g1.connect(s.sfxGain);
        o1.start(t); o1.stop(t + 0.12);
        /* Second burst (0.12s later): 120->35Hz over 0.08s */
        var o2 = s.ctx.createOscillator(), g2 = s.ctx.createGain();
        o2.type = "sawtooth";
        o2.frequency.setValueAtTime(120, t + 0.12);
        o2.frequency.exponentialRampToValueAtTime(35, t + 0.20);
        g2.gain.setValueAtTime(0.001, t);
        g2.gain.setValueAtTime(0.25, t + 0.12);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o2.connect(g2); g2.connect(s.sfxGain);
        o2.start(t + 0.12); o2.stop(t + 0.22);
      }
    } catch (e) {}

    /* Show chat bubble */
    if (this.game && this.game.hud) {
      this.game.combat.spawnDamageNumber(cx, this.y - 10, "SPLAT!! SPLAT!!", "#8b6b3a");
    }

    if (this._phase === 1) {
      /* Phase 1: spit forward (toward player) */
      var p = this._nearestPlayer();
      var dirX = -1;
      if (p) dirX = p.x < this.x ? -1 : 1;
      var proj = new DirtyWaterProjectile(this.game, {
        x: cx, y: cy,
        dirX: dirX, dirY: 0,
        flySpeed: 160, damage: 15,
        vyStart: -100 - Math.random() * 40,
        gravity: 280,
        groundY: groundY,
        ownerStage: this._ownerStage
      });
      this.game.addEntity(proj);
    } else if (this._phase === 2) {
      /* Phase 2: spit in 3 directions + tissue projectiles */
      var directions = [-1, 0, 1];
      for (var i = 0; i < 3; i++) {
        var dX = directions[i];
        var spd = dX === 0 ? 20 : 150;
        var proj2 = new DirtyWaterProjectile(this.game, {
          x: cx + dX * 10, y: cy,
          dirX: dX, dirY: 0,
          flySpeed: spd, damage: 15,
          vyStart: -130 - Math.random() * 50 - i * 20,
          gravity: 280,
          groundY: groundY,
          ownerStage: this._ownerStage
        });
        this.game.addEntity(proj2);
      }
      /* Fire 1-2 dirty tissue projectiles toward player */
      var tp = this._nearestPlayer();
      var tDirX = -1;
      if (tp) tDirX = tp.x < this.x ? -1 : 1;
      var tissueCount = 1 + Math.floor(Math.random() * 2); /* 1 or 2 */
      for (var ti = 0; ti < tissueCount; ti++) {
        var tissue = new DirtyTissueProjectile(this.game, {
          x: cx + (ti * 8 - 4), y: cy,
          dirX: tDirX + (Math.random() - 0.5) * 0.4,
          flySpeed: 100 + Math.random() * 30,
          damage: 12,
          vyStart: -90 - Math.random() * 30 - ti * 15,
          gravity: 250,
          groundY: groundY,
          ownerStage: this._ownerStage
        });
        this.game.addEntity(tissue);
      }
    } else {
      /* Phase 3: rapid fire + shakes - 5 water projectiles in spread + 2 tissues */
      for (var j = 0; j < 5; j++) {
        var angle = -1 + j * 0.5;
        var proj3 = new DirtyWaterProjectile(this.game, {
          x: cx + (Math.random() - 0.5) * 20, y: cy,
          dirX: angle, dirY: 0,
          flySpeed: 120 + Math.random() * 80,
          damage: 15,
          vyStart: -150 - Math.random() * 60,
          gravity: 300,
          groundY: groundY,
          ownerStage: this._ownerStage
        });
        this.game.addEntity(proj3);
      }
      /* Phase 3 tissues */
      var tp3 = this._nearestPlayer();
      var tDir3 = tp3 ? (tp3.x < this.x ? -1 : 1) : -1;
      for (var tk = 0; tk < 2; tk++) {
        var tissue3 = new DirtyTissueProjectile(this.game, {
          x: cx + (tk * 10 - 5), y: cy,
          dirX: tDir3 + (Math.random() - 0.5) * 0.6,
          flySpeed: 110 + Math.random() * 40,
          damage: 12,
          vyStart: -100 - Math.random() * 40,
          gravity: 250,
          groundY: groundY,
          ownerStage: this._ownerStage
        });
        this.game.addEntity(tissue3);
      }
      if (this.game) this.game.camera.shake(3, 0.3);
    }
  }

  render(ctx, camera) {
    if (!this.alive || !this.visible) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -60 || sp.x > 540 || sp.y < -60 || sp.y > 380) return;

    var sx = Math.floor(sp.x), sy = Math.floor(sp.y);
    var w = this.width, h = this.height;
    var shake = this._shaking ? Math.sin(this._shakeTimer * 40) * 3 : 0;
    sx += shake;

    /* Phase 3 vibration offset */
    var p3vib = this._phase >= 3 ? Math.sin(this._animPhase * 30) * 1.5 : 0;
    sx += p3vib;

    /* ===== Phase 3: Glowing aura behind everything ===== */
    if (this._phase >= 3) {
      ctx.save();
      var auraAlpha = 0.12 + Math.sin(this._animPhase * 6) * 0.08;
      ctx.globalAlpha = auraAlpha;
      /* Outer brown-red aura */
      ctx.fillStyle = "#803000";
      ctx.beginPath();
      ctx.ellipse(sx + w / 2, sy + h / 2 - 4, w / 2 + 12, h / 2 + 10, 0, 0, Math.PI * 2);
      ctx.fill();
      /* Inner hot glow */
      ctx.fillStyle = "#c06020";
      ctx.beginPath();
      ctx.ellipse(sx + w / 2, sy + h / 2 - 4, w / 2 + 6, h / 2 + 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      /* Water splash particles in phase 3 */
      for (var sp3i = 0; sp3i < 4; sp3i++) {
        var splashAngle = this._animPhase * 3 + sp3i * 1.57;
        var splashR = 28 + Math.sin(splashAngle * 2) * 8;
        var splashX = sx + w / 2 + Math.cos(splashAngle) * splashR;
        var splashY = sy + h / 2 + Math.sin(splashAngle) * splashR * 0.6;
        ctx.fillStyle = "rgba(90,75,40,0.4)";
        ctx.beginPath();
        ctx.arc(splashX, splashY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* ===== Water pipe from wall to tank ===== */
    ctx.fillStyle = "#a0a0a0";
    ctx.fillRect(sx + w - 2, sy + 6, 14, 3); /* horizontal pipe */
    ctx.fillStyle = "#b0b0b0";
    ctx.fillRect(sx + w - 2, sy + 5, 14, 1); /* pipe highlight */
    ctx.fillStyle = "#888";
    ctx.fillRect(sx + w - 2, sy + 9, 14, 1); /* pipe shadow */
    /* Pipe connector at tank */
    ctx.fillStyle = "#909090";
    ctx.fillRect(sx + w - 3, sy + 4, 3, 6);

    /* ===== TANK (cistern) - back-top, this is the "face" ===== */
    var tankX = sx + 10, tankY = sy + 0, tankW = w - 16, tankH = 18;
    /* Tank body - white ceramic */
    ctx.fillStyle = "#f0f0e8";
    ctx.fillRect(tankX, tankY, tankW, tankH);
    /* Tank top edge highlight */
    ctx.fillStyle = "#f8f8f0";
    ctx.fillRect(tankX, tankY, tankW, 2);
    /* Tank bottom shadow */
    ctx.fillStyle = "#d8d8cc";
    ctx.fillRect(tankX, tankY + tankH - 2, tankW, 2);
    /* Tank left/right edge shading */
    ctx.fillStyle = "#e0e0d4";
    ctx.fillRect(tankX, tankY, 2, tankH);
    ctx.fillRect(tankX + tankW - 2, tankY, 2, tankH);
    /* Tank inner panel detail */
    ctx.fillStyle = "#e8e8dc";
    ctx.fillRect(tankX + 3, tankY + 3, tankW - 6, tankH - 6);

    /* Chrome flush button on top of tank */
    var btnX = sx + w / 2 - 4, btnY = sy - 4;
    ctx.fillStyle = "#c0c0c0";
    ctx.beginPath();
    ctx.ellipse(btnX + 4, btnY + 2, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    /* Button highlight */
    ctx.fillStyle = "#e0e0e0";
    ctx.beginPath();
    ctx.ellipse(btnX + 3, btnY + 1, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    /* Button shadow */
    ctx.fillStyle = "#909090";
    ctx.beginPath();
    ctx.arc(btnX + 5, btnY + 3, 1.5, 0, Math.PI * 2);
    ctx.fill();

    /* ===== CROWN on top of tank ===== */
    var crownY = tankY - 12;
    var crownX = tankX + 2;
    var crownW = tankW - 4;
    /* Crown base band */
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(crownX, crownY + 6, crownW, 6);
    /* Crown points */
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.moveTo(crownX, crownY + 6);
    ctx.lineTo(crownX + 3, crownY);
    ctx.lineTo(crownX + 6, crownY + 4);
    ctx.lineTo(crownX + crownW / 2, crownY - 4);
    ctx.lineTo(crownX + crownW - 6, crownY + 4);
    ctx.lineTo(crownX + crownW - 3, crownY);
    ctx.lineTo(crownX + crownW, crownY + 6);
    ctx.closePath();
    ctx.fill();
    /* Crown gold border/trim */
    ctx.strokeStyle = "#c8a800";
    ctx.lineWidth = 1;
    ctx.stroke();
    /* Crown band detail */
    ctx.fillStyle = "#e8c200";
    ctx.fillRect(crownX + 1, crownY + 8, crownW - 2, 2);
    /* Crown jewels */
    ctx.fillStyle = "#e00020";
    ctx.beginPath();
    ctx.arc(crownX + crownW / 2, crownY - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0040e0";
    ctx.beginPath();
    ctx.arc(crownX + 5, crownY + 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(crownX + crownW - 5, crownY + 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    /* Small emeralds */
    ctx.fillStyle = "#00b040";
    ctx.fillRect(crownX + crownW / 2 - 6, crownY + 7, 2, 2);
    ctx.fillRect(crownX + crownW / 2 + 4, crownY + 7, 2, 2);

    /* ===== EYES on the TANK (glowing red) ===== */
    var eyeY = tankY + 6;
    var leftEyeX = tankX + 5;
    var rightEyeX = tankX + tankW - 11;
    /* Eye sockets (dark) */
    ctx.fillStyle = "#1a0000";
    ctx.beginPath();
    ctx.ellipse(leftEyeX + 3, eyeY + 3, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightEyeX + 3, eyeY + 3, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    /* Glowing red iris */
    ctx.fillStyle = "rgba(255,30,30," + this._eyeGlow + ")";
    ctx.beginPath();
    ctx.ellipse(leftEyeX + 3, eyeY + 3, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightEyeX + 3, eyeY + 3, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    /* Bright pupil centers */
    ctx.fillStyle = "#ff6060";
    ctx.fillRect(leftEyeX + 2, eyeY + 2, 2, 2);
    ctx.fillRect(rightEyeX + 2, eyeY + 2, 2, 2);
    /* Eye glow effect */
    ctx.save();
    ctx.globalAlpha = this._eyeGlow * 0.3;
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.ellipse(leftEyeX + 3, eyeY + 3, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightEyeX + 3, eyeY + 3, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* ===== LID - hinged at back, opens when attacking ===== */
    var lidPivotX = sx + w - 8; /* hinge point at back/right */
    var lidPivotY = sy + 18;
    var lidW = w - 12;
    var lidH = 4;
    var lidOpenAngle = this._mouthOpen ? (-50 - Math.sin(this._animPhase * 8) * 5) : (this._lidAngle - 2);
    ctx.save();
    ctx.translate(lidPivotX, lidPivotY);
    ctx.rotate(lidOpenAngle * Math.PI / 180);
    /* Lid - white ceramic oval-ish piece */
    ctx.fillStyle = "#f0f0e8";
    ctx.beginPath();
    ctx.ellipse(-lidW / 2, 0, lidW / 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    /* Lid top surface */
    ctx.fillStyle = "#f8f8f0";
    ctx.beginPath();
    ctx.ellipse(-lidW / 2, -1, lidW / 2 - 1, 2, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    /* Lid edge shadow */
    ctx.fillStyle = "#d8d8cc";
    ctx.beginPath();
    ctx.ellipse(-lidW / 2, 1, lidW / 2 - 1, 1.5, 0, 0, Math.PI);
    ctx.fill();
    ctx.restore();

    /* ===== SEAT - white oval ring visible when lid is open ===== */
    if (this._mouthOpen) {
      var seatCX = sx + w / 2 - 2;
      var seatCY = sy + 22;
      /* Outer ring */
      ctx.strokeStyle = "#e8e8dc";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(seatCX, seatCY, 14, 5, -0.1, 0, Math.PI * 2);
      ctx.stroke();
      /* Inner ring highlight */
      ctx.strokeStyle = "#f0f0e8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(seatCX, seatCY - 1, 12, 3.5, -0.1, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* ===== BOWL - large curved white ceramic body ===== */
    var bowlX = sx + 2, bowlY = sy + 18, bowlW = w - 8, bowlH = h - 28;
    /* Bowl outer shape - curved front, narrower at back */
    ctx.fillStyle = "#f0f0e8";
    ctx.beginPath();
    ctx.moveTo(bowlX + bowlW, bowlY); /* back top right */
    ctx.lineTo(bowlX + bowlW + 2, bowlY + bowlH * 0.3); /* back curves out slightly */
    ctx.quadraticCurveTo(bowlX + bowlW + 3, bowlY + bowlH * 0.7, bowlX + bowlW - 2, bowlY + bowlH);
    ctx.lineTo(bowlX + 4, bowlY + bowlH); /* bottom */
    ctx.quadraticCurveTo(bowlX - 4, bowlY + bowlH * 0.7, bowlX - 2, bowlY + bowlH * 0.3);
    ctx.lineTo(bowlX, bowlY); /* back top left */
    ctx.closePath();
    ctx.fill();
    /* Bowl ceramic highlight (left side) */
    ctx.fillStyle = "#f8f8f2";
    ctx.beginPath();
    ctx.moveTo(bowlX + 2, bowlY + 2);
    ctx.quadraticCurveTo(bowlX - 1, bowlY + bowlH * 0.5, bowlX + 3, bowlY + bowlH - 2);
    ctx.lineTo(bowlX + 6, bowlY + bowlH - 2);
    ctx.quadraticCurveTo(bowlX + 3, bowlY + bowlH * 0.5, bowlX + 5, bowlY + 2);
    ctx.closePath();
    ctx.fill();
    /* Bowl shadow (right side) */
    ctx.fillStyle = "#e0e0d4";
    ctx.beginPath();
    ctx.moveTo(bowlX + bowlW - 3, bowlY + 2);
    ctx.quadraticCurveTo(bowlX + bowlW + 1, bowlY + bowlH * 0.5, bowlX + bowlW - 1, bowlY + bowlH - 2);
    ctx.lineTo(bowlX + bowlW - 5, bowlY + bowlH - 2);
    ctx.quadraticCurveTo(bowlX + bowlW - 2, bowlY + bowlH * 0.5, bowlX + bowlW - 5, bowlY + 2);
    ctx.closePath();
    ctx.fill();
    /* Bowl rim - subtle shadow underneath */
    ctx.fillStyle = "#d0d0c4";
    ctx.beginPath();
    ctx.ellipse(sx + w / 2 - 2, bowlY + 2, bowlW / 2 + 1, 3, 0, 0, Math.PI);
    ctx.fill();

    /* Inner bowl visible when mouth open */
    if (this._mouthOpen) {
      /* Inner bowl darker area */
      ctx.fillStyle = "#c8c8b8";
      ctx.beginPath();
      ctx.ellipse(sx + w / 2 - 2, sy + 24, 12, 6, -0.05, 0, Math.PI * 2);
      ctx.fill();
      /* Gross brown/green water inside */
      ctx.fillStyle = "#6b5b3a";
      ctx.beginPath();
      ctx.ellipse(sx + w / 2 - 2, sy + 25, 10, 4.5, -0.05, 0, Math.PI * 2);
      ctx.fill();
      /* Water surface shimmer */
      var shimmer = Math.sin(this._animPhase * 5) * 0.3;
      ctx.fillStyle = "rgba(80,100,50," + (0.5 + shimmer) + ")";
      ctx.beginPath();
      ctx.ellipse(sx + w / 2 - 2, sy + 24, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      /* Brown-green water dripping from bowl */
      var dripPhase = this._animPhase * 4;
      for (var di = 0; di < 3; di++) {
        var dripY = sy + 30 + ((dripPhase + di * 1.2) % 3) * 8;
        var dripX = sx + 10 + di * 10;
        if (dripY < sy + h - 10) {
          ctx.fillStyle = "rgba(90,75,40,0.6)";
          ctx.fillRect(dripX, dripY, 2, 4);
        }
      }
    }

    /* ===== PEDESTAL / BASE ===== */
    var baseY = sy + h - 10;
    /* Pedestal - wider at bottom */
    ctx.fillStyle = "#ececdc";
    ctx.beginPath();
    ctx.moveTo(sx + 6, baseY);
    ctx.lineTo(sx + 2, baseY + 10);
    ctx.lineTo(sx + w - 2, baseY + 10);
    ctx.lineTo(sx + w - 6, baseY);
    ctx.closePath();
    ctx.fill();
    /* Pedestal top edge */
    ctx.fillStyle = "#f0f0e4";
    ctx.fillRect(sx + 6, baseY, w - 12, 2);
    /* Pedestal shadow */
    ctx.fillStyle = "#d0d0c0";
    ctx.fillRect(sx + 3, baseY + 8, w - 6, 2);
    /* Floor bolt covers - small chrome circles */
    ctx.fillStyle = "#b0b0b0";
    ctx.beginPath();
    ctx.arc(sx + 8, baseY + 8, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + w - 8, baseY + 8, 2, 0, Math.PI * 2);
    ctx.fill();
    /* Bolt highlights */
    ctx.fillStyle = "#d0d0d0";
    ctx.beginPath();
    ctx.arc(sx + 7.5, baseY + 7.5, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + w - 8.5, baseY + 7.5, 1, 0, Math.PI * 2);
    ctx.fill();

    /* Water puddle underneath boss */
    ctx.fillStyle = "rgba(100,80,40,0.3)";
    ctx.beginPath();
    ctx.ellipse(sx + w / 2, sy + h + 1, w / 2 + 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    /* ===== CRACKS based on damage (0-5 levels) ===== */
    if (this._crackLevel >= 1) {
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 8, bowlY + 4);
      ctx.lineTo(sx + 14, bowlY + 12);
      ctx.lineTo(sx + 12, bowlY + 18);
      ctx.stroke();
      /* Water seep */
      ctx.fillStyle = "rgba(80,120,160,0.3)";
      ctx.fillRect(sx + 12, bowlY + 18, 2, 3);
    }
    if (this._crackLevel >= 2) {
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + w - 6, bowlY + 6);
      ctx.lineTo(sx + w - 12, bowlY + 16);
      ctx.lineTo(sx + w - 10, bowlY + 24);
      ctx.stroke();
      ctx.fillStyle = "rgba(80,120,160,0.3)";
      ctx.fillRect(sx + w - 11, bowlY + 24, 2, 3);
    }
    if (this._crackLevel >= 3) {
      ctx.strokeStyle = "#555";
      ctx.beginPath();
      ctx.moveTo(sx + w / 2 + 2, bowlY + 2);
      ctx.lineTo(sx + w / 2 - 2, bowlY + 14);
      ctx.lineTo(sx + w / 2 + 4, bowlY + 22);
      ctx.stroke();
      /* Leaking water stream */
      ctx.fillStyle = "rgba(90,130,180,0.4)";
      ctx.fillRect(sx + w / 2 + 3, bowlY + 22, 2, baseY - bowlY - 22);
    }
    if (this._crackLevel >= 4) {
      ctx.strokeStyle = "#444";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx + 14, bowlY + 10);
      ctx.lineTo(sx + 20, bowlY + 20);
      ctx.lineTo(sx + 16, bowlY + bowlH - 4);
      ctx.stroke();
      /* Water seep from this crack */
      ctx.fillStyle = "rgba(70,110,150,0.4)";
      ctx.fillRect(sx + 15, bowlY + bowlH - 4, 3, 6);
      /* Crack on tank */
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tankX + 4, tankY + 4);
      ctx.lineTo(tankX + 10, tankY + 12);
      ctx.stroke();
    }
    if (this._crackLevel >= 5) {
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1.5;
      /* Major crack across bowl */
      ctx.beginPath();
      ctx.moveTo(sx + 4, bowlY + bowlH / 2);
      ctx.lineTo(sx + w / 2, bowlY + bowlH / 2 - 4);
      ctx.lineTo(sx + w - 4, bowlY + bowlH / 2 + 2);
      ctx.stroke();
      /* Crack on pedestal */
      ctx.beginPath();
      ctx.moveTo(sx + w / 2 - 6, baseY + 2);
      ctx.lineTo(sx + w / 2 - 2, baseY + 8);
      ctx.stroke();
      /* Multiple water seeps */
      ctx.fillStyle = "rgba(60,100,140,0.5)";
      ctx.fillRect(sx + w / 2 - 1, bowlY + bowlH / 2 + 2, 2, baseY - bowlY - bowlH / 2);
      ctx.fillRect(sx + w - 5, bowlY + bowlH / 2 + 2, 2, 8);
      /* Tank crack with water */
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tankX + tankW - 4, tankY + 2);
      ctx.lineTo(tankX + tankW - 8, tankY + 14);
      ctx.stroke();
      ctx.fillStyle = "rgba(80,120,160,0.4)";
      ctx.fillRect(tankX + tankW - 9, tankY + 14, 2, 4);
    }

    /* ===== HP bar ===== */
    if (this.showHP && this.hp < this.maxHp) {
      var pr = this.hp / this.maxHp;
      ctx.fillStyle = "#300";
      ctx.fillRect(sx, sy - 22, w, 4);
      ctx.fillStyle = pr > 0.5 ? "#e84855" : pr > 0.25 ? "#f0a030" : "#ff2020";
      ctx.fillRect(sx, sy - 22, Math.floor(w * pr), 4);
      /* HP bar border */
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(sx, sy - 22, w, 4);
    }
  }
}


/* ================================================================
   Stage3_Senior1F — Senior Class 1st Floor (side-scroll)
   ================================================================ */
class Stage3_Senior1F {
  constructor(onComplete) {
    this.game = null;
    this.onComplete = onComplete;
    this.complete = false;
    this.ss = null;
    this.enemies = [];
    this.dirtyPuddles = [];

    /* boss fields */
    this.boss = null;
    this.bossTriggered = false;
    this.bossDefeated = false;

    /* environment */
    this.ambientTimer = 0;
    this._age = 0;

    /* background furniture: desks per section */
    this.desks = [];
    this._buildDesks();
  }

  _buildDesks() {
    /* Section 1: x 100-1300, 6 student desks */
    for (var i = 0; i < 6; i++) {
      this.desks.push({
        x: 150 + i * 180, y: 245,
        w: 48, h: 12,
        section: 1,
        hasBooks: Math.random() > 0.3,
        hasPencil: Math.random() > 0.5
      });
    }
    /* Section 2: x 1500-2700, 8 desks */
    for (var j = 0; j < 8; j++) {
      this.desks.push({
        x: 1500 + j * 150, y: 245,
        w: 48, h: 12,
        section: 2,
        hasBooks: Math.random() > 0.3,
        hasPencil: Math.random() > 0.5
      });
    }
    /* Section 3: x 2900-3900, 6 desks */
    for (var k = 0; k < 6; k++) {
      this.desks.push({
        x: 2900 + k * 170, y: 245,
        w: 48, h: 12,
        section: 3,
        hasBooks: Math.random() > 0.3,
        hasPencil: Math.random() > 0.5
      });
    }
  }

  async init(game) {
    this.game = game;
    this.ss = new SideScroll(game);
    this.ss.activate({
      groundY: 272,
      worldWidth: 4800,
      platforms: this._makePlatforms(),
      hazards: []
    });
    game.tileMap = null;
    game.camera.setMapBounds(4800, 320);
    var p = game.localPlayer;
    p.x = 48; p.y = 240;
    p.svx = 0; p.svy = 0;
    game.camera.x = 0; game.camera.y = 0;
    game.camera.follow(p);
    game.hud.showStageName("Stage 3-1F: Ryde Public School - Senior Class (Year 5)");
    game.hud.addChatMessage("Year 5 classrooms... something feels wrong.", "#f0d060");

    this._spawnEnemies();
    this._spawnItems();
    this._setupBoss();

    var self = this;
    setTimeout(function() {
      game.startDialogue([
        { speaker: "Alice", text: "This is the Year 5 senior block..." },
        { speaker: "Alice", text: "Why are the students just... sitting there?" },
        { speaker: "Alice", text: "They look pale... wait... are they ZOMBIES?!" }
      ], function() {
        if (game.sound) game.sound.playBGM("senior1f");
      });
    }, 500);
  }

  _makePlatforms() {
    var platforms = [];
    /* Section 1: First classroom (x:0-1400) */
    /* Desks as platforms */
    for (var i = 0; i < 6; i++) {
      platforms.push({
        x: 150 + i * 180, y: 245,
        w: 48, h: 12,
        color: "#8B6914", topColor: "#a07828"
      });
    }
    /* High shelf in classroom 1 */
    platforms.push({ x: 300, y: 218, w: 64, h: 8, color: "#8B6914", topColor: "#a07828" });
    platforms.push({ x: 800, y: 220, w: 48, h: 8, color: "#8B6914", topColor: "#a07828" });

    /* Doorway transition platform 1->2 */
    platforms.push({ x: 1350, y: 256, w: 100, h: 16, color: "#888", topColor: "#aaa" });

    /* Section 2: Second classroom (x:1400-2800) */
    for (var j = 0; j < 8; j++) {
      platforms.push({
        x: 1500 + j * 150, y: 245,
        w: 48, h: 12,
        color: "#8B6914", topColor: "#a07828"
      });
    }
    /* Shelves in classroom 2 */
    platforms.push({ x: 1650, y: 215, w: 56, h: 8, color: "#8B6914", topColor: "#a07828" });
    platforms.push({ x: 2100, y: 218, w: 48, h: 8, color: "#8B6914", topColor: "#a07828" });
    platforms.push({ x: 2500, y: 210, w: 40, h: 8, color: "#8B6914", topColor: "#a07828" });

    /* Doorway transition platform 2->3 */
    platforms.push({ x: 2750, y: 256, w: 100, h: 16, color: "#888", topColor: "#aaa" });

    /* Section 3: Third classroom (x:2800-4000) */
    for (var k = 0; k < 6; k++) {
      platforms.push({
        x: 2900 + k * 170, y: 245,
        w: 48, h: 12,
        color: "#8B6914", topColor: "#a07828"
      });
    }
    /* Shelf in classroom 3 */
    platforms.push({ x: 3200, y: 215, w: 52, h: 8, color: "#8B6914", topColor: "#a07828" });

    /* Doorway transition 3->bathroom */
    platforms.push({ x: 3950, y: 256, w: 80, h: 16, color: "#888", topColor: "#aaa" });

    /* Bathroom section (x:4000-4800) - flat arena */
    platforms.push({ x: 4050, y: 256, w: 700, h: 16, color: "#d0d0d8", topColor: "#b8b8c0" });

    return platforms;
  }

  _spawnEnemies() {
    var g = this.game;
    var self = this;

    function addEnemy(enemy) {
      enemy.sideScrollMode = true;
      enemy.svy = 0;
      self.enemies.push(enemy);
      g.addEntity(enemy);
    }

    /* Section 1: 5 ZombieStudents + 2 CrazyCrayonKids + 1 GlueMonster = 8 */
    var s1Zombies = [
      { x: 160, y: 217 }, { x: 340, y: 217 }, { x: 520, y: 217 },
      { x: 700, y: 217 }, { x: 1060, y: 217 }
    ];
    for (var i = 0; i < s1Zombies.length; i++) {
      addEnemy(new ZombieStudent(g, {
        x: s1Zombies[i].x, y: s1Zombies[i].y,
        isBoy: i % 2 === 0,
        transformRange: 120
      }));
    }
    addEnemy(new CrazyCrayonKid(g, { x: 880, y: 219, ownerStage: this }));
    addEnemy(new CrazyCrayonKid(g, { x: 960, y: 219, ownerStage: this }));
    addEnemy(new GlueMonster(g, { x: 600, y: 225, ownerStage: this }));

    /* Section 2: 6 ZombieStudents + 2 PaperPlaneAttackers + 2 CrazyCrayonKids + 1 GlueMonster = 11 */
    var s2Zombies = [
      { x: 1510, y: 217 }, { x: 1660, y: 217 }, { x: 1810, y: 217 },
      { x: 2110, y: 217 }, { x: 2410, y: 217 }, { x: 2560, y: 217 }
    ];
    for (var j = 0; j < s2Zombies.length; j++) {
      addEnemy(new ZombieStudent(g, {
        x: s2Zombies[j].x, y: s2Zombies[j].y,
        isBoy: j % 2 === 1,
        transformRange: 120,
        hp: 30 /* slightly tougher in section 2 */
      }));
    }
    addEnemy(new PaperPlaneAttacker(g, { x: 1960, y: 217, ownerStage: this }));
    addEnemy(new PaperPlaneAttacker(g, { x: 2260, y: 217, ownerStage: this }));
    addEnemy(new CrazyCrayonKid(g, { x: 1740, y: 219, ownerStage: this }));
    addEnemy(new CrazyCrayonKid(g, { x: 2340, y: 219, ownerStage: this }));
    addEnemy(new GlueMonster(g, { x: 2050, y: 225, ownerStage: this }));

    /* Section 3: 4 ZombieStudents + 1 PaperPlaneAttacker + 1 CrazyCrayonKid + 1 GlueMonster = 7 */
    var s3Zombies = [
      { x: 2910, y: 217 }, { x: 3080, y: 217 }, { x: 3420, y: 217 },
      { x: 3760, y: 217 }
    ];
    for (var k = 0; k < s3Zombies.length; k++) {
      addEnemy(new ZombieStudent(g, {
        x: s3Zombies[k].x, y: s3Zombies[k].y,
        isBoy: k % 2 === 0,
        transformRange: 120,
        hp: 35 /* tougher in section 3 */
      }));
    }
    addEnemy(new PaperPlaneAttacker(g, { x: 3250, y: 217, ownerStage: this }));
    addEnemy(new CrazyCrayonKid(g, { x: 3590, y: 219, ownerStage: this }));
    addEnemy(new GlueMonster(g, { x: 3350, y: 225, ownerStage: this }));

    /* 25 School Spiders spread across entire map (x: 80 - 4600) */
    var spiderPositions = [
      80, 200, 380, 500, 650, 800, 950, 1100, 1250,
      1450, 1600, 1750, 1900, 2050, 2200, 2350, 2500,
      2700, 2950, 3150, 3350, 3550, 3750, 4000, 4300
    ];
    for (var si = 0; si < spiderPositions.length; si++) {
      var spY = 240 + Math.floor(Math.random() * 20);
      addEnemy(new SchoolSpider(g, { x: spiderPositions[si], y: spY }));
    }
  }

  _spawnItems() {
    var g = this.game;
    var items = [
      /* Section 1 */
      { x: 250, y: 215, item: { name: "Lunch Box", type: "consumable", heal: 12, color: "#e06040", pickupMessage: "Leftover lunch box!" } },
      { x: 650, y: 215, item: { name: "Juice Box", type: "consumable", heal: 10, color: "#f0a040", pickupMessage: "Apple juice box!" } },
      { x: 1100, y: 215, item: { name: "Muesli Bar", type: "consumable", heal: 14, color: "#c8a060", pickupMessage: "Muesli bar! Crunchy!" } },
      /* Section 2 */
      { x: 1700, y: 185, item: { name: "Ruler", type: "weapon", equipSlot: "weapon", atk: 3, color: "#c4a875", pickupMessage: "30cm ruler! Whack!" } },
      { x: 2000, y: 215, item: { name: "Popper Juice", type: "consumable", heal: 15, color: "#ff6090", pickupMessage: "Strawberry popper!" } },
      { x: 2450, y: 215, item: { name: "Vegemite Scroll", type: "consumable", heal: 18, color: "#4a3520", pickupMessage: "Vegemite cheese scroll!" } },
      /* Section 3 */
      { x: 3100, y: 215, item: { name: "Frozen Zooper", type: "consumable", heal: 16, color: "#40a0f0", pickupMessage: "Frozen Zooper Dooper!" } },
      { x: 3500, y: 215, item: { name: "Fairy Bread", type: "consumable", heal: 20, color: "#ff88cc", pickupMessage: "Fairy bread! Party time!" } },
      /* Bathroom area - before boss */
      { x: 4080, y: 225, item: { name: "First Aid Kit", type: "consumable", heal: 40, color: "#f04040", pickupMessage: "First aid kit from the office!" } }
    ];

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var d = new ItemDrop(g, { x: it.x, y: it.y, itemData: it.item });
      d.lifetime = 99999;
      g.addEntity(d);
    }
  }

  /* ===================== BOSS: TOILET KING ===================== */
  _setupBoss() {
    this.boss = new ToiletKing(this.game, {
      x: 4500, y: 216,
      ownerStage: this
    });
    this.boss.active = false;
    this.boss.visible = false;
    this.boss.sideScrollMode = true;
    this.boss.svy = 0;
    this.enemies.push(this.boss);
    this.game.addEntity(this.boss);
  }

  /* ===================== UPDATE ===================== */
  update(dt) {
    if (!this.ss) return;
    this._age += dt;
    this.ss.update(dt);
    this._updateEnemyGravity(dt);
    this._updateZombieTransformations(dt);
    this._checkBossTrigger();
    this._checkBossDefeated();
    this._updatePuddleHazards(dt);
    this._updateAmbient(dt);
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

  _updateZombieTransformations(dt) {
    /* ZombieStudent handles its own transform check in update(),
       but we add a chat message on first transformation */
    var firstTransform = false;
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (e instanceof ZombieStudent && e._transformed && !e._notifiedTransform) {
        e._notifiedTransform = true;
        if (!firstTransform) {
          firstTransform = true;
          this.game.hud.addChatMessage("The students are turning into ZOMBIES!", "#f44");
          this.game.camera.shake(3, 0.3);
        }
      }
    }
  }

  _checkBossTrigger() {
    if (this.bossTriggered || this.bossDefeated) return;

    /* Check if all classroom enemies are dead */
    var allEnemiesDead = true;
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if ((e instanceof ZombieStudent || e instanceof CrazyCrayonKid ||
           e instanceof PaperPlaneAttacker || e instanceof GlueMonster) && e.alive) {
        allEnemiesDead = false;
        break;
      }
    }

    /* If player tries to enter bathroom before enemies cleared, block them */
    if (!allEnemiesDead) {
      if (this.game.localPlayer.x > 3980) {
        this.game.localPlayer.x = 3980;
        if (!this._shownBlockMsg || this._age - this._shownBlockMsg > 3) {
          this._shownBlockMsg = this._age;
          this.game.hud.addChatMessage("Clear all enemies first!", "#f44");
        }
      }
      return;
    }

    /* Show "enemies cleared" message once */
    if (!this._zombiesClearedMsg) {
      this._zombiesClearedMsg = true;
      this.game.hud.addChatMessage("All enemies cleared! The bathroom door opens...", "#50c878");
    }

    /* Boss triggers when player enters bathroom area */
    if (this.game.localPlayer.x > 4100) {
      this.bossTriggered = true;
      this.boss.active = true;
      this.boss.visible = true;
      this.game.camera.shake(10, 1.0);
      this.game.hud.setBoss(this.boss, "TOILET KING");
      this.game.hud.addChatMessage("BOSS! TOILET KING appears!", "#f44");
      if (this.game.sound) this.game.sound.playBossAppear();
      this.game.startDialogue([
        { speaker: "???", text: "GLUUURRRGLLL..." },
        { speaker: "TOILET KING", text: "WHO DARES ENTER MY PORCELAIN THRONE ROOM?!" },
        { speaker: "Alice", text: "A GIANT... TOILET?! WITH A CROWN?!" },
        { speaker: "TOILET KING", text: "I AM THE TOILET KING! PREPARE TO BE FLUSHED!" },
        { speaker: "Alice", text: "This school has SERIOUS plumbing problems!!" }
      ]);
    }
  }

  _checkBossDefeated() {
    if (!this.bossTriggered || this.bossDefeated) return;
    if (!this.boss.alive || this.boss.hp <= 0) {
      this.bossDefeated = true;
      this.complete = true;
      this.game.hud.clearBoss();
      this.game.hud.addChatMessage("TOILET KING defeated! The water clears!", "#50c878");

      /* Remove all dirty puddles */
      this.dirtyPuddles = [];
      this.ss.hazards = [];

      /* Explosion effect */
      this.game.camera.shake(12, 2.5);

      /* Show FLUUUUUSH text */
      this.game.combat.spawnDamageNumber(
        this.boss.x + this.boss.width / 2,
        this.boss.y - 30,
        "FLUUUUUSH!!!", "#4a90d9"
      );

      /* Play toilet flush death sound - rushing water effect ~2.5s */
      try {
        var s = this.game.sound;
        if (s && s.ctx && !s.muted) {
          var t = s.ctx.currentTime;

          /* Master gain envelope: start 0.15, peak 0.25 at 0.5s, fade to 0 over 2.5s */
          var masterGain = s.ctx.createGain();
          masterGain.gain.setValueAtTime(0.15, t);
          masterGain.gain.linearRampToValueAtTime(0.25, t + 0.5);
          masterGain.gain.linearRampToValueAtTime(0.08, t + 2.0);
          masterGain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
          masterGain.connect(s.sfxGain);

          /* Oscillator 1: sine 200Hz -> 100Hz -> 50Hz over 2s (main flush) */
          var o1 = s.ctx.createOscillator(), g1 = s.ctx.createGain();
          o1.type = "sine";
          o1.frequency.setValueAtTime(200, t);
          o1.frequency.exponentialRampToValueAtTime(100, t + 1.0);
          o1.frequency.exponentialRampToValueAtTime(50, t + 2.0);
          g1.gain.setValueAtTime(1.0, t);
          g1.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
          o1.connect(g1); g1.connect(masterGain);
          o1.start(t); o1.stop(t + 2.0);

          /* Oscillator 2: triangle 400Hz -> 150Hz -> 30Hz over 2.5s (water spiral) */
          var o2 = s.ctx.createOscillator(), g2 = s.ctx.createGain();
          o2.type = "triangle";
          o2.frequency.setValueAtTime(400, t);
          o2.frequency.exponentialRampToValueAtTime(150, t + 1.2);
          o2.frequency.exponentialRampToValueAtTime(30, t + 2.5);
          g2.gain.setValueAtTime(0.8, t);
          g2.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
          o2.connect(g2); g2.connect(masterGain);
          o2.start(t); o2.stop(t + 2.5);

          /* Oscillator 3: square 80Hz -> 40Hz -> 20Hz over 1.5s (rumble) */
          var o3 = s.ctx.createOscillator(), g3 = s.ctx.createGain();
          o3.type = "square";
          o3.frequency.setValueAtTime(80, t);
          o3.frequency.exponentialRampToValueAtTime(40, t + 0.8);
          o3.frequency.exponentialRampToValueAtTime(20, t + 1.5);
          g3.gain.setValueAtTime(0.5, t);
          g3.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
          o3.connect(g3); g3.connect(masterGain);
          o3.start(t); o3.stop(t + 1.5);
        }
      } catch (e) {}

      /* Water splash explosion particles (visual, spawned as damage numbers) */
      for (var si = 0; si < 8; si++) {
        var splashOff = (Math.random() - 0.5) * 60;
        this.game.combat.spawnDamageNumber(
          this.boss.x + this.boss.width / 2 + splashOff,
          this.boss.y + Math.random() * 20 - 10,
          "~", "#6b9bc0"
        );
      }

      var self = this;
      /* Delay dialogue by 2.5s to let flush sound finish */
      setTimeout(function() {
        self.game.startDialogue([
          { speaker: "Alice", text: "YES! The Toilet King is FLUSHED!" },
          { speaker: "Alice", text: "That was the GROSSEST boss yet!" },
          { speaker: "Alice", text: "Time to head upstairs to the 2nd floor!" }
        ], function() {
          if (self.game.transition) {
            self.game.transition.startFade(function() {
              if (self.onComplete) self.onComplete("senior2f");
            });
          } else {
            if (self.onComplete) self.onComplete("senior2f");
          }
        });
      }, 2500);
    }
  }

  _addDirtyPuddle(x, y) {
    /* Limit total puddles to prevent performance issues */
    if (this.dirtyPuddles.length >= 20) {
      /* Remove oldest puddle */
      var oldest = this.dirtyPuddles.shift();
      /* Remove from ss.hazards too */
      for (var i = 0; i < this.ss.hazards.length; i++) {
        if (this.ss.hazards[i] === oldest) {
          this.ss.hazards.splice(i, 1);
          break;
        }
      }
    }
    var puddle = {
      x: x - 8, y: y,
      w: 16, h: 6,
      damage: 5,
      type: "puddle",
      _age: 0,
      _isDirtyPuddle: true
    };
    this.dirtyPuddles.push(puddle);
    this.ss.hazards.push(puddle);
  }

  _updatePuddleHazards(dt) {
    for (var i = this.dirtyPuddles.length - 1; i >= 0; i--) {
      this.dirtyPuddles[i]._age += dt;
    }
  }

  _updateAmbient(dt) {
    this.ambientTimer += dt;
    if (this.ambientTimer > 18) {
      this.ambientTimer = 0;
      var msgs = [
        "The fluorescent lights buzz overhead...",
        "A pencil rolls off a desk. Nobody picks it up.",
        "You hear groaning from the next classroom.",
        "The whiteboard has 'HELP' scrawled on it.",
        "Someone's lunch box is leaking... or is that blood?",
        "The school bell rings... but nobody moves.",
        "A worksheet flutters in a breeze from nowhere.",
        "The classroom smells like... wet dog and chalk."
      ];
      this.game.hud.addChatMessage(msgs[Math.floor(Math.random() * msgs.length)], "#888");
    }
  }

  /* ===================== RENDER ===================== */
  render(ctx, camera) {
    if (!this.ss) return;
    this._renderBG(ctx, camera);
    this._renderClassroomWalls(ctx, camera);
    this._renderDesks(ctx, camera);
    this._renderWhiteboards(ctx, camera);
    this._renderWindows(ctx, camera);
    this.ss.render(ctx, camera);
    this._renderGroundOverlay(ctx, camera);
    this._renderDirtyPuddles(ctx, camera);
    this._renderBathroomArea(ctx, camera);
    this._renderDoorways(ctx, camera);
    if (this.bossDefeated) this._renderExit(ctx, camera);
  }

  _renderBG(ctx, camera) {
    /* Pale blue school corridor background */
    var grad = ctx.createLinearGradient(0, 0, 0, 320);
    grad.addColorStop(0, "#b8d4e8");
    grad.addColorStop(0.4, "#c8dff0");
    grad.addColorStop(0.8, "#d0e4f2");
    grad.addColorStop(1, "#a8c4d8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 480, 320);

    /* Parallax ceiling line */
    var ox = camera.offsetX * 0.2;
    ctx.fillStyle = "#90b0c8";
    ctx.fillRect(0, 28 - ox * 0.1, 480, 2);
    ctx.fillStyle = "#a0c0d4";
    ctx.fillRect(0, 50 - ox * 0.1, 480, 1);

    /* Notice boards (parallax background layer) */
    var boards = [
      { x: 100, w: 60, color: "#c08030" },
      { x: 500, w: 50, color: "#b87028" },
      { x: 900, w: 70, color: "#c08030" },
      { x: 1700, w: 55, color: "#b87028" },
      { x: 2300, w: 65, color: "#c08030" },
      { x: 3000, w: 50, color: "#b87028" },
      { x: 3600, w: 60, color: "#c08030" }
    ];
    for (var i = 0; i < boards.length; i++) {
      var b = boards[i];
      var bx = b.x - camera.offsetX * 0.6;
      if (bx + b.w < -10 || bx > 490) continue;
      ctx.fillStyle = b.color;
      ctx.fillRect(Math.floor(bx), 60, b.w, 40);
      /* Pinned papers */
      ctx.fillStyle = "#f8f8e8";
      ctx.fillRect(Math.floor(bx) + 4, 64, 12, 14);
      ctx.fillRect(Math.floor(bx) + 20, 66, 10, 12);
      if (b.w > 55) {
        ctx.fillStyle = "#ffe8a0";
        ctx.fillRect(Math.floor(bx) + 36, 64, 12, 14);
      }
      /* Pins */
      ctx.fillStyle = "#e04040";
      ctx.fillRect(Math.floor(bx) + 9, 63, 2, 2);
      ctx.fillRect(Math.floor(bx) + 24, 65, 2, 2);
    }
  }

  _renderClassroomWalls(ctx, camera) {
    var ox = camera.offsetX, oy = camera.offsetY;

    /* Wall color per section */
    var sections = [
      { x1: 0, x2: 1400, wallColor: "#c8dff0", trimColor: "#90b0c8" },
      { x1: 1400, x2: 2800, wallColor: "#cce0f0", trimColor: "#88a8c0" },
      { x1: 2800, x2: 4000, wallColor: "#c8dcec", trimColor: "#90b0c8" },
      { x1: 4000, x2: 4800, wallColor: "#e0e4e8", trimColor: "#b0b8c0" } /* bathroom */
    ];

    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      var sx = sec.x1 - ox;
      var sw = sec.x2 - sec.x1;
      if (sx + sw < 0 || sx > 480) continue;

      /* Wall base */
      ctx.fillStyle = sec.wallColor;
      ctx.fillRect(Math.max(0, sx), 100 - oy, Math.min(sw, 480), 172);

      /* Trim/dado rail */
      ctx.fillStyle = sec.trimColor;
      ctx.fillRect(Math.max(0, sx), 130 - oy, Math.min(sw, 480), 3);

      /* Skirting board */
      ctx.fillStyle = "#708090";
      ctx.fillRect(Math.max(0, sx), 268 - oy, Math.min(sw, 480), 4);
    }
  }

  _renderDesks(ctx, camera) {
    var ox = camera.offsetX, oy = camera.offsetY;

    for (var i = 0; i < this.desks.length; i++) {
      var d = this.desks[i];
      var sx = d.x - ox, sy = d.y - oy;
      if (sx + d.w < -10 || sx > 490) continue;

      /* Desk surface */
      ctx.fillStyle = "#8B6914";
      ctx.fillRect(sx, sy, d.w, d.h);
      /* Desk top highlight */
      ctx.fillStyle = "#a07828";
      ctx.fillRect(sx, sy, d.w, 3);
      /* Desk legs */
      ctx.fillStyle = "#666";
      ctx.fillRect(sx + 2, sy + d.h, 3, 15);
      ctx.fillRect(sx + d.w - 5, sy + d.h, 3, 15);

      /* Items on desk */
      if (d.hasBooks) {
        ctx.fillStyle = "#4060c0";
        ctx.fillRect(sx + 8, sy - 5, 12, 5);
        ctx.fillStyle = "#c04040";
        ctx.fillRect(sx + 22, sy - 4, 10, 4);
      }
      if (d.hasPencil) {
        ctx.fillStyle = "#f0d040";
        ctx.fillRect(sx + 36, sy - 2, 8, 2);
      }
    }
  }

  _renderWhiteboards(ctx, camera) {
    var ox = camera.offsetX, oy = camera.offsetY;
    /* One whiteboard per classroom section */
    var boards = [
      { x: 600, text: "MATHS: 7 x 8 = ?" },
      { x: 2000, text: "ENGLISH: Spelling Test" },
      { x: 3400, text: "SCIENCE: Ecosystems" }
    ];

    for (var i = 0; i < boards.length; i++) {
      var b = boards[i];
      var sx = b.x - ox;
      if (sx + 100 < 0 || sx > 490) continue;

      /* Board frame */
      ctx.fillStyle = "#c0c0c0";
      ctx.fillRect(sx - 2, 110 - oy, 104, 54);
      /* Board surface */
      ctx.fillStyle = "#f8f8f4";
      ctx.fillRect(sx, 112 - oy, 100, 50);
      /* Text on board */
      ctx.fillStyle = "#333";
      ctx.font = "7px Courier New";
      ctx.textAlign = "left";
      ctx.fillText(b.text, sx + 4, 132 - oy);
      /* Marker tray */
      ctx.fillStyle = "#aaa";
      ctx.fillRect(sx + 10, 162 - oy, 80, 4);
      /* Markers */
      ctx.fillStyle = "#e04040";
      ctx.fillRect(sx + 20, 160 - oy, 12, 3);
      ctx.fillStyle = "#4040e0";
      ctx.fillRect(sx + 38, 160 - oy, 12, 3);
      ctx.fillStyle = "#222";
      ctx.fillRect(sx + 56, 160 - oy, 12, 3);
    }
  }

  _renderWindows(ctx, camera) {
    var ox = camera.offsetX, oy = camera.offsetY;
    /* Classroom windows showing outside (pale blue sky with trees) */
    var windows = [
      200, 450, 750, 1050,
      1550, 1800, 2100, 2450, 2650,
      2950, 3200, 3550, 3800
    ];

    for (var i = 0; i < windows.length; i++) {
      var wx = windows[i] - ox;
      if (wx + 40 < 0 || wx > 490) continue;
      var wy = 115 - oy;

      /* Window frame */
      ctx.fillStyle = "#888";
      ctx.fillRect(wx - 2, wy - 2, 44, 44);
      /* Glass - sky */
      ctx.fillStyle = "#a0d4f0";
      ctx.fillRect(wx, wy, 40, 40);
      /* Cross frame */
      ctx.fillStyle = "#aaa";
      ctx.fillRect(wx + 19, wy, 2, 40);
      ctx.fillRect(wx, wy + 19, 40, 2);
      /* Green tree outside */
      ctx.fillStyle = "#4a8a40";
      ctx.fillRect(wx + 6, wy + 22, 12, 12);
      ctx.fillRect(wx + 24, wy + 26, 10, 8);
      /* Tree trunk */
      ctx.fillStyle = "#6a4a2a";
      ctx.fillRect(wx + 10, wy + 34, 4, 6);
    }
  }

  _renderGroundOverlay(ctx, camera) {
    /* Override SideScroll green ground with school floor */
    var oy = camera.offsetY;
    var gy = 272 - oy;
    var ox = camera.offsetX;

    /* Classroom floor tiles - check if in bathroom section */
    var playerX = this.game.localPlayer.x;
    var screenLeft = camera.offsetX;
    var screenRight = screenLeft + 480;

    /* Draw base floor for all visible area */
    ctx.fillStyle = "#c8b898";
    ctx.fillRect(0, gy, 480, 320 - gy + 48);
    ctx.fillStyle = "#b0a080";
    ctx.fillRect(0, gy, 480, 2);

    /* Tile pattern on floor */
    ctx.fillStyle = "rgba(160,140,110,0.3)";
    for (var x = Math.floor(screenLeft / 32) * 32; x < screenRight + 32; x += 32) {
      var fsx = x - ox;
      ctx.fillRect(fsx, gy + 2, 1, 48);
    }
    for (var y = gy + 16; y < gy + 60; y += 16) {
      ctx.fillRect(0, y, 480, 1);
    }
  }

  _renderDirtyPuddles(ctx, camera) {
    var ox = camera.offsetX, oy = camera.offsetY;
    for (var i = 0; i < this.dirtyPuddles.length; i++) {
      var p = this.dirtyPuddles[i];
      var sx = p.x - ox, sy = p.y - oy;
      if (sx + p.w < 0 || sx > 480) continue;
      /* Brownish-green puddle */
      var alpha = 0.5 + Math.sin(p._age * 3) * 0.15;
      ctx.fillStyle = "rgba(90,75,40," + alpha + ")";
      ctx.beginPath();
      ctx.ellipse(sx + p.w / 2, sy + p.h / 2, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      /* Highlight */
      ctx.fillStyle = "rgba(60,100,40,0.3)";
      ctx.beginPath();
      ctx.ellipse(sx + p.w / 2 - 2, sy + p.h / 2 - 1, p.w / 4, p.h / 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _renderBathroomArea(ctx, camera) {
    var ox = camera.offsetX, oy = camera.offsetY;
    /* Only render bathroom if visible */
    var bStart = 4000 - ox;
    if (bStart > 490) return;

    /* White tile background */
    var bx = Math.max(0, bStart);
    var bw = Math.min(800, 480 - bx);
    if (bw <= 0) return;

    ctx.fillStyle = "#e8e8ec";
    ctx.fillRect(bx, 60 - oy, bw, 212);

    /* Tile grid */
    ctx.strokeStyle = "rgba(180,180,190,0.5)";
    ctx.lineWidth = 1;
    for (var tx = Math.floor((4000 - ox) / 24) * 24; tx < bStart + 800; tx += 24) {
      var tsx = tx;
      if (tsx < 0 || tsx > 480) continue;
      ctx.beginPath();
      ctx.moveTo(tsx, 60 - oy);
      ctx.lineTo(tsx, 272 - oy);
      ctx.stroke();
    }
    for (var ty = 60; ty < 272; ty += 24) {
      ctx.beginPath();
      ctx.moveTo(bx, ty - oy);
      ctx.lineTo(bx + bw, ty - oy);
      ctx.stroke();
    }

    /* Toilet stalls */
    var stalls = [4100, 4250, 4400];
    for (var i = 0; i < stalls.length; i++) {
      var stallX = stalls[i] - ox;
      if (stallX + 60 < 0 || stallX > 490) continue;

      /* Stall walls */
      ctx.fillStyle = "#b0b0b8";
      ctx.fillRect(stallX, 140 - oy, 4, 132);
      ctx.fillRect(stallX + 56, 140 - oy, 4, 132);
      /* Stall door top */
      ctx.fillStyle = "#a0a0a8";
      ctx.fillRect(stallX + 4, 140 - oy, 52, 4);

      /* Mini toilet inside stall */
      ctx.fillStyle = "#f0f0e8";
      ctx.fillRect(stallX + 20, 240 - oy, 20, 24);
      ctx.fillStyle = "#e0e0d8";
      ctx.fillRect(stallX + 22, 238 - oy, 16, 4);
    }

    /* "BATHROOM" sign */
    var signX = 4020 - ox;
    if (signX > -60 && signX < 490) {
      ctx.fillStyle = "#4060a0";
      ctx.fillRect(signX, 68 - oy, 70, 18);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 8px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("BATHROOM", signX + 35, 80 - oy);
    }

    /* Bathroom floor override - white tiles */
    var gy = 272 - oy;
    var floorStart = Math.max(0, 4000 - ox);
    var floorW = Math.min(800, 480 - floorStart);
    if (floorW > 0) {
      ctx.fillStyle = "#d8d8dc";
      ctx.fillRect(floorStart, gy, floorW, 48);
      ctx.fillStyle = "#c0c0c8";
      ctx.fillRect(floorStart, gy, floorW, 2);
      /* Tile pattern */
      ctx.fillStyle = "rgba(180,180,190,0.3)";
      for (var fx = Math.floor((4000 - ox) / 24) * 24; fx < floorStart + floorW; fx += 24) {
        if (fx >= 0 && fx <= 480) ctx.fillRect(fx, gy + 2, 1, 48);
      }
    }
  }

  _renderDoorways(ctx, camera) {
    var ox = camera.offsetX, oy = camera.offsetY;
    /* Doorways between sections */
    var doors = [
      { x: 1360, label: "Room 5B" },
      { x: 2760, label: "Room 5C" },
      { x: 3960, label: "Bathroom" }
    ];

    for (var i = 0; i < doors.length; i++) {
      var d = doors[i];
      var dx = d.x - ox;
      if (dx + 80 < 0 || dx > 490) continue;

      /* Door frame */
      ctx.fillStyle = "#707880";
      ctx.fillRect(dx, 170 - oy, 80, 102);
      /* Door opening (dark) */
      ctx.fillStyle = "#3a3a40";
      ctx.fillRect(dx + 4, 174 - oy, 72, 98);
      /* Door sign */
      ctx.fillStyle = "#fff";
      ctx.font = "6px Courier New";
      ctx.textAlign = "center";
      ctx.fillText(d.label, dx + 40, 168 - oy);
      /* Arrow */
      ctx.fillStyle = "#50c878";
      ctx.font = "8px Courier New";
      ctx.fillText(">>>", dx + 40, 220 - oy);
    }
  }

  _renderExit(ctx, camera) {
    var ex = 4750 - camera.offsetX;
    if (ex < 0 || ex > 490) return;
    /* Glowing exit portal */
    var pulse = 0.6 + Math.sin(this._age * 3) * 0.3;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#50c878";
    ctx.fillRect(ex, 180, 6, 92);
    ctx.restore();
    ctx.font = "8px Courier New";
    ctx.fillStyle = "#50c878";
    ctx.textAlign = "center";
    ctx.fillText("2F >>>", ex + 16, 175);
  }
}
