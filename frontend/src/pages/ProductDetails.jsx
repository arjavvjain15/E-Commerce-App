import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { wishlist, toggleWishlist } = useWishlist();
  const { cartItems, addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct({
        id: res.data.id,
        title: res.data.name,
        description: res.data.description,
        price: Number(res.data.price),
        category: res.data.Category?.name || "Uncategorized",
        image: res.data.imageUrl,
        stock: res.data.stock,
      });
    } catch (err) {
      console.error("Failed to load product details", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/products/${id}/reviews`);
      setReviews(res.data);
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setReviewsLoading(true);
    fetchProduct();
    fetchReviews();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    try {
      await api.post(`/products/${id}/reviews`, {
        rating,
        comment,
      });
      
      await fetchReviews();
     
      setRating(5);
      setComment("");
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="product-details-container" style={{ textAlign: "center", padding: "40px" }}>
        <h3>Loading product details...</h3>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-details-container" style={{ padding: "40px" }}>
        <h2>Product Not Found</h2>
        <Link
          to="/"
          className="btn btn-secondary"
          style={{ marginTop: "20px", display: "inline-block" }}
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const isInWishlist = wishlist.some((item) => item.id === product.id);
  const cartItem = cartItems.find((item) => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "New";

  const hasReviewed = reviews.some((review) => review.userId === user?.id);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= rating ? "#fbbf24" : "var(--border)", marginRight: "2px" }}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="product-details-container">
      <div className="back-nav">
        <Link to="/" className="back-link">
          Back to Products
        </Link>
      </div>
      <div className="product-details-layout">
        <div className="product-details-image">
          <img src={product.image} alt={product.title} />
        </div>
        <div className="product-details-info">
          <span className="badge-category">{product.category}</span>
          <h1>{product.title}</h1>
          <p className="description">{product.description}</p>
          <div className="meta-row">
            <span className="price-tag">INR {product.price}</span>
            <span className="rating-tag">
              ★ {avgRating} {reviews.length > 0 && `(${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'})`}
            </span>
          </div>
          <div className="action-buttons">
            <button className="btn btn-primary btn-large" onClick={() => addToCart(product)}>
              {quantity > 0 ? `Added to Cart (${quantity})` : "Add to Cart"}
            </button>
            <button
              className={`btn btn-wishlist btn-large ${isInWishlist ? "active" : ""}`}
              onClick={() => toggleWishlist(product)}
            >
              {isInWishlist ? "Wishlist" : "Add to Wishlist"}
            </button>
          </div>
        </div>
      </div>



      <div className="reviews-section">
        <h2 className="reviews-header-title">Customer Reviews</h2>
        <div className="reviews-layout">
          <div className="reviews-list-container">
            {reviewsLoading ? (
              <p>Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="no-reviews-msg">No reviews yet. Be the first to review this product!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-meta">
                    <span className="review-user">{review.User?.name || "Anonymous User"}</span>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="review-rating-stars">
                    {renderStars(review.rating)}
                  </div>
                  {review.comment && (
                    <p className="review-comment-text">{review.comment}</p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="review-form-box">
            <h3>Write a Review</h3>
            {!isAuthenticated ? (
              <p style={{ fontSize: "0.95rem", color: "var(--text)" }}>
                Please{" "}
                <Link to="/login" style={{ color: "var(--accent)", fontWeight: "600" }}>
                  log in
                </Link>{" "}
                to share your review.
              </p>
            ) : hasReviewed ? (
              <p className="review-form-success" style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
                You have already reviewed this product. Thank you!
              </p>
            ) : (
              <form onSubmit={handleReviewSubmit}>
                {submitError && (
                  <div className="review-form-alert">
                    {submitError}
                  </div>
                )}
                <div className="review-form-group">
                  <label className="review-form-label" htmlFor="rating-select">Rating</label>
                  <select
                    id="rating-select"
                    className="review-select"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  >
                    <option value={5}>5 Stars - Excellent</option>
                    <option value={4}>4 Stars - Very Good</option>
                    <option value={3}>3 Stars - Good</option>
                    <option value={2}>2 Stars - Fair</option>
                    <option value={1}>1 Star - Poor</option>
                  </select>
                </div>
                <div className="review-form-group">
                  <label className="review-form-label" htmlFor="comment-textarea">Your Review</label>
                  <textarea
                    id="comment-textarea"
                    className="review-textarea"
                    placeholder="Tell us what you think about this product..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" 
                disabled={submitting} 
                className="btn btn-primary"
                 style={{width:"100%"}}>
                  {submitting? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;