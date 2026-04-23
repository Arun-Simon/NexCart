import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { productsApi } from '../api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const gradients = [
  'from-purple-600 to-blue-600', 'from-blue-600 to-cyan-600',
  'from-emerald-600 to-teal-600', 'from-orange-600 to-pink-600',
]
const gradientFor = (id = '') => gradients[id.charCodeAt(0) % gradients.length]

const formatPrice = (p) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p)

export default function ProductDetail() {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const { isAuth }    = useAuth()
  const { addItem }   = useCart()
  const [product,  setProduct]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [qty,      setQty]      = useState(1)
  const [adding,   setAdding]   = useState(false)

  useEffect(() => {
    productsApi.get(id)
      .then(({ data }) => setProduct(data.data))
      .catch(() => navigate('/products', { replace: true }))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleAdd = async () => {
    if (!isAuth) { toast.error('Please login first'); navigate('/login'); return }
    if (product.stock === 0) { toast.error('Out of stock'); return }
    setAdding(true)
    try {
      await addItem(product, qty)
      toast.success('Added to cart!')
    } catch {
      toast.error('Failed to add to cart')
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <Spinner size="lg" className="min-h-screen" />
  if (!product) return null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-6 text-sm">
        ← Back
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className={`rounded-2xl bg-gradient-to-br ${gradientFor(product.id)} h-80 md:h-full flex items-center justify-center overflow-hidden`}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none' }} />
          ) : (
            <span className="text-8xl opacity-30">📦</span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          {product.category_name && (
            <span className="badge-brand self-start">{product.category_name}</span>
          )}
          <h1 className="text-3xl font-extrabold text-white leading-tight">{product.name}</h1>
          <p className="text-4xl font-bold text-brand-400">{formatPrice(product.price)}</p>

          {product.description && (
            <p className="text-gray-400 leading-relaxed text-sm">{product.description}</p>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-sm text-gray-400">
              {product.stock === 0 ? 'Out of stock' : `${product.stock} units in stock`}
            </span>
          </div>

          {/* Qty selector */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 font-medium">Quantity</span>
              <div className="flex items-center bg-surface-700 rounded-xl border border-surface-600">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center text-lg hover:text-brand-400 transition-colors"
                >−</button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="w-9 h-9 flex items-center justify-center text-lg hover:text-brand-400 transition-colors"
                >+</button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAdd}
              disabled={adding || product.stock === 0}
              className="btn-primary flex-1 py-3 text-base"
            >
              {adding ? <Spinner size="sm" /> : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>

          {/* Meta */}
          <div className="border-t border-surface-700 pt-4 grid grid-cols-2 gap-3">
            <div className="card p-3 text-center">
              <div className="text-xs text-gray-500">Category</div>
              <div className="text-sm font-medium text-white mt-1">{product.category_name || '—'}</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-xs text-gray-500">SKU</div>
              <div className="text-sm font-medium text-white mt-1 font-mono">{product.id.slice(0, 8)}…</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
