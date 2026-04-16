// import { useEffect, useState } from "react";
// import axios from "axios";

// function App() {
//   const [score, setScore] = useState(null);

//   const fetchScore = async () => {
//     const res = await axios.get("http://localhost:5000/api/score");
//     setScore(res.data);
//   };

//   useEffect(() => {
//     fetchScore();
//     const interval = setInterval(fetchScore, 2000); // polling for now
//     return () => clearInterval(interval);
//   }, []);

//   if (!score) return <h2>Loading...</h2>;

//   return (
//     <div style={{ textAlign: "center" }}>
//       <h1>🏏 CricWorld</h1>
//       <h2>{score.matchId}</h2>
//       <h3>{score.score}</h3>
//       <p>Over: {score.over}</p>
//     </div>
//   );
// }

// export default App;

import { useEffect, useState } from "react";

function App() {
  const [score, setScore] = useState(null);

  useEffect(() => {
    let socket;
    let isMounted = true;

    function connect() {
      socket = new WebSocket(import.meta.env.VITE_WS_URL);

      socket.onmessage = (event) => {
        setScore(JSON.parse(event.data));
      };

      socket.onclose = () => {
        if (isMounted) {
          console.log("Reconnecting...");
          setTimeout(connect, 2000);
        }
      };
    }

    connect();

    return () => {
      isMounted = false;
      socket && socket.close();
    };
  }, []);

  if (!score) return <h2>Connecting...</h2>;

  return (
    <div style={{ textAlign: "center" }}>
      <h1>🏏 CricWorld</h1>
      <h2>{score.matchId}</h2>
      <h3>{score.score}</h3>
      <p>Over: {score.over}</p>
    </div>
  );
}

export default App;