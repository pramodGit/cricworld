import { useEffect, useState } from "react";
import axios from "axios";

/* ══════════════════════════════════════
   TEAM LOGOS
═══════════════════════════════════════ */
const LOGOS = {
  RCB:  "https://upload.wikimedia.org/wikipedia/en/2/2a/Royal_Challengers_Bangalore_2020.png",
  MI:   "https://upload.wikimedia.org/wikipedia/en/c/cd/Mumbai_Indians_Logo.svg",
  CSK:  "https://upload.wikimedia.org/wikipedia/en/2/2b/Chennai_Super_Kings_Logo.svg",
  KKR:  "https://upload.wikimedia.org/wikipedia/en/4/4c/Kolkata_Knight_Riders_Logo.svg",
  DC:   "https://upload.wikimedia.org/wikipedia/en/f/f5/Delhi_Capitals_Logo.png",
  GT:   "https://upload.wikimedia.org/wikipedia/en/0/09/Gujarat_Titans_Logo.svg",
  PBKS: "https://upload.wikimedia.org/wikipedia/en/3/3b/Punjab_Kings_Logo.svg",
  RR:   "https://upload.wikimedia.org/wikipedia/en/6/60/Rajasthan_Royals_Logo.svg",
  SRH:  "https://upload.wikimedia.org/wikipedia/en/8/81/Sunrisers_Hyderabad.svg",
  LSG:  "https://upload.wikimedia.org/wikipedia/en/8/8d/Lucknow_Super_Giants_Logo.png",
  India:          "https://upload.wikimedia.org/wikipedia/en/8/8d/Cricket_India_Crest.svg",
  IND:            "https://upload.wikimedia.org/wikipedia/en/8/8d/Cricket_India_Crest.svg",
  Australia:      "https://upload.wikimedia.org/wikipedia/en/e/e4/Cricket_Australia.svg",
  AUS:            "https://upload.wikimedia.org/wikipedia/en/e/e4/Cricket_Australia.svg",
  "New Zealand":  "https://upload.wikimedia.org/wikipedia/en/thumb/3/30/Cricket_New_Zealand.svg/180px-Cricket_New_Zealand.svg.png",
  NZ:             "https://upload.wikimedia.org/wikipedia/en/thumb/3/30/Cricket_New_Zealand.svg/180px-Cricket_New_Zealand.svg.png",
  Pakistan:       "https://upload.wikimedia.org/wikipedia/en/3/3b/Pakistan_Cricket_Board_%28logo%29.svg",
  PAK:            "https://upload.wikimedia.org/wikipedia/en/3/3b/Pakistan_Cricket_Board_%28logo%29.svg",
  Bangladesh:     "https://upload.wikimedia.org/wikipedia/en/f/f5/BCB_logo.svg",
  BAN:            "https://upload.wikimedia.org/wikipedia/en/f/f5/BCB_logo.svg",
  "South Africa": "https://upload.wikimedia.org/wikipedia/en/4/44/Cricket_South_Africa_Logo.svg",
  SA:             "https://upload.wikimedia.org/wikipedia/en/4/44/Cricket_South_Africa_Logo.svg",
  "Sri Lanka":    "https://upload.wikimedia.org/wikipedia/en/d/da/Cricket_Sri_Lanka_Logo.svg",
  SL:             "https://upload.wikimedia.org/wikipedia/en/d/da/Cricket_Sri_Lanka_Logo.svg",
  "West Indies":  "https://upload.wikimedia.org/wikipedia/en/b/b0/Cricket_West_Indies_Logo.svg",
  WI:             "https://upload.wikimedia.org/wikipedia/en/b/b0/Cricket_West_Indies_Logo.svg",
  Zimbabwe:       "https://upload.wikimedia.org/wikipedia/en/a/ab/Zimbabwe_Cricket_logo.svg",
  ZIM:            "https://upload.wikimedia.org/wikipedia/en/a/ab/Zimbabwe_Cricket_logo.svg",
};

const FALLBACK_COLOR = {
  RCB: "#cc0000", MI: "#004ba0", CSK: "#ffd700", KKR: "#3a225d",
  DC: "#0078bc",  GT: "#1c4f9c", PBKS: "#ed1f27", RR: "#ea1fa2",
  SRH: "#f7a721", LSG: "#a0c4ff",
};

