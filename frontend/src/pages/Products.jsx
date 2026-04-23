import { useState, useEffect, useCallback } from 'react'
import ProductCard from '../components/ProductCard'
import Spinner from '../components/Spinner'
import { productsApi } from '../api'

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
  </svg>
)

export default function Products() {
  const [products,    setProducts]    = useState([])
  const [categories,  setCategories]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [pagination,  setPagination]  = useState({ page: 1, pages: 1, total: 0 })
  const [activeCat,   setActiveCat]   = useState('')
  const [search,      setSearch]      = useState('')
  const [debouncedQ,  setDebouncedQ]  = useState('')

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: 12 }
      if (activeCat) params.category = activeCat
      const { data } = await productsApi.list(params)
      setProducts(data.data.products)
      setPagination(data.data.pagination)
    } catch (_) {}
    finally { setLoading(false) }
  }, [activeCat])

  useEffect(() => { fetchProducts(1) }, [fetchProducts])

  useEffect(() => {
    productsApi.categories()
      .then(({ data }) => setCategories(data.data))
      .catch(() => {})
  }, [])

  const filtered = debouncedQ
    ? products.filter((p) =>
        p.name.toLowerCase().includes(debouncedQ.toLowerCase()) ||
        p.description?.toLowerCase().includes(debouncedQ.toLowerCase())
      )
    : products

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title text-3xl">All Products</h1>
        <p className="section-subtitle">{pagination.total} items available</p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <FilterIcon />
          <button
            onClick={() => setActiveCat('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeCat === '' ? 'bg-brand-600 text-white' : 'bg-surface-700 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCat === c.id ? 'bg-brand-600 text-white' : 'bg-surface-700 text-gray-400 hover:text-white'
              }`}
            >
              {c.name} <span className="opacity-60">({c.product_count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Products grid */}
      {loading ? (
        <Spinner size="lg" className="py-32" />
      ) : filtered.length === 0 ? (
        <div className="card py-24 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-400">No products found.</p>
          {(search || activeCat) && (
            <button onClick={() => { setSearch(''); setActiveCat('') }} className="btn-secondary mt-4 mx-auto">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && !debouncedQ && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchProducts(pagination.page - 1)}
                className="btn-secondary px-4 py-2"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-400 px-4">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchProducts(pagination.page + 1)}
                className="btn-secondary px-4 py-2"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
