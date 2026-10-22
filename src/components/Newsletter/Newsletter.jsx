import { useState } from "react";
import './Newsletter.css'
export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  function submit(e) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setMessage("Please enter a valid email address.");
      return;
    }
    setMessage("Thanks — you're on the list.");
    setEmail("");
  }
  return (
    <section className="newsletter" id="newsletter">
      <p className="eyebrow">Stay in the loop</p>
      <h2>Good things, occasionally.</h2>
      <p>
        Receive updates on new collections, considered edits and stories from
        SAELYN.
      </p>
      <form className="newsletter__form" onSubmit={submit} noValidate>
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
        />
        <button className="button button--primary">
          Subscribe <span>→</span>
        </button>
      </form>
      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
