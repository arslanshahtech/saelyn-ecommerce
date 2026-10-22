
import './FormInMotionSection.css'
const FormInMotionSection = () => {
  return (
    <section className="editorial-banner">
          <img
            src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1800&q=85"
            alt="Tailored dark fashion editorial"
            loading="lazy"
          />
          <div className="editorial-banner__content">
            <p className="eyebrow">An editorial</p>
            <h2>Form in motion</h2>
            <p>A study in modern silhouettes, texture and movement.</p>
            <a className="text-link text-link--light" href="#journal">
              Discover the edit <span>→</span>
            </a>
          </div>
    </section>
  )
}

export default FormInMotionSection