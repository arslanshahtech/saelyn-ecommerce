import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

const WishlistContext = createContext();


export function WishlistProvider({ children }) {

  // =========================
  // LOAD WISHLIST
  // =========================

  const [wishlistItems, setWishlistItems] = useState(() => {

    try {

      const savedWishlist =
        localStorage.getItem("saelyn-wishlist");

      return savedWishlist
        ? JSON.parse(savedWishlist)
        : [];

    } catch (error) {

      console.error(
        "Failed to load wishlist:",
        error
      );

      return [];

    }

  });


  // =========================
  // SAVE WISHLIST
  // =========================

  useEffect(() => {

    localStorage.setItem(
      "saelyn-wishlist",
      JSON.stringify(wishlistItems)
    );

  }, [wishlistItems]);


  // =========================
  // TOGGLE WISHLIST
  // =========================

  const toggleWishlist = (product) => {

    setWishlistItems((currentItems) => {

      const alreadyExists =
        currentItems.some(
          (item) => item.id === product.id
        );


      if (alreadyExists) {

        return currentItems.filter(
          (item) => item.id !== product.id
        );

      }


      return [
        ...currentItems,
        product,
      ];

    });

  };


  // =========================
  // REMOVE FROM WISHLIST
  // =========================

  const removeFromWishlist = (productId) => {

    setWishlistItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== productId
      )
    );

  };


  // =========================
  // CHECK WISHLIST
  // =========================

  const isInWishlist = (productId) => {

    return wishlistItems.some(
      (item) => item.id === productId
    );

  };


  // =========================
  // WISHLIST COUNT
  // =========================

  const wishlistCount =
    wishlistItems.length;


  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );

}


export function useWishlist() {

  return useContext(WishlistContext);

}