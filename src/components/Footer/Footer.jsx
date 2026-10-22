import './Footer.css'
const groups = [
  { title: "Shop", links: ["New In", "Shop All", "Essentials", "Collections"] },
  {
    title: "Help",
    links: ["Contact", "Shipping & Returns", "Size Guide", "FAQs"],
  },
  { title: "About", links: ["Our Story", "Journal", "Sustainability"] },
  { title: "Account", links: ["Sign In", "Orders", "Wishlist"] },
];
export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="footer__top">
        <a className="wordmark" href="#top">
          SAELYN
        </a>
        <p>Designed for the modern wardrobe.</p>
      </div>
      <div className="footer__groups">
        {groups.map((g) => (
          <div key={g.title}>
            <h3>{g.title}</h3>
            {g.links.map((l) => (
              <a href="#" key={l}>
                {l}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="footer__bottom">
        <span>© 2026 SAELYN. All rights reserved.</span>
        <div>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#instagram">Instagram</a>
        </div>
      </div>
    </footer>
  );
}
