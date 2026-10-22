import ProductGrid from "../ProductGrid/ProductGrid";
import SectionHeading from "../SectionHeading";
import { useProducts } from "../../context/ProductsContext";
import "./NewInSection.css";

export default function NewInSection() {
  const { products, productsLoading, productsError, refreshProducts } = useProducts();
  // Keep the original 12 New In items separate from the four Essentials items.
  const newInProducts = products.filter((product) => product.merchandisingCollection !== "essentials");
  return (
    <section className="section-shell product-section" id="new-in">
      <SectionHeading eyebrow="Just arrived" title="New in" link="View all" href="/shop?collection=new-in" />
      {productsLoading ? <p role="status">Loading products...</p>
        : productsError ? <div role="alert"><p>Products filhal load nahi ho rahe.</p><button type="button" onClick={refreshProducts}>Try Again</button></div>
        : newInProducts.length ? <ProductGrid items={newInProducts} />
        : <p>No products available yet.</p>}
    </section>
  );
}
