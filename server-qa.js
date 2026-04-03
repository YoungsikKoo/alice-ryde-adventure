const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");

const PORT = 8000;
const PUB = path.join(__dirname, "public");
const MIME = {
  ".html": "text/html;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".js": "application/javascript;charset=utf-8",
  ".json": "application/json;charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav"
};

/* ========== HTTP Static Server ========== */
const server = http.createServer((req, res) => {
  let url = req.url.split("?")[0];
  if (url === "/") url = "/index.html";
  const filePath = path.join(PUB, url);
  if (!filePath.startsWith(PUB)) { res.writeHead(403); res.end(); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    res.end(data);
  });
});

/* ========== WebSocket Multiplayer Server ========== */
const wss = new WebSocketServer({ server });
const players = new Map(); // id -> { id, ws, joined, name, spriteType, attackStyle, x, y, direction, attacking, hp, maxHp, level, invincible, alive, stage }
let nextId = 1;
let hostId = null;
let currentStage = null; // tracks host's current stage

function broadcast(msg, excludeId) {
  const data = JSON.stringify(msg);
  for (const [id, p] of players) {
    if (id !== excludeId && p.ws.readyState === 1) {
      p.ws.send(data);
    }
  }
}

function getPlayerList(excludeId) {
  const list = [];
  for (const [id, p] of players) {
    if (p.joined && id !== excludeId) {
      const { ws, ...rest } = p;
      list.push(rest);
    }
  }
  return list;
}

wss.on("connection", (ws) => {
  const id = "p" + (nextId++);
  players.set(id, { id, ws, joined: false, x: 0, y: 0, direction: "down", attacking: false, hp: 100, maxHp: 100, level: 1, invincible: false, alive: true, stage: null });

  // First player becomes host
  const isHost = (hostId === null);
  if (isHost) hostId = id;

  ws.send(JSON.stringify({
    type: "welcome",
    id: id,
    isHost: isHost,
    players: getPlayerList(id),
    currentStage: currentStage
  }));

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }
    const player = players.get(id);
    if (!player) return;

    if (msg.type === "join") {
      player.joined = true;
      player.name = msg.name;
      player.spriteType = msg.spriteType;
      player.attackStyle = msg.attackStyle;
      player.hp = msg.stats.hp;
      player.maxHp = msg.stats.hp;
      player.atk = msg.stats.atk;
      player.def = msg.stats.def;
      player.speed = msg.stats.speed;
      const { ws: _, ...info } = player;
      broadcast({ type: "join", player: info }, id);
      console.log("[+] " + player.name + " joined (" + id + ")" + (isHost ? " [HOST]" : ""));
    }

    if (msg.type === "state") {
      player.x = msg.x;
      player.y = msg.y;
      player.direction = msg.direction;
      player.attacking = msg.attacking;
      player.hp = msg.hp;
      player.maxHp = msg.maxHp;
      player.level = msg.level;
      player.invincible = msg.invincible;
      player.alive = msg.alive;
      player.stage = msg.stage;
      if (msg.sideScrollMode !== undefined) player.sideScrollMode = msg.sideScrollMode;
    }

    if (msg.type === "stage" && id === hostId) {
      currentStage = msg.stage;
      console.log("[STAGE] Host changed to: " + msg.stage);
      broadcast({ type: "stage", stage: msg.stage }, id);
    }

    if (msg.type === "bossDamage") {
      // Forward boss damage to all other players so they can sync boss HP
      broadcast({ type: "bossDamage", amount: msg.amount, isCrit: msg.isCrit, attackerId: id }, id);
    }

    if (msg.type === "bossState") {
      // Host broadcasts boss HP state to all
      broadcast({ type: "bossState", hp: msg.hp, maxHp: msg.maxHp, alive: msg.alive, x: msg.x, y: msg.y }, id);
    }

    if (msg.type === "chat") {
      broadcast({ type: "chat", id: id, name: player.name, text: msg.text });
    }
  });

  ws.on("close", () => {
    const player = players.get(id);
    const name = player ? player.name : id;
    players.delete(id);
    broadcast({ type: "leave", id: id });
    console.log("[-] " + name + " left (" + id + ")");

    // If host left, assign new host
    if (id === hostId) {
      hostId = null;
      for (const [pid, p] of players) {
        if (p.joined) {
          hostId = pid;
          p.ws.send(JSON.stringify({ type: "hostChange", isHost: true }));
          console.log("[HOST] New host: " + p.name + " (" + pid + ")");
          break;
        }
      }
    }
  });
});

// Broadcast all player states at 15 Hz
setInterval(() => {
  const states = [];
  for (const [id, p] of players) {
    if (!p.joined) continue;
    states.push({
      id: p.id, x: p.x, y: p.y, direction: p.direction,
      attacking: p.attacking, hp: p.hp, maxHp: p.maxHp,
      level: p.level, invincible: p.invincible, alive: p.alive,
      stage: p.stage, sideScrollMode: p.sideScrollMode || false
    });
  }
  if (states.length > 0) {
    const msg = JSON.stringify({ type: "state", players: states });
    for (const [id, p] of players) {
      if (p.ws.readyState === 1) p.ws.send(msg);
    }
  }
}, 66);

server.listen(PORT, () => {
  console.log("=== Alice Ryde Adventure Multiplayer Server ===");
  console.log("Game running on http://localhost:" + PORT);
  console.log("Waiting for players...");
});
