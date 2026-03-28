import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import TopUpPage from './pages/TopUpPage';
import OrderStatusPage from './pages/OrderStatusPage';
import AdminDashboard from './pages/AdminDashboard';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import LoginPage from './pages/LoginPage';
import UserProfile from './pages/UserProfile';
import GridShowcasePage from './pages/GridShowcasePage';
import MobileLegendsQuickTopUp from './components/MobileLegendsQuickTopUp';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={(
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            )}
          />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/profile"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route path="/topup/mobile-legends" element={<MobileLegendsQuickTopUp />} />
          <Route path="/topup/:gameSlug" element={<TopUpPage />} />
          <Route path="/order-status" element={<OrderStatusPage />} />
          <Route
            path="/admin"
            element={(
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/add-product"
            element={(
              <ProtectedRoute role="admin">
                <AddProductPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/edit-product/:productId"
            element={(
              <ProtectedRoute role="admin">
                <EditProductPage />
              </ProtectedRoute>
            )}
          />
            <Route path="/grid-showcase" element={<GridShowcasePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
