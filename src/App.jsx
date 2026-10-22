import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPublicStoreSettings } from "./api/store.js";
import "./components/StoreMaintenance.css";
import AdminDashboardPage from "./pages/AdminDashboardPage/AdminDashboardPage.jsx";
import OrderConfirmationPage from "./pages/OrderConfirmationPage/OrderConfirmationPage.jsx";
import ProductPage from "./pages/ProductPage/ProductPage.jsx";
import AnnouncementBar from "./components/AnnouncementBar/AnnouncementBar.jsx";
import Navbar from "./components/Navbar/Navbar.jsx";
import Newsletter from "./components/Newsletter/Newsletter.jsx";
import Footer from "./components/Footer/Footer.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
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
import AuthPage from "./pages/AuthPage/AuthPage.jsx";
import AccountPage from "./pages/AccountPage/AccountPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage/ResetPasswordPage.jsx";
import ShoppingAssistant from "./components/ShoppingAssistant/ShoppingAssistant.jsx";

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

function AppRoutes() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute = ["/login", "/forgot-password", "/reset-password"].includes(location.pathname);
  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => {
    getPublicStoreSettings().then(setStoreSettings);
  }, []);

  if (!isAdminRoute && !isAuthRoute && storeSettings?.maintenanceMode) {
    return (
      <main className="store-maintenance">
        <span className="store-maintenance-mark">SAELYN</span>
        <p className="admin-kicker">A LITTLE PAUSE</p>
        <h1>We’ll be back soon.</h1>
        <p>Our store is temporarily unavailable while we make improvements. Thank you for your patience.</p>
        <Link to="/admin">Administrator access</Link>
      </main>
    );
  }

  return (
    <div id="top">
      {!isAdminRoute && <><AnnouncementBar announcement={storeSettings?.announcement || ""} currency={storeSettings?.currency || "USD"} /><Navbar /></>}
      <Routes>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
      {!isAdminRoute && !isAuthRoute && <ShoppingAssistant />}
      {!isAdminRoute && <><Newsletter /><Footer /></>}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProductsProvider>
        <WishlistProvider>
          <CartProvider>
            <BrowserRouter><AppRoutes /></BrowserRouter>
          </CartProvider>
        </WishlistProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}
