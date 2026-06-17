import { useMemo, useState, useEffect } from "react";
import api from "../api";

function Admin() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Product Modals / Forms State
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

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Product Filter State ("all", "active", "draft")
  const [productFilter, setProductFilter] = useState("all");

  // Banner State & Modals
  const [banners, setBanners] = useState([]);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    badge: "",
    title: "",
    subtitle: "",
    imageUrl: "",
    bg: "",
    categoryId: "",
  });

  // General alert/error messaging
  const [alertMessage, setAlertMessage] = useState({ type: "", text: "" });

  const showAlert = (type, text) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage({ type: "", text: "" }), 5000);
  };

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes, usersRes, bannersRes] = await Promise.all([
        api.get("/products?includeDrafts=true"),
        api.get("/admin/orders"),
        api.get("/admin/users"),
        api.get("/banners"),
      ]);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
      setUsers(usersRes.data);
      setBanners(bannersRes.data);
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

  // Statistics calculations
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

  // Derive recent buyers (highest spent users)
  const recentBuyers = useMemo(() => {
    const userSpendMap = {};
    orders.forEach((ord) => {
      if (ord.status === "cancelled" || ord.status === "draft") return;
      const userId = ord.userId;
      const amount = Number(ord.totalAmount) || 0;
      userSpendMap[userId] = (userSpendMap[userId] || 0) + amount;
    });

    const buyers = [];
    Object.entries(userSpendMap).forEach(([userId, totalSpent]) => {
      const u = users.find((user) => String(user.id) === String(userId));
      if (u) {
        buyers.push({
          id: u.id,
          name: u.name,
          email: u.email,
          totalSpent,
        });
      }
    });

    return buyers.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  }, [orders, users]);

  
  // Filter products by status
  const filteredProducts = useMemo(() => {
    if (productFilter === "active") {
      return products.filter((p) => p.status === "active");
    }
    if (productFilter === "draft") {
      return products.filter((p) => p.status === "draft");
    }
    return products;
  }, [products, productFilter]);

  // Create or Update Product handler
  const handleProductSubmit = async (e, status = "active") => {
    if (e) e.preventDefault();

    if (!productForm.name || !productForm.description || !productForm.price || productForm.stock === "" || !productForm.categoryName) {
      showAlert("danger", "Product Name, Description, Price, Stock, and Category are required.");
      return;
    }

    try {
      let finalImageUrl = productForm.imageUrl;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("image", selectedFile);

        const uploadRes = await api.post("/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        finalImageUrl = uploadRes.data.imageUrl;
      }

      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        stock: parseInt(productForm.stock, 10),
        categoryName: productForm.categoryName,
        imageUrl: finalImageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
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
      setSelectedFile(null);
      setImagePreview("");
      fetchData();
    } catch (err) {
      console.error(err);
      showAlert("danger", err.response?.data?.message || "Failed to save product.");
    }
  };

  // Open product modal for editing
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
    setImagePreview(prod.imageUrl || "");
    setSelectedFile(null);
    setShowProductModal(true);
  };

  // Delete product handler
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

  // Create or Update Banner handler
  const handleBannerSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!bannerForm.title || !bannerForm.imageUrl) {
      showAlert("danger", "Banner Title and Image URL are required.");
      return;
    }

    try {
      const payload = {
        badge: bannerForm.badge,
        title: bannerForm.title,
        subtitle: bannerForm.subtitle,
        imageUrl: bannerForm.imageUrl,
        bg: bannerForm.bg || "linear-gradient(135deg, #1e3a8a, #0f172a)",
        categoryId: bannerForm.categoryId ? parseInt(bannerForm.categoryId, 10) : null,
      };

      if (editingBanner) {
        await api.put(`/banners/${editingBanner.id}`, payload);
        showAlert("success", "Banner updated successfully!");
      } else {
        await api.post("/banners", payload);
        showAlert("success", "Banner created successfully!");
      }
      setShowBannerModal(false);
      setEditingBanner(null);
      setBannerForm({
        badge: "",
        title: "",
        subtitle: "",
        imageUrl: "",
        bg: "",
        categoryId: "",
      });
      fetchData();
    } catch (err) {
      console.error(err);
      showAlert("danger", err.response?.data?.message || "Failed to save banner.");
    }
  };

  const handleEditBanner = (banner) => {
    setEditingBanner(banner);
    setBannerForm({
      badge: banner.badge || "",
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl || "",
      bg: banner.bg || "",
      categoryId: banner.categoryId || "",
    });
    setShowBannerModal(true);
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    try {
      await api.delete(`/banners/${bannerId}`);
      showAlert("success", "Banner deleted successfully!");
      fetchData();
    } catch (err) {
      console.error(err);
      showAlert("danger", "Failed to delete banner.");
    }
  };



  // Update order status handler
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

  // Upload (Submit/Publish) Draft Order handler
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
        <h1 className="admin-dashboard-title">📊 Admin Dashboard</h1>
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
              setSelectedFile(null);
              setImagePreview("");
              setShowProductModal(true);
            }}
          >
            ➕ Add Product
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

      {/* 4 Status Summary Cards */}
      <div className="admin-stats-grid">
        <div className="dashboard-stat-card blue">
          <div className="stat-card-content">
            <div>
              <span className="stat-card-label">Orders</span>
              <div className="stat-card-value">{stats.totalOrders}</div>
            </div>
            <span style={{ fontSize: "2.5rem" }}>📦</span>
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
            <span style={{ fontSize: "2.5rem" }}>👥</span>
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
            <span style={{ fontSize: "2.5rem" }}>📁</span>
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
            <span style={{ fontSize: "2.5rem" }}>⚠️</span>
          </div>
          <button className="stat-card-footer" onClick={() => setActiveTab("products")}>
            <span>View All</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Intermediate rows: Pending List & Recent Buyers */}
      {activeTab === "overview" && (
        <div className="dashboard-intermediate-row">
          <div className="dashboard-panel">
            <h3 className="dashboard-panel-title">Currently Pending</h3>
            <div className="pending-list">
              <div className="pending-item">
                <span className="pending-item-label">Pending Orders</span>
                <span className="pending-item-value">{stats.pendingOrders}</span>
              </div>
              <div className="pending-item">
                <span className="pending-item-label">Draft Products (Unpublished)</span>
                <span className="pending-item-value">{stats.draftProducts}</span>
              </div>
              <div className="pending-item">
                <span className="pending-item-label">Out of Stock Products</span>
                <span className="pending-item-value">{stats.outOfStock}</span>
              </div>
              <div className="pending-item">
                <span className="pending-item-label">Return/Exchange Requests (Mock)</span>
                <span className="pending-item-value">27</span>
              </div>
              <div className="pending-item">
                <span className="pending-item-label">Abandoned Carts (Mocked)</span>
                <span className="pending-item-value">45</span>
              </div>
            </div>
          </div>

          <div className="dashboard-panel">
            <h3 className="dashboard-panel-title">Recent Buyers (Top Spent)</h3>
            <div className="recent-buyers-list">
              {recentBuyers.length === 0 ? (
                <p style={{ color: "var(--text)", fontStyle: "italic" }}>No buyers data available yet.</p>
              ) : (
                recentBuyers.map((buyer) => (
                  <div key={buyer.id} className="recent-buyer-card">
                    <div className="buyer-info">
                      <div className="buyer-avatar">
                        {buyer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="buyer-details">
                        <span className="buyer-name">{buyer.name}</span>
                        <span className="buyer-email">{buyer.email}</span>
                      </div>
                    </div>
                    <span className="buyer-spent">INR {buyer.totalSpent.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Administration Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("products");
            setProductFilter("all");
          }}
        >
          🏷️ Products
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          📦 Orders
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "customers" ? "active" : ""}`}
          onClick={() => setActiveTab("customers")}
        >
          👥 Customers
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "banners" ? "active" : ""}`}
          onClick={() => setActiveTab("banners")}
        >
          📁 Banners
        </button>
      </div>


      {activeTab === "products" && (
        <div>
          {/* Sub-tab filter buttons for products */}
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

      {activeTab === "banners" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, color: "var(--text-h)" }}>Banner Advertisements ({banners.length})</h3>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingBanner(null);
                setBannerForm({
                  badge: "",
                  title: "",
                  subtitle: "",
                  imageUrl: "",
                  bg: "",
                  categoryId: "",
                });
                setShowBannerModal(true);
              }}
            >
              ➕ Add Banner
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image Preview</th>
                  <th>Title / Subtitle</th>
                  <th>Badge</th>
                  <th>Target Category</th>
                  <th>Background</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "24px", fontStyle: "italic", color: "var(--text)" }}>
                      No banners found in database. The storefront will fall back to mock banners.
                    </td>
                  </tr>
                ) : (
                  banners.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border)" }}
                        />
                      </td>
                      <td style={{ fontWeight: "600", color: "var(--text-h)" }}>
                        <div>{b.title}</div>
                        <div style={{ fontSize: "0.8rem", fontWeight: "normal", color: "var(--text)", marginTop: "4px" }}>{b.subtitle}</div>
                      </td>
                      <td>
                        {b.badge ? <span className="badge-status completed" style={{ fontSize: "0.7rem" }}>{b.badge}</span> : <span style={{ color: "var(--text)", fontStyle: "italic" }}>None</span>}
                      </td>
                      <td style={{ fontWeight: "500" }}>
                        {b.Category?.name || "None (General Banner)"}
                      </td>
                      <td style={{ fontSize: "0.8rem", fontFamily: "monospace", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={b.bg}>
                        <div style={{ display: "inline-block", width: "16px", height: "16px", borderRadius: "4px", background: b.bg || "#1e3a8a", marginRight: "6px", verticalAlign: "middle", border: "1px solid var(--border)" }} />
                        {b.bg || "default gradient"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                            onClick={() => handleEditBanner(b)}
                          >
                             Edit
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "6px 10px", fontSize: "0.8rem", color: "var(--danger)" }}
                            onClick={() => handleDeleteBanner(b.id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}

      {showProductModal && (
        <div className="admin-form-modal">
          <div className="admin-modal-content">
            <h3 className="admin-modal-title">
              {editingProduct ? " Edit Product" : " Add New Product"}
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
                  <option value="Others">Others</option>
                </select>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label className="review-form-label">Product Image</label>
                <div className="image-input-container" style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", background: "var(--card-bg)" }}>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px dashed var(--border)",
                        borderRadius: "8px",
                        padding: "24px",
                        cursor: "pointer",
                        textAlign: "center"
                      }}
                      onClick={() => document.getElementById("product-image-file").click()}
                    >
                      <input
                        type="file"
                        id="product-image-file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                      />
                      <span style={{ fontSize: "2rem", marginBottom: "8px" }}>📁</span>
                      <span style={{ fontSize: "0.9rem", color: "var(--text)" }}>Click to select an image file</span>
                      {selectedFile && (
                        <span style={{ fontSize: "0.8rem", color: "var(--success)", marginTop: "4px", wordBreak: "break-all" }}>
                          Selected: {selectedFile.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {imagePreview && (
                    <div style={{ marginTop: "16px", textAlign: "center" }}>
                      <p style={{ fontSize: "0.8rem", color: "var(--text)", marginBottom: "8px" }}>Image Preview</p>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ maxWidth: "100%", maxHeight: "150px", objectFit: "contain", borderRadius: "8px", border: "1px solid var(--border)" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
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

      {/* Banner Edit / Add Modal */}
      {showBannerModal && (
        <div className="admin-form-modal">
          <div className="admin-modal-content" style={{ maxWidth: "550px" }}>
            <h3 className="admin-modal-title">{editingBanner ? " Edit Banner" : " Add New Banner"}</h3>
            <form onSubmit={handleBannerSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label className="review-form-label">Banner Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Up to 70% off Headphones"
                  className="search-input"
                  style={{ width: "100%", paddingLeft: "12px" }}
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label className="review-form-label">Badge Label (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Limited time offer, Deal of the Day"
                  className="search-input"
                  style={{ width: "100%", paddingLeft: "12px" }}
                  value={bannerForm.badge}
                  onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label className="review-form-label">Subtitle Description (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Upgrade your sound with high performance gear"
                  className="search-input"
                  style={{ width: "100%", paddingLeft: "12px" }}
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label className="review-form-label">Background Image URL</label>
                <input
                  type="url"
                  required
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  className="search-input"
                  style={{ width: "100%", paddingLeft: "12px" }}
                  value={bannerForm.imageUrl}
                  onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label className="review-form-label">Background Color / Gradient (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. #1e3a8a or linear-gradient(135deg, #1e3a8a, #0f172a)"
                  className="search-input"
                  style={{ width: "100%", paddingLeft: "12px" }}
                  value={bannerForm.bg}
                  onChange={(e) => setBannerForm({ ...bannerForm, bg: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label className="review-form-label">Target Category Filter (optional)</label>
                <select
                  className="review-select"
                  value={bannerForm.categoryId}
                  onChange={(e) => setBannerForm({ ...bannerForm, categoryId: e.target.value })}
                >
                  <option value="">-- No Category Target (General Banner) --</option>
                  {Array.from(new Set(products.map(p => p.Category?.name || p.category))).filter(Boolean).map(catName => {
                    const prod = products.find(p => p.Category?.name === catName || p.category === catName);
                    const catId = prod?.Category?.id || prod?.categoryId || "";
                    return (
                      <option key={catName} value={catId}>
                        {catName}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Banner
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowBannerModal(false)}
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