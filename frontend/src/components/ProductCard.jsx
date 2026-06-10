import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

function ProductCard({ product }) {
  const { wishlist, toggleWishlist } = useWishlist();
  const { cartItems, addToCart } = useCart();

  const isInWishlist = wishlist.some((item) => item.id === product.id);
  const cartItem = cartItems.find((item) => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className="product-card">
      <img src={product.image} alt={product.title} />
      <h3>{product.title}</h3>
      <p className="category">Category: {product.category}</p>
      <p className="price">Price: INR {product.price}</p>
      <p className="rating">Rating:  {product.rating}</p>
      
      <div className="actions">
        <Link to={`/product/${product.id}`} className="btn btn-secondary">
          View Details
        </Link>
        <button 
          className={`btn btn-wishlist ${isInWishlist ? "active" : ""}`}
          onClick={() => toggleWishlist(product)}
        >
          {isInWishlist ? "Wishlist" : "Wishlist"}
        </button>
        <button 
          className="btn btn-primary"
          onClick={() => addToCart(product)}
        >
          {quantity > 0 ? `Added (${quantity})` : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
export default ProductCard;