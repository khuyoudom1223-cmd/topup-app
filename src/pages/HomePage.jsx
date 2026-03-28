import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchGames } from '../services/api';
import GameCard from '../components/GameCard';
import MobileLegendsQuickTopUp from '../components/MobileLegendsQuickTopUp';
import mlLogo from '../assets/photo_2026-03-26_20-14-27.jpg';
import './HomePage.css';

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');

  const categories = ['All', 'Mobile Games', 'PC Games', 'Vouchers'];

  useEffect(() => {
    fetchGames()
      .then(data => setGames(data))
      .catch(err => console.error('Failed to load games:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredGames = useMemo(() => {
    let result = games;
    if (category !== 'All') {
      result = result.filter(g => g.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.publisher.toLowerCase().includes(q) ||
        g.currency.toLowerCase().includes(q)
      );
    }

    // Embed the custom high-quality logo asset for Mobile Legends, Free Fire, PUBG, and Valorant 
    return result.map(g => {
      if (g.slug === 'mobile-legends') {
        return { 
          ...g, 
          icon: <img src={mlLogo} alt="MLBB Logo" className="custom-game-logo" />
        };
      }
      if (g.code === 'free-fire' || g.slug === 'free-fire') {
        return {
          ...g,
          icon: <img src="/image/download.jpeg" alt="Free Fire Logo" className="custom-game-logo" />
        };
      }
      if (g.code === 'pubg-mobile' || g.slug === 'pubg-mobile') {
        return {
          ...g,
          icon: <img src="/image/download (1).jpeg" alt="PUBG Mobile Logo" className="custom-game-logo" />
        };
      }
      if (g.code === 'valorant' || g.slug === 'valorant') {
        return {
          ...g,
          icon: <img src="/image/download (2).jpeg" alt="Valorant Logo" className="custom-game-logo" />
        };
      }
      return g;
    });
  }, [search, games, category]);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="container hero-content">
          <h1 className="hero-title animate-fade-in-up">
            Instant Game <span className="gradient-text">Top-Up</span>
          </h1>
          <p className="hero-subtitle animate-fade-in-up delay-1">
            Purchase in-game currency for your favorite games. Fast, safe, and reliable.
          </p>
          <div className="hero-search animate-fade-in-up delay-2">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="game-search"
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        <div className="container stats-inner">
          <div className="stat-item">
            <span className="stat-value">500K+</span>
            <span className="stat-label">Transactions</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{games.length}+</span>
            <span className="stat-label">Games</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">99.9%</span>
            <span className="stat-label">Success Rate</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">⚡ Instant</span>
            <span className="stat-label">Delivery</span>
          </div>
        </div>
      </section>

      {/* Featured Game Section */}
      <section className="featured-game-section" style={{ padding: 'var(--space-xl) 0 0' }}>
        <div className="container">
          <MobileLegendsQuickTopUp />
        </div>
      </section>

      {/* Games Grid */}
      <section className="games-section">
        <div className="container">

          <div className="category-filters">
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-pill ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <h2 className="section-title">
            {search ? `Results for "${search}"` : category !== 'All' ? `${category}` : 'Popular Games'}
          </h2>

          {loading ? (
            <div className="no-results">
              <div className="loading-spinner"></div>
              <p>Loading games...</p>
            </div>
          ) : filteredGames.length > 0 ? (
            <div className="row games-grid-row">
              {filteredGames.map((game, i) => (
                <div key={game.id} className="col">
                  <GameCard game={game} index={i} />
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <span className="no-results-icon">🎮</span>
              <p>No games found for &quot;{search}&quot;</p>
              <button className="btn-secondary" onClick={() => setSearch('')}>
                Clear Search
              </button>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="row steps-grid-row">
            <div className="col">
              <div className="step-card glass-card">
                <span className="step-number">1</span>
                <span className="step-icon">🎮</span>
                <h3>Select Game</h3>
                <p>Choose your favorite game from our collection</p>
              </div>
            </div>
            <div className="col">
              <div className="step-card glass-card">
                <span className="step-number">2</span>
                <span className="step-icon">🆔</span>
                <h3>Enter User ID</h3>
                <p>Enter your game ID to verify your account</p>
              </div>
            </div>
            <div className="col">
              <div className="step-card glass-card">
                <span className="step-number">3</span>
                <span className="step-icon">💎</span>
                <h3>Choose Package</h3>
                <p>Select the currency package you want</p>
              </div>
            </div>
            <div className="col">
              <div className="step-card glass-card">
                <span className="step-number">4</span>
                <span className="step-icon">💳</span>
                <h3>Pay & Receive</h3>
                <p>Complete payment and receive instantly</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
