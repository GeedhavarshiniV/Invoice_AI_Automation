import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import PageTransition from "./components/PageTransition";

function App() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    // AnimatePresence + a location-keyed <Routes> lets each top-level page
    // (Landing / Login / Dashboard) fade+slide in/out when the URL changes,
    // instead of swapping instantly.
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public marketing page — this is what search engines, AI crawlers,
            and anonymous visitors see. Contains the FAQ + SEO/AEO/GEO schema. */}
        <Route
          path="/"
          element={
            <PageTransition keyName="landing">
              <LandingPage />
            </PageTransition>
          }
        />

        {/* Public login route. If already logged in, skip straight to the dashboard. */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <PageTransition keyName="login">
                <LoginPage onLogin={handleLogin} />
              </PageTransition>
            )
          }
        />

        {/* Protected dashboard — redirects to /login if there's no session. */}
        <Route
          path="/dashboard/*"
          element={
            user ? (
              <PageTransition keyName="dashboard">
                <HomePage user={user} onLogout={handleLogout} />
              </PageTransition>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all: send unknown URLs back to the landing page. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
