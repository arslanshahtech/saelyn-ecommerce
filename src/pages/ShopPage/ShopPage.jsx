import { useEffect, useMemo, useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ProductGrid from "../../components/ProductGrid/ProductGrid";
import FilterPanel from "../../components/FilterPanel/FilterPanel";
import { useProducts } from "../../context/ProductsContext";
import { getProducts } from "../../api/products";
import "./ShopPage.css";

const categories = ["All", "Clothing", "Bags", "Essentials"];

export default function ShopPage() {
  const { products: allProducts, productsLoading, productsError } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
  const [selectedCollection, setSelectedCollection] = useState(searchParams.get("collection") || "");
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [sortOption, setSortOption] = useState("featured");
  const [serverProducts, setServerProducts] = useState([]);
  const [requestLoading, setRequestLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [selectedMinPrice, setSelectedMinPrice] = useState(null);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(null);

  const prices = allProducts.map((product) => product.numericPrice).filter(Number.isFinite);
  const minPrice = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const maxPrice = prices.length ? Math.ceil(Math.max(...prices)) : 500;
  const effectiveMinPrice = selectedMinPrice ?? minPrice;
  const effectiveMaxPrice = selectedMaxPrice ?? maxPrice;

  const colorOptions = useMemo(() => [...new Set(allProducts.flatMap((product) => product.colors || []))], [allProducts]);
  const sizeOptions = useMemo(() => [...new Set(allProducts.flatMap((product) => product.sizes || []))], [allProducts]);
  const materialOptions = useMemo(() => [...new Set(allProducts.map((product) => product.material).filter(Boolean))], [allProducts]);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    const categoryFromUrl = searchParams.get("category");
    setSelectedCategory(categoryFromUrl && categories.includes(categoryFromUrl) ? categoryFromUrl : "All");
    const collectionFromUrl = searchParams.get("collection");
    setSelectedCollection(collectionFromUrl === "essentials" || collectionFromUrl === "new-in" ? collectionFromUrl : "");
  }, [searchParams]);

  useEffect(() => {
    if (!prices.length) return;
    setSelectedMinPrice((current) => current === null ? minPrice : Math.max(minPrice, current));
    setSelectedMaxPrice((current) => current === null ? maxPrice : Math.min(maxPrice, current));
  }, [minPrice, maxPrice, prices.length]);

  useEffect(() => {
    // Pehle shared catalog load hone dein; warna initial empty state se
    // request race ho sakti hai aur Shop count 0 par reh sakta hai.
    if (productsLoading) return;

    let active = true;
    const timer = setTimeout(() => {
      setRequestLoading(true);
      setRequestError("");
      const params = {
        search: searchQuery.trim(),
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        collection: selectedCollection || undefined,
        minPrice: effectiveMinPrice > minPrice ? effectiveMinPrice : undefined,
        maxPrice: effectiveMaxPrice < maxPrice ? effectiveMaxPrice : undefined,
        color: selectedColors,
        size: selectedSizes,
        material: selectedMaterials,
        sort: sortOption,
      };
      getProducts(params)
        .then((items) => { if (active) setServerProducts(items); })
        .catch((error) => { if (active) setRequestError(error.message || "Products load nahi ho sake."); })
        .finally(() => { if (active) setRequestLoading(false); });
    }, searchQuery.trim() ? 250 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [productsLoading, searchQuery, selectedCategory, selectedCollection, selectedColors, selectedSizes, selectedMaterials, effectiveMinPrice, effectiveMaxPrice, minPrice, maxPrice, sortOption]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchQuery(value);
    const next = {};
    if (value.trim()) next.q = value;
    if (selectedCategory !== "All") next.category = selectedCategory;
    if (selectedCollection) next.collection = selectedCollection;
    setSearchParams(next, { replace: true });
  };

  const clearSearch = () => {
    setSearchQuery("");
    const next = {};
    if (selectedCategory !== "All") next.category = selectedCategory;
    if (selectedCollection) next.collection = selectedCollection;
    setSearchParams(next, { replace: true });
  };

  const handleApplyFilters = ({ category, colors, sizes, materials, minPrice: nextMin, maxPrice: nextMax }) => {
    setSelectedCategory(category);
    setSelectedColors(colors);
    setSelectedSizes(sizes);
    setSelectedMaterials(materials);
    setSelectedCollection("");
    setSelectedMinPrice(nextMin);
    setSelectedMaxPrice(nextMax);
    const next = {};
    if (searchQuery.trim()) next.q = searchQuery.trim();
    if (category !== "All") next.category = category;
    setSearchParams(next, { replace: true });
  };

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedMaterials([]);
    setSelectedMinPrice(minPrice);
    setSelectedMaxPrice(maxPrice);
    const next = searchQuery.trim() ? { q: searchQuery.trim() } : {};
    if (selectedCollection) next.collection = selectedCollection;
    setSearchParams(next, { replace: true });
  };

  const activeFilterCount = (selectedCategory !== "All" ? 1 : 0) + selectedColors.length + selectedSizes.length + selectedMaterials.length + (effectiveMinPrice > minPrice || effectiveMaxPrice < maxPrice ? 1 : 0);
  const getColorLabel = (color) => ({ "#171717": "Black", "#F4F0E8": "Ivory", "#C8C0B5": "Stone", "#FFFFFF": "White", "#FFF": "White" }[color.toUpperCase()] || color);

  const removeColorFilter = (color) => setSelectedColors((items) => items.filter((item) => item !== color));
  const removeSizeFilter = (size) => setSelectedSizes((items) => items.filter((item) => item !== size));
  const removeMaterialFilter = (material) => setSelectedMaterials((items) => items.filter((item) => item !== material));

  return (
    <main className="shop-page">
      <section className="shop-page__header">
        <p className="eyebrow">SAELYN COLLECTION</p>
        <h1>All Products</h1>
        <p className="shop-page__count">{serverProducts.length} {serverProducts.length === 1 ? "Product" : "Products"}</p>
      </section>

      <section className="shop-page__search">
        <div className="shop-search">
          <Search aria-hidden="true" />
          <input type="search" value={searchQuery} onChange={handleSearchChange} placeholder="Search products..." aria-label="Search products" />
          {searchQuery && <button type="button" onClick={clearSearch} aria-label="Clear search"><X /></button>}
        </div>
      </section>

      {activeFilterCount > 0 && (
        <section className="shop-page__active-filters">
          <div className="shop-page__active-heading"><span>Active Filters</span><button type="button" onClick={handleResetFilters}>Clear All</button></div>
          <div className="shop-page__filter-chips">
            {selectedCategory !== "All" && <button className="filter-chip" type="button" onClick={() => setSelectedCategory("All")}>{selectedCategory}<X /></button>}
            {selectedColors.map((color) => <button key={color} className="filter-chip" type="button" onClick={() => removeColorFilter(color)}>{getColorLabel(color)}<X /></button>)}
            {selectedSizes.map((size) => <button key={size} className="filter-chip" type="button" onClick={() => removeSizeFilter(size)}>Size: {size}<X /></button>)}
            {selectedMaterials.map((material) => <button key={material} className="filter-chip" type="button" onClick={() => removeMaterialFilter(material)}>{material}<X /></button>)}
            {(effectiveMinPrice > minPrice || effectiveMaxPrice < maxPrice) && <button className="filter-chip" type="button" onClick={() => { setSelectedMinPrice(minPrice); setSelectedMaxPrice(maxPrice); }}>${effectiveMinPrice} — ${effectiveMaxPrice}<X /></button>}
          </div>
        </section>
      )}

      <section className="shop-page__controls">
        <button type="button" className={`shop-filter-trigger ${activeFilterCount > 0 ? "active" : ""}`} onClick={() => setIsFilterOpen(true)}>
          <SlidersHorizontal /><span>Filters</span>{activeFilterCount > 0 && <span className="shop-filter-trigger__count">{activeFilterCount}</span>}
        </button>
        <div className="shop-page__sort">
          <label htmlFor="sort-products">Sort by</label>
          <select id="sort-products" value={sortOption} onChange={(event) => setSortOption(event.target.value)}>
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </section>

      <section className="shop-page__products" aria-live="polite">
        {(productsLoading || requestLoading) ? <p role="status">Loading products...</p>
          : (productsError || requestError) ? <div className="shop-page__no-results"><p>{requestError || productsError}</p><button type="button" onClick={() => window.location.reload()}>Try Again</button></div>
          : serverProducts.length ? <ProductGrid items={serverProducts} />
          : <div className="shop-page__no-results"><p>No products found.</p><button type="button" onClick={() => { clearSearch(); handleResetFilters(); }}>Clear Search &amp; Filters</button></div>}
      </section>

      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categories}
        colors={colorOptions}
        sizes={sizeOptions}
        materials={materialOptions}
        selectedCategory={selectedCategory}
        selectedColors={selectedColors}
        selectedSizes={selectedSizes}
        selectedMaterials={selectedMaterials}
        minPrice={minPrice}
        maxPrice={maxPrice}
        appliedMinPrice={effectiveMinPrice}
        appliedMaxPrice={effectiveMaxPrice}
        availableProducts={allProducts}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </main>
  );
}
