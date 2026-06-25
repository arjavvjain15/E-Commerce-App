import { Order, OrderItem, Cart, CartItem, Product, sequelize } from "../models/index.js";
import { sendOrderToQueue } from "../producers/order.producer.js";

export const checkoutCart = async (userId, { shippingAddress }) => {
  const transaction = await sequelize.transaction();
  try {
    const cart = await Cart.findOne({
      where: { userId },
      include: [{ model: CartItem, include: [Product] }],
    });

    if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
      const error = new Error("Cart is empty");
      error.status = 400;
      throw error;
    }

    let totalAmount = 0;
    for (const item of cart.CartItems) {
      if (item.Product.stock < item.quantity) {
        const error = new Error(`Insufficient stock for product: ${item.Product.name}`);
        error.status = 400;
        throw error;
      }
      totalAmount += Number(item.Product.price) * item.quantity;
    }

    const order = await Order.create(
      {
        userId,
        status: "pending",
        totalAmount,
        shippingAddress,
      },
      { transaction }
    );

    for (const item of cart.CartItems) {
      await OrderItem.create(
        {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.Product.price,
        },
        { transaction }
      );

      await item.Product.update(
        {
          stock: item.Product.stock - item.quantity,
        },
        { transaction }
      );
    }

    await CartItem.destroy({ where: { cartId: cart.id } }, { transaction });

    await transaction.commit();

    try {
      await sendOrderToQueue({
        orderId: order.id,
        userId: order.userId,
        shippingAddress: order.shippingAddress,
      });
    } catch (sqsError) {
      console.error("[SQS Producer] Order placed, but SQS queue dispatch failed:", sqsError);
    }

    return order;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};


export const updateOrderStatus = async (orderId, status) => {
  const order = await Order.findByPk(orderId);
  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  if (order.status === "draft" && (status === "pending" || status === "completed")) {
    const items = await OrderItem.findAll({ where: { orderId } });
    const transaction = await sequelize.transaction();
    try {
      for (const item of items) {
        const product = await Product.findByPk(item.productId);
        if (product) {
          if (product.stock < item.quantity) {
            const error = new Error(`Insufficient stock for product: ${product.name}`);
            error.status = 400;
            throw error;
          }
          await product.update({ stock: product.stock - item.quantity }, { transaction });
        }
      }
      await order.update({ status }, { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } else {
    await order.update({ status });
  }

  return order;
};

export const getOrdersByUser = async (userId) => {
  return await Order.findAll({
    where: { userId },
    include: [{ model: OrderItem, include: [Product] }],
  });
};

export const getOrderDetailsById = async (orderId) => {
  return await Order.findByPk(orderId, {
    include: [{ model: OrderItem, include: [Product] }],
  });
};

export const getAllOrders = async () => {
  return await Order.findAll({
    include: [{ model: OrderItem, include: [Product] }],
  });
};

export const getall= async()=>{
    return await Order.findAll({
        include:[{model: OrderItem, include:[Product]}],
    })
}

export const getbyId= async()=>{
    return await Order.findAll({
        include:[{model:OrderItem,include:[Product]}],
    })
}

