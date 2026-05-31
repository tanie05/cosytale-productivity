// Cosytales Productivity — MV3 Service Worker
// Handles toolbar-icon clicks, timer alarms, audio playback via the Offscreen API,
// and desktop notifications. Runs in the background regardless of which tab is active.

// ── Toolbar icon click — open or focus the app tab ──────────────────────────

const APP_URL = chrome.runtime.getURL("index.html");

chrome.action.onClicked.addListener(async () => {
  // If the app is already open in a tab, just focus it; otherwise open a new one.
  const [existing] = await chrome.tabs.query({ url: APP_URL });
  if (existing?.id != null) {
    await chrome.tabs.update(existing.id, { active: true });
    if (existing.windowId != null) {
      await chrome.windows.update(existing.windowId, { focused: true });
    }
  } else {
    chrome.tabs.create({ url: APP_URL });
  }
});

const ALARM_NAME = "timerEnd";

// Cache the sound URL and mode sent by Timer.jsx so the alarm handler can use them
// even if the new-tab page has been closed.
let pendingSoundUrl = null;
let pendingMode = "pomodoro";

// ── Messages from the Timer UI ──────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "TIMER_START") {
    // Schedule an alarm to fire at the absolute end-time so expiry is detected
    // even when no extension tab is open or focused.
    pendingSoundUrl = msg.soundUrl || null;
    pendingMode = msg.mode || "pomodoro";
    chrome.alarms.create(ALARM_NAME, { when: msg.endTime });
    sendResponse({ ok: true });
  } else if (msg.type === "TIMER_CANCEL") {
    // User paused, reset, or changed mode — discard the alarm.
    chrome.alarms.clear(ALARM_NAME);
    pendingSoundUrl = null;
    sendResponse({ ok: true });
  } else if (msg.type === "OFFSCREEN_DONE") {
    // Offscreen doc signals audio finished; close it to free resources.
    chrome.offscreen.closeDocument().catch(() => {});
    sendResponse({ ok: true });
  }
  // Return true to keep the message channel open for async sendResponse.
  return true;
});

// ── Alarm handler ────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  // 1. Clear running state so any open new-tab page resyncs to 00:00.
  await chrome.storage.local.set({ timerRunning: false, timerEndTime: null });

  // 2. Play completion sound via an Offscreen document (service workers have no
  //    DOM / Web Audio access).
  if (pendingSoundUrl) {
    await ensureOffscreen();
    chrome.runtime.sendMessage({
      target: "offscreen",
      type: "play-sound",
      soundUrl: pendingSoundUrl,
    });
  }

  // 3. Show a desktop notification.
  const modeLabels = {
    pomodoro: "Pomodoro",
    shortBreak: "Short Break",
    longBreak: "Long Break",
  };
  const modeLabel = modeLabels[pendingMode] || "Timer";
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "Time's up! 🎉",
    message: `${modeLabel} complete. Take a moment to breathe.`,
  });

  pendingSoundUrl = null;
});

// ── Offscreen helpers ────────────────────────────────────────────────────────

async function ensureOffscreen() {
  // chrome.offscreen.hasDocument() is the canonical guard to avoid creating
  // duplicate offscreen documents (only one may exist at a time in MV3).
  const exists = await chrome.offscreen.hasDocument();
  if (!exists) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Play timer-completion sound regardless of active tab",
    });
  }
}
