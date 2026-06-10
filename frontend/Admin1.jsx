import { useMemo, useState, useEffect } from "react";
import api from "../api";

function Admin() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    categoryName: "",
    imageUrl: "",
  });
   
  const [productFilter, setProductFilter] = useState("all");

  const [alertMessage, setAlertMessage] = useState({ type: "", text: "" });

  const showAlert = (type, text) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage({ type: "", text: "" }), 5000);
  };

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        api.get("/products?includeDrafts=true"),
        api.get("/admin/orders"),
        api.get("/admin/users"),
      ]);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      showAlert("danger", "Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalProducts = products.length;
    const outOfStock = products.filter((p) => Number(p.stock) === 0).length;
    const totalCustomers = users.filter((u) => u.role === "user").length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const draftProducts = products.filter((p) => p.status === "draft").length;

    return {
      totalOrders,
      totalProducts,
      outOfStock,
      totalCustomers,
      pendingOrders,
      draftProducts,
    };
  }, [products, orders, users]);


  const recentBuyers = useMemo(() => {
    const buyerMap = {};
    orders.forEach((order) => {
      if (order.status !== "cancelled" && order.status !== "draft") {
        const uId = order.userId;
        const buyerUser = users.find((u) => u.id === uId);
        if (buyerUser) {
          if (!buyerMap[uId]) {
            buyerMap[uId] = {
              id: uId,
              name: buyerUser.name,
              email: buyerUser.email,
              totalSpent: 0,
            };
          }
          buyerMap[uId].totalSpent += Number(order.totalAmount);
        }
      }
    });
    return Object.values(buyerMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 4);
  }, [orders, users]);


  const filteredProducts = useMemo(() => {
    if (productFilter === "active") {
      return products.filter((p) => p.status === "active");
    }
    if (productFilter === "draft") {
      return products.filter((p) => p.status === "draft");
    }
    return products;
  }, [products, productFilter]);

  const handleProductSubmit = async (e, status = "active") => {
    if (e) e.preventDefault();

    if (!productForm.name || !productForm.description || !productForm.price || productForm.stock === "" || !productForm.categoryName) {
      showAlert("danger", "Product Name, Description, Price, Stock, and Category are required.");
      return;
    }

    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        stock: parseInt(productForm.stock, 10),
        categoryName: productForm.categoryName,
        imageUrl: productForm.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
        status: status,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        showAlert("success", `Product updated successfully (${status})!`);
      } else {
        await api.post("/products", payload);
        showAlert("success", `Product created successfully (${status})!`);
      }
      setShowProductModal(false);
      setEditingProduct(null);
      // Reset form
      setProductForm({
        name: "",
        description: "",
        price: "",
        stock: "",
        categoryName: "",
        imageUrl: "",
      });
      fetchData();
    } catch (err) {
      console.error(err);
      showAlert("danger", err.response?.data?.message || "Failed to save product.");
    }
  };

  const handleEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      description: prod.description || "",
      price: prod.price,
      stock: prod.stock,
      categoryName: prod.Category?.name || "",
      imageUrl: prod.imageUrl || "",
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/products/${prodId}`);
      showAlert("success", "Product deleted successfully!");
      fetchData();
    } catch (err) {
      console.error(err);
      showAlert("danger", "Failed to delete product. It may be linked to existing orders.");
    }
  };


  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { status: newStatus });
      showAlert("success", `Order status updated to ${newStatus}!`);
      fetchData();
    } catch (err) {
      console.error(err);
      showAlert("danger", err.response?.data?.message || "Failed to update order status.");
    }
  };

  const handleUploadDraft = async (orderId) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { status: "pending" });
      showAlert("success", "Draft order uploaded successfully (status set to pending)!");
      fetchData();
    } catch (err) {
      console.error(err);
      showAlert("danger", err.response?.data?.message || "Failed to upload draft order.");
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container" style={{ textAlign: "center", padding: "40px" }}>
        <h3>Loading Admin Dashboard...</h3>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-card-header">
        <h1 className="admin-dashboard-title">Admin Dashboard</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setEditingProduct(null);
              setProductForm({
                name: "",
                description: "",
                price: "",
                stock: "",
                categoryName: "",
                imageUrl: "",
              });
              setShowProductModal(true);
            }}
          >
          Add Product
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setActiveTab("products");
              setProductFilter("draft");
            }}
          >
          View Drafts
          </button>
        </div>
      </div>

      {alertMessage.text && (
        <div
          className={`review-form-${alertMessage.type === "danger" ? "alert" : "success"}`}
          style={{ marginBottom: "24px" }}
        >
          {alertMessage.text}
        </div>
      )}


      <div className="admin-stats-grid">
        <div className="dashboard-stat-card blue">
          <div className="stat-card-content">
            <div>
              <span className="stat-card-label">Orders</span>
              <div className="stat-card-value">{stats.totalOrders}</div>
            </div>
            <span style={{ fontSize: "2.5rem" }}></span>
          </div>
          <button className="stat-card-footer" onClick={() => setActiveTab("orders")}>
            <span>View All</span>
            <span>→</span>
          </button>
        </div>

        <div className="dashboard-stat-card green">
          <div className="stat-card-content">
            <div>
              <span className="stat-card-label">Customers</span>
              <div className="stat-card-value">{stats.totalCustomers}</div>
            </div>
            <span style={{ fontSize: "2.5rem" }}></span>
          </div>
          <button className="stat-card-footer" onClick={() => setActiveTab("customers")}>
            <span>View All</span>
            <span>→</span>
          </button>
        </div>

        <div className="dashboard-stat-card pink">
          <div className="stat-card-content">
            <div>
              <span className="stat-card-label">Draft Products</span>
              <div className="stat-card-value">{stats.draftProducts}</div>
            </div>
            <span style={{ fontSize: "2.5rem" }}></span>
          </div>
          <button
            className="stat-card-footer"
            onClick={() => {
              setActiveTab("products");
              setProductFilter("draft");
            }}
          >
            <span>View All</span>
            <span>→</span>
          </button>
        </div>

        <div className="dashboard-stat-card orange">
          <div className="stat-card-content">
            <div>
              <span className="stat-card-label">Out of Stock</span>
              <div className="stat-card-value">{stats.outOfStock}</div>
            </div>
            <span style={{ fontSize: "2.5rem" }}></span>
          </div>
          <button className="stat-card-footer" onClick={() => setActiveTab("products")}>
            <span>View All</span>
            <span>→</span>
          </button>
        </div>
      </div>

      


      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("products");
            setProductFilter("all");
          }}
        >
        Products
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
        Orders
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "customers" ? "active" : ""}`}
          onClick={() => setActiveTab("customers")}
        >
        Customers
        </button>
      </div>

      {activeTab === "products" && (
        <div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <button
              className={`btn ${productFilter === "all" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "6px 12px", fontSize: "0.85rem" }}
              onClick={() => setProductFilter("all")}
            >
              All Products ({products.length})
            </button>
            <button
              className={`btn ${productFilter === "active" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "6px 12px", fontSize: "0.85rem" }}
              onClick={() => setProductFilter("active")}
            >
              Active ({products.filter((p) => p.status === "active").length})
            </button>
            <button
              className={`btn ${productFilter === "draft" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "6px 12px", fontSize: "0.85rem" }}
              onClick={() => setProductFilter("draft")}
            >
              Drafts ({products.filter((p) => p.status === "draft").length})
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "6px", backgroundColor: "#f3f4f6", padding: "4px" }}
                      />
                    </td>
                    <td style={{ fontWeight: "600", color: "var(--text-h)" }}>{prod.name}</td>
                    <td>{prod.Category?.name || "Uncategorized"}</td>
                    <td style={{ fontWeight: "600" }}>INR {Number(prod.price).toFixed(2)}</td>
                    <td>
                      {prod.stock === 0 ? (
                        <span className="badge-status cancelled">Out of Stock</span>
                      ) : prod.stock <= 5 ? (
                        <span className="badge-status pending">Low Stock ({prod.stock})</span>
                      ) : (
                        <span className="badge-status completed">{prod.stock} Units</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge-status ${prod.status === "active" ? "completed" : "draft"}`}>
                        {prod.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {prod.status === "draft" && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                            onClick={async () => {
                              try {
                                await api.put(`/products/${prod.id}`, { status: "active" });
                                showAlert("success", "Product published successfully!");
                                fetchData();
                              } catch (err) {
                                showAlert("danger", "Failed to publish product.");
                              }
                            }}
                          >
                             Publish
                          </button>
                        )}
                        <button className="btn btn-secondary" style={{ padding: "6px 10px", fontSize: "0.8rem" }} onClick={() => handleEditProduct(prod)}>
                           Edit
                        </button>
                        <button className="btn btn-secondary" style={{ padding: "6px 10px", fontSize: "0.8rem", color: "var(--danger)" }} onClick={() => handleDeleteProduct(prod.id)}>
                           Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Buyer User</th>
                <th>Items Placed</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => {
                const buyer = users.find((u) => u.id === ord.userId);
                return (
                  <tr key={ord.id}>
                    <td style={{ fontWeight: "700" }}>#{ord.id}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: "600", color: "var(--text-h)" }}>{buyer?.name || "Unknown"}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text)" }}>{buyer?.email}</span>
                      </div>
                    </td>
                    <td>
                      <ul style={{ paddingLeft: "16px", margin: 0, fontSize: "0.85rem" }}>
                        {ord.OrderItems?.map((item) => (
                          <li key={item.id}>
                            {item.Product?.name} (Qty: {item.quantity})
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td style={{ fontWeight: "700", color: "var(--text-h)" }}>
                      INR {Number(ord.totalAmount).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge-status ${ord.status}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {ord.status === "draft" ? (
                          <button
                            className="btn btn-primary"
                            style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                            onClick={() => handleUploadDraft(ord.id)}
                          >
                            📤 Upload (Submit)
                          </button>
                        ) : (
                          <select
                            className="review-select"
                            style={{ padding: "4px 8px", fontSize: "0.8rem", width: "auto" }}
                            value={ord.status}
                            onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === "customers" && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email Address</th>
                <th>Provider</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: "700" }}>#{u.id}</td>
                  <td style={{ fontWeight: "600", color: "var(--text-h)" }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge-status completed" style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
                      {u.provider}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-status ${u.role === "admin" ? "pending" : "draft"}`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showProductModal && (
        <div className="admin-form-modal">
          <div className="admin-modal-content">
            <h3 className="admin-modal-title">
              {editingProduct ? "✏️ Edit Product" : " Add New Product"}
            </h3>
            <form onSubmit={handleProductSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label className="review-form-label">Product Name</label>
                <input
                  type="text"
                  required
                  className="search-input"
                  style={{ paddingLeft: "16px" }}
                  placeholder="e.g. MacBook Pro M3"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label className="review-form-label">Description</label>
                <textarea
                  required
                  className="review-textarea"
                  placeholder="Detailed description of the product..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label className="review-form-label">Price (INR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="search-input"
                    style={{ paddingLeft: "16px" }}
                    placeholder="999.99"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="review-form-label">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="search-input"
                    style={{ paddingLeft: "16px" }}
                    placeholder="50"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label className="review-form-label">Category Name</label>
                <select
                  className="review-select"
                  value={productForm.categoryName}
                  onChange={(e) => setProductForm({ ...productForm, categoryName: e.target.value })}
                  required
                >
                  <option value="">-- Select Category --</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Mobile">Mobile</option>
                  <option value="Audio">Audio</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label className="review-form-label">Image URL (Optional)</label>
                <input
                  type="text"
                  className="search-input"
                  style={{ paddingLeft: "16px" }}
                  placeholder="https://..."
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1, minWidth: "120px" }}
                  onClick={() => handleProductSubmit(null, "active")}
                >
                   Publish
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, minWidth: "120px", backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}
                  onClick={() => handleProductSubmit(null, "draft")}
                >
                   Save as Draft
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, minWidth: "80px" }}
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                  }}
                >
                Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}

export default Admin;