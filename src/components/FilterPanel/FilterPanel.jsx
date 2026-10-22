import { useEffect, useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";

import "./FilterPanel.css";

export default function FilterPanel({
  isOpen,
  onClose,

  categories,
  colors,
  sizes,
  materials,

  selectedCategory,
  selectedColors,
  selectedSizes,
  selectedMaterials,

  minPrice,
  maxPrice,

  appliedMinPrice,
  appliedMaxPrice,

  availableProducts,

  onApply,
  onReset,
}) {

  // =========================
  // DRAFT FILTER STATE
  // =========================

  const [draftCategory, setDraftCategory] =
    useState(selectedCategory);

  const [draftColors, setDraftColors] =
    useState(selectedColors);

  const [draftSizes, setDraftSizes] =
    useState(selectedSizes);

  const [draftMaterials, setDraftMaterials] =
    useState(selectedMaterials);

  const [draftMinPrice, setDraftMinPrice] =
    useState(appliedMinPrice);

  const [draftMaxPrice, setDraftMaxPrice] =
    useState(appliedMaxPrice);


  // =========================
  // SYNC APPLIED STATE
  // =========================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftCategory(selectedCategory);
    setDraftColors(selectedColors);
    setDraftSizes(selectedSizes);
    setDraftMaterials(selectedMaterials);
    setDraftMinPrice(appliedMinPrice);
    setDraftMaxPrice(appliedMaxPrice);

  }, [
    isOpen,
    selectedCategory,
    selectedColors,
    selectedSizes,
    selectedMaterials,
    appliedMinPrice,
    appliedMaxPrice,
  ]);


  // =========================
  // BODY SCROLL LOCK
  // =========================

  useEffect(() => {

    if (!isOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };

  }, [isOpen]);


  // =========================
  // ESC TO CLOSE
  // =========================

  useEffect(() => {

    if (!isOpen) {
      return;
    }

    const handleEscape = (event) => {

      if (event.key === "Escape") {
        onClose();
      }

    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };

  }, [isOpen, onClose]);


  // =========================
  // PRICE RANGE
  // =========================

  const minPercentage =
    ((draftMinPrice - minPrice) /
      (maxPrice - minPrice || 1)) *
    100;

  const maxPercentage =
    ((draftMaxPrice - minPrice) /
      (maxPrice - minPrice || 1)) *
    100;


  // =========================
  // TOGGLE ARRAY VALUE
  // =========================

  const toggleArrayValue = (
    value,
    currentValues,
    setValues
  ) => {

    setValues((previousValues) => {

      if (previousValues.includes(value)) {
        return previousValues.filter(
          (item) => item !== value
        );
      }

      return [
        ...previousValues,
        value,
      ];

    });

  };


  // =========================
  // PRICE CHANGE
  // =========================

  const handleMinPriceChange = (event) => {

    const value = Number(
      event.target.value
    );

    setDraftMinPrice(
      Math.min(
        value,
        draftMaxPrice - 1
      )
    );

  };


  const handleMaxPriceChange = (event) => {

    const value = Number(
      event.target.value
    );

    setDraftMaxPrice(
      Math.max(
        value,
        draftMinPrice + 1
      )
    );

  };


  // =========================
  // PREVIEW RESULTS
  // =========================

  const previewProducts =
    availableProducts.filter((product) => {

      const price = Number(
        product.price.replace("$", "")
      );


      const matchesCategory =
        draftCategory === "All" ||
        product.category === draftCategory;


      const matchesPrice =
        price >= draftMinPrice &&
        price <= draftMaxPrice;


      const productColors =
        product.colors || [];


      const matchesColor =
        draftColors.length === 0 ||
        draftColors.some((color) =>
          productColors.includes(color)
        );


      const productSizes =
        product.sizes || [];


      const matchesSize =
        draftSizes.length === 0 ||
        draftSizes.some((size) =>
          productSizes.includes(size)
        );


      const matchesMaterial =
        draftMaterials.length === 0 ||
        draftMaterials.includes(
          product.material
        );


      return (
        matchesCategory &&
        matchesPrice &&
        matchesColor &&
        matchesSize &&
        matchesMaterial
      );

    });


  const previewCount =
    previewProducts.length;


  // =========================
  // APPLY
  // =========================

  const handleApply = () => {

    onApply({
      category: draftCategory,
      colors: draftColors,
      sizes: draftSizes,
      materials: draftMaterials,
      minPrice: draftMinPrice,
      maxPrice: draftMaxPrice,
    });

    onClose();

  };


  // =========================
  // RESET
  // =========================

  const handleReset = () => {

    setDraftCategory("All");
    setDraftColors([]);
    setDraftSizes([]);
    setDraftMaterials([]);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);

    onReset();

  };


  if (!isOpen) {
    return null;
  }


  return (
    <div
      className="filter-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Product filters"
    >

      {/* =========================
          BACKDROP
      ========================= */}

      <button
        type="button"
        className="filter-panel__backdrop"
        aria-label="Close filters"
        onClick={onClose}
      />


      {/* =========================
          DRAWER
      ========================= */}

      <aside className="filter-panel__drawer">


        {/* =========================
            HEADER
        ========================= */}

        <header className="filter-panel__header">

          <div>

            <p className="filter-panel__eyebrow">
              FILTERS
            </p>

            <h2>
              Refine Selection
            </h2>

          </div>


          <button
            type="button"
            className="filter-panel__close"
            onClick={onClose}
            aria-label="Close filters"
          >
            <X />
          </button>

        </header>


        {/* =========================
            CONTENT
        ========================= */}

        <div className="filter-panel__content">


          {/* =========================
              CATEGORY
          ========================= */}

          <section className="filter-panel__section">

            <div className="filter-panel__section-heading">
              <h3>
                Category
              </h3>
            </div>


            <div className="filter-panel__categories">

              {categories.map((category) => (

                <button
                  key={category}
                  type="button"
                  className={`filter-category ${
                    draftCategory === category
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setDraftCategory(category)
                  }
                >

                  <span>
                    {category}
                  </span>

                  {draftCategory === category && (
                    <span className="filter-category__mark">
                      Selected
                    </span>
                  )}

                </button>

              ))}

            </div>

          </section>


          {/* =========================
              COLOR
          ========================= */}

          <section className="filter-panel__section">

            <div className="filter-panel__section-heading">

              <h3>
                Color
              </h3>

            </div>


            <div className="filter-colors">

              {colors.map((color) => {

                const selected =
                  draftColors.includes(color);

                return (
                  <button
                    key={color}
                    type="button"
                    className={`filter-color ${
                      selected ? "active" : ""
                    }`}
                    style={{
                      backgroundColor: color,
                    }}
                    onClick={() =>
                      toggleArrayValue(
                        color,
                        draftColors,
                        setDraftColors
                      )
                    }
                    aria-label={`Filter by color ${color}`}
                    aria-pressed={selected}
                    title={color}
                  />
                );

              })}

            </div>

          </section>


          {/* =========================
              SIZE
          ========================= */}

          <section className="filter-panel__section">

            <div className="filter-panel__section-heading">

              <h3>
                Size
              </h3>

            </div>


            <div className="filter-sizes">

              {sizes.map((size) => {

                const selected =
                  draftSizes.includes(size);

                return (
                  <button
                    key={size}
                    type="button"
                    className={`filter-size ${
                      selected ? "active" : ""
                    }`}
                    onClick={() =>
                      toggleArrayValue(
                        size,
                        draftSizes,
                        setDraftSizes
                      )
                    }
                    aria-pressed={selected}
                  >
                    {size}
                  </button>
                );

              })}

            </div>

          </section>


          {/* =========================
              MATERIAL
          ========================= */}

          <section className="filter-panel__section">

            <div className="filter-panel__section-heading">

              <h3>
                Material
              </h3>

            </div>


            <div className="filter-materials">

              {materials.map((material) => {

                const selected =
                  draftMaterials.includes(material);

                return (
                  <button
                    key={material}
                    type="button"
                    className={`filter-material ${
                      selected ? "active" : ""
                    }`}
                    onClick={() =>
                      toggleArrayValue(
                        material,
                        draftMaterials,
                        setDraftMaterials
                      )
                    }
                    aria-pressed={selected}
                  >
                    {material}
                  </button>
                );

              })}

            </div>

          </section>


          {/* =========================
              PRICE
          ========================= */}

          <section className="filter-panel__section">

            <div className="filter-panel__section-heading">

              <h3>
                Price Range
              </h3>

              <span>
                ${draftMinPrice} — ${draftMaxPrice}
              </span>

            </div>


            <div className="filter-range">

              <span className="filter-range__rail" />

              <span
                className="filter-range__active"
                style={{
                  left: `${minPercentage}%`,
                  right: `${100 - maxPercentage}%`,
                }}
              />


              <input
                type="range"
                min={minPrice}
                max={maxPrice}
                step="1"
                value={draftMinPrice}
                onChange={handleMinPriceChange}
                className="filter-range__input filter-range__input--min"
                aria-label="Minimum price"
              />

              <input
                type="range"
                min={minPrice}
                max={maxPrice}
                step="1"
                value={draftMaxPrice}
                onChange={handleMaxPriceChange}
                className="filter-range__input filter-range__input--max"
                aria-label="Maximum price"
              />

            </div>


            <div className="filter-range__values">

              <span>
                ${minPrice}
              </span>

              <span>
                ${maxPrice}
              </span>

            </div>

          </section>


          {/* =========================
              RESULT PREVIEW
          ========================= */}

          <section className="filter-panel__result">

            <SlidersHorizontal />

            <div>

              <span>
                Current Selection
              </span>

              <strong>
                {previewCount}{" "}
                {previewCount === 1
                  ? "Product"
                  : "Products"}
              </strong>

            </div>

          </section>

        </div>


        {/* =========================
            FOOTER
        ========================= */}

        <footer className="filter-panel__footer">

          <button
            type="button"
            className="filter-panel__reset"
            onClick={handleReset}
          >
            Reset Filters
          </button>


          <button
            type="button"
            className="filter-panel__apply"
            onClick={handleApply}
          >
            Show {previewCount}{" "}
            {previewCount === 1
              ? "Product"
              : "Products"}
          </button>

        </footer>

      </aside>

    </div>
  );
}