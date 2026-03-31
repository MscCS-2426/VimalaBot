import { Link } from "react-router-dom";
import "./Layout.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <h2 className="logo">Vimala Bot</h2>

      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/faq">FAQ</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/login">Dashboard</Link></li>
      </ul>

      <Link to="/login" className="nav-btn">
        Start Chat
      </Link>
    </nav>
  );
};

export default Navbar;
