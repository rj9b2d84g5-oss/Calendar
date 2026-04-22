import { useState, useEffect, useCallback } from "react";
import "./App.css";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const STORAGE_KEY = "pillbox_v4";

const MSG_OK = [
  "Bravo ! Tu prends soin de toi, et c'est magnifique.",
  "Ta pilule du jour est prise. Continue comme ça !",
  "Belle journée en perspective. Ton corps te remercie.",
  "Tout est en ordre. Prends soin de toi aujourd'hui.",
];
const MSG_ALERT = [
  "N'oublie pas ta pilule d'aujourd'hui, elle t'attend !",
  "Hey toi ! Un petit geste pour ta santé, ça ne prend qu'une seconde.",
  "Ta pilule du jour est encore là. Pense à la prendre !",
];
const EMO_OK = ["🌿", "🌸", "✨", "💛", "🌼"];
const EMO_ALERT = ["🔔", "⏰", "💊", "🌻"];

const ROWS = [[0, 1, 2], [3, 4, 5], [6]];

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const todayIdx = () => {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
};
const formatDate = () =>
  new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage unavailable */
  }
  return {};
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [closingPill, setClosingPill] = useState(null);
  const ti = todayIdx();

  const todayTaken = !!(state[ti] && state[ti].taken);
  const [greeting, setGreeting] = useState(() =>
    todayTaken
      ? { emoji: pick(EMO_OK), text: pick(MSG_OK) }
      : { emoji: pick(EMO_ALERT), text: pick(MSG_ALERT) }
  );

  useEffect(() => {
    document.body.classList.toggle("alert", !todayTaken);
    return () => document.body.classList.remove("alert");
  }, [todayTaken]);

  const refreshGreeting = useCallback((taken) => {
    setGreeting(
      taken
        ? { emoji: pick(EMO_OK), text: pick(MSG_OK) }
        : { emoji: pick(EMO_ALERT), text: pick(MSG_ALERT) }
    );
  }, []);

  const updateSlot = useCallback((idx, updater) => {
    setState((prev) => {
      const cur = prev[idx] || { open: false, taken: false };
      const next = { ...prev, [idx]: updater(cur) };
      saveState(next);
      return next;
    });
  }, []);

  const toggleLid = (idx) => (e) => {
    e.stopPropagation();
    updateSlot(idx, (cur) => ({ ...cur, open: !cur.open }));
  };

  const takePill = (idx) => (e) => {
    e.stopPropagation();
    const cur = state[idx] || { open: false, taken: false };
    if (cur.taken) return;
    setClosingPill(idx);
  };

  const onPillAnimationEnd = (idx) => () => {
    if (closingPill === idx) {
      updateSlot(idx, (cur) => ({ ...cur, taken: true }));
      setClosingPill(null);
      if (idx === ti) refreshGreeting(true);
    }
  };

  return (
    <div className="pillbox-app">
      <div className="container">
        <header className="pillbox-header">
          <div className="title">Mon Pilulier</div>
          <div className="date">{formatDate()}</div>
        </header>

        <div className="pillbox">
          {ROWS.map((group, ri) => (
            <div key={ri} className={"row" + (ri === 2 ? " last" : "")}>
              {group.map((i) => {
                const s = state[i] || { open: false, taken: false };
                const isToday = i === ti;
                const isClosing = closingPill === i;
                const showPill = s.open && !s.taken;

                return (
                  <div
                    key={i}
                    className={
                      "slot" +
                      (isToday ? " today" : "") +
                      (s.open ? " open" : "")
                    }
                  >
                    <div className="day-tag">{DAYS[i]}</div>
                    <div className="box-wrap">
                      <div className="tray">
                        <div className={"cavity" + (s.taken ? " empty" : "")}>
                          {showPill && (
                            <div
                              className={"pill" + (isClosing ? " pop-out" : "")}
                              onClick={takePill(i)}
                              onAnimationEnd={onPillAnimationEnd(i)}
                            >
                              <div className="pill-l" />
                              <div className="pill-r" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="lid" onClick={toggleLid(i)}>
                        <div className="lid-label">{DAYS[i]}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="message-area">
          <div className="msg-emoji">{greeting.emoji}</div>
          <div className="msg-text">{greeting.text}</div>
        </div>
      </div>
    </div>
  );
}
