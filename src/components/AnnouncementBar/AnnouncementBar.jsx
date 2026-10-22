import "./AnnouncementBar.css";

export default function AnnouncementBar({ announcement = "", currency = "USD" }) {
  return (
    <div className="announcement">
      <span>{announcement || "Complimentary shipping on orders over $100"}</span>
      <div>
        <a href="#help">Help</a>
        <a href="#track">Track order</a>
        <span>{currency}⌄</span>
      </div>
    </div>
  );
}
