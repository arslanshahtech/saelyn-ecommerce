import SectionHeading from "../SectionHeading";
import ProductGrid from "../ProductGrid/ProductGrid";
import { useProducts } from "../../context/ProductsContext";
import "./EssentialsSection.css";

export default function EssentialsSection() {
  const { products, productsLoading, productsError, refreshProducts } = useProducts();
  // Home page par pehle se curated 4 essentials items ko API catalog se map karte hain.
  // Kuch wardrobe staples database mein Clothing/Bags category mein hain, is liye sirf
  // category === "Essentials" filter karne se section mein sirf 2 cards reh jate thay.
  const curatedNames = ["Relaxed Cotton Tee", "Minimal Knit Top", "Tailored Straight Trouser", "Soft Leather Tote"];
  const curatedEssentials = curatedNames.map((name) => products.find((product) => product.name === name)).filter(Boolean);
  const essentials = curatedEssentials.length === curatedNames.length
    ? curatedEssentials
    : [...curatedEssentials, ...products.filter((product) => product.category === "Essentials" && !curatedEssentials.some((item) => item.id === product.id))].slice(0, 4);
  return (
    <section className="section-shell product-section" id="essentials">
      <SectionHeading eyebrow="Considered staples" title="The essentials" link="Shop essentials" href="/shop?category=Essentials" />
      {productsLoading ? <p role="status">Loading essentials...</p>
        : productsError ? <div role="alert"><p>Essentials filhal load nahi ho rahe.</p><button type="button" onClick={refreshProducts}>Try Again</button></div>
        : essentials.length ? <ProductGrid items={essentials.slice(0, 4)} />
        : <p>No essentials available yet.</p>}
    </section>
  );
}
