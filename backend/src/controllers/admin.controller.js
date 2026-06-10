import { fetchAllUsers } from "../services/admin.service.js";
import { getAllOrders, updateOrderStatus } from "../services/order.service.js";

export const getUsers = async (req, res, next) => {
  try {
    const users = await fetchAllUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const orders = await getAllOrders();
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

export const updateOrder = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }
    const order = await updateOrderStatus(req.params.id, status);
    res.status(200).json({ message: "Order status updated successfully", order });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder= async(req,res,next)=>{
    try{    
        const status=req.body;
        if(!status) return res.status(404).json({message: "Status is Required"});
        const order= await updateOrderStatus(req.params.id,status);
        res.status(200).json({message:"Order is Cancelled from Admin side"})
    }
    catch(error){
        next(error);
    }
};

