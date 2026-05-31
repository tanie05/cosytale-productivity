
import CocoDaisy from "../assets/cosytales/cocodaisy.png"
import './Landing.css'

function Landing ({ onSelect }) {

    const pick = (character) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ character })
        } else {
            localStorage.setItem('character', character)
        }
        onSelect(character)
    }

    return (
        <div className="landing-parent-div">
            <img src={CocoDaisy} alt="Landing" className="landingImg" />
            <p className="landing-title">who are you? ♡</p>
            <button className="landingBtn" onClick={() => pick("coco")}>
                I'm Coco 🐾
            </button>
            <button className="landingBtn" onClick={() => pick("daisy")}>
                I'm Daisy 🌸
            </button>
        </div>
    )
}

export default Landing