import './AnnouncementBar.css'
export default function AnnouncementBar() {
  return (
    <div className="announcement">
      <span>Complimentary shipping on orders over $100</span>
      <div>
        <a href="#help">Help</a>
        <a href="#track">Track order</a>
        <span>USD⌄</span>
      </div>
    </div>
  );
}
