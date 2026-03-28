import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState('user'); // 'user' | 'admin'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const authData = await loginUser(loginType, username, password);
      // Save token and user info to localStorage
      localStorage.setItem('topupgg_token', authData.token);
      localStorage.setItem('topupgg_user', JSON.stringify(authData.user));

      // Redirect map
      if (authData.user.type === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPass = () => {
    alert('Password reset link has been sent to your email (Mocked)');
  };

  return (
    <div className="login-page">
      <div className="login-container glass-card animate-fade-in-up">
        
        <div className="login-header">
          <span className="login-icon">🔒</span>
          <h2>Welcome Back</h2>
          <p>Sign in to continue to DOM TopUp</p>
        </div>

        {/* Combined Option: User vs Admin Selection */}
        <div className="login-type-toggle">
          <button 
            className={`toggle-btn ${loginType === 'user' ? 'active' : ''}`}
            onClick={() => setLoginType('user')}
            type="button"
          >
            👤 User Login
          </button>
          <button 
            className={`toggle-btn ${loginType === 'admin' ? 'active' : ''}`}
            onClick={() => setLoginType('admin')}
            type="button"
          >
            🛡️ Admin Login
          </button>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          
          <div className="alert-message">
            {loginType === 'admin' 
              ? 'Admin access required. Please enter your admin email and password.' 
              : 'Please enter your username/email and password to log in as a user.'}
          </div>

          {error && <div className="login-error">{error}</div>}

          <div className="field-group">
            <label>{loginType === 'admin' ? 'Admin Email / Username' : 'Username / Email'}</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder={`Enter your ${loginType === 'admin' ? 'admin email' : 'username'}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <label>Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" /> Remember me
            </label>
            <button type="button" className="forgot-btn" onClick={handleForgotPass}>
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? 'Authenticating...' : `Login as ${loginType === 'admin' ? 'Admin' : 'User'}`}
          </button>

        </form>

        <div className="login-footer">
          Don&apos;t have an account? <a href="#" onClick={(e) => { e.preventDefault(); alert('Sign up mocked'); }}>Sign up here</a>
        </div>
      </div>
    </div>
  );
}
