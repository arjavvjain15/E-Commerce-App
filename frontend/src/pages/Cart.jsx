import { useState } from "react";
import { useCart } from "../context/CartContext";
import api from "../api";

function Cart() {
  const { cartItems, remove, clearCart, increaseQuantity, decreaseQuantity, fetchCart } = useCart();

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!shippingAddress.trim()) return;

    setIsCheckingOut(true);
    try {
      await api.post("/orders", { shippingAddress });
      alert("Order placed successfully!");
      await fetchCart();
      setShowCheckoutModal(false);
      setShippingAddress("");
    } catch (err) {
      alert("Checkout failed");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page empty-state">
        <h2>Your Cart is Empty</h2>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>
      <div className="cart-container">
        <div className="cart-items-list">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item-card">
              <img src={item.image} alt={item.title} className="cart-item-image" />
              <div className="cart-item-details">
                <h3>{item.title}</h3>
                <span className="cart-item-category">{item.category}</span>
                <span className="cart-item-price">INR {item.price}</span>
              </div>
              <div className="cart-item-quantity-controls">
                <button className="quantity-btn" onClick={() => decreaseQuantity(item.id)}>
                  -
                </button>
                <span className="quantity-value">{item.quantity}</span>
                <button className="quantity-btn" onClick={() => increaseQuantity(item.id)}>
                  +
                </button>
              </div>
              <div className="cart-item-subtotal">
                <span>INR {item.price * item.quantity}</span>
              </div>
              <button
                className="btn-remove"
                onClick={() => remove(item.id)}
                title="Remove item"
              ></button>
            </div>
          ))}
        </div>

        <div className="cart-summary-card">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Items:</span>
            <span>{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
          </div>
          <div className="summary-row total-row">
            <span>Total Price:</span>
            <span>INR {totalPrice}</span>
          </div>
          <div className="summary-actions">
            <button className="btn btn-secondary btn-full" onClick={clearCart}>
              Clear Cart
            </button>
            <button className="btn btn-primary btn-full" onClick={() => setShowCheckoutModal(true)}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>

      {showCheckoutModal && (
        <div className="admin-form-modal">
          <div className="admin-modal-content" style={{ maxWidth: "500px" }}>
            <h3 className="admin-modal-title">Shipping Details</h3>
            <form onSubmit={handleCheckoutSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label className="review-form-label">Delivery Address</label>
                <textarea
                  required
                  className="review-textarea"
                  style={{ width: "100%", height: "200px", marginTop: "8px" }}
                  placeholder="Enter your shipping address (Street, City, Postal Code, etc.)"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCheckoutModal(false)}
                  disabled={isCheckingOut}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? "Processing..." : "Confirm Order"}
                </button>
                
                
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;