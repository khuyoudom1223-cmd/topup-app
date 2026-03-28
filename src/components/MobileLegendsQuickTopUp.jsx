import { useState, useEffect } from 'react';
import { checkPlayer, checkPlayerHealth, createOrder, fetchProducts, subscribeProductUpdates } from '../services/api';
import './MobileLegendsQuickTopUp.css';
import mlLogo from '../assets/photo_2026-03-26_20-14-27.jpg';
const VERIFY_TIMEOUT_MS = 8000;
const LS_PACKAGE_KEY = 'ml_quick_topup_selected_package';
const LS_PAYMENT_KEY = 'ml_quick_topup_selected_payment';
const LS_RECEIPT_KEY = 'ml_quick_topup_last_receipt';
const PRODUCT_REFRESH_INTERVAL_MS = 5000;

const FALLBACK_PACKAGE_OPTIONS = [
  { id: 1, amount: 100, name: 'Starter Pack', price: 1.99, icon: '💎', imageSrc: '', title: '' },
  { id: 2, amount: 310, name: 'Standard Pack', price: 4.99, icon: '💎', imageSrc: '', title: '' },
  { id: 3, amount: 520, name: 'Popular Pack', price: 7.99, icon: '💎', imageSrc: '', title: '' },
  { id: 4, amount: 1060, name: 'Pro Pack', price: 14.99, icon: '💎', imageSrc: '', title: '' },
];

const PAYMENT_METHOD_OPTIONS = [
  { id: 'aba', name: 'ABA Pay', image: '/image/unnamed.webp', tone: 'aba' },
  { id: 'wing', name: 'Wing', image: '/image/download (3).jpeg', tone: 'wing' },
  { id: 'truemoney', name: 'TrueMoney', image: '/image/download (1).png', tone: 'truemoney' }
];

