import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Spinner from '../components/Spinner'
import { productsApi } from '../api'

const HeroSection = () => (
  <section className="relative overflow-hidden py-20 px-4 text-center">
    {/* Background glow */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl" />
    </div>

    <div className="relative max-w-3xl mx-auto animate-slide-up">
      <span className="badge-brand px-4 py-1.5 text-sm mb-6 inline-block">
        🚀 Microservices Powered Commerce
      </span>
      <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
        Shop Smarter with{' '}
        <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
          NexCart
        </span>
      </h1>
      <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
        A blazing-fast ecommerce platform built on microservices.
        Discover top products, seamless checkout, and real-time order tracking.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/products" className="btn-primary text-base px-8 py-3">
          Browse Products
        </Link>
        <Link to="/register" className="btn-secondary text-base px-8 py-3">
          Create Account
        </Link>
      </div>
    </div>

    {/* Stats bar */}
    <div className="relative mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
      {[
        { label: 'Products',  value: '10+' },
        { label: 'Services',  value: '5'   },
        { label: 'Uptime',    value: '99%' },
      ].map((s) => (
        <div key={s.label} className="card px-4 py-3 text-center">
          <div className="text-2xl font-extrabold text-brand-400">{s.value}</div>
          <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  </section>
)

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    productsApi.list({ limit: 8, page: 1 })
      .then(({ data }) => setProducts(data.data.products))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <HeroSection />

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="section-title">Featured Products</h2>
            <p className="section-subtitle">Handpicked just for you</p>
          </div>
          <Link to="/products" className="btn-ghost text-brand-400 hover:text-brand-300 text-sm font-semibold">
            View all →
          </Link>
        </div>

        {loading ? (
          <Spinner size="lg" className="py-24" />
        ) : products.length === 0 ? (
          <div className="card py-20 text-center text-gray-500">
            No products available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Features section */}
      <section className="border-t border-surface-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '⚡', title: 'Lightning Fast', desc: 'Microservices architecture for maximum performance and scalability.' },
              { icon: '🔒', title: 'Secure Auth',    desc: 'JWT access + refresh tokens, bcrypt password hashing, session management.' },
              { icon: '🔔', title: 'Real-time Notifications', desc: 'RabbitMQ-powered event bus delivers instant order updates.' },
            ].map((f) => (
              <div key={f.title} className="card p-6 flex gap-4 items-start hover:border-brand-600/40 transition-colors">
                <span className="text-3xl">{f.icon}</span>
                <div>
                  <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
