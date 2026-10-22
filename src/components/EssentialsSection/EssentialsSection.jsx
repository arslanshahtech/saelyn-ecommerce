import SectionHeading from "../SectionHeading";
import ProductGrid from "../ProductGrid/ProductGrid";
import { useProducts } from "../../context/ProductsContext";
import "./EssentialsSection.css";

export default function EssentialsSection() {
  const { products, productsLoading, productsError, refreshProducts } = useProducts();
  // Original homepage Essentials collection is separate from the 12 New In items.
  // These four products are seeded into MongoDB as their own catalog records.
  const curatedNames = ["The Essential Tee", "Soft Structure Shirt", "Tailored Trouser", "Everyday Carryall"];
  const essentials = curatedNames
    .map((name) => products.find((product) => product.name === name))
    .filter(Boolean);
  return (
    <section className="section-shell product-section" id="essentials">
      <SectionHeading eyebrow="Considered staples" title="The essentials" link="Shop essentials" href="/shop?collection=essentials" />
      {productsLoading ? <p role="status">Loading essentials...</p>
        : productsError ? <div role="alert"><p>Essentials filhal load nahi ho rahe.</p><button type="button" onClick={refreshProducts}>Try Again</button></div>
        : essentials.length ? <ProductGrid items={essentials.slice(0, 4)} />
        : <p>No essentials available yet.</p>}
    </section>
  );
}
