import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      {/* Fallback */}
      <Route path="*" element={
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-6xl mb-4">🛸</h1>
          <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
          <p className="text-gray-400 mb-6">The page you're looking for has drifted into deep space.</p>
          <a href="/" className="btn-primary">Return Home</a>
        </div>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col relative selection:bg-brand-500/30 selection:text-brand-200">
          <Navbar />
          <main className="flex-1 w-full relative z-10">
            <AppRoutes />
          </main>

          {/* Simple Footer */}
          <footer className="border-t border-surface-700 mt-auto py-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} NexCart Microservices Demo. Built for speed.</p>
          </footer>
        </div>
      </CartProvider>
    </AuthProvider>
  )
}
