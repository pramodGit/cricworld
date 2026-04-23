import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [matches, setMatches] = useState([]);

  const fetchMatches = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/matches`
      );
      setMatches(res.data);
    } catch (err) {
      console.error("❌ Failed to load matches", err);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const send = async (matchId, runs, type = "run") => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/update-score`,
        { matchId, runs, type }
      );
      fetchMatches();
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const endMatch = async (matchId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/end-match`,
        { matchId }
      );
      fetchMatches();
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const formatOver = (balls) =>
    `${Math.floor(balls / 6)}.${balls % 6}`;

  return (
    <div style={{ padding: "20px" }}>
      <h1>🎯 Scorer Panel</h1>

      <div style={grid}>
        {matches.map((m) => {
          const [team1, team2] = m.teams.split(" vs ");
          const i1 = m.innings?.[0];
          const i2 = m.innings?.[1];

          return (
            <div key={m.matchId} style={card}>
              <h3>{m.teams}</h3>

              {/* ✅ Innings Display */}
              {i1 && (
                <p>
                  {team1}: <b>{i1.runs}/{i1.wickets}</b>
                </p>
              )}

              {i2 && (
                <p>
                  {team2}: <b>{i2.runs}/{i2.wickets}</b>{" "}
                  ({formatOver(i2.balls)} ov)
                </p>
              )}

              {/* ✅ Match Info */}
              {m.stats && (
                <p style={{ fontSize: "12px", color: "#555" }}>
                  Need {m.stats.runsNeeded} runs in{" "}
                  {m.stats.ballsLeft} balls
                </p>
              )}

              {/* ❌ Disable controls if not LIVE */}
              {m.status === "LIVE" && (
                <>
                  {/* Run buttons */}
                  <div>
                    {[0, 1, 2, 3, 4, 6].map((r) => (
                      <button
                        key={r}
                        onClick={() => send(m.matchId, r)}
                        style={btn}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  {/* Wicket */}
                  <button
                    onClick={() => send(m.matchId, 0, "wicket")}
                    style={{ ...btn, marginTop: "10px" }}
                  >
                    WICKET
                  </button>

                  <br />

                  {/* End Match */}
                  <button
                    onClick={() => endMatch(m.matchId)}
                    style={endBtn}
                  >
                    END MATCH
                  </button>
                </>
              )}

              {/* ✅ Status */}
              {m.status !== "LIVE" && (
                <p style={{ color: "gray", marginTop: "10px" }}>
                  {m.status}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "20px"
};

const card = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "15px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
};

const btn = {
  margin: "5px",
  padding: "6px 10px",
  cursor: "pointer"
};

const endBtn = {
  marginTop: "10px",
  background: "red",
  color: "white",
  padding: "8px",
  border: "none",
  cursor: "pointer"
};

export default App;