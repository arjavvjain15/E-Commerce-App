import { checkoutCart, getOrdersByUser, getOrderDetailsById } from "../services/order.service.js";
import { getbyId } from "../services/order.services.js";

export const create = async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;
    const order = await checkoutCart(req.user.id, { shippingAddress });
    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await getOrdersByUser(req.user.id);
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

export const getOrderDetails = async (req, res, next) => {
  try {
    const order = await getOrderDetailsById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

export const getall=async(req,res,next)=>{
    try{
        const orders=await getOrdersByUser(req.user.id);
        if(!orders) return res.status(404).json({message:"Users not found"});
        res.status(200).json(orders);
    }
    catch(errror){
        next(error);
    }
}

export const getbyid= async(req,res,next)=>{
    try{
        const order=getbyId(req.user.id);
        if(!order) return res.status(404).json({messgae:"Not found"})
        res.status(200).json(order);
    }
    catch(error){
        next(error);
    }
}