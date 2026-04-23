import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'

const ShoppingCartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors duration-150 ${
    isActive ? 'text-brand-400' : 'text-gray-400 hover:text-gray-100'
  }`

export default function Navbar() {
  const { user, isAuth, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-surface-700 bg-surface-900/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🛒</span>
            <span className="text-xl font-extrabold bg-gradient-to-r from-brand-400 to-brand-300
                             bg-clip-text text-transparent group-hover:from-brand-300 transition-all">
              NexCart
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/"          className={navLinkClass} end>Home</NavLink>
            <NavLink to="/products"  className={navLinkClass}>Products</NavLink>
            {isAuth && <NavLink to="/orders"  className={navLinkClass}>Orders</NavLink>}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {isAuth ? (
              <>
                {/* Cart */}
                <Link to="/cart" className="relative p-2 rounded-xl hover:bg-surface-700 transition-colors">
                  <ShoppingCartIcon />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 badge-brand min-w-[18px] h-[18px] text-[10px]">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </Link>



                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-surface-700 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 card border-surface-600 shadow-2xl animate-fade-in">
                      <div className="px-4 py-3 border-b border-surface-700">
                        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <div className="p-1">
                        <Link to="/orders"
                          onClick={() => setMenuOpen(false)}
                          className="block px-3 py-2 text-sm text-gray-300 hover:bg-surface-700 rounded-lg transition-colors">
                          My Orders
                        </Link>
                        <button
                          onClick={() => { setMenuOpen(false); handleLogout() }}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-600/10 rounded-lg transition-colors">
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"    className="btn-ghost text-sm px-4 py-2">Login</Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for menu close */}
      {menuOpen && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setMenuOpen(false)} />
      )}
    </nav>
  )
}
