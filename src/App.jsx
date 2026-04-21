import { useState, useEffect, useCallback } from "react";

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS = ["D","L","M","M","J","V","S"];
const EVENT_COLORS = [
  { color: "#c9b8e8", label: "Lavande" },
  { color: "#f7c5d0", label: "Rose" },
  { color: "#b8e0d2", label: "Menthe" },
  { color: "#fde9b8", label: "Miel" },
  { color: "#b8d4e8", label: "Ciel" },
  { color: "#f5d6b8", label: "Pêche" },
];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m) { return new Date(y, m, 1).getDay(); }

export default function App() {
  const [today] = useState(new Date());
  const [cur, setCur] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [events, setEvents] = useState({});
  const [modal, setModal] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState(EVENT_COLORS[0].color);
  const [lastSync, setLastSync] = useState(null);

  const dateKey = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const loadEvents = useCallback(async () => {
    try {
      const r = await window.storage.get("calendar-beige-v1", true);
      if (r?.value) setEvents(JSON.parse(r.value));
    } catch {}
  }, []);

  const saveEvents = useCallback(async (evts) => {
    try {
      await window.storage.set("calendar-beige-v1", JSON.stringify(evts), true);
      setLastSync(new Date());
    } catch {}
  }, []);

  useEffect(() => {
    loadEvents();
    const iv = setInterval(async () => {
      try {
        const r = await window.storage.get("calendar-beige-v1", true);
        if (r?.value) { setEvents(JSON.parse(r.value)); setLastSync(new Date()); }
      } catch {}
    }, 3000);
    return () => clearInterval(iv);
  }, [loadEvents]);

  const addEvent = async () => {
    if (!newTitle.trim()) return;
    const key = modal.date;
    const updated = { ...events, [key]: [...(events[key]||[]), { id: Date.now(), title: newTitle.trim(), color: newColor }] };
    setEvents(updated);
    await saveEvents(updated);
    setNewTitle(""); setNewColor(EVENT_COLORS[0].color);
    setModal({ ...modal });
  };

  const removeEvent = async (key, id) => {
    const updated = { ...events, [key]: (events[key]||[]).filter(e => e.id !== id) };
    if (!updated[key]?.length) delete updated[key];
    setEvents(updated); await saveEvents(updated);
  };

  const prevMonth = () => setCur(c => c.m === 0 ? {y:c.y-1,m:11} : {y:c.y,m:c.m-1});
  const nextMonth = () => setCur(c => c.m === 11 ? {y:c.y+1,m:0} : {y:c.y,m:c.m+1});

  const daysInMonth = getDaysInMonth(cur.y, cur.m);
  const firstDay = getFirstDay(cur.y, cur.m);
  const cells = [...Array(firstDay).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];
  const isToday = d => d===today.getDate() && cur.m===today.getMonth() && cur.y===today.getFullYear();

  const monthKey = `${cur.y}-${String(cur.m+1).padStart(2,'0')}`;
  const monthEvents = Object.entries(events).filter(([k]) => k.startsWith(monthKey));
  const totalEvents = monthEvents.reduce((s,[,v])=>s+v.length,0);

  return (
    <div style={{minHeight:"100vh", background:"#f5f0e8", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 16px", fontFamily:"'Segoe UI',system-ui,sans-serif", position:"relative", overflow:"hidden"}}>

      {/* Subtle blobs */}
      <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none"}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="340" cy="100" rx="140" ry="110" fill="#ede4d8" opacity="0.6" transform="rotate(-15 340 100)"/>
        <ellipse cx="40" cy="400" rx="120" ry="90" fill="#e8ddd0" opacity="0.5" transform="rotate(10 40 400)"/>
        <ellipse cx="360" cy="650" rx="110" ry="130" fill="#ede4d8" opacity="0.4" transform="rotate(25 360 650)"/>
      </svg>

      {/* Main card */}
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:420,background:"#faf6f0",borderRadius:28,boxShadow:"0 6px 32px rgba(160,130,100,0.12)",overflow:"hidden",border:"1px solid #ede6da"}}>

        {/* Header */}
        <div style={{padding:"22px 24px 0",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <h1 style={{margin:0,fontSize:20,fontWeight:700,color:"#4a3f35",letterSpacing:"-0.5px"}}>Mon Calendrier</h1>
            <p style={{margin:"3px 0 0",fontSize:11,color:"#a89880",fontWeight:400}}>
              {totalEvents} événement{totalEvents !== 1 ? "s" : ""} ce mois
            </p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,background:"#ede6da",borderRadius:20,padding:"5px 11px"}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#b8e0d2",animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:10,color:"#8a7a6a",fontWeight:500}}>
              {lastSync ? lastSync.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : "sync..."}
            </span>
          </div>
        </div>

        {/* Month nav */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 24px 10px"}}>
          <button onClick={prevMonth} style={{background:"#ede6da",border:"none",borderRadius:12,width:34,height:34,cursor:"pointer",fontSize:16,color:"#6a5a4a",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <span style={{fontSize:16,fontWeight:700,color:"#4a3f35",letterSpacing:"-0.3px"}}>{MONTHS[cur.m]} {cur.y}</span>
          <button onClick={nextMonth} style={{background:"#ede6da",border:"none",borderRadius:12,width:34,height:34,cursor:"pointer",fontSize:16,color:"#6a5a4a",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        </div>

        {/* Day labels */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0 16px"}}>
          {DAYS.map((d,i) => (
            <div key={i} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#c0a888",padding:"4px 0",letterSpacing:"0.5px"}}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,padding:"6px 16px 18px"}}>
          {cells.map((d,i) => {
            if (!d) return <div key={`e-${i}`}/>;
            const key = dateKey(cur.y, cur.m, d);
            const dayEvts = events[key] || [];
            const tod = isToday(d);
            return (
              <div key={key} onClick={() => setModal({ date: key })}
                style={{minHeight:58,borderRadius:14,padding:"6px 3px 4px",cursor:"pointer",
                  background: tod ? "#4a3f35" : dayEvts.length ? "#fff" : "transparent",
                  border: tod ? "none" : dayEvts.length ? "1.5px solid #ede6da" : "1.5px solid transparent",
                  boxShadow: tod ? "0 3px 12px rgba(74,63,53,0.2)" : dayEvts.length ? "0 2px 8px rgba(160,130,100,0.08)" : "none",
                  transition:"transform 0.12s, box-shadow 0.12s"}}
                onMouseEnter={e => { e.currentTarget.style.transform="scale(1.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}>
                <div style={{textAlign:"center",fontSize:12,fontWeight:tod?700:500,color:tod?"#faf6f0":"#4a3f35",marginBottom:3}}>{d}</div>
                <div style={{display:"flex",flexDirection:"column",gap:2}}>
                  {dayEvts.slice(0,2).map(ev => (
                    <div key={ev.id} style={{background:ev.color,borderRadius:4,padding:"1px 3px",fontSize:8,color:"#4a3f35",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500,opacity:0.95}}>{ev.title}</div>
                  ))}
                  {dayEvts.length > 2 && <div style={{fontSize:8,color: tod ? "#d0c0b0" : "#a89880",textAlign:"center"}}>+{dayEvts.length-2}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upcoming events */}
        {totalEvents > 0 && (
          <div style={{borderTop:"1px solid #ede6da",padding:"14px 22px 20px"}}>
            <p style={{margin:"0 0 10px",fontSize:10,fontWeight:700,color:"#c0a888",textTransform:"uppercase",letterSpacing:"1px"}}>A venir</p>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {monthEvents.sort(([a],[b])=>a.localeCompare(b)).slice(0,4).flatMap(([k,evts]) =>
                evts.map(ev => (
                  <div key={ev.id} style={{display:"flex",alignItems:"center",gap:10,background:"#fff",borderRadius:12,padding:"8px 12px",border:"1px solid #ede6da"}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:ev.color,flexShrink:0}}/>
                    <span style={{flex:1,fontSize:12,color:"#4a3f35",fontWeight:500}}>{ev.title}</span>
                    <span style={{fontSize:10,color:"#c0a888",fontWeight:400}}>
                      {new Date(k+"T12:00:00").toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div onClick={() => { setModal(null); setNewTitle(""); }} style={{position:"fixed",inset:0,background:"rgba(74,63,53,0.2)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200,padding:"0 0 24px"}}>
          <div onClick={e => e.stopPropagation()} style={{background:"#faf6f0",borderRadius:"24px 24px 20px 20px",padding:"20px 22px 26px",width:"100%",maxWidth:420,boxShadow:"0 -6px 32px rgba(160,130,100,0.15)",border:"1px solid #ede6da"}}>
            <div style={{width:36,height:4,background:"#ddd4c4",borderRadius:2,margin:"0 auto 18px"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div>
                <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#4a3f35"}}>
                  {new Date(modal.date+"T12:00:00").toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
                </h3>
                <p style={{margin:"2px 0 0",fontSize:11,color:"#a89880"}}>{(events[modal.date]||[]).length} événement{(events[modal.date]||[]).length!==1?"s":""}</p>
              </div>
              <button onClick={() => { setModal(null); setNewTitle(""); }} style={{background:"#ede6da",border:"none",borderRadius:10,width:30,height:30,cursor:"pointer",fontSize:14,color:"#8a7a6a",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>

            {/* Event list */}
            <div style={{marginBottom:16,maxHeight:160,overflowY:"auto"}}>
              {(events[modal.date]||[]).length === 0
                ? <div style={{textAlign:"center",padding:"14px 0",color:"#c0a888",fontSize:13}}>Aucun événement</div>
                : (events[modal.date]||[]).map(ev => (
                  <div key={ev.id} style={{display:"flex",alignItems:"center",gap:10,background:"#fff",borderRadius:12,padding:"9px 12px",marginBottom:7,border:"1px solid #ede6da"}}>
                    <div style={{width:9,height:9,borderRadius:"50%",background:ev.color,flexShrink:0}}/>
                    <span style={{flex:1,fontSize:13,color:"#4a3f35",fontWeight:500}}>{ev.title}</span>
                    <button onClick={() => removeEvent(modal.date, ev.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#c0a888",fontSize:14,padding:"0 2px",lineHeight:1}}>×</button>
                  </div>
                ))
              }
            </div>

            {/* Add event */}
            <div style={{background:"#fff",borderRadius:18,padding:"16px",border:"1px solid #ede6da"}}>
              <p style={{margin:"0 0 10px",fontSize:10,fontWeight:700,color:"#c0a888",textTransform:"uppercase",letterSpacing:"0.8px"}}>Nouvel événement</p>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key==="Enter" && addEvent()}
                placeholder="Nom de l'événement..."
                style={{width:"100%",border:"1.5px solid #ede6da",borderRadius:12,padding:"9px 12px",fontSize:13,color:"#4a3f35",background:"#faf6f0",outline:"none",boxSizing:"border-box",marginBottom:12}}/>
              <div style={{display:"flex",gap:7,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
                {EVENT_COLORS.map(({color,label}) => (
                  <div key={color} onClick={() => setNewColor(color)} title={label}
                    style={{width:22,height:22,borderRadius:"50%",background:color,cursor:"pointer",
                      boxShadow: newColor===color ? "0 0 0 2.5px #faf6f0, 0 0 0 4px #8a7a6a" : "none",
                      transition:"box-shadow 0.15s"}}/>
                ))}
              </div>
              <button onClick={addEvent}
                style={{width:"100%",background:"#4a3f35",border:"none",borderRadius:14,padding:"11px",fontSize:13,fontWeight:700,color:"#faf6f0",cursor:"pointer",letterSpacing:"0.3px"}}>
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}
