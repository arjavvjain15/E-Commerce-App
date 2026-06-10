import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data?.user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "40px auto",
        padding: "24px",
        backgroundColor: "var(--card-bg)",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "24px" }}>Log In</h2>
      {error && (
        <div
          style={{
            backgroundColor: "var(--danger-bg)",
            color: "var(--danger)",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "16px",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              color: "var(--text-h)",
            }}
          >
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="search-input"
            style={{ paddingLeft: "16px" }}
            placeholder="Enter your email"
          />
        </div>
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              color: "var(--text-h)",
            }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="search-input"
            style={{ paddingLeft: "16px" }}
            placeholder="Enter your password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-full"
          style={{ marginBottom: "16px" }}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
      <button
        onClick={googleLogin}
        className="btn btn-secondary btn-full"
        style={{ marginBottom: "20px" }}
      >
        Log In with Google
      </button>
      <p style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text)" }}>
        Don't have an account?{" "}
        <Link to="/register" style={{ color: "var(--accent)", fontWeight: "600" }}>
          Register
        </Link>
      </p>
    </div>
  );
}

export default Login;
