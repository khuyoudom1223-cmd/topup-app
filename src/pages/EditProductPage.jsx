import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProducts, updateProduct, deleteProduct } from '../services/api';
import './EditProductPage.css';

export default function EditProductPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    productName: '',
    gameId: '',
    amount: '',
    price: '',
    description: '',
    currency: 'USD',
  });
  
  const [currentImage, setCurrentImage] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState('');

  // Check authorization
  useEffect(() => {
    const token = localStorage.getItem('topupgg_token');
    const user = JSON.parse(localStorage.getItem('topupgg_user') || '{}');
    if (!token || user.type !== 'admin') {
      navigate('/login');
      return;
    }

    if (!productId) {
      setError('Product ID is missing');
      setLoading(false);
      return;
    }

    loadProduct();
  }, [navigate, productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      // Fetch all products and find the one with matching ID
      // In a real app, you'd have a dedicated endpoint to fetch a single product
      const allProducts = await fetchProducts('all');
      const product = allProducts.find(p => String(p.id) === String(productId));
      
      if (!product) {
        setError('Product not found');
        setLoading(false);
        return;
      }

      setFormData({
        productName: product.name || product.productName || '',
        gameId: product.gameId || product.game_id || '',
        amount: String(product.amount || ''),
        price: String(product.price || ''),
        description: product.description || product.title || '',
        currency: product.currency || 'USD',
      });

      setCurrentImage(product.imageSrc || product.image_path || '');
    } catch (err) {
      setError('Failed to load product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setNewImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
    setError('');
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

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.productName);
      formDataToSend.append('gameId', formData.gameId || 'generic');
      formDataToSend.append('amount', String(formData.amount));
      formDataToSend.append('price', String(formData.price));
      formDataToSend.append('description', formData.description);
      formDataToSend.append('currency', formData.currency);

      if (newImageFile) {
        formDataToSend.append('image', newImageFile);
      }

      await updateProduct(productId, formDataToSend);
      setSuccess('Product updated successfully! Redirecting...');
      
      setTimeout(() => {
        navigate('/admin?tab=products');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update product');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await deleteProduct(productId);
      setSuccess('Product deleted successfully! Redirecting...');
      
      setTimeout(() => {
        navigate('/admin?tab=products');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to delete product');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin?tab=products');
  };

  if (loading) {
    return (
      <div className="edit-product-page">
        <div className="edit-product-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto', marginBottom: '20px' }}></div>
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-product-page">
      <div className="edit-product-container">
        {/* Header */}
        <div className="edit-product-header">
          <span className="edit-product-icon">✏️</span>
          <h1 className="edit-product-title">Edit Product</h1>
        </div>

        {/* Messages */}
        {error && (
          <div className="alert-box error">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="alert-box success">
            <span>✓</span> {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="edit-product-form">
          {/* Left Column - Inputs */}
          <div className="edit-product-form-section">
            <div className="edit-form-group">
              <label htmlFor="productName">Product Name *</label>
              <input
                id="productName"
                type="text"
                name="productName"
                placeholder="e.g., 100 Diamonds"
                value={formData.productName}
                onChange={handleInputChange}
                disabled={submitting || deleting}
              />
              <span className="edit-form-help-text">Enter the product name or package name</span>
            </div>

            <div className="edit-form-row">
              <div className="edit-form-group">
                <label htmlFor="amount">Amount *</label>
                <input
                  id="amount"
                  type="number"
                  name="amount"
                  placeholder="e.g., 100"
                  value={formData.amount}
                  onChange={handleInputChange}
                  disabled={submitting || deleting}
                  min="1"
                  step="1"
                />
                <span className="edit-form-help-text">Quantity or in-game currency amount</span>
              </div>

              <div className="edit-form-group">
                <label htmlFor="price">Price USD *</label>
                <input
                  id="price"
                  type="number"
                  name="price"
                  placeholder="e.g., 4.99"
                  value={formData.price}
                  onChange={handleInputChange}
                  disabled={submitting || deleting}
                  min="0.01"
                  step="0.01"
                />
                <span className="edit-form-help-text">Product price in dollars</span>
              </div>
            </div>

            <div className="edit-form-group">
              <label htmlFor="gameId">Game ID (Optional)</label>
              <input
                id="gameId"
                type="text"
                name="gameId"
                placeholder="e.g., mobile-legends"
                value={formData.gameId}
                onChange={handleInputChange}
                disabled={submitting || deleting}
              />
              <span className="edit-form-help-text">Link product to a specific game</span>
            </div>

            <div className="edit-form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                name="description"
                placeholder="Add product details, features, or notes..."
                value={formData.description}
                onChange={handleInputChange}
                disabled={submitting || deleting}
              />
              <span className="edit-form-help-text">Additional product information</span>
            </div>
          </div>

          {/* Right Column - Image & Delete */}
          <div className="edit-product-form-section">
            {/* Current Image */}
            {currentImage && !newImagePreview && (
              <div className="edit-current-image">
                <img src={currentImage} alt="Product" />
              </div>
            )}

            {/* New Image Preview */}
            {newImagePreview && (
              <div className="edit-current-image">
                <img src={newImagePreview} alt="New Product" />
              </div>
            )}

            {/* Image Upload */}
            <div
              className="edit-image-section"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <div className="edit-image-icon">🖼️</div>
              <div style={{ textAlign: 'center' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Change Product Image</strong>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {newImagePreview ? 'Click to select a different image' : 'Click to select or drag and drop'}
                </p>
                <p style={{ fontSize: '0.8rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={submitting || deleting}
                style={{ display: 'none' }}
              />
            </div>

            {/* Delete Section */}
            <div className="edit-delete-section">
              <h3>⚠️ Delete Product</h3>
              <p>Once deleted, this product cannot be recovered. This action is permanent.</p>
              <button
                type="button"
                className="btn-delete-product"
                onClick={handleDelete}
                disabled={submitting || deleting}
              >
                {deleting ? (
                  <>
                    <span className="loading-spinner"></span> Deleting...
                  </>
                ) : (
                  '🗑️ Delete Product'
                )}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="edit-button-section">
            <button
              type="submit"
              className="btn-update-product"
              disabled={submitting || deleting || loading}
            >
              {submitting ? (
                <>
                  <span className="loading-spinner"></span>
                  Updating...
                </>
              ) : (
                <>
                  ✓ Update Product
                </>
              )}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={handleCancel}
              disabled={submitting || deleting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
