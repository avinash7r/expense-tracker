import React, { useState } from "react";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import { clearToken } from "./api";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  const handleAuth = (u) => setUser(u);
  const handleLogout = () => { clearToken(); setUser(null); };

  return user ? (
    <Dashboard user={user} onLogout={handleLogout} />
  ) : (
    <AuthPage onAuth={handleAuth} />
  );
}


    // just ofr testing ci-cd 1