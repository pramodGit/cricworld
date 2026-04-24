import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const fmt = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

const S = {
  page:      { fontFamily: "system-ui, sans-serif", background: "#f5f5f5", minHeight: "100vh", padding: "20px" },
  title:     { fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#111" },
  formCard:  { background: "#fff", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.1)", marginBottom: 24, maxWidth: 580 },
  formTitle: { fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#333" },
  row:       { display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" },
  input:     { flex: 1, minWidth: 140, padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none" },
  addBtn:    { padding: "9px 20px", background: "#1a73e8", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" },
  sectionLabel: (c) => ({ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: c, marginBottom: 10, marginTop: 4 }),
  grid:      { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 28 },
  card:      { background: "#fff", borderRadius: 12, padding: "15px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.1)" },
  cardTop:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  teams:     { fontSize: 15, fontWeight: 700, color: "#111" },
  meta:      { fontSize: 11, color: "#888", marginTop: 2 },
  toss:      { fontSize: 11, color: "#555", marginTop: 2, fontStyle: "italic" },
  pill: (s) => ({
    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, padding: "3px 8px", borderRadius: 20,
    ...(s === "LIVE" ? { background: "#fce8e6", color: "#c5221f" }
      : s === "COMPLETED" ? { background: "#e6f4ea", color: "#137333" }
      : { background: "#e8f0fe", color: "#1a73e8" }),
  }),
  scoreRow:  { display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, color: "#333" },
  info:      { fontSize: 12, color: "#666", margin: "6px 0" },
  btnGroup:  { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 },
  runBtn:    { padding: "6px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#f9f9f9", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  wicketBtn: { padding: "6px 14px", borderRadius: 8, border: "none", background: "#f0ad00", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  startBtn:  { marginTop: 10, padding: "8px 16px", background: "#34a853", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%" },
  inn2Btn:   { marginTop: 8, padding: "8px 16px", background: "#1a73e8", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%" },
  endBtn:    { marginTop: 8, padding: "8px 16px", background: "#ea4335", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%" },
  deleteBtn: { marginTop: 8, padding: "7px 16px", background: "transparent", color: "#999", border: "1px solid #ddd", borderRadius: 8, fontSize: 12, cursor: "pointer", width: "100%" },
};

export default function App() {
  const [matches, setMatches] = useState([]);
  const [form, setForm] = useState({ team1: "", team2: "", matchType: "", venue: "", matchTime: "", tossResult: "" });
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    try { setMatches((await axios.get(`${API}/matches`)).data); }
    catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const addMatch = async () => {
    if (!form.team1.trim() || !form.team2.trim()) { setErr("Both team names required."); return; }
    setErr(""); setAdding(true);
    try {
      await axios.post(`${API}/add-match`, {
        team1: form.team1.trim(), team2: form.team2.trim(),
        matchType: form.matchType.trim(), venue: form.venue.trim(),
        matchTime: form.matchTime || null,
        tossResult: form.tossResult.trim() || null,
      });
      setForm({ team1: "", team2: "", matchType: "", venue: "", matchTime: "", tossResult: "" });
      load();
    } catch (e) { setErr(e.response?.data?.error || "Failed."); }
    setAdding(false);
  };

  const startMatch        = (id) => axios.post(`${API}/start-match`,          { matchId: id }).then(load);
  const startSecondInning = (id) => axios.post(`${API}/start-second-innings`, { matchId: id }).then(load);
  const endMatch          = (id) => axios.post(`${API}/end-match`,            { matchId: id }).then(load);
  const deleteMatch       = (id) => { if (window.confirm("Delete?")) axios.post(`${API}/delete-match`, { matchId: id }).then(load); };
  const send              = (id, runs, type = "run") => axios.post(`${API}/update-score`, { matchId: id, runs, type }).then(load);

  const upcoming  = matches.filter(m => m.status === "UPCOMING");
  const live      = matches.filter(m => m.status === "LIVE");
  const completed = matches.filter(m => m.status === "COMPLETED");

  return (
    <div style={S.page}>
      <div style={S.title}>🎯 Scorer Panel</div>

      {/* ── ADD MATCH ── */}
      <div style={S.formCard}>
        <div style={S.formTitle}>➕ Add New Match</div>
        <div style={S.row}>
          <input style={S.input} placeholder="Team 1 — bats first (e.g. RCB)" value={form.team1} onChange={e => setForm({ ...form, team1: e.target.value })} />
          <input style={S.input} placeholder="Team 2 — bats second (e.g. GT)" value={form.team2} onChange={e => setForm({ ...form, team2: e.target.value })} />
        </div>
        <div style={S.row}>
          <input style={S.input} placeholder="Match type (e.g. IPL T20, 3rd ODI)" value={form.matchType} onChange={e => setForm({ ...form, matchType: e.target.value })} />
          <input style={S.input} placeholder="Venue (e.g. Bengaluru)"            value={form.venue}     onChange={e => setForm({ ...form, venue: e.target.value })} />
        </div>
        <div style={S.row}>
          <input type="datetime-local" style={{ ...S.input, flex: "0 0 auto", minWidth: 220 }} value={form.matchTime} onChange={e => setForm({ ...form, matchTime: e.target.value })} />
          <input style={S.input} placeholder="Toss result (e.g. RCB chose to field)" value={form.tossResult} onChange={e => setForm({ ...form, tossResult: e.target.value })} />
        </div>
        {err && <div style={{ color: "red", fontSize: 12, marginBottom: 8 }}>{err}</div>}
        <button style={S.addBtn} onClick={addMatch} disabled={adding}>{adding ? "Adding..." : "Add Match"}</button>
      </div>

      {/* ── LIVE ── */}
      {live.length > 0 && <>
        <div style={S.sectionLabel("#c5221f")}>🔴 Live</div>
        <div style={S.grid}>
          {live.map(m => (
            <LiveCard key={m.matchId} m={m} send={send}
              startSecondInning={startSecondInning}
              endMatch={endMatch} deleteMatch={deleteMatch} />
          ))}
        </div>
      </>}

      {/* ── UPCOMING ── */}
      {upcoming.length > 0 && <>
        <div style={S.sectionLabel("#1a73e8")}>🕐 Upcoming</div>
        <div style={S.grid}>
          {upcoming.map(m => <UpcomingCard key={m.matchId} m={m} startMatch={startMatch} deleteMatch={deleteMatch} />)}
        </div>
      </>}

      {/* ── COMPLETED ── */}
      {completed.length > 0 && <>
        <div style={S.sectionLabel("#137333")}>✅ Completed</div>
        <div style={S.grid}>
          {completed.map(m => <CompletedCard key={m.matchId} m={m} deleteMatch={deleteMatch} />)}
        </div>
      </>}
    </div>
  );
}

/* ── Upcoming ── */
const UpcomingCard = ({ m, startMatch, deleteMatch }) => (
  <div style={S.card}>
    <div style={S.cardTop}>
      <div>
        <div style={S.teams}>{m.teams}</div>
        <div style={S.meta}>{[m.matchType, m.venue].filter(Boolean).join(" • ")}</div>
        {m.tossResult && <div style={S.toss}>{m.tossResult}</div>}
      </div>
      <span style={S.pill("UPCOMING")}>Upcoming</span>
    </div>
    <button style={S.startBtn}  onClick={() => startMatch(m.matchId)}>▶ Start Match</button>
    <button style={S.deleteBtn} onClick={() => deleteMatch(m.matchId)}>🗑 Delete</button>
  </div>
);

/* ── Live ── */
const LiveCard = ({ m, send, startSecondInning, endMatch, deleteMatch }) => {
  const [team1, team2] = m.teams.split(" vs ");
  const i1  = m.innings?.find(i => i.innings === 1);
  const i2  = m.innings?.find(i => i.innings === 2);
  const st  = m.stats;
  const inn = m.currentInnings;

  // Label which team is batting
  const battingTeam = inn === 1 ? team1 : team2;

  return (
    <div style={S.card}>
      <div style={S.cardTop}>
        <div>
          <div style={S.teams}>{m.teams}</div>
          <div style={S.meta}>{[m.matchType, m.venue].filter(Boolean).join(" • ")}</div>
          {m.tossResult && <div style={S.toss}>{m.tossResult}</div>}
        </div>
        <span style={S.pill("LIVE")}>Live</span>
      </div>

      {/* Innings 1 */}
      {i1 && (
        <div style={S.scoreRow}>
          <span>{team1} {inn === 1 ? "🏏" : ""}</span>
          <strong>{i1.runs}/{i1.wickets} ({fmt(i1.balls)} ov)</strong>
        </div>
      )}

      {/* Innings 2 — only if started */}
      {i2 && inn === 2 && (
        <div style={S.scoreRow}>
          <span>{team2} 🏏</span>
          <strong>{i2.runs}/{i2.wickets} ({fmt(i2.balls)} ov)</strong>
        </div>
      )}

      {st && inn === 2 && (
        <div style={S.info}>
          Need <strong>{st.runsNeeded}</strong> runs in <strong>{st.ballsLeft}</strong> balls &nbsp;•&nbsp; RRR {st.requiredRR}
        </div>
      )}

      {/* Scoring buttons — always for current innings */}
      <div style={{ ...S.info, marginTop: 8, fontWeight: 600 }}>
        Scoring: {battingTeam} (Inn {inn})
      </div>
      <div style={S.btnGroup}>
        {[0,1,2,3,4,6].map(r => (
          <button key={r} style={S.runBtn} onClick={() => send(m.matchId, r)}>{r}</button>
        ))}
        <button style={S.wicketBtn} onClick={() => send(m.matchId, 0, "wicket")}>W</button>
      </div>

      {/* Start 2nd innings button — only during 1st */}
      {inn === 1 && (
        <button style={S.inn2Btn} onClick={() => startSecondInning(m.matchId)}>
          ▶ Start 2nd Innings ({team2})
        </button>
      )}

      <button style={S.endBtn}    onClick={() => endMatch(m.matchId)}>⏹ End Match</button>
      <button style={S.deleteBtn} onClick={() => deleteMatch(m.matchId)}>🗑 Delete</button>
    </div>
  );
};

/* ── Completed ── */
const CompletedCard = ({ m, deleteMatch }) => {
  const [team1, team2] = m.teams.split(" vs ");
  const i1 = m.innings?.find(i => i.innings === 1);
  const i2 = m.innings?.find(i => i.innings === 2);
  const st = m.stats;
  return (
    <div style={{ ...S.card, opacity: 0.85 }}>
      <div style={S.cardTop}>
        <div>
          <div style={S.teams}>{m.teams}</div>
          <div style={S.meta}>{[m.matchType, m.venue].filter(Boolean).join(" • ")}</div>
          {m.tossResult && <div style={S.toss}>{m.tossResult}</div>}
        </div>
        <span style={S.pill("COMPLETED")}>Done</span>
      </div>
      {i1 && <div style={S.scoreRow}><span>{team1}</span><strong>{i1.runs}/{i1.wickets} ({fmt(i1.balls)} ov)</strong></div>}
      {i2 && <div style={S.scoreRow}><span>{team2}</span><strong>{i2.runs}/{i2.wickets} ({fmt(i2.balls)} ov)</strong></div>}
      {st?.result && <div style={{ ...S.info, color: "#137333", fontWeight: 600 }}>✅ {st.result}</div>}
      <button style={S.deleteBtn} onClick={() => deleteMatch(m.matchId)}>🗑 Delete</button>
    </div>
  );
};