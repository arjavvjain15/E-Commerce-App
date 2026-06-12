import {getWishlistDetails,addItemToWishlist,removeItemFromWishlist,} from "../services/wishlist.services.js";
  
  export const viewWishlist = async (req, res, next) => {
    try {
      const wishlist = await getWishlistDetails(req.user.id);
      res.status(200).json(wishlist);
    } catch (error) {
      next(error);
    }
  };
  
  export const addToWishlist = async (req, res, next) => {
    try {
      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }
  
      const wishlistItem = await addItemToWishlist(req.user.id, productId);
      res.status(200).json({ message: "Product added to wishlist", wishlistItem });
    } catch (error) {
      next(error);
    }
  };
  
  export const removeFromWishlist = async (req, res, next) => {
    try {
      const { productId } = req.params;
      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }
  
      await removeItemFromWishlist(req.user.id, productId);
      res.status(200).json({ message: "Product removed from wishlist" });
    } catch (error) {
      next(error);
    }
  };
  