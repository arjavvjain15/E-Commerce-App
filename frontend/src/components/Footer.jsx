import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-bottom" style={{marginTop:"-20px", textAlign:"center"}}>
        <span>© {new Date().getFullYear()} E-Commerce App. All Rights Reserved.</span>
      </div>
    </footer>
  );
}

export default Footer;