import { Cart, CartItem, Product } from "../models/index.js";

export const getCartDetails = async (userId) => {
  let cart = await Cart.findOne({
    where: { userId },
    include: [
      {
        model: CartItem,
        include: [{ model: Product }],
      },
    ],
  });

  if (!cart) {
    cart = await Cart.create({ userId });
    cart = await Cart.findOne({
      where: { id: cart.id },
      include: [
        {
          model: CartItem,
          include: [{ model: Product }],
        },
      ],
    });
  }

  return cart;
};

export const addItemToCart = async (userId, productId, quantity = 1) => {
  let cart = await Cart.findOne({ where: { userId } });
  if (!cart) {
    cart = await Cart.create({ userId });
  }

  const product = await Product.findByPk(productId);
  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  let cartItem = await CartItem.findOne({
    where: { cartId: cart.id, productId },
  });

  if (cartItem) {
    cartItem.quantity += Number(quantity);
    await cartItem.save();
  } else {
    cartItem = await CartItem.create({
      cartId: cart.id,
      productId,
      quantity: Number(quantity),
    });
  }

  return cartItem;
};

export const removeItemFromCart = async (userId, productId) => {
  const cart = await Cart.findOne({ where: { userId } });
  if (!cart) {
    const error = new Error("Cart not found");
    error.status = 404;
    throw error;
  }

  const result = await CartItem.destroy({
    where: { cartId: cart.id, productId },
  });

  if (result === 0) {
    const error = new Error("Item not found in cart");
    error.status = 404;
    throw error;
  }

  return true;
};

export const updateCartItemQuantity = async (userId, productId, quantity) => {
  const cart = await Cart.findOne({ where: { userId } });
  if (!cart) {
    const error = new Error("Cart not found");
    error.status = 404;
    throw error;
  }

  const cartItem = await CartItem.findOne({
    where: { cartId: cart.id, productId },
  });

  if (!cartItem) {
    const error = new Error("Item not found in cart");
    error.status = 404;
    throw error;
  }

  if (Number(quantity) < 1) {
    await cartItem.destroy();
    return null;
  }

  cartItem.quantity = Number(quantity);
  await cartItem.save();
  return cartItem;
};
