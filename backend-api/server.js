require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require("express");
const cors    = require("cors");
const Redis   = require("ioredis");
const db      = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const pub  = new Redis();

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */

// Total balls based on match type string
function getTotalBalls(matchType) {
  if (!matchType) return 300; // default ODI
  const t = matchType.toUpperCase();
  if (t.includes("T20") || t.includes("IPL") || t.includes("PSL") || t.includes("BBL")) return 120;
  if (t.includes("T10")) return 60;
  if (t.includes("ODI") || t.includes("50")) return 300;
  if (t.includes("TEST")) return Infinity;
  return 300;
}

function getTotalOvers(matchType) {
  const balls = getTotalBalls(matchType);
  if (balls === Infinity) return null;
  return balls / 6;
}

/*
  getMatchStats — only runs when 2nd innings is active
  innings[0] = team that batted first (1st innings)
  innings[1] = team batting second (2nd innings)
*/
function getMatchStats(innings, teams, matchType, currentInnings) {
  const totalBalls = getTotalBalls(matchType);
  const [team1, team2] = teams.split(" vs ");

  // Only show chase stats when 2nd innings is active
  if (currentInnings !== 2 || innings.length < 2) return null;

  const first  = innings[0];
  const second = innings[1];

  const target      = first.runs + 1;
  const runsNeeded  = target - second.runs;
  const ballsPlayed = second.balls;
  const ballsLeft   = totalBalls - ballsPlayed;

  const oversPlayed = `${Math.floor(ballsPlayed / 6)}.${ballsPlayed % 6}`;

  const currentRR = ballsPlayed > 0
    ? (second.runs / (ballsPlayed / 6)).toFixed(2)
    : "0.00";

  const requiredRR = ballsLeft > 0
    ? (runsNeeded / (ballsLeft / 6)).toFixed(2)
    : "0.00";

  let result = null;

  if (runsNeeded <= 0) {
    const wicketsLeft = 10 - second.wickets;
    result = `${team2} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? "s" : ""}`;
  } else if (second.wickets >= 10 || ballsLeft <= 0) {
    const margin = runsNeeded - 1;
    result = `${team1} won by ${margin} run${margin !== 1 ? "s" : ""}`;
  }

  return {
    target, runsNeeded, ballsLeft,
    oversPlayed, currentRR, requiredRR, result,
    team1, team2,
  };
}

async function getFullMatch(matchId) {
  const [[match]] = await db.query(
    `SELECT id, teams, status, venue, match_type, match_time, current_innings, toss_result
     FROM matches WHERE id = ?`,
    [matchId]
  );

  const [scores] = await db.query(
    "SELECT * FROM match_scores WHERE match_id = ? ORDER BY innings",
    [matchId]
  );

  const currentInnings = match.current_innings || 1;
  const totalOvers     = getTotalOvers(match.match_type);

  // Only expose innings rows that have actually started
  // innings 1 always shown (batting team), innings 2 only shown if currentInnings >= 2
  const allInnings = scores.map(s => ({
    innings:  s.innings,
    runs:     s.runs,
    wickets:  s.wickets,
    balls:    s.balls,
  }));

  const visibleInnings = allInnings.filter(i =>
    i.innings === 1 || currentInnings >= 2
  );

  const stats = getMatchStats(allInnings, match.teams, match.match_type, currentInnings);

  return {
    matchId,
    teams:          match.teams,
    venue:          match.venue      || null,
    matchType:      match.match_type || null,
    matchTime:      match.match_time || null,
    tossResult:     match.toss_result || null,
    status:         match.status,
    currentInnings,
    totalOvers,
    innings:        visibleInnings,
    stats,
  };
}

