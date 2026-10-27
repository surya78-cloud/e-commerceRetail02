const API = import.meta.env.VITE_API_URL || '/api';

async function getCsrfToken() {
  const response = await fetch(`${API}/auth/csrf`, { credentials: 'same-origin' });
  if (!response.ok) throw new Error(`Could not prepare secure request (${response.status})`);
  const { token } = await response.json();
  return token;
}

async function request(path, options = {}) {
  const method = options.method || 'GET';
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    headers['X-XSRF-TOKEN'] = await getCsrfToken();
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'same-origin',
    headers,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const requestError = new Error(error.message || `Request failed (${response.status})`);
    requestError.status = response.status;
    throw requestError;
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  session: () => request('/auth/session'),
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password }).toString(),
    }),
  logout: () => request('/auth/logout', { method: 'POST' }),
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
