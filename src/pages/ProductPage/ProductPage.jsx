import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useNotifications } from "../../context/NotificationContext";
import { getProductById } from "../../api/products";
import AddToBagDrawer from "../../components/AddToBagDrawer/AddToBagDrawer";
import "./ProductPage.css";

export default function ProductPage() {
  const { id } = useParams();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { notify } = useNotifications();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBagDrawerOpen, setIsBagDrawerOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getProductById(id)
      .then((item) => {
        if (!active) return;
        setProduct(item);
        setSelectedSize(item.sizes?.[0] || "");
        setSelectedColor(item.colors?.[0] || "");
        setQuantity(1);
      })
      .catch((requestError) => {
        if (!active) return;
        setProduct(null);
        setError(requestError.message || "Product load nahi ho saka.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return <main className="product-page"><section className="product-not-found"><p role="status">Loading product...</p></section></main>;
  }

  if (!product) {
    return (
      <main className="product-page">
        <section className="product-not-found">
          <h1>{error ? "Product Unavailable" : "Product Not Found"}</h1>
          <p role="alert">{error || "The product you are looking for does not exist."}</p>
          <Link to="/shop">Back to Shop</Link>
        </section>
      </main>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const increaseQuantity = () => setQuantity((current) => Math.min(product.stock || 99, current + 1));
  const decreaseQuantity = () => setQuantity((current) => Math.max(1, current - 1));
  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setIsBagDrawerOpen(true);
    notify(`${product.name} added to your bag.`);
  };
  const handleWishlistToggle = () => {
    toggleWishlist(product);
    notify(isWishlisted ? `${product.name} removed from your wishlist.` : `${product.name} saved to your wishlist.`);
  };

  return (
    <main className="product-page">
      <section className="product-details">
        <div className="product-details__image"><img src={product.image} alt={product.name} /></div>
        <div className="product-details__content">
          <p className="product-details__category">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="product-details__price">{product.price}</p>
          <p className="product-details__description">{product.description}</p>

          {!!product.colors?.length && (
            <div className="product-option">
              <h3>Color</h3>
              <div className="product-colors">
                {product.colors.map((color) => (
                  <button key={color} type="button" className={`product-color ${selectedColor === color ? "selected" : ""}`}
                    style={{ backgroundColor: color }} onClick={() => setSelectedColor(color)}
                    aria-label={`Select color ${color}`} aria-pressed={selectedColor === color} />
                ))}
              </div>
            </div>
          )}

          {!!product.sizes?.length && (
            <div className="product-option">
              <h3>Size</h3>
              <div className="product-sizes">
                {product.sizes.map((size) => (
                  <button key={size} type="button" className={selectedSize === size ? "selected" : ""}
                    onClick={() => setSelectedSize(size)} aria-pressed={selectedSize === size}>{size}</button>
                ))}
              </div>
            </div>
          )}

          <div className="product-option">
            <h3>Quantity</h3>
            <div className="quantity-selector">
              <button type="button" onClick={decreaseQuantity} aria-label="Decrease quantity" disabled={quantity <= 1}>−</button>
              <span>{quantity}</span>
              <button type="button" onClick={increaseQuantity} aria-label="Increase quantity" disabled={product.stock > 0 && quantity >= product.stock}>+</button>
            </div>
            {product.stock === 0 && <p role="status">Currently out of stock.</p>}
          </div>

          <div className="product-info"><strong>Material</strong><span>{product.material}</span></div>
          {!!product.details?.length && (
            <div className="product-info-list"><h3>Product Details</h3><ul>{product.details.map((detail) => <li key={detail}>{detail}</li>)}</ul></div>
          )}

          <div className="product-actions">
            <button type="button" className="product-actions__add" onClick={handleAddToCart} disabled={product.stock === 0}>Add to Bag</button>
            <button type="button" className={`product-actions__wishlist ${isWishlisted ? "is-active" : ""}`}
              onClick={handleWishlistToggle} aria-pressed={isWishlisted}>
              {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            </button>
          </div>
        </div>
      </section>
      <div className="product-back"><Link to="/shop">← Back to Shop</Link></div>
      <AddToBagDrawer isOpen={isBagDrawerOpen} onClose={() => setIsBagDrawerOpen(false)}
        product={product} selectedSize={selectedSize} selectedColor={selectedColor} quantity={quantity} />
    </main>
  );
}
