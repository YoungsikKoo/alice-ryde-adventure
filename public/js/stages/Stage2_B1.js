/* ================================================================
   Stage 2 - B1: Woolworths "Wool-WORSE" Supermarket (Side-Scroll)
   16-bit 256-color style. Mobs: fruit-stealing rats, zombie guards.
   Boss: KAREN THE TERRIBLE (nightmare customer)

   Boss phases:
     100-70%  Yells insults + throws shopping items
      70-30%  Poop barrage mode
      <30%    Screams to summon 4 Karen friends
   ================================================================ */

/* ---------- Insult Projectile (yelling text) ---------- */
class InsultBolt extends Entity {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: 10, height: 10,
      speed: 0, color: "#f44",
      type: "enemy", tags: ["enemy"]
    });
    this.damage = cfg.damage || 7;
    this.dirX = cfg.dirX || 0;
    this.dirY = cfg.dirY || 0;
    this.flySpeed = cfg.flySpeed || 160;
    this.lifetime = 2.5;
    this.alive = true;
    this.hp = 1; this.maxHp = 1;
    this.atk = this.damage; this.def = 0;
    this.contactDamage = this.damage;
    this.showHP = false;
    this.name = "Insult";
    this.enemyType = "insult";
    this.expReward = 0;
    this._age = 0;
    this._text = cfg.text || "!@#$";
  }
  update(dt) {
    if (!this.alive) return;
    this.x += this.dirX * this.flySpeed * dt;
    this.y += this.dirY * this.flySpeed * dt;
    this._age += dt;
    this.lifetime -= dt;
    if (this.lifetime <= 0 || this.x < -30 || this.x > 5000 || this.y < -30 || this.y > 400) {
      this.alive = false; this.destroy();
    }
  }
  takeDamage() { this.alive = false; this.destroy(); }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -20 || sp.x > 500) return;
    ctx.save();
    ctx.font = "bold 8px Courier New";
    ctx.fillStyle = "#f44";
    ctx.textAlign = "center";
    var wobble = Math.sin(this._age * 15) * 3;
    ctx.fillText(this._text, sp.x, sp.y + wobble);
    ctx.restore();
  }
}

/* ---------- Poop Projectile ---------- */
class PoopBolt extends Entity {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: 10, height: 10,
      speed: 0, color: "#6b4226",
      type: "enemy", tags: ["enemy"]
    });
    this.damage = cfg.damage || 10;
    this.dirX = cfg.dirX || 0;
    this.dirY = cfg.dirY || 0;
    this.flySpeed = cfg.flySpeed || 140;
    this.lifetime = 3;
    this.alive = true;
    this.hp = 1; this.maxHp = 1;
    this.atk = this.damage; this.def = 0;
    this.contactDamage = this.damage;
    this.showHP = false;
    this.name = "Poop";
    this.enemyType = "poop";
    this.expReward = 0;
    this._age = 0;
  }
  update(dt) {
    if (!this.alive) return;
    this.x += this.dirX * this.flySpeed * dt;
    this.y += this.dirY * this.flySpeed * dt + 30 * dt; /* gravity arc */
    this._age += dt;
    this.lifetime -= dt;
    if (this.lifetime <= 0 || this.x < -30 || this.x > 5000 || this.y > 400) {
      this.alive = false; this.destroy();
    }
  }
  takeDamage() { this.alive = false; this.destroy(); }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -20 || sp.x > 500) return;
    ctx.fillStyle = "#6b4226";
    ctx.beginPath();
    ctx.arc(sp.x + 5, sp.y + 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4a2810";
    ctx.beginPath();
    ctx.arc(sp.x + 4, sp.y + 3, 2, 0, Math.PI * 2);
    ctx.fill();
    /* stink lines */
    ctx.strokeStyle = "rgba(100,180,50,0.5)";
    ctx.lineWidth = 1;
    var w = Math.sin(this._age * 8) * 2;
    ctx.beginPath();
    ctx.moveTo(sp.x + 2, sp.y - 2);
    ctx.lineTo(sp.x + 2 + w, sp.y - 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sp.x + 7, sp.y - 2);
    ctx.lineTo(sp.x + 7 - w, sp.y - 7);
    ctx.stroke();
  }
}

/* ---------- Fruit Rat Enemy ---------- */
class FruitRat extends Enemy {
  constructor(g, c) {
    super(g, {
      ...c,
      enemyType: "fruitRat",
      name: c.name || "Fruit Thief Rat",
      hp: c.hp || 22,
      atk: c.atk || 7,
      def: c.def || 1,
      speed: c.speed || 2.6,
      color: "#8b6914",
      aggroRange: c.aggroRange || 70,
      ai: "wander",
      expReward: c.expReward || 4,
      width: c.width || 22,
      height: c.height || 18
    });
    this._stealTimer = 3 + Math.random() * 4;
    this._fruits = ["apple", "banana", "orange", "avocado ($8!!)", "mango"];
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this.active) return;
    this._stealTimer -= dt;
    if (this._stealTimer <= 0) {
      this._stealTimer = 5 + Math.random() * 5;
      var f = this._fruits[Math.floor(Math.random() * this._fruits.length)];
      this.game.hud.addChatMessage("A rat stole a " + f + "!", "#c8a060");
    }
  }
}

/* ---------- Zombie Guard Enemy ---------- */
class ZombieGuard extends Enemy {
  constructor(g, c) {
    super(g, {
      ...c,
      enemyType: "zombieGuard",
      name: c.name || "Zombie Guard",
      hp: c.hp || 55,
      atk: c.atk || 14,
      def: c.def || 6,
      speed: c.speed || 1.0,
      color: "#3a5a2a",
      aggroRange: c.aggroRange || 120,
      ai: "chase",
      expReward: c.expReward || 10,
      width: c.width || 32,
      height: c.height || 36
    });
    this._groanTimer = 2 + Math.random() * 3;
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this.active) return;
    this._groanTimer -= dt;
    if (this._groanTimer <= 0) {
      this._groanTimer = 4 + Math.random() * 5;
      var groans = ["Braaains...", "Check... receipt...", "Clean up... aisle 5...",
                    "Self... checkout... only...", "Loyalty... card?...", "GRRROOOAN..."];
      this.game.hud.addChatMessage(groans[Math.floor(Math.random() * groans.length)], "#5a8a4a");
      /* groan SFX */
      try {
        var s = this.game.sound;
        if (s && s.ctx && !s.muted) {
          var t = s.ctx.currentTime;
          var o = s.ctx.createOscillator(), g = s.ctx.createGain();
          o.type = "sawtooth";
          o.frequency.setValueAtTime(80, t);
          o.frequency.exponentialRampToValueAtTime(50, t + 0.3);
          g.gain.setValueAtTime(0.1, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          o.connect(g); g.connect(s.sfxGain);
          o.start(t); o.stop(t + 0.3);
        }
      } catch (e) {}
    }
  }
}

/* ---------- Cockroach Swarm — tiny fast, appears in groups ---------- */
class WooliesCockroach extends Enemy {
  constructor(g, c) {
    super(g, {
      ...c,
      enemyType: "cockroach",
      name: "Shelf Roach",
      hp: c.hp || 10,
      atk: c.atk || 4,
      def: 0,
      speed: c.speed || 3.2,
      color: "#4a3020",
      aggroRange: 50,
      ai: "wander",
      expReward: 2,
      width: 14, height: 10
    });
    this._flipTimer = 0.5 + Math.random();
  }
  update(dt) {
    super.update(dt);
    if (!this.alive) return;
    this._flipTimer -= dt;
    if (this._flipTimer <= 0) {
      this._flipTimer = 0.4 + Math.random() * 0.8;
      this.direction = Math.random() < 0.5 ? "left" : "right";
    }
  }
}

/* ---------- Rogue Self-Checkout — stationary turret, shoots beeps ---------- */
class RogueSelfCheckout extends Enemy {
  constructor(g, c) {
    super(g, {
      ...c,
      enemyType: "selfCheckout",
      name: "ROGUE SELF-CHECKOUT",
      hp: c.hp || 80,
      atk: c.atk || 10,
      def: c.def || 10,
      speed: 0,
      color: "#606060",
      aggroRange: 140,
      ai: "stationary",
      expReward: 15,
      width: 36, height: 40
    });
    this._beepTimer = 1.5 + Math.random();
    this._scanLine = 0;
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this.active) return;
    this._scanLine = (this._scanLine + dt * 3) % 1;
    this._beepTimer -= dt;
    if (this._beepTimer <= 0) {
      this._beepTimer = 1.2 + Math.random() * 0.8;
      var tgt = this._nearestPlayer();
      if (tgt && this.distanceTo(tgt) < 150) {
        var dx = tgt.x - this.x, dy = tgt.y - this.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var texts = ["BEEP!", "UNEXPECTED ITEM!", "SCAN AGAIN!", "ERROR!", "PLEASE WAIT!"];
        var bolt = new InsultBolt(this.game, {
          x: this.x + 18, y: this.y,
          dirX: dx / d, dirY: dy / d,
          flySpeed: 110, damage: 6,
          text: texts[Math.floor(Math.random() * texts.length)]
        });
        this.game.addEntity(bolt);
        /* beep SFX */
        try {
          var s = this.game.sound;
          if (s && s.ctx && !s.muted) {
            var t = s.ctx.currentTime;
            var o = s.ctx.createOscillator(), g2 = s.ctx.createGain();
            o.type = "square"; o.frequency.value = 1200;
            g2.gain.setValueAtTime(0.12, t);
            g2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            o.connect(g2); g2.connect(s.sfxGain);
            o.start(t); o.stop(t + 0.08);
          }
        } catch (e) {}
      }
    }
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -40 || sp.x > 520) return;
    /* machine body */
    ctx.fillStyle = "#555";
    ctx.fillRect(sp.x, sp.y, 36, 40);
    ctx.fillStyle = "#404040";
    ctx.fillRect(sp.x + 2, sp.y + 2, 32, 20);
    /* screen */
    ctx.fillStyle = "#103820";
    ctx.fillRect(sp.x + 4, sp.y + 4, 28, 16);
    ctx.fillStyle = "#40ff60";
    ctx.font = "5px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("UNEXPECTED", sp.x + 18, sp.y + 12);
    ctx.fillText("ITEM", sp.x + 18, sp.y + 18);
    /* scan laser */
    var ly = sp.y + 22 + this._scanLine * 16;
    ctx.fillStyle = "rgba(255,0,0,0.6)";
    ctx.fillRect(sp.x - 20, ly, 76, 1);
    /* base */
    ctx.fillStyle = "#666";
    ctx.fillRect(sp.x - 2, sp.y + 36, 40, 4);
    /* HP bar */
    if (this.hp < this.maxHp) {
      var pr = this.hp / this.maxHp;
      ctx.fillStyle = "#300";
      ctx.fillRect(sp.x, sp.y - 5, 36, 3);
      ctx.fillStyle = "#e84855";
      ctx.fillRect(sp.x, sp.y - 5, Math.floor(36 * pr), 3);
    }
  }
}

