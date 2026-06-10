import { Wishlist, WishlistItem, Product } from "../models/index.js";

export const getWishlistDetails = async (userId) => {
  let wishlist = await Wishlist.findOne({
    where: { userId },
    include: [
      {
        model: WishlistItem,
        include: [{ model: Product }],
      },
    ],
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ userId });
    wishlist = await Wishlist.findOne({
      where: { id: wishlist.id },
      include: [
        {
          model: WishlistItem,
          include: [{ model: Product }],
        },
      ],
    });
  }

  return wishlist;
};


export const addItemToWishlist= async(userId,productId)=>{
    let wishlist=await Wishlist.findOne({where: {userId}});
    if(!wishlist) wishlist=await Wishlist.create({userId});

    const product=await Product.findByPk(productId);
    if(!product){
        const error=new Error("Product not found");
        error.status=404;
        throw error;
    }
    const exists= await WishlistItem.findOne({
        where: {wishlistId: wishlist.id, productId}
    });
    if(exists) return exists;

    return await Wishlist.create({wishlistId: wishlist.id, productId});
}


export const removeItemFromWishlist = async (userId, productId) => {
  const wishlist = await Wishlist.findOne({ where: { userId } });
  if (!wishlist) {
    const error = new Error("Wishlist not found");
    error.status = 404;
    throw error;
  }

  const result = await WishlistItem.destroy({
    where: { wishlistId: wishlist.id, productId },
  });

  if (result === 0) {
    const error = new Error("Item not found in wishlist");
    error.status = 404;
    throw error;
  }

  return true;
};
