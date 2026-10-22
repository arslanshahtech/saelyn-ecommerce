import "./ShippingMethod.css";

export default function ShippingMethod({
  selectedMethod,
  onChange,
}) {

  const options = [
    {
      id: "standard",
      title: "Standard Delivery",
      description: "3–5 business days",
      price: "Free",
      value: 0,
    },
    {
      id: "express",
      title: "Express Delivery",
      description: "1–2 business days",
      price: "$15",
      value: 15,
    },
  ];


  return (
    <section className="checkout-section">

      <div className="checkout-section__heading">

        <p className="checkout-section__eyebrow">
          02
        </p>

        <div>
          <h2>
            Delivery Method
          </h2>

          <p>
            Choose how you'd like your order delivered.
          </p>
        </div>

      </div>


      <div className="shipping-methods">

        {options.map((option) => {

          const selected =
            selectedMethod === option.id;

          return (
            <label
              key={option.id}
              className={`shipping-option ${
                selected ? "active" : ""
              }`}
            >

              <input
                type="radio"
                name="shippingMethod"
                value={option.id}
                checked={selected}
                onChange={() =>
                  onChange(option.id)
                }
              />


              <span className="shipping-option__radio" />


              <span className="shipping-option__content">

                <strong>
                  {option.title}
                </strong>

                <span>
                  {option.description}
                </span>

              </span>


              <span className="shipping-option__price">
                {option.price}
              </span>

            </label>
          );
        })}

      </div>

    </section>
  );
}