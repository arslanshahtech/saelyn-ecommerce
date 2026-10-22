import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, ArrowRight } from "lucide-react";

import { getProducts } from "../../api/products";

import "./SearchOverlay.css";

export default function SearchOverlay({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const searchInputRef = useRef(null);

  const navigate = useNavigate();


  // =========================
  // OPEN SEARCH
  // =========================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Search input automatically focus hoga
    searchInputRef.current?.focus();


    // Background page ki scrolling temporarily disable
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";


    // ESC key se search close
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);


    // Cleanup
    return () => {
      document.body.style.overflow = previousOverflow;

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isOpen, onClose]);


  // =========================
  // SEARCH PRODUCTS
  // =========================

  const query = searchQuery.trim();

  useEffect(() => {
    let active = true;
    if (!query) {
      setSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
      return () => { active = false; };
    }
    const timer = setTimeout(() => {
      setSearchLoading(true);
      setSearchError("");
      getProducts({ search: query })
        .then((items) => { if (active) setSearchResults(items); })
        .catch((error) => {
          if (!active) return;
          setSearchResults([]);
          setSearchError(error.message || "Search filhal available nahi.");
        })
        .finally(() => { if (active) setSearchLoading(false); });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [query]);

  // Sirf first 4 preview results
  const previewResults = searchResults.slice(0, 4);


  // =========================
  // QUICK SEARCH
  // =========================

  const quickSearches = [
    "Shirts",
    "Bags",
    "Essentials",
  ];


  const handleQuickSearch = (value) => {
    setSearchQuery(value);
    searchInputRef.current?.focus();
  };


  // =========================
  // VIEW ALL RESULTS
  // =========================

  const handleViewAllResults = () => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      navigate("/shop");
      onClose();
      return;
    }

    navigate(
      `/shop?q=${encodeURIComponent(trimmedQuery)}`
    );

    onClose();
  };


  // =========================
  // CLEAR SEARCH
  // =========================

  const handleClearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };


  // Overlay closed ho to kuch render nahi
  if (!isOpen) {
    return null;
  }


  return (
    <div
      className="search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Product search"
    >

      {/* =========================
          BACKDROP
      ========================= */}

      <button
        className="search-overlay__backdrop"
        type="button"
        aria-label="Close search"
        onClick={onClose}
      />


      {/* =========================
          SEARCH PANEL
      ========================= */}

      <div className="search-overlay__panel">


        {/* =========================
            HEADER
        ========================= */}

        <div className="search-overlay__header">

          <p className="search-overlay__eyebrow">
            SEARCH
          </p>

          <button
            type="button"
            className="search-overlay__close"
            onClick={onClose}
            aria-label="Close search"
          >
            <X />
          </button>

        </div>


        {/* =========================
            SEARCH INPUT
        ========================= */}

        <div className="search-overlay__input-wrap">

          <Search
            className="search-overlay__search-icon"
            aria-hidden="true"
          />

          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            placeholder="Search products, categories..."
            aria-label="Search products"
            autoComplete="off"
            spellCheck="false"
          />


          {searchQuery && (
            <button
              type="button"
              className="search-overlay__clear"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <X />
            </button>
          )}

        </div>


        {/* =========================
            SEARCH CONTENT
        ========================= */}

        <div className="search-overlay__content">


          {/* =========================
              EMPTY SEARCH
          ========================= */}

          {!query && (
            <div className="search-overlay__quick">

              <p className="search-overlay__label">
                QUICK SEARCH
              </p>

              <div className="search-overlay__quick-list">

                {quickSearches.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className="search-overlay__quick-item"
                    onClick={() =>
                      handleQuickSearch(item)
                    }
                  >
                    <span>{item}</span>
                    <ArrowRight />
                  </button>
                ))}

              </div>

            </div>
          )}


          {/* =========================
              RESULTS
          ========================= */}

          {query && (
            <div className="search-overlay__results">

              <div className="search-overlay__results-heading">

                <p className="search-overlay__label">
                  RESULTS
                </p>

                <span>
                  {searchResults.length}{" "}
                  {searchResults.length === 1
                    ? "item"
                    : "items"}
                </span>

              </div>


              {/* Results exist */}

              {searchLoading ? (
                <p role="status">Searching products...</p>
              ) : searchError ? (
                <p role="alert">{searchError}</p>
              ) : previewResults.length > 0 ? (

                <div className="search-overlay__product-list">

                  {previewResults.map((product) => (

                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="search-overlay__product"
                      onClick={onClose}
                    >

                      <div className="search-overlay__product-image">

                        <img
                          src={product.image}
                          alt={product.name}
                        />

                      </div>


                      <div className="search-overlay__product-info">

                        <p>
                          {product.category}
                        </p>

                        <h3>
                          {product.name}
                        </h3>

                        <span>
                          {product.price}
                        </span>

                      </div>

                      <ArrowRight
                        className="search-overlay__product-arrow"
                        aria-hidden="true"
                      />

                    </Link>

                  ))}

                </div>

              ) : (

                /* No Results */

                <div className="search-overlay__no-results">

                  <p>
                    No products found for{" "}
                    <strong>
                      “{searchQuery}”
                    </strong>
                  </p>

                  <button
                    type="button"
                    onClick={handleClearSearch}
                  >
                    Clear Search
                  </button>

                </div>

              )}


              {/* View All Results */}

              {searchResults.length > 0 && (
                <button
                  type="button"
                  className="search-overlay__view-all"
                  onClick={handleViewAllResults}
                >
                  <span>
                    View All Results
                  </span>

                  <ArrowRight />
                </button>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}