const TeamLogo = ({ name, size = 26 }) => {
  const [failed, setFailed] = useState(false);
  const src     = LOGOS[name];
  const color   = FALLBACK_COLOR[name] ?? "#999";
  const initial = (name ?? "?")[0].toUpperCase();
  if (!src || failed) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%", background: color,
        color: "#fff", flexShrink: 0, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: size * 0.44, fontWeight: 800,
      }}>{initial}</div>
    );
  }
  return <img src={src} alt={name} width={size} height={size} onError={() => setFailed(true)} style={{ objectFit: "contain", flexShrink: 0 }} />;
};

/* ══════════════════════════════════════
   MATCH TIME FORMATTER
═══════════════════════════════════════ */
const formatMatchTime = (matchTime) => {
  if (!matchTime) return null;
  const match = new Date(matchTime);
  const now   = new Date();
  const matchDay = new Date(match.getFullYear(), match.getMonth(), match.getDate());
  const today    = new Date(now.getFullYear(),   now.getMonth(),   now.getDate());
  const diff     = Math.round((matchDay - today) / 86400000);
  const label    = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff === -1 ? "Yesterday"
    : match.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const time = match.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
  return { label, time };
};

/* ── Font inject ── */
const injectFont = () => {
  if (document.getElementById("cw-font")) return;
  const l = document.createElement("link");
  l.id = "cw-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap";
  document.head.appendChild(l);
};

/* ══════════════════════════════════════
   STYLES
═══════════════════════════════════════ */
const S = {
  page:  { fontFamily: "'DM Sans', sans-serif", background: "#f1f3f4", minHeight: "100vh", padding: "16px 20px" },
  title: { fontSize: 20, fontWeight: 700, color: "#202124", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 },
  strip: { display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" },
  card:  { minWidth: 245, maxWidth: 265, flex: "0 0 auto", background: "#fff", borderRadius: 12, padding: "14px 16px 12px", boxShadow: "0 1px 3px rgba(0,0,0,.12)", display: "flex", flexDirection: "column" },
  cardHeader: { fontSize: 11, color: "#70757a", fontWeight: 500, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" },
  pill: (s) => ({
    fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", padding: "2px 7px", borderRadius: 20,
    ...(s === "LIVE" ? { background: "#fce8e6", color: "#c5221f" } : s === "COMPLETED" ? { background: "#e6f4ea", color: "#137333" } : { background: "#e8f0fe", color: "#1a73e8" }),
  }),
  teamRow: (isFirst) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderTop: isFirst ? "none" : "1px solid #f0f0f0" }),
  teamLeft:   { display: "flex", alignItems: "center", gap: 8 },
  teamName:   { fontSize: 13, fontWeight: 600, color: "#202124" },
  scoreBlock: { textAlign: "right" },
  scoreMain:  { fontSize: 15, fontWeight: 700, color: "#202124" },
  scoreOvers: { fontSize: 11, color: "#70757a", marginTop: 1 },
  divider:    { height: 1, background: "#f0f0f0", margin: "8px 0" },
  result:     { fontSize: 12, fontWeight: 600, color: "#137333" },
  toss:       { fontSize: 11, color: "#70757a", marginTop: 2 },
  liveInfo:   { fontSize: 11.5, color: "#444", marginTop: 3, lineHeight: 1.5 },
  rrr:        { fontSize: 11, color: "#70757a", marginTop: 2 },
  timeBlock:  { textAlign: "right", flexShrink: 0 },
  timeLabel:  { fontSize: 11, color: "#70757a", marginBottom: 2 },
  timeValue:  { fontSize: 15, fontWeight: 700, color: "#202124" },
  noTime:     { fontSize: 12, color: "#70757a", fontStyle: "italic" },
};

