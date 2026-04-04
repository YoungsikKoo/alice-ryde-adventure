/* ================================================================
   Stage 2 - B2: Underground Parking Garage (Side-Scroll)
   Dodge moving cars, fight scorpions, defeat the GIANT SCORPION boss!

   Boss phases:
     100-70%  Normal attacks
      70-50%  Poison barrage mode
      50%     Splits into 4 clones (once only)
      <15%    Each clone flees in different directions
   Clones regen HP over time and grow bigger (but never split again)
   ================================================================ */

/* ---------- Poison Projectile ---------- */
class PoisonBolt extends Entity {
  constructor(game, cfg) {
    super(game, {
      x: cfg.x, y: cfg.y,
      width: 8, height: 8,
      speed: 0, color: "#50ff50",
      type: "enemy", tags: ["enemy"]
    });
    this.damage = cfg.damage || 8;
    this.dirX = cfg.dirX || 0;
    this.dirY = cfg.dirY || 0;
    this.flySpeed = cfg.flySpeed || 180;
    this.lifetime = 3;
    this.alive = true;
    this.hp = 1; this.maxHp = 1;
    this.atk = this.damage; this.def = 0;
    this.contactDamage = this.damage;
    this.showHP = false;
    this.name = "Poison";
    this.enemyType = "poison";
    this.expReward = 0;
    this._age = 0;
  }
  update(dt) {
    if (!this.alive) return;
    this.x += this.dirX * this.flySpeed * dt;
    this.y += this.dirY * this.flySpeed * dt;
    this._age += dt;
    this.lifetime -= dt;
    if (this.lifetime <= 0 || this.x < -20 || this.y < -20 || this.x > 5000 || this.y > 400) {
      this.alive = false; this.destroy();
    }
  }
  takeDamage() { this.alive = false; this.destroy(); }
  render(ctx, camera) {
    if (!this.alive) return;
    var sp = camera.worldToScreen(this.x, this.y);
    if (sp.x < -10 || sp.x > 500 || sp.y < -10 || sp.y > 340) return;
    var pulse = 0.6 + Math.sin(this._age * 12) * 0.4;
    ctx.fillStyle = "rgba(80,255,80," + pulse + ")";
    ctx.fillRect(sp.x, sp.y, 8, 8);
    ctx.fillStyle = "rgba(200,255,100,0.8)";
    ctx.fillRect(sp.x + 2, sp.y + 2, 4, 4);
  }
}

/* ---------- Moving Car Hazard ---------- */
class MovingCar {
  constructor(cfg) {
    this.x = cfg.x;
    this.y = cfg.y;
    this.w = cfg.w || 64;
    this.h = cfg.h || 28;
    this.speed = cfg.speed || 120;
    this.dir = cfg.dir || 1; /* 1=right, -1=left */
    this.color = cfg.color || "#cc3333";
    this.damage = cfg.damage || 15;
    this.worldWidth = cfg.worldWidth || 4200;
    this.honkTimer = 3 + Math.random() * 5;
    this._type = cfg.carType || "red";
  }
  update(dt) {
    this.x += this.speed * this.dir * dt;
    /* wrap around */
    if (this.dir > 0 && this.x > this.worldWidth + 100) this.x = -this.w - 50;
    if (this.dir < 0 && this.x < -this.w - 100) this.x = this.worldWidth + 50;
    this.honkTimer -= dt;
  }
  checkPlayerCollision(player) {
    if (player.invincible) return false;
    var px = player.x, py = player.y, pw = player.width, ph = player.height;
    if (px + pw > this.x && px < this.x + this.w &&
        py + ph > this.y && py < this.y + this.h) {
      return true;
    }
    return false;
  }
  render(ctx, camera) {
    var sx = this.x - camera.offsetX, sy = this.y - camera.offsetY;
    if (sx + this.w < -10 || sx > 500) return;
    var MT = window.MapTiles && MapTiles._inited;
    var tileKey = "parking_car_" + this._type;
    var tile = MT ? MapTiles.get(tileKey) : null;
    if (tile) {
      if (this.dir < 0) {
        ctx.save();
        ctx.translate(Math.floor(sx + this.w), 0);
        ctx.scale(-1, 1);
        ctx.drawImage(tile, 0, Math.floor(sy));
        ctx.restore();
      } else {
        ctx.drawImage(tile, Math.floor(sx), Math.floor(sy));
      }
    } else {
      /* fallback: simple car rectangle */
      ctx.fillStyle = this.color;
      ctx.fillRect(sx, sy + 6, this.w, this.h - 12);
      ctx.fillRect(sx + 8, sy, this.w - 16, this.h);
      /* wheels */
      ctx.fillStyle = "#222";
      ctx.fillRect(sx + 8, sy + this.h - 6, 10, 6);
      ctx.fillRect(sx + this.w - 18, sy + this.h - 6, 10, 6);
      /* window */
      ctx.fillStyle = "rgba(150,200,255,0.7)";
      ctx.fillRect(sx + 14, sy + 2, 16, 10);
    }
  }
}

