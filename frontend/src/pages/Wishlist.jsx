import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { cartItems, addToCart } = useCart();

  if (wishlist.length === 0) {
    return (
      <div className="wishlist-page empty-state">
        <h2>Your Wishlist is Empty</h2>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <h1>My Wishlist</h1>
      <div className="wishlist-grid">
        {wishlist.map((product) => {
          const cartItem = cartItems.find((item) => item.id === product.id);
          const quantity = cartItem ? cartItem.quantity : 0;

          return (
            <div key={product.id} className="wishlist-card">
              <button 
                className="wishlist-remove-badge" 
                onClick={() => removeFromWishlist(product.id)}
                title="Remove from Wishlist"
              >
                ✕
              </button>
              <img src={product.image} alt={product.title} />
              <h3>{product.title}</h3>
              <p className="category">Category: {product.category}</p>
              {product.stock <= 0 ? (
                <span className="badge-outofstock">Out of Stock</span>
              ) : (
                <p className="rating" style={{ visibility: "hidden", fontSize: "0.85rem", margin: "2px 0" }}>In Stock</p>
              )}
              <p className="price">Price: INR {product.price}</p>
              
              <div className="wishlist-actions">
                <Link to={`/product/${product.id}`} className="btn btn-secondary">
                  View
                </Link>
                <button 
                  className={`btn btn-primary ${product.stock <= 0 ? "btn-disabled" : ""}`}
                  onClick={() => product.stock > 0 && addToCart(product)}
                  disabled={product.stock <= 0}
                >
                  {product.stock <= 0 ? "Out of Stock" : quantity > 0 ? `Added (${quantity})` : "Add to Cart"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Wishlist;
