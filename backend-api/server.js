require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const pub = new Redis();

/* ================= HELPERS ================= */

function getMatchStats(innings, teams) {
  if (innings.length < 2) return null;

  const first = innings[0];
  const second = innings[1];

  const [team1, team2] = teams.split(" vs ");

  const totalBalls = 300; // 50 overs

  const target = first.runs + 1;
  const runsNeeded = target - second.runs;

  const ballsPlayed = second.balls;
  const ballsLeft = totalBalls - ballsPlayed;

  const oversPlayed = `${Math.floor(ballsPlayed / 6)}.${ballsPlayed % 6}`;
  const completedOvers = Math.floor(ballsPlayed / 6);
  const overSummary = `${completedOvers}/50`;

  const currentRR = ballsPlayed > 0
    ? (second.runs / (ballsPlayed / 6)).toFixed(2)
    : "0.00";

  const requiredRR = ballsLeft > 0
    ? (runsNeeded / (ballsLeft / 6)).toFixed(2)
    : "0.00";

  let result = null;

  // Team 2 won (chased successfully)
  if (runsNeeded <= 0) {
    const wicketsLeft = 10 - second.wickets;
    result = `${team2} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? "s" : ""}`;
  }
  // Team 1 won (team 2 all out or overs done)
  else if (second.wickets >= 10 || ballsLeft <= 0) {
    const margin = runsNeeded - 1; // runs they fell short by
    result = `${team1} won by ${margin} run${margin !== 1 ? "s" : ""}`;
  }

  return {
    target,
    runsNeeded,
    ballsLeft,
    oversPlayed,
    overSummary,
    currentRR,
    requiredRR,
    result,
    team1,
    team2
  };
}

async function getFullMatch(matchId) {
  const [[match]] = await db.query(
    "SELECT id, teams, status, venue, match_type FROM matches WHERE id = ?",
    [matchId]
  );

  const [scores] = await db.query(
    "SELECT * FROM match_scores WHERE match_id = ? ORDER BY innings",
    [matchId]
  );

  const innings = scores.map(s => ({
    innings: s.innings,
    runs: s.runs,
    wickets: s.wickets,
    balls: s.balls
  }));

  const stats = getMatchStats(innings, match.teams);

  return {
    matchId,
    teams: match.teams,
    venue: match.venue || null,
    matchType: match.match_type || null,
    status: match.status,
    innings,
    stats
  };
}

/* ================= APIs ================= */

app.get("/api/matches", async (req, res) => {
  try {
    const [matches] = await db.query("SELECT id FROM matches");
    const result = [];
    for (const m of matches) {
      const full = await getFullMatch(m.id);
      result.push(full);
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= UPDATE SCORE ================= */

app.post("/api/update-score", async (req, res) => {
  try {
    const { matchId, runs, type } = req.body;

    if (!matchId) return res.status(400).json({ error: "matchId required" });
    if (!["run", "wicket"].includes(type)) return res.status(400).json({ error: "Invalid type" });

    const [[match]] = await db.query(
      "SELECT status FROM matches WHERE id = ?", [matchId]
    );

    if (!match) return res.status(404).json({ error: "Match not found" });
    if (match.status === "COMPLETED") return res.status(400).json({ error: "Match completed" });

    if (type === "run") {
      await db.query(
        "UPDATE match_scores SET runs = runs + ?, balls = balls + 1 WHERE match_id = ? AND innings = 2",
        [runs, matchId]
      );
    }

    if (type === "wicket") {
      await db.query(
        "UPDATE match_scores SET wickets = wickets + 1, balls = balls + 1 WHERE match_id = ? AND innings = 2",
        [matchId]
      );
    }

    const fullMatch = await getFullMatch(matchId);
    await pub.publish("score-updates", JSON.stringify(fullMatch));
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= RESET ================= */

app.post("/api/reset-match", async (req, res) => {
  try {
    const { matchId } = req.body;
    await db.query("UPDATE match_scores SET runs = 0, wickets = 0, balls = 0 WHERE match_id = ?", [matchId]);
    await db.query("UPDATE matches SET status = 'LIVE' WHERE id = ?", [matchId]);
    const fullMatch = await getFullMatch(matchId);
    await pub.publish("score-updates", JSON.stringify(fullMatch));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= END MATCH ================= */

app.post("/api/end-match", async (req, res) => {
  try {
    const { matchId } = req.body;
    await db.query("UPDATE matches SET status = 'COMPLETED' WHERE id = ?", [matchId]);
    const fullMatch = await getFullMatch(matchId);
    await pub.publish("score-updates", JSON.stringify(fullMatch));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= START ================= */

app.listen(PORT, () => {
  console.log(`🚀 backend-api running on ${PORT}`);
});