import { useState, useEffect } from "react"
import "./TodoForm.css"

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

function TodoForm() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState("")

  useEffect(() => {
    store.get(["todos"]).then((r) => setTodos(r.todos || []))
  }, [])

  // Cross-tab sync: fires whenever another tab writes to storage
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage) return
    const listener = (changes) => {
      if (changes.todos) setTodos(changes.todos.newValue || [])
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  // Re-read when tab becomes visible, in case changes happened while hidden
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      store.get(["todos"]).then((r) => setTodos(r.todos || []))
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [])

  const saveTodos = (next) => {
    setTodos(next)
    store.set({ todos: next })
  }

  const addTodo = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    saveTodos([...todos, { id: Date.now(), text: input.trim(), done: false }])
    setInput("")
  }

  const toggleDone = (id) => {
    saveTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const deleteTodo = (id) => {
    saveTodos(todos.filter(t => t.id !== id))
  }

  const activeTodos = todos.filter(t => !t.done)
  const doneTodos = todos.filter(t => t.done)

  return (
    <div className="todo-wrapper">
      <h2 className="todo-heading">my todos</h2>

      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="what needs doing? ˚₊‧"
          className="todo-input"
        />
        <button type="submit" className="todo-add-btn">+ add</button>
      </form>

      {todos.length === 0 ? (
        <p className="todo-empty">nothing here yet~ add something above!</p>
      ) : (
        <ul className="todo-list">
          {activeTodos.map(t => (
            <li key={t.id} className="todo-item">
              <button onClick={() => toggleDone(t.id)} className="todo-check-btn" />
              <span className="todo-item-text">{t.text}</span>
              <button onClick={() => deleteTodo(t.id)} className="todo-delete-btn">✕</button>
            </li>
          ))}
          {doneTodos.length > 0 && (
            <>
              <p className="done-label">done ✓</p>
              {doneTodos.map(t => (
                <li key={t.id} className="todo-item todo-item--done">
                  <button onClick={() => toggleDone(t.id)} className="todo-check-btn checked" />
                  <span className="todo-item-text">{t.text}</span>
                  <button onClick={() => deleteTodo(t.id)} className="todo-delete-btn">✕</button>
                </li>
              ))}
            </>
          )}
        </ul>
      )}

      <p className="todo-counter">
        {activeTodos.length} task{activeTodos.length !== 1 ? "s" : ""} remaining
      </p>
    </div>
  )
}

export default TodoForm
