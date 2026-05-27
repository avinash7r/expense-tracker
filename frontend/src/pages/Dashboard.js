import React, { useEffect, useState } from "react";
import AddExpense from "../components/AddExpense";
import ExpenseList from "../components/ExpenseList";
import Analytics from "../components/Analytics";
import { api } from "../api";

export default function Dashboard({ user, onLogout }) {
  const [expenses, setExpenses] = useState([]);
  const [tab, setTab] = useState("expenses");

  useEffect(() => {
    const now = new Date();
    api.getExpenses({ month: now.getMonth() + 1, year: now.getFullYear() })
      .then(setExpenses)
      .catch(console.error);
  }, []);

  const handleAdded = (exp) => setExpenses((prev) => [exp, ...prev]);
  const handleDeleted = (id) => setExpenses((prev) => prev.filter((e) => e.id !== id));

  const monthTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="app-wrap">
      <header className="top-bar">
        <div className="logo">💸 Spendwise-dev</div>
        <div className="header-right">
          <span className="user-name">Hi, {user.name.split(" ")[0]}</span>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="summary-bar">
        <div className="summary-item">
          <div className="sum-label">This Month</div>
          <div className="sum-val">₹{monthTotal.toLocaleString("en-IN")}</div>
        </div>
        <div className="summary-item">
          <div className="sum-label">Transactions</div>
          <div className="sum-val">{expenses.length}</div>
        </div>
        <div className="summary-item">
          <div className="sum-label">Avg / Day</div>
          <div className="sum-val">
            ₹{expenses.length
              ? Math.round(monthTotal / new Date().getDate()).toLocaleString("en-IN")
              : 0}
          </div>
        </div>
      </div>

      <div className="tab-nav">
        <button className={`tab ${tab === "expenses" ? "active" : ""}`} onClick={() => setTab("expenses")}>
          Expenses
        </button>
        <button className={`tab ${tab === "analytics" ? "active" : ""}`} onClick={() => setTab("analytics")}>
          Analytics
        </button>
      </div>

      <main className="main-content">
        {tab === "expenses" ? (
          <>
            <AddExpense onAdded={handleAdded} />
            <ExpenseList expenses={expenses} onDeleted={handleDeleted} />
          </>
        ) : (
          <Analytics />
        )}
      </main>
    </div>
  );
}
