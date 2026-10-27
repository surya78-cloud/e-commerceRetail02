import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Eye,
  LayoutDashboard,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Tag,
  Trash2,
  X
} from 'lucide-react';
import { api } from './api';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Products', icon: Tag },
  { label: 'Inventory', icon: Box },
  { label: 'Orders', icon: ClipboardList },
  { label: 'Storefront', icon: Store },
];

const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
const shortDate = (value) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  } catch {
    return String(value);
  }
};

export default function App() {
  const [page, setPage] = useState('Overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [storeCategory, setStoreCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      const [nextProducts, nextOrders, nextSummary] = await Promise.all([
        api.products(),
        api.orders(),
        api.summary(),
      ]);
      setProducts(nextProducts || []);
      setOrders(nextOrders || []);
      setSummary(nextSummary || null);
      if (notice?.type === 'error') setNotice(null);
    } catch (error) {
      setNotice({
        type: 'error',
        message: `${error.message}. Start the Spring Boot API (mvnw spring-boot:run) to connect live store data.`,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function saveProduct(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.price = parseFloat(payload.price);
    payload.stock = parseInt(payload.stock, 10);

    try {
      if (editingProduct?.id) {
        await api.updateProduct(editingProduct.id, payload);
        setNotice({ type: 'success', message: `Product "${payload.name}" updated successfully.` });
      } else {
        await api.createProduct(payload);
        setNotice({ type: 'success', message: `Product "${payload.name}" added to catalogue.` });
      }
      setShowProductForm(false);
      setEditingProduct(null);
      await refresh();
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    }
  }

  function openCreateProduct() {
    setEditingProduct(null);
    setShowProductForm(true);
  }

  function openEditProduct(product) {
    setEditingProduct(product);
    setShowProductForm(true);
  }

  async function deleteProduct(id, name) {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the catalogue?`)) return;
    try {
      await api.deleteProduct(id);
      setNotice({ type: 'success', message: `Product "${name}" deleted.` });
      await refresh();
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    }
  }

  async function changeStatus(order, status) {
    try {
      await api.setOrderStatus(order.id, status);
      setNotice({ type: 'success', message: `Order #${(order.id || '').slice(-6).toUpperCase()} status changed to ${status}.` });
      if (viewingOrder && viewingOrder.id === order.id) {
        setViewingOrder((prev) => ({ ...prev, status }));
      }
      await refresh();
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    }
  }

  async function deleteOrder(id) {
    if (!window.confirm('Are you sure you want to remove this order?')) return;
    try {
      await api.deleteOrder(id);
      setNotice({ type: 'success', message: 'Order removed.' });
      if (viewingOrder?.id === id) setViewingOrder(null);
      await refresh();
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    }
  }

  function addToCart(product) {
    if (product.stock < 1) return;
    setCart((current) => {
      const found = current.find((item) => item.product.id === product.id);
      if (found) {
        if (found.quantity >= product.stock) {
          setNotice({ type: 'info', message: `Maximum available quantity (${product.stock}) reached for ${product.name}.` });
          return current;
        }
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function updateCartQuantity(productId, delta) {
    setCart((current) =>
      current
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.product.stock) {
              setNotice({ type: 'info', message: `Only ${item.product.stock} units available in stock.` });
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  }

  function removeFromCart(productId) {
    setCart((current) => current.filter((item) => item.product.id !== productId));
  }

  async function handleCheckoutSubmit(customerName) {
    if (!cart.length) return;
    try {
      await api.placeOrder({
        customerName: customerName.trim(),
        items: cart.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      });
      setCart([]);
      setShowCheckout(false);
      setNotice({ type: 'success', message: `Order placed for ${customerName}. Inventory has been updated.` });
      await refresh();
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    }
  }

  const categories = ['All categories', ...new Set(products.map((product) => product.category).filter(Boolean))];
  const storefrontCategories = ['All', ...new Set(products.map((product) => product.category).filter(Boolean))];

  const filtered = products.filter((product) => {
    const text = `${product.name || ''} ${product.sku || ''} ${product.category || ''}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesCategory = category === 'All categories' || product.category === category;
    return matchesSearch && matchesCategory;
  });

  const storefrontProducts = products.filter((product) => {
    const text = `${product.name || ''} ${product.sku || ''} ${product.category || ''}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesCategory = storeCategory === 'All' || product.category === storeCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStock = products.filter((product) => product.stock <= 5);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setPage('Overview')}>
          <span className="brand-mark">f.</span>
          <span>fieldwork<small>RETAIL OPERATIONS</small></span>
        </a>
        <div className="store-switch">
          <div className="store-icon">FW</div>
          <div>
            <strong>Fieldwork Goods</strong>
            <span>Online store</span>
          </div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-link ${page === label ? 'active' : ''}`}
              onClick={() => setPage(label)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {label === 'Orders' && orders.length > 0 && <em>{orders.length}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-line">
            <CircleHelp size={17} />
            <span>Help center</span>
          </div>
          <div className="profile">
            <div className="avatar">AM</div>
            <div>
              <strong>Alex Morgan</strong>
              <span>Store owner</span>
            </div>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">f.</span> fieldwork
          </div>
          <div className="breadcrumbs">
            Workspace <span>/</span> <b>{page}</b>
          </div>
          <div className="top-actions">
            {summary?.storageMode && (
              <span className={`storage-badge ${summary.storageMode}`}>
                <i /> {summary.storageMode === 'mongodb' ? 'MongoDB Active' : 'In-Memory Mode'}
              </span>
            )}
            <span className="live-status">
              <i /> Store live
            </span>
            <button
              className="icon-button"
              aria-label="Refresh Data"
              title="Refresh store data"
              onClick={refresh}
            >
              <RefreshCw size={16} />
            </button>
            <div className="avatar small">AM</div>
          </div>
        </header>

        <div className="page-wrap">
          {notice && (
            <div className={`notice ${notice.type === 'success' ? 'success' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{notice.message}</span>
                {notice.type === 'error' && (
                  <button className="retry-button" onClick={refresh}>
                    Retry
                  </button>
                )}
              </div>
              <button onClick={() => setNotice(null)} aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          )}

          {page === 'Overview' && (
            <Overview
              summary={summary}
              products={products}
              orders={orders}
              lowStock={lowStock}
              loading={loading}
              money={money}
              setPage={setPage}
              onViewOrder={setViewingOrder}
            />
          )}

          {(page === 'Products' || page === 'Inventory') && (
            <section>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">CATALOGUE</div>
                  <h1>{page === 'Products' ? 'Products' : 'Inventory'}</h1>
                  <p>
                    {page === 'Products'
                      ? 'Keep your assortment sharp and up to date.'
                      : 'Track stock levels and stay ahead of low inventory.'}
                  </p>
                </div>
                <button className="primary-button" onClick={openCreateProduct}>
                  <Plus size={17} /> Add product
                </button>
              </div>

              <div className="toolbar">
                <div className="search-box">
                  <Search size={16} />
                  <input
                    className="search-input"
                    placeholder="Search products or SKU"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <select
                  className="filter-select"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <button
                  className={`filter-chip ${page === 'Inventory' ? 'selected' : ''}`}
                  onClick={() => setPage(page === 'Inventory' ? 'Products' : 'Inventory')}
                >
                  <SlidersHorizontal size={15} /> {page === 'Inventory' ? 'Low stock focus' : 'Inventory'}
                </button>
                <span className="result-count">
                  {page === 'Inventory' ? filtered.filter((p) => p.stock <= 5).length : filtered.length} items
                </span>
              </div>

              <ProductTable
                products={page === 'Inventory' ? filtered.filter((p) => p.stock <= 5) : filtered}
                loading={loading}
                inventory={page === 'Inventory'}
                money={money}
                onEdit={openEditProduct}
                onDelete={(product) => deleteProduct(product.id, product.name)}
              />
            </section>
          )}

          {page === 'Orders' && (
            <OrdersPage
              orders={orders}
              loading={loading}
              money={money}
              changeStatus={changeStatus}
              onViewOrder={setViewingOrder}
              onDeleteOrder={deleteOrder}
            />
          )}

          {page === 'Storefront' && (
            <Storefront
              products={storefrontProducts}
              categories={storefrontCategories}
              storeCategory={storeCategory}
              setStoreCategory={setStoreCategory}
              search={search}
              setSearch={setSearch}
              cart={cart}
              cartCount={cartCount}
              cartTotal={cartTotal}
              addToCart={addToCart}
              updateCartQuantity={updateCartQuantity}
              removeFromCart={removeFromCart}
              onOpenCheckout={() => setShowCheckout(true)}
              money={money}
            />
          )}
        </div>

        <footer className="footer">
          <span>FIELDWORK GOODS</span>
          <span>
            Retail operations &middot; {summary?.storageMode === 'mongodb' ? 'Connected to MongoDB' : 'In-Memory Persistence'} &middot; {new Date().getFullYear()}
          </span>
        </footer>
      </main>

      {showProductForm && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          onSave={saveProduct}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          cart={cart}
          cartTotal={cartTotal}
          money={money}
          onClose={() => setShowCheckout(false)}
          onConfirm={handleCheckoutSubmit}
        />
      )}

      {viewingOrder && (
        <OrderDetailsModal
          order={viewingOrder}
          money={money}
          onClose={() => setViewingOrder(null)}
          onStatusChange={changeStatus}
          onDeleteOrder={deleteOrder}
        />
      )}
    </div>
  );
}

function Overview({ summary, products, orders, lowStock, loading, money, setPage, onViewOrder }) {
  const latest = orders.slice(0, 5);
  const maxStock = Math.max(1, ...products.map((p) => p.stock || 0));

  return (
    <section>
      <div className="overview-title">
        <div>
          <div className="eyebrow">STORE DASHBOARD</div>
          <h1>
            Good day, Alex <span>✳</span>
          </h1>
          <p>Here’s the pulse of your store today.</p>
        </div>
        <button className="outline-button" onClick={() => setPage('Storefront')}>
          <Store size={16} /> View storefront
        </button>
      </div>

      {loading && !summary ? (
        <div className="loading-block">Connecting to your store data…</div>
      ) : (
        <>
          <div className="metric-grid">
            <Metric
              label="Gross sales"
              value={money(summary?.revenue)}
              delta="Active orders"
              icon={ArrowUpRight}
              accent="mint"
              detail="All completed & active"
            />
            <Metric
              label="Orders"
              value={summary?.orderCount ?? 0}
              delta="Lifetime"
              icon={ShoppingBag}
              accent="coral"
              detail="Total orders processed"
            />
            <Metric
              label="Products"
              value={summary?.productCount ?? 0}
              delta="In catalogue"
              icon={Tag}
              accent="yellow"
              detail={`${summary?.unitsInStock ?? 0} units in stock`}
            />
            <Metric
              label="Low stock"
              value={summary?.lowStockCount ?? 0}
              delta="Needs attention"
              icon={ArrowDownRight}
              accent="pink"
              detail="5 units or fewer"
            />
          </div>

          <div className="dashboard-grid">
            <div className="panel sales-panel">
              <div className="panel-heading">
                <div>
                  <h2>Inventory health</h2>
                  <p>Units available by product</p>
                </div>
                <button className="text-button" onClick={() => setPage('Inventory')}>
                  View inventory <ArrowUpRight size={15} />
                </button>
              </div>
              <div className="stock-chart">
                {products.slice(0, 8).map((product, index) => (
                  <div className="stock-row" key={product.id}>
                    <div className="stock-label">
                      <span className={`product-dot dot-${index % 5}`} />
                      <span>{product.name}</span>
                    </div>
                    <div className="stock-track">
                      <i
                        className={product.stock <= 5 ? 'critical' : ''}
                        style={{ width: `${Math.max(4, ((product.stock || 0) / maxStock) * 100)}%` }}
                      />
                    </div>
                    <b>{product.stock}</b>
                  </div>
                ))}
              </div>
              <div className="chart-foot">
                <span>
                  <i className="legend-dot" /> Healthy stock
                </span>
                <span>
                  <i className="legend-dot warn" /> Low stock (&le; 5 units)
                </span>
              </div>
            </div>

            <div className="panel attention-panel">
              <div className="panel-heading">
                <div>
                  <h2>Needs attention</h2>
                  <p>{lowStock.length} items running low</p>
                </div>
                <span className="alert-count">{lowStock.length}</span>
              </div>
              {lowStock.length ? (
                <div className="attention-list">
                  {lowStock.slice(0, 4).map((product) => (
                    <div className="attention-item" key={product.id}>
                      <div className="item-initial">{(product.name || 'P').slice(0, 1)}</div>
                      <div className="attention-copy">
                        <strong>{product.name}</strong>
                        <span>{product.sku}</span>
                      </div>
                      <b className="stock-number">{product.stock} left</b>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-note">All stock levels look healthy.</div>
              )}
              <button className="attention-link" onClick={() => setPage('Inventory')}>
                Review inventory <ArrowUpRight size={15} />
              </button>
            </div>
          </div>

          <div className="panel orders-panel">
            <div className="panel-heading">
              <div>
                <h2>Recent orders</h2>
                <p>Latest activity from your store</p>
              </div>
              <button className="text-button" onClick={() => setPage('Orders')}>
                All orders <ArrowUpRight size={15} />
              </button>
            </div>
            <OrderTable
              orders={latest}
              loading={loading}
              money={money}
              compact
              onViewOrder={onViewOrder}
            />
          </div>
        </>
      )}
    </section>
  );
}

function Metric({ label, value, delta, icon: Icon, accent, detail }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <span className={`metric-icon ${accent}`}>
          <Icon size={17} />
        </span>
      </div>
      <div className="metric-value">{value ?? '—'}</div>
      <div className="metric-foot">
        <strong>{delta}</strong>
        <span>{detail}</span>
      </div>
    </article>
  );
}

function ProductTable({ products, loading, inventory, money, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>PRODUCT</th>
            <th>SKU</th>
            <th>CATEGORY</th>
            <th>PRICE</th>
            <th>STOCK ON HAND</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="7" className="table-empty">
                Loading catalogue…
              </td>
            </tr>
          ) : products.length ? (
            products.map((product, index) => (
              <tr key={product.id}>
                <td>
                  <div className="product-cell">
                    <span className={`product-swatch swatch-${index % 5}`}>
                      <Box size={16} />
                    </span>
                    <span>
                      <strong>{product.name}</strong>
                      <small>{product.description || 'No description'}</small>
                    </span>
                  </div>
                </td>
                <td className="sku">{product.sku}</td>
                <td>{product.category}</td>
                <td className="price">{money(product.price)}</td>
                <td>
                  <span className={`stock-pill ${product.stock <= 5 ? 'low' : ''}`}>
                    {product.stock} units
                  </span>
                </td>
                <td>
                  <span className="status-active">
                    <i /> {product.status || 'Active'}
                  </span>
                </td>
                <td>
                  <div className="action-group">
                    <button
                      className="row-action edit"
                      title="Edit product"
                      aria-label={`Edit ${product.name}`}
                      onClick={() => onEdit(product)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="row-action"
                      title="Delete product"
                      aria-label={`Delete ${product.name}`}
                      onClick={() => onDelete(product)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="table-empty">
                {inventory ? 'No low-stock items. Inventory looks solid!' : 'No products match this search.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function OrdersPage({ orders, loading, money, changeStatus, onViewOrder, onDeleteOrder }) {
  const counts = ['All', 'New', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
  const [selected, setSelected] = useState('All');
  const visible = selected === 'All' ? orders : orders.filter((order) => order.status === selected);

  return (
    <section>
      <div className="page-heading">
        <div>
          <div className="eyebrow">FULFILMENT</div>
          <h1>Orders</h1>
          <p>Manage orders from checkout through delivery.</p>
        </div>
        <div className="order-total">
          <strong>{orders.length}</strong>
          <span>total orders</span>
        </div>
      </div>

      <div className="tab-strip">
        {counts.map((tab) => (
          <button
            key={tab}
            className={selected === tab ? 'selected' : ''}
            onClick={() => setSelected(tab)}
          >
            {tab}
            <span>{tab === 'All' ? orders.length : orders.filter((order) => order.status === tab).length}</span>
          </button>
        ))}
      </div>

      <div className="panel orders-full">
        <OrderTable
          orders={visible}
          loading={loading}
          money={money}
          onStatusChange={changeStatus}
          onViewOrder={onViewOrder}
          onDeleteOrder={onDeleteOrder}
        />
      </div>
    </section>
  );
}

function OrderTable({ orders, loading, money, compact = false, onStatusChange, onViewOrder, onDeleteOrder }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ORDER</th>
            <th>CUSTOMER</th>
            <th>DATE</th>
            <th>ITEMS</th>
            <th>TOTAL</th>
            <th>STATUS</th>
            {!compact && <th>UPDATE STATUS</th>}
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={compact ? 7 : 8} className="table-empty">
                Loading orders…
              </td>
            </tr>
          ) : orders.length ? (
            orders.map((order) => (
              <tr key={order.id} className="clickable-row">
                <td className="order-id" onClick={() => onViewOrder?.(order)}>
                  #{(order.id || '').slice(-6).toUpperCase() || 'ORDER'}
                </td>
                <td onClick={() => onViewOrder?.(order)}>
                  <div className="customer-cell">
                    <span className="avatar order-avatar">
                      {(order.customerName || 'Cust')
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <strong>{order.customerName}</strong>
                  </div>
                </td>
                <td onClick={() => onViewOrder?.(order)}>{shortDate(order.createdAt)}</td>
                <td onClick={() => onViewOrder?.(order)}>
                  {order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0} items
                </td>
                <td className="price" onClick={() => onViewOrder?.(order)}>
                  {money(order.total)}
                </td>
                <td onClick={() => onViewOrder?.(order)}>
                  <span className={`order-status ${(order.status || 'new').toLowerCase()}`}>
                    {order.status || 'New'}
                  </span>
                </td>
                {!compact && (
                  <td>
                    <select
                      className="status-select"
                      value={order.status || 'New'}
                      onChange={(event) => onStatusChange?.(order, event.target.value)}
                    >
                      <option>New</option>
                      <option>Processing</option>
                      <option>Shipped</option>
                      <option>Completed</option>
                      <option>Cancelled</option>
                    </select>
                  </td>
                )}
                <td>
                  <div className="action-group">
                    <button
                      className="row-action view"
                      title="View order details"
                      aria-label="View order details"
                      onClick={() => onViewOrder?.(order)}
                    >
                      <Eye size={15} />
                    </button>
                    {!compact && (
                      <button
                        className="row-action"
                        title="Delete order"
                        aria-label="Delete order"
                        onClick={() => onDeleteOrder?.(order.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={compact ? 7 : 8} className="table-empty">
                No orders yet. Orders placed in the storefront will appear here.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Storefront({
  products,
  categories,
  storeCategory,
  setStoreCategory,
  search,
  setSearch,
  cart,
  cartCount,
  cartTotal,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  onOpenCheckout,
  money,
}) {
  return (
    <section className="storefront">
      <div className="store-banner">
        <div className="store-banner-top">
          <span>FIELDWORK GOODS &middot; EST. 2018</span>
          <span className="cart-counter">
            <ShoppingBag size={15} /> {cartCount} in bag
          </span>
        </div>
        <div className="store-banner-copy">
          <span>OBJECTS FOR EVERYDAY RITUALS</span>
          <h1>Good things,<br />made to stay.</h1>
          <p>Thoughtful essentials for home, travel, and all the days in between.</p>
        </div>
      </div>

      <div className="store-catalog-head">
        <div>
          <div className="eyebrow">THE COLLECTION</div>
          <h2>Shop the edit</h2>
        </div>
        <div className="store-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search storefront"
          />
        </div>
      </div>

      <div className="store-categories">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`store-cat-chip ${storeCategory === cat ? 'selected' : ''}`}
            onClick={() => setStoreCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="store-layout">
        <div className="store-grid">
          {products.map((product, index) => (
            <article className="store-product" key={product.id}>
              <div className={`store-product-image image-${index % 5}`}>
                <span>{product.category}</span>
                <div className="abstract-object">
                  <div />
                </div>
                <span className="product-code">{product.sku}</span>
              </div>
              <div className="store-product-meta">
                <div>
                  <h3>{product.name}</h3>
                  <span>{product.category} &middot; {product.stock} in stock</span>
                </div>
                <strong>{money(product.price)}</strong>
              </div>
              <button
                className="add-to-bag"
                disabled={product.stock < 1}
                onClick={() => addToCart(product)}
              >
                <Plus size={15} /> {product.stock < 1 ? 'Sold out' : 'Add to bag'}
              </button>
            </article>
          ))}
          {!products.length && (
            <div className="cart-empty" style={{ gridColumn: '1 / -1', padding: '40px' }}>
              <p>No products found in this category.</p>
            </div>
          )}
        </div>

        <aside className="cart-panel">
          <div className="cart-heading">
            <h3>Your bag</h3>
            <span>{cartCount} items</span>
          </div>
          {cart.length ? (
            <>
              {cart.map((item) => (
                <div className="cart-line" key={item.product.id}>
                  <div className="cart-line-top">
                    <strong>{item.product.name}</strong>
                    <b>{money(item.product.price * item.quantity)}</b>
                  </div>
                  <div className="cart-line-bottom">
                    <div className="cart-qty-control">
                      <button
                        className="qty-btn"
                        aria-label="Decrease quantity"
                        onClick={() => updateCartQuantity(item.product.id, -1)}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        aria-label="Increase quantity"
                        disabled={item.quantity >= item.product.stock}
                        onClick={() => updateCartQuantity(item.product.id, 1)}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      className="cart-remove-btn"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              ))}
              <div className="cart-subtotal">
                <span>Subtotal</span>
                <strong>{money(cartTotal)}</strong>
              </div>
              <button className="primary-button checkout-button" onClick={onOpenCheckout}>
                Continue to checkout <ArrowUpRight size={16} />
              </button>
              <small className="checkout-note">Demo checkout decrements real store stock</small>
            </>
          ) : (
            <div className="cart-empty">
              <ShoppingBag size={23} />
              <p>
                Your bag is waiting<br />for something good.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function ProductModal({ product, onClose, onSave }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form className="product-modal" onSubmit={onSave}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">CATALOGUE</div>
            <h2>{product ? 'Edit product' : 'New product'}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <label>
          Product name
          <input
            name="name"
            required
            defaultValue={product?.name || ''}
            placeholder="e.g. Field jacket"
          />
        </label>

        <div className="form-row">
          <label>
            SKU
            <input
              name="sku"
              required
              defaultValue={product?.sku || ''}
              placeholder="APP-001"
            />
          </label>
          <label>
            Category
            <input
              name="category"
              required
              defaultValue={product?.category || ''}
              placeholder="Apparel"
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Price (USD)
            <input
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              required
              defaultValue={product?.price ?? ''}
              placeholder="0.00"
            />
          </label>
          <label>
            Stock on hand
            <input
              name="stock"
              type="number"
              min="0"
              required
              defaultValue={product?.stock ?? ''}
              placeholder="0"
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Status
            <select name="status" defaultValue={product?.status || 'Active'}>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </label>
        </div>

        <label>
          Description
          <textarea
            name="description"
            rows="3"
            defaultValue={product?.description || ''}
            placeholder="A short product description"
          />
        </label>

        <div className="modal-actions">
          <button className="quiet-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" type="submit">
            <Check size={16} /> {product ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </div>
  );
}

function CheckoutModal({ cart, cartTotal, money, onClose, onConfirm }) {
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!customerName.trim()) return;
    setSubmitting(true);
    onConfirm(customerName);
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form className="product-modal" onSubmit={handleSubmit}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">STOREFRONT CHECKOUT</div>
            <h2>Complete order</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="checkout-preview">
          <div style={{ fontSize: '9px', fontWeight: '700', color: '#888', marginBottom: '8px' }}>
            ORDER SUMMARY ({cart.reduce((s, i) => s + i.quantity, 0)} ITEMS)
          </div>
          {cart.map((item) => (
            <div className="checkout-preview-item" key={item.product.id}>
              <span>{item.quantity}x {item.product.name}</span>
              <strong>{money(item.product.price * item.quantity)}</strong>
            </div>
          ))}
          <div className="checkout-preview-total">
            <span>Total amount:</span>
            <span>{money(cartTotal)}</span>
          </div>
        </div>

        <label>
          Customer full name
          <input
            required
            autoFocus
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Jordan Smith"
          />
        </label>

        <div className="modal-actions">
          <button className="quiet-button" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="primary-button" type="submit" disabled={submitting || !customerName.trim()}>
            <Check size={16} /> {submitting ? 'Placing order…' : 'Place order'}
          </button>
        </div>
      </form>
    </div>
  );
}

function OrderDetailsModal({ order, money, onClose, onStatusChange, onDeleteOrder }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="product-modal" style={{ width: 'min(580px, 100%)' }}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">ORDER DETAILS</div>
            <h2>#{(order.id || '').slice(-6).toUpperCase()}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="order-details-grid">
          <div>
            <strong>CUSTOMER</strong>
            <span>{order.customerName}</span>
          </div>
          <div>
            <strong>DATE PLACED</strong>
            <span>{shortDate(order.createdAt)}</span>
          </div>
          <div>
            <strong>STATUS</strong>
            <span className={`order-status ${(order.status || 'new').toLowerCase()}`}>
              {order.status || 'New'}
            </span>
          </div>
          <div>
            <strong>TOTAL AMOUNT</strong>
            <span style={{ fontSize: '12px' }}>{money(order.total)}</span>
          </div>
        </div>

        <div className="items-list">
          <table>
            <thead>
              <tr>
                <th>ITEM</th>
                <th>QTY</th>
                <th>PRICE</th>
                <th>SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>{item.name || item.productId}</strong>
                  </td>
                  <td>{item.quantity}</td>
                  <td>{money(item.unitPrice)}</td>
                  <td>{money((item.unitPrice || 0) * (item.quantity || 1))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: '#666', fontWeight: '600' }}>Status:</span>
            <select
              className="status-select"
              value={order.status || 'New'}
              onChange={(e) => onStatusChange(order, e.target.value)}
            >
              <option>New</option>
              <option>Processing</option>
              <option>Shipped</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>

          <div className="modal-actions" style={{ margin: 0 }}>
            <button
              className="quiet-button"
              style={{ color: '#b34938' }}
              onClick={() => onDeleteOrder(order.id)}
            >
              <Trash2 size={14} /> Remove order
            </button>
            <button className="primary-button" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
