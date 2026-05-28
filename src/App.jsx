import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { DramaProvider } from "./context/DramaContext.jsx";
import Account from "./pages/Account.jsx";
import AddDrama from "./pages/AddDrama.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Completed from "./pages/Completed.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DramaDetail from "./pages/DramaDetail.jsx";
import Recommend from "./pages/Recommend.jsx";
import Watchlist from "./pages/Watchlist.jsx";

export default function App() {
  return (
    <AuthProvider>
      <DramaProvider>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/completed" element={<Completed />} />
              <Route path="/recommend" element={<Recommend />} />
              <Route path="/add" element={<AddDrama />} />
              <Route path="/add/:id" element={<AddDrama />} />
              <Route path="/drama/:id" element={<DramaDetail />} />
              <Route path="/account" element={<Account />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </DramaProvider>
    </AuthProvider>
  );
}
