import { Link } from 'react-router-dom';
import './GameCard.css';

export default function GameCard({ game, index }) {
  return (
    <Link
      to={`/topup/${game.slug}`}
      className={`game-card animate-fade-in-up delay-${(index % 6) + 1}`}
      style={{ '--accent': game.accentColor }}
    >
      <div className="game-card-banner" style={{ background: game.banner }}>
        <span className="game-card-icon">{game.icon}</span>
      </div>
      <div className="game-card-body">
        <h3 className="game-card-title">{game.name}</h3>
        <p className="game-card-publisher">{game.publisher}</p>
        <button className="game-card-btn">Top Up Now</button>
      </div>
    </Link>
  );
}
