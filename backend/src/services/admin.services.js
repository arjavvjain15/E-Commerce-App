import { User } from "../models/index.js";

export const fetchAllUsers = async () => {
  return await User.findAll({
    attributes: { exclude: ["password"] },
  });
};
