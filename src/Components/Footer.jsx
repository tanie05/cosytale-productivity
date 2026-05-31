import coco from "../assets/cosytales/cocoProfile.jpg"
import daisy from "../assets/cosytales/daisyProfile.jpg"
import "./Footer.css"

const PROFILES = { coco, daisy };
const NAMES = { coco: "coco", daisy: "daisy" };

function Footer({ character }) {
  if (!character) return null;
  const src = PROFILES[character];
  const name = NAMES[character];

  return (
    <footer className="footer">
      <div className="footer-left">
        <span className="footer-tagline">stay cozy, stay focused ˚₊‧</span>
      </div>
      <div className="footer-right">
        <span className="footer-name">{name}</span>
        <div className="footer-avatar-wrap">
          <img src={src} alt={name} className="footer-avatar" />
          <div className="footer-avatar-preview">
            <img src={src} alt={name} />
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
