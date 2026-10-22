import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { getSavedWishlist, saveWishlist, syncSavedWishlist, toWishlistPayload } from "../api/shopping";

const WishlistContext = createContext(null);
const WISHLIST_KEY = "saelyn-wishlist";
const OWNER_KEY = "saelyn-wishlist-owner";

function readLocalWishlist() {
  try {
    const value = localStorage.getItem(WISHLIST_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const { user, authLoading } = useAuth();
  const [wishlistItems, setWishlistItems] = useState(readLocalWishlist);
  const [readyUserId, setReadyUserId] = useState(null);
  const lastUserId = useRef(null);
  const saveQueue = useRef(Promise.resolve());

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      if (lastUserId.current) {
        lastUserId.current = null;
        setReadyUserId(null);
        setWishlistItems([]);
        localStorage.removeItem(OWNER_KEY);
        localStorage.removeItem(WISHLIST_KEY);
      }
      return;
    }

    if (lastUserId.current === user.id && readyUserId === user.id) return;
    lastUserId.current = user.id;
    setReadyUserId(null);
    let cancelled = false;

    const ownerId = localStorage.getItem(OWNER_KEY);
    const guestItems = ownerId === null ? wishlistItems : [];
    const load = ownerId === user.id
      ? getSavedWishlist()
      : syncSavedWishlist(toWishlistPayload(guestItems));

    load.then((result) => {
      if (cancelled) return;
      setWishlistItems(result.items || []);
      localStorage.setItem(OWNER_KEY, user.id);
      setReadyUserId(user.id);
    }).catch((error) => {
      if (cancelled) return;
      console.error("Wishlist sync failed:", error.message);
      setReadyUserId(user.id);
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistItems));
      return;
    }

    if (readyUserId !== user.id) return;
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistItems));
    localStorage.setItem(OWNER_KEY, user.id);
    const payload = toWishlistPayload(wishlistItems);
    saveQueue.current = saveQueue.current
      .catch(() => {})
      .then(() => saveWishlist(payload))
      .catch((error) => console.error("Wishlist save failed:", error.message));
  }, [wishlistItems, user, authLoading, readyUserId]);

  const toggleWishlist = useCallback((product) => {
    const productId = product.id || product._id;
    setWishlistItems((currentItems) => {
      if (currentItems.some((item) => (item.id || item._id) === productId)) {
        return currentItems.filter((item) => (item.id || item._id) !== productId);
      }
      return [...currentItems, { ...product, id: productId }];
    });
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    setWishlistItems((currentItems) => currentItems.filter((item) => (item.id || item._id) !== productId));
  }, []);

  const isInWishlist = useCallback((productId) => {
    return wishlistItems.some((item) => (item.id || item._id) === productId);
  }, [wishlistItems]);

  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider value={{
      wishlistItems, wishlistCount, toggleWishlist, removeFromWishlist, isInWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside WishlistProvider");
  return context;
}
