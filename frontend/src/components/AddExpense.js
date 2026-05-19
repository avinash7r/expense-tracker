import React, { useState } from "react";
import { api } from "../api";

const CATEGORIES = [
  { value: "food", label: "🍔 Food" },
  { value: "transport", label: "🚗 Transport" },
  { value: "investment", label: "📈 Investment" },
  { value: "self_growth", label: "🧠 Self Growth" },
  { value: "health", label: "❤️ Health" },
  { value: "entertainment", label: "🎮 Entertainment" },
  { value: "bills", label: "🧾 Bills" },
  { value: "other", label: "📦 Other" },
];

const PAYMENTS = [
  { value: "upi", label: "📱 UPI" },
  { value: "cash", label: "💵 Cash" },
  { value: "bank_transfer", label: "🏦 Bank Transfer" },
  { value: "credit_card", label: "💳 Credit Card" },
  { value: "debit_card", label: "🪙 Debit Card" },
];

export default function AddExpense({ onAdded }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    amount: "",
    description: "",
    category: "food",
    payment_method: "upi",
    expense_date: today,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const expense = await api.addExpense(form);
      onAdded(expense);
      setForm({ amount: "", description: "", category: "food", payment_method: "upi", expense_date: today });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="section-title">Add Expense</h2>
      <form onSubmit={submit} className="expense-form">
        <div className="form-row">
          <div className="form-group">
            <label>Amount (₹)</label>
            <input
              className="inp"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={set("amount")}
              required
            />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input className="inp" type="date" value={form.expense_date} onChange={set("expense_date")} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select className="inp" value={form.category} onChange={set("category")}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Payment</label>
            <select className="inp" value={form.payment_method} onChange={set("payment_method")}>
              {PAYMENTS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Description (optional)</label>
          <input className="inp" placeholder="What was this for?" value={form.description} onChange={set("description")} />
        </div>

        {error && <p className="err">{error}</p>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Adding..." : "+ Add Expense"}
        </button>
      </form>
    </div>
  );
}
