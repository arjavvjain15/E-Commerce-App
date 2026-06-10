import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import ProductCard from "../components/ProductCard";


const BANNERS = [
  {
    id: 1,
    badge: "Limited time offer",
    title: "Up to 70% off Bestselling Audio",
    subtitle: "Upgrade your sound with headphones, earbuds, and speakers",
    bg: "#1e3a8a",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
  },
  {
    id: 2,
    badge: "Power & Performance",
    title: "Up to 40% off Flagship Laptops",
    subtitle: "High performance laptops for productivity, gaming, and design",
    bg: "grey",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60",
  },
  {
    id: 3,
    badge: "Next-Gen Tech",
    title: "Ultimate Smartphone Deals",
    subtitle: "Get the latest smartphones with exchange offers and no-cost EMI",
    bg: "#f97316",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60",
  },
];

const CATEGORY_PROMOS = [
  {
    category: "Laptop",
    title: "High-Performance Laptops",
    linkText: "Shop Laptops",
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400",
  },
  {
    category: "Mobile",
    title: "Latest Smartphones",
    linkText: "Explore Mobiles",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400",
  },
  {
    category: "Audio",
    title: "Noise-Cancelling Audio",
    linkText: "Upgrade Audio",
    image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400",
  },
  {
    category: "Accessories",
    title: "Premium Tech Accessories",
    linkText: "View Accessories",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400",
  },
];


function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        const items = res.data.map((product) => ({
          id: product.id,
          title: product.name,
          description: product.description,
          price: Number(product.price),
          category: product.Category?.name || "Uncategorized",
          image: product.imageUrl,
          rating: "4.5",
          stock: product.stock,
        }));
        setProducts(items);
      } catch (err) {
        console.error("Failed to load products from API", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
  };

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.title.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 ? true : selectedCategories.includes(product.category);

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategories]);

  const dealsProducts = useMemo(() => {
    return products.slice(0, 6);
  }, [products]);


  if (loading) {
    return (
      <div className="home-container" style={{ textAlign: "center", padding: "40px" }}>
        <h3>Loading products...</h3>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div
        className="banner-carousel"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="carousel-track">
          {BANNERS.map((banner, index) => (
            <div
              key={banner.id}
              className={`carousel-slide ${index === currentSlide ? "active" : ""}`}
              style={{ background: banner.bg }}
            >
              <div className="slide-info">
                <span className="slide-badge">{banner.badge}</span>
                <h2 className="slide-title">{banner.title}</h2>
                <p className="slide-subtitle">{banner.subtitle}</p>
              </div>
              <div className="slide-image-wrapper">
                <img src={banner.image} alt={banner.title} className="slide-image" />
              </div>
            </div>
          ))}
        </div>

        <button className="carousel-arrow prev" onClick={prevSlide} aria-label="Previous Slide">
          ‹
        </button>
        <button className="carousel-arrow next" onClick={nextSlide} aria-label="Next Slide">
          ›
        </button>

        <div className="carousel-dots">
          {BANNERS.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      <div className="filters-bar" style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", width: "100%", marginBottom: "24px" }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: "280px" }}>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            style={{ paddingLeft: "16px", width: "100%" }}
          />
        </div>

        <div className="categories-filter" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            className={`btn ${selectedCategories.length === 0 ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setSelectedCategories([])}
            style={{ borderRadius: "20px", padding: "8px 16px" }}
          >
            All
          </button>
          {["Laptop", "Mobile", "Audio", "Accessories"].map((cat) => {
            const isSelected = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                className={`btn ${isSelected ? "btn-primary" : "btn-secondary"}`}
                onClick={() => toggleCategory(cat)}
                style={{ borderRadius: "20px", padding: "8px 16px" }}
              >
                {cat}s
              </button>
            );
          })}
        </div>
      </div>

      <div className="amazon-category-grid">
        {CATEGORY_PROMOS.map((promo) => (
          <div 
            key={promo.category} 
            className="category-promo-card"
            onClick={() => {
              setSelectedCategories([promo.category]);
              document.getElementById("main-catalog")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <h3>{promo.title}</h3>
            <div className="promo-img-wrapper">
              <img src={promo.image} alt={promo.title} />
            </div>
            <span className="promo-link">{promo.linkText}</span>
          </div>
        ))}
      </div>


      <div id="main-catalog" style={{ scrollMarginTop: "20px", marginTop: "32px" }}>
        <h2 className="main-catalog-title">Explore</h2>
      </div>


      {filteredProducts.length === 0 ? (
        <div className="no-results">
          <h3>No products match your search.</h3>
          <p>Try clearing your search or changing the category filter.</p>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearch("");
              setSelectedCategories([]);
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;