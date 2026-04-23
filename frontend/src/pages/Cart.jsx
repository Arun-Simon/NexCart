import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { ordersApi } from '../api'
import toast from 'react-hot-toast'
import Spinner from '../components/Spinner'

const formatPrice = (p) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p)

export default function Cart() {
  const { cart, loading: cartLoading, removeItem, fetchCart } = useCart()
  const navigate = useNavigate()
  const [checkingOut, setCheckingOut] = useState(false)

  const handleCheckout = async () => {
    setCheckingOut(true)
    try {
      await ordersApi.place()
      await fetchCart()
      toast.success('Order placed successfully! 🎉')
      navigate('/orders')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to checkout')
    } finally {
      setCheckingOut(false)
    }
  }

  if (cartLoading) return <Spinner size="lg" className="py-32" />

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <h1 className="section-title text-3xl mb-8">Shopping Cart</h1>

      {!cart?.items?.length ? (
        <div className="card py-24 text-center">
          <div className="text-4xl mb-4">🛒</div>
          <p className="text-gray-400 mb-6 text-lg">Your cart is empty.</p>
          <Link to="/products" className="btn-primary">Continue Shopping</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="card p-4 flex gap-4 items-center">
                <div className="w-16 h-16 bg-surface-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📦</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product_id}`} className="text-white font-medium hover:text-brand-400 truncate block">
                    {item.product_name}
                  </Link>
                  <p className="text-sm text-gray-400 mt-1">
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white mb-2">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="md:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-lg font-bold text-white mb-4">Order Summary</h2>
              
              <div className="space-y-3 text-sm border-b border-surface-700 pb-4 mb-4">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal ({cart.items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className="text-emerald-400">Free</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold text-white mb-6">
                <span>Total</span>
                <span className="text-brand-400">{formatPrice(cart.total)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="btn-primary w-full py-3"
              >
                {checkingOut ? <Spinner size="sm" /> : 'Proceed to Checkout'}
              </button>
              
              <p className="text-xs text-center text-gray-500 mt-4">
                Secure checkout powered by NexCart
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