/* ═══════════════════════════════════════
   GET ALL MATCHES
═══════════════════════════════════════ */
app.get("/api/matches", async (req, res) => {
  try {
    const [matches] = await db.query("SELECT id FROM matches ORDER BY created_at DESC");
    const result = [];
    for (const m of matches) result.push(await getFullMatch(m.id));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ═══════════════════════════════════════
   ADD MATCH
═══════════════════════════════════════ */
app.post("/api/add-match", async (req, res) => {
  try {
    const { team1, team2, matchType, venue, matchTime, tossResult } = req.body;
    if (!team1 || !team2) return res.status(400).json({ error: "team1 and team2 required" });

    const matchId = `${team1.slice(0,3).toUpperCase()}-${team2.slice(0,3).toUpperCase()}-${Date.now()}`;
    const teams   = `${team1} vs ${team2}`;
    const timeVal = matchTime ? new Date(matchTime) : null;

    await db.query(
      `INSERT INTO matches (id, teams, status, match_type, venue, match_time, toss_result, current_innings)
       VALUES (?, ?, 'UPCOMING', ?, ?, ?, ?, 1)`,
      [matchId, teams, matchType || null, venue || null, timeVal, tossResult || null]
    );

    await db.query(
      `INSERT INTO match_scores (match_id, innings, runs, wickets, balls)
       VALUES (?, 1, 0, 0, 0), (?, 2, 0, 0, 0)`,
      [matchId, matchId]
    );

    res.json({ success: true, matchId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ═══════════════════════════════════════
   START MATCH  (UPCOMING → LIVE)
═══════════════════════════════════════ */
app.post("/api/start-match", async (req, res) => {
  try {
    const { matchId } = req.body;
    const [[match]] = await db.query("SELECT status FROM matches WHERE id = ?", [matchId]);
    if (!match) return res.status(404).json({ error: "Not found" });
    if (match.status !== "UPCOMING") return res.status(400).json({ error: "Not UPCOMING" });

    await db.query("UPDATE matches SET status='LIVE', current_innings=1 WHERE id=?", [matchId]);
    const full = await getFullMatch(matchId);
    await pub.publish("score-updates", JSON.stringify(full));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ═══════════════════════════════════════
   UPDATE SCORE  (always updates current_innings)
═══════════════════════════════════════ */
app.post("/api/update-score", async (req, res) => {
  try {
    const { matchId, runs, type } = req.body;
    if (!matchId) return res.status(400).json({ error: "matchId required" });
    if (!["run", "wicket"].includes(type)) return res.status(400).json({ error: "Invalid type" });

    const [[match]] = await db.query(
      "SELECT status, current_innings FROM matches WHERE id=?", [matchId]
    );
    if (!match) return res.status(404).json({ error: "Not found" });
    if (match.status === "COMPLETED") return res.status(400).json({ error: "Match completed" });

    const inn = match.current_innings;

    if (type === "run") {
      await db.query(
        "UPDATE match_scores SET runs=runs+?, balls=balls+1 WHERE match_id=? AND innings=?",
        [runs, matchId, inn]
      );
    } else {
      await db.query(
        "UPDATE match_scores SET wickets=wickets+1, balls=balls+1 WHERE match_id=? AND innings=?",
        [matchId, inn]
      );
    }

    const full = await getFullMatch(matchId);
    await pub.publish("score-updates", JSON.stringify(full));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ═══════════════════════════════════════
   START 2ND INNINGS
═══════════════════════════════════════ */
app.post("/api/start-second-innings", async (req, res) => {
  try {
    const { matchId } = req.body;
    await db.query("UPDATE matches SET current_innings=2 WHERE id=?", [matchId]);
    const full = await getFullMatch(matchId);
    await pub.publish("score-updates", JSON.stringify(full));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ═══════════════════════════════════════
   END MATCH
═══════════════════════════════════════ */
app.post("/api/end-match", async (req, res) => {
  try {
    const { matchId } = req.body;
    await db.query("UPDATE matches SET status='COMPLETED' WHERE id=?", [matchId]);
    const full = await getFullMatch(matchId);
    await pub.publish("score-updates", JSON.stringify(full));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ═══════════════════════════════════════
   RESET MATCH
═══════════════════════════════════════ */
app.post("/api/reset-match", async (req, res) => {
  try {
    const { matchId } = req.body;
    await db.query("UPDATE match_scores SET runs=0,wickets=0,balls=0 WHERE match_id=?", [matchId]);
    await db.query("UPDATE matches SET status='LIVE', current_innings=1 WHERE id=?", [matchId]);
    const full = await getFullMatch(matchId);
    await pub.publish("score-updates", JSON.stringify(full));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ═══════════════════════════════════════
   DELETE MATCH
═══════════════════════════════════════ */
app.post("/api/delete-match", async (req, res) => {
  try {
    const { matchId } = req.body;
    await db.query("DELETE FROM match_scores WHERE match_id=?", [matchId]);
    await db.query("DELETE FROM matches WHERE id=?", [matchId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ═══════════════════════════════════════
   START
═══════════════════════════════════════ */
app.listen(PORT, () => console.log(`🚀 backend-api running on ${PORT}`));