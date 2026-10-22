import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, Boxes, LayoutDashboard,
  LogOut, Package, Search, Settings2, ShoppingBag, Users, Plus, Pencil, Trash2,
  X, Save, RefreshCw, Store, CheckCircle2, ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getAdminOverview, getAdminProducts, createAdminProduct, updateAdminProduct,
  deleteAdminProduct, getAdminOrders, updateAdminOrderStatus, getAdminCustomers,
  updateAdminCustomerStatus, getStoreSettings, saveStoreSettings,
} from "../../api/admin.js";
import "./AdminDashboardPage.css";

const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "customers", label: "Customers", icon: Users },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "settings", label: "Store settings", icon: Settings2 },
];
const statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const blankProduct = { name: "", price: "", image: "", category: "Clothing", merchandisingCollection: "new-in", description: "", material: "", stock: "0", featured: false, colors: "", sizes: "", details: "" };
const blankSettings = { storeName: "SAELYN", supportEmail: "", currency: "USD", lowStockThreshold: 5, announcement: "", maintenanceMode: false };
const money = (value, currency = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value) || 0);
const date = (value) => value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)) : "—";
const splitList = (value) => String(value || "").split(",").map((part) => part.trim()).filter(Boolean);
const listText = (value) => Array.isArray(value) ? value.join(", ") : "";

function StatusPill({ status }) {
  const value = String(status || "pending").toLowerCase();
  return <span className={`admin-status status-${value}`}>{value}</span>;
}

