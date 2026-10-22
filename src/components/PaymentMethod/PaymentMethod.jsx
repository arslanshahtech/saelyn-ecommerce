import "./PaymentMethod.css";

export default function PaymentMethod({ selectedMethod, onChange }) {
  const options = [
    {
      id: "cod",
      title: "Cash on Delivery",
      description: "Pay when your order arrives.",
      disabled: false,
    },
    {
      id: "card",
      title: "Card Payment",
      description: "Online card payments are not available yet.",
      disabled: true,
    },
  ];

  return (
    <section className="checkout-section">
      <div className="checkout-section__heading">
        <p className="checkout-section__eyebrow">03</p>
        <div>
          <h2>Payment</h2>
          <p>Select your preferred payment method.</p>
        </div>
      </div>

      <div className="payment-methods">
        {options.map((option) => {
          const selected = selectedMethod === option.id;
          return (
            <label key={option.id} className={`payment-option ${selected ? "active" : ""} ${option.disabled ? "payment-option--disabled" : ""}`}>
              <input
                type="radio"
                name="paymentMethod"
                value={option.id}
                checked={selected}
                disabled={option.disabled}
                onChange={() => onChange(option.id)}
              />
              <span className="payment-option__radio" />
              <span className="payment-option__content">
                <strong>{option.title}</strong>
                <span>{option.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
