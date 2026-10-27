const API = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  products: () => request('/products'),
  product: (id) => request(`/products/${id}`),
  createProduct: (product) => request('/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (id, product) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  orders: () => request('/orders'),
  order: (id) => request(`/orders/${id}`),
  placeOrder: (order) => request('/orders', { method: 'POST', body: JSON.stringify(order) }),
  setOrderStatus: (id, status) => request(`/orders/${id}/status?value=${encodeURIComponent(status)}`, { method: 'PATCH' }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
  summary: () => request('/dashboard/summary'),
};
