import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { api } from "../api";

const COLORS = [
  "#6C63FF",
  "#FF6584",
  "#43D9AD",
  "#FFB347",
  "#5BC0EB",
  "#FFC0CB",
  "#A8E6CF",
  "#888",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function Analytics() {
  const year = new Date().getFullYear();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getAnalytics(year).then(setData).catch(console.error);
  }, [year]);

  if (!data)
    return (
      <div className="card">
        <p style={{ color: "#888" }}>Loading analytics...</p>
      </div>
    );

  const monthData = Array.from({ length: 12 }, (_, i) => {
    const found = data.byMonth.find((m) => Number(m.month) === i + 1);
    return { name: MONTHS[i], total: found ? Number(found.total) : 0 };
  });

  const catData = data.byCategory.map((c) => ({
    name: c.category.replace("_", " "),
    value: Number(c.total),
  }));

  const total = catData.reduce((s, c) => s + c.value, 0);

  return (
    <div className="analytics-wrap">
      <div className="card">
        <h2 className="section-title">Monthly Spend - {year}</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={monthData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#888" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#888" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`
              }
            />
            <Tooltip formatter={(v) => fmt(v)} />
            <Bar dataKey="total" fill="#6C63FF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="analytics-row">
        <div className="card">
          <h2 className="section-title">By Category</h2>
          {catData.length === 0 ? (
            <p style={{ color: "#888", fontSize: 14 }}>No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={catData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                  fontSize={11}
                >
                  {catData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="section-title">By Payment</h2>
          <div className="payment-list">
            {data.byPayment.length === 0 ? (
              <p style={{ color: "#888", fontSize: 14 }}>No data yet</p>
            ) : (
              data.byPayment.map((p, i) => (
                <div key={i} className="payment-row">
                  <div
                    className="payment-dot"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="payment-name">
                    {p.payment_method.replace("_", " ")}
                  </span>
                  <span className="payment-val">{fmt(p.total)}</span>
                  <span className="payment-pct">
                    {total ? ((p.total / total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              ))
            )}
            <div className="payment-row total-row">
              <div
                className="payment-dot"
                style={{ background: "transparent" }}
              />
              <span className="payment-name" style={{ fontWeight: 700 }}>
                Total
              </span>
              <span className="payment-val" style={{ fontWeight: 700 }}>
                {fmt(total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
