import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { totalItems } = useCart();
  const { wishlist } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">E-Commerce App</Link>
      </div>
      <div className="navbar-links">
        {isAuthenticated && user?.role !== "admin" ? (
          <>
            <Link to="/" className={location.pathname === "/" ? "active" : ""}>
              Home
            </Link>
            <Link to="/wishlist" className={location.pathname === "/wishlist" ? "active" : ""}>
              Wishlist{" "}
              {wishlist.length > 0 && (
                <span className="badge wishlist-badge">{wishlist.length}</span>
              )}
            </Link>
            <Link to="/cart" className={location.pathname === "/cart" ? "active" : ""}>
              Cart{" "}
              {totalItems > 0 && <span className="badge cart-badge">{totalItems}</span>}
            </Link>
            <Link to="/my-orders" className={location.pathname === "/my-orders" ? "active" : ""}>
              My Orders
            </Link>
          </>
        ) : (
          <>
          {/* empty navbar */}
          </>
        )}
      </div>

      <div className="navbar-actions">
        {isAuthenticated && user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginRight: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent-bg)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  border: "1px solid var(--border)",
                }}
                title={`${user.name} (${user.role})`}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  color: "var(--text-h)",
                }}
              >
                {user.name}
              </span>
            </div>
            <button
              className="btn btn-secondary"
              onClick={handleLogout}
              style={{ padding: "6px 12px" }}
            >
              Logout
            </button>
          </div>
        )}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title="Toggle Dark/Light Mode"
        >
          {theme === "light" ? "Dark" : " Light"}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;