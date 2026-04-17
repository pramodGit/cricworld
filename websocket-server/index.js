const WebSocket = require("ws");
const Redis = require("ioredis");

const wss = new WebSocket.Server({ port: 6000 });
const sub = new Redis();

sub.subscribe("score-updates");

wss.on("connection", (ws) => {
  console.log("🔌 Client connected");
});

sub.on("message", (channel, message) => {
  const data = JSON.parse(message);

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
});