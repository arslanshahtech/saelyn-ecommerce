import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";

import "./AddToBagDrawer.css";

export default function AddToBagDrawer({
  isOpen,
  onClose,
  product,
  selectedSize,
  selectedColor,
  quantity,
}) {
  // =========================
  // BODY SCROLL LOCK
  // =========================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [isOpen]);


  // =========================
  // ESC TO CLOSE
  // =========================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isOpen, onClose]);


  // Drawer closed
  if (!isOpen || !product) {
    return null;
  }


  // =========================
  // PRICE
  // =========================

  const unitPrice = Number(
    product.price.replace("$", "")
  );

  const totalPrice =
    unitPrice * quantity;


  return (
    <div
      className="add-to-bag-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Added to bag"
    >

      {/* =========================
          BACKDROP
      ========================= */}

      <button
        type="button"
        className="add-to-bag-drawer__backdrop"
        aria-label="Close added to bag"
        onClick={onClose}
      />


      {/* =========================
          DRAWER
      ========================= */}

      <aside className="add-to-bag-drawer__panel">

        {/* Header */}

        <header className="add-to-bag-drawer__header">

          <div>
            <p className="add-to-bag-drawer__eyebrow">
              ADDED TO YOUR BAG
            </p>

            <h2>
              Ready for the next step.
            </h2>
          </div>

          <button
            type="button"
            className="add-to-bag-drawer__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X />
          </button>

        </header>


        {/* Product */}

        <div className="add-to-bag-drawer__product">

          <div className="add-to-bag-drawer__image">
            <img
              src={product.image}
              alt={product.name}
            />
          </div>


          <div className="add-to-bag-drawer__info">

            <p className="add-to-bag-drawer__category">
              {product.category}
            </p>

            <h3>
              {product.name}
            </h3>

            <div className="add-to-bag-drawer__meta">

              <span>
                Size: {selectedSize}
              </span>

              <span className="add-to-bag-drawer__color">
                Color:

                <i
                  style={{
                    backgroundColor:
                      selectedColor,
                  }}
                />
              </span>

              <span>
                Qty: {quantity}
              </span>

            </div>

            <strong>
              ${totalPrice.toFixed(2)}
            </strong>

          </div>

        </div>


        {/* Summary */}

        <div className="add-to-bag-drawer__summary">

          <div>
            <span>
              Item Total
            </span>

            <strong>
              ${totalPrice.toFixed(2)}
            </strong>
          </div>

          <p>
            Shipping calculated at checkout.
          </p>

        </div>


        {/* Actions */}

        <div className="add-to-bag-drawer__actions">

          <Link
            to="/cart"
            className="add-to-bag-drawer__primary"
            onClick={onClose}
          >
            View Bag

            <ArrowRight />
          </Link>


          <Link
            to="/checkout"
            className="add-to-bag-drawer__secondary"
            onClick={onClose}
          >
            Proceed to Checkout
          </Link>


          <button
            type="button"
            className="add-to-bag-drawer__continue"
            onClick={onClose}
          >
            Continue Shopping
          </button>

        </div>

      </aside>

    </div>
  );
}