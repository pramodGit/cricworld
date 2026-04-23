import { useEffect, useState } from "react";
import axios from "axios";

/* ── Flag emoji map ── */
const FLAG = {
  Bangladesh: "BAN", BAN: "BAN",
  India: "🇮🇳", IND: "🇮🇳",
  Australia: "🇦🇺", AUS: "🇦🇺",
  "New Zealand": "🇳🇿", NZ: "🇳🇿",
  Pakistan: "🇵🇰", PAK: "🇵🇰",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "South Africa": "🇿🇦", SA: "🇿🇦",
  "Sri Lanka": "🇱🇰", SL: "🇱🇰",
  "West Indies": "🏳️", WI: "🏳️",
  Zimbabwe: "🇿🇼", ZIM: "🇿🇼",
};
const getFlag = (name) => FLAG[name] ?? "🏏";

/* ── Inject Google Font once (no CSS file needed) ── */
const injectFont = () => {
  if (document.getElementById("cw-font")) return;
  const link = document.createElement("link");
  link.id = "cw-font";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap";
  document.head.appendChild(link);
};

/* ══════════════════════════════════════
   ALL STYLES — pure inline objects, zero CSS imports
═══════════════════════════════════════ */
const S = {
  page: {
    fontFamily: "'DM Sans', sans-serif",
    background: "#f1f3f4",
    minHeight: "100vh",
    padding: "16px 20px",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: "#202124",
    marginBottom: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  strip: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 6,
    scrollbarWidth: "none",   // hides scrollbar in Firefox
  },
  card: {
    minWidth: 245,
    maxWidth: 265,
    flex: "0 0 auto",
    background: "#fff",
    borderRadius: 12,
    padding: "14px 16px 12px",
    boxShadow: "0 1px 3px rgba(0,0,0,.12)",
    display: "flex",
    flexDirection: "column",
  },
  cardHeader: {
    fontSize: 11,
    color: "#70757a",
    fontWeight: 500,
    marginBottom: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pill: (status) => ({
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    padding: "2px 7px",
    borderRadius: 20,
    ...(status === "LIVE"
      ? { background: "#fce8e6", color: "#c5221f" }
      : status === "COMPLETED"
      ? { background: "#e6f4ea", color: "#137333" }
      : { background: "#e8f0fe", color: "#1a73e8" }),
  }),
  teamRow: (isFirst) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "5px 0",
    borderTop: isFirst ? "none" : "1px solid #f0f0f0",
  }),
  teamLeft: {
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  flag:     { fontSize: 18, lineHeight: 1 },
  teamName: { fontSize: 13, fontWeight: 600, color: "#202124" },
  scoreBlock: { textAlign: "right" },
  scoreMain:  { fontSize: 15, fontWeight: 700, color: "#202124" },
  scoreOvers: { fontSize: 11, color: "#70757a", marginTop: 1 },
  divider: {
    height: 1,
    background: "#f0f0f0",
    margin: "8px 0",
  },
  result: {
    fontSize: 12,
    fontWeight: 600,
    color: "#137333",
  },
  liveInfo: {
    fontSize: 11.5,
    color: "#444",
    marginTop: 3,
    lineHeight: 1.5,
  },
  rrr: {
    fontSize: 11,
    color: "#70757a",
    marginTop: 2,
  },
};

/* ══════════════════════════════════════
   APP
═══════════════════════════════════════ */
function App() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    injectFont();

    axios
      .get(`${import.meta.env.VITE_API_URL}/matches`)
      .then((res) => setMatches(res.data))
      .catch(console.error);

    const socket = new WebSocket(import.meta.env.VITE_WS_URL);
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMatches((prev) =>
        prev.map((m) => (m.matchId === data.matchId ? data : m))
      );
    };
    return () => socket.close();
  }, []);

  return (
    <div style={S.page}>
      <div style={S.title}>🏏 CricWorld</div>
      <div style={S.strip}>
        {matches.map((m) => (
          <MatchCard key={m.matchId} match={m} />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MATCH CARD
═══════════════════════════════════════ */
const MatchCard = ({ match: m }) => {
  const [team1, team2] = m.teams.split(" vs ");
  const i1 = m.innings?.[0];
  const i2 = m.innings?.[1];
  const st = m.stats;

  const fmt = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

  const headerStr =
    [m.matchType, m.venue].filter(Boolean).join(" • ") || m.matchId;

  return (
    <div style={S.card}>

      {/* Header: match label + status pill */}
      <div style={S.cardHeader}>
        <span>{headerStr}</span>
        <span style={S.pill(m.status)}>{m.status}</span>
      </div>

      {/* Team 1 */}
      {i1 && (
        <div style={S.teamRow(true)}>
          <div style={S.teamLeft}>
            <span style={S.flag}>{getFlag(team1)}</span>
          </div>
          <div style={S.scoreBlock}>
            <div style={S.scoreMain}>{i1.runs}/{i1.wickets}</div>
            <div style={S.scoreOvers}>{fmt(i1.balls)} ov</div>
          </div>
        </div>
      )}

      {/* Team 2 */}
      {i2 && (
        <div style={S.teamRow(false)}>
          <div style={S.teamLeft}>
            <span style={S.flag}>{getFlag(team2)}</span>
          </div>
          <div style={S.scoreBlock}>
            <div style={S.scoreMain}>{i2.runs}/{i2.wickets}</div>
            <div style={S.scoreOvers}>
              {fmt(i2.balls)} ov{st ? ` • T:${st.target}` : ""}
            </div>
          </div>
        </div>
      )}

      <div style={S.divider} />

      {/* Completed result */}
      {m.status === "COMPLETED" && st?.result && (
        <div style={S.result}>✅ {st.result}</div>
      )}

      {/* Live chase info */}
      {m.status === "LIVE" && st && (
        <>
          <div style={S.liveInfo}>
            {team2} need <strong>{st.runsNeeded}</strong> runs in{" "}
            <strong>{st.ballsLeft}</strong> balls
          </div>
          <div style={S.rrr}>
            CRR {st.currentRR} &nbsp;•&nbsp; RRR {st.requiredRR}
          </div>
        </>
      )}
    </div>
  );
};

export default App;