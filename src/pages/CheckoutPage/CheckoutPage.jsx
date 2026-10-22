import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../../context/CartContext";

import CheckoutForm from "../../components/CheckoutForm/CheckoutForm";
import CheckoutSummary from "../../components/CheckoutSummary/CheckoutSummary";
import ShippingMethod from "../../components/ShippingMethod/ShippingMethod";
import PaymentMethod from "../../components/PaymentMethod/PaymentMethod";

import "./CheckoutPage.css";

export default function CheckoutPage() {
  const navigate = useNavigate();

  // =========================
  // CART
  // =========================

  const {
    cartItems,
    clearCart,
  } = useCart();


  // =========================
  // CUSTOMER
  // =========================

  const [customer, setCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    postalCode: "",
    country: "Pakistan",
  });


  // =========================
  // VALIDATION ERRORS
  // =========================

  const [errors, setErrors] = useState({});


  // =========================
  // SHIPPING
  // =========================

  const [shippingMethod, setShippingMethod] =
    useState("standard");


  // =========================
  // PAYMENT
  // =========================

  const [paymentMethod, setPaymentMethod] =
    useState("cod");


  // =========================
  // SUBTOTAL
  // =========================

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = Number(
        item.price.replace("$", "")
      );

      return total + price * item.quantity;
    }, 0);
  }, [cartItems]);


  // =========================
  // SHIPPING COST
  // =========================

  const shippingCost =
    shippingMethod === "express"
      ? 15
      : 0;


  // =========================
  // TOTAL
  // =========================

  const total =
    subtotal + shippingCost;


  // =========================
  // CUSTOMER UPDATE
  // =========================

  const updateCustomer = (field, value) => {
    setCustomer((currentCustomer) => ({
      ...currentCustomer,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: "",
    }));
  };


  // =========================
  // VALIDATE CHECKOUT
  // =========================

  const validateCheckout = () => {
    const newErrors = {};

    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "postalCode",
    ];

    requiredFields.forEach((field) => {
      if (!customer[field].trim()) {
        newErrors[field] = "This field is required.";
      }
    });


    // Email validation
    if (
      customer.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        customer.email.trim()
      )
    ) {
      newErrors.email =
        "Please enter a valid email address.";
    }


    // Phone validation
    if (
      customer.phone.trim() &&
      !/^[+\d\s()-]{7,20}$/.test(
        customer.phone.trim()
      )
    ) {
      newErrors.phone =
        "Please enter a valid phone number.";
    }


    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };


  // =========================
  // PLACE ORDER
  // =========================

  const handlePlaceOrder = (event) => {
    event.preventDefault();


    // Validation
    const isValid = validateCheckout();

    if (!isValid) {
      return;
    }


    // =========================
    // CREATE FRONTEND ORDER
    // =========================

    const order = {
      orderNumber: `SAE-${Date.now()
        .toString()
        .slice(-6)}`,

      customer: {
        ...customer,
      },

      shippingMethod,

      paymentMethod,

      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        quantity: item.quantity,
      })),

      subtotal,

      shippingCost,

      total,

      createdAt: new Date().toISOString(),
    };


    // Temporary frontend persistence
    sessionStorage.setItem(
      "saelyn-last-order",
      JSON.stringify(order)
    );


    // Cart clear
    clearCart();


    // Confirmation page
    navigate("/order-confirmation", {
      state: {
        order,
      },
    });
  };


  // =========================
  // EMPTY CART
  // =========================

  if (cartItems.length === 0) {
    return (
      <main className="checkout-page">

        <section className="checkout-empty">

          <p className="eyebrow">
            CHECKOUT
          </p>

          <h1>
            Your Bag is Empty
          </h1>

          <p>
            Add a few pieces before
            continuing to checkout.
          </p>

          <Link to="/shop">
            Continue Shopping
          </Link>

        </section>

      </main>
    );
  }


  return (
    <main className="checkout-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="checkout-header">

        <p className="eyebrow">
          SAELYN CHECKOUT
        </p>

        <h1>
          Complete Your Order
        </h1>

        <p>
          Secure your selection and
          prepare it for delivery.
        </p>

      </header>


      {/* =========================
          CHECKOUT FORM
      ========================= */}

      <form
        className="checkout-layout"
        onSubmit={handlePlaceOrder}
        noValidate
      >

        <div className="checkout-main">

          <CheckoutForm
            customer={customer}
            errors={errors}
            onChange={updateCustomer}
          />


          <ShippingMethod
            selectedMethod={shippingMethod}
            onChange={setShippingMethod}
          />


          <PaymentMethod
            selectedMethod={paymentMethod}
            onChange={setPaymentMethod}
          />


          <button
            type="submit"
            className="checkout-mobile-submit"
          >
            Place Order
          </button>

        </div>


        <CheckoutSummary
          cartItems={cartItems}
          subtotal={subtotal}
          shippingCost={shippingCost}
          total={total}
        />

      </form>

    </main>
  );
}