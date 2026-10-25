import { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));

  function onLogin(t, r) {
    localStorage.setItem("token", t);
    localStorage.setItem("role", r);
    setToken(t); setRole(r);
  }
  function onLogout() {
    localStorage.clear();
    setToken(null); setRole(null);
  }

  return token
    ? <Dashboard token={token} role={role} onLogout={onLogout} />
    : <Login onLogin={onLogin} />;
}