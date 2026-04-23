import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ordersApi } from '../api'
import Spinner from '../components/Spinner'

const formatPrice = (p) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p)

const formatDate = (d) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d))

const StatusBadge = ({ status }) => {
  const colors = {
    pending:   'badge-warning',
    confirmed: 'badge-brand',
    shipped:   'badge-success',
    delivered: 'badge-success',
    cancelled: 'badge-error',
  }
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors[status] || 'badge-warning'}`}>{status}</span>
}

export default function Orders() {
  const [orders,   setOrders]  = useState([])
  const [loading,  setLoading] = useState(true)

  useEffect(() => {
    ordersApi.list()
      .then(({ data }) => setOrders(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner size="lg" className="py-32" />

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <h1 className="section-title text-3xl mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="card py-24 text-center">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-gray-400 mb-6 text-lg">You haven't placed any orders yet.</p>
          <Link to="/products" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="card overflow-hidden">
              {/* Order Header */}
              <div className="bg-surface-700/50 px-6 py-4 border-b border-surface-700 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-8">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order Placed</p>
                    <p className="text-sm font-medium text-white">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-sm font-medium text-white">{formatPrice(order.total_amount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order #</p>
                    <p className="text-sm font-mono text-gray-300">{order.id.slice(0, 13)}…</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-surface-700 rounded text-xl flex items-center justify-center">
                        📦
                      </div>
                      <div className="flex-1">
                        <Link to={`/products/${item.product_id}`} className="font-medium text-white hover:text-brand-400">
                          {item.product_name}
                        </Link>
                        <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <div className="font-semibold text-gray-200">
                        {formatPrice(item.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
