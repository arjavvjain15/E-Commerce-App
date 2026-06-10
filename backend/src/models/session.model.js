import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Session = sequelize.define("Session", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  jti: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

export default Session;
