const WebSocket = require("ws");
const Redis = require("ioredis");

const wss = new WebSocket.Server({ port: 6000 });
const sub = new Redis();

sub.subscribe("score-updates");

wss.on("connection", (ws) => {
  console.log("🔌 Client connected");

  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });
});

// 💓 Heartbeat
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log("❌ Killing dead client");
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

sub.on("message", (channel, message) => {

  console.log("📡 Redis received:", message);

  let clientCount = 0;

  wss.clients.forEach(client => {
    clientCount++;

    console.log("➡️ Client state:", client.readyState);

    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      console.log("✅ Sent to client");
    }
  });

  console.log("👥 Total clients:", clientCount);
  const data = JSON.parse(message);

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
});