import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Wishlist = sequelize.define("Wishlist", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
});

export default Wishlist;
