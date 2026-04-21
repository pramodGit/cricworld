import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [matches, setMatches] = useState([]);

  // ✅ Fetch all matches
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

  // ✅ Send score update
  const send = async (matchId, runs, type = "run") => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/update-score`,
        {
          matchId,
          runs,
          type
        }
      );
      fetchMatches(); // refresh UI
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  // ✅ End match
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

  return (
    <div style={{ padding: "20px" }}>
      <h1>🎯 Scorer Panel</h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px"
      }}>
        {matches.map((m) => (
          <div key={m.matchId} style={{
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "15px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h3>{m.teams}</h3>
            <h2>{m.score}</h2>
            <p>Over: {m.over}</p>

            {/* Run buttons */}
            <div>
              {[0,1,2,3,4,6].map(r => (
                <button
                  key={r}
                  onClick={() => send(m.matchId, r)}
                  style={{ margin: "5px" }}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Wicket */}
            <button
              onClick={() => send(m.matchId, 0, "wicket")}
              style={{ marginTop: "10px" }}
            >
              WICKET
            </button>

            <br />

            {/* End Match */}
            <button
              onClick={() => endMatch(m.matchId)}
              style={{
                marginTop: "10px",
                background: "red",
                color: "white"
              }}
            >
              END MATCH
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;