import { Link, useLocation } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";

import "./OrderConfirmationPage.css";

export default function OrderConfirmationPage() {
  const location = useLocation();


  // Current navigation state
  let order = location.state?.order;


  // Refresh ke baad sessionStorage se order
  if (!order) {
    try {
      const savedOrder =
        sessionStorage.getItem(
          "saelyn-last-order"
        );

      order = savedOrder
        ? JSON.parse(savedOrder)
        : null;

    } catch {
      order = null;
    }
  }


  if (!order) {
    return (
      <main className="order-confirmation-page">

        <section className="order-confirmation__missing">

          <p className="eyebrow">
            SAELYN
          </p>

          <h1>
            Order Not Found
          </h1>

          <p>
            We couldn't find a recent order
            to display.
          </p>

          <Link to="/shop">
            Continue Shopping
          </Link>

        </section>

      </main>
    );
  }


  return (
    <main className="order-confirmation-page">

      <section className="order-confirmation">

        {/* Success */}

        <div className="order-confirmation__success">

          <div className="order-confirmation__icon">
            <Check />
          </div>

          <p className="eyebrow">
            ORDER CONFIRMED
          </p>

          <h1>
            Thank You,{" "}
            {order.customer.firstName}.
          </h1>

          <p>
            Your order has been received
            and is being prepared.
          </p>

          <span className="order-confirmation__number">
            Order #{order.orderNumber}
          </span>

        </div>


        {/* Details */}

        <div className="order-confirmation__details">


          {/* Delivery */}

          <section>

            <p className="order-confirmation__label">
              DELIVERY
            </p>

            <strong>
              {order.customer.address}
            </strong>

            <span>
              {order.customer.city},{" "}
              {order.customer.postalCode}
            </span>

            <span>
              {order.customer.country}
            </span>

          </section>


          {/* Payment */}

          <section>

            <p className="order-confirmation__label">
              PAYMENT
            </p>

            <strong>
              {order.paymentMethod === "cod"
                ? "Cash on Delivery"
                : "Card Payment"}
            </strong>

            <span>
              {order.paymentMethod === "cod"
                ? "Pay when your order arrives."
                : "Payment method selected."}
            </span>

          </section>


          {/* Total */}

          <section>

            <p className="order-confirmation__label">
              ORDER TOTAL
            </p>

            <strong>
              ${order.total.toFixed(2)}
            </strong>

            <span>
              Includes{" "}
              {order.shippingCost === 0
                ? "free shipping"
                : `$${order.shippingCost.toFixed(2)} shipping`}
            </span>

          </section>

        </div>


        {/* Items */}

        <div className="order-confirmation__items">

          <div className="order-confirmation__items-heading">

            <span>
              ORDER
            </span>

            <span>
              {order.items.length}{" "}
              {order.items.length === 1
                ? "Item"
                : "Items"}
            </span>

          </div>


          {order.items.map((item) => (

            <article
              key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
              className="order-confirmation__item"
            >

              <div className="order-confirmation__image">
                <img
                  src={item.image}
                  alt={item.name}
                />
              </div>


              <div>

                <h2>
                  {item.name}
                </h2>

                <p>
                  Size: {item.selectedSize}
                </p>

                <p>
                  Quantity: {item.quantity}
                </p>

              </div>


              <strong>
                {item.price}
              </strong>

            </article>

          ))}

        </div>


        {/* Action */}

        <Link
          to="/shop"
          className="order-confirmation__continue"
        >
          Continue Shopping

          <ArrowRight />
        </Link>

      </section>

    </main>
  );
}