import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

import "./CartPage.css";

export default function CartPage() {

  // Cart se required functions aur data le rahe hain
  const {
    cartItems,
    cartCount,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
  } = useCart();

  // Cart ka subtotal calculate karna
  const subtotal = cartItems.reduce((total, item) => {
    const price = Number(item.price.replace("$", ""));

    return total + price * item.quantity;
  }, 0);


  // Empty cart
  if (cartItems.length === 0) {
    return (
      <main className="cart-page">

        <section className="cart-empty">

          <p className="eyebrow">
            YOUR BAG
          </p>

          <h1>
            Your Bag is Empty
          </h1>

          <p>
            Discover pieces designed for the modern wardrobe.
          </p>

          <Link to="/shop">
            Continue Shopping
          </Link>

        </section>

      </main>
    );
  }


  return (
    <main className="cart-page">

      {/* =========================
          CART HEADER
      ========================= */}

      <section className="cart-header">

        <p className="eyebrow">
          YOUR BAG
        </p>

        <h1>
          Shopping Bag
        </h1>

        {/* Actual total quantity */}
        <p>
          {cartCount}{" "}
          {cartCount === 1 ? "Item" : "Items"}
        </p>

      </section>


      {/* =========================
          CART CONTENT
      ========================= */}

      <section className="cart-layout">


        {/* =========================
            CART ITEMS
        ========================= */}

        <div className="cart-items">

          {cartItems.map((item) => (

            <article
              className="cart-item"
              key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
            >

              {/* Product Image */}

              <Link
                to={`/product/${item.id}`}
                className="cart-item__image"
              >

                <img
                  src={item.image}
                  alt={item.name}
                />

              </Link>


              {/* Product Information */}

              <div className="cart-item__content">

                <div>

                  <p className="cart-item__category">
                    {item.category}
                  </p>

                  <h2>
                    {item.name}
                  </h2>

                  <p className="cart-item__price">
                    {item.price}
                  </p>

                </div>


                {/* Selected Options */}

                <div className="cart-item__options">

                  <span>
                    Size: {item.selectedSize}
                  </span>

                  <span>
                    Color:

                    <i
                      style={{
                        backgroundColor: item.selectedColor,
                      }}
                    />

                  </span>

                </div>


                {/* Quantity */}

                <div className="cart-item__quantity">

                  <button
                    type="button"
                    onClick={() =>
                      decreaseQuantity(
                        item.id,
                        item.selectedSize,
                        item.selectedColor
                      )
                    }
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    −
                  </button>

                  <span>
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      increaseQuantity(
                        item.id,
                        item.selectedSize,
                        item.selectedColor
                      )
                    }
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    +
                  </button>

                </div>


                {/* Remove Item */}

                <button
                  type="button"
                  className="cart-item__remove"
                  onClick={() =>
                    removeFromCart(
                      item.id,
                      item.selectedSize,
                      item.selectedColor
                    )
                  }
                >
                  Remove
                </button>

              </div>

            </article>

          ))}

        </div>


        {/* =========================
            ORDER SUMMARY
        ========================= */}

        <aside className="cart-summary">

          <h2>
            Order Summary
          </h2>


          <div className="cart-summary__row">

            <span>
              Subtotal
            </span>

            <span>
              ${subtotal.toFixed(2)}
            </span>

          </div>


          <div className="cart-summary__row">

            <span>
              Shipping
            </span>

            <span>
              Free
            </span>

          </div>


          <div className="cart-summary__total">

            <span>
              Total
            </span>

            <strong>
              ${subtotal.toFixed(2)}
            </strong>

          </div>


          <Link
            to="/checkout"
            className="cart-summary__checkout"
          >
            Proceed to Checkout
          </Link>


          <Link
            to="/shop"
            className="cart-summary__continue"
          >
            Continue Shopping
          </Link>

        </aside>

      </section>

    </main>
  );
}