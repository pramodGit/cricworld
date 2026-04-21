require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Redis publisher
const pub = new Redis();

// Helper
function getOver(balls) {
  const over = Math.floor(balls / 6);
  const ball = balls % 6;
  return `${over}.${ball}`;
}

// ==========================
// ✅ GET ALL LIVE MATCHES
// ==========================
app.get("/api/matches", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.id, m.teams, m.status,
             s.runs, s.wickets, s.balls
      FROM matches m
      LEFT JOIN match_scores s ON m.id = s.match_id
    `);

    const data = rows.map(r => ({
      matchId: r.id,
      teams: r.teams,
      status: r.status,
      score: r.runs !== null ? `${r.runs}/${r.wickets}` : null,
      over: r.balls !== null ? getOver(r.balls) : null
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// ✅ GET SINGLE MATCH SCORE
// ==========================
app.get("/api/score/:matchId", async (req, res) => {
  try {
    const { matchId } = req.params;

    const [[row]] = await db.query(
      "SELECT * FROM match_scores WHERE match_id = ?",
      [matchId]
    );

    if (!row) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.json({
      matchId,
      score: `${row.runs}/${row.wickets}`,
      over: getOver(row.balls)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// ✅ UPDATE SCORE
// ==========================
app.post("/api/update-score", async (req, res) => {
  try {
    const { matchId, runs, type } = req.body;

    if (!matchId) {
      return res.status(400).json({ error: "matchId required" });
    }

    if (!["run", "wicket"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    // Check match status
    const [[match]] = await db.query(
      "SELECT status FROM matches WHERE id = ?",
      [matchId]
    );

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    if (match.status === "COMPLETED") {
      return res.status(400).json({ error: "Match already completed" });
    }

    // Update DB
    if (type === "run") {
      await db.query(
        "UPDATE match_scores SET runs = runs + ?, balls = balls + 1 WHERE match_id = ?",
        [runs, matchId]
      );
    }

    if (type === "wicket") {
      await db.query(
        "UPDATE match_scores SET wickets = wickets + 1, balls = balls + 1 WHERE match_id = ?",
        [matchId]
      );
    }

    // Fetch updated state
    const [[row]] = await db.query(
      "SELECT * FROM match_scores WHERE match_id = ?",
      [matchId]
    );

    const data = {
      matchId,
      score: `${row.runs}/${row.wickets}`,
      over: getOver(row.balls)
    };

    // 🔥 Publish to Redis
    await pub.publish("score-updates", JSON.stringify(data));

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// ✅ RESET MATCH
// ==========================
app.post("/api/reset-match", async (req, res) => {
  try {
    const { matchId } = req.body;

    await db.query(
      "UPDATE match_scores SET runs = 0, wickets = 0, balls = 0 WHERE match_id = ?",
      [matchId]
    );

    await db.query(
      "UPDATE matches SET status = 'LIVE' WHERE id = ?",
      [matchId]
    );

    const data = {
      matchId,
      score: "0/0",
      over: "0.0"
    };

    await pub.publish("score-updates", JSON.stringify(data));

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// ✅ END MATCH
// ==========================
app.post("/api/end-match", async (req, res) => {
  try {
    const { matchId } = req.body;

    await db.query(
      "UPDATE matches SET status = 'COMPLETED' WHERE id = ?",
      [matchId]
    );

    await pub.publish(
      "score-updates",
      JSON.stringify({ matchId, status: "COMPLETED" })
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
app.listen(PORT, () => {
  console.log(`🚀 backend-api running on ${PORT}`);
});