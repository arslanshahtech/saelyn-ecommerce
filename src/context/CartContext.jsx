import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { getSavedCart, saveCart, syncSavedCart, toCartPayload } from "../api/shopping";

const CartContext = createContext(null);
const CART_KEY = "saelyn-cart";
const OWNER_KEY = "saelyn-cart-owner";

function readLocalCart() {
  try {
    const value = localStorage.getItem(CART_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { user, authLoading } = useAuth();
  const [cartItems, setCartItems] = useState(readLocalCart);
  const [readyUserId, setReadyUserId] = useState(null);
  const lastUserId = useRef(null);
  const saveQueue = useRef(Promise.resolve());

  // Login: merge guest cart once. A cart belonging to another account is never merged.
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      if (lastUserId.current) {
        lastUserId.current = null;
        setReadyUserId(null);
        setCartItems([]);
        localStorage.removeItem(OWNER_KEY);
        localStorage.removeItem(CART_KEY);
      }
      return;
    }

    if (lastUserId.current === user.id && readyUserId === user.id) return;
    lastUserId.current = user.id;
    setReadyUserId(null);
    let cancelled = false;

    const ownerId = localStorage.getItem(OWNER_KEY);
    const guestItems = ownerId === null ? cartItems : [];
    const load = ownerId === user.id
      ? getSavedCart()
      : syncSavedCart(toCartPayload(guestItems));

    load.then((result) => {
      if (cancelled) return;
      setCartItems(result.items || []);
      localStorage.setItem(OWNER_KEY, user.id);
      setReadyUserId(user.id);
    }).catch((error) => {
      if (cancelled) return;
      console.error("Cart sync failed:", error.message);
      // Keep the local items available; the next login/session can retry.
      setReadyUserId(user.id);
    });

    return () => { cancelled = true; };
  // cartItems is intentionally captured only when the identity changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  // Guest cart stays local. Authenticated cart is persisted to the database in order.
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
      return;
    }

    if (readyUserId !== user.id) return;
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    localStorage.setItem(OWNER_KEY, user.id);
    const payload = toCartPayload(cartItems);
    saveQueue.current = saveQueue.current
      .catch(() => {})
      .then(() => saveCart(payload))
      .catch((error) => console.error("Cart save failed:", error.message));
  }, [cartItems, user, authLoading, readyUserId]);

  const clearCart = useCallback(() => setCartItems([]), []);

  const addToCart = (product, selectedSize, selectedColor, quantity = 1) => {
    const productId = product.id || product._id;
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) =>
        (item.id || item._id) === productId &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor
      );

      if (existingItem) {
        return currentItems.map((item) =>
          (item.id || item._id) === productId &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...currentItems, {
        ...product,
        id: productId,
        selectedSize,
        selectedColor,
        quantity,
      }];
    });
  };

  const increaseQuantity = (itemId, selectedSize, selectedColor) => {
    setCartItems((currentItems) => currentItems.map((item) =>
      (item.id || item._id) === itemId &&
      item.selectedSize === selectedSize &&
      item.selectedColor === selectedColor
        ? { ...item, quantity: Math.min(20, item.quantity + 1) }
        : item
    ));
  };

  const decreaseQuantity = (itemId, selectedSize, selectedColor) => {
    setCartItems((currentItems) => currentItems.map((item) =>
      (item.id || item._id) === itemId &&
      item.selectedSize === selectedSize &&
      item.selectedColor === selectedColor
        ? { ...item, quantity: Math.max(1, item.quantity - 1) }
        : item
    ));
  };

  const removeFromCart = (itemId, selectedSize, selectedColor) => {
    setCartItems((currentItems) => currentItems.filter((item) =>
      !((item.id || item._id) === itemId &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor)
    ));
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, cartCount, cartSyncing: Boolean(user && !authLoading && readyUserId !== user.id),
      addToCart, increaseQuantity, decreaseQuantity, removeFromCart, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