/* ══════════════════════════════════════
   APP
═══════════════════════════════════════ */
function App() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    injectFont();
    axios.get(`${import.meta.env.VITE_API_URL}/matches`)
      .then(r => setMatches(r.data)).catch(console.error);

    const socket = new WebSocket(import.meta.env.VITE_WS_URL);
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMatches(prev => prev.map(m => m.matchId === data.matchId ? data : m));
    };
    return () => socket.close();
  }, []);

  return (
    <div style={S.page}>
      <div style={S.title}>🏏 CricWorld</div>
      <div style={S.strip}>
        {matches.map(m => <MatchCard key={m.matchId} match={m} />)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MATCH CARD
═══════════════════════════════════════ */
const MatchCard = ({ match: m }) => {
  const [team1, team2] = m.teams.split(" vs ");
  const i1  = m.innings?.find(i => i.innings === 1);
  const i2  = m.innings?.find(i => i.innings === 2);
  const st  = m.stats;
  const inn = m.currentInnings;
  const tot = m.totalOvers; // e.g. 20 for T20, 50 for ODI

  const isUpcoming  = m.status === "UPCOMING";
  const isLive      = m.status === "LIVE";
  const isCompleted = m.status === "COMPLETED";

  // Format: "9.2/20 ov" or "34.4/50 ov"
  const fmtOvers = (balls) => {
    const played = `${Math.floor(balls / 6)}.${balls % 6}`;
    return tot ? `${played}/${tot} ov` : `${played} ov`;
  };

  const headerStr = [m.matchType, m.venue].filter(Boolean).join(" • ") || m.matchId;
  const matchTime = formatMatchTime(m.matchTime);

  return (
    <div style={S.card}>

      {/* Header */}
      <div style={S.cardHeader}>
        <span>{headerStr}</span>
        <span style={S.pill(m.status)}>{m.status}</span>
      </div>

      {/* Team 1 row — always shown */}
      <div style={S.teamRow(true)}>
        <div style={S.teamLeft}>
          <TeamLogo name={team1} size={26} />
          <span style={S.teamName}>{team1}</span>
        </div>

        {/* UPCOMING: time block on team1 row */}
        {isUpcoming && matchTime && (
          <div style={S.timeBlock}>
            <div style={S.timeLabel}>{matchTime.label}</div>
            <div style={S.timeValue}>{matchTime.time}</div>
          </div>
        )}

        {/* LIVE/COMPLETED: score for team1 (1st innings) */}
        {!isUpcoming && i1 && (
          <div style={S.scoreBlock}>
            <div style={S.scoreMain}>{i1.runs}/{i1.wickets}</div>
            <div style={S.scoreOvers}>{fmtOvers(i1.balls)}</div>
          </div>
        )}
      </div>

      {/* Team 2 row — show always but score only if 2nd innings started */}
      <div style={S.teamRow(false)}>
        <div style={S.teamLeft}>
          <TeamLogo name={team2} size={26} />
          <span style={S.teamName}>{team2}</span>
        </div>

        {/* Show score only when 2nd innings is active or completed */}
        {!isUpcoming && i2 && inn >= 2 && (
          <div style={S.scoreBlock}>
            <div style={S.scoreMain}>{i2.runs}/{i2.wickets}</div>
            <div style={S.scoreOvers}>
              {fmtOvers(i2.balls)}{st ? ` • T:${st.target}` : ""}
            </div>
          </div>
        )}
      </div>

      <div style={S.divider} />

      {/* Toss result */}
      {m.tossResult && !isUpcoming && (
        <div style={S.toss}>{m.tossResult}</div>
      )}

      {/* UPCOMING */}
      {isUpcoming && <div style={S.noTime}>Match yet to begin</div>}

      {/* COMPLETED */}
      {isCompleted && st?.result && (
        <div style={S.result}>✅ {st.result}</div>
      )}

      {/* LIVE chase info — only during 2nd innings */}
      {isLive && st && inn === 2 && (
        <>
          <div style={S.liveInfo}>
            {team2} need <strong>{st.runsNeeded}</strong> runs in <strong>{st.ballsLeft}</strong> balls
          </div>
          <div style={S.rrr}>CRR {st.currentRR} &nbsp;•&nbsp; RRR {st.requiredRR}</div>
        </>
      )}

      {/* LIVE 1st innings — just show who's batting */}
      {isLive && inn === 1 && (
        <div style={S.toss}>{team1} batting</div>
      )}
    </div>
  );
};

export default App;