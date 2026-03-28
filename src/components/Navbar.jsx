import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('topupgg_user') || 'null');
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const user = getStoredUser();

  const isActive = (path) => {
    if (Array.isArray(path)) {
      return path.includes(location.pathname);
    }
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <img src="/favicon.svg" alt="OUDOM Logo" className="logo-icon-img" />
          <span className="logo-text">OUDOM<span className="logo-accent">TopUp</span></span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/order-status"
            className={`nav-link ${isActive('/order-status') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Track Order
          </Link>
          
          {user?.type === 'admin' && (
            <Link
              to="/admin"
              className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Admin Dashboard
            </Link>
          )}

          {user ? (
            <Link 
              to="/dashboard"
              className={`nav-link ${isActive(['/dashboard', '/profile']) ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              📊 Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className={`nav-link ${isActive('/login') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>

        <button
          className={`navbar-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}
