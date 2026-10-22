import { Link } from "react-router-dom";

import "./CheckoutSummary.css";

export default function CheckoutSummary({
  cartItems,
  subtotal,
  shippingCost,
  total,
  onSubmit,
}) {

  return (
    <aside className="checkout-summary">

      <div className="checkout-summary__header">

        <p>
          ORDER SUMMARY
        </p>

        <span>
          {cartItems.reduce(
            (totalItems, item) =>
              totalItems + item.quantity,
            0
          )}{" "}
          Items
        </span>

      </div>


      <div className="checkout-summary__items">

        {cartItems.map((item) => (

          <article
            key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
            className="checkout-summary__item"
          >

            <Link
              to={`/product/${item.id}`}
              className="checkout-summary__image"
            >

              <img
                src={item.image}
                alt={item.name}
              />

            </Link>


            <div className="checkout-summary__item-info">

              <h3>
                {item.name}
              </h3>

              <p>
                Size: {item.selectedSize}
              </p>

              <p>
                Qty: {item.quantity}
              </p>

              <span>
                {item.price}
              </span>

            </div>

          </article>

        ))}

      </div>


      <div className="checkout-summary__totals">

        <div>
          <span>
            Subtotal
          </span>

          <strong>
            ${subtotal.toFixed(2)}
          </strong>
        </div>


        <div>
          <span>
            Shipping
          </span>

          <strong>
            {shippingCost === 0
              ? "Free"
              : `$${shippingCost.toFixed(2)}`
            }
          </strong>
        </div>


        <div className="checkout-summary__total">

          <span>
            Total
          </span>

          <strong>
            ${total.toFixed(2)}
          </strong>

        </div>

      </div>


      <button
        type="submit"
        className="checkout-summary__submit"
      >
        Place Order
      </button>


      <Link
        to="/cart"
        className="checkout-summary__back"
      >
        ← Back to Bag
      </Link>

    </aside>
  );
}