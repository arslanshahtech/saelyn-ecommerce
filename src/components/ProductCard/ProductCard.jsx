import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

import { useWishlist } from "../../context/WishlistContext";

import "./ProductCard.css";


export default function ProductCard({ product }) {

  const {
    toggleWishlist,
    isInWishlist,
  } = useWishlist();


  const isWishlisted =
    isInWishlist(product.id);


  const handleWishlistClick = (event) => {

    // Card ke kisi aur interaction ko trigger
    // hone se prevent karna
    event.preventDefault();
    event.stopPropagation();

    toggleWishlist(product);

  };


  return (
    <article className="product-card">

      <Link
        className="product-card__image-wrap"
        to={`/product/${product.id}`}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
      </Link>


      {/* =========================
          WISHLIST
      ========================= */}

      <button
        type="button"
        className={`product-card__wishlist icon-button ${
          isWishlisted ? "is-active" : ""
        }`}
        aria-label={
          isWishlisted
            ? `Remove ${product.name} from wishlist`
            : `Add ${product.name} to wishlist`
        }
        aria-pressed={isWishlisted}
        onClick={handleWishlistClick}
      >
        <Heart
          fill={
            isWishlisted
              ? "currentColor"
              : "none"
          }
        />
      </button>


      {/* =========================
          PRODUCT DETAILS
      ========================= */}

      <div className="product-card__details">

        <div>

          <h3>
            {product.name}
          </h3>

          <p>
            {product.price}
          </p>

        </div>


        {product.colors && (

          <div className="swatches">

            {product.colors.map((color) => (

              <span
                key={color}
                style={{
                  backgroundColor: color,
                }}
              />

            ))}

          </div>

        )}

      </div>

    </article>
  );
}