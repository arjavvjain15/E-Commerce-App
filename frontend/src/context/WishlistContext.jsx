import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const { isAuthenticated } = useAuth();

  const fetchWishlist = async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }
    try {
      const res = await api.get("/wishlist");
      const items = (res.data.WishlistItems || []).map((item) => ({
        id: item.Product.id,
        title: item.Product.name,
        price: Number(item.Product.price),
        image: item.Product.imageUrl,
        category: item.Product.Category?.name || "Uncategorized",
        stock: item.Product.stock,
      }));
      setWishlist(items);
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated]);

  const addToWishlist = async (product) => {
    if (!isAuthenticated) return;
    try {
      await api.post("/wishlist", { productId: product.id });
      await fetchWishlist();
    } catch (err) {
      console.error("Failed to add to wishlist:", err);
    }
  };

  const removeFromWishlist = async (id) => {
    if (!isAuthenticated) return;
    try {
      await api.delete(`/wishlist/${id}`);
      await fetchWishlist();
    } catch (err) {
      console.error("Failed to remove from wishlist:", err);
    }
  };

  const toggleWishlist = async (product) => {
    if (!isAuthenticated) return;
    const exists = wishlist.some((item) => item.id === product.id);
    if (exists) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  return (
    <WishlistContext.Provider
      value={{wishlist,addToWishlist,removeFromWishlist,toggleWishlist,fetchWishlist,}}
    >
    {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
