import './EditorialSection.css'
/*
  EditorialSection
  ----------------
  Homepage ke "The New Edit" section ko render karta hai.

  Is component ki responsibility:
  1. Editorial heading aur description show karna
  2. Dono editorial images render karna
  3. User ko New In section tak navigate karne dena

  Note:
  Abhi existing CSS classes ko preserve kar rahe hain,
  taake approved design change na ho.
*/

export default function EditorialSection() {
  return (
    <section
      className="editorial-intro section-shell"
      id="collections"
    >
      {/* Editorial text content */}
      <div className="editorial-intro__copy">
        <p className="eyebrow">The edit</p>

        <h2>The new edit</h2>

        <p>
          A focused selection of new silhouettes, refined
          layers and everyday essentials.
        </p>

        <a className="text-link" href="#new-in">
          Explore edit <span>→</span>
        </a>
      </div>

      {/* Editorial image grid */}
      <div className="editorial-intro__images">
        <img
          src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1800&q=85"
          alt="Editorial fashion look"
          loading="lazy"
        />

        <img
          src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85"
          alt="Modern wardrobe styling"
          loading="lazy"
        />
      </div>
    </section>
  );
}