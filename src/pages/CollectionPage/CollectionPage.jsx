import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductGrid from "../../components/ProductGrid/ProductGrid";
import { getProducts } from "../../api/products";
import "./CollectionPage.css";

const collectionConfig = {
  "new-in": { eyebrow: "Just arrived", title: "New in", description: "Fresh silhouettes and considered pieces for the modern wardrobe.", params: { collection: "new-in" } },
  essentials: { eyebrow: "The foundation", title: "Essentials", description: "Everyday staples, thoughtfully selected and made to work together.", params: { collection: "essentials" } },
  accessories: { eyebrow: "Finishing touches", title: "Accessories", description: "Carry-everywhere bags and understated finishing touches.", params: { category: "Bags" } },
  collections: { eyebrow: "The SAELYN edit", title: "Collections", description: "Explore the pieces and edits that define the SAELYN wardrobe.", params: {} },
  sale: { eyebrow: "The considered edit", title: "Sale", description: "Selected pieces will appear here when sale pricing is available.", params: {}, saleOnly: true },
};

export default function CollectionPage() {
  const { slug = "collections" } = useParams();
  const config = collectionConfig[slug] || collectionConfig.collections;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    // Sale items need genuine sale pricing; never label full-price items as discounted.
    if (config.saleOnly) {
      setProducts([]);
      setLoading(false);
      return () => { active = false; };
    }
    getProducts(config.params)
      .then((items) => { if (active) setProducts(items); })
      .catch((err) => { if (active) setError(err.message || "Products load nahi ho sake."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const countLabel = useMemo(() => `${products.length} ${products.length === 1 ? "piece" : "pieces"}`, [products.length]);

  return (
    <main className="collection-page">
      <section className="collection-hero">
        <p className="eyebrow">{config.eyebrow}</p>
        <h1>{config.title}</h1>
        <p className="collection-hero__description">{config.description}</p>
        <span className="collection-hero__count">{!loading && !error && !config.saleOnly ? countLabel : "SAELYN / Modern wardrobe"}</span>
      </section>
      <nav className="collection-shortcuts" aria-label="Shop collections">
        <Link className={slug === "new-in" ? "is-current" : ""} to="/collections/new-in">New In</Link>
        <Link className={slug === "collections" ? "is-current" : ""} to="/collections">All Collections</Link>
        <Link className={slug === "essentials" ? "is-current" : ""} to="/collections/essentials">Essentials</Link>
        <Link className={slug === "accessories" ? "is-current" : ""} to="/collections/accessories">Accessories</Link>
        <Link className={slug === "sale" ? "is-current" : ""} to="/collections/sale">Sale</Link>
      </nav>
      <section className="collection-products" aria-live="polite">
        {loading ? <p className="collection-state" role="status">Loading the collection…</p>
          : error ? <div className="collection-state" role="alert"><p>{error}</p><button className="button button--primary" onClick={() => window.location.reload()} type="button">Try again</button></div>
          : products.length ? <ProductGrid items={products} />
          : <div className="collection-empty">
              <p className="eyebrow">{config.saleOnly ? "A little patience" : "A quiet moment"}</p>
              <h2>{config.saleOnly ? "No sale pieces just yet" : "More pieces coming soon"}</h2>
              <p>{config.saleOnly ? "We’ll feature products here once genuine sale prices are set. In the meantime, explore the full collection." : "This edit is being refreshed. Explore all available pieces while we prepare the next selection."}</p>
              <Link className="button button--primary" to="/shop">Explore all products</Link>
            </div>}
      </section>
    </main>
  );
}
