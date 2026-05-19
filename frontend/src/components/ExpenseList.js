import React from "react";
import { api } from "../api";

const CAT_ICONS = {
  food: "🍔", transport: "🚗", investment: "📈", self_growth: "🧠",
  health: "❤️", entertainment: "🎮", bills: "🧾", other: "📦",
};
const PAY_ICONS = {
  upi: "📱", cash: "💵", bank_transfer: "🏦",
  credit_card: "💳", debit_card: "🪙",
};

export default function ExpenseList({ expenses, onDeleted }) {
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await api.deleteExpense(id);
    onDeleted(id);
  };

  if (expenses.length === 0)
    return <div className="card"><p style={{ color: "#888", fontSize: 14 }}>No expenses yet. Add one above!</p></div>;

  return (
    <div className="card">
      <h2 className="section-title">Recent Expenses</h2>
      <div className="expense-list">
        {expenses.map((e) => (
          <div key={e.id} className="expense-item">
            <div className="exp-icon">{CAT_ICONS[e.category] || "📦"}</div>
            <div className="exp-info">
              <div className="exp-desc">{e.description || e.category.replace("_", " ")}</div>
              <div className="exp-meta">
                {PAY_ICONS[e.payment_method]} {e.payment_method.replace("_", " ")} &nbsp;·&nbsp;
                {new Date(e.expense_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </div>
            </div>
            <div className="exp-amount">₹{Number(e.amount).toLocaleString("en-IN")}</div>
            <button className="del-btn" onClick={() => handleDelete(e.id)} title="Delete">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
