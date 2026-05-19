require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "mydatabase",
  user: process.env.DB_USER || "avi",
  password: process.env.DB_PASSWORD || "Avi12345",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const ACCOUNT = { name: "Demo User", email: "demo@expense.com", password: "Demo@1234" };

const EXPENSES = [
  { description: "Groceries", category: "Food", payment_method: "UPI", amount: 850 },
  { description: "Lunch at restaurant", category: "Food", payment_method: "Card", amount: 420 },
  { description: "Uber ride", category: "Transport", payment_method: "UPI", amount: 180 },
  { description: "Coffee", category: "Food", payment_method: "Cash", amount: 120 },
  { description: "Movie tickets", category: "Entertainment", payment_method: "Card", amount: 600 },
  { description: "Electricity bill", category: "Bills", payment_method: "Net Banking", amount: 1400 },
  { description: "Pharmacy", category: "Health", payment_method: "Cash", amount: 350 },
  { description: "Amazon order", category: "Shopping", payment_method: "Card", amount: 1200 },
  { description: "Petrol", category: "Transport", payment_method: "Cash", amount: 500 },
  { description: "Dinner", category: "Food", payment_method: "UPI", amount: 750 },
  { description: "Gym membership", category: "Health", payment_method: "Net Banking", amount: 1000 },
  { description: "Internet bill", category: "Bills", payment_method: "Net Banking", amount: 799 },
  { description: "Swiggy order", category: "Food", payment_method: "UPI", amount: 340 },
  { description: "Bus pass", category: "Transport", payment_method: "Cash", amount: 250 },
  { description: "Clothes", category: "Shopping", payment_method: "Card", amount: 1800 },
  { description: "Doctor visit", category: "Health", payment_method: "Cash", amount: 500 },
  { description: "Netflix subscription", category: "Entertainment", payment_method: "Card", amount: 649 },
  { description: "Vegetables", category: "Food", payment_method: "Cash", amount: 210 },
  { description: "Mobile recharge", category: "Bills", payment_method: "UPI", amount: 299 },
  { description: "Parking fee", category: "Transport", payment_method: "Cash", amount: 80 },
  { description: "Books", category: "Shopping", payment_method: "Card", amount: 650 },
  { description: "Breakfast", category: "Food", payment_method: "Cash", amount: 150 },
  { description: "Ola ride", category: "Transport", payment_method: "UPI", amount: 220 },
  { description: "Spotify", category: "Entertainment", payment_method: "Card", amount: 119 },
  { description: "Milk & bread", category: "Food", payment_method: "Cash", amount: 95 },
  { description: "Water bottle", category: "Health", payment_method: "Cash", amount: 40 },
  { description: "Stationary", category: "Shopping", payment_method: "Cash", amount: 180 },
  { description: "Gas cylinder", category: "Bills", payment_method: "Net Banking", amount: 950 },
  { description: "Snacks", category: "Food", payment_method: "Cash", amount: 130 },
  { description: "Auto fare", category: "Transport", payment_method: "Cash", amount: 60 },
];

async function seed() {
  const client = await pool.connect();
  try {
    // Create tables if not exist
    await client.query(`
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

    // Upsert demo user
    const hash = await bcrypt.hash(ACCOUNT.password, 10);
    const userRes = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [ACCOUNT.name, ACCOUNT.email, hash]
    );
    const userId = userRes.rows[0].id;

    // Delete existing expenses for this user (fresh seed)
    await client.query("DELETE FROM expenses WHERE user_id = $1", [userId]);

    // Spread 30 expense entries across last 15 days (2 per day)
    let idx = 0;
    for (let day = 14; day >= 0; day--) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      const dateStr = date.toISOString().split("T")[0];

      // 2 expenses per day
      for (let i = 0; i < 2; i++) {
        const exp = EXPENSES[idx % EXPENSES.length];
        await client.query(
          `INSERT INTO expenses (user_id, amount, description, category, payment_method, expense_date)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, exp.amount, exp.description, exp.category, exp.payment_method, dateStr]
        );
        idx++;
      }
    }

    console.log("✅ Seed complete!");
    console.log(`\n📧 Email:    ${ACCOUNT.email}`);
    console.log(`🔑 Password: ${ACCOUNT.password}`);
    console.log(`\n30 expenses added across the last 15 days.`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
