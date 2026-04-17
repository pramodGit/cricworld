require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })

const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Redis publisher
const pub = new Redis();

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

// API
app.get("/api/score", (req, res) => {
  res.json(getFormattedState());
});

app.post("/api/update-score", async (req, res) => {
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

  const data = getFormattedState();

  // 🔥 publish to Redis (instead of WebSocket)
  await pub.publish("score-updates", JSON.stringify(data));

  res.json({ success: true });
});

app.post("/api/reset", async (req, res) => {
  matchState = {
    matchId: "IND-AUS-1",
    runs: 0,
    wickets: 0,
    balls: 0
  };

  const data = getFormattedState();
  await pub.publish("score-updates", JSON.stringify(data));

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🚀 backend-api running on ${PORT}`);
});