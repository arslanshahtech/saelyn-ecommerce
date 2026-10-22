import "./PaymentMethod.css";

export default function PaymentMethod({
  selectedMethod,
  onChange,
}) {

  const options = [
    {
      id: "cod",
      title: "Cash on Delivery",
      description:
        "Pay when your order arrives.",
    },
    {
      id: "card",
      title: "Card Payment",
      description:
        "Secure card payment will be connected later.",
    },
  ];


  return (
    <section className="checkout-section">

      <div className="checkout-section__heading">

        <p className="checkout-section__eyebrow">
          03
        </p>

        <div>
          <h2>
            Payment
          </h2>

          <p>
            Select your preferred payment method.
          </p>
        </div>

      </div>


      <div className="payment-methods">

        {options.map((option) => {

          const selected =
            selectedMethod === option.id;

          return (
            <label
              key={option.id}
              className={`payment-option ${
                selected ? "active" : ""
              }`}
            >

              <input
                type="radio"
                name="paymentMethod"
                value={option.id}
                checked={selected}
                onChange={() =>
                  onChange(option.id)
                }
              />

              <span className="payment-option__radio" />

              <span className="payment-option__content">

                <strong>
                  {option.title}
                </strong>

                <span>
                  {option.description}
                </span>

              </span>

            </label>
          );

        })}

      </div>

    </section>
  );
}