/* ---------- Trolley Runner — charges at player from one direction ---------- */
class TrolleyRunner extends Enemy {
  constructor(g, c) {
    super(g, {
      ...c,
      enemyType: "trolleyRunner",
      name: "RUNAWAY TROLLEY",
      hp: c.hp || 35,
      atk: c.atk || 18,
      def: c.def || 5,
      speed: c.speed || 4.0,
      color: "#999",
      aggroRange: 180,
      ai: "chase",
      expReward: 8,
      width: 28, height: 20,
      contactDamage: 22
    });
    this._chargeDir = c.chargeDir || 1;
    this._charging = false;
    this._chargeTimer = 2 + Math.random() * 2;
    this._wobble = 0;
  }
  update(dt) {
    if (!this.alive || !this.active) return;
    this._wobble += dt * 20;
    var tgt = this._nearestPlayer();
    if (!this._charging) {
      this._chargeTimer -= dt;
      if (this._chargeTimer <= 0 && tgt && this.distanceTo(tgt) < 200) {
        this._charging = true;
        this._chargeDir = (tgt.x > this.x) ? 1 : -1;
        this.game.hud.addChatMessage("TROLLEY INCOMING!", "#f80");
      }
    }
    if (this._charging) {
      this.x += this._chargeDir * 5 * 60 * dt;
      if (this.x < -50 || this.x > 4500) { this.alive = false; this.destroy(); }
    } else {
      this.vx = 0; this.vy = 0;
    }
    Entity.prototype.update.call(this, dt);
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -30 || sp.x > 510) return;
    var wb = Math.sin(this._wobble) * (this._charging ? 2 : 0.5);
    /* cart body */
    ctx.fillStyle = "#aaa";
    ctx.fillRect(sp.x, sp.y + wb, 28, 14);
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1;
    ctx.strokeRect(sp.x, sp.y + wb, 28, 14);
    /* handle */
    ctx.fillStyle = "#666";
    var hx = this._chargeDir > 0 ? sp.x - 4 : sp.x + 28;
    ctx.fillRect(hx, sp.y - 6 + wb, 4, 12);
    /* wheels */
    ctx.fillStyle = "#444";
    ctx.beginPath(); ctx.arc(sp.x + 5, sp.y + 16 + wb, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sp.x + 23, sp.y + 16 + wb, 3, 0, Math.PI * 2); ctx.fill();
    /* speed lines when charging */
    if (this._charging) {
      ctx.strokeStyle = "rgba(255,200,0,0.4)";
      var bx = this._chargeDir > 0 ? sp.x - 8 : sp.x + 36;
      for (var i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(bx - this._chargeDir * i * 6, sp.y + 4 + i * 5 + wb);
        ctx.lineTo(bx - this._chargeDir * (i * 6 + 10), sp.y + 4 + i * 5 + wb);
        ctx.stroke();
      }
    }
    /* HP bar */
    if (this.hp < this.maxHp) {
      var pr = this.hp / this.maxHp;
      ctx.fillStyle = "#300";
      ctx.fillRect(sp.x, sp.y - 5, 28, 3);
      ctx.fillStyle = "#e84855";
      ctx.fillRect(sp.x, sp.y - 5, Math.floor(28 * pr), 3);
    }
  }
}

/* ---------- Expired Food Slime — slow, toxic puddle on death ---------- */
class ExpiredSlime extends Enemy {
  constructor(g, c) {
    super(g, {
      ...c,
      enemyType: "expiredSlime",
      name: "Expired Food Slime",
      hp: c.hp || 30,
      atk: c.atk || 6,
      def: c.def || 2,
      speed: c.speed || 0.6,
      color: "#608030",
      aggroRange: 80,
      ai: "chase",
      expReward: 6,
      width: c.width || 24, height: c.height || 18
    });
    this._bubbleTimer = 0;
    this._phase = 0;
  }
  update(dt) {
    super.update(dt);
    if (!this.alive) return;
    this._bubbleTimer += dt;
    this._phase += dt * 2;
  }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -30 || sp.x > 510) return;
    var squish = 1 + Math.sin(this._phase) * 0.15;
    var w = this.width * squish, h = this.height / squish;
    var dx = (this.width - w) / 2;
    /* body — blobby */
    ctx.fillStyle = "#708830";
    ctx.beginPath();
    ctx.ellipse(sp.x + this.width / 2, sp.y + this.height - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    /* shine */
    ctx.fillStyle = "rgba(180,220,80,0.4)";
    ctx.beginPath();
    ctx.ellipse(sp.x + this.width / 2 - 3, sp.y + this.height - h / 2 - 3, w / 4, h / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    /* bubbles */
    ctx.fillStyle = "rgba(200,240,100,0.5)";
    for (var i = 0; i < 3; i++) {
      var bx = sp.x + 6 + i * 7 + Math.sin(this._bubbleTimer * 3 + i) * 3;
      var by = sp.y + this.height - h + Math.sin(this._bubbleTimer * 2 + i * 2) * 4 - 2;
      ctx.beginPath(); ctx.arc(bx, by, 2, 0, Math.PI * 2); ctx.fill();
    }
    /* eyes */
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(sp.x + this.width / 2 - 4, sp.y + this.height - h / 2 - 2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sp.x + this.width / 2 + 4, sp.y + this.height - h / 2 - 2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(sp.x + this.width / 2 - 3, sp.y + this.height - h / 2 - 1, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sp.x + this.width / 2 + 5, sp.y + this.height - h / 2 - 1, 1.5, 0, Math.PI * 2); ctx.fill();
    /* HP bar */
    if (this.hp < this.maxHp) {
      var pr = this.hp / this.maxHp;
      ctx.fillStyle = "#300";
      ctx.fillRect(sp.x, sp.y - 5, this.width, 3);
      ctx.fillStyle = "#e84855";
      ctx.fillRect(sp.x, sp.y - 5, Math.floor(this.width * pr), 3);
    }
  }
}

/* ---------- Karen Friend (summoned) ---------- */
class KarenFriend extends Enemy {
  constructor(g, c) {
    super(g, {
      ...c,
      enemyType: "karenFriend",
      name: c.name || "Karen's BFF",
      hp: c.hp || 60,
      atk: c.atk || 17,
      def: c.def || 4,
      speed: c.speed || 1.8,
      color: "#c04020",
      aggroRange: c.aggroRange || 160,
      ai: "chase",
      expReward: c.expReward || 12,
      width: c.width || 32,
      height: c.height || 36
    });
    this._insultTimer = 1.5 + Math.random() * 2;
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this.active) return;
    this._insultTimer -= dt;
    if (this._insultTimer <= 0) {
      this._insultTimer = 2 + Math.random() * 2;
      var tgt = this._nearestPlayer();
      if (tgt && this.distanceTo(tgt) < 200) {
        var dx = tgt.x - this.x, dy = tgt.y - this.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var texts = ["RUDE!", "OMG!", "HOW DARE!", "EXCUSE ME!", "MANAGER!"];
        var bolt = new InsultBolt(this.game, {
          x: this.x + this.width / 2, y: this.y,
          dirX: dx / d, dirY: dy / d,
          flySpeed: 130, damage: 6,
          text: texts[Math.floor(Math.random() * texts.length)]
        });
        this.game.addEntity(bolt);
      }
    }
  }
}

/* ================================================================
   Stage2_B1 — B1 Woolworths "Wool-WORSE" (side-scroll)
   ================================================================ */