export default function AdminDashboardPage() {
  const { user, authLoading, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState(blankSettings);
  const [productForm, setProductForm] = useState(blankProduct);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [stockDrafts, setStockDrafts] = useState({});

  const loadOverview = useCallback(async () => setOverview(await getAdminOverview()), []);
  const loadSection = useCallback(async (target = section) => {
    setError(""); setNotice("");
    try {
      if (target === "overview") await loadOverview();
      if (target === "products") setProducts(await getAdminProducts({ search }));
      if (target === "inventory") setProducts(await getAdminProducts({ search, stock: stockFilter }));
      if (target === "orders") setOrders(await getAdminOrders({ search, status: statusFilter }));
      if (target === "customers") setCustomers(await getAdminCustomers({ search }));
      if (target === "settings") setSettings({ ...blankSettings, ...(await getStoreSettings()) });
    } catch (err) { setError(err.message || "Data load nahi ho saka."); }
  }, [section, search, statusFilter, stockFilter, loadOverview]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (authLoading) return;
      setLoading(true);
      const current = await refreshUser();
      if (!cancelled && current?.role === "admin") {
        try {
          const [overviewData, storeSettings] = await Promise.all([getAdminOverview(), getStoreSettings()]);
          setOverview(overviewData);
          setSettings({ ...blankSettings, ...storeSettings });
        } catch (err) { setError(err.message || "Dashboard load nahi hua."); }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [authLoading, refreshUser]);

  useEffect(() => {
    if (!loading && user?.role === "admin") loadSection(section);
  }, [section, search, statusFilter, stockFilter, loading, user?.role, loadSection]);

  async function handleLogout() { await logout(); navigate("/login"); }
  function openCreateProduct() { setEditingProduct(null); setProductForm(blankProduct); setShowProductForm(true); setError(""); }
  function openEditProduct(product) {
    setEditingProduct(product._id);
    setProductForm({ ...product, price: String(product.price), stock: String(product.stock), colors: listText(product.colors), sizes: listText(product.sizes), details: listText(product.details) });
    setShowProductForm(true); setError("");
  }
  async function submitProduct(event) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    const payload = {
      name: productForm.name.trim(), price: Number(productForm.price), image: productForm.image.trim(),
      category: productForm.category, merchandisingCollection: productForm.merchandisingCollection,
      description: productForm.description.trim(), material: productForm.material.trim(),
      stock: Number(productForm.stock), featured: Boolean(productForm.featured),
      colors: splitList(productForm.colors), sizes: splitList(productForm.sizes), details: splitList(productForm.details),
    };
    try {
      if (editingProduct) await updateAdminProduct(editingProduct, payload); else await createAdminProduct(payload);
      setShowProductForm(false); setNotice(editingProduct ? "Product updated successfully." : "Product created successfully.");
      setProducts(await getAdminProducts({ search })); await loadOverview();
    } catch (err) { setError(err.message || "Product save nahi ho saka."); }
    finally { setSaving(false); }
  }
  async function removeProduct(product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setSaving(true); setError(""); setNotice("");
    try { await deleteAdminProduct(product._id); setProducts(await getAdminProducts({ search })); await loadOverview(); setNotice("Product deleted."); }
    catch (err) { setError(err.message || "Product delete nahi hua."); }
    finally { setSaving(false); }
  }
  async function changeOrderStatus(order, orderStatus) {
    setError(""); setNotice("");
    try { await updateAdminOrderStatus(order._id, orderStatus); setOrders(await getAdminOrders({ search, status: statusFilter })); await loadOverview(); setNotice(`Order #${order.orderNumber} updated.`); }
    catch (err) { setError(err.message || "Order status update nahi hua."); }
  }
  async function saveStock(product) {
    const stock = Number(stockDrafts[product._id] ?? product.stock);
    if (!Number.isInteger(stock) || stock < 0) { setError("Stock whole number hona chahiye aur 0 se kam nahi ho sakta."); return; }
    setSaving(true); setError(""); setNotice("");
    try { await updateAdminProduct(product._id, { stock }); setProducts(await getAdminProducts({ search, stock: stockFilter })); await loadOverview(); setNotice(`${product.name} stock updated.`); }
    catch (err) { setError(err.message || "Stock update nahi hua."); }
    finally { setSaving(false); }
  }
  async function toggleCustomerStatus(customer) {
    const isActive = !customer.isActive;
    setError(""); setNotice("");
    try {
      await updateAdminCustomerStatus(customer._id, isActive);
      setCustomers(await getAdminCustomers({ search }));
      setNotice(`${customer.name}'s account is now ${isActive ? "active" : "inactive"}.`);
    } catch (err) { setError(err.message || "Customer status update nahi hua."); }
  }
  async function submitSettings(event) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try { const result = await saveStoreSettings({ ...settings, lowStockThreshold: Number(settings.lowStockThreshold) }); setSettings(result.settings); setNotice("Store settings saved successfully."); }
    catch (err) { setError(err.message || "Settings save nahi hui."); }
    finally { setSaving(false); }
  }

  if (authLoading || loading) return <main className="admin-state"><span className="admin-spinner" /><p>SAELYN Admin load ho raha hai…</p></main>;
  if (!user || user.role !== "admin") return <main className="admin-state"><div className="admin-state-icon"><Activity size={24} /></div><p className="admin-kicker">RESTRICTED AREA</p><h1>Admin access required</h1><p>Is dashboard ko sirf authorized administrator use kar sakta hai.</p><Link className="admin-primary-button" to="/login">Log in to SAELYN</Link><Link className="admin-back-link" to="/">Back to storefront</Link></main>;

  const title = navigation.find((item) => item.id === section)?.label || "Overview";
  const metrics = [
    { label: "Total products", value: overview?.productCount ?? 0, note: "Products in your catalog", icon: Package },
    { label: "Total orders", value: overview?.orderCount ?? 0, note: "All orders received", icon: ShoppingBag },
    { label: "Customers", value: overview?.customerCount ?? 0, note: "Registered customer accounts", icon: Users },
    { label: "Orders to review", value: overview?.pendingOrders ?? 0, note: "Pending, confirmed or processing", icon: Activity },
  ];

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand"><span>SAELYN</span><small>STORE MANAGEMENT</small></Link>
        <div className="admin-side-label">WORKSPACE</div>
        <nav className="admin-navigation" aria-label="Admin navigation">
          {navigation.map(({ id, label, icon: Icon }) => <button key={id} className={`admin-nav-item ${section === id ? "is-active" : ""}`} onClick={() => { setSection(id); setSearch(""); setStatusFilter(""); setStockFilter(""); }}><Icon size={17} strokeWidth={1.7} /><span>{label}</span>{section === id && <ChevronRight className="admin-nav-chevron" size={14} />}</button>)}
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-user-chip"><div className="admin-avatar">{(user.name || "A").slice(0, 1).toUpperCase()}</div><div><strong>{user.name}</strong><small>Administrator</small></div></div>
          <button className="admin-logout" onClick={handleLogout}><LogOut size={16} /> Sign out</button>
          <Link to="/" className="admin-store-link">← View storefront</Link>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div><p className="admin-kicker">STORE MANAGEMENT / {title.toUpperCase()}</p><h1>{section === "overview" ? `Good to see you, ${user.name?.split(" ")[0] || "Admin"}.` : title}</h1><p className="admin-subtitle">{section === "overview" ? "Here’s what’s happening with your store today." : section === "products" ? "Create, edit and manage your product catalogue." : section === "orders" ? "Review orders and keep fulfilment status up to date." : section === "customers" ? "Understand your customer base and order activity." : section === "inventory" ? "Track stock levels and update quantities." : "Manage the key details shown for your store."}</p></div>
          <div className="admin-topbar-actions"><button className="admin-icon-button" onClick={() => loadSection(section)} title="Refresh section"><RefreshCw size={16} /></button><div className="admin-topbar-mark">S<span>.</span></div></div>
        </header>
        {error && <div className="admin-alert" role="alert"><AlertTriangle size={18} /><span>{error}</span><button onClick={() => loadSection(section)}>Retry</button></div>}
        {notice && <div className="admin-notice" role="status"><CheckCircle2 size={17} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={15} /></button></div>}

        {section === "overview" && <>
          <div className="admin-section-heading"><div><p className="admin-kicker">YOUR STORE AT A GLANCE</p><h2>Overview</h2></div><span className="admin-live-label"><span /> Live store data</span></div>
          <div className="admin-metric-grid">{metrics.map(({ label, value, note, icon: Icon }, index) => <article className="admin-metric-card" key={label}><div className="admin-metric-top"><span>{label}</span><div className="admin-metric-icon"><Icon size={18} /></div></div><strong className="admin-metric-value">{value.toLocaleString()}</strong><span className="admin-metric-note">{note}</span><div className={`admin-metric-foot ${index === 3 && value > 0 ? "is-attention" : ""}`}><ArrowDownRight size={14} />{index === 3 && value > 0 ? "Needs attention" : "Current total"}</div></article>)}</div>
          <div className="admin-content-grid">
            <section className="admin-panel admin-orders-panel"><div className="admin-panel-heading"><div><p className="admin-kicker">LATEST ACTIVITY</p><h2>Recent orders</h2></div><button className="admin-text-action" onClick={() => setSection("orders")}>View all <ArrowRight size={14} /></button></div>
              {overview?.recentOrders?.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>{overview.recentOrders.map((order) => <tr key={order._id}><td className="admin-order-number">#{order.orderNumber}</td><td><strong>{order.customer?.firstName} {order.customer?.lastName}</strong><small>{order.customer?.email}</small></td><td>{date(order.createdAt)}</td><td>{money(order.total)}</td><td><StatusPill status={order.orderStatus} /></td></tr>)}</tbody></table></div> : <div className="admin-empty"><ShoppingBag size={25} /><strong>No orders yet</strong><span>New orders will appear here when customers check out.</span></div>}
            </section>
            <aside className="admin-panel admin-inventory-panel"><div className="admin-panel-heading"><div><p className="admin-kicker">STOCK HEALTH</p><h2>Inventory watch</h2></div><Boxes size={20} /></div><div className={`admin-stock-number ${(overview?.lowStockCount || 0) > 0 ? "is-low" : ""}`}>{overview?.lowStockCount ?? 0}</div><p className="admin-stock-description">Products with 5 or fewer units in stock, including sold-out items.</p><div className="admin-stock-rule" /><p className="admin-stock-foot"><AlertTriangle size={15} /> Review low-stock items regularly.</p><button className="admin-next-step admin-next-step-button" onClick={() => setSection("inventory")}><span>MANAGE STOCK</span><strong>Inventory management</strong><p>Update quantities and identify items that need restocking.</p><span className="admin-next-step-link">Open inventory <ArrowRight size={14} /></span></button></aside>
          </div>
        </>}

        {section === "products" && <><div className="admin-section-heading"><div><p className="admin-kicker">CATALOGUE</p><h2>Products <span className="admin-heading-count">{products.length}</span></h2></div><button className="admin-primary-button" onClick={openCreateProduct}><Plus size={15} /> Add product</button></div><div className="admin-toolbar"><label className="admin-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product name or category…" /></label><button className="admin-secondary-button" onClick={openCreateProduct}><Plus size={15} /> New product</button></div>
          <div className="admin-panel admin-full-panel">{products.length ? <div className="admin-table-wrap"><table className="admin-table admin-wide-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Featured</th><th>Actions</th></tr></thead><tbody>{products.map((p) => <tr key={p._id}><td><div className="admin-product-cell">{p.image && <img src={p.image} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />}<div><strong>{p.name}</strong><small>{p.material || "Material not set"}</small></div></div></td><td>{p.category}</td><td>{money(p.price, settings.currency || "USD")}</td><td><span className={`admin-stock-badge ${p.stock <= 5 ? "is-low" : ""}`}>{p.stock}</span></td><td>{p.featured ? "Yes" : "No"}</td><td><div className="admin-row-actions"><button className="admin-small-action" onClick={() => openEditProduct(p)} aria-label={`Edit ${p.name}`}><Pencil size={14} /> Edit</button><button className="admin-small-action is-danger" onClick={() => removeProduct(p)} disabled={saving} aria-label={`Delete ${p.name}`}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div> : <div className="admin-empty"><Package size={25} /><strong>No products found</strong><span>Try a different search or create your first product.</span><button className="admin-primary-button" onClick={openCreateProduct}><Plus size={15} /> Add product</button></div>}</div>
          {showProductForm && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowProductForm(false); }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title"><div className="admin-modal-heading"><div><p className="admin-kicker">PRODUCT CATALOGUE</p><h2 id="product-form-title">{editingProduct ? "Edit product" : "Add a product"}</h2></div><button className="admin-icon-button" onClick={() => setShowProductForm(false)} aria-label="Close"><X size={18} /></button></div><form className="admin-form-grid" onSubmit={submitProduct}>
            <label className="admin-field admin-field-full">Product name<input required maxLength="120" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></label>
            <label className="admin-field">Price<input required type="number" min="0" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} /></label>
            <label className="admin-field">Stock quantity<input required type="number" min="0" step="1" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} /></label>
            <label className="admin-field">Category<select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}><option>Clothing</option><option>Bags</option><option>Essentials</option></select></label>
            <label className="admin-field">Collection<select value={productForm.merchandisingCollection || "new-in"} onChange={(e) => setProductForm({ ...productForm, merchandisingCollection: e.target.value })}><option value="new-in">New In</option><option value="essentials">Essentials</option></select></label>
            <label className="admin-field admin-field-full">Image URL<input required type="url" value={productForm.image} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} placeholder="https://…" /></label>
            <label className="admin-field">Material<input required value={productForm.material} onChange={(e) => setProductForm({ ...productForm, material: e.target.value })} /></label>
            <label className="admin-field">Colors (comma separated)<input value={productForm.colors} onChange={(e) => setProductForm({ ...productForm, colors: e.target.value })} placeholder="Black, Ivory" /></label>
            <label className="admin-field admin-field-full">Sizes (comma separated)<input value={productForm.sizes} onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })} placeholder="S, M, L" /></label>
            <label className="admin-field admin-field-full">Description<textarea required rows="3" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} /></label>
            <label className="admin-field admin-field-full">Details (comma separated)<input value={productForm.details} onChange={(e) => setProductForm({ ...productForm, details: e.target.value })} placeholder="Relaxed fit, Machine washable" /></label>
            <label className="admin-checkbox-field"><input type="checkbox" checked={Boolean(productForm.featured)} onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })} /> Feature this product</label>
            <div className="admin-form-actions"><button type="button" className="admin-secondary-button" onClick={() => setShowProductForm(false)}>Cancel</button><button className="admin-primary-button" disabled={saving}><Save size={15} /> {saving ? "Saving…" : editingProduct ? "Save changes" : "Create product"}</button></div>
          </form></section></div>}
        </>}

        {section === "orders" && <><div className="admin-section-heading"><div><p className="admin-kicker">FULFILMENT</p><h2>Orders <span className="admin-heading-count">{orders.length}</span></h2></div><span className="admin-live-label"><span /> Synced with database</span></div><div className="admin-toolbar"><label className="admin-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, customer or email…" /></label><select className="admin-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></div><div className="admin-panel admin-full-panel">{orders.length ? <div className="admin-table-wrap"><table className="admin-table admin-wide-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>{orders.map((o) => <tr key={o._id}><td className="admin-order-number">#{o.orderNumber}</td><td><strong>{o.customer?.firstName} {o.customer?.lastName}</strong><small>{o.customer?.email}</small></td><td>{o.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</td><td>{date(o.createdAt)}</td><td>{money(o.total, settings.currency || "USD")}</td><td><StatusPill status={o.paymentStatus} /></td><td><select className="admin-status-select" value={o.orderStatus} onChange={(e) => changeOrderStatus(o, e.target.value)} disabled={saving || o.orderStatus === "cancelled"} aria-label={`Status for order ${o.orderNumber}`}>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div> : <div className="admin-empty"><ShoppingBag size={25} /><strong>No orders found</strong><span>Orders will appear here after checkout.</span></div>}</div><p className="admin-helper-note">Order status cancellation returns the ordered quantities to stock. Cancelled orders cannot be reopened here.</p></>}

        {section === "customers" && <><div className="admin-section-heading"><div><p className="admin-kicker">CUSTOMER RELATIONSHIPS</p><h2>Customers <span className="admin-heading-count">{customers.length}</span></h2></div></div><div className="admin-toolbar"><label className="admin-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or phone…" /></label></div><div className="admin-panel admin-full-panel">{customers.length ? <div className="admin-table-wrap"><table className="admin-table admin-wide-table"><thead><tr><th>Customer</th><th>Contact</th><th>Joined</th><th>Orders</th><th>Total spent</th><th>Account</th><th>Action</th></tr></thead><tbody>{customers.map((c) => <tr key={c._id}><td><div className="admin-customer-cell"><span className="admin-customer-avatar">{(c.name || "?").slice(0, 1).toUpperCase()}</span><strong>{c.name}</strong></div></td><td><strong>{c.email}</strong><small>{c.phone || "No phone provided"}</small></td><td>{date(c.createdAt)}</td><td>{c.orderCount}</td><td>{money(c.totalSpent, settings.currency || "USD")}</td><td><StatusPill status={c.isActive ? "active" : "inactive"} /></td><td><button className="admin-small-action" onClick={() => toggleCustomerStatus(c)}>{c.isActive ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table></div> : <div className="admin-empty"><Users size={25} /><strong>No customers found</strong><span>Registered customer accounts will appear here.</span></div>}</div><p className="admin-helper-note">Guest checkout details remain available on each order; this list shows registered customer accounts.</p></>}

        {section === "inventory" && <><div className="admin-section-heading"><div><p className="admin-kicker">STOCK CONTROL</p><h2>Inventory <span className="admin-heading-count">{products.length}</span></h2></div><span className="admin-live-label"><span /> Stock updates are saved</span></div><div className="admin-toolbar"><label className="admin-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product…" /></label><select className="admin-filter-select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}><option value="">All stock levels</option><option value="low">Low stock (1–5)</option><option value="out">Out of stock</option><option value="healthy">Healthy stock</option></select></div><div className="admin-panel admin-full-panel">{products.length ? <div className="admin-table-wrap"><table className="admin-table admin-wide-table"><thead><tr><th>Product</th><th>SKU / ID</th><th>Stock status</th><th>Available units</th><th>Update</th></tr></thead><tbody>{products.map((p) => <tr key={p._id}><td><div className="admin-product-cell">{p.image && <img src={p.image} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />}<div><strong>{p.name}</strong><small>{p.category}</small></div></div></td><td className="admin-id-cell">{String(p._id).slice(-8).toUpperCase()}</td><td><span className={`admin-stock-badge ${p.stock === 0 ? "is-out" : p.stock <= (settings.lowStockThreshold ?? 5) ? "is-low" : "is-healthy"}`}>{p.stock === 0 ? "Out of stock" : p.stock <= (settings.lowStockThreshold ?? 5) ? "Low stock" : "In stock"}</span></td><td><input className="admin-stock-input" type="number" min="0" step="1" value={stockDrafts[p._id] ?? p.stock} onChange={(e) => setStockDrafts({ ...stockDrafts, [p._id]: e.target.value })} aria-label={`Stock quantity for ${p.name}`} /></td><td><button className="admin-small-action" onClick={() => saveStock(p)} disabled={saving || Number(stockDrafts[p._id] ?? p.stock) === p.stock}><Save size={14} /> Save stock</button></td></tr>)}</tbody></table></div> : <div className="admin-empty"><Boxes size={25} /><strong>No matching products</strong><span>Change the stock filter or search term.</span></div>}</div></>}

        {section === "settings" && <><div className="admin-section-heading"><div><p className="admin-kicker">STORE PROFILE</p><h2>Store settings</h2></div><span className="admin-live-label"><Store size={14} /> Saved to database</span></div><form className="admin-settings-layout" onSubmit={submitSettings}><section className="admin-panel"><div className="admin-panel-heading"><div><p className="admin-kicker">GENERAL</p><h2>Store information</h2></div><Store size={20} /></div><div className="admin-settings-fields"><label className="admin-field">Store name<input required maxLength="100" value={settings.storeName || ""} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} /></label><label className="admin-field">Support email<input type="email" maxLength="254" value={settings.supportEmail || ""} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} placeholder="support@example.com" /></label><label className="admin-field">Dashboard currency<select value={settings.currency || "USD"} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}><option value="USD">USD — US Dollar</option><option value="PKR">PKR — Pakistani Rupee</option></select><small>This changes currency formatting in the admin dashboard; it does not change checkout payment processing.</small></label><label className="admin-field">Low-stock alert threshold<input type="number" min="0" max="10000" step="1" required value={settings.lowStockThreshold ?? 5} onChange={(e) => setSettings({ ...settings, lowStockThreshold: e.target.value })} /><small>Inventory items at or below this quantity are flagged as low stock.</small></label><label className="admin-field admin-field-full">Store announcement<input maxLength="240" value={settings.announcement || ""} onChange={(e) => setSettings({ ...settings, announcement: e.target.value })} placeholder="e.g. Complimentary shipping on orders over $100" /><small>Saved as store content; it is not automatically published to the storefront yet.</small></label></div></section><section className="admin-panel admin-settings-side"><div className="admin-panel-heading"><div><p className="admin-kicker">OPERATIONS</p><h2>Store availability</h2></div><Settings2 size={20} /></div><label className="admin-toggle-row"><span><strong>Maintenance mode</strong><small>Record the store maintenance preference for future storefront enforcement.</small></span><input type="checkbox" checked={Boolean(settings.maintenanceMode)} onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })} /></label><div className="admin-settings-info"><AlertTriangle size={16} /><p>Maintenance mode is stored as a setting only. It does not block customer access until storefront enforcement is added.</p></div><button className="admin-primary-button" disabled={saving}><Save size={15} /> {saving ? "Saving settings…" : "Save settings"}</button></section></form></>}
        <footer className="admin-footer"><span>SAELYN ADMIN</span><span>Phase 2 · Store operations</span></footer>
      </section>
    </main>
  );
}
