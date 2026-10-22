import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyOrders } from "../../api/orders";
import "./AccountPage.css";

export default function AccountPage() {
  const { user, authLoading, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setOrdersLoading(true);
    getMyOrders()
      .then((result) => { if (!cancelled) setOrders(result.orders || []); })
      .catch((error) => { if (!cancelled) setOrdersError(error.message || "Order history load nahi ho saki."); })
      .finally(() => { if (!cancelled) setOrdersLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  if (authLoading) return <main className="account-page"><p>Loading account…</p></main>;
  if (!user) return <Navigate to="/login" replace state={{ from: "/account" }} />;

  const handleLogout = async () => { await logout(); };

  return (
    <main className="account-page">
      <section className="account-panel">
        <p className="eyebrow">MY SAELYN</p>
        <h1>My Account</h1>
        <p className="account-welcome">Welcome back, {user.name}.</p>
        <dl className="account-details">
          <div><dt>Full name</dt><dd>{user.name}</dd></div>
          <div><dt>Email address</dt><dd>{user.email}</dd></div>
          <div><dt>Phone</dt><dd>{user.phone || "Not added"}</dd></div>
        </dl>
        <div className="account-actions">
          <Link to="/wishlist">View wishlist</Link>
          <Link to="/cart">View shopping bag</Link>
          <button type="button" onClick={handleLogout}>Log out</button>
        </div>

        <section className="account-orders">
          <p className="eyebrow">YOUR PURCHASES</p>
          <h2>Order History</h2>
          {ordersLoading && <p>Loading your orders…</p>}
          {ordersError && <p className="account-orders__error" role="alert">{ordersError}</p>}
          {!ordersLoading && !ordersError && orders.length === 0 && (
            <p>You haven't placed an order yet. <Link to="/shop">Explore the collection.</Link></p>
          )}
          {orders.map((order) => (
            <article className="account-order" key={order._id}>
              <div>
                <strong>#{order.orderNumber}</strong>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span>{order.orderStatus}</span>
                <strong>${Number(order.total).toFixed(2)}</strong>
              </div>
              <p>{order.items.length} {order.items.length === 1 ? "item" : "items"} · {order.paymentMethod === "cod" ? "Cash on Delivery" : "Card"}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