class Stage2_B1 {
  constructor(onComplete) {
    this.game = null;
    this.onComplete = onComplete;
    this.complete = false;
    this.ss = null;
    this.enemies = [];

    /* boss fields */
    this.boss = null;
    this.bossTriggered = false;
    this.bossDefeated = false;
    this.bossPoopMode = false;
    this.bossFriendsMode = false;
    this.bossFriends = [];
    this.bossInsultTimer = 0;
    this.bossPoopTimer = 0;
    this.bossShoutTimer = 0;

    /* environment */
    this.announceTimer = 8;
    this.cartTimer = 0;
    this.carts = [];
    this.flickerTimer = 0;
    this.flickerOn = true;

    /* shelves for background — zone-specific variety */
    this.shelves = [];
    var shelfDefs = [
      /* checkout area 0-400 */
      { x: 30, h: 40, type: "register", label: "REG 1" },
      { x: 140, h: 40, type: "register", label: "REG 2" },
      { x: 260, h: 40, type: "register", label: "REG 3" },
      { x: 370, h: 55, type: "magazine", label: "MAGS" },
      { x: 450, h: 45, type: "candy", label: "SWEETS" },
      { x: 540, h: 55, type: "candy", label: "CHOC" },
      /* produce 600-850 */
      { x: 620, h: 35, type: "crate", label: "APPLES" },
      { x: 680, h: 30, type: "crate", label: "BANANA" },
      { x: 740, h: 35, type: "crate", label: "MANGO" },
      { x: 810, h: 40, type: "crate", label: "AVOCADO" },
      /* freezer 860-1100 */
      { x: 870, h: 60, type: "freezer", label: "ICE CREAM" },
      { x: 950, h: 65, type: "freezer", label: "FROZEN VEG" },
      { x: 1030, h: 55, type: "freezer", label: "PIES" },
      { x: 1110, h: 60, type: "freezer", label: "PIZZA" },
      /* bakery 1200-1450 */
      { x: 1200, h: 50, type: "bakery", label: "BREAD" },
      { x: 1270, h: 55, type: "bakery", label: "ROLLS" },
      { x: 1340, h: 45, type: "bakery", label: "CAKES" },
      { x: 1420, h: 60, type: "bakery", label: "PASTRY" },
      /* drinks 1480-1780 */
      { x: 1490, h: 70, type: "drinks", label: "SOFT DRINK" },
      { x: 1570, h: 75, type: "drinks", label: "JUICE" },
      { x: 1650, h: 65, type: "drinks", label: "WATER" },
      { x: 1740, h: 70, type: "drinks", label: "ENERGY" },
      /* upper walkway (storage boxes) 1950-2350 */
      { x: 1970, h: 40, type: "storage", label: "STOCK" },
      { x: 2060, h: 45, type: "storage", label: "BOXES" },
      { x: 2150, h: 40, type: "storage", label: "RETURNS" },
      { x: 2250, h: 35, type: "storage", label: "STAFF" },
      /* second checkout 2400-2700 */
      { x: 2410, h: 55, type: "snacks", label: "CHIPS" },
      { x: 2500, h: 50, type: "snacks", label: "BISCUITS" },
      { x: 2590, h: 55, type: "snacks", label: "TIM TAMS" },
      { x: 2670, h: 50, type: "snacks", label: "LOLLIES" },
      /* deli 2720-3100 */
      { x: 2730, h: 40, type: "deli", label: "SALADS" },
      { x: 2820, h: 45, type: "deli", label: "ROAST" },
      { x: 2900, h: 40, type: "deli", label: "SUSHI" },
      { x: 2990, h: 45, type: "deli", label: "CHEESE" },
      /* meat 3120-3400 */
      { x: 3130, h: 55, type: "meat", label: "BEEF" },
      { x: 3210, h: 50, type: "meat", label: "CHICKEN" },
      { x: 3300, h: 55, type: "meat", label: "LAMB" }
    ];
    for (var i = 0; i < shelfDefs.length; i++) {
      this.shelves.push(shelfDefs[i]);
    }
  }

  async init(game) {
    this.game = game;
    this.ss = new SideScroll(game);
    this.ss.activate({
      groundY: 272,
      worldWidth: 4400,
      platforms: this._makePlatforms(),
      hazards: this._makeHazards()
    });
    game.tileMap = null;
    game.camera.setMapBounds(4400, 320);
    var p = game.localPlayer;
    p.x = 48; p.y = 240;
    p.svx = 0; p.svy = 0;
    game.camera.x = 0; game.camera.y = 0;
    game.camera.follow(p);
    game.hud.showStageName("Stage 2-B1: Top Ryde City - Woolworths");
    game.hud.addChatMessage("Welcome to Wool-WORSE! Where the prices are SCARY!", "#2a8a2a");
    this._spawnEnemies();
    this._spawnItems();
    this._setupBoss();
    setTimeout(function() {
      game.startDialogue([
        { speaker: "Alice", text: "Woolworths! ...Wait, why does the sign say 'Wool-WORSE'?" },
        { speaker: "Alice", text: "And why are the RATS eating all the fruit?!" },
        { speaker: "Alice", text: "Are those... ZOMBIE SECURITY GUARDS?!" },
        { speaker: "Zombie Guard", text: "Show... me... your... receipt..." },
        { speaker: "Alice", text: "I haven't bought ANYTHING!" }
      ], function() { if (game.sound) game.sound.playBGM("b1_woolworths"); });
    }, 500);
  }

  _makePlatforms() {
    return [
      /* checkout area — grey counter tops */
      { x: 0, y: 256, w: 300, h: 16, color: "#b0a898", topColor: "#c8bfb0", zone: "checkout" },
      { x: 150, y: 228, w: 64, h: 10, color: "#8a7a68", topColor: "#a89880", zone: "shelf" },
      { x: 320, y: 244, w: 80, h: 10, color: "#8a7a68", topColor: "#a89880", zone: "shelf" },
      { x: 440, y: 256, w: 200, h: 16, color: "#b0a898", topColor: "#c8bfb0", zone: "checkout" },
      { x: 500, y: 224, w: 64, h: 10, color: "#8a7a68", topColor: "#a89880", zone: "shelf" },
      /* produce section — green/wood crates */
      { x: 680, y: 248, w: 120, h: 24, color: "#5a8a3a", topColor: "#78b848", zone: "produce" },
      { x: 750, y: 220, w: 48, h: 10, color: "#6a7a4a", topColor: "#8aa85a", zone: "produce" },
      /* freezer section — icy blue */
      { x: 860, y: 256, w: 200, h: 16, color: "#5080a0", topColor: "#80c0e0", zone: "freezer" },
      { x: 920, y: 232, w: 80, h: 10, color: "#4870a0", topColor: "#70b0d0", zone: "freezer" },
      { x: 1100, y: 244, w: 100, h: 28, color: "#5080a0", topColor: "#80c0e0", zone: "freezer" },
      /* bakery — warm brown */
      { x: 1240, y: 256, w: 200, h: 16, color: "#a08050", topColor: "#c8a060", zone: "bakery" },
      { x: 1280, y: 224, w: 60, h: 10, color: "#907040", topColor: "#b89058", zone: "bakery" },
      { x: 1380, y: 236, w: 60, h: 10, color: "#907040", topColor: "#b89058", zone: "bakery" },
      /* drinks aisle — dark blue/red shelves */
      { x: 1480, y: 256, w: 250, h: 16, color: "#605080", topColor: "#8870a0", zone: "drinks" },
      { x: 1560, y: 220, w: 80, h: 10, color: "#504070", topColor: "#786098", zone: "drinks" },
      { x: 1700, y: 240, w: 60, h: 10, color: "#504070", topColor: "#786098", zone: "drinks" },
      /* stairs up — concrete with yellow edges */
      { x: 1800, y: 256, w: 48, h: 16, color: "#a0a090", topColor: "#d0c830", zone: "stairs" },
      { x: 1848, y: 244, w: 48, h: 16, color: "#a0a090", topColor: "#d0c830", zone: "stairs" },
      { x: 1896, y: 232, w: 48, h: 16, color: "#a0a090", topColor: "#d0c830", zone: "stairs" },
      /* upper walkway — metal grating */
      { x: 1944, y: 232, w: 400, h: 40, color: "#707878", topColor: "#90a0a0", zone: "metal" },
      { x: 2100, y: 210, w: 60, h: 10, color: "#607070", topColor: "#809090", zone: "metal" },
      /* descent stairs */
      { x: 2344, y: 244, w: 48, h: 16, color: "#a0a090", topColor: "#d0c830", zone: "stairs" },
      { x: 2392, y: 256, w: 300, h: 16, color: "#b0a898", topColor: "#c8bfb0", zone: "checkout" },
      /* deli section — glass/steel counters */
      { x: 2720, y: 248, w: 120, h: 24, color: "#88a0a8", topColor: "#b0d8e0", zone: "deli" },
      { x: 2880, y: 256, w: 200, h: 16, color: "#88a0a8", topColor: "#b0d8e0", zone: "deli" },
      { x: 2950, y: 228, w: 60, h: 10, color: "#78909a", topColor: "#a0c8d0", zone: "deli" },
      /* meat section — red/cold */
      { x: 3120, y: 256, w: 200, h: 16, color: "#a05050", topColor: "#d07070", zone: "meat" },
      { x: 3180, y: 232, w: 80, h: 10, color: "#904040", topColor: "#c06060", zone: "meat" },
      /* boss arena: customer service desk — bright red/white */
      { x: 3400, y: 256, w: 600, h: 64, color: "#c04040", topColor: "#e06060", zone: "boss" },
      { x: 3500, y: 228, w: 80, h: 10, color: "#a83838", topColor: "#d05050", zone: "boss" },
      { x: 3700, y: 228, w: 80, h: 10, color: "#a83838", topColor: "#d05050", zone: "boss" },
      /* exit area — green glow */
      { x: 4050, y: 256, w: 350, h: 64, color: "#408060", topColor: "#60b080", zone: "exit" }
    ];
  }

  _makeHazards() {
    return [
      /* spill puddles */
      { x: 400, y: 264, w: 40, h: 8, damage: 4, type: "puddle" },
      { x: 830, y: 264, w: 30, h: 8, damage: 4, type: "puddle" },
      { x: 1200, y: 264, w: 35, h: 8, damage: 5, type: "puddle" },
      { x: 1680, y: 264, w: 28, h: 8, damage: 4, type: "puddle" },
      { x: 2680, y: 264, w: 40, h: 8, damage: 5, type: "puddle" },
      { x: 3080, y: 264, w: 30, h: 8, damage: 5, type: "puddle" },
      /* broken glass */
      { x: 600, y: 264, w: 24, h: 6, damage: 6, type: "glass" },
      { x: 1420, y: 264, w: 20, h: 6, damage: 6, type: "glass" },
      { x: 2540, y: 264, w: 24, h: 6, damage: 6, type: "glass" },
      /* ice patches in freezer area */
      { x: 880, y: 264, w: 36, h: 6, damage: 3, type: "ice" },
      { x: 1050, y: 264, w: 30, h: 6, damage: 3, type: "ice" }
    ];
  }

