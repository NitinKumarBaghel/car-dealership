import { useState } from "react";
import { api } from "./api";

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [admin, setAdmin] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await api("/auth/register", "POST", { email, password, role: admin ? "admin" : "user" });
      }
      const data = await api("/auth/login", "POST", { email, password });
      onLogin(data.token, data.role);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900 p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">🚗 Car Dealership</h1>
        <p className="text-center text-gray-500">{isRegister ? "Create an account" : "Welcome back"}</p>
        {error && <p className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</p>}
        <input className="w-full border rounded-lg p-2" type="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border rounded-lg p-2" type="password" placeholder="Password (min 6)"
          value={password} onChange={(e) => setPassword(e.target.value)} required />
        {isRegister && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)} />
            Register as admin (demo only)
          </label>
        )}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 font-semibold">
          {isRegister ? "Register" : "Login"}
        </button>
        <button type="button" onClick={() => setIsRegister(!isRegister)}
          className="w-full text-sm text-blue-600 hover:underline">
          {isRegister ? "Already have an account? Login" : "New here? Register"}
        </button>
      </form>
    </div>
  );
}