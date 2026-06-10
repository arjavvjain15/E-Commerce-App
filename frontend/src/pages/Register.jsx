import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);
    try {
      await register(name, email, password);
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
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
      <h2 style={{ textAlign: "center", marginBottom: "24px" }}>Register</h2>
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
      {success && (
        <div
          style={{
            backgroundColor: "var(--accent-bg)",
            color: "var(--accent)",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "16px",
            fontSize: "0.9rem",
          }}
        >
          {success}
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
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="search-input"
            style={{ paddingLeft: "16px" }}
            placeholder="Enter your name"
          />
        </div>
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
        <div style={{ marginBottom: "16px" }}>
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
            placeholder="Choose a password"
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
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="search-input"
            style={{ paddingLeft: "16px" }}
            placeholder="Confirm password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-full"
          style={{ marginBottom: "16px" }}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text)" }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "var(--accent)", fontWeight: "600" }}>
          Log In
        </Link>
      </p>
    </div>
  );
}

export default Register;
