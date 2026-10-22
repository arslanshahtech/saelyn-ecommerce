import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { createOrder } from "../../api/orders";
import CheckoutForm from "../../components/CheckoutForm/CheckoutForm";
import CheckoutSummary from "../../components/CheckoutSummary/CheckoutSummary";
import ShippingMethod from "../../components/ShippingMethod/ShippingMethod";
import PaymentMethod from "../../components/PaymentMethod/PaymentMethod";
import "./CheckoutPage.css";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const { cartItems, clearCart, cartSyncing } = useCart();
  const [customer, setCustomer] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", apartment: "", city: "", postalCode: "", country: "Pakistan",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const nameParts = (user.name || "").trim().split(/\s+/);
    setCustomer((current) => ({
      ...current,
      firstName: current.firstName || nameParts.shift() || "",
      lastName: current.lastName || nameParts.join(" "),
      email: user.email || current.email,
      phone: current.phone || user.phone || "",
    }));
  }, [user]);

  const subtotal = useMemo(() => cartItems.reduce((total, item) => {
    const price = Number(item.numericPrice ?? String(item.price).replace(/[^0-9.]/g, ""));
    return total + (Number.isFinite(price) ? price : 0) * item.quantity;
  }, 0), [cartItems]);

  const shippingCost = shippingMethod === "express" ? 15 : 0;
  const total = subtotal + shippingCost;

  const updateCustomer = (field, value) => {
    setCustomer((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setServerError("");
  };

  const validateCheckout = () => {
    const nextErrors = {};
    ["firstName", "lastName", "email", "phone", "address", "city", "postalCode"].forEach((field) => {
      if (!String(customer[field] || "").trim()) nextErrors[field] = "This field is required.";
    });
    if (customer.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (customer.phone.trim() && !/^[+\d\s()-]{7,30}$/.test(customer.phone.trim())) {
      nextErrors.phone = "Please enter a valid phone number.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setServerError("");
    if (!validateCheckout()) return;
    if (!user) {
      setServerError("Please log in before placing your order.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createOrder({
        customer: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email || user.email,
          phone: customer.phone,
        },
        shippingAddress: {
          address: customer.address,
          apartment: customer.apartment,
          city: customer.city,
          postalCode: customer.postalCode,
          country: customer.country,
        },
        shippingMethod,
        paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.id || item._id,
          selectedSize: item.selectedSize || "",
          selectedColor: item.selectedColor || "",
          quantity: item.quantity,
        })),
      });

      const saved = result.order;
      const order = {
        ...saved,
        customer: {
          ...saved.customer,
          address: saved.shippingAddress.address,
          apartment: saved.shippingAddress.apartment || "",
          city: saved.shippingAddress.city,
          postalCode: saved.shippingAddress.postalCode,
          country: saved.shippingAddress.country,
        },
        items: saved.items.map((item) => ({
          ...item,
          price: `$${Number(item.price).toFixed(2)}`,
        })),
      };

      sessionStorage.setItem("saelyn-last-order", JSON.stringify(order));
      clearCart();
      navigate("/order-confirmation", { state: { order }, replace: true });
    } catch (error) {
      setServerError(error.message || "Order place nahi ho saka. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || cartSyncing) {
    return <main className="checkout-page"><section className="checkout-empty"><p className="eyebrow">CHECKOUT</p><h1>Preparing Your Checkout</h1><p>Please wait while we load your account and bag.</p></section></main>;
  }

  if (cartItems.length === 0) {
    return (
      <main className="checkout-page">
        <section className="checkout-empty">
          <p className="eyebrow">CHECKOUT</p>
          <h1>Your Bag is Empty</h1>
          <p>Add a few pieces before continuing to checkout.</p>
          <Link to="/shop">Continue Shopping</Link>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="checkout-page">
        <section className="checkout-empty">
          <p className="eyebrow">SAELYN CHECKOUT</p>
          <h1>Log In to Continue</h1>
          <p>Your bag will be kept while you log in or create an account.</p>
          <Link to="/login" state={{ from: "/checkout" }}>Log In</Link>
          <p><Link to="/register" state={{ from: "/checkout" }}>Create an account</Link></p>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <p className="eyebrow">SAELYN CHECKOUT</p>
        <h1>Complete Your Order</h1>
        <p>Review your delivery details before placing your order.</p>
      </header>

      <form className="checkout-layout" onSubmit={handlePlaceOrder} noValidate>
        <div className="checkout-main">
          <CheckoutForm customer={customer} errors={errors} onChange={updateCustomer} />
          <ShippingMethod selectedMethod={shippingMethod} onChange={setShippingMethod} />
          <PaymentMethod selectedMethod={paymentMethod} onChange={setPaymentMethod} />
          {serverError && <p className="checkout-server-error" role="alert">{serverError}</p>}
          <button type="submit" className="checkout-mobile-submit" disabled={submitting}>
            {submitting ? "Placing Order…" : "Place Order"}
          </button>
        </div>
        <CheckoutSummary cartItems={cartItems} subtotal={subtotal} shippingCost={shippingCost} total={total} />
      </form>
    </main>
  );
}
