import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <img src="/favicon.svg" alt="OUDOM Logo" className="logo-icon-img" />
            <span className="logo-text">OUDOM<span className="logo-accent">TopUp</span></span>
          </Link>
          <p className="footer-tagline">Instant game top-up. Fast, safe, and reliable.</p>
        </div>

        <div className="footer-columns">
          <div className="footer-col">
            <h4>Popular Games</h4>
            <ul>
              <li><Link to="/topup/mobile-legends">Mobile Legends</Link></li>
              <li><Link to="/topup/free-fire">Free Fire</Link></li>
              <li><Link to="/topup/pubg-mobile">PUBG Mobile</Link></li>
              <li><Link to="/topup/valorant">Valorant</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><Link to="/order-status">Track Order</Link></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
          <div className="footer-col payment-col">
            <h4>Payment Methods</h4>
            <div className="payment-icons">
              <span title="ABA Pay">🏦</span>
              <span title="Wing">📱</span>
              <span title="Credit Card">💳</span>
              <span title="Crypto">₿</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 OUDOMTopUp. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
