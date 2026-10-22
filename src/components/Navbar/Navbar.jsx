import { Heart, Search, ShoppingBag, UserRound, Menu } from "lucide-react";
import './Navbar.css'
import { useState } from "react";
import SearchOverlay from "../SearchOverlay/SearchOverlay";
import { useCart } from "../../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
const links = [
  "New In",
  "Shop",
  "Collections",
  "Essentials",
  "Accessories",
  "Sale",
];
export default function Navbar() {
  const {
  wishlistCount,
} = useWishlist();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <header className="navbar">
      <button id="humbarger" className="icon-button mobile-menu" aria-label="Open menu">
        <Menu />
      </button>
      <Link className="wordmark" to="/">
        SAELYN
      </Link>
      <nav className="nav-links" aria-label="Main navigation">
        {links.map((x) =>
          x === "Shop" ? (
            <Link key={x} to="/shop">
              {x}
            </Link>
          ) : (
            <a key={x} href={`#${x.toLowerCase().replaceAll(" ", "-")}`}>
              {x}
            </a>
          )
        )}
      </nav>
      <div className="nav-actions">
        <button
          type="button"
          className="icon-button"
          aria-label="Open search"
          onClick={() => setSearchOpen(true)}
        >
          <Search />
        </button>
        <button className="icon-button desktop-action" aria-label="Account">
          <UserRound />
        </button>
          <Link
          to="/wishlist"
          className="icon-button wishlist-button"
          aria-label={`Wishlist with ${wishlistCount} items`}
        >
          <Heart />

          {wishlistCount > 0 && (
            <span className="wishlist-count">
              {wishlistCount}
            </span>
          )}
        </Link>
        <Link
          to="/cart"
          className="icon-button cart-button"
          aria-label={`Shopping bag with ${cartCount} items`}
        >
          <ShoppingBag />

          {cartCount > 0 && (
            <span className="cart-count">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </header>
  );
}
