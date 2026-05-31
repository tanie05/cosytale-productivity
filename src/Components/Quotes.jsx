import { useEffect, useState } from "react"
import axios from "axios";
import "./Quotes.css";

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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function Quotes() {
  const [quote, setQuote] = useState(null)

  useEffect(() => {
    const loadQuote = async () => {
      const { cachedQuote } = await store.get(["cachedQuote"]);
      if (cachedQuote && cachedQuote.date === todayStr()) {
        setQuote(cachedQuote);
        return;
      }

      try {
        const response = await axios.get(
          "https://api.api-ninjas.com/v2/quoteoftheday?category=happiness",
          { headers: { "x-api-key": "O0NWYrrIEAeAYmBBF6jqLHWNoxiu0uuYfyBXN6A1" } }
        );
        const q = response.data[0];
        const toCache = { quote: q.quote, author: q.author, date: todayStr() };
        store.set({ cachedQuote: toCache });
        setQuote(toCache);
      } catch (error) {
        if (cachedQuote) setQuote(cachedQuote);
        console.error(error);
      }
    };

    loadQuote();
  }, [])

  if (!quote) return null

  return (
    <div className="quote-parent">
      <p>"{quote.quote}"</p>
      <p>— {quote.author}</p>
    </div>
  )
}

export default Quotes
