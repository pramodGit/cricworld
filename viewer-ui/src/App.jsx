import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/matches`)
      .then(res => setMatches(res.data))
      .catch(err => console.error(err));
  }, []);

  const grouped = {
    LIVE: matches.filter(m => m.status === "LIVE"),
    COMPLETED: matches.filter(m => m.status === "COMPLETED"),
    UPCOMING: matches.filter(m => m.status === "UPCOMING"),
  };

  const renderCards = (list, isLive) => (
    list.map(m => (
      <div key={m.matchId} style={cardStyle}>
        <h3>{m.teams}</h3>

        {m.score ? (
          <>
            <h2>{m.score}</h2>
            <p>Over: {m.over}</p>
          </>
        ) : (
          <p>Match not started</p>
        )}

        {/* Show controls only for LIVE */}
        {isLive && (
          <>
            {[0,1,2,3,4,6].map(r => (
              <button key={r} style={{ margin: 5 }}>
                {r}
              </button>
            ))}
            <br />
            <button>WICKET</button>
            <br />
            <button style={{ background: "red", color: "#fff" }}>
              END MATCH
            </button>
          </>
        )}
      </div>
    ))
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>🏏 CricWorld Scorer</h1>

      <Section title="🔴 Live Matches">
        {renderCards(grouped.LIVE, true)}
      </Section>

      <Section title="✅ Completed Matches">
        {renderCards(grouped.COMPLETED, false)}
      </Section>

      <Section title="📅 Upcoming Matches">
        {renderCards(grouped.UPCOMING, false)}
      </Section>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 30 }}>
    <h2>{title}</h2>

    <div style={scrollContainer}>
      {children}
    </div>
  </div>
);

const scrollContainer = {
  display: "flex",
  gap: "16px",
  overflowX: "auto",
  paddingBottom: "10px"
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "20px"
};

const cardStyle = {
  minWidth: "260px",   // mobile
  maxWidth: "320px",
  flex: "0 0 auto",    // IMPORTANT for horizontal scroll
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "15px",
  background: "#fff",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
};

export default App;