  _spawnEnemies() {
    var g = this.game;
    var self = this;
    function spawn(EnemyClass, cfg) {
      var e = new EnemyClass(g, cfg);
      e.sideScrollMode = true; e.svy = 0;
      self.enemies.push(e); g.addEntity(e);
      return e;
    }

    /* === Fruit Rats — mostly in produce/bakery === */
    var rats = [
      { x: 200, y: 240 }, { x: 700, y: 225 }, { x: 740, y: 230 },
      { x: 810, y: 225 }, { x: 1250, y: 240 }, { x: 1350, y: 230 },
      { x: 1700, y: 235 }, { x: 2450, y: 230 }, { x: 2750, y: 222 },
      { x: 2950, y: 230 }, { x: 3150, y: 230 }, { x: 3250, y: 225 }
    ];
    for (var i = 0; i < rats.length; i++) spawn(FruitRat, rats[i]);

    /* === Cockroach swarms — small clusters near shelves === */
    var roachSpots = [160, 380, 560, 870, 1040, 1430, 1660, 1900, 2260, 2600, 2830, 3000, 3180, 3280];
    for (var i = 0; i < roachSpots.length; i++) {
      for (var j = 0; j < 2 + Math.floor(Math.random() * 2); j++) {
        spawn(WooliesCockroach, {
          x: roachSpots[i] + j * 12 + Math.random() * 10,
          y: 248 + Math.random() * 10
        });
      }
    }

    /* === Zombie Guards — patrolling aisles === */
    var guards = [
      { x: 350, y: 220 }, { x: 650, y: 220 }, { x: 1050, y: 220 },
      { x: 1500, y: 220 }, { x: 1800, y: 220 }, { x: 2050, y: 195 },
      { x: 2500, y: 220 }, { x: 2880, y: 220 }, { x: 3100, y: 220 },
      { x: 3200, y: 220 }
    ];
    for (var i = 0; i < guards.length; i++) spawn(ZombieGuard, guards[i]);

    /* === Rogue Self-Checkouts — stationary turrets === */
    spawn(RogueSelfCheckout, { x: 100, y: 218 });
    spawn(RogueSelfCheckout, { x: 470, y: 218 });
    spawn(RogueSelfCheckout, { x: 1560, y: 218 });
    spawn(RogueSelfCheckout, { x: 2420, y: 218 });

    /* === Trolley Runners — charge at the player === */
    spawn(TrolleyRunner, { x: 580, y: 248 });
    spawn(TrolleyRunner, { x: 1150, y: 248 });
    spawn(TrolleyRunner, { x: 1780, y: 248 });
    spawn(TrolleyRunner, { x: 2400, y: 248 });
    spawn(TrolleyRunner, { x: 2680, y: 245 });
    spawn(TrolleyRunner, { x: 3350, y: 248 });

    /* === Expired Food Slimes — near freezer/deli === */
    spawn(ExpiredSlime, { x: 900, y: 240 });
    spawn(ExpiredSlime, { x: 1020, y: 240 });
    spawn(ExpiredSlime, { x: 1130, y: 220 });
    spawn(ExpiredSlime, { x: 2760, y: 228 });
    spawn(ExpiredSlime, { x: 2920, y: 240 });
    spawn(ExpiredSlime, { x: 3060, y: 240 });
    spawn(ExpiredSlime, { x: 3180, y: 235 });
  }

  _spawnItems() {
    var g = this.game;
    var items = [
      { x: 160, y: 195, item: { name: "Woolies Banana", type: "consumable", heal: 8, color: "#f0d060", pickupMessage: "Free range banana!" } },
      { x: 520, y: 190, item: { name: "Half-Price Sushi", type: "consumable", heal: 15, color: "#f8d8c0", pickupMessage: "Half-price sushi! Score!" } },
      { x: 760, y: 188, item: { name: "Macro Organic Juice", type: "consumable", heal: 12, color: "#ff8c00", pickupMessage: "Organic juice! $12 for 500ml?!" } },
      { x: 940, y: 200, item: { name: "Frozen Party Pie", type: "consumable", heal: 18, color: "#c8a060", pickupMessage: "Party pies! Chuck em in the oven!" } },
      { x: 1300, y: 190, item: { name: "Mud Cake", type: "consumable", heal: 22, color: "#3a2010", pickupMessage: "$5 Woolies mud cake! LEGEND!" } },
      { x: 1580, y: 188, item: { name: "Dare Iced Coffee", type: "consumable", heal: 15, color: "#8b4513", pickupMessage: "Dare Iced Coffee! Energy boost!" } },
      { x: 2120, y: 178, item: { name: "Chicken Schnitzel", type: "consumable", heal: 25, color: "#daa520", pickupMessage: "Hot chook schnitz! Beauty!" } },
      { x: 2780, y: 190, item: { name: "BBQ Chook", type: "consumable", heal: 30, color: "#c08040", pickupMessage: "Hot roast chicken! $12 steal!" } },
      { x: 3200, y: 200, item: { name: "Tim Tam Family Pack", type: "consumable", heal: 28, color: "#4a2810", pickupMessage: "Family pack Tim Tams!" } },
      /* weapons & armor */
      { x: 460, y: 200, item: { name: "Shopping Trolley Handle", type: "weapon", equipSlot: "weapon", atk: 12, color: "#888", pickupMessage: "Trolley handle! Weaponised!" } },
      { x: 1700, y: 208, item: { name: "Frozen Leg of Lamb", type: "weapon", equipSlot: "weapon", atk: 18, color: "#d4a870", pickupMessage: "Frozen lamb leg! WHACK!" } },
      { x: 2960, y: 196, item: { name: "Plastic Bag Armour", type: "armor", equipSlot: "armor", def: 8, color: "#e0e0e0", pickupMessage: "15 cent bag as armour! Worth it!" } }
    ];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var d = new ItemDrop(g, { x: it.x, y: it.y, itemData: it.item });
      d.lifetime = 99999;
      g.addEntity(d);
    }
  }

  /* ===================== BOSS: KAREN THE TERRIBLE ===================== */
  _setupBoss() {
    this.boss = new Enemy(this.game, {
      x: 3700, y: 200,
      enemyType: "karen",
      name: "KAREN THE TERRIBLE",
      hp: 450,
      atk: 20,
      def: 6,
      speed: 1.4,
      color: "#b8860b",
      aggroRange: 200,
      ai: "chase",
      expReward: 70,
      width: 48,
      height: 48,
      lootTable: [
        { item: { name: "Karen's Handbag", type: "weapon", equipSlot: "weapon", atk: 22, color: "#b8860b", pickupMessage: "Karen's designer handbag! Surprisingly heavy!" }, chance: 1 },
        { item: { name: "Manager's Badge", type: "accessory", equipSlot: "accessory", atk: 5, def: 5, color: "#f0d060", pickupMessage: "You ARE the manager now!" }, chance: 1 },
        { item: { name: "Complaint Form Scroll", type: "consumable", heal: 90, color: "#fff", pickupMessage: "Reading all complaints... oddly healing." }, chance: 1 }
      ]
    });
    this.boss.isBoss = true;
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
    this.ss.update(dt);
    this._updateEnemyGravity(dt);
    this._updateAnnouncements(dt);
    this._checkBossTrigger();
    this._updateBoss(dt);
    this._checkBossDefeated();
    this._checkExit();
  }

  _updateEnemyGravity(dt) {
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.alive || !e.active || !e.sideScrollMode) continue;
      e.svy = (e.svy || 0) + this.ss.gravity * dt;
      var ny = e.y + e.svy * dt;
      if (ny + e.height >= this.ss.groundY) {
        e.y = this.ss.groundY - e.height; e.svy = 0;
      } else {
        var landed = false;
        if (e.svy > 0) {
          for (var j = 0; j < this.ss.platforms.length; j++) {
            var pl = this.ss.platforms[j];
            if (e.x + e.width > pl.x && e.x < pl.x + pl.w &&
                ny + e.height >= pl.y && e.y + e.height <= pl.y + 8) {
              e.y = pl.y - e.height; e.svy = 0; landed = true; break;
            }
          }
        }
        if (!landed) e.y = ny;
      }
    }
  }

  _updateAnnouncements(dt) {
    this.announceTimer -= dt;
    if (this.announceTimer <= 0) {
      this.announceTimer = 12 + Math.random() * 8;
      var msgs = [
        "🔊 Cleanup on aisle EVERYWHERE!",
        "🔊 ATTENTION: The rats are NOT free-range pets.",
        "🔊 Fresh fruit? More like fresh GONE!",
        "🔊 Security to all aisles... ALL of them.",
        "🔊 Woolworths: The Fresh Food People... were.",
        "🔊 Today's special: SURVIVAL.",
        "🔊 15c bags still available. They won't save you.",
        "🔊 Self-checkout has become SELF-AWARE.",
        "🔊 Price check on: your LIFE CHOICES.",
        "🔊 Rewards card members get 10% less screaming.",
        "🔊 The mud cake is still $5. Some things never change."
      ];
      this.game.hud.addChatMessage(msgs[Math.floor(Math.random() * msgs.length)], "#2a8a2a");
    }
  }

  /* ===================== BOSS MECHANICS ===================== */
  _checkBossTrigger() {
    if (this.bossTriggered || this.bossDefeated) return;
    if (this.game.localPlayer.x > 3550) {
      this.bossTriggered = true;
      this.boss.active = true;
      this.boss.visible = true;
      this.game.camera.shake(6, 0.6);
      this.game.hud.setBoss(this.boss, "KAREN THE TERRIBLE");
      this.game.hud.addChatMessage("BOSS: KAREN THE TERRIBLE!", "#f44");
      if (this.game.sound) this.game.sound.playBossAppear();
      this.game.startDialogue([
        { speaker: "???", text: "EXCUSE ME?! EXCUSE ME!!!" },
        { speaker: "KAREN", text: "I want to speak to the MANAGER!" },
        { speaker: "Alice", text: "I don't work here lady!" },
        { speaker: "KAREN", text: "I DON'T CARE! This store is DISGUSTING!" },
        { speaker: "KAREN", text: "I'm going to give you ONE STAR on Google!" },
        { speaker: "Alice", text: "Oh no... it's a KAREN..." }
      ]);
    }
  }

  _updateBoss(dt) {
    if (!this.bossTriggered || this.bossDefeated || !this.boss || !this.boss.alive) return;
    var hpRatio = this.boss.hp / this.boss.maxHp;

    /* Always: insult attacks */
    this.bossInsultTimer -= dt;
    if (this.bossInsultTimer <= 0) {
      this.bossInsultTimer = this.bossPoopMode ? 1.5 : 0.8;
      this._bossShootInsult();
    }

    /* Phase 2: Poop mode at 70% HP */
    if (!this.bossPoopMode && hpRatio <= 0.7) {
      this.bossPoopMode = true;
      this.game.camera.shake(5, 0.5);
      this.game.hud.addChatMessage("KAREN starts throwing... OH NO!", "#6b4226");
      this.game.startDialogue([
        { speaker: "KAREN", text: "YOU MADE ME DO THIS!!!" },
        { speaker: "Alice", text: "IS THAT... IS SHE THROWING... POOP?!" },
        { speaker: "Alice", text: "THIS IS SO GROSS!!" }
      ]);
    }
    if (this.bossPoopMode) {
      this.bossPoopTimer -= dt;
      if (this.bossPoopTimer <= 0) {
        this.bossPoopTimer = 0.6 + Math.random() * 0.4;
        this._bossShootPoop();
      }
    }

    /* Phase 3: Summon friends at 30% HP */
    if (!this.bossFriendsMode && hpRatio <= 0.3) {
      this.bossFriendsMode = true;
      this._bossSummonFriends();
    }

    /* Karen boss shout sounds */
    this.bossShoutTimer -= dt;
    if (this.bossShoutTimer <= 0) {
      this.bossShoutTimer = 3 + Math.random() * 3;
      var shouts = [
        "THIS IS UNACCEPTABLE!!", "WHERE IS YOUR MANAGER?!",
        "I'M NEVER SHOPPING HERE AGAIN!!", "DO YOU KNOW WHO I AM?!",
        "I'LL HAVE YOUR JOB!!", "MY HUSBAND IS A LAWYER!!",
        "I KNOW THE OWNER!!", "THIS GOES ON FACEBOOK!!"
      ];
      this.game.hud.addChatMessage("KAREN: " + shouts[Math.floor(Math.random() * shouts.length)], "#f44");
      /* scream SFX */
      try {
        var s = this.game.sound;
        if (s && s.ctx && !s.muted) {
          var t = s.ctx.currentTime;
          var o = s.ctx.createOscillator(), g = s.ctx.createGain();
          o.type = "sawtooth";
          o.frequency.setValueAtTime(800, t);
          o.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
          o.frequency.exponentialRampToValueAtTime(600, t + 0.2);
          g.gain.setValueAtTime(0.15, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          o.connect(g); g.connect(s.sfxGain);
          o.start(t); o.stop(t + 0.25);
        }
      } catch (e) {}
    }
  }

  _bossShootInsult() {
    var p = this.game.localPlayer;
    var cx = this.boss.x + this.boss.width / 2, cy = this.boss.y;
    var dx = p.x - cx, dy = p.y - cy;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var insults = ["!@#$!", "RUDE!", "1 STAR!", "MANAGER!", "SUE YOU!",
                   "REFUND!", "KAREN'D!", "HOW DARE!", "YELP!!", "TOXIC!"];
    var bolt = new InsultBolt(this.game, {
      x: cx, y: cy,
      dirX: dx / d + (Math.random() - 0.5) * 0.3,
      dirY: dy / d + (Math.random() - 0.5) * 0.2,
      flySpeed: 140 + Math.random() * 40,
      damage: 8,
      text: insults[Math.floor(Math.random() * insults.length)]
    });
    this.game.addEntity(bolt);
  }

  _bossShootPoop() {
    var cx = this.boss.x + this.boss.width / 2, cy = this.boss.y;
    var p = this.game.localPlayer;
    var dx = p.x - cx + (Math.random() - 0.5) * 120;
    var dy = p.y - cy + (Math.random() - 0.5) * 60;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var bolt = new PoopBolt(this.game, {
      x: cx, y: cy,
      dirX: dx / d, dirY: dy / d - 0.3,
      flySpeed: 120 + Math.random() * 60,
      damage: 10
    });
    this.game.addEntity(bolt);
  }

  _bossSummonFriends() {
    this.game.camera.shake(8, 0.8);
    this.game.hud.addChatMessage("KAREN SUMMONS HER FRIENDS!!", "#f44");
    this.game.startDialogue([
      { speaker: "KAREN", text: "GIRLS!! GET OVER HERE!!" },
      { speaker: "KAREN", text: "*SCREEEEEAM*" },
      { speaker: "Alice", text: "There's MORE of them?!" },
      { speaker: "Karen's BFF", text: "Did someone say MANAGER?!" }
    ]);
    /* scream SFX */
    try {
      var s = this.game.sound;
      if (s && s.ctx && !s.muted) {
        var t = s.ctx.currentTime;
        [600, 800, 1000, 1200, 1400, 1000, 800].forEach(function(f, i) {
          var o = s.ctx.createOscillator(), g = s.ctx.createGain();
          o.type = "sawtooth"; o.frequency.value = f;
          g.gain.setValueAtTime(0.2, t + i * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.08);
          o.connect(g); g.connect(s.sfxGain);
          o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.08);
        });
      }
    } catch (e) {}

    var names = ["Sharon", "Debra", "Linda", "Brenda"];
    var offsets = [{ x: -100, y: -10 }, { x: 100, y: -10 }, { x: -60, y: -40 }, { x: 60, y: -40 }];
    for (var i = 0; i < 4; i++) {
      var kf = new KarenFriend(this.game, {
        x: this.boss.x + offsets[i].x,
        y: this.boss.y + offsets[i].y,
        name: names[i]
      });
      kf.sideScrollMode = true;
      kf.svy = 0;
      this.bossFriends.push(kf);
      this.enemies.push(kf);
      this.game.addEntity(kf);
    }
  }

  _checkBossDefeated() {
    if (!this.bossTriggered || this.bossDefeated) return;
    var mainDead = !this.boss.alive || this.boss.hp <= 0;
    var friendsDead = true;
    for (var i = 0; i < this.bossFriends.length; i++) {
      if (this.bossFriends[i].alive && this.bossFriends[i].hp > 0) {
        friendsDead = false; break;
      }
    }
    if (mainDead && friendsDead) {
      this.bossDefeated = true;
      this.complete = true;
      this.game.hud.clearBoss();
      this.game.hud.addChatMessage("Karen defeated! Peace restored to Woolies!", "#50c878");
      this.game.startDialogue([
        { speaker: "KAREN", text: "I'm... writing a COMPLAINT..." },
        { speaker: "Alice", text: "Please leave. Just... please." },
        { speaker: "KAREN", text: "I'm giving this store ZERO STARS!" },
        { speaker: "Alice", text: "Ma'am, zero isn't an option." },
        { speaker: "KAREN", text: "*faints dramatically*" },
        { speaker: "Alice", text: "Time to get out of Woolies!" }
      ], function() {
        if (this.game.transition) this.game.transition.startFade(function() { if (this.onComplete) this.onComplete(); }.bind(this));
        else if (this.onComplete) this.onComplete();
      }.bind(this));
    }
  }

  _checkExit() {
  }

  /* ===================== RENDER ===================== */
  render(ctx, camera) {
    if (!this.ss) return;
    this._renderBG(ctx, camera);
    this.ss.render(ctx, camera);
    this._renderFloor(ctx, camera);
    this._renderPlatformDetails(ctx, camera);
    this._renderShelves(ctx, camera);
    this._renderHazards(ctx, camera);
    this._renderDetails(ctx, camera);
    if (this.bossDefeated) this._renderExit(ctx, camera);
    /* fluorescent green tint */
    ctx.fillStyle = "rgba(200,255,200,0.03)";
    ctx.fillRect(0, 0, 480, 320);
  }

  _renderBG(ctx, camera) {
    var ox = camera.offsetX;
    /* wall — beige tiles with grout lines */
    var grad = ctx.createLinearGradient(0, 0, 0, 320);
    grad.addColorStop(0, "#d8d4c8");
    grad.addColorStop(0.3, "#e8e4d8");
    grad.addColorStop(0.7, "#ddd8cc");
    grad.addColorStop(1, "#c8c4b8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 480, 320);

    /* wall tile grid */
    ctx.strokeStyle = "rgba(160,155,140,0.25)";
    ctx.lineWidth = 1;
    for (var wx = -((ox|0) % 24); wx < 484; wx += 24) {
      ctx.beginPath(); ctx.moveTo(wx, 0); ctx.lineTo(wx, 160); ctx.stroke();
    }
    for (var wy = 0; wy < 160; wy += 16) {
      ctx.beginPath(); ctx.moveTo(0, wy); ctx.lineTo(480, wy); ctx.stroke();
    }

    /* ceiling strip (dark) */
    ctx.fillStyle = "#a09888";
    ctx.fillRect(0, 0, 480, 10);

    /* fluorescent lights — long tubes with glow */
    for (var lx = 60; lx < 4400; lx += 140) {
      var slx = lx - ox;
      if (slx < -50 || slx > 530) continue;
      /* fixture */
      ctx.fillStyle = "#b0b0a8";
      ctx.fillRect(slx - 2, 10, 54, 4);
      /* tube */
      var flicker = (this.flickerOn || (lx % 280 !== 0)) ? 1 : 0.3;
      ctx.fillStyle = "rgba(255,255,240," + flicker + ")";
      ctx.fillRect(slx, 12, 50, 2);
      /* light cone */
      ctx.fillStyle = "rgba(255,255,230," + (0.06 * flicker) + ")";
      ctx.beginPath();
      ctx.moveTo(slx, 14); ctx.lineTo(slx - 10, 160);
      ctx.lineTo(slx + 60, 160); ctx.lineTo(slx + 50, 14);
      ctx.closePath(); ctx.fill();
    }

    /* zone header signs on wall */
    var signs = [
      { x: 100, w: 160, t: "WOOL-WORSE", sub: "The Fresh Food People... were.", bg: "#1a8a2a" },
      { x: 680, w: 100, t: "PRODUCE", sub: "Freshly rat-bitten!", bg: "#3a7a2a" },
      { x: 880, w: 100, t: "FREEZER", sub: "Keep frozen. Like our smiles.", bg: "#3060a0" },
      { x: 1260, w: 100, t: "BAKERY", sub: "Baked yesterday, sold today.", bg: "#8a6030" },
      { x: 1500, w: 100, t: "DRINKS", sub: "Hydrate or die-drate.", bg: "#504080" },
      { x: 2740, w: 100, t: "DELI", sub: "Mystery meat special!", bg: "#4080a0" },
      { x: 3140, w: 100, t: "MEAT", sub: "Reduced to clear (your stomach)", bg: "#903030" },
      { x: 3520, w: 180, t: "CUSTOMER SERVICE", sub: "Enter at your own risk", bg: "#cc2200" }
    ];
    for (var si = 0; si < signs.length; si++) {
      var sg = signs[si];
      var sgx = sg.x - ox;
      if (sgx < -200 || sgx > 600) continue;
      /* sign board */
      ctx.fillStyle = sg.bg;
      ctx.fillRect(sgx, 28, sg.w, 22);
      /* border */
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.strokeRect(sgx + 1, 29, sg.w - 2, 20);
      /* text */
      ctx.fillStyle = "#fff";
      ctx.font = "bold 9px Courier New";
      ctx.textAlign = "center";
      ctx.fillText(sg.t, sgx + sg.w / 2, 42);
      ctx.font = "5px Courier New";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(sg.sub, sgx + sg.w / 2, 52);
    }
  }

  _renderFloor(ctx, camera) {
    var ox = camera.offsetX, oy = camera.offsetY;
    var gy = 272 - oy;
    /* main floor — linoleum checkered */
    ctx.fillStyle = "#c8c0b0";
    ctx.fillRect(0, gy, 480, 320 - gy + 48);
    /* checkered tiles */
    var tileW = 16;
    for (var fx = -((ox|0) % (tileW * 2)); fx < 484; fx += tileW) {
      var col = Math.floor((fx + ox) / tileW);
      var shade = (col % 2 === 0) ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)";
      ctx.fillStyle = shade;
      ctx.fillRect(fx, gy, tileW, 48);
    }
    /* floor edge highlight */
    ctx.fillStyle = "#d8d0c0";
    ctx.fillRect(0, gy, 480, 2);
  }

  _renderPlatformDetails(ctx, camera) {
    var ox = camera.offsetX, oy = camera.offsetY;
    var pls = this.ss.platforms;
    for (var i = 0; i < pls.length; i++) {
      var p = pls[i];
      var px = p.x - ox, py = p.y - oy;
      if (px + p.w < -10 || px > 490) continue;

      var z = p.zone || "";

      /* zone-specific decorations drawn ON TOP of the SideScroll platform */
      if (z === "shelf") {
        /* wooden shelf — draw grain lines */
        ctx.fillStyle = "rgba(100,80,50,0.15)";
        for (var gx = 0; gx < p.w; gx += 6) ctx.fillRect(px + gx, py, 1, p.h);
        /* front edge lip */
        ctx.fillStyle = "#70603a";
        ctx.fillRect(px, py + p.h - 2, p.w, 2);
      }
      if (z === "produce") {
        /* crate slats */
        ctx.strokeStyle = "rgba(60,40,20,0.4)";
        ctx.lineWidth = 1;
        for (var sx = 0; sx < p.w; sx += 10) {
          ctx.beginPath(); ctx.moveTo(px + sx, py); ctx.lineTo(px + sx, py + p.h); ctx.stroke();
        }
        /* fruit dots on wide platforms */
        if (p.h > 12) {
          var fruits = ["#e03030","#f0d030","#f08020","#60c040"];
          for (var fi = 0; fi < p.w / 12; fi++) {
            ctx.fillStyle = fruits[fi % fruits.length];
            ctx.beginPath();
            ctx.arc(px + 8 + fi * 12, py + 4, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      if (z === "freezer") {
        /* frost sparkles */
        ctx.fillStyle = "rgba(200,240,255,0.6)";
        for (var fi = 0; fi < p.w; fi += 8) {
          if ((fi + i * 3) % 3 === 0) ctx.fillRect(px + fi, py + 1, 2, 2);
        }
        /* ice line */
        ctx.fillStyle = "rgba(180,220,255,0.4)";
        ctx.fillRect(px, py + p.h - 1, p.w, 1);
      }
      if (z === "bakery") {
        /* bread rolls on wide surfaces */
        if (p.h > 12) {
          ctx.fillStyle = "#d4a050";
          for (var bi = 0; bi < p.w / 20; bi++) {
            ctx.beginPath();
            ctx.ellipse(px + 10 + bi * 20, py + 5, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = "#b08030";
          for (var bi = 0; bi < p.w / 20; bi++) {
            ctx.fillRect(px + 7 + bi * 20, py + 5, 6, 1);
          }
        }
      }
      if (z === "drinks") {
        /* bottle silhouettes */
        var bottleColors = ["#d02020","#2060c0","#20a020","#f0a020"];
        for (var bi = 0; bi < p.w / 10; bi++) {
          ctx.fillStyle = bottleColors[bi % bottleColors.length];
          ctx.fillRect(px + 3 + bi * 10, py + 2, 4, p.h - 4);
          ctx.fillRect(px + 4 + bi * 10, py, 2, 2);
        }
      }
      if (z === "stairs") {
        /* yellow safety stripe */
        ctx.fillStyle = "#d0c830";
        ctx.fillRect(px, py, p.w, 3);
        ctx.fillStyle = "#202020";
        for (var stx = 0; stx < p.w; stx += 8) {
          ctx.fillRect(px + stx, py, 4, 3);
        }
        /* arrow up */
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "8px Courier New";
        ctx.textAlign = "center";
        ctx.fillText("\u25B2", px + p.w / 2, py + p.h - 2);
      }
      if (z === "metal") {
        /* grating pattern */
        ctx.strokeStyle = "rgba(40,50,50,0.25)";
        ctx.lineWidth = 1;
        for (var mx = 0; mx < p.w; mx += 6) {
          ctx.beginPath(); ctx.moveTo(px + mx, py); ctx.lineTo(px + mx + 3, py + p.h); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(px + mx + 3, py); ctx.lineTo(px + mx, py + p.h); ctx.stroke();
        }
        /* rail */
        if (p.h > 20) {
          ctx.fillStyle = "#60686a";
          ctx.fillRect(px, py - 2, p.w, 2);
        }
      }
      if (z === "deli") {
        /* glass counter shine */
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(px + 2, py + 1, p.w - 4, 3);
        /* food behind glass */
        if (p.h > 12) {
          var deliColors = ["#c08040","#e0a060","#d06040","#c0a030"];
          for (var di = 0; di < p.w / 16; di++) {
            ctx.fillStyle = deliColors[di % deliColors.length];
            ctx.fillRect(px + 4 + di * 16, py + 6, 10, 6);
          }
        }
      }
      if (z === "meat") {
        /* hanging hooks */
        ctx.strokeStyle = "#808080";
        ctx.lineWidth = 1;
        for (var mi = 0; mi < p.w / 24; mi++) {
          var hx = px + 12 + mi * 24;
          ctx.beginPath(); ctx.moveTo(hx, py - 12); ctx.lineTo(hx, py - 4);
          ctx.lineTo(hx + 2, py - 2); ctx.stroke();
          /* meat */
          ctx.fillStyle = "#c04040";
          ctx.fillRect(hx - 3, py - 4, 6, 8);
        }
      }
      if (z === "boss") {
        /* desk edge */
        ctx.fillStyle = "#f0e0c0";
        ctx.fillRect(px, py, p.w, 4);
        /* WARNING tape */
        if (p.h > 20) {
          ctx.fillStyle = "#f0c000";
          ctx.fillRect(px, py + 4, p.w, 3);
          ctx.fillStyle = "#000";
          for (var bx = 0; bx < p.w; bx += 12) {
            ctx.fillRect(px + bx, py + 4, 6, 3);
          }
        }
        /* complaint boxes */
        if (p.h > 40) {
          ctx.fillStyle = "#e8e0d0";
          for (var cx = 0; cx < p.w / 60; cx++) {
            ctx.fillRect(px + 20 + cx * 60, py + 10, 16, 12);
          }
          ctx.fillStyle = "#a00";
          ctx.font = "4px Courier New";
          ctx.textAlign = "center";
          for (var cx = 0; cx < p.w / 60; cx++) {
            ctx.fillText("ANGRY", px + 28 + cx * 60, py + 18);
          }
        }
      }
      if (z === "exit") {
        /* green arrows */
        ctx.fillStyle = "rgba(80,200,120,0.3)";
        for (var ax = 0; ax < p.w; ax += 30) {
          ctx.font = "12px Courier New";
          ctx.textAlign = "center";
          ctx.fillText("\u25B6", px + ax + 15, py + 16);
        }
      }
    }
  }

  _renderShelves(ctx, camera) {
    var ox = camera.offsetX, oy = camera.offsetY;
    var W = 54;
    for (var i = 0; i < this.shelves.length; i++) {
      var sh = this.shelves[i];
      var sx = sh.x - ox, sy = 272 - oy - sh.h;
      if (sx < -60 || sx > 540) continue;
      var tp = sh.type || "snacks";

      if (tp === "register") {
        /* checkout register — boxy machine */
        ctx.fillStyle = "#505050";
        ctx.fillRect(sx, sy, W, sh.h);
        ctx.fillStyle = "#383838";
        ctx.fillRect(sx + 2, sy + 2, W - 4, 14);
        /* screen glow */
        ctx.fillStyle = "#104020";
        ctx.fillRect(sx + 4, sy + 4, W - 8, 10);
        ctx.fillStyle = "#30e060";
        ctx.font = "4px Courier New"; ctx.textAlign = "center";
        ctx.fillText("$0.00", sx + W / 2, sy + 12);
        /* conveyor belt */
        ctx.fillStyle = "#222";
        ctx.fillRect(sx, sy + sh.h - 6, W, 6);
        ctx.fillStyle = "#444";
        for (var cx = 0; cx < W; cx += 8) ctx.fillRect(sx + cx, sy + sh.h - 6, 4, 6);

      } else if (tp === "magazine") {
        /* magazine rack — colorful covers */
        ctx.fillStyle = "#c8b890";
        ctx.fillRect(sx, sy, W, sh.h);
        var magColors = ["#e03030","#3060e0","#e0d030","#e060a0","#30c060","#ff8020"];
        for (var r = 0; r < 3; r++) {
          for (var m = 0; m < 4; m++) {
            ctx.fillStyle = magColors[(r * 4 + m) % magColors.length];
            ctx.fillRect(sx + 4 + m * 12, sy + 4 + r * Math.floor(sh.h / 3), 10, Math.floor(sh.h / 3) - 6);
          }
          ctx.fillStyle = "#a89068";
          ctx.fillRect(sx + 2, sy + (r + 1) * Math.floor(sh.h / 3) - 2, W - 4, 2);
        }

      } else if (tp === "candy") {
        /* candy display — small colorful boxes */
        ctx.fillStyle = "#e0d0b0";
        ctx.fillRect(sx, sy, W, sh.h);
        var candyC = ["#ff3060","#ff8020","#30d060","#6030e0","#e0d030","#20b0e0","#e060c0"];
        for (var r = 0; r < 4; r++) {
          for (var c = 0; c < 5; c++) {
            ctx.fillStyle = candyC[(r * 5 + c + i) % candyC.length];
            ctx.fillRect(sx + 3 + c * 10, sy + 3 + r * Math.floor(sh.h / 4), 8, Math.floor(sh.h / 4) - 4);
          }
        }

      } else if (tp === "crate") {
        /* produce crate — wooden box with fruit */
        ctx.fillStyle = "#8a6a30";
        ctx.fillRect(sx, sy, W, sh.h);
        ctx.strokeStyle = "#6a4a18"; ctx.lineWidth = 1;
        for (var sl = 0; sl < sh.h; sl += 6) ctx.strokeRect(sx, sy + sl, W, 6);
        /* fruit inside */
        var fruitC = { "APPLES": "#d03030", "BANANA": "#f0d040", "MANGO": "#f0a020", "AVOCADO": "#507030" };
        var fc = fruitC[sh.label] || "#40c040";
        for (var fy = 0; fy < 2; fy++) {
          for (var fx = 0; fx < 4; fx++) {
            ctx.fillStyle = fc;
            ctx.beginPath();
            ctx.arc(sx + 8 + fx * 11, sy + 6 + fy * 12, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

      } else if (tp === "freezer") {
        /* freezer unit — white/blue with frost */
        ctx.fillStyle = "#d0e8f0";
        ctx.fillRect(sx, sy, W, sh.h);
        ctx.fillStyle = "#b0d0e0";
        ctx.fillRect(sx + 2, sy + 2, W - 4, sh.h - 4);
        /* frost effect */
        ctx.fillStyle = "rgba(200,240,255,0.5)";
        for (var fx = 0; fx < W; fx += 5) {
          if ((fx + i) % 3 === 0) ctx.fillRect(sx + fx, sy + 1, 3, 2);
        }
        /* product boxes */
        var fColors = ["#2060c0","#c02040","#40a030","#d08020"];
        var rows = Math.floor(sh.h / 16);
        for (var r = 0; r < rows; r++) {
          ctx.fillStyle = fColors[r % fColors.length];
          ctx.fillRect(sx + 5, sy + 6 + r * 16, W - 10, 12);
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.fillRect(sx + 7, sy + 8 + r * 16, W - 14, 3);
        }
        /* temp indicator */
        ctx.fillStyle = "#4090d0";
        ctx.font = "4px Courier New"; ctx.textAlign = "center";
        ctx.fillText("-18°C", sx + W / 2, sy + sh.h - 2);

      } else if (tp === "bakery") {
        /* bakery display — warm wood with bread */
        ctx.fillStyle = "#c8a870";
        ctx.fillRect(sx, sy, W, sh.h);
        /* wooden slats */
        ctx.fillStyle = "#b09060";
        for (var sl = 0; sl < sh.h; sl += 8) ctx.fillRect(sx, sy + sl, W, 1);
        /* bread loaves */
        var breadC = ["#d4a050","#c09040","#dab060","#b88030"];
        for (var r = 0; r < 3; r++) {
          var by = sy + 5 + r * Math.floor(sh.h / 3);
          for (var b = 0; b < 3; b++) {
            ctx.fillStyle = breadC[(r + b) % breadC.length];
            ctx.beginPath();
            ctx.ellipse(sx + 10 + b * 14, by + 5, 5, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            /* score marks */
            ctx.strokeStyle = "#a07030"; ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(sx + 7 + b * 14, by + 4);
            ctx.lineTo(sx + 13 + b * 14, by + 6);
            ctx.stroke();
          }
        }

      } else if (tp === "drinks") {
        /* tall drink shelf — bottles */
        ctx.fillStyle = "#404060";
        ctx.fillRect(sx, sy, W, sh.h);
        var drinkC = ["#d02020","#2060d0","#20a020","#f0a020","#d020d0","#20d0d0"];
        var rows = Math.floor(sh.h / 12);
        for (var r = 0; r < rows; r++) {
          for (var b = 0; b < 4; b++) {
            var bc = drinkC[(r * 4 + b) % drinkC.length];
            ctx.fillStyle = bc;
            var bx = sx + 5 + b * 12, by = sy + 4 + r * 12;
            /* bottle */
            ctx.fillRect(bx, by, 8, 10);
            /* neck */
            ctx.fillRect(bx + 2, by - 2, 4, 3);
            /* cap */
            ctx.fillStyle = "#e0e0e0";
            ctx.fillRect(bx + 2, by - 3, 4, 1);
            /* label */
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.fillRect(bx + 1, by + 3, 6, 3);
          }
        }

      } else if (tp === "storage") {
        /* cardboard boxes stacked */
        ctx.fillStyle = "#b09060";
        ctx.fillRect(sx, sy, W, sh.h);
        var boxC = ["#c8a870","#b89858","#d0b078","#a88848"];
        for (var r = 0; r < 3; r++) {
          var bh = Math.floor(sh.h / 3);
          ctx.fillStyle = boxC[r % boxC.length];
          ctx.fillRect(sx + 2, sy + 2 + r * bh, W - 4, bh - 3);
          /* tape */
          ctx.fillStyle = "#c8a040";
          ctx.fillRect(sx + W / 2 - 3, sy + 2 + r * bh, 6, bh - 3);
          /* fragile text */
          ctx.fillStyle = "#c04040";
          ctx.font = "3px Courier New"; ctx.textAlign = "center";
          ctx.fillText("FRAGILE", sx + W / 2, sy + 10 + r * bh);
        }

      } else if (tp === "snacks") {
        /* snack aisle — chip bags */
        ctx.fillStyle = "#d8d0c0";
        ctx.fillRect(sx, sy, W, sh.h);
        var snackC = ["#e03030","#2050d0","#f0a020","#30b040","#9030c0"];
        var rows = Math.floor(sh.h / 14);
        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < 3; c++) {
            ctx.fillStyle = snackC[(r * 3 + c) % snackC.length];
            var bx = sx + 5 + c * 16, by = sy + 3 + r * 14;
            /* bag shape */
            ctx.beginPath();
            ctx.moveTo(bx + 2, by); ctx.lineTo(bx + 12, by);
            ctx.lineTo(bx + 14, by + 11); ctx.lineTo(bx, by + 11);
            ctx.closePath(); ctx.fill();
            /* top crimp */
            ctx.fillStyle = "#d0d0d0";
            ctx.fillRect(bx + 3, by, 8, 2);
          }
          /* shelf line */
          ctx.fillStyle = "#b0a888";
          ctx.fillRect(sx + 2, sy + (r + 1) * 14 - 1, W - 4, 1);
        }

      } else if (tp === "deli") {
        /* deli counter — glass front with food */
        ctx.fillStyle = "#e0e8e8";
        ctx.fillRect(sx, sy, W, sh.h);
        /* glass shine */
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillRect(sx + 2, sy + 2, W - 4, 4);
        /* food trays */
        var deliC = ["#c08040","#d06040","#e0a060","#80a040"];
        var rows = Math.floor(sh.h / 12);
        for (var r = 0; r < rows; r++) {
          /* tray */
          ctx.fillStyle = "#c0c0c0";
          ctx.fillRect(sx + 4, sy + 6 + r * 12, W - 8, 10);
          /* food */
          ctx.fillStyle = deliC[r % deliC.length];
          ctx.fillRect(sx + 6, sy + 7 + r * 12, W - 12, 8);
        }

      } else if (tp === "meat") {
        /* meat display — red with hanging cuts */
        ctx.fillStyle = "#e0d0d0";
        ctx.fillRect(sx, sy, W, sh.h);
        /* hook rail */
        ctx.fillStyle = "#808080";
        ctx.fillRect(sx + 2, sy + 2, W - 4, 2);
        /* hanging meats */
        var meatC = ["#c04040","#d05050","#b03030","#d06050"];
        for (var m = 0; m < 4; m++) {
          var mx = sx + 6 + m * 12;
          /* hook */
          ctx.strokeStyle = "#aaa"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(mx + 3, sy + 3); ctx.lineTo(mx + 3, sy + 8); ctx.stroke();
          /* meat */
          ctx.fillStyle = meatC[m % meatC.length];
          ctx.fillRect(mx, sy + 8, 7, sh.h - 14);
          /* marbling */
          ctx.fillStyle = "rgba(255,200,200,0.4)";
          for (var fb = 0; fb < sh.h - 18; fb += 5) {
            ctx.fillRect(mx + 1, sy + 10 + fb, 5, 2);
          }
        }
        /* reduced sticker */
        ctx.fillStyle = "#ff0";
        ctx.fillRect(sx + W / 2 - 10, sy + sh.h - 8, 20, 7);
        ctx.fillStyle = "#c00";
        ctx.font = "4px Courier New"; ctx.textAlign = "center";
        ctx.fillText("REDUCED", sx + W / 2, sy + sh.h - 3);
      }

      /* top label for all types */
      var labelBg = {
        register: "#404040", magazine: "#e03060", candy: "#f0a020",
        crate: "#3a7a2a", freezer: "#3060a0", bakery: "#8a6030",
        drinks: "#504080", storage: "#806020", snacks: "#c04020",
        deli: "#4080a0", meat: "#903030"
      };
      ctx.fillStyle = labelBg[tp] || "#1a8a2a";
      ctx.fillRect(sx, sy - 9, W, 9);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 5px Courier New"; ctx.textAlign = "center";
      ctx.fillText(sh.label, sx + W / 2, sy - 2);
    }
  }

  _renderHazards(ctx, camera) {
    var ox = camera.offsetX, oy = camera.offsetY;
    for (var i = 0; i < this.ss.hazards.length; i++) {
      var h = this.ss.hazards[i];
      var hsx = h.x - ox, hsy = h.y - oy;
      if (hsx + h.w < 0 || hsx > 480) continue;
      var ht = h.type || "puddle";

      if (ht === "puddle") {
        /* spilled green liquid */
        ctx.fillStyle = "rgba(180,220,80,0.4)";
        ctx.beginPath();
        ctx.ellipse(hsx + h.w / 2, hsy + h.h / 2, h.w / 2, h.h / 2 + 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(200,240,100,0.3)";
        ctx.beginPath();
        ctx.ellipse(hsx + h.w / 2 - 2, hsy + h.h / 2 - 1, h.w / 3, h.h / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        /* WET FLOOR sign */
        var signX = hsx + h.w / 2, signY = hsy - 16;
        ctx.fillStyle = "#ffe000";
        ctx.beginPath();
        ctx.moveTo(signX, signY); ctx.lineTo(signX - 6, signY + 14);
        ctx.lineTo(signX + 6, signY + 14); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#000"; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(signX, signY); ctx.lineTo(signX - 6, signY + 14);
        ctx.lineTo(signX + 6, signY + 14); ctx.closePath(); ctx.stroke();
        ctx.fillStyle = "#000";
        ctx.font = "bold 6px Courier New"; ctx.textAlign = "center";
        ctx.fillText("!", signX, signY + 12);

      } else if (ht === "glass") {
        /* broken glass shards — sparkly */
        ctx.fillStyle = "rgba(200,220,240,0.5)";
        ctx.fillRect(hsx, hsy, h.w, h.h);
        var t = Date.now() * 0.003;
        for (var s = 0; s < 6; s++) {
          var sx = hsx + 2 + (s * h.w / 6);
          var sy2 = hsy + Math.sin(t + s) * 2;
          ctx.fillStyle = "rgba(255,255,255," + (0.4 + Math.sin(t * 2 + s) * 0.3) + ")";
          ctx.beginPath();
          ctx.moveTo(sx, sy2); ctx.lineTo(sx + 3, sy2 - 3);
          ctx.lineTo(sx + 5, sy2 + 1); ctx.closePath(); ctx.fill();
        }
        /* DANGER label */
        ctx.fillStyle = "rgba(200,0,0,0.6)";
        ctx.font = "4px Courier New"; ctx.textAlign = "center";
        ctx.fillText("GLASS!", hsx + h.w / 2, hsy - 3);

      } else if (ht === "ice") {
        /* ice patch — shiny blue */
        ctx.fillStyle = "rgba(150,200,240,0.35)";
        ctx.beginPath();
        ctx.ellipse(hsx + h.w / 2, hsy + h.h / 2, h.w / 2 + 2, h.h / 2 + 1, 0, 0, Math.PI * 2);
        ctx.fill();
        /* sparkle */
        ctx.fillStyle = "rgba(220,240,255,0.6)";
        var t = Date.now() * 0.005;
        for (var s = 0; s < 4; s++) {
          var ix = hsx + 4 + s * (h.w / 4);
          var iy = hsy + 2 + Math.sin(t + s * 1.5) * 2;
          ctx.fillRect(ix, iy, 2, 2);
        }
        /* frost crystals */
        ctx.strokeStyle = "rgba(200,230,255,0.4)"; ctx.lineWidth = 0.5;
        for (var c = 0; c < 3; c++) {
          var cx = hsx + 5 + c * (h.w / 3);
          ctx.beginPath(); ctx.moveTo(cx, hsy - 2); ctx.lineTo(cx + 2, hsy + 4); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx - 2, hsy + 1); ctx.lineTo(cx + 4, hsy + 1); ctx.stroke();
        }
      }
    }
  }

  _renderDetails(ctx, camera) {
    var ox = camera.offsetX, oy = camera.offsetY;
    var gy = 272 - oy;
    /* Shopping trolleys */
    var trolleys = [80, 380, 800, 1500, 2300, 3000];
    for (var i = 0; i < trolleys.length; i++) {
      var tx = trolleys[i] - ox;
      if (tx < -30 || tx > 510) continue;
      /* cart body */
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, gy - 18, 24, 14);
      /* handle */
      ctx.strokeStyle = "#666";
      ctx.beginPath(); ctx.moveTo(tx + 24, gy - 18); ctx.lineTo(tx + 28, gy - 26); ctx.stroke();
      /* wire mesh pattern */
      ctx.strokeStyle = "rgba(120,120,120,0.4)";
      for (var wx = 0; wx < 24; wx += 4) {
        ctx.beginPath(); ctx.moveTo(tx + wx, gy - 18); ctx.lineTo(tx + wx, gy - 4); ctx.stroke();
      }
      /* wheels */
      ctx.fillStyle = "#444";
      ctx.beginPath(); ctx.arc(tx + 4, gy - 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(tx + 20, gy - 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#666";
      ctx.beginPath(); ctx.arc(tx + 4, gy - 2, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(tx + 20, gy - 2, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    /* Price tags on shelves */
    var prices = [
      { x: 250, t: "$4.50" }, { x: 550, t: "$8.00?!" }, { x: 850, t: "SALE!" },
      { x: 1150, t: "$2.50" }, { x: 1450, t: "$12.99" }, { x: 1750, t: "50% OFF" },
      { x: 2100, t: "$5.00" }, { x: 2500, t: "$15.00" }, { x: 2800, t: "REDUCED" }
    ];
    for (var j = 0; j < prices.length; j++) {
      var ppx = prices[j].x - ox;
      if (ppx < -20 || ppx > 500) continue;
      /* yellow price card */
      ctx.fillStyle = "#ffe020";
      ctx.fillRect(ppx - 12, gy - 40, 24, 10);
      ctx.strokeStyle = "#c8a000";
      ctx.lineWidth = 1;
      ctx.strokeRect(ppx - 12, gy - 40, 24, 10);
      ctx.fillStyle = "#000";
      ctx.font = "bold 5px Courier New";
      ctx.textAlign = "center";
      ctx.fillText(prices[j].t, ppx, gy - 33);
    }

    /* aisle number markers hanging from ceiling */
    var aisles = [
      { x: 400, n: "1" }, { x: 720, n: "2" }, { x: 1000, n: "3" },
      { x: 1350, n: "4" }, { x: 1600, n: "5" }, { x: 2600, n: "6" },
      { x: 2900, n: "7" }, { x: 3200, n: "8" }
    ];
    for (var ai = 0; ai < aisles.length; ai++) {
      var ax = aisles[ai].x - ox;
      if (ax < -20 || ax > 500) continue;
      /* hanging chain */
      ctx.strokeStyle = "#999";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ax, 14); ctx.lineTo(ax, 60); ctx.stroke();
      /* sign */
      ctx.fillStyle = "#1a8a2a";
      ctx.fillRect(ax - 10, 56, 20, 14);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 8px Courier New";
      ctx.textAlign = "center";
      ctx.fillText(aisles[ai].n, ax, 67);
    }
  }

  _renderExit(ctx, camera) {
    var ex = 4370 - camera.offsetX;
    if (ex < -10 || ex > 500) return;
    var pulse = 0.6 + Math.sin(Date.now() * 0.004) * 0.4;
    /* green exit frame */
    ctx.fillStyle = "rgba(80,200,120," + pulse + ")";
    ctx.fillRect(ex - 2, 100, 10, 172);
    /* EXIT sign */
    ctx.fillStyle = "#20a040";
    ctx.fillRect(ex - 14, 85, 36, 14);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 8px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("EXIT", ex + 4, 95);
    /* arrow */
    ctx.fillStyle = "rgba(80,200,120," + (0.5 + pulse * 0.5) + ")";
    ctx.font = "bold 10px Courier New";
    ctx.fillText("\u25B6", ex + 4, 200);
  }
}
