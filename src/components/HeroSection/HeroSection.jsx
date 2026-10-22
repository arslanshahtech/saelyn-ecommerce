import "./HeroSection.css";
const HeroSection = () => {
  return (
    <section className="hero">
          <img
            className="hero__image"
            src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2200&q=90"
            alt="SAELYN editorial fashion campaign"
          />
          <div className="hero__content">
            <p className="eyebrow">New season</p>
            <h1>
              Modern,
              <br className="mobile-break" /> refined.
            </h1>
            <p>Contemporary pieces designed for everyday confidence.</p>
            <div className="hero__actions">
              <a className="button button--primary" href="#new-in">
                Shop new in <span>→</span>
              </a>
              <a className="button button--secondary" href="#collections">
                Explore collection
              </a>
            </div>
            <div className="hero__pagination">
              <span>01 / 03</span>
              <span>←　→</span>
            </div>
          </div>
    </section>
  )
}

export default HeroSection