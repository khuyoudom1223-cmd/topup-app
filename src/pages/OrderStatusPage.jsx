import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getOrderStatus } from '../services/api';
import OrderStatusBadge from '../components/OrderStatusBadge';
import './OrderStatusPage.css';

const statusTimeline = ['pending', 'processing', 'success'];

const STATUS_ICONS = {
  pending: '⏳',
  processing: '⚙️',
  success: '✅',
  failed: '❌',
};

export default function OrderStatusPage() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  const runTrack = async (id) => {
    if (!id.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const result = await getOrderStatus(id.trim());
      setOrder(result.data);
    } catch (err) {
      setError(err.message || 'Order not found. Please check your order ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = () => runTrack(orderId);

  // Auto-search if URL has id param
  useEffect(() => {
    const idFromUrl = (searchParams.get('id') || '').trim();
    if (!idFromUrl) return;
    setOrderId(idFromUrl);
    let cancelled = false;
    const fetchOrder = async () => {
      setLoading(true);
      setError('');
      setOrder(null);
      try {
        const result = await getOrderStatus(idFromUrl);
        if (!cancelled) setOrder(result.data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Order not found.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOrder();
    return () => { cancelled = true; };
  }, [searchParams]);

  const currentStatusIndex = order ? statusTimeline.indexOf(order.status) : -1;

  return (
    <div className="order-status-page">
      <div className="container order-status-content">

        {/* Header */}
        <div className="order-status-header animate-fade-in-up">
          <div className="header-icon-wrap">
            <span className="header-icon">📦</span>
          </div>
          <h1>Track Your Order</h1>
          <p>Enter your Order ID to check the delivery status of your purchase</p>
        </div>

        {/* Track Form */}
        <div className="track-form animate-fade-in-up delay-1">
          <div className="track-input-wrapper">
            <input
              type="text"
              className="input-field track-input"
              placeholder="Enter Order ID (e.g., TUG-XXXXXXXX)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              id="order-id-input"
            />
            <button
              className="btn-primary track-btn"
              onClick={handleTrack}
              disabled={!orderId.trim() || loading}
              id="track-order-btn"
            >
              {loading ? (
                <span className="track-btn-loading"><span className="btn-spinner"></span> Checking...</span>
              ) : (
                '🔍 Track'
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="track-error animate-fade-in">
            <span className="track-error-icon">❌</span>
            <div>
              <strong>Order Not Found</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="order-skeleton animate-fade-in">
            <div className="skeleton-bar wide"></div>
            <div className="skeleton-bar medium"></div>
            <div className="row skeleton-grid-row">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="col">
                  <div className="skeleton-card"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Result */}
        {order && !loading && (
          <div className="order-result animate-fade-in-up">

            {/* Status Summary Banner */}
            <div className={`status-banner status-banner-${order.status}`}>
              <span className="status-banner-icon">{STATUS_ICONS[order.status] || '📦'}</span>
              <div className="status-banner-text">
                <strong>
                  {order.status === 'success' && 'Your order has been delivered!'}
                  {order.status === 'processing' && 'Your order is being processed...'}
                  {order.status === 'pending' && 'Your order is awaiting processing.'}
                  {order.status === 'failed' && 'Your order could not be completed.'}
                </strong>
                <span className="status-banner-id">Order #{order.orderId}</span>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            {/* Progress Timeline */}
            {order.status !== 'failed' && (
              <div className="status-timeline">
                {statusTimeline.map((step, i) => (
                  <div key={step} className="timeline-step-wrapper">
                    <div className={`timeline-step ${i <= currentStatusIndex ? 'active' : ''} ${i < currentStatusIndex ? 'completed' : ''}`}>
                      <div className="timeline-dot">
                        {i < currentStatusIndex ? '✓' : i === currentStatusIndex ? (order.status === 'success' ? '✓' : '●') : ''}
                      </div>
                      <span className="timeline-label">{step.charAt(0).toUpperCase() + step.slice(1)}</span>
                    </div>
                    {i < statusTimeline.length - 1 && (
                      <div className={`timeline-connector ${i < currentStatusIndex ? 'active' : ''}`}></div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Order Details Card */}
            <div className="order-detail-card glass-card">
              <div className="order-detail-header">
                <div>
                  <p className="order-id-label">Order ID</p>
                  <p className="order-id-value">{order.orderId}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="row order-details-grid-row">
                <div className="col">
                  <div className="detail-item">
                    <span className="detail-label">Game</span>
                    <span className="detail-value">{order.gameName || order.game || '—'}</span>
                  </div>
                </div>
                <div className="col">
                  <div className="detail-item">
                    <span className="detail-label">Player ID</span>
                    <span className="detail-value mono">
                      {order.userId}{order.zoneId ? ` (Zone: ${order.zoneId})` : ''}
                    </span>
                  </div>
                </div>
                <div className="col">
                  <div className="detail-item">
                    <span className="detail-label">Package</span>
                    <span className="detail-value">{order.productName || order.productId || '—'}</span>
                  </div>
                </div>
                <div className="col">
                  <div className="detail-item">
                    <span className="detail-label">Amount Paid</span>
                    <span className="detail-value detail-price">
                      {order.amount ? `$${Number(order.amount).toFixed(2)}` : '—'}
                    </span>
                  </div>
                </div>
                <div className="col">
                  <div className="detail-item">
                    <span className="detail-label">Payment Method</span>
                    <span className="detail-value">{order.paymentMethod ? order.paymentMethod.toUpperCase() : '—'}</span>
                  </div>
                </div>
                <div className="col">
                  <div className="detail-item">
                    <span className="detail-label">Order Date</span>
                    <span className="detail-value">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status-specific notices */}
              {order.status === 'processing' && (
                <div className="processing-notice">
                  <div className="processing-spinner"></div>
                  <div>
                    <p>Your order is currently being processed. This usually takes a few seconds to a few minutes.</p>
                    <button className="btn-secondary" style={{ marginTop: '0.75rem' }} onClick={handleTrack}>
                      🔄 Refresh Status
                    </button>
                  </div>
                </div>
              )}

              {order.status === 'success' && (
                <div className="success-notice">
                  <p>🎉 Your in-game currency has been successfully delivered to your account!</p>
                </div>
              )}

              {order.status === 'failed' && (
                <div className="failed-notice">
                  <p>❌ We could not complete your order. Please contact our support team for assistance.</p>
                  <Link to="/" className="btn-secondary" style={{ marginTop: '0.75rem', display: 'inline-block' }}>
                    🏠 Back to Home
                  </Link>
                </div>
              )}
            </div>

            {/* Track another order */}
            <div className="track-another">
              <button className="btn-secondary" onClick={() => { setOrder(null); setOrderId(''); setError(''); }}>
                🔍 Track Another Order
              </button>
              <Link to="/" className="btn-secondary">🏠 Back to Home</Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
