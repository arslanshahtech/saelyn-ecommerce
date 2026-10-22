import { Heart, Search, ShoppingBag, UserRound, Menu, X, LogOut } from "lucide-react";
import "./Navbar.css";
import { useState } from "react";
import SearchOverlay from "../SearchOverlay/SearchOverlay";
import { useCart } from "../../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";

const links = ["New In", "Shop", "Collections", "Essentials", "Accessories", "Sale"];

export default function Navbar() {
  const { wishlistCount } = useWishlist();
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/", { replace: true });
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="navbar">
      <button
        id="humbarger"
        className="icon-button mobile-menu"
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileMenuOpen}
        aria-controls="main-navigation"
        type="button"
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        {mobileMenuOpen ? <X /> : <Menu />}
      </button>
      <Link className="wordmark" to="/" onClick={closeMobileMenu}>SAELYN</Link>
      <nav
        id="main-navigation"
        className={mobileMenuOpen ? "nav-links nav-links--open" : "nav-links"}
        aria-label="Main navigation"
      >
        {links.map((x) =>
          x === "Shop" ? (
            <Link key={x} to="/shop" onClick={closeMobileMenu}>{x}</Link>
          ) : (
            <a key={x} href={"#" + x.toLowerCase().replaceAll(" ", "-")} onClick={closeMobileMenu}>{x}</a>
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
        <Link
          className="icon-button account-action"
          to={user ? "/account" : "/login"}
          aria-label={user ? "Account for " + user.name : "Log in"}
        >
          <UserRound />
        </Link>
        <Link to="/wishlist" className="icon-button wishlist-button" aria-label={"Wishlist with " + wishlistCount + " items"}>
          <Heart />
          {wishlistCount > 0 && <span className="wishlist-count">{wishlistCount}</span>}
        </Link>
        <Link to="/cart" className="icon-button cart-button" aria-label={"Shopping bag with " + cartCount + " items"}>
          <ShoppingBag />
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </Link>
        {user && (
          <button type="button" className="icon-button desktop-action nav-logout" onClick={handleLogout} aria-label="Log out">
            <LogOut />
          </button>
        )}
      </div>
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
