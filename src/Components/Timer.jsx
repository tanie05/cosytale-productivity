import { useEffect, useState, useRef } from "react";
import "./Timer.css";
import completionSound from "../assets/cosytales/completion_sound.mp3";

const MODES = {
  pomodoro: { label: "Pomodoro", seconds: 25 * 60 },
  shortBreak: { label: "Short Break", seconds: 5 * 60 },
  longBreak: { label: "Long Break", seconds: 15 * 60 },
};

const store = {
  get: (keys) =>
    new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.get(keys, resolve);
      } else {
        const r = {};
        keys.forEach((k) => {
          const v = localStorage.getItem(k);
          if (v !== null) r[k] = JSON.parse(v);
        });
        resolve(r);
      }
    }),
  set: (obj) => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set(obj);
    } else {
      Object.entries(obj).forEach(([k, v]) =>
        localStorage.setItem(k, JSON.stringify(v))
      );
    }
  },
};

const TIMER_KEYS = ["timerMode", "timerRunning", "timerEndTime", "timerPaused"];

// Send a fire-and-forget message to the background service worker.
// Silently no-ops in a regular browser (npm run dev) where chrome.runtime is absent.
const notifyWorker = (msg) => {
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage(msg).catch(() => {});
  }
};

function applyStoredState(r, setMode, setSecondsLeft, setIsRunning) {
  const m = r.timerMode || "pomodoro";
  setMode(m);
  if (r.timerRunning && r.timerEndTime) {
    const remaining = Math.max(0, Math.floor((r.timerEndTime - Date.now()) / 1000));
    setSecondsLeft(remaining);
    setIsRunning(remaining > 0);
    if (remaining === 0) store.set({ timerRunning: false, timerEndTime: null });
  } else {
    setIsRunning(false);
    setSecondsLeft(r.timerPaused !== undefined ? r.timerPaused : MODES[m].seconds);
  }
}

function Timer({ onStateChange }) {
  const [mode, setMode] = useState("pomodoro");
  const [secondsLeft, setSecondsLeft] = useState(MODES.pomodoro.seconds);
  const [isRunning, setIsRunning] = useState(false);
  const initialized = useRef(false);

  // Load on mount
  useEffect(() => {
    store.get(TIMER_KEYS).then((r) => {
      applyStoredState(r, setMode, setSecondsLeft, setIsRunning);
      initialized.current = true;
    });
  }, []);

  // Cross-tab sync — listen for ANY timer key change, then re-read everything.
  // This handles the case where timerRunning stays "true" across tabs
  // (onChanged only fires when a value actually changes, so checking timerEndTime
  // catches a new timer started while another was already running).
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage) return;
    const listener = (changes) => {
      if (!initialized.current) return;
      if (!TIMER_KEYS.some((k) => k in changes)) return;
      store.get(TIMER_KEYS).then((r) =>
        applyStoredState(r, setMode, setSecondsLeft, setIsRunning)
      );
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // Recalculate from endTime when tab becomes visible again.
  // setInterval is throttled by Chrome in background tabs, so the display
  // drifts — this snaps it back to the correct time on focus.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      store.get(TIMER_KEYS).then((r) =>
        applyStoredState(r, setMode, setSecondsLeft, setIsRunning)
      );
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Tick
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          store.set({ timerRunning: false, timerEndTime: null });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const start = () => {
    const endTime = Date.now() + secondsLeft * 1000;
    store.set({ timerRunning: true, timerEndTime: endTime, timerMode: mode });
    setIsRunning(true);
    // Tell the service worker to schedule an alarm at the exact end-time so
    // the completion sound fires even when this tab is backgrounded or closed.
    notifyWorker({ type: "TIMER_START", endTime, mode, soundUrl: completionSound });
  };

  const pause = () => {
    store.set({ timerRunning: false, timerEndTime: null, timerPaused: secondsLeft });
    setIsRunning(false);
    notifyWorker({ type: "TIMER_CANCEL" });
  };

  const reset = () => {
    const secs = MODES[mode].seconds;
    store.set({ timerRunning: false, timerEndTime: null, timerPaused: secs });
    setIsRunning(false);
    setSecondsLeft(secs);
    notifyWorker({ type: "TIMER_CANCEL" });
  };

  const handleModeChange = (newMode) => {
    const secs = MODES[newMode].seconds;
    store.set({ timerMode: newMode, timerRunning: false, timerEndTime: null, timerPaused: secs });
    setMode(newMode);
    setIsRunning(false);
    setSecondsLeft(secs);
    notifyWorker({ type: "TIMER_CANCEL" });
  };

  useEffect(() => {
    onStateChange?.(mode, isRunning);
  }, [mode, isRunning]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = 1 - secondsLeft / MODES[mode].seconds;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="timer-container">
      { !isRunning &&
        <div className="timer-modes">
        {Object.entries(MODES).map(([key, { label }]) => (

            <button
            key={key}
            className={`mode-btn ${mode === key ? "active" : ""}`}
            onClick={() => handleModeChange(key)}
          >
            {label}
          </button>
        ))}
      </div>
      }

      <div className="timer-ring-wrapper">
        <svg className="timer-ring" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} className="ring-track" />
          <circle
            cx="100"
            cy="100"
            r={radius}
            className="ring-progress"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>
        <div className="timer-display">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      <div className="timer-controls">
        {isRunning ? (
          <button className="control-btn pause-btn" onClick={pause}>Pause</button>
        ) : (
          <button className="control-btn start-btn" onClick={start}>Start</button>
        )}
        <button className="control-btn reset-btn" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

export default Timer;
