import { useEffect, useState } from "react";
import { api } from "./api";

const emptyForm = { make: "", model: "", category: "", price: "", quantity: "" };
const emptyFilters = { make: "", model: "", category: "", minPrice: "", maxPrice: "" };

export default function Dashboard({ token, role, onLogout }) {
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const isAdmin = role === "admin";

  async function load(f = filters) {
    const params = new URLSearchParams(Object.entries(f).filter(([, v]) => v));
    try {
      setVehicles(await api(`/vehicles/search?${params}`, "GET", null, token));
    } catch (err) {
      setMessage(err.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function run(action, okText) {
    try { await action(); setMessage(okText); load(); }
    catch (err) { setMessage(err.message); }
  }

  const purchase = (id) => run(() => api(`/vehicles/${id}/purchase`, "POST", null, token), "Purchased! 🎉");
  const remove = (id) => run(() => api(`/vehicles/${id}`, "DELETE", null, token), "Vehicle deleted");
  const restock = (id) => {
    const amount = Number(prompt("How many to add?"));
    if (amount) run(() => api(`/vehicles/${id}/restock`, "POST", { amount }, token), "Restocked");
  };

  function save(e) {
    e.preventDefault();
    const body = { ...form, price: Number(form.price), quantity: Number(form.quantity) };
    const action = editId
      ? () => api(`/vehicles/${editId}`, "PUT", body, token)
      : () => api("/vehicles", "POST", body, token);
    run(action, editId ? "Vehicle updated" : "Vehicle added");
    setForm(emptyForm); setEditId(null);
  }

  function startEdit(v) {
    setEditId(v._id);
    setForm({ make: v.make, model: v.model, category: v.category, price: v.price, quantity: v.quantity });
    window.scrollTo(0, 0);
  }

  const input = "border rounded-lg p-2 w-full";

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">🚗 Car Dealership {isAdmin && <span className="text-xs bg-yellow-500 text-black rounded px-2 ml-2">ADMIN</span>}</h1>
        <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded">Logout</button>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {message && <p className="bg-blue-100 text-blue-800 p-2 rounded">{message}</p>}

        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="bg-white p-4 rounded-xl shadow grid grid-cols-2 md:grid-cols-6 gap-2">
          {["make", "model", "category", "minPrice", "maxPrice"].map((k) => (
            <input key={k} className={input} placeholder={k} value={filters[k]}
              onChange={(e) => setFilters({ ...filters, [k]: e.target.value })} />
          ))}
          <button className="bg-blue-600 text-white rounded-lg p-2">Search</button>
        </form>

        {isAdmin && (
          <form onSubmit={save} className="bg-white p-4 rounded-xl shadow grid grid-cols-2 md:grid-cols-6 gap-2">
            {["make", "model", "category", "price", "quantity"].map((k) => (
              <input key={k} className={input} placeholder={k} required
                type={k === "price" || k === "quantity" ? "number" : "text"}
                value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            ))}
            <button className="bg-green-600 text-white rounded-lg p-2">{editId ? "Update" : "Add car"}</button>
          </form>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div key={v._id} className="bg-white rounded-xl shadow p-4 space-y-2">
              <h2 className="text-lg font-bold">{v.make} {v.model}</h2>
              <p className="text-gray-500">{v.category}</p>
              <p className="text-2xl font-semibold text-blue-700">${v.price.toLocaleString()}</p>
              <p className={v.quantity === 0 ? "text-red-600" : "text-green-600"}>
                {v.quantity === 0 ? "Out of stock" : `${v.quantity} in stock`}
              </p>
              <button disabled={v.quantity === 0} onClick={() => purchase(v._id)}
                className="w-full bg-blue-600 text-white rounded-lg p-2 disabled:bg-gray-300 disabled:cursor-not-allowed">
                Purchase
              </button>
              {isAdmin && (
                <div className="flex gap-2 text-sm">
                  <button onClick={() => startEdit(v)} className="flex-1 bg-yellow-400 rounded p-1">Edit</button>
                  <button onClick={() => restock(v._id)} className="flex-1 bg-green-500 text-white rounded p-1">Restock</button>
                  <button onClick={() => remove(v._id)} className="flex-1 bg-red-500 text-white rounded p-1">Delete</button>
                </div>
              )}
            </div>
          ))}
          {vehicles.length === 0 && <p className="text-gray-500">No vehicles found.</p>}
        </div>
      </main>
    </div>
  );
}