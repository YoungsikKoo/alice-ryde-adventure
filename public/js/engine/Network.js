class Network {
  constructor(game) {
    this.game = game;
    this.ws = null;
    this.myId = null;
    this.isHost = false;
    this.connected = false;
    this.sendInterval = null;
    this.remotePlayers = new Map(); // networkId -> Player instance
  }

  connect() {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    this.ws = new WebSocket(proto + "//" + location.host);
    this.ws.onopen = () => { this.connected = true; };
    this.ws.onclose = () => {
      this.connected = false;
      this._cleanup();
      console.log("Disconnected from server");
    };
    this.ws.onerror = () => { console.log("WebSocket error"); };
    this.ws.onmessage = (e) => {
      try { this._onMessage(JSON.parse(e.data)); } catch (err) { console.error("Net msg error:", err); }
    };
  }

  _onMessage(msg) {
    switch (msg.type) {
      case "welcome": this._onWelcome(msg); break;
      case "join": this._onJoin(msg); break;
      case "leave": this._onLeave(msg); break;
      case "state": this._onState(msg); break;
      case "stage": this._onStage(msg); break;
      case "chat": this._onChat(msg); break;
      case "hostChange": this._onHostChange(msg); break;
    }
  }

  _onWelcome(msg) {
    this.myId = msg.id;
    this.isHost = msg.isHost;
    this.game.isHost = msg.isHost;
    console.log("Connected as " + msg.id + (msg.isHost ? " [HOST]" : " [GUEST]"));
    // Create remote players for those already connected
    for (const p of msg.players) {
      this._createRemotePlayer(p);
    }
    // If guest and host has a stage, we'll get a stage sync via the state updates
    if (!msg.isHost && msg.currentStage) {
      this._loadStageByName(msg.currentStage);
    }
  }

  _onJoin(msg) {
    this._createRemotePlayer(msg.player);
    if (this.game.hud) {
      this.game.hud.addChatMessage(msg.player.name + " joined!", "#88ff88");
    }
  }

  _onLeave(msg) {
    this._removeRemotePlayer(msg.id);
    if (this.game.hud) {
      this.game.hud.addChatMessage("A player left", "#ff8888");
    }
  }

  _onState(msg) {
    for (const data of msg.players) {
      if (data.id === this.myId) continue;
      let p = this.remotePlayers.get(data.id);
      if (!p) continue;
      p._remoteMoving = (data.x !== p.x || data.y !== p.y);
      p.x = data.x;
      p.y = data.y;
      p.direction = data.direction;
      p.attacking = data.attacking;
      p.hp = data.hp;
      p.maxHp = data.maxHp;
      p.level = data.level;
      p.invincible = data.invincible;
      p.alive = data.alive;
      p.alpha = data.alive ? (data.invincible ? 0.5 : 1) : 0.4;
      p.sideScrollMode = data.sideScrollMode || false;
    }
  }

  _onStage(msg) {
    if (this.isHost) return; // Host controls stages, doesn't receive
    console.log("Host changed stage to: " + msg.stage);
    this._loadStageByName(msg.stage);
  }

  _onChat(msg) {
    if (this.game.hud) {
      this.game.hud.addChatMessage(msg.name + ": " + msg.text, "#fff");
    }
  }

  _onHostChange(msg) {
    if (msg.isHost) {
      this.isHost = true;
      this.game.isHost = true;
      if (this.game.hud) {
        this.game.hud.addChatMessage("You are now the HOST!", "#f0d060");
      }
      console.log("Promoted to HOST");
    }
  }

  sendJoin(name, spriteType, attackStyle, stats) {
    if (!this.connected) return;
    this.ws.send(JSON.stringify({
      type: "join", name, spriteType, attackStyle, stats
    }));
  }

  startSending() {
    if (this.sendInterval) clearInterval(this.sendInterval);
    this.sendInterval = setInterval(() => this._sendState(), 66);
  }

  _sendState() {
    if (!this.connected || !this.game.localPlayer) return;
    const p = this.game.localPlayer;
    this.ws.send(JSON.stringify({
      type: "state",
      x: Math.round(p.x),
      y: Math.round(p.y),
      direction: p.direction,
      attacking: p.attacking,
      hp: p.hp,
      maxHp: p.maxHp,
      level: p.level,
      invincible: p.invincible,
      alive: p.alive,
      stage: this.game._currentStageName || "main",
      sideScrollMode: p.sideScrollMode || false
    }));
  }

  sendStageChange(stageName) {
    if (!this.connected || !this.isHost) return;
    this.ws.send(JSON.stringify({ type: "stage", stage: stageName }));
  }

  sendChat(text) {
    if (!this.connected) return;
    this.ws.send(JSON.stringify({ type: "chat", text }));
  }

  _createRemotePlayer(data) {
    if (this.remotePlayers.has(data.id)) return;
    const p = new Player(this.game, {
      x: data.x || 240,
      y: data.y || 160,
      name: data.name || "Player"
    });
    p.isLocal = false;
    p.networkId = data.id;
    p._spriteType = data.spriteType || "alice";
    p._attackStyle = data.attackStyle || "punch";
    if (data.hp) p.hp = data.hp;
    if (data.maxHp) { p.maxHp = data.maxHp; p.hp = data.hp || data.maxHp; }
    if (data.level) p.level = data.level;
    this.game.players.push(p);
    this.game.entities.push(p);
    this.remotePlayers.set(data.id, p);
    console.log("Remote player created: " + data.name);
    return p;
  }

  _removeRemotePlayer(id) {
    const p = this.remotePlayers.get(id);
    if (!p) return;
    p.destroyed = true;
    const pi = this.game.players.indexOf(p);
    if (pi >= 0) this.game.players.splice(pi, 1);
    this.remotePlayers.delete(id);
  }

  _cleanup() {
    for (const [id] of this.remotePlayers) {
      this._removeRemotePlayer(id);
    }
    if (this.sendInterval) {
      clearInterval(this.sendInterval);
      this.sendInterval = null;
    }
  }

  _loadStageByName(stageName) {
    const game = this.game;
    if (!stageName) return;
    if (game.sound) game.sound.stopBGM();
    game.tileMap = null;
    const p = game.localPlayer;
    p.sideScrollMode = false;
    p.vx = 0; p.vy = 0;
    if (p.svy !== undefined) p.svy = 0;
    game.entities = game.entities.filter(e => e instanceof Player);
    game.state = "playing";

    // Parse stage name like "s1_sub1", "s2_b2", "s2_1f", "s3"
    if (stageName.startsWith("s1_")) {
      const sub = stageName.replace("s1_", "");
      const s = new Stage1();
      s.game = game;
      game.currentStage = s;
      s._loadSub(game, sub);
    } else if (stageName.startsWith("s2_")) {
      const floor = stageName.replace("s2_", "");
      const s = new Stage2();
      s.game = game;
      game.currentStage = s;
      s._loadSub(game, floor);
    } else if (stageName === "s3") {
      game.loadStage(new Stage3());
    } else {
      // fallback: load Stage1
      game.loadStage(new Stage1());
    }
    game._currentStageName = stageName;
  }
}
