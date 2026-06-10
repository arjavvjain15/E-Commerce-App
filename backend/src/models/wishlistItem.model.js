import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const WishlistItem = sequelize.define(
  "WishlistItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    wishlistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["wishlistId", "productId"],
      },
    ],
  }
);

export default WishlistItem;
