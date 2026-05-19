require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-prod";

// ── DB Connection ──────────────────────────────────────────────────────────
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// ── Auth Middleware ────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ── DB Init ────────────────────────────────────────────────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      amount NUMERIC(10,2) NOT NULL,
      description TEXT,
      category VARCHAR(50) NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("✅ DB tables ready");
}

// ── Auth Routes ────────────────────────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields required" });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email",
      [name, email, hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token, user });
  } catch (err) {
    if (err.code === "23505")
      return res.status(400).json({ error: "Email already exists" });
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Expense Routes ─────────────────────────────────────────────────────────
app.get("/api/expenses", auth, async (req, res) => {
  const { month, year } = req.query;
  let query = "SELECT * FROM expenses WHERE user_id=$1";
  const params = [req.user.id];

  if (month && year) {
    query += " AND EXTRACT(MONTH FROM expense_date)=$2 AND EXTRACT(YEAR FROM expense_date)=$3";
    params.push(month, year);
  }

  query += " ORDER BY expense_date DESC, created_at DESC";
  const result = await pool.query(query, params);
  res.json(result.rows);
});

app.post("/api/expenses", auth, async (req, res) => {
  const { amount, description, category, payment_method, expense_date } = req.body;
  if (!amount || !category || !payment_method)
    return res.status(400).json({ error: "amount, category, payment_method required" });

  const result = await pool.query(
    `INSERT INTO expenses (user_id, amount, description, category, payment_method, expense_date)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.id, amount, description, category, payment_method, expense_date || new Date()]
  );
  res.json(result.rows[0]);
});

app.delete("/api/expenses/:id", auth, async (req, res) => {
  await pool.query(
    "DELETE FROM expenses WHERE id=$1 AND user_id=$2",
    [req.params.id, req.user.id]
  );
  res.json({ success: true });
});

// ── Analytics Route ────────────────────────────────────────────────────────
app.get("/api/analytics", auth, async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;

  const [byCategory, byPayment, byMonth] = await Promise.all([
    pool.query(
      `SELECT category, SUM(amount) as total, COUNT(*) as count
       FROM expenses WHERE user_id=$1 AND EXTRACT(YEAR FROM expense_date)=$2
       GROUP BY category ORDER BY total DESC`,
      [req.user.id, year]
    ),
    pool.query(
      `SELECT payment_method, SUM(amount) as total, COUNT(*) as count
       FROM expenses WHERE user_id=$1 AND EXTRACT(YEAR FROM expense_date)=$2
       GROUP BY payment_method ORDER BY total DESC`,
      [req.user.id, year]
    ),
    pool.query(
      `SELECT EXTRACT(MONTH FROM expense_date) as month, SUM(amount) as total
       FROM expenses WHERE user_id=$1 AND EXTRACT(YEAR FROM expense_date)=$2
       GROUP BY month ORDER BY month`,
      [req.user.id, year]
    ),
  ]);

  res.json({
    byCategory: byCategory.rows,
    byPayment: byPayment.rows,
    byMonth: byMonth.rows,
  });
});

app.get("/health", (_, res) => res.json({ status: "ok" }));

// ── Start ──────────────────────────────────────────────────────────────────
initDB()
  .then(() => app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`)))
  .catch(console.error);


    // just ofr testing ci-cd 1