import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { isAuthenticated } = useAuth();

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }
    try {
      const res = await api.get("/cart");
      const items = (res.data.CartItems || []).map((item) => ({
        id: item.Product.id,
        title: item.Product.name,
        price: Number(item.Product.price),
        image: item.Product.imageUrl,
        quantity: item.quantity,
        category: item.Product.Category?.name || "Uncategorized",
        stock: item.Product.stock,
      }));
      setCartItems(items);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const addToCart = async (product) => {
    if (!isAuthenticated) return;
    try {
      await api.post("/cart", { productId: product.id, quantity: 1 });
      await fetchCart();
    } catch (err) {
      console.error("Failed to add to cart:", err);
    }
  };

  const remove = async (id) => {
    if (!isAuthenticated) return;
    try {
      await api.delete(`/cart/${id}`);
      await fetchCart();
    } catch (err) {
      console.error("Failed to remove from cart:", err);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;
    try {
      for (const item of cartItems) {
        await api.delete(`/cart/${item.id}`);
      }
      await fetchCart();
    } catch (err) {
      console.error("Failed to clear cart:", err);
    }
  };

  const increaseQuantity = async (id) => {
    if (!isAuthenticated) return;
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    try {
      await api.put(`/cart/${id}`, { quantity: item.quantity + 1 });
      await fetchCart();
    } catch (err) {
      console.error("Failed to increase quantity:", err);
    }
  };

  const decreaseQuantity = async (id) => {
    if (!isAuthenticated) return;
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    try {
      if (item.quantity <= 1) {
        await remove(id);
      } else {
        await api.put(`/cart/${id}`, { quantity: item.quantity - 1 });
        await fetchCart();
      }
    } catch (err) {
      console.error("Failed to decrease quantity:", err);
    }
  };

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        remove,
        clearCart,
        totalItems,
        increaseQuantity,
        decreaseQuantity,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);