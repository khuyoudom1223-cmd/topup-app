import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { paymentMethods } from '../data/paymentMethods';
import { checkPlayer, createOrder, fetchProducts, subscribeProductUpdates } from '../services/api';
import PackageCard from '../components/PackageCard';
import PaymentMethodCard from '../components/PaymentMethodCard';
import MobileLegendsQuickTopUp from '../components/MobileLegendsQuickTopUp';
import './TopUpPage.css';

export default function TopUpPage() {
  const { gameSlug } = useParams();

  if (gameSlug === 'mobile-legends') {
    return <MobileLegendsQuickTopUp />;
  }

  return <GenericTopUpPage gameSlug={gameSlug} />;
}

function GenericTopUpPage({ gameSlug }) {

  const [game, setGame] = useState(null);
  const [products, setProducts] = useState([]);
  const [gameLoading, setGameLoading] = useState(true);

  const [userId, setUserId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [playerInfo, setPlayerInfo] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState('');

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [orderLoading, setOrderLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const lastAutoCheckedRef = useRef('');
  const productRefreshTimerRef = useRef(null);

  // Load game and products from API
  useEffect(() => {
    setGameLoading(true);
    setPlayerInfo(null);
    setCheckError('');
    setSelectedPackage(null);
    setSelectedPayment(null);
    setOrderResult(null);
    setUserId('');
    setZoneId('');

    Promise.all([
      fetch(`/api/games/${gameSlug}`).then(r => r.json()),
      fetchProducts(gameSlug),
    ])
      .then(([gameRes, prods]) => {
        if (gameRes.success) setGame(gameRes.data);
        setProducts(prods);
      })
      .catch(err => console.error('Failed to load game:', err))
      .finally(() => setGameLoading(false));
  }, [gameSlug]);

  useEffect(() => {
    let ignore = false;

    const refreshProducts = async () => {
      try {
        const latestProducts = await fetchProducts(gameSlug);
        if (ignore) return;

        setProducts(latestProducts);
        setSelectedPackage((prev) => {
          if (!prev) return prev;
          const next = latestProducts.find((pkg) => String(pkg.id) === String(prev.id));
          return next || null;
        });
      } catch {
        // Keep existing products if live refresh fails.
      }
    };

    refreshProducts();
    productRefreshTimerRef.current = setInterval(refreshProducts, 5000);
    const unsubscribe = subscribeProductUpdates((event) => {
      if (!event?.gameSlug || event.gameSlug === gameSlug) {
        refreshProducts();
      }
    }, { gameSlug });

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        refreshProducts();
      }
    };

    window.addEventListener('focus', refreshProducts);
    document.addEventListener('visibilitychange', handleVisibilityRefresh);

    return () => {
      ignore = true;
      if (productRefreshTimerRef.current) {
        clearInterval(productRefreshTimerRef.current);
      }
      unsubscribe();
      window.removeEventListener('focus', refreshProducts);
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
    };
  }, [gameSlug]);

  const runPlayerCheck = useCallback(async (inputUserId, inputZoneId) => {
    if (!inputUserId.trim()) return;
    setCheckLoading(true);
    setCheckError('');
    setPlayerInfo(null);
    try {
      const result = await checkPlayer(gameSlug, inputUserId, inputZoneId);
      setPlayerInfo(result.data);
    } catch (err) {
      setCheckError(err.message);
    } finally {
      setCheckLoading(false);
    }
  }, [gameSlug]);

  const handleCheckId = async () => {
    await runPlayerCheck(userId, zoneId);
  };

  useEffect(() => {
    if (!game) return;

    const userReady = userId.trim().length >= 5;
    const zoneReady = game.requiresZoneId == 1 ? zoneId.trim().length >= 4 : true;

    if (!userReady || !zoneReady) {
      return;
    }

    const checkKey = `${gameSlug}:${userId.trim()}:${zoneId.trim()}`;
    if (lastAutoCheckedRef.current === checkKey) {
      return;
    }

    const timer = setTimeout(async () => {
      lastAutoCheckedRef.current = checkKey;
      await runPlayerCheck(userId.trim(), zoneId.trim());
    }, 550);

    return () => clearTimeout(timer);
  }, [game, gameSlug, userId, zoneId, runPlayerCheck]);

  const handlePay = async () => {
    if (!playerInfo || !selectedPackage || !selectedPayment) return;
    setOrderLoading(true);
    try {
      const result = await createOrder({
        game: gameSlug,
        userId,
        zoneId,
        productId: selectedPackage.id,
        paymentMethod: selectedPayment.id,
        playerNickname: playerInfo.nickname,
      });
      setOrderResult(result.data);
    } catch (err) {
      setCheckError(err.message);
    } finally {
      setOrderLoading(false);
    }
  };

  if (gameLoading) {
    return (
      <div className="topup-page">
        <div className="container topup-not-found">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="topup-page">
        <div className="container topup-not-found">
          <span className="not-found-icon">😵</span>
          <h2>Game Not Found</h2>
          <p>The game you&apos;re looking for doesn&apos;t exist.</p>
          <Link to="/" className="btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  const currentStep = !playerInfo ? 1 : !selectedPackage ? 2 : 3;

  return (
    <div className="topup-page">
      {/* Banner */}
      <div className="topup-banner" style={{ background: game.banner }}>
        <div className="container topup-banner-content">
          <Link to="/" className="back-btn">← Back</Link>
          <div className="banner-info">
            <span className="banner-icon">{game.icon}</span>
            <div>
              <h1 className="banner-title">{game.name}</h1>
              <p className="banner-publisher">{game.publisher}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container topup-content">
        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${playerInfo ? 'completed' : ''}`}>
            <div className="step-dot">{playerInfo ? '✓' : '1'}</div>
            <span>Enter ID</span>
          </div>
          <div className="step-line"></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${selectedPackage ? 'completed' : ''}`}>
            <div className="step-dot">{selectedPackage ? '✓' : '2'}</div>
            <span>Select Package</span>
          </div>
          <div className="step-line"></div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-dot">3</div>
            <span>Payment</span>
          </div>
        </div>

        {/* Order Result Modal */}
        {orderResult && (
          <div className="order-modal-overlay" onClick={() => setOrderResult(null)}>
            <div className="order-modal glass-card" onClick={e => e.stopPropagation()}>
              <span className="modal-icon">🎉</span>
              <h2>Order Created!</h2>
              <p className="modal-order-id">Order ID: <strong>{orderResult.orderId}</strong></p>
              <p className="modal-status">Status: <span className="badge badge-warning">⏳ Pending</span></p>
              <p className="modal-note">Your in-game currency will be delivered shortly.</p>
              <div className="modal-actions">
                <Link to={`/order-status?id=${orderResult.orderId}`} className="btn-primary">
                  Track Order
                </Link>
                <button className="btn-secondary" onClick={() => setOrderResult(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Enter ID */}
        <section className="topup-section">
          <h2 className="topup-section-title">
            <span className="section-num">1</span>
            Enter your {game.name} ID
          </h2>
          <div className="id-form">
            <div className="id-fields">
              <div className="field-group">
                <label>User ID</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter your User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  id="user-id-input"
                />
              </div>
              {game.requiresZoneId == 1 && (
                <div className="field-group">
                  <label>Zone ID</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter Zone ID"
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    id="zone-id-input"
                  />
                </div>
              )}
            </div>
            <button
              className="btn-primary check-btn"
              onClick={handleCheckId}
              disabled={!userId.trim() || checkLoading}
              id="check-id-btn"
            >
              {checkLoading ? '⏳ Checking...' : '🔍 Check ID (Auto-enabled)'}
            </button>

            {checkError && (
              <div className="check-error animate-fade-in">
                <span>❌</span> {checkError}
              </div>
            )}

            {playerInfo && (
              <div className="player-info animate-fade-in">
                <span className="player-avatar">👤</span>
                <div>
                  <p className="player-name">{playerInfo.nickname}</p>
                  <p className="player-level">Level {playerInfo.level}</p>
                </div>
                <span className="player-verified">✅ Verified</span>
              </div>
            )}
          </div>
        </section>

        {/* Step 2: Select Package */}
        {playerInfo && (
          <section className="topup-section animate-fade-in-up">
            <h2 className="topup-section-title">
              <span className="section-num">2</span>
              Select {game.currency} Package
            </h2>
            <div className="row packages-grid-row">
              {products.map(pkg => (
                <div key={pkg.id} className="col">
                  <PackageCard
                    pkg={pkg}
                    currency={game.currency}
                    selected={selectedPackage?.id === pkg.id}
                    onSelect={setSelectedPackage}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Step 3: Payment */}
        {selectedPackage && (
          <section className="topup-section animate-fade-in-up">
            <h2 className="topup-section-title">
              <span className="section-num">3</span>
              Select Payment Method
            </h2>
            <div className="row payment-methods-row">
              {paymentMethods.map(method => (
                <div key={method.id} className="col">
                  <PaymentMethodCard
                    method={method}
                    selected={selectedPayment?.id === method.id}
                    onSelect={setSelectedPayment}
                  />
                </div>
              ))}
            </div>

            {/* Order Summary */}
            {selectedPayment && (
              <div className="order-summary animate-fade-in">
                <h3>Order Summary</h3>
                <div className="summary-rows">
                  <div className="summary-row">
                    <span>Game</span>
                    <span>{game.name}</span>
                  </div>
                  <div className="summary-row">
                    <span>Player</span>
                    <span>{playerInfo.nickname}</span>
                  </div>
                  <div className="summary-row">
                    <span>Package</span>
                    <span>{selectedPackage.name}</span>
                  </div>
                  <div className="summary-row">
                    <span>Payment</span>
                    <span>{selectedPayment.name}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>${Number(selectedPackage.price).toFixed(2)}</span>
                  </div>
                </div>
                <button
                  className="btn-primary pay-btn"
                  onClick={handlePay}
                  disabled={orderLoading}
                  id="pay-now-btn"
                >
                  {orderLoading ? '⏳ Processing...' : `💳 Pay $${Number(selectedPackage.price).toFixed(2)}`}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
