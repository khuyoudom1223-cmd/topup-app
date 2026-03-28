import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../services/api';
import './AddProductPage.css';

export default function AddProductPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    productName: '',
    gameId: '',
    amount: '',
    price: '',
    description: '',
    currency: 'USD',
  });

  // Check authorization
  useState(() => {
    const token = localStorage.getItem('topupgg_token');
    const user = JSON.parse(localStorage.getItem('topupgg_user') || '{}');
    if (!token || user.type !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          data: event.target.result,
        }]);
      };
      reader.readAsDataURL(file);
    });
    setError('');
  };

  const handleRemoveImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.productName.trim()) {
      setError('Product name is required');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const product = {
        name: formData.productName,
        gameId: formData.gameId || 'generic',
        amount: Number(formData.amount),
        price: Number(formData.price),
        description: formData.description,
        currency: formData.currency,
        images: images.map(img => img.data),
      };

      await createProduct(product);
      setSuccess('Product created successfully! Redirecting...');
      
      setTimeout(() => {
        navigate('/admin?tab=products');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create product');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin?tab=products');
  };

  return (
    <div className="add-product-page">
      <div className="add-product-container">
        {/* Header */}
        <div className="add-product-header">
          <span className="add-product-icon">➕</span>
          <h1 className="add-product-title">Add New Product</h1>
        </div>

        {/* Messages */}
        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="success-message">
            <span>✓</span> {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="add-product-form">
          {/* Left Column - Inputs */}
          <div className="product-form-section">
            <div className="form-group">
              <label htmlFor="productName">Product Name *</label>
              <input
                id="productName"
                type="text"
                name="productName"
                placeholder="e.g., 100 Diamonds"
                value={formData.productName}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span className="form-help-text">Enter the product name or package name</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount">Amount *</label>
                <input
                  id="amount"
                  type="number"
                  name="amount"
                  placeholder="e.g., 100"
                  value={formData.amount}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="1"
                  step="1"
                />
                <span className="form-help-text">Quantity or in-game currency amount</span>
              </div>

              <div className="form-group">
                <label htmlFor="price">Price USD *</label>
                <input
                  id="price"
                  type="number"
                  name="price"
                  placeholder="e.g., 4.99"
                  value={formData.price}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="0.01"
                  step="0.01"
                />
                <span className="form-help-text">Product price in dollars</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="gameId">Game ID (Optional)</label>
              <input
                id="gameId"
                type="text"
                name="gameId"
                placeholder="e.g., mobile-legends"
                value={formData.gameId}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span className="form-help-text">Link product to a specific game</span>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                name="description"
                placeholder="Add product details, features, or notes..."
                value={formData.description}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span className="form-help-text">Additional product information</span>
            </div>
          </div>

          {/* Right Column - Image Upload */}
          <div className="product-form-section">
            <div
              className="image-upload-section"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <div className="image-upload-icon">🖼️</div>
              <div className="image-upload-text">
                <strong>Upload Product Images</strong>
                <p>Click to select or drag and drop</p>
                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>PNG, JPG, GIF up to 5MB each</p>
              </div>
              <input
                ref={fileInputRef}
                id="productImageInput"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={loading}
              />
            </div>

            {/* Images Grid */}
            {images.length > 0 && (
              <>
                <div style={{ marginTop: 'var(--space-lg)' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                    Uploaded Images ({images.length})
                  </h3>
                  <div className="product-images-grid">
                    {images.map(image => (
                      <div key={image.id} className="product-image-card">
                        <img src={image.data} alt="Product" />
                        <button
                          type="button"
                          className="product-image-remove"
                          onClick={() => handleRemoveImage(image.id)}
                          title="Remove image"
                          disabled={loading}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Buttons - Full Width */}
          <div className="product-button-section">
            <button
              type="submit"
              className="btn-create-product"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Creating...
                </>
              ) : (
                <>
                  ✓ Create Product
                </>
              )}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
