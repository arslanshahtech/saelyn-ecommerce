import { BrowserRouter, Routes, Route } from "react-router-dom";
import OrderConfirmationPage from "./pages/OrderConfirmationPage/OrderConfirmationPage.jsx";
import ProductPage from "./pages/ProductPage/ProductPage.jsx";
import AnnouncementBar from "./components/AnnouncementBar/AnnouncementBar.jsx";
import Navbar from "./components/Navbar/Navbar.jsx";
import Newsletter from "./components/Newsletter/Newsletter.jsx";
import Footer from "./components/Footer/Footer.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import { ProductsProvider } from "./context/ProductsContext.jsx";
import NewInSection from "./components/NewInSection/NewInSection.jsx";
import EditorialSection from "./components/EditorialSection/EditorialSection.jsx";
import EssentialsSection from "./components/EssentialsSection/EssentialsSection.jsx";
import FormInMotionSection from "./components/FormInMotionSection/FormInMotionSection.jsx";
import BrandStorySection from "./components/BrandStorySection/BrandStorySection.jsx";
import HeroSection from "./components/HeroSection/HeroSection.jsx";
import CartPage from "./pages/CartPage/CartPage.jsx";
import ShopPage from "./pages/ShopPage/ShopPage.jsx";
import WishlistPage from "./pages/WishlistPage/WishlistPage.jsx";
import CheckoutPage from "./pages/CheckoutPage/CheckoutPage.jsx";

function HomePage() {
  return (
    <>
      <HeroSection />
      <EditorialSection />
      <NewInSection />
      <FormInMotionSection />
      <EssentialsSection />
      <BrandStorySection />
      <div className="brand-statement">
        <span>SAELYN</span>
        <p>Designed for the modern wardrobe.</p>
      </div>
    </>
  );
}

export default function App() {
  return (
    <ProductsProvider>
      <WishlistProvider>
        <CartProvider>
          <BrowserRouter>
            <div id="top">
              <AnnouncementBar />
              <Navbar />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
              </Routes>
              <Newsletter />
              <Footer />
            </div>
          </BrowserRouter>
        </CartProvider>
      </WishlistProvider>
    </ProductsProvider>
  );
}
