import { Link } from "react-router-dom";

import {
  Heart,
  ArrowRight,
} from "lucide-react";

import {
  useWishlist,
} from "../../context/WishlistContext";

import "./WishlistPage.css";


export default function WishlistPage() {

  const {
    wishlistItems,
    wishlistCount,
    toggleWishlist,
  } = useWishlist();


  // =========================
  // EMPTY WISHLIST
  // =========================

  if (wishlistItems.length === 0) {

    return (
      <main className="wishlist-page">

        <section className="wishlist-empty">

          <Heart className="wishlist-empty__icon" />

          <p className="eyebrow">
            YOUR WISHLIST
          </p>

          <h1>
            Nothing Saved Yet
          </h1>

          <p>
            Save pieces you love and
            return to them anytime.
          </p>

          <Link
            to="/shop"
            className="wishlist-empty__link"
          >
            Explore Collection
            <ArrowRight />
          </Link>

        </section>

      </main>
    );

  }


  return (
    <main className="wishlist-page">

      {/* =========================
          HEADER
      ========================= */}

      <section className="wishlist-header">

        <p className="eyebrow">
          YOUR WISHLIST
        </p>

        <h1>
          Saved Pieces
        </h1>

        <p>
          {wishlistCount}{" "}
          {wishlistCount === 1
            ? "Item"
            : "Items"}
        </p>

      </section>


      {/* =========================
          WISHLIST GRID
      ========================= */}

      <section className="wishlist-grid">

        {wishlistItems.map((product) => (

          <article
            key={product.id}
            className="wishlist-card"
          >

            <Link
              to={`/product/${product.id}`}
              className="wishlist-card__image"
            >

              <img
                src={product.image}
                alt={product.name}
              />

            </Link>


            <div className="wishlist-card__content">

              <div>

                <p>
                  {product.category}
                </p>

                <h2>
                  {product.name}
                </h2>

                <span>
                  {product.price}
                </span>

              </div>


              <button
                type="button"
                onClick={() =>
                  toggleWishlist(product)
                }
                aria-label={`Remove ${product.name} from wishlist`}
              >
                <Heart fill="currentColor" />
              </button>

            </div>

          </article>

        ))}

      </section>

    </main>
  );
}