export default function MobileLegendsQuickTopUp() {
  const [userId, setUserId] = useState('');
  const [serverId, setServerId] = useState('');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isPlayerApiHealthy, setIsPlayerApiHealthy] = useState(true);
  const [isCheckingPlayerApi, setIsCheckingPlayerApi] = useState(false);
  const [lastPreflightAt, setLastPreflightAt] = useState('');
  
  const [verifying, setVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [lastVerifiedAt, setLastVerifiedAt] = useState('');
  const [verifyNonce, setVerifyNonce] = useState(0);

  const [packageOptions, setPackageOptions] = useState(FALLBACK_PACKAGE_OPTIONS);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [copiedReference, setCopiedReference] = useState('');
  const [liveMode, setLiveMode] = useState('polling');

  useEffect(() => {
    let ignore = false;

    const normalizePackage = (pkg) => {
      const amount = Number(pkg.amount || 0);
      const name = String(pkg.name || pkg.product_name || '').trim() || 'Diamond Package';
      const imageSrc = String(pkg.imageSrc || pkg.image_path || pkg.imageUrl || '').trim();
      return {
        id: pkg.id,
        amount,
        name,
        price: Number(pkg.price || 0),
        icon: '💎',
        imageSrc,
        popular: Number(pkg.popular || 0) === 1 || pkg.popular === true,
        title: String(pkg.description ?? pkg.title ?? pkg.caption ?? '').trim(),
      };
    };

    const loadPackages = async () => {
      try {
        const liveProducts = await fetchProducts('mobile-legends');
        const normalized = Array.isArray(liveProducts)
          ? liveProducts
              .map(normalizePackage)
              .filter((pkg) => pkg.id !== undefined && pkg.amount > 0 && pkg.price >= 0)
              .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
          : [];

        if (!ignore) {
          setPackageOptions(normalized.length > 0 ? normalized : FALLBACK_PACKAGE_OPTIONS);
        }
      } catch {
        // Keep current options when live refresh fails.
        if (!ignore) {
          setLiveMode('polling');
        }
      }
    };

    loadPackages();
    const intervalId = setInterval(loadPackages, PRODUCT_REFRESH_INTERVAL_MS);
    const unsubscribe = subscribeProductUpdates((event) => {
      if (event?.type === 'open') {
        setLiveMode('realtime');
      }
      if (event?.type === 'error') {
        setLiveMode('polling');
      }
      if (event?.type === 'connected') {
        setLiveMode('realtime');
      }
      if (!event?.gameSlug || event.gameSlug === 'mobile-legends') {
        loadPackages();
      }
    }, { gameSlug: 'mobile-legends' });

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        loadPackages();
      }
    };

    const handleLocalProductChange = (event) => {
      const targetSlug = event?.detail?.gameSlug;
      if (!targetSlug || targetSlug === 'mobile-legends') {
        loadPackages();
      }
    };

    window.addEventListener('focus', loadPackages);
    document.addEventListener('visibilitychange', handleVisibilityRefresh);
    window.addEventListener('products:changed', handleLocalProductChange);

    return () => {
      ignore = true;
      clearInterval(intervalId);
      unsubscribe();
      window.removeEventListener('focus', loadPackages);
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
      window.removeEventListener('products:changed', handleLocalProductChange);
    };
  }, []);

  useEffect(() => {
    setSelectedPackage((prev) => {
      if (!prev) return prev;
      const next = packageOptions.find((pkg) => String(pkg.id) === String(prev.id));
      return next || null;
    });
  }, [packageOptions]);

  useEffect(() => {
    try {
      const savedPackage = localStorage.getItem(LS_PACKAGE_KEY);
      const savedPayment = localStorage.getItem(LS_PAYMENT_KEY);
      const savedReceipt = localStorage.getItem(LS_RECEIPT_KEY);

      if (savedPackage) {
        const parsedPackage = JSON.parse(savedPackage);
        const packageMatch = packageOptions.find((pkg) => String(pkg.id) === String(parsedPackage?.id));
        if (packageMatch) setSelectedPackage(packageMatch);
      }

      if (savedPayment) {
        const parsedPayment = JSON.parse(savedPayment);
        const paymentMatch = PAYMENT_METHOD_OPTIONS.find((method) => method.id === parsedPayment?.id);
        if (paymentMatch) setSelectedPayment(paymentMatch);
      }

      if (savedReceipt) {
        const parsedReceipt = JSON.parse(savedReceipt);
        if (parsedReceipt?.reference) {
          setReceipt(parsedReceipt);
        }
      }
    } catch {
      // Ignore malformed persisted values and continue with defaults.
    }
  }, [packageOptions]);

  useEffect(() => {
    try {
      if (selectedPackage) {
        localStorage.setItem(LS_PACKAGE_KEY, JSON.stringify(selectedPackage));
      } else {
        localStorage.removeItem(LS_PACKAGE_KEY);
      }
    } catch {
      // Ignore localStorage write errors.
    }
  }, [selectedPackage]);

  useEffect(() => {
    try {
      if (selectedPayment) {
        localStorage.setItem(LS_PAYMENT_KEY, JSON.stringify(selectedPayment));
      } else {
        localStorage.removeItem(LS_PAYMENT_KEY);
      }
    } catch {
      // Ignore localStorage write errors.
    }
  }, [selectedPayment]);

  useEffect(() => {
    try {
      if (receipt) {
        localStorage.setItem(LS_RECEIPT_KEY, JSON.stringify(receipt));
      }
    } catch {
      // Ignore localStorage write errors.
    }
  }, [receipt]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const runHealthCheck = async () => {
      if (!isOnline) {
        setIsPlayerApiHealthy(true);
        return;
      }

      if (!ignore) setIsCheckingPlayerApi(true);
      try {
        await checkPlayerHealth();
        if (!ignore) setIsPlayerApiHealthy(true);
      } catch {
        if (!ignore) setIsPlayerApiHealthy(false);
      } finally {
        if (!ignore) {
          setIsCheckingPlayerApi(false);
          setLastPreflightAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }
    };

    runHealthCheck();

    const intervalId = setInterval(() => {
      runHealthCheck();
    }, 60000);

    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, [isOnline]);

  const handleRetryPreflight = async () => {
    if (!isOnline || isCheckingPlayerApi) return;

    setIsCheckingPlayerApi(true);
    try {
      await checkPlayerHealth();
      setIsPlayerApiHealthy(true);
    } catch {
      setIsPlayerApiHealthy(false);
    } finally {
      setIsCheckingPlayerApi(false);
      setLastPreflightAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  };

  // Auto-verify player when both inputs are completely filled
  useEffect(() => {
    if (!isOnline) {
      setVerifying(false);
      setVerifiedName('');
      setLastVerifiedAt('');
      setVerifyError('You are offline. Reconnect to verify player.');
      return;
    }

    // Assuming a valid userId is at least 5 chars and serverId is 4 chars
    if (userId.trim().length >= 5 && serverId.trim().length >= 4) {
      const timer = setTimeout(async () => {
        setVerifying(true);
        setVerifyError('');
        setVerifiedName('');
        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Verification timed out. Please retry.')), VERIFY_TIMEOUT_MS);
          });
          const res = await Promise.race([
            checkPlayer('mobile-legends', userId.trim(), serverId.trim()),
            timeoutPromise,
          ]);
          if (res?.data?.nickname) {
            setVerifiedName(res.data.nickname);
            setLastVerifiedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          } else {
            setVerifyError('Player not found.');
            setLastVerifiedAt('');
          }
        } catch (err) {
          setVerifyError(err.message || 'Player not found.');
          setLastVerifiedAt('');
        } finally {
          setVerifying(false);
        }
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setVerifiedName('');
      setVerifyError('');
      setLastVerifiedAt('');
    }
  }, [userId, serverId, verifyNonce, isOnline]);

  const handleRetryVerification = () => {
    if (!isOnline) {
      setVerifyError('You are offline. Reconnect to verify player.');
      return;
    }

    if (!verifying && userId.trim().length >= 5 && serverId.trim().length >= 4) {
      setVerifyNonce((prev) => prev + 1);
    }
  };

  const handleUserIdChange = (value) => {
    setUserId(value.replace(/\D/g, '').slice(0, 20));
  };

  const handleServerIdChange = (value) => {
    setServerId(value.replace(/\D/g, '').slice(0, 10));
  };

  const handleCopyReference = async (reference) => {
    if (!reference) return;

    try {
      await navigator.clipboard.writeText(reference);
      setCopiedReference(reference);
      setTimeout(() => setCopiedReference(''), 2000);
    } catch {
      setError('Could not copy reference. Please copy it manually.');
    }
  };

  const handlePackageArrowNav = (event, index) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    event.preventDefault();

    if (event.key === 'Home') {
      if (packageOptions.length > 0) {
        setSelectedPackage(packageOptions[0]);
      }
      return;
    }

    if (event.key === 'End') {
      if (packageOptions.length > 0) {
        setSelectedPackage(packageOptions[packageOptions.length - 1]);
      }
      return;
    }

    if (packageOptions.length === 0) {
      return;
    }

    const isForward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const nextIndex = isForward
      ? (index + 1) % packageOptions.length
      : (index - 1 + packageOptions.length) % packageOptions.length;

    setSelectedPackage(packageOptions[nextIndex]);
  };

  const handlePaymentArrowNav = (event, index) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    event.preventDefault();

    if (event.key === 'Home') {
      setSelectedPayment(PAYMENT_METHOD_OPTIONS[0]);
      return;
    }

    if (event.key === 'End') {
      setSelectedPayment(PAYMENT_METHOD_OPTIONS[PAYMENT_METHOD_OPTIONS.length - 1]);
      return;
    }

    const isForward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const nextIndex = isForward
      ? (index + 1) % PAYMENT_METHOD_OPTIONS.length
      : (index - 1 + PAYMENT_METHOD_OPTIONS.length) % PAYMENT_METHOD_OPTIONS.length;

    setSelectedPayment(PAYMENT_METHOD_OPTIONS[nextIndex]);
  };

  const handleTopUp = async () => {
    if (!verifiedName) return;
    if (!selectedPackage) {
      setError('Please select a diamond package.');
      return;
    }
    if (!selectedPayment) {
      setError('Please select a payment method.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccessMsg('');
    setReceipt(null);
    setCopiedReference('');

    try {
      await createOrder({
        game: 'mobile-legends',
        userId: userId.trim(),
        zoneId: serverId.trim(),
        productId: selectedPackage.id,
        paymentMethod: selectedPayment.id,
        playerNickname: verifiedName,
      });

      setSuccessMsg(`Successfully topped up ${selectedPackage.amount} Diamonds for ${verifiedName}!`);
      setReceipt({
        playerNickname: verifiedName,
        amount: selectedPackage.amount,
        price: selectedPackage.price,
        paymentMethod: selectedPayment.name,
        timestamp: new Date().toLocaleString(),
        reference: `ML-${Date.now().toString().slice(-6)}`,
      });
      setSelectedPackage(null);
      setSelectedPayment(null);
      setUserId('');
      setServerId('');
      
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.message || 'Error occurred during purchase.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearSavedReceipt = () => {
    setReceipt(null);
    setCopiedReference('');
    try {
      localStorage.removeItem(LS_RECEIPT_KEY);
    } catch {
      // Ignore localStorage write errors.
    }
  };

  return (
    <div className="ml-container">
      <div className="ml-wrapper">
        
        {/* 1. Hero Section */}
        <div className="ml-hero">
          <div className="ml-logo-main-wrap" aria-label="Mobile Legends logo">
            <img src={mlLogo} alt="Mobile Legends Professional Logo" className="ml-main-logo" />
          </div>
          <h1>Mobile Legends Diamond Top-Up</h1>
          <p>Fast, secure, and instant diamond delivery.</p>
        </div>

        {!isOnline && (
          <div className="ml-offline-banner" role="alert">
            You are offline. Verification is temporarily paused.
          </div>
        )}

        {isOnline && !isPlayerApiHealthy && (
          <div className="ml-backend-warning" role="alert">
            <div>Player API preflight failed. You may be connected to the wrong backend instance.</div>
            <button
              type="button"
              className="ml-backend-retry-btn"
              onClick={handleRetryPreflight}
              disabled={isCheckingPlayerApi}
            >
              {isCheckingPlayerApi ? 'Checking...' : 'Retry Preflight'}
            </button>
          </div>
        )}

        {isOnline && (
          <div className={`ml-preflight-meta ${isCheckingPlayerApi ? 'checking' : isPlayerApiHealthy ? 'ok' : 'bad'}`}>
            {isCheckingPlayerApi
              ? 'Checking player API...'
              : isPlayerApiHealthy
                ? 'Player API connected'
                : 'Player API unavailable'}
            {lastPreflightAt ? ` · checked ${lastPreflightAt}` : ''}
          </div>
        )}

        <div className="ml-desktop-layout">
          <div className="ml-main-column">
            {/* 2. Player Verification */}
            <div className="ml-section">
              <div className="ml-section-header">
                <span className="ml-step">1</span>
                <h2>Player Verification</h2>
              </div>
              <div className="ml-input-row">
                <div className="ml-input-group">
                  <label htmlFor="ml-user-id">User ID</label>
                  <input 
                    id="ml-user-id"
                    type="text" 
                    className="ml-input" 
                    placeholder="Enter User ID" 
                    value={userId}
                    onChange={(e) => handleUserIdChange(e.target.value)}
                    autoComplete="off"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  <small className="ml-input-hint">Numbers only, minimum 5 digits.</small>
                </div>
                <div className="ml-input-group">
                  <label htmlFor="ml-zone-id">Zone ID</label>
                  <input 
                    id="ml-zone-id"
                    type="text" 
                    className="ml-input" 
                    placeholder="Enter Zone ID" 
                    value={serverId}
                    onChange={(e) => handleServerIdChange(e.target.value)}
                    autoComplete="off"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  <small className="ml-input-hint">Numbers only, minimum 4 digits.</small>
                </div>
              </div>
              
              <div className="ml-verify-live" aria-live="polite" aria-atomic="true">
                {verifying && (
                  <div className="ml-verify-status ml-verify-loading">
                    <span className="ml-loading-dot" aria-hidden="true"></span>
                    <span>Verifying player...</span>
                  </div>
                )}
                {verifiedName && !verifying && (
                  <div className="ml-verify-status ml-verify-success">
                    ✅ Verified User: <strong>{verifiedName}</strong>
                  </div>
                )}
                {verifyError && !verifying && (
                  <div>
                    <div className="ml-verify-status ml-verify-error">
                      ❌ {verifyError}
                    </div>
                    <button
                      type="button"
                      className="ml-retry-btn"
                      onClick={handleRetryVerification}
                      disabled={!isOnline || verifying}
                    >
                      Retry Verification
                    </button>
                  </div>
                )}
                {lastVerifiedAt && verifiedName && !verifying && (
                  <div className="ml-verified-time">Last verified at {lastVerifiedAt}</div>
                )}
              </div>

            </div>

            {/* 3. Diamond Selection */}
            <div className="ml-section">
              <div className="ml-section-header">
                <span className="ml-step">2</span>
                <h2>Select Diamonds</h2>
                <span className={`ml-live-indicator ${liveMode === 'realtime' ? 'realtime' : 'polling'}`}>
                  {liveMode === 'realtime' ? 'Live' : 'Auto Refresh'}
                </span>
              </div>
              <div className="ml-grid" role="radiogroup" aria-label="Diamond packages">
                {packageOptions.map((pkg, index) => (
                  <button
                    key={pkg.id} 
                    className={`ml-diamond-card ${selectedPackage?.id === pkg.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPackage(pkg)}
                    onKeyDown={(event) => handlePackageArrowNav(event, index)}
                    type="button"
                    role="radio"
                    aria-checked={selectedPackage?.id === pkg.id}
                    aria-label={`${pkg.name}, ${pkg.amount} Diamonds for $${pkg.price.toFixed(2)}`}
                  >
                    <div className="ml-card-check">✓</div>
                    {pkg.imageSrc ? (
                      <img
                        src={pkg.imageSrc}
                        alt={pkg.name}
                        className="ml-diamond-image"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="ml-diamond-icon">{pkg.icon}</div>
                    )}
                    <div className="ml-diamond-name">{pkg.name}</div>
                    <div className="ml-diamond-amount">{pkg.amount} Diamonds</div>
                    <div className={`ml-diamond-price ${pkg.title ? 'has-title' : 'no-title'}`}>${pkg.price.toFixed(2)}</div>
                    {pkg.title && <div className="ml-diamond-title">{pkg.title}</div>}
                    <span className="ml-select-chip">Select</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Payment Methods */}
            <div className="ml-section">
              <div className="ml-section-header">
                <span className="ml-step">3</span>
                <h2>Payment Method</h2>
              </div>
              <div className="ml-payment-methods" role="radiogroup" aria-label="Payment methods">
                {PAYMENT_METHOD_OPTIONS.map((method, index) => (
                  <button
                    key={method.id}
                    className={`ml-payment-card ${selectedPayment?.id === method.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPayment(method)}
                    onKeyDown={(event) => handlePaymentArrowNav(event, index)}
                    type="button"
                    role="radio"
                    aria-checked={selectedPayment?.id === method.id}
                    aria-label={`Select ${method.name}`}
                  >
                    <div className={`ml-payment-logo-wrap ml-logo-${method.tone}`}>
                      {method.image ? (
                        <img src={method.image} alt={method.name} className="ml-payment-logo-img" />
                      ) : (
                        <span className="ml-payment-logo-text">{method.logo}</span>
                      )}
                    </div>
                    <div className="ml-payment-name">{method.name}</div>
                    <div className="ml-radio">
                      <div className="ml-radio-inner"></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="ml-side-column">
            {/* 5. Order Summary & Confirm */}
            <div className="ml-section">
              <div className="ml-section-header">
                <span className="ml-step">4</span>
                <h2>Order Summary</h2>
              </div>
              
              <div className="ml-summary">
                <div className="ml-summary-row">
                  <span>Player Username</span>
                  <span className="ml-summary-value">{verifiedName || '-'}</span>
                </div>
                <div className="ml-summary-row">
                  <span>Selected Item</span>
                  <span className="ml-summary-value">
                    {selectedPackage ? `${selectedPackage.amount} Diamonds` : '-'}
                  </span>
                </div>
                <div className="ml-summary-row">
                  <span>Payment Method</span>
                  <span className="ml-summary-value">{selectedPayment?.name || '-'}</span>
                </div>
                <div className="ml-summary-row total">
                  <span>Total Price</span>
                  <span>{selectedPackage ? `$${selectedPackage.price.toFixed(2)}` : '$0.00'}</span>
                </div>
              </div>
              <div className="ml-kbd-hint">Tip: Use arrow keys, Home, and End to pick options faster.</div>

              {error && <div className="ml-alert-msg error" role="alert">{error}</div>}
              {successMsg && <div className="ml-alert-msg success" role="status">{successMsg}</div>}
              {receipt && (
                <div className="ml-receipt" role="status" aria-live="polite">
                  <div className="ml-receipt-title">Top-Up Receipt</div>
                  <div className="ml-receipt-note">Saved on this device for quick reference.</div>
                  <div className="ml-receipt-row">
                    <span>Reference</span>
                    <div className="ml-receipt-ref-wrap">
                      <strong>{receipt.reference}</strong>
                      <button
                        type="button"
                        className={`ml-copy-ref-btn ${copiedReference === receipt.reference ? 'copied' : ''}`}
                        onClick={() => handleCopyReference(receipt.reference)}
                      >
                        {copiedReference === receipt.reference ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div className="ml-receipt-row">
                    <span>Player</span>
                    <strong>{receipt.playerNickname}</strong>
                  </div>
                  <div className="ml-receipt-row">
                    <span>Diamonds</span>
                    <strong>{receipt.amount}</strong>
                  </div>
                  <div className="ml-receipt-row">
                    <span>Payment</span>
                    <strong>{receipt.paymentMethod}</strong>
                  </div>
                  <div className="ml-receipt-row">
                    <span>Total</span>
                    <strong>${receipt.price.toFixed(2)}</strong>
                  </div>
                  <div className="ml-receipt-time">{receipt.timestamp}</div>
                  <button
                    type="button"
                    className="ml-clear-receipt-btn"
                    onClick={handleClearSavedReceipt}
                  >
                    Clear Saved Receipt
                  </button>
                </div>
              )}

              <button 
                className="ml-btn-primary" 
                style={{ marginTop: '20px' }}
                disabled={!verifiedName || isProcessing}
                onClick={handleTopUp}
                aria-disabled={!verifiedName || isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Top-Up Now'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
