import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { cartApi } from '../api'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  const { isAuth } = useAuth()
  const [cart,    setCart]    = useState({ items: [], total: '0.00' })
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    if (!isAuth) { setCart({ items: [], total: '0.00' }); return }
    setLoading(true)
    try {
      const { data } = await cartApi.get()
      setCart(data.data)
    } catch (_) {}
    finally { setLoading(false) }
  }, [isAuth])

  useEffect(() => { fetchCart() }, [fetchCart])

  const addItem = useCallback(async (product, quantity = 1) => {
    await cartApi.addItem({
      product_id:   product.id,
      product_name: product.name,
      price:        product.price,
      quantity,
    })
    await fetchCart()
  }, [fetchCart])

  const removeItem = useCallback(async (itemId) => {
    await cartApi.removeItem(itemId)
    await fetchCart()
  }, [fetchCart])

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, loading, itemCount, fetchCart, addItem, removeItem }}>
      {children}
    </CartContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  return ctx
}
