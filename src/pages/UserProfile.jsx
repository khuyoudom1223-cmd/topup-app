import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getUserOrders,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchGames,
  createGame,
  updateGame,
  deleteGame,
} from '../services/api';
import OrderStatusBadge from '../components/OrderStatusBadge';
import './UserProfile.css';
import './AdminDashboard.css';

const userTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'products', label: 'Products', icon: '💎' },
  { id: 'games', label: 'Games', icon: '🎮' },
];

function normalizeImageSrc(value) {
  const input = String(value || '').trim();
  if (!input) return '';
  if (/^https?:\/\//i.test(input) || input.startsWith('data:')) return input;
  const normalized = input.replace(/\\/g, '/');
  if (normalized.startsWith('/public/')) return normalized.replace(/^\/public\//, '/');
  if (normalized.startsWith('public/')) return `/${normalized.replace(/^public\//, '')}`;
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function getFriendlyApiError(error, fallback) {
  const message = String(error?.message || '').trim();
  if (!message) return fallback;

  if (message.includes('Admin access required')) {
    return 'Access is still restricted by the running API server. Restart backend and log in again.';
  }

  if (message.includes('Unauthorized') || message.includes('No token')) {
    return 'Session expired. Please log in again.';
  }

  return message;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [games, setGames] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [gamesLoading, setGamesLoading] = useState(true);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('topupgg_token');
    localStorage.removeItem('topupgg_user');
    navigate('/login');
  }, [navigate]);

  const loadGames = useCallback(async () => {
    try {
      setGamesLoading(true);
      const data = await fetchGames(true);
      setGames(data);
    } catch (err) {
      console.error('Failed to load games', err);
      if (err.message.includes('Unauthorized') || err.message.includes('No token')) {
        handleLogout();
      }
    } finally {
      setGamesLoading(false);
    }
  }, [handleLogout]);

  const loadOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const res = await getUserOrders();
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load user orders', err);
      if (err.message.includes('Unauthorized') || err.message.includes('No token')) {
        handleLogout();
      }
    } finally {
      setOrdersLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    const token = localStorage.getItem('topupgg_token');
    const storedUser = JSON.parse(localStorage.getItem('topupgg_user') || '{}');

    if (!token || !storedUser.id) {
      navigate('/login');
      return;
    }

    setUser(storedUser);
    loadOrders();
    loadGames();
  }, [navigate, loadOrders, loadGames]);

  if (!user) return null;

  const successOrders = orders.filter((o) => o.status === 'success').length;
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
  const profileImage = normalizeImageSrc(user.profileImage || user.avatar || user.image || '');

  return (
    <div className="user-dashboard-page">
      <div className="admin-page user-dashboard-layout">
        <aside className="admin-sidebar">
          <div className="sidebar-header">
            <span className="sidebar-logo">👤</span>
            <span className="sidebar-title">Manager Dashboard</span>
            <span className="sidebar-badge">Member</span>
          </div>
          <nav className="sidebar-nav">
            {userTabs.map((tab) => (
              <button
                key={tab.id}
                className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="sidebar-link-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
            <div className="sidebar-divider" style={{ margin: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
            <button className="sidebar-link" onClick={handleLogout} style={{ color: '#ef4444' }}>
              <span className="sidebar-link-icon">🚪</span> Logout
            </button>
          </nav>
          <div className="sidebar-footer">
            <a href="/" className="sidebar-back-link">← Back to Site</a>
          </div>
        </aside>

        <main className="admin-main">
          <header className="admin-header">
            <h1 className="admin-page-title">
              {userTabs.find((t) => t.id === activeTab)?.icon} {userTabs.find((t) => t.id === activeTab)?.label}
            </h1>
          </header>

          <div className="admin-content">
            <section className="profile-header glass-card dashboard-user-card">
              <div className="profile-info">
                <div className="avatar image-avatar">
                  {profileImage ? (
                    <img src={profileImage} alt={user.username || 'User'} className="profile-image" />
                  ) : (
                    '👤'
                  )}
                </div>
                <div className="details">
                  <h2>{user.username || 'User'}</h2>
                  <span className="email">{user.email || 'No email provided'}</span>
                  <span className="role-badge">{user.type || user.role || 'Member'}</span>
                </div>
              </div>
              <button className="btn-secondary logout-btn" onClick={handleLogout}>
                🚪 Logout
              </button>
            </section>

            {activeTab === 'dashboard' && (
              <DashboardOverview
                orders={orders}
                loading={ordersLoading}
                successOrders={successOrders}
                pendingOrders={pendingOrders}
                onRefresh={loadOrders}
              />
            )}

            {activeTab === 'products' && (
              <ProductsManagementTab games={games} gamesLoading={gamesLoading} />
            )}

            {activeTab === 'games' && (
              <GamesManagementTab games={games} onRefresh={loadGames} gamesLoading={gamesLoading} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardOverview({ orders, loading, successOrders, pendingOrders, onRefresh }) {
  return (
    <div className="dashboard-tab">
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>📦</div>
          <div className="stat-card-info">
            <span className="stat-card-value">{orders.length}</span>
            <span className="stat-card-label">Total Orders</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>✅</div>
          <div className="stat-card-info">
            <span className="stat-card-value">{successOrders}</span>
            <span className="stat-card-label">Completed</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>⏳</div>
          <div className="stat-card-info">
            <span className="stat-card-value">{pendingOrders}</span>
            <span className="stat-card-label">In Progress</span>
          </div>
        </div>
      </div>

      <div className="orders-section glass-card">
        <div className="orders-section-header">
          <h3>📋 Order History</h3>
          <button className="btn-secondary orders-refresh-btn" onClick={onRefresh} disabled={loading}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="profile-spinner"></div>
            <p>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🎮</span>
            <p>You haven&apos;t made any top-ups yet.</p>
            <Link to="/" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
              🛒 Top Up Now
            </Link>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Game</th>
                  <th>Item</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderId}>
                    <td className="order-id">
                      <Link to={`/order-status?id=${order.orderId}`}>{order.orderId}</Link>
                    </td>
                    <td>
                      <div className="cell-game">
                        <span className="game-name">{order.gameName || order.gameSlug}</span>
                        <span className="target-id">ID: {order.playerId}</span>
                      </div>
                    </td>
                    <td>
                      <span className="cell-product-name">{order.productName || '—'}</span>
                    </td>
                    <td>
                      <span className="cell-price">${parseFloat(order.amount || 0).toFixed(2)}</span>
                    </td>
                    <td className="date-cell">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td>
                      <Link to={`/order-status?id=${order.orderId}`} className="track-link">
                        Track →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductsManagementTab({ games, gamesLoading }) {
  const [selectedGame, setSelectedGame] = useState('');
  const [gameProducts, setGameProducts] = useState([]);
  const activeGameSlug = selectedGame || games[0]?.slug || '';
  const [draftProduct, setDraftProduct] = useState({
    name: '',
    amount: '',
    price: '',
    description: '',
    popular: false,
  });
  const [productImages, setProductImages] = useState([]);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const imageInputRef = useRef(null);
  const uploadedImageUrlsRef = useRef(new Set());

  const normalizeProduct = (product) => ({
    ...product,
    id: product.id,
    name: product.name ?? product.product_name ?? product.productName ?? '',
    amount: product.amount ?? product.diamond_amount ?? 0,
    price: product.price ?? 0,
    description: product.description ?? product.title ?? '',
    popular: Number(product.popular || 0) === 1 || product.popular === true,
    imageSrc: normalizeImageSrc(product.imageSrc ?? product.image_path ?? product.imagePath ?? ''),
  });

  const loadProducts = useCallback(async (gameSlug) => {
    if (!gameSlug) {
      setGameProducts([]);
      return;
    }

    const data = await fetchProducts(gameSlug);
    setGameProducts(data.map(normalizeProduct));
  }, []);

  const addImages = (imageEntries) => {
    if (!imageEntries.length) return;
    setProductImages((prev) => [...prev, ...imageEntries]);
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files || []);
    const nextImages = files
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => {
        const src = URL.createObjectURL(file);
        uploadedImageUrlsRef.current.add(src);
        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          src,
          name: file.name,
          kind: 'uploaded',
          file,
        };
      });

    addImages(nextImages);
    event.target.value = '';
  };

  const handleAddDefaultImage = () => {
    const staticPath = '/image/photo_2026-03-26_20-14-27.jpg';
    const exists = productImages.some((img) => img.src === staticPath);
    if (exists) return;

    addImages([
      {
        id: `default-${Date.now()}`,
        src: staticPath,
        name: 'photo_2026-03-26_20-14-27.jpg',
        kind: 'preset',
      },
    ]);
  };

  const handleRemoveImage = (id) => {
    setProductImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.kind === 'uploaded') {
        URL.revokeObjectURL(target.src);
        uploadedImageUrlsRef.current.delete(target.src);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleProductFieldChange = (field, value) => {
    setDraftProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    const normalizedName = draftProduct.name.trim();
    const normalizedAmount = Number(draftProduct.amount);
    const normalizedPrice = Number(draftProduct.price);

    if (!normalizedName || !normalizedAmount || Number.isNaN(normalizedAmount) || Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
      setSubmitMessage({ type: 'error', text: 'Please complete product name, amount, and price.' });
      return;
    }

    if (!activeGameSlug) {
      setSubmitMessage({ type: 'error', text: 'Please select a game first.' });
      return;
    }

    setIsCreatingProduct(true);
    setSubmitMessage({ type: '', text: '' });

    const thumb = productImages[0];
    const formData = new FormData();
    formData.append('gameSlug', activeGameSlug);
    formData.append('name', normalizedName);
    formData.append('productName', normalizedName);
    formData.append('amount', String(normalizedAmount));
    formData.append('price', String(normalizedPrice));
    formData.append('description', String(draftProduct.description || ''));
    formData.append('title', String(draftProduct.description || ''));
    formData.append('popular', draftProduct.popular || false);

    if (thumb) {
      if (thumb.kind === 'uploaded') {
        formData.append('image', thumb.file);
      } else {
        formData.append('imageSrc', normalizeImageSrc(thumb.src));
      }
    }

    try {
      await createProduct(formData);
      await loadProducts(activeGameSlug);

      productImages.forEach((img) => {
        if (img.kind === 'uploaded') {
          URL.revokeObjectURL(img.src);
          uploadedImageUrlsRef.current.delete(img.src);
        }
      });

      setDraftProduct({ name: '', amount: '', price: '', description: '', popular: false });
      setProductImages([]);
      setSubmitMessage({ type: 'success', text: 'Product created successfully.' });
    } catch (err) {
      setSubmitMessage({ type: 'error', text: getFriendlyApiError(err, 'Failed to create product.') });
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      setGameProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
      setSubmitMessage({ type: 'success', text: 'Product deleted successfully.' });
    } catch (err) {
      setSubmitMessage({ type: 'error', text: getFriendlyApiError(err, 'Failed to delete product.') });
    }
  };

  const handleUpdateProduct = async (event) => {
    event.preventDefault();
    if (!editingProduct) return;

    const normalizedName = String(editingProduct.name || '').trim();
    const normalizedAmount = Number(editingProduct.amount);
    const normalizedPrice = Number(editingProduct.price);

    if (!normalizedName || !normalizedAmount || Number.isNaN(normalizedAmount) || Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
      setSubmitMessage({ type: 'error', text: 'Please complete product name, amount, and price.' });
      return;
    }

    setIsUpdatingProduct(true);
    const formData = new FormData();
    formData.append('name', normalizedName);
    formData.append('productName', normalizedName);
    formData.append('amount', String(normalizedAmount));
    formData.append('price', String(normalizedPrice));
    formData.append('description', String(editingProduct.description || ''));
    formData.append('title', String(editingProduct.description || ''));
    formData.append('popular', editingProduct.popular || false);

    if (editingProduct.newImage) {
      formData.append('image', editingProduct.newImage);
    } else if (editingProduct.imageSrc) {
      formData.append('imageSrc', normalizeImageSrc(editingProduct.imageSrc));
    }

    try {
      await updateProduct(editingProduct.id, formData);
      setSubmitMessage({ type: 'success', text: 'Product updated successfully.' });
      await loadProducts(activeGameSlug);
      setEditingProduct(null);
    } catch (err) {
      setSubmitMessage({ type: 'error', text: getFriendlyApiError(err, 'Failed to update product.') });
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  useEffect(() => {
    const uploadedImageUrls = uploadedImageUrlsRef.current;
    return () => {
      uploadedImageUrls.forEach((src) => {
        URL.revokeObjectURL(src);
      });
      uploadedImageUrls.clear();
    };
  }, []);

  useEffect(() => {
    if (!selectedGame && games[0]?.slug) {
      setSelectedGame(games[0].slug);
    }
  }, [games, selectedGame]);

  useEffect(() => {
    if (activeGameSlug) {
      loadProducts(activeGameSlug).catch((err) => {
        setSubmitMessage({ type: 'error', text: getFriendlyApiError(err, 'Failed to load products.') });
      });
    }
  }, [activeGameSlug, loadProducts]);

  const filteredProducts = gameProducts.filter((p) => {
    const query = productSearchQuery.toLowerCase();
    const name = p.product_name || p.name || '';
    return (
      name.toLowerCase().includes(query) ||
      String(p.amount).toLowerCase().includes(query) ||
      String(p.id).toLowerCase().includes(query)
    );
  });

  if (gamesLoading) {
    return (
      <div className="loading-state">
        <div className="profile-spinner"></div>
        <p>Loading games...</p>
      </div>
    );
  }

  return (
    <div className="products-tab">
      <div className="product-form-card glass-card">
        <h3 className="product-form-title">Add Product</h3>
        <form className="product-form-grid" onSubmit={handleCreateProduct}>
          <div className="product-form-field">
            <label htmlFor="product-name">Product Name</label>
            <input
              id="product-name"
              className="input-field"
              placeholder="e.g. 250 Diamonds"
              value={draftProduct.name}
              onChange={(e) => handleProductFieldChange('name', e.target.value)}
            />
          </div>

          <div className="product-form-field">
            <label htmlFor="product-amount">Amount</label>
            <input
              id="product-amount"
              type="number"
              min="1"
              className="input-field"
              placeholder="250"
              value={draftProduct.amount}
              onChange={(e) => handleProductFieldChange('amount', e.target.value)}
            />
          </div>

          <div className="product-form-field">
            <label htmlFor="product-price">Price (USD)</label>
            <input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              className="input-field"
              placeholder="4.99"
              value={draftProduct.price}
              onChange={(e) => handleProductFieldChange('price', e.target.value)}
            />
          </div>

          <div className="product-form-field" style={{ gridColumn: 'span 3' }}>
            <label htmlFor="product-description">Description</label>
            <textarea
              id="product-description"
              className="input-field"
              rows={4}
              placeholder="e.g. 250 diamonds delivered instantly."
              value={draftProduct.description || ''}
              onChange={(e) => handleProductFieldChange('description', e.target.value)}
            />
          </div>

          <div className="product-form-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', gridColumn: 'span 3' }}>
            <input
              id="product-popular"
              type="checkbox"
              checked={draftProduct.popular || false}
              onChange={(e) => handleProductFieldChange('popular', e.target.checked)}
            />
            <label htmlFor="product-popular" style={{ color: 'var(--text-primary)', cursor: 'pointer' }}>Mark as Popular</label>
          </div>

          <div className="product-image-tools">
            <button type="button" className="btn-secondary" onClick={() => imageInputRef.current?.click()}>
              Upload Images
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="product-image-input"
            />
          </div>

          <div className="product-image-grid" aria-live="polite">
            {productImages.length === 0 && (
              <div className="product-image-empty">No images selected yet.</div>
            )}
            {productImages.map((image) => (
              <article key={image.id} className="product-image-card">
                <img src={image.src} alt={image.name} className="product-image-preview" />
                <div className="product-image-meta">
                  <span className="product-image-name">{image.name}</span>
                  <button type="button" className="product-image-remove" onClick={() => handleRemoveImage(image.id)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="product-form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={!draftProduct.name.trim() || !draftProduct.amount || !draftProduct.price || isCreatingProduct}
            >
              {isCreatingProduct ? 'Creating...' : 'Create Product'}
            </button>
            {submitMessage.text && (
              <p className={`product-form-message ${submitMessage.type === 'error' ? 'error' : 'success'}`}>
                {submitMessage.text}
              </p>
            )}
          </div>
        </form>
      </div>

      <div className="products-header">
        <div className="game-selector">
          {games.map((game) => (
            <button
              key={game.slug}
              className={`game-tab ${activeGameSlug === game.slug ? 'active' : ''}`}
              onClick={() => setSelectedGame(game.slug)}
            >
              {game.icon} {game.name}
            </button>
          ))}
        </div>
      </div>

      <div className="table-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 1rem', gap: '1rem', flexWrap: 'wrap' }}>
        <h3 className="section-title" style={{ margin: 0 }}>Products List</h3>
        <input
          type="text"
          className="input-field"
          placeholder="Search products..."
          style={{ maxWidth: '300px', margin: 0 }}
          value={productSearchQuery}
          onChange={(e) => setProductSearchQuery(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Name</th>
              <th>Amount</th>
              <th>Price</th>
              <th>Popular</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((prod) => (
              <tr key={prod.id}>
                <td className="mono">{prod.id}</td>
                <td>
                  {prod.imageSrc ? (
                    <img src={prod.imageSrc} alt={prod.imageName || prod.name} className="product-thumb" />
                  ) : (
                    '—'
                  )}
                </td>
                <td>{prod.name || prod.product_name || '—'}</td>
                <td>{Number(prod.amount).toLocaleString()}</td>
                <td className="price-cell">${Number(prod.price).toFixed(2)}</td>
                <td>{prod.popular ? <span className="badge badge-warning">Popular</span> : '—'}</td>
                <td>
                  <div className="action-btns">
                    <button
                      className="action-btn edit-btn"
                      title="Edit"
                      onClick={() => setEditingProduct(normalizeProduct(prod))}
                    >✏️</button>
                    <button
                      className="action-btn delete-btn"
                      title="Delete"
                      onClick={() => handleDeleteProduct(prod.id)}
                    >🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingProduct && (
        <div className="admin-modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="admin-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Product</h3>
              <button className="modal-close" onClick={() => setEditingProduct(null)}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleUpdateProduct}>
              <div className="field-group">
                <label>Product Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                />
              </div>
              <div className="modal-row">
                <div className="field-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editingProduct.amount}
                    onChange={(e) => setEditingProduct({ ...editingProduct, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="field-group">
                  <label>Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="field-group">
                <label>Description</label>
                <textarea
                  className="input-field"
                  rows={4}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="e.g. 250 diamonds delivered instantly."
                />
              </div>
              <div className="field-group">
                <label>New Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditingProduct({ ...editingProduct, newImage: e.target.files[0] })}
                  className="input-field"
                />
              </div>
              <div className="field-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="edit-popular-checkbox"
                  checked={editingProduct.popular || false}
                  onChange={(e) => setEditingProduct({ ...editingProduct, popular: e.target.checked })}
                />
                <label htmlFor="edit-popular-checkbox" style={{ color: 'var(--text-primary)', cursor: 'pointer' }}>Mark as Popular</label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditingProduct(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isUpdatingProduct}>
                  {isUpdatingProduct ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GamesManagementTab({ games, onRefresh, gamesLoading }) {
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [isUpdatingGame, setIsUpdatingGame] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
  const [draftGame, setDraftGame] = useState({ name: '', slug: '', publisher: '', category: 'Mobile Games' });
  const [gameIcon, setGameIcon] = useState(null);
  const iconInputRef = useRef(null);

  const handleCreateGame = async (event) => {
    event.preventDefault();
    setIsCreatingGame(true);
    setSubmitMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('name', draftGame.name);
    formData.append('slug', draftGame.slug);
    formData.append('publisher', draftGame.publisher);
    formData.append('category', draftGame.category);
    if (gameIcon) formData.append('icon', gameIcon);

    try {
      await createGame(formData);
      setSubmitMessage({ type: 'success', text: 'Game created successfully' });
      setDraftGame({ name: '', slug: '', publisher: '', category: 'Mobile Games' });
      setGameIcon(null);
      if (iconInputRef.current) iconInputRef.current.value = '';
      onRefresh();
    } catch (err) {
      setSubmitMessage({ type: 'error', text: getFriendlyApiError(err, 'Failed to create game.') });
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleUpdateGame = async (event) => {
    event.preventDefault();
    setIsUpdatingGame(true);
    const formData = new FormData();
    formData.append('name', editingGame.name);
    formData.append('slug', editingGame.slug);
    formData.append('publisher', editingGame.publisher);
    formData.append('category', editingGame.category);
    formData.append('status', editingGame.status);
    if (editingGame.newIcon) formData.append('icon', editingGame.newIcon);

    try {
      await updateGame(editingGame.id, formData);
      setEditingGame(null);
      onRefresh();
    } catch (err) {
      setSubmitMessage({ type: 'error', text: getFriendlyApiError(err, 'Failed to update game.') });
    } finally {
      setIsUpdatingGame(false);
    }
  };

  const handleDeleteGame = async (id) => {
    if (!window.confirm('Are you sure? This will not delete products automatically but they may become orphaned.')) return;
    try {
      await deleteGame(id);
      onRefresh();
    } catch (err) {
      setSubmitMessage({ type: 'error', text: getFriendlyApiError(err, 'Failed to delete game.') });
    }
  };

  if (gamesLoading) {
    return (
      <div className="loading-state">
        <div className="profile-spinner"></div>
        <p>Loading games...</p>
      </div>
    );
  }

  return (
    <div className="products-tab">
      <div className="product-form-card glass-card">
        <h3 className="product-form-title">Add New Game</h3>
        <form className="product-form-grid" onSubmit={handleCreateGame}>
          <div className="product-form-field">
            <label>Game Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="Mobile Legends"
              value={draftGame.name}
              onChange={(e) => setDraftGame({ ...draftGame, name: e.target.value })}
              required
            />
          </div>
          <div className="product-form-field">
            <label>Slug (Code)</label>
            <input
              type="text"
              className="input-field"
              placeholder="mobile-legends"
              value={draftGame.slug}
              onChange={(e) => setDraftGame({ ...draftGame, slug: e.target.value })}
              required
            />
          </div>
          <div className="product-form-field">
            <label>Publisher</label>
            <input
              type="text"
              className="input-field"
              placeholder="Moonton"
              value={draftGame.publisher}
              onChange={(e) => setDraftGame({ ...draftGame, publisher: e.target.value })}
            />
          </div>
          <div className="product-form-field">
            <label>Category</label>
            <select
              className="input-field"
              value={draftGame.category}
              onChange={(e) => setDraftGame({ ...draftGame, category: e.target.value })}
            >
              <option value="Mobile Games">Mobile Games</option>
              <option value="PC Games">PC Games</option>
              <option value="Consoles">Consoles</option>
            </select>
          </div>
          <div className="product-form-field">
            <label>Icon / Image</label>
            <input
              type="file"
              ref={iconInputRef}
              className="input-field"
              onChange={(e) => setGameIcon(e.target.files[0])}
            />
          </div>
          <div className="product-form-actions">
            <button type="submit" className="btn-primary" disabled={isCreatingGame}>
              {isCreatingGame ? 'Creating...' : 'Create Game'}
            </button>
            {submitMessage.text && (
              <p className={`product-form-message ${submitMessage.type}`}>{submitMessage.text}</p>
            )}
          </div>
        </form>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Icon</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.id}>
                <td className="mono">{game.id}</td>
                <td>
                  {game.icon && (game.icon.startsWith('/') || game.icon.startsWith('http')) ? (
                    <img src={game.icon} alt={game.name} className="product-thumb" />
                  ) : (
                    <span style={{ fontSize: '1.5rem' }}>{game.icon || '🎮'}</span>
                  )}
                </td>
                <td>{game.name}</td>
                <td><code className="mono">{game.slug}</code></td>
                <td>
                  <span className={`badge ${game.status ? 'badge-success' : 'badge-error'}`}>
                    {game.status ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="action-btn edit-btn" onClick={() => setEditingGame(game)}>✏️</button>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteGame(game.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingGame && (
        <div className="admin-modal-overlay" onClick={() => setEditingGame(null)}>
          <div className="admin-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Game</h3>
              <button className="modal-close" onClick={() => setEditingGame(null)}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleUpdateGame}>
              <div className="field-group">
                <label>Game Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingGame.name}
                  onChange={(e) => setEditingGame({ ...editingGame, name: e.target.value })}
                  required
                />
              </div>
              <div className="modal-row">
                <div className="field-group">
                  <label>Slug</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingGame.slug}
                    onChange={(e) => setEditingGame({ ...editingGame, slug: e.target.value })}
                    required
                  />
                </div>
                <div className="field-group">
                  <label>Status</label>
                  <select
                    className="input-field"
                    value={editingGame.status}
                    onChange={(e) => setEditingGame({ ...editingGame, status: parseInt(e.target.value, 10) })}
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="field-group">
                <label>New Icon (Optional)</label>
                <input
                  type="file"
                  className="input-field"
                  onChange={(e) => setEditingGame({ ...editingGame, newIcon: e.target.files[0] })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditingGame(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isUpdatingGame}>
                  {isUpdatingGame ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
