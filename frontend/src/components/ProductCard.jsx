import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

// Deterministic gradient from product id for placeholder images
const gradients = [
  'from-purple-600 to-blue-600',
  'from-blue-600 to-cyan-600',
  'from-emerald-600 to-teal-600',
  'from-orange-600 to-pink-600',
  'from-pink-600 to-rose-600',
  'from-violet-600 to-indigo-600',
  'from-amber-600 to-orange-600',
  'from-teal-600 to-green-600',
]

const gradientFor = (id = '') => gradients[id.charCodeAt(0) % gradients.length]

const formatPrice = (price) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)

const stockBadge = (stock) => {
  if (stock === 0) return <span className="badge-error">Out of stock</span>
  if (stock <= 5)  return <span className="badge-warning">Only {stock} left</span>
  return <span className="badge-success">In stock</span>
}

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const { isAuth }  = useAuth()

  const handleAddToCart = async (e) => {
    e.preventDefault()
    if (!isAuth) { toast.error('Please log in to add items to cart'); return }
    if (product.stock === 0) { toast.error('Product is out of stock'); return }
    try {
      await addItem(product)
      toast.success(`${product.name.slice(0, 20)}… added to cart`)
    } catch {
      toast.error('Failed to add to cart')
    }
  }

  return (
    <Link to={`/products/${product.id}`} className="card-hover flex flex-col group">
      {/* Image / placeholder */}
      <div className={`relative h-48 bg-gradient-to-br ${gradientFor(product.id)} flex items-center justify-center overflow-hidden`}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <span className="text-6xl opacity-30">📦</span>
        )}
        {product.category_name && (
          <span className="absolute top-3 left-3 badge bg-black/40 text-white backdrop-blur-sm text-[11px]">
            {product.category_name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-brand-300 transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-gray-500 text-xs mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto">
          {stockBadge(product.stock)}
          <span className="text-lg font-bold text-brand-400">{formatPrice(product.price)}</span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="btn-primary w-full text-sm py-2 mt-1"
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  )
}
