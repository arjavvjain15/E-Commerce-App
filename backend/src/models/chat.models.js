import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Chat = sequelize.define("Chat", {
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
  queryCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  lastResetDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
});

export default Chat;
