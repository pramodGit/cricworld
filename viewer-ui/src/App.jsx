import { useEffect, useState } from "react";

function App() {
  const [score, setScore] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socket;
    let isMounted = true;

    // ✅ 1. Fetch initial score from DB
    async function fetchInitialScore() {
      try {
        const matchId = "IND-AUS-1";
        const res = await fetch(`${import.meta.env.VITE_API_URL}/score/${matchId}`);
        const data = await res.json();
        setScore(data);
      } catch (err) {
        console.error("Failed to load initial score", err);
      }
    }

    function connect() {
      socket = new WebSocket(import.meta.env.VITE_WS_URL);

      socket.onopen = () => {
        setConnected(true);
      };

      socket.onmessage = (event) => {
        setScore(JSON.parse(event.data));
      };

      socket.onclose = () => {
        setConnected(false);

        if (isMounted) {
          console.log("Reconnecting...");
          setTimeout(connect, 2000);
        }
      };
    }

    fetchInitialScore();
    connect();

    return () => {
      isMounted = false;
      socket && socket.close();
    };
  }, []);

  if (!connected && !score) return <h2>Connecting...</h2>;

  return (
    <div style={{ textAlign: "center" }}>
      <h1>🏏 CricWorld</h1>

      {/* 🔥 Show reconnecting without hiding data */}
      {!connected && <p style={{ color: "orange" }}>Reconnecting...</p>}

      {score && (
        <>
          <h2>{score.matchId}</h2>
          <h3>{score.score}</h3>
          <p>Over: {score.over}</p>
        </>
      )}
    </div>
  );
}

export default App;