import "./CheckoutForm.css";

export default function CheckoutForm({
  customer,
  errors,
  onChange,
}) {
  const handleChange = (event) => {
    onChange(
      event.target.name,
      event.target.value
    );
  };


  return (
    <section className="checkout-section">

      <div className="checkout-section__heading">

        <p className="checkout-section__eyebrow">
          01
        </p>

        <div>
          <h2>
            Contact & Shipping
          </h2>

          <p>
            Where should we send your order?
          </p>
        </div>

      </div>


      <div className="checkout-form-grid">

        {/* First Name */}

        <label>
          <span>
            First Name
          </span>

          <input
            type="text"
            name="firstName"
            value={customer.firstName}
            onChange={handleChange}
            autoComplete="given-name"
            aria-invalid={Boolean(errors.firstName)}
          />

          {errors.firstName && (
            <small className="checkout-field-error">
              {errors.firstName}
            </small>
          )}
        </label>


        {/* Last Name */}

        <label>
          <span>
            Last Name
          </span>

          <input
            type="text"
            name="lastName"
            value={customer.lastName}
            onChange={handleChange}
            autoComplete="family-name"
            aria-invalid={Boolean(errors.lastName)}
          />

          {errors.lastName && (
            <small className="checkout-field-error">
              {errors.lastName}
            </small>
          )}
        </label>


        {/* Email */}

        <label>
          <span>
            Email Address
          </span>

          <input
            type="email"
            name="email"
            value={customer.email}
            onChange={handleChange}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
          />

          {errors.email && (
            <small className="checkout-field-error">
              {errors.email}
            </small>
          )}
        </label>


        {/* Phone */}

        <label>
          <span>
            Phone Number
          </span>

          <input
            type="tel"
            name="phone"
            value={customer.phone}
            onChange={handleChange}
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
          />

          {errors.phone && (
            <small className="checkout-field-error">
              {errors.phone}
            </small>
          )}
        </label>


        {/* Address */}

        <label className="checkout-form-grid__full">
          <span>
            Address
          </span>

          <input
            type="text"
            name="address"
            value={customer.address}
            onChange={handleChange}
            autoComplete="street-address"
            aria-invalid={Boolean(errors.address)}
          />

          {errors.address && (
            <small className="checkout-field-error">
              {errors.address}
            </small>
          )}
        </label>


        {/* Apartment */}

        <label>
          <span>
            Apartment / Unit
          </span>

          <input
            type="text"
            name="apartment"
            value={customer.apartment}
            onChange={handleChange}
            autoComplete="address-line2"
          />
        </label>


        {/* City */}

        <label>
          <span>
            City
          </span>

          <input
            type="text"
            name="city"
            value={customer.city}
            onChange={handleChange}
            autoComplete="address-level2"
            aria-invalid={Boolean(errors.city)}
          />

          {errors.city && (
            <small className="checkout-field-error">
              {errors.city}
            </small>
          )}
        </label>


        {/* Postal Code */}

        <label>
          <span>
            Postal Code
          </span>

          <input
            type="text"
            name="postalCode"
            value={customer.postalCode}
            onChange={handleChange}
            autoComplete="postal-code"
            aria-invalid={Boolean(errors.postalCode)}
          />

          {errors.postalCode && (
            <small className="checkout-field-error">
              {errors.postalCode}
            </small>
          )}
        </label>


        {/* Country */}

        <label>
          <span>
            Country
          </span>

          <select
            name="country"
            value={customer.country}
            onChange={handleChange}
            autoComplete="country-name"
          >
            <option value="Pakistan">
              Pakistan
            </option>

            <option value="United Arab Emirates">
              United Arab Emirates
            </option>

            <option value="United Kingdom">
              United Kingdom
            </option>

            <option value="United States">
              United States
            </option>
          </select>
        </label>

      </div>

    </section>
  );
}