import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Navbar from "./components/Navbar";
import ProductDetails from "./pages/ProductDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import MyOrders from "./pages/MyOrders";
import { useTheme } from "./context/ThemeContext";
import { useAuth } from "./context/AuthContext";
import Footer from "./components/Footer";
import ChatBot from "./components/ChatBot";

function App() {
  const { theme } = useTheme();
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className={`app-wrapper ${theme}`} style={{ justifyContent: "center", alignItems: "center" }}>
        <h3>Loading session...</h3>
      </div>
    );
  }

  return (
    <div className={`app-wrapper ${theme}`}>
      <BrowserRouter>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={isAuthenticated ? (user?.role === "admin" ? <Navigate to="/admin" /> : <Home />) : <Navigate to="/login" />} />
            <Route path="/product/:id" element={isAuthenticated ? (user?.role === "admin" ? <Navigate to="/admin" /> : <ProductDetails />) : <Navigate to="/login" />} />
            <Route path="/login" element={!isAuthenticated ? <Login /> : (user?.role === "admin" ? <Navigate to="/admin" /> : <Navigate to="/" />)} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
            <Route path="/cart" element={isAuthenticated ? <Cart /> : <Navigate to="/login" />} />
            <Route path="/wishlist" element={isAuthenticated ? <Wishlist /> : <Navigate to="/login" />} />
            <Route path="/my-orders" element={isAuthenticated ? <MyOrders /> : <Navigate to="/login" />} />
            <Route path="/admin" element={isAuthenticated && user?.role === "admin" ? <Admin /> : <Navigate to="/" />} />
          </Routes>
        </main>
        {isAuthenticated&& user?.role!=="admin"&& <ChatBot/>}
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;