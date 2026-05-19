# Expense Tracker — Cloud Learning Project

A simple full-stack expense tracker to learn AWS cloud architecture.

## Stack
- **Backend**: Node.js + Express + PostgreSQL (`pg`)
- **Frontend**: React + Recharts
- **Infrastructure**: AWS EC2 + RDS (Postgres) via Terraform

## Project Structure
```
expense-tracker/
├── backend/
│   ├── server.js          # Express API (auth + expenses + analytics)
│   ├── package.json
│   └── .env.example       # Copy to .env on EC2
├── frontend/
│   ├── src/
│   │   ├── App.js / App.css
│   │   ├── api.js          # fetch wrapper
│   │   ├── pages/
│   │   │   ├── AuthPage.js
│   │   │   └── Dashboard.js
│   │   └── components/
│   │       ├── AddExpense.js
│   │       ├── ExpenseList.js
│   │       └── Analytics.js
│   └── package.json
└── DEPLOY.md              # Step-by-step EC2 deployment
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Login, get JWT |
| GET | /api/expenses | Yes | List expenses (filter by month/year) |
| POST | /api/expenses | Yes | Add expense |
| DELETE | /api/expenses/:id | Yes | Delete expense |
| GET | /api/analytics | Yes | Category/payment/monthly breakdown |

## Local Dev

```bash
# Backend
cd backend && npm install
cp .env.example .env   # point DB_HOST to localhost or RDS
node server.js

# Frontend (separate terminal)
cd frontend && npm install
npm start   # proxies /api/* to localhost:3001
```

## See DEPLOY.md for EC2 deployment steps.
