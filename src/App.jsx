import { useState, useEffect } from 'react'
import './App.css'
import DashBoard from './Pages/Dashboard'
import Landing from './Pages/Landing'

function App() {
  const [character, setCharacter] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['character'], (result) => {
        setCharacter(result.character || null)
        setLoading(false)
      })
    } else {
      // fallback for npm run dev in regular browser
      const saved = localStorage.getItem('character')
      setCharacter(saved || null)
      setLoading(false)
    }
  }, [])

  if (loading) return null

  return (
    <>
      {character ? <DashBoard character={character} /> : <Landing onSelect={setCharacter} />}
    </>
  )
}

export default App
