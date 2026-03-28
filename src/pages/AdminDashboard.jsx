import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllOrders, updateOrderStatus, fetchProducts, createProduct, updateProduct, deleteProduct, fetchGames, createGame, updateGame, deleteGame, fetchSystemSettings, updateSystemSettings } from '../services/api';
import OrderStatusBadge from '../components/OrderStatusBadge';
import './AdminDashboard.css';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'games', label: 'Games', icon: '🎮' },
  { id: 'products', label: 'Products', icon: '💎' },
  { id: 'orders', label: 'Orders', icon: '📦' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [games, setGames] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('topupgg_token');
    const user = JSON.parse(localStorage.getItem('topupgg_user') || '{}');
    if (!token || user.type !== 'admin') {
      navigate('/login');
      return;
    }

    loadOrders();
    loadGames();
  }, [navigate]);

  const loadGames = async () => {
    try {
      const data = await fetchGames(true); // Fetch all for admin
      setGames(data);
    } catch (err) {
      console.error('Failed to load games:', err);
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const result = await getAllOrders();
      setOrders(result.data);
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o));
    } catch (e) {
      console.error(e);
      if (e.message.includes('Unauthorized') || e.message.includes('No token')) {
        handleLogout();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('topupgg_token');
    localStorage.removeItem('topupgg_user');
    navigate('/login');
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesQuery = !searchQuery 
      || (o.orderId && o.orderId.toLowerCase().includes(searchQuery.toLowerCase()))
      || (o.userId && String(o.userId).toLowerCase().includes(searchQuery.toLowerCase()))
      || (o.productName && o.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

  const totalRevenue = orders
    .filter(o => o.status === 'success')
    .reduce((sum, o) => sum + Number(o.amount || 0), 0);

  const ordersByStatus = {
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    success: orders.filter(o => o.status === 'success').length,
    failed: orders.filter(o => o.status === 'failed').length,
  };

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">🎮</span>
          <span className="sidebar-title">DOM<span className="logo-accent">TopUp</span></span>
          <span className="sidebar-badge">Admin</span>
        </div>
        <nav className="sidebar-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              id={`admin-tab-${tab.id}`}
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

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1 className="admin-page-title">
            {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
          </h1>
        </header>

        <div className="admin-content">
          {activeTab === 'dashboard' && (
            <DashboardTab
              orders={orders}
              games={games}
              totalRevenue={totalRevenue}
              ordersByStatus={ordersByStatus}
            />
          )}
          {activeTab === 'games' && (
            <GamesTab 
              games={games} 
              onRefresh={loadGames}
            />
          )}
          {activeTab === 'products' && <ProductsTab games={games} navigate={navigate} />}
          {activeTab === 'orders' && (
            <OrdersTab
              orders={filteredOrders}
              games={games}
              loading={ordersLoading}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onStatusChange={handleStatusChange}
              onRefresh={loadOrders}
            />
          )}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}

/* ======== Dashboard Tab ======== */
function DashboardTab({ orders, games, totalRevenue, ordersByStatus }) {
  const revenueByGame = {};
  orders.filter(o => o.status === 'success').forEach(o => {
    const game = games.find(g => g.slug === o.game);
    const gameName = game ? game.name : o.game;
    revenueByGame[gameName] = (revenueByGame[gameName] || 0) + Number(o.amount || 0);
  });

  const maxRevenue = Math.max(...Object.values(revenueByGame), 1);

  return (
    <div className="dashboard-tab">
      {/* Stats Cards */}
      <div className="row stats-cards-row">
        <div className="col">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>💰</div>
            <div className="stat-card-info">
              <span className="stat-card-value">${totalRevenue.toFixed(2)}</span>
              <span className="stat-card-label">Total Revenue</span>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>📦</div>
            <div className="stat-card-info">
              <span className="stat-card-value">{orders.length}</span>
              <span className="stat-card-label">Total Orders</span>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>✅</div>
            <div className="stat-card-info">
              <span className="stat-card-value">{ordersByStatus.success}</span>
              <span className="stat-card-label">Completed</span>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>⏳</div>
            <div className="stat-card-info">
              <span className="stat-card-value">{ordersByStatus.pending + ordersByStatus.processing}</span>
              <span className="stat-card-label">In Progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="chart-card glass-card">
        <h3>Revenue by Game</h3>
        <div className="bar-chart">
          {Object.entries(revenueByGame).map(([name, val]) => (
            <div key={name} className="bar-row">
              <span className="bar-label">{name}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(val / maxRevenue) * 100}%` }}
                ></div>
              </div>
              <span className="bar-value">${val.toFixed(2)}</span>
            </div>
          ))}
          {Object.keys(revenueByGame).length === 0 && (
            <p className="empty-chart">No revenue data yet</p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="recent-orders glass-card">
        <h3>Recent Orders</h3>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Game</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map(order => {
                const game = games.find(g => g.slug === order.game);
                return (
                  <tr key={order.orderId}>
                    <td className="mono">{order.orderId}</td>
                    <td>{game ? `${game.icon} ${game.name}` : order.game}</td>
                    <td><OrderStatusBadge status={order.status} /></td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ======== Products Tab ======== */
function ProductsTab({ games, navigate }) {
  const [selectedGame, setSelectedGame] = useState(games[0]?.slug || '');
  const [gameProducts, setGameProducts] = useState([]);
  const activeGameSlug = selectedGame || games[0]?.slug || '';
  const [draftProduct, setDraftProduct] = useState({
    name: '',
    amount: '',
    price: '',
    description: '',
  });
  const [productImages, setProductImages] = useState([]);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const imageInputRef = useRef(null);
  const uploadedImageUrlsRef = useRef(new Set());

  const normalizeImageSrc = (value) => {
    const input = String(value || '').trim();
    if (!input) return '';
    if (/^https?:\/\//i.test(input) || input.startsWith('data:')) return input;
    const normalized = input.replace(/\\/g, '/');
    if (normalized.startsWith('/public/')) return normalized.replace(/^\/public\//, '/');
    if (normalized.startsWith('public/')) return `/${normalized.replace(/^public\//, '')}`;
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  };

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

  const loadProducts = async (gameSlug = activeGameSlug) => {
    if (!gameSlug) {
      setGameProducts([]);
      return;
    }

    const data = await fetchProducts(gameSlug);
    setGameProducts(data.map(normalizeProduct));
  };

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
          file: file, // Store the actual File object
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
      window.dispatchEvent(new CustomEvent('products:changed', { detail: { gameSlug: activeGameSlug, type: 'created' } }));

      productImages.forEach((img) => {
        if (img.kind === 'uploaded') {
          URL.revokeObjectURL(img.src);
          uploadedImageUrlsRef.current.delete(img.src);
        }
      });

      setDraftProduct({ name: '', amount: '', price: '', description: '', popular: false });
      setProductImages([]);
      setSubmitMessage({
        type: 'success',
        text: 'Product created successfully.',
      });
    } catch (err) {
      setSubmitMessage({ type: 'error', text: err.message || 'Failed to create product.' });
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      setGameProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
      window.dispatchEvent(new CustomEvent('products:changed', { detail: { gameSlug: activeGameSlug, type: 'deleted' } }));
      setSubmitMessage({ type: 'success', text: 'Product deleted successfully.' });
    } catch (err) {
      setSubmitMessage({ type: 'error', text: err.message || 'Failed to delete product.' });
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
      window.dispatchEvent(new CustomEvent('products:changed', { detail: { gameSlug: activeGameSlug, type: 'updated' } }));
      setEditingProduct(null);
    } catch (err) {
      setSubmitMessage({ type: 'error', text: err.message || 'Failed to update product.' });
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
    if (activeGameSlug) {
      loadProducts(activeGameSlug)
        .catch(err => console.error('Failed to load products:', err));
    }
  }, [activeGameSlug]);

  const filteredProducts = gameProducts.filter(p => {
    const query = productSearchQuery.toLowerCase();
    const name = p.product_name || p.name || '';
    return name.toLowerCase().includes(query) || 
           String(p.amount).toLowerCase().includes(query) ||
           String(p.id).toLowerCase().includes(query);
  });

  return (
    <div className="products-tab">
      <div className="products-actions-row">
        <button
          onClick={() => navigate('/admin/add-product')}
          style={{
            background: 'var(--accent-gradient)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '999px',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          title="Open full-screen Add Product form"
        >
          ➕ Full Form
        </button>
      </div>
      <div className="product-form-card glass-card">
        <h3 className="product-form-title">Add Product</h3>
        <form className="row product-form-row" onSubmit={handleCreateProduct}>
          <div className="col">
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
          </div>

          <div className="col">
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
          </div>

          <div className="col">
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
          </div>

          <div className="col col-4">
            <div className="product-form-field">
              <label htmlFor="product-description">Description</label>
              <textarea
                id="product-description"
                className="input-field"
                rows={4}
                placeholder="e.g. 2 diamonds delivered instantly."
                value={draftProduct.description || ''}
                onChange={(e) => handleProductFieldChange('description', e.target.value)}
              />
            </div>
          </div>

          <div className="col col-4">
            <div className="product-form-field product-form-inline">
              <input
                id="product-popular"
                type="checkbox"
                checked={draftProduct.popular || false}
                onChange={(e) => handleProductFieldChange('popular', e.target.checked)}
              />
              <label htmlFor="product-popular" style={{ color: 'var(--text-primary)', cursor: 'pointer' }}>Mark as Popular</label>
            </div>
          </div>

          <div className="col col-4">
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
          </div>

          <div className="col col-4">
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
          </div>

          <div className="col col-4">
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
          </div>
        </form>
      </div>

      <div className="products-header">
        <div className="game-selector">
          {games.map(game => (
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
      <div className="row table-header-row">
        <div className="col col-2">
          <h3 className="section-title" style={{ margin: 0 }}>Products List</h3>
        </div>
        <div className="col col-2">
          <input 
            type="text"
            className="input-field table-search-input"
            placeholder="Search products..."
            value={productSearchQuery}
            onChange={(e) => setProductSearchQuery(e.target.value)}
          />
        </div>
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
            {filteredProducts.map(prod => (
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

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="admin-modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="admin-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Edit Product</h3>
              <button className="admin-modal-close" onClick={() => setEditingProduct(null)}>×</button>
            </div>
            <form className="row modal-form-row" onSubmit={handleUpdateProduct}>
              <div className="col col-4">
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
              </div>

              <div className="col col-2">
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
              </div>

              <div className="col col-2">
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

              <div className="col col-4">
                <div className="field-group">
                  <label>Description</label>
                  <textarea
                    className="input-field"
                    rows={4}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    placeholder="e.g. 2 diamonds delivered instantly."
                  />
                </div>
              </div>

              <div className="col col-4">
                <div className="field-group">
                  <label>New Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditingProduct({ ...editingProduct, newImage: e.target.files[0] })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="col col-4">
                <div className="field-group product-form-inline">
                  <input
                    type="checkbox"
                    id="edit-popular-checkbox"
                    checked={editingProduct.popular || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, popular: e.target.checked })}
                  />
                  <label htmlFor="edit-popular-checkbox" style={{ color: 'var(--text-primary)', cursor: 'pointer' }}>Mark as Popular</label>
                </div>
              </div>

              <div className="col col-4">
                <div className="admin-modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setEditingProduct(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={isUpdatingProduct}>
                    {isUpdatingProduct ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======== Orders Tab ======== */
function OrdersTab({ orders, games, loading, statusFilter, setStatusFilter, searchQuery, setSearchQuery, onStatusChange, onRefresh }) {
  const statusOptions = ['all', 'pending', 'processing', 'success', 'failed'];

  return (
    <div className="orders-tab">
      <div className="orders-toolbar">
        <div className="orders-toolbar-main">
          <div className="status-filters">
            {statusOptions.map(s => (
              <button
                key={s}
                className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="search-box">
            <input
              type="text"
              className="input-field"
              placeholder="Search Order ID, Player ID..."
              style={{ margin: 0 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button className="btn-secondary" onClick={onRefresh}>🔄 Refresh</button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="processing-spinner"></div>
          <p>Loading orders...</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Game</th>
                <th>Player</th>
                <th>Product</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.orderId}>
                  <td className="mono" style={{ fontSize: '0.78rem' }}>{order.orderId}</td>
                  <td>{order.gameName || order.game || '—'}</td>
                  <td className="mono">{order.userId}{order.zoneId ? `(${order.zoneId})` : ''}</td>
                  <td>{order.productName || order.productId || '—'}</td>
                  <td>{order.paymentMethod ? order.paymentMethod.toUpperCase() : '—'}</td>
                  <td><OrderStatusBadge status={order.status} /></td>
                  <td>{order.amount ? `$${Number(order.amount).toFixed(2)}` : '—'}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <select
                      className="status-select"
                      value={order.status}
                      onChange={(e) => onStatusChange(order.orderId, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="success">Success</option>
                      <option value="failed">Failed</option>
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-row">No orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ======== Settings Tab ======== */
function SettingsTab() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSystemSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSystemSettings(settings);
      alert('Settings saved successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-state">Loading settings...</div>;

  return (
    <div className="settings-tab">
      <div className="settings-section glass-card">
        <h3>💳 Payment Gateways</h3>
        <p className="settings-desc">Enable or disable payment methods</p>
        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-item-info">
              <span className="settings-item-name">Wing</span>
              <span className={`settings-item-status ${settings.wing_enabled === '1' ? 'active' : ''}`}>
                {settings.wing_enabled === '1' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <label className="toggle">
              <input 
                type="checkbox" 
                checked={settings.wing_enabled === '1'} 
                onChange={(e) => handleChange('wing_enabled', e.target.checked ? '1' : '0')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="settings-item">
            <div className="settings-item-info">
              <span className="settings-item-name">Stripe (Credit Card)</span>
              <span className={`settings-item-status ${settings.stripe_enabled === '1' ? 'active' : ''}`}>
                {settings.stripe_enabled === '1' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <label className="toggle">
              <input 
                type="checkbox" 
                checked={settings.stripe_enabled === '1'} 
                onChange={(e) => handleChange('stripe_enabled', e.target.checked ? '1' : '0')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-section glass-card">
        <h3>🔑 API Keys</h3>
        <p className="settings-desc">Manage API credentials for providers</p>
        <div className="api-key-form">
          <div className="field-group">
            <label>SmileOne API Key</label>
            <input 
              type="password" 
              className="input-field" 
              value={settings.smileone_key || ''} 
              onChange={(e) => handleChange('smileone_key', e.target.value)}
            />
          </div>
          <div className="field-group">
            <label>UniPin Merchant ID</label>
            <input 
              type="text" 
              className="input-field" 
              value={settings.unipin_id || ''} 
              onChange={(e) => handleChange('unipin_id', e.target.value)}
            />
          </div>
          <div className="field-group">
            <label>ABA PayWay Token</label>
            <input 
              type="password" 
              className="input-field" 
              value={settings.aba_token || ''} 
              onChange={(e) => handleChange('aba_token', e.target.value)}
            />
          </div>
          <button 
            className="btn-primary" 
            style={{ alignSelf: 'flex-start', marginTop: '16px' }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======== Games Tab ======== */
function GamesTab({ games, onRefresh }) {
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [isUpdatingGame, setIsUpdatingGame] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
  const [draftGame, setDraftGame] = useState({ name: '', slug: '', publisher: '', category: 'Mobile Games' });
  const [gameIcon, setGameIcon] = useState(null);
  const iconInputRef = useRef(null);

  const handleCreateGame = async (e) => {
    e.preventDefault();
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
      setSubmitMessage({ type: 'error', text: err.message });
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleUpdateGame = async (e) => {
    e.preventDefault();
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
      alert(err.message);
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
      alert(err.message);
    }
  };

  return (
    <div className="products-tab">
      <div className="product-form-card glass-card">
        <h3 className="product-form-title">Add New Game</h3>
        <form className="row product-form-row" onSubmit={handleCreateGame}>
          <div className="col">
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
          </div>
          <div className="col">
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
          </div>
          <div className="col">
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
          </div>
          <div className="col">
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
          </div>
          <div className="col">
            <div className="product-form-field">
              <label>Icon / Image</label>
              <input 
                type="file" 
                ref={iconInputRef}
                className="input-field" 
                onChange={(e) => setGameIcon(e.target.files[0])}
              />
            </div>
          </div>
          <div className="col col-4">
            <div className="product-form-actions">
              <button type="submit" className="btn-primary" disabled={isCreatingGame}>
                {isCreatingGame ? 'Creating...' : 'Create Game'}
              </button>
              {submitMessage.text && (
                <p className={`product-form-message ${submitMessage.type}`}>{submitMessage.text}</p>
              )}
            </div>
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
            {games.map(game => (
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
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Edit Game</h3>
              <button className="admin-modal-close" onClick={() => setEditingGame(null)}>×</button>
            </div>
            <form className="row modal-form-row" onSubmit={handleUpdateGame}>
              <div className="col col-4">
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
              </div>

              <div className="col col-2">
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
              </div>

              <div className="col col-2">
                <div className="field-group">
                  <label>Status</label>
                  <select
                    className="input-field"
                    value={editingGame.status}
                    onChange={(e) => setEditingGame({ ...editingGame, status: parseInt(e.target.value) })}
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="col col-4">
                <div className="field-group">
                  <label>New Icon (Optional)</label>
                  <input
                    type="file"
                    className="input-field"
                    onChange={(e) => setEditingGame({ ...editingGame, newIcon: e.target.files[0] })}
                  />
                </div>
              </div>

              <div className="col col-4">
                <div className="admin-modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setEditingGame(null)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={isUpdatingGame}>
                    {isUpdatingGame ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
