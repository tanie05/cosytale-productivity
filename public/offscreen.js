// Cosytales Productivity — Offscreen document
// Lives in a hidden page with AUDIO_PLAYBACK reason so it can use the Web Audio /
// HTMLAudioElement APIs that are unavailable inside a service worker.

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.target !== "offscreen" || msg.type !== "play-sound") return;

  const audio = new Audio(msg.soundUrl);
  audio.play().catch((err) => {
    // Autoplay was blocked (rare for offscreen docs with AUDIO_PLAYBACK, but
    // handle gracefully rather than throwing an unhandled rejection).
    console.warn("[cosytales] completion sound blocked:", err);
  });

  // chrome.offscreen is only available in the service worker, not here.
  // Message the background to close this document once playback finishes.
  audio.addEventListener("ended", () => {
    chrome.runtime.sendMessage({ type: "OFFSCREEN_DONE" });
  });
});
