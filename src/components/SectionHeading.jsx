export default function SectionHeading({ eyebrow, title, link, href = "#" }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {link && (
        <a className="text-link" href={href}>
          {link} <span>→</span>
        </a>
      )}
    </div>
  );
}
