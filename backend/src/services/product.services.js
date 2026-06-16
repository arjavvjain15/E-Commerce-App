import { Product, Category } from "../models/index.js";
import { Op } from "sequelize";

export const getAllProducts = async ({ categoryId, search, includeDrafts = false }) => {
  const where = {};
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (search) {
    where.name = { [Op.like]: `%${search}%` };
  }
  if (!includeDrafts) {
    where.status = "active";
  }
  return await Product.findAll({
    where,
    include: [{ model: Category, attributes: ["id", "name"] }],
  });
};

export const getProductById = async (id, { includeDrafts = false } = {}) => {
  const product = await Product.findByPk(id, {
    include: [{ model: Category, attributes: ["id", "name"] }],
  });
  if (!product || (product.status === "draft" && !includeDrafts)) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }
  return product;
};

export const createProduct = async ({
  name,
  description,
  price,
  stock,
  imageUrl,
  originalName,
  categoryName,
  categoryId,
  status,
}) => {
  let finalCategoryId = categoryId;
  if (!finalCategoryId && categoryName) {
    const [category] = await Category.findOrCreate({ where: { name: categoryName } });
    finalCategoryId = category.id;
  }

  return await Product.create({
    name,
    description,
    price,
    stock,
    imageUrl,
    originalName,
    categoryId: finalCategoryId || null,
    status: status || "active",
  });
};

export const updateProduct = async (
  id,
  { name, description, price, stock, imageUrl, originalName, categoryName, categoryId, status }
) => {
  const product = await Product.findByPk(id);
  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  let finalCategoryId = categoryId;
  if (categoryName) {
    const [category] = await Category.findOrCreate({ where: { name: categoryName } });
    finalCategoryId = category.id;
  }

  await product.update({
    name: name !== undefined ? name : product.name,
    description: description !== undefined ? description : product.description,
    price: price !== undefined ? price : product.price,
    stock: stock !== undefined ? stock : product.stock,
    imageUrl: imageUrl !== undefined ? imageUrl : product.imageUrl,
    originalName: originalName !== undefined ? originalName : product.originalName,
    categoryId: finalCategoryId !== undefined ? finalCategoryId : product.categoryId,
    status: status !== undefined ? status : product.status,
  });

  return product;
};

export const deleteProduct = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }
  await product.destroy();
  return true;
};

