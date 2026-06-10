import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { FaShoppingCart } from "react-icons/fa";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/orders");
      const sorted = response.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sorted);
    } catch (err) {
      console.error("Failed to load orders", err);
      setError("Failed to fetch your orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "completed";
      case "pending":
        return "pending";
      case "cancelled":
        return "cancelled";
      default:
        return "draft";
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="orders-page empty-state" style={{ padding: "60px 20px", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto 20px" }}></div>
        <h2>Loading your orders...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page empty-state" style={{ padding: "60px 20px", textAlign: "center" }}>
        <h2 style={{ color: "var(--danger)" }}> {error}</h2>
        <button className="btn btn-primary" onClick={fetchOrders} style={{ marginTop: "16px" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="orders-page-container">
      <div className="orders-page-header">
        <h1>My Orders</h1>
        <button className="btn btn-secondary btn-refresh" onClick={fetchOrders} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Status"}
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="orders-empty-state">
          <span style={{ fontSize: "4rem", marginBottom: "16px", display: "block" }}><FaShoppingCart></FaShoppingCart></span>
          <h2>No orders placed yet</h2>
          <p style={{ color: "var(--text)", margin: "12px 0 24px" }}>
            Looks like you haven't placed any orders yet. Check out our amazing products catalog!
          </p>
          <Link to="/" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-main-card">
              <div className="order-card-header">
                <div className="order-meta">
                  <span className="order-id">Order ID: #{order.id}</span>
                  <span className="order-date">
                    Placed on: {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className={`badge-status ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <div className="order-card-body">
                <div className="order-items-grid">
                  {order.OrderItems?.map((item) => (
                    <div key={item.id} className="order-item-row">
                      <img
                        src={
                          item.Product?.imageUrl ||
                          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"
                        }
                        alt={item.Product?.name || "Product image"}
                        className="order-item-img"
                      />
                      <div className="order-item-details">
                        <h4>{item.Product?.name || "Deleted Product"}</h4>
                        <span className="order-item-meta">
                          Quantity: {item.quantity} | Unit Price: INR {Number(item.price).toFixed(2)}
                        </span>
                      </div>
                      <div className="order-item-subtotal">
                        INR {(Number(item.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-shipping-section">
                  <h5>Shipping Address</h5>
                  <p>{order.shippingAddress || "No shipping address provided"}</p>
                </div>
              </div>

              <div className="order-card-footer">
                <div className="order-total">
                  <span>Total Paid:</span>
                  <span className="total-amount">INR {Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;
