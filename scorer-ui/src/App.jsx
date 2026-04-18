import axios from "axios";

function App() {

  const MATCH_ID = "IND-AUS-1"; // later make dynamic

  const send = async (runs, type = "run") => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/update-score`, {
        matchId: MATCH_ID,
        runs,
        type
      });
    } catch (err) {
      console.error("❌ Update failed", err.response?.data || err);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>🎯 Scorer Panel</h1>

      {[0,1,2,3,4,6].map(r => (
        <button key={r} onClick={() => send(r)}>
          {r}
        </button>
      ))}

      <br /><br />

      <button onClick={() => send(0, "wicket")}>
        WICKET
      </button>
    </div>
  );
}

export default App;