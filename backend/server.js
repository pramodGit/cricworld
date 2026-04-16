// const express = require("express");
// const cors = require("cors");

// const app = express();
// app.use(cors());
// app.use(express.json());

// let matchState = {
//   matchId: "IND-AUS-1",
//   score: "0/0",
//   over: "0.0"
// };

// app.get("/api/score", (req, res) => {
//   res.json(matchState);
// });

// app.post("/api/update-score", (req, res) => {
//   const { runs, type } = req.body;

//   let [r, w] = matchState.score.split("/").map(Number);

//   if (type === "run") r += runs;
//   if (type === "wicket") w += 1;

//   matchState.score = `${r}/${w}`;

//   res.json({ success: true, matchState });
// });

// app.listen(5000, () => {
//   console.log("🚀 Backend running on 5000");
// });

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })

const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

let matchState = {
  matchId: "IND-AUS-1",
  runs: 0,
  wickets: 0,
  balls: 0
};

function getOver(balls) {
  const over = Math.floor(balls / 6);
  const ball = balls % 6;
  return `${over}.${ball}`;
}

function getFormattedState() {
  return {
    matchId: matchState.matchId,
    score: `${matchState.runs}/${matchState.wickets}`,
    over: getOver(matchState.balls)
  };
}

// HTTP APIs
app.get("/api/score", (req, res) => {
  res.json(getFormattedState());
});

app.post("/api/update-score", (req, res) => {
  const { runs, type } = req.body;

  if (!["run", "wicket"].includes(type)) {
    return res.status(400).json({ error: "Invalid type" });
  }

  if (type === "run" && typeof runs !== "number") {
    return res.status(400).json({ error: "Invalid runs" });
  }

  if (type === "run") {
    matchState.runs += runs;
    matchState.balls += 1;
  }

  if (type === "wicket") {
    matchState.wickets += 1;
    matchState.balls += 1;
  }

  // 🔥 Broadcast to all clients
  broadcast(getFormattedState());

  res.json({ success: true });
});

app.post("/api/reset", (req, res) => {
  matchState = {
    matchId: "IND-AUS-1",
    runs: 0,
    wickets: 0,
    balls: 0
  };

  broadcast(getFormattedState());

  res.json({ success: true });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Backend running on ${PORT}`);
});

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("🔌 Client connected");

  // Send current state immediately
  ws.send(JSON.stringify(getFormattedState()));

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });
});

// Broadcast function
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}