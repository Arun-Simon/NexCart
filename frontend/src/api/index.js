import api from './axios'

export const authApi = {
  register: (data)         => api.post('/auth/register', data),
  login:    (data)         => api.post('/auth/login', data),
  refresh:  (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout:   (refreshToken) => api.post('/auth/logout', { refreshToken }),
  me:       ()             => api.get('/auth/me'),
}

export const productsApi = {
  list:     (params) => api.get('/products', { params }),
  get:      (id)     => api.get(`/products/${id}`),
  create:   (data)   => api.post('/products', data),
  update:   (id, data) => api.put(`/products/${id}`, data),
  remove:   (id)     => api.delete(`/products/${id}`),
  categories: ()     => api.get('/categories'),
}

export const cartApi = {
  get:        ()         => api.get('/cart'),
  addItem:    (data)     => api.post('/cart/items', data),
  removeItem: (id)       => api.delete(`/cart/items/${id}`),
}

export const ordersApi = {
  place:  ()   => api.post('/orders'),
  list:   ()   => api.get('/orders'),
  get:    (id) => api.get(`/orders/${id}`),
}

export const notificationsApi = {
  list:      ()   => api.get('/notifications'),
  markRead:  (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}
