import { createContext, useContext, useEffect,useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  // Browser ke localStorage se existing cart load karna
  const [cartItems, setCartItems] = useState(() => {
  const savedCart = localStorage.getItem("saelyn-cart");
 
    return savedCart ? JSON.parse(savedCart) : [];
  });
   const clearCart = () => {setCartItems([]);};

  // Cart change hone par localStorage update karna
  useEffect(() => {
    localStorage.setItem(
      "saelyn-cart",
      JSON.stringify(cartItems)
    );
  }, [cartItems]);

  // Product ko cart mein add karna
  const addToCart = (
    product,
    selectedSize,
    selectedColor,
    quantity
  ) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) =>
          item.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
      );

      // Agar same product + same size + same color
      // already cart mein hai to quantity increase hogi
      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item
        );
      }

      // New product cart mein add karna
      return [
        ...currentItems,
        {
          ...product,
          selectedSize,
          selectedColor,
          quantity,
        },
      ];
    });
  };

  // Quantity increase
  const increaseQuantity = (
    itemId,
    selectedSize,
    selectedColor
  ) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  // Quantity decrease
  const decreaseQuantity = (
    itemId,
    selectedSize,
    selectedColor
  ) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor
          ? {
              ...item,
              quantity: Math.max(1, item.quantity - 1),
            }
          : item
      )
    );
  };

  // Product remove karna
  const removeFromCart = (
    itemId,
    selectedSize,
    selectedColor
  ) => {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) =>
          !(
            item.id === itemId &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
          )
      )
    );
  };

  // Total quantity
  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}