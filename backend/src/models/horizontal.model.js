import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Horizontal = sequelize.define("Horizontal", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  bg:{
    type: DataTypes.STRING,
    allowNull: false,
  }
});

export default Horizontal;
