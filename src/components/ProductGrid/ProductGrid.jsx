import ProductCard from "../ProductCard/ProductCard.jsx";
import './ProductGrid.css'
export default function ProductGrid({ items }) {
  return (
    <div className="product-grid">
      {items.map((p) => (
        <ProductCard product={p} key={p.id} />
      ))}
    </div>
  );
}
