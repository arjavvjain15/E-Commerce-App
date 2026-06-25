import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Order = sequelize.define("Order", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("draft", "pending", "confirmed", "completed", "cancelled"),
    defaultValue: "pending",
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.0,
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export default Order;
