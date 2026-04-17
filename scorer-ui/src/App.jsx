import axios from "axios";

function App() {

  const send = async (runs, type = "run") => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/update-score`, {
        runs,
        type
      });
    } catch (err) {
      console.error("❌ Update failed", err);
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