/* ---------- Scorpion Enemy ---------- */
class Scorpion extends Enemy {
  constructor(g, c) {
    super(g, {
      ...c,
      enemyType: "scorpion",
      name: c.name || "Scorpion",
      hp: c.hp || 35,
      atk: c.atk || 12,
      def: c.def || 4,
      speed: c.speed || 1.8,
      color: "#c8a060",
      aggroRange: c.aggroRange || 100,
      ai: "chase",
      expReward: c.expReward || 8,
      width: c.width || 28,
      height: c.height || 24
    });
    this._poisonTimer = 2 + Math.random() * 3;
  }
  update(dt) {
    super.update(dt);
    if (!this.alive || !this.active) return;
    this._poisonTimer -= dt;
    if (this._poisonTimer <= 0) {
      this._poisonTimer = 3 + Math.random() * 2;
      var tgt = this._nearestPlayer();
      if (tgt && this.distanceTo(tgt) < this.aggroRange * 1.5) {
        var dx = tgt.x - this.x, dy = tgt.y - this.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var bolt = new PoisonBolt(this.game, {
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          dirX: dx / d, dirY: dy / d,
          flySpeed: 140, damage: 6
        });
        this.game.addEntity(bolt);
      }
    }
  }
}

/* ================================================================
   Stage2_B2 — B2 Parking Garage (side-scroll)
   ================================================================ */
class Stage2_B2 {
  constructor(onComplete) {
    this.game = null;
    this.onComplete = onComplete;
    this.complete = false;
    this.ss = null;
    this.enemies = [];
    this.cars = [];
    this.carSpawnTimer = 0;

    /* boss fields */
    this.boss = null;
    this.bossTriggered = false;
    this.bossDefeated = false;
    this.bossPoisonMode = false;
    this.bossSplit = false;
    this.bossClones = [];
    this.bossFleeing = false;
    this.bossPoisonBarrageTimer = 0;

    /* environment */
    this.flickerTimer = 0;
    this.flickerOn = true;
    this.ambientTimer = 0;

    /* concrete pillars for background */
    this.pillars = [];
    for (var i = 0; i < 60; i++) {
      this.pillars.push({ x: i * 140 + 80, y: 140 });
    }
  }

  async init(game) {
    this.game = game;
    this.ss = new SideScroll(game);
    this.ss.activate({
      groundY: 272,
      worldWidth: 4200,
      platforms: this._makePlatforms(),
      hazards: this._makeHazards()
    });
    game.tileMap = null;
    game.camera.setMapBounds(4200, 320);
    var p = game.localPlayer;
    p.x = 48; p.y = 240;
    p.svx = 0; p.svy = 0;
    game.camera.x = 0; game.camera.y = 0;
    game.camera.follow(p);
    game.hud.showStageName("Stage 2-B2: Top Ryde City - Underground Parking");
    game.hud.addChatMessage("Watch out for cars! Fight the scorpions!", "#f0d060");
    this._spawnEnemies();
    this._spawnItems();
    this._setupBoss();
    this._spawnInitialCars();
    setTimeout(function() {
      game.startDialogue([
        { speaker: "Alice", text: "B2 parking... it's SO dark down here." },
        { speaker: "Alice", text: "Are those... SCORPIONS?! In a car park?!" },
        { speaker: "Alice", text: "And the cars are still moving?! WATCH OUT!" }
      ], function() { if (game.sound) game.sound.playBGM("b2_parking"); });
    }, 500);
  }

  _makePlatforms() {
    return [
      /* ground level concrete sections with gaps */
      { x: 0, y: 272, w: 400, h: 48, color: "#c0c0d0", topColor: "#a0a0b8" },
      /* raised parking ledges */
      { x: 200, y: 240, w: 64, h: 8, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 450, y: 256, w: 120, h: 16, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 600, y: 240, w: 80, h: 8, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 750, y: 250, w: 100, h: 22, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 900, y: 235, w: 60, h: 8, color: "#c0c0d0", topColor: "#a0a0b8" },
      /* mid section - concrete barriers */
      { x: 1050, y: 256, w: 200, h: 16, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 1100, y: 228, w: 48, h: 8, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 1300, y: 248, w: 80, h: 24, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 1450, y: 235, w: 60, h: 8, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 1550, y: 256, w: 150, h: 16, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 1750, y: 245, w: 100, h: 27, color: "#c0c0d0", topColor: "#a0a0b8" },
      /* stairway section */
      { x: 1900, y: 256, w: 48, h: 16, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 1948, y: 244, w: 48, h: 16, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 1996, y: 232, w: 48, h: 16, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 2044, y: 220, w: 48, h: 16, color: "#c0c0d0", topColor: "#a0a0b8" },
      /* upper level */
      { x: 2092, y: 220, w: 400, h: 52, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 2500, y: 235, w: 60, h: 8, color: "#c0c0d0", topColor: "#a0a0b8" },
      /* descent */
      { x: 2600, y: 240, w: 48, h: 16, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 2648, y: 252, w: 48, h: 16, color: "#c0c0d0", topColor: "#a0a0b8" },
      /* lower section to boss */
      { x: 2700, y: 256, w: 300, h: 16, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 3050, y: 248, w: 80, h: 24, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 3200, y: 256, w: 200, h: 16, color: "#c0c0d0", topColor: "#a0a0b8" },
      { x: 3450, y: 240, w: 100, h: 32, color: "#c0c0d0", topColor: "#a0a0b8" },
      /* boss arena - wide flat area */
      { x: 3600, y: 256, w: 580, h: 64, color: "#c0c0d0", topColor: "#a0a0b8" }
    ];
  }

  _makeHazards() {
    return [
      { x: 420, y: 264, w: 30, h: 8, damage: 5, type: "puddle" },
      { x: 870, y: 264, w: 30, h: 8, damage: 5, type: "puddle" },
      { x: 1250, y: 264, w: 30, h: 8, damage: 6, type: "puddle" },
      { x: 2000, y: 264, w: 30, h: 8, damage: 6, type: "puddle" }
    ];
  }

  _spawnInitialCars() {
    var colors = ["red", "blue", "white"];
    var speeds = [100, 130, 160, 90, 110];
    var lanes = [248, 252, 260];
    /* Cars in different sections */
    var carSpawns = [
      { x: 100, dir: 1 }, { x: 500, dir: -1 }, { x: 900, dir: 1 },
      { x: 1200, dir: -1 }, { x: 1600, dir: 1 }, { x: 1900, dir: -1 },
      { x: 2000, dir: -1 }, { x: 2400, dir: 1 }, { x: 2800, dir: -1 },
      { x: 3100, dir: 1 }, { x: 3400, dir: -1 }
    ];
    for (var i = 0; i < carSpawns.length; i++) {
      var s = carSpawns[i];
      this.cars.push(new MovingCar({
        x: s.x,
        y: lanes[i % lanes.length],
        speed: speeds[i % speeds.length],
        dir: s.dir,
        color: ["#cc3333", "#3355cc", "#dddddd"][i % 3],
        carType: colors[i % 3],
        damage: 12 + Math.floor(Math.random() * 6),
        worldWidth: 4200
      }));
    }
  }

  _spawnEnemies() {
    var g = this.game;
    var spawns = [
      { x: 250, y: 240 }, { x: 480, y: 230 },
      { x: 700, y: 240 }, { x: 850, y: 210 },
      { x: 1080, y: 230 }, { x: 1200, y: 240 },
      { x: 1400, y: 225 }, { x: 1600, y: 230 },
      { x: 1800, y: 220 }, { x: 1950, y: 225 },
      { x: 2100, y: 190 }, { x: 2300, y: 190 },
      { x: 2500, y: 210 }, { x: 2650, y: 220 },
      { x: 2750, y: 230 }, { x: 2900, y: 230 },
      { x: 3100, y: 220 }, { x: 3250, y: 230 },
      { x: 3400, y: 215 }, { x: 3500, y: 230 }
    ];
    for (var i = 0; i < spawns.length; i++) {
      var s = spawns[i];
      var e = new Scorpion(g, { x: s.x, y: s.y });
      e.sideScrollMode = true;
      e.svy = 0;
      this.enemies.push(e);
      g.addEntity(e);
    }
    /* A few cockroaches too */
    var roaches = [
      { x: 350, y: 256 }, { x: 950, y: 256 }, { x: 1500, y: 256 },
      { x: 2150, y: 200 }, { x: 2700, y: 240 }, { x: 3000, y: 240 }
    ];
    for (var j = 0; j < roaches.length; j++) {
      var r = roaches[j];
      var cr = new Cockroach(g, { x: r.x, y: r.y });
      cr.sideScrollMode = true;
      cr.svy = 0;
      this.enemies.push(cr);
      g.addEntity(cr);
    }
  }

