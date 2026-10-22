import './BrandStorySection.css'
const BrandStorySection = () => {
  return (
    <section className="brand-story">
          <div className="brand-story__copy">
            <p className="eyebrow">Our philosophy</p>
            <h2>
              Made with
              <br />
              intention.
            </h2>
            <p>
              Thoughtful design. Better materials. A smaller, more considered
              wardrobe.
            </p>
            <a className="text-link" href="#about">
              Our story <span>→</span>
            </a>
          </div>
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=85"
            alt="Contemporary fashion editorial"
            loading="lazy"
          />
    </section>
  )
}

export default BrandStorySection