import {
    getCartDetails,
    addItemToCart,
    removeItemFromCart,
    updateCartItemQuantity,
  } from "../services/cart.service.js";
  
  export const viewCart = async (req, res, next) => {
    try {
      const cart = await getCartDetails(req.user.id);
      res.status(200).json(cart);
    } catch (error) {
      next(error);
    }
  };
  
  export const addToCart = async (req, res, next) => {
    try {
      const { productId, quantity } = req.body;
      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }
  
      const cartItem = await addItemToCart(req.user.id, productId, quantity || 1);
      res.status(200).json({ message: "Product added to cart", cartItem });
    } catch (error) {
      next(error);
    }
  };
  
  export const removeFromCart = async (req, res, next) => {
    try {
      const { productId } = req.params;
      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }
  
      await removeItemFromCart(req.user.id, productId);
      res.status(200).json({ message: "Product removed from cart" });
    } catch (error) {
      next(error);
    }
  };
  
  export const updateQuantity = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;
      if (!productId || quantity === undefined) {
        return res.status(400).json({ message: "Product ID and quantity are required" });
      }
  
      const cartItem = await updateCartItemQuantity(req.user.id, productId, quantity);
      res.status(200).json({ message: "Cart item quantity updated", cartItem });
    } catch (error) {
      next(error);
    }
  };
  