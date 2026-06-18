import sequelize from "../config/db.js";
import User from "./user.model.js";
import Session from "./session.model.js";
import Category from "./category.model.js";
import Product from "./product.model.js";
import Cart from "./cart.model.js";
import CartItem from "./cartItem.model.js";
import Wishlist from "./wishlist.model.js";
import WishlistItem from "./wishlistItem.model.js";
import Order from "./order.model.js";
import OrderItem from "./orderItem.model.js";
import Review from "./review.model.js";
import Banner from "./banner.model.js";
import Chat from "./chat.models.js";


// User and Session 
User.hasMany(Session, { foreignKey: "userId", onDelete: "CASCADE" });
Session.belongsTo(User, { foreignKey: "userId" });

// User and Cart (One-to-One)
User.hasOne(Cart, { foreignKey: "userId", onDelete: "CASCADE" });
Cart.belongsTo(User, { foreignKey: "userId" });

// User and Wishlist (One-to-One)
User.hasOne(Wishlist, { foreignKey: "userId", onDelete: "CASCADE" });
Wishlist.belongsTo(User, { foreignKey: "userId" });

// User and Order 
User.hasMany(Order, { foreignKey: "userId", onDelete: "CASCADE" });
Order.belongsTo(User, { foreignKey: "userId" });

// Category and Product 
Category.hasMany(Product, { foreignKey: "categoryId", onDelete: "SET NULL" });
Product.belongsTo(Category, { foreignKey: "categoryId" });

// Category and Banner
Category.hasMany(Banner, { foreignKey: "categoryId", onDelete: "SET NULL" });
Banner.belongsTo(Category, { foreignKey: "categoryId" });


// Cart and CartItem 
Cart.hasMany(CartItem, { foreignKey: "cartId", onDelete: "CASCADE" });
CartItem.belongsTo(Cart, { foreignKey: "cartId" });

// Product and CartItem 
Product.hasMany(CartItem, { foreignKey: "productId", onDelete: "CASCADE" });
CartItem.belongsTo(Product, { foreignKey: "productId" });

// Wishlist and WishlistItem 
Wishlist.hasMany(WishlistItem, { foreignKey: "wishlistId", onDelete: "CASCADE" });
WishlistItem.belongsTo(Wishlist, { foreignKey: "wishlistId" });

// Product and WishlistItem 
Product.hasMany(WishlistItem, { foreignKey: "productId", onDelete: "CASCADE" });
WishlistItem.belongsTo(Product, { foreignKey: "productId" });

// Order and OrderItem 
Order.hasMany(OrderItem, { foreignKey: "orderId", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

// Product and OrderItem 
Product.hasMany(OrderItem, { foreignKey: "productId", onDelete: "SET NULL" });
OrderItem.belongsTo(Product, { foreignKey: "productId" });

// User and Review 
User.hasMany(Review, { foreignKey: "userId", onDelete: "CASCADE" });
Review.belongsTo(User, { foreignKey: "userId" });

// Product and Review 
Product.hasMany(Review, { foreignKey: "productId", onDelete: "CASCADE" });
Review.belongsTo(Product, { foreignKey: "productId" });

// User and Chat
User.hasOne(Chat,{foreignKey: "userId", onDelete:"CASCADE"});
Chat.belongsTo(User, {foreignKey: "userId"});

export {sequelize,User,Session,Category,Product,Cart,CartItem,Wishlist,WishlistItem,Order,OrderItem,Review,Banner,Chat};
