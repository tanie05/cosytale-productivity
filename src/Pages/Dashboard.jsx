import { useState } from "react";
import Quotes from "../Components/Quotes";
import Timer from "../Components/Timer";
import TodoForm from "../Components/TodoForm";
import Footer from "../Components/Footer";
import "./Dashboard.css";

import cocoWorking from "./../assets/cosytales/cocoWorking.gif";
import cocoEating from "./../assets/cosytales/cocoEating.gif";
import cocoMorning from "./../assets/cosytales/cocoMorning.gif";
import daisyWorking from "./../assets/cosytales/daisyWorking.gif";
import daisyMorning from "./../assets/cosytales/daisyMorning.gif";
import daisyEating from "./../assets/cosytales/daisyEating.jpg"
import defaultImg from "./../assets/cosytales/default.gif";

const GIF_MAP = {
  coco: {
    working: cocoWorking,
    break: cocoEating,
    idle: defaultImg,
  },
  daisy: {
    working: daisyWorking,
    break: daisyEating,
    idle: defaultImg,
  },
};

const MOOD_LABELS = {
  working: "focus mode on~",
  break: "taking a lil break~",
  idle: "ready when you are~",
};

function getGifState(mode, isRunning) {
  if (!isRunning) return "idle";
  if (mode === "pomodoro") return "working";
  return "break";
}

function DashBoard({ character }) {
  const [timerMode, setTimerMode] = useState("pomodoro");
  const [timerRunning, setTimerRunning] = useState(false);

  const handleTimerState = (mode, running) => {
    setTimerMode(mode);
    setTimerRunning(running);
  };

  const char = character || "coco";
  const gifState = getGifState(timerMode, timerRunning);
  const gifSrc = GIF_MAP[char]?.[gifState] ?? GIF_MAP.coco[gifState];
  const moodLabel = MOOD_LABELS[gifState];

  return (
    <div className="dashboard">
      <Footer character={character} />
      <div className="dashboard-quote-bar">
        <Quotes />
      </div>

      <div className="dashboard-main">
        <div className="todo-panel">
          <TodoForm />
        </div>

        <div className="side-panel">
          <Timer onStateChange={handleTimerState} />

          <div className={`gif-card gif-card--${gifState}`}>
            <img src={gifSrc} alt={`${char} ${gifState}`} className="gif-card__img" />
            <span className="gif-card__label">{moodLabel}</span>
          </div>
        </div>
      </div>

      
    </div>
  );
}

export default DashBoard;