  _spawnItems() {
    var g = this.game;
    var items = [
      { x: 220, y: 210, item: { name: "Lost Chips", type: "consumable", heal: 10, color: "#c8a060", pickupMessage: "Chips from a car!" } },
      { x: 620, y: 210, item: { name: "Energy Drink", type: "consumable", heal: 15, color: "#50c878", pickupMessage: "Energy drink! BUZZZ!" } },
      { x: 1120, y: 200, item: { name: "Bubble Tea", type: "consumable", heal: 18, color: "#dda0dd", pickupMessage: "Taro bubble tea!" } },
      { x: 1550, y: 215, item: { name: "Meat Pie", type: "consumable", heal: 20, color: "#8b4513", pickupMessage: "Meat pie from the boot!" } },
      { x: 2200, y: 185, item: { name: "Tim Tam Pack", type: "consumable", heal: 22, color: "#4a2810", pickupMessage: "Tim Tams! Score!" } },
      { x: 2900, y: 200, item: { name: "Flat White", type: "consumable", heal: 25, color: "#d2b48c", pickupMessage: "Still warm flat white!" } },
      { x: 3350, y: 200, item: { name: "Golden Gaytime", type: "consumable", heal: 30, color: "#f0d060", pickupMessage: "Golden Gaytime!! YES!" } },
      { x: 760, y: 218, item: { name: "Car Antenna", type: "weapon", equipSlot: "weapon", atk: 10, color: "#aaa", pickupMessage: "Car antenna whip!" } },
      { x: 1750, y: 210, item: { name: "Hubcap Shield", type: "armor", equipSlot: "armor", def: 7, color: "#c0c0c0", pickupMessage: "Hubcap shield! Shiny!" } },
      { x: 3050, y: 215, item: { name: "Jumper Cables", type: "weapon", equipSlot: "weapon", atk: 16, color: "#cc2200", pickupMessage: "Jumper cables! ZAP!" } }
    ];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var d = new ItemDrop(g, { x: it.x, y: it.y, itemData: it.item });
      d.lifetime = 99999;
      g.addEntity(d);
    }
  }

  /* ===================== BOSS: GIANT SCORPION ===================== */
  _setupBoss() {
    this.boss = new Enemy(this.game, {
      x: 3850, y: 200,
      enemyType: "giantScorpion",
      name: "GIANT SCORPION",
      hp: 400,
      atk: 22,
      def: 8,
      speed: 1.6,
      color: "#8b0000",
      aggroRange: 200,
      ai: "chase",
      expReward: 60,
      width: 56,
      height: 48,
      lootTable: [
        { item: { name: "Scorpion Tail Whip", type: "weapon", equipSlot: "weapon", atk: 20, color: "#8b0000", pickupMessage: "Scorpion Tail Whip! Deadly!" }, chance: 1 },
        { item: { name: "Venom Shield", type: "armor", equipSlot: "armor", def: 14, color: "#50ff50", pickupMessage: "Venom-coated shield!" }, chance: 1 },
        { item: { name: "Antivenom Pack", type: "consumable", heal: 80, color: "#50c878", pickupMessage: "Full antivenom pack!" }, chance: 1 }
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
    this._updateCars(dt);
    this._checkCarCollisions();
    this._updateFlicker(dt);
    this._checkBossTrigger();
    this._updateBoss(dt);
    this._updateBossClones(dt);
    this._checkBossDefeated();
    this._checkExit();
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

  _updateCars(dt) {
    this.carSpawnTimer -= dt;
    for (var i = 0; i < this.cars.length; i++) {
      var car = this.cars[i];
      car.update(dt);
      /* honk near player */
      if (car.honkTimer <= 0) {
        car.honkTimer = 4 + Math.random() * 6;
        var p = this.game.localPlayer;
        if (Math.abs(car.x - p.x) < 200) {
          this.game.hud.addChatMessage("HONK HONK!", "#f44");
          try {
            var s = this.game.sound;
            if (s && s.ctx && !s.muted) {
              var t = s.ctx.currentTime;
              var o = s.ctx.createOscillator(), g = s.ctx.createGain();
              o.type = "square";
              o.frequency.setValueAtTime(300, t);
              o.frequency.setValueAtTime(250, t + 0.15);
              g.gain.setValueAtTime(0.15, t);
              g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
              o.connect(g); g.connect(s.sfxGain);
              o.start(t); o.stop(t + 0.3);
            }
          } catch (e) {}
        }
      }
    }
  }

  _checkCarCollisions() {
    var p = this.game.localPlayer;
    if (!p.alive || p.invincible) return;
    for (var i = 0; i < this.cars.length; i++) {
      var car = this.cars[i];
      if (car.checkPlayerCollision(p)) {
        p.takeDamage(car.damage, { x: car.x, y: car.y });
        p.svy = this.ss.jumpForce * 0.7;
        p.svx = car.dir * 120;
        this.game.camera.shake(6, 0.4);
        this.game.hud.addChatMessage("HIT BY A CAR! Ouch!!", "#f44");
        this.game.combat.spawnDamageNumber(p.x + 16, p.y - 16, "CRASH!", "#f44");
        break;
      }
    }
  }

  _updateFlicker(dt) {
    this.flickerTimer -= dt;
    if (this.flickerTimer <= 0) {
      this.flickerTimer = 0.8 + Math.random() * 2;
      this.flickerOn = Math.random() > 0.15;
    }
  }

  /* ===================== BOSS MECHANICS ===================== */
  _checkBossTrigger() {
    if (this.bossTriggered || this.bossDefeated) return;
    if (this.game.localPlayer.x > 3700) {
      this.bossTriggered = true;
      this.boss.active = true;
      this.boss.visible = true;
      this.game.camera.shake(8, 0.8);
      this.game.hud.setBoss(this.boss, "GIANT SCORPION");
      this.game.hud.addChatMessage("BOSS! GIANT SCORPION!", "#f44");
      if (this.game.sound) this.game.sound.playBossAppear();
      this.game.startDialogue([
        { speaker: "???", text: "CLICK CLICK CLICK..." },
        { speaker: "GIANT SCORPION", text: "HSSSSS! THIS GARAGE IS MY NEST!" },
        { speaker: "Alice", text: "A GIANT SCORPION?! In a PARKING GARAGE?!" },
        { speaker: "Alice", text: "This is Australia... I shouldn't be surprised." }
      ]);
    }
  }

  _updateBoss(dt) {
    if (!this.bossTriggered || this.bossDefeated || !this.boss || !this.boss.alive) return;
    var hpRatio = this.boss.hp / this.boss.maxHp;

    /* Phase 2: Poison barrage at 70% HP */
    if (!this.bossPoisonMode && hpRatio <= 0.7) {
      this.bossPoisonMode = true;
      this.game.camera.shake(5, 0.5);
      this.game.hud.addChatMessage("SCORPION enters POISON MODE!", "#50ff50");
      this.game.startDialogue([
        { speaker: "GIANT SCORPION", text: "TASTE MY VENOM!" },
        { speaker: "Alice", text: "It's shooting POISON everywhere!!" }
      ]);
    }

    /* Shoot poison barrage */
    if (this.bossPoisonMode && !this.bossSplit) {
      this.bossPoisonBarrageTimer -= dt;
      if (this.bossPoisonBarrageTimer <= 0) {
        this.bossPoisonBarrageTimer = 0.4 + Math.random() * 0.3;
        this._bossShootPoison(this.boss);
      }
    }

    /* Phase 3: Split at 50% HP */
    if (!this.bossSplit && hpRatio <= 0.5) {
      this._bossSplitIntoFour();
    }
  }

  _bossShootPoison(source) {
    var p = this.game.localPlayer;
    var cx = source.x + source.width / 2, cy = source.y + source.height / 2;
    /* shoot toward player + random spread */
    var count = 3 + Math.floor(Math.random() * 3);
    for (var i = 0; i < count; i++) {
      var dx = p.x - cx + (Math.random() - 0.5) * 150;
      var dy = p.y - cy + (Math.random() - 0.5) * 100;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var bolt = new PoisonBolt(this.game, {
        x: cx, y: cy,
        dirX: dx / d, dirY: dy / d,
        flySpeed: 120 + Math.random() * 80,
        damage: 7 + Math.floor(Math.random() * 4)
      });
      this.game.addEntity(bolt);
    }
  }

  _bossSplitIntoFour() {
    this.bossSplit = true;
    this.game.camera.shake(10, 1.0);
    this.game.hud.addChatMessage("SCORPION SPLITS INTO 4!!", "#f44");
    this.game.startDialogue([
      { speaker: "GIANT SCORPION", text: "YOU CANNOT DEFEAT US ALL!" },
      { speaker: "Alice", text: "IT SPLIT INTO FOUR?! NO WAY!!" }
    ]);

    /* play split SFX */
    try {
      var s = this.game.sound;
      if (s && s.ctx && !s.muted) {
        var t = s.ctx.currentTime;
        [200, 300, 500, 800, 1200, 1600].forEach(function(f, i) {
          var o = s.ctx.createOscillator(), g = s.ctx.createGain();
          o.type = "sawtooth"; o.frequency.value = f;
          g.gain.setValueAtTime(0.25, t + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.1);
          o.connect(g); g.connect(s.sfxGain);
          o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.1);
        });
      }
    } catch (e) {}

    /* Make the original boss smaller and weaker */
    this.boss.hp = Math.floor(this.boss.maxHp * 0.15);
    this.boss.width = 36;
    this.boss.height = 32;
    this.boss.speed = 2.2;
    this.boss.atk = 15;

    /* Spawn 3 clones (boss is the 4th) */
    var offsets = [
      { x: -80, y: -20 },
      { x: 80, y: -20 },
      { x: 0, y: -50 }
    ];
    var names = ["SCORPION ALPHA", "SCORPION BETA", "SCORPION GAMMA"];
    for (var i = 0; i < 3; i++) {
      var clone = new Enemy(this.game, {
        x: this.boss.x + offsets[i].x,
        y: this.boss.y + offsets[i].y,
        enemyType: "giantScorpion",
        name: names[i],
        hp: Math.floor(this.boss.maxHp * 0.15),
        atk: 15,
        def: 5,
        speed: 2.0 + Math.random() * 0.5,
        color: "#6b0000",
        aggroRange: 180,
        ai: "chase",
        expReward: 15,
        width: 36,
        height: 32
      });
      clone.isBoss = false;
      clone.sideScrollMode = true;
      clone.svy = 0;
      clone._isScorpionClone = true;
      clone._cloneAge = 0;
      clone._regenTimer = 0;
      clone._hasFled = false;
      clone._splitOnce = true; /* prevent re-splitting */
      clone._poisonTimer = 1 + Math.random() * 2;
      clone._fleeDir = (i === 0) ? -1 : (i === 1) ? 1 : (Math.random() > 0.5 ? 1 : -1);
      clone._origWidth = 36;
      clone._origHeight = 32;
      this.bossClones.push(clone);
      this.enemies.push(clone);
      this.game.addEntity(clone);
    }
    /* Mark original boss as a clone too for flee/regen */
    this.boss._isScorpionClone = true;
    this.boss._cloneAge = 0;
    this.boss._regenTimer = 0;
    this.boss._hasFled = false;
    this.boss._splitOnce = true;
    this.boss._poisonTimer = 1 + Math.random() * 2;
    this.boss._fleeDir = -1;
    this.boss._origWidth = 36;
    this.boss._origHeight = 32;
    this.bossClones.push(this.boss);
  }

  _updateBossClones(dt) {
    if (!this.bossSplit || this.bossDefeated) return;
    var allUnits = this.bossClones;
    var anyAlive = false;

    for (var i = 0; i < allUnits.length; i++) {
      var c = allUnits[i];
      if (!c.alive || !c.active) continue;
      anyAlive = true;
      c._cloneAge = (c._cloneAge || 0) + dt;

      /* Regen HP over time and grow bigger */
      c._regenTimer = (c._regenTimer || 0) + dt;
      if (c._regenTimer >= 2) {
        c._regenTimer = 0;
        var regenAmt = Math.floor(c.maxHp * 0.03);
        c.hp = Math.min(c.hp + regenAmt, c.maxHp);
        /* grow bigger over time (max 1.5x original) */
        var growFactor = Math.min(1.5, 1 + c._cloneAge * 0.02);
        c.width = Math.floor((c._origWidth || 36) * growFactor);
        c.height = Math.floor((c._origHeight || 32) * growFactor);
        /* increase atk slightly with growth */
        if (c._cloneAge > 5) {
          c.atk = Math.min(22, 15 + Math.floor(c._cloneAge * 0.3));
        }
      }

      /* Poison attacks from clones */
      c._poisonTimer = (c._poisonTimer || 0) - dt;
      if (c._poisonTimer <= 0) {
        c._poisonTimer = 1.5 + Math.random() * 1.5;
        var p = this.game.localPlayer;
        var dx = p.x - c.x, dy = p.y - c.y;
        var dd = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dd < 250) {
          var bolt = new PoisonBolt(this.game, {
            x: c.x + c.width / 2, y: c.y + c.height / 2,
            dirX: dx / dd + (Math.random() - 0.5) * 0.3,
            dirY: dy / dd + (Math.random() - 0.5) * 0.3,
            flySpeed: 130 + Math.random() * 50,
            damage: 6
          });
          this.game.addEntity(bolt);
        }
      }

      /* Phase 4: Flee at 15% HP */
      var cloneHpRatio = c.hp / c.maxHp;
      if (cloneHpRatio <= 0.15 && !c._hasFled) {
        c._hasFled = true;
        c.ai = "flee";
        c.speed = 3.5;
        c.aggroRange = 0;
        this.game.hud.addChatMessage(c.name + " is fleeing!", "#f0d060");
      }

      /* Flee behavior */
      if (c._hasFled && c.alive) {
        var fleeDir = c._fleeDir || 1;
        c.x += fleeDir * c.speed * 60 * dt;
        c.direction = fleeDir > 0 ? "right" : "left";
        /* Clones that flee off screen die */
        if (c.x < -100 || c.x > this.ss.worldWidth + 100) {
          c.alive = false;
          c.hp = 0;
        }
      }
    }
  }

  _checkBossDefeated() {
    if (!this.bossTriggered || this.bossDefeated) return;

    if (this.bossSplit) {
      /* All clones must be dead */
      var allDead = true;
      for (var i = 0; i < this.bossClones.length; i++) {
        if (this.bossClones[i].alive && this.bossClones[i].hp > 0) {
          allDead = false;
          break;
        }
      }
      if (allDead) {
        this._onBossDefeated();
      }
    } else {
      if (!this.boss.alive || this.boss.hp <= 0) {
        this._onBossDefeated();
      }
    }
  }

  _onBossDefeated() {
    this.bossDefeated = true;
    this.complete = true;
    this.game.hud.clearBoss();
    this.game.hud.addChatMessage("Giant Scorpion defeated! Exit ahead!", "#50c878");
    this.game.startDialogue([
      { speaker: "Alice", text: "Finally! That was TERRIFYING!" },
      { speaker: "Alice", text: "I need to get out of this parking garage!" },
      { speaker: "Alice", text: "Stairs to B1 should be ahead!" }
    ], function() {
      if (this.game.transition) this.game.transition.startFade(function() { if (this.onComplete) this.onComplete(); }.bind(this));
      else if (this.onComplete) this.onComplete();
    }.bind(this));
  }

  _checkExit() {
  }

  _updateAmbient(dt) {
    this.ambientTimer += dt;
    if (this.ambientTimer > 20) {
      this.ambientTimer = 0;
      var msgs = [
        "Drip... drip... from the ceiling.",
        "A car alarm echoes in the distance.",
        "The lights flicker ominously.",
        "Was that... scuttling?",
        "Someone left their headlights on.",
        "The concrete walls feel like they're closing in.",
        "A rat scurries past! Oh wait, that's a scorpion.",
        "PARKING: $4/hr. Not worth it."
      ];
      this.game.hud.addChatMessage(msgs[Math.floor(Math.random() * msgs.length)], "#888");
    }
  }

  /* ===================== RENDER ===================== */
  render(ctx, camera) {
    if (!this.ss) return;
    this._renderBG(ctx, camera);
    this._renderConcreteGround(ctx, camera);
    this.ss.render(ctx, camera);
    /* override grass with concrete */
    this._renderConcreteGroundOverlay(ctx, camera);
    this._renderPillars(ctx, camera);
    this._renderParkingLines(ctx, camera);
    this._renderCars(ctx, camera);
    this._renderLights(ctx, camera);
    this._renderHazards(ctx, camera);
    if (this.bossDefeated) this._renderExit(ctx, camera);
    /* dark overlay for underground feel */
    if (!this.flickerOn) {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(0, 0, 480, 320);
    }
  }

  _renderConcreteGround(ctx, camera) {
    /* Draw nothing here - just a placeholder. The actual override is in overlay */
  }

  _renderConcreteGroundOverlay(ctx, camera) {
    /* Override the SideScroll green ground with concrete */
    var ox = camera.offsetX, oy = camera.offsetY;
    var gy = 272 - oy;
    ctx.fillStyle = "#555";
    ctx.fillRect(0, gy, 480, 320 - gy + 48);
    ctx.fillStyle = "#666";
    ctx.fillRect(0, gy, 480, 3);
    ctx.fillStyle = "#4a4a4a";
    ctx.fillRect(0, gy + 3, 480, 1);
  }

  _renderBG(ctx, camera) {
    /* Dark concrete ceiling/background */
    if (window.MapTiles && MapTiles._inited && MapTiles.drawParkingBG) {
      MapTiles.drawParkingBG(ctx, 480, 320);
    } else {
      var grad = ctx.createLinearGradient(0, 0, 0, 320);
      grad.addColorStop(0, "#2a2a2a");
      grad.addColorStop(0.3, "#3a3a3a");
      grad.addColorStop(0.7, "#333333");
      grad.addColorStop(1, "#2a2a2a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 480, 320);
    }
    /* concrete wall texture strips */
    var ox = camera.offsetX;
    ctx.fillStyle = "#444";
    for (var x = 0; x < 4200; x += 64) {
      var sx = x - ox;
      if (sx < -10 || sx > 490) continue;
      ctx.fillRect(sx, 0, 2, 140);
    }
    /* ceiling pipes */
    ctx.fillStyle = "#555";
    ctx.fillRect(0, 20, 480, 3);
    ctx.fillRect(0, 50, 480, 2);
    ctx.fillStyle = "#4a4a4a";
    ctx.fillRect(0, 70, 480, 2);
  }

  _renderPillars(ctx, camera) {
    var ox = camera.offsetX, oy = camera.offsetY;
    var MT = window.MapTiles && MapTiles._inited;
    var pillarTile = MT ? MapTiles.get("parking_pillar") : null;
    for (var i = 0; i < this.pillars.length; i++) {
      var p = this.pillars[i];
      var sx = p.x - ox;
      if (sx < -20 || sx > 500) continue;
      if (pillarTile) {
        ctx.drawImage(pillarTile, Math.floor(sx), p.y - oy);
      } else {
        /* fallback concrete pillar */
        ctx.fillStyle = "#666";
        ctx.fillRect(sx, p.y - oy, 16, 132);
        ctx.fillStyle = "#777";
        ctx.fillRect(sx + 2, p.y - oy, 12, 132);
        ctx.fillStyle = "#555";
        ctx.fillRect(sx, p.y - oy, 16, 3);
        ctx.fillRect(sx, p.y - oy + 129, 16, 3);
      }
    }
  }

  _renderParkingLines(ctx, camera) {
    var ox = camera.offsetX, oy = camera.offsetY;
    ctx.fillStyle = "#cccc00";
    for (var x = 60; x < 4200; x += 80) {
      var sx = x - ox;
      if (sx < -20 || sx > 500) continue;
      /* yellow parking lines on ground */
      ctx.fillRect(sx, 272 - oy - 1, 40, 2);
    }
    /* parking space numbers */
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "6px Courier New";
    ctx.textAlign = "center";
    for (var n = 1; n <= 50; n++) {
      var nx = n * 80 - ox;
      if (nx < -20 || nx > 500) continue;
      ctx.fillText("B2-" + n, nx + 20, 272 - oy + 10);
    }
  }

  _renderCars(ctx, camera) {
    for (var i = 0; i < this.cars.length; i++) {
      this.cars[i].render(ctx, camera);
    }
  }

  _renderLights(ctx, camera) {
    var ox = camera.offsetX;
    var MT = window.MapTiles && MapTiles._inited;
    var lightTile = MT ? MapTiles.get("parking_light") : null;
    for (var x = 100; x < 4200; x += 200) {
      var sx = x - ox;
      if (sx < -40 || sx > 520) continue;
      if (lightTile && this.flickerOn) {
        ctx.drawImage(lightTile, Math.floor(sx), 85);
      } else {
        /* fluorescent light */
        ctx.fillStyle = this.flickerOn ? "#ddeeff" : "#334";
        ctx.fillRect(sx, 85, 32, 4);
        if (this.flickerOn) {
          ctx.fillStyle = "rgba(200,220,255,0.15)";
          ctx.fillRect(sx - 8, 85, 48, 185);
        }
      }
    }
  }

  _renderHazards(ctx, camera) {
    var ox = camera.offsetX, oy = camera.offsetY;
    for (var i = 0; i < this.ss.hazards.length; i++) {
      var h = this.ss.hazards[i];
      var sx = h.x - ox, sy = h.y - oy;
      if (sx + h.w < 0 || sx > 480) continue;
      /* oil puddles */
      ctx.fillStyle = "rgba(40,40,60,0.7)";
      ctx.fillRect(sx, sy, h.w, h.h);
      ctx.fillStyle = "rgba(80,80,120,0.4)";
      ctx.fillRect(sx + 2, sy + 1, h.w - 4, h.h - 2);
    }
  }

  _renderExit(ctx, camera) {
    var ex = 4170 - camera.offsetX;
    if (ex < -10 || ex > 500) return;
    var pulse = 0.6 + Math.sin(Date.now() * 0.004) * 0.4;
    ctx.fillStyle = "rgba(80,200,120," + pulse + ")";
    ctx.fillRect(ex, 100, 6, 172);
    ctx.fillStyle = "#50c878";
    ctx.font = "8px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("STAIRS", ex + 3, 90);
    ctx.fillText("TO B1 ->", ex + 3, 280);
  }
}
