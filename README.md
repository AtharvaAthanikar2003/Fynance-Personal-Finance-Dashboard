# 💰 Fynance — Personal Finance Dashboard

A clean, interactive finance dashboard built with **Vanilla JavaScript**, **Chart.js**, and custom CSS — no build tools, no bundlers, just open and run.

---

## 🚀 Getting Started

**Option A — Direct Open:**
Just open `index.html` in any modern browser. No server needed.

**Option B — Live Server (recommended for development):**
```bash
# Using VS Code Live Server extension, or:
npx serve .
# Then open http://localhost:3000
```

No npm install required. Chart.js is loaded via CDN.

---

## ✨ Features

### 1. Dashboard Overview
- **4 Summary Cards** — Total Balance, Income, Expenses, Savings Rate
- **Balance Trend Line Chart** — switchable 3M / 6M / 1Y periods with income & expense overlays
- **Spending Donut Chart** — top categories with interactive legend
- **Recent Transactions** — latest 6 entries at a glance

### 2. Transactions Section
- Full paginated table of all transactions
- **Search** by description or category
- **Filter** by type, category, and month
- **Sort** by date or amount (asc/desc)
- Clear filters with one click
- **Export** as CSV or JSON

### 3. Role-Based UI (Simulated Frontend RBAC)
| Feature                      | Viewer | Admin |
| ---------------------------- | :----: | :---: |
| View dashboard & charts      |   ✅   |   ✅   |
| Browse & filter transactions |   ✅   |   ✅   |
| Export data                  |   ✅   |   ✅   |
| Add transaction              |   ❌   |   ✅   |
| Edit transaction             |   ❌   |   ✅   |
| Delete transaction           |   ❌   |   ✅   |

Switch roles via the **dropdown in the sidebar**. Role persists via localStorage.

### 4. Insights Section
- 🏆 Top spending category
- 📊 Month-over-month expense change
- 💰 Overall savings rate with health indicator
- 🔄 Most frequent transaction category
- 📅 Average monthly income & expenses
- **Monthly Income vs Expenses Bar Chart** (last 6 months)
- **Category Spending Horizontal Bar Chart**

### 5. State Management
- Centralized `State` object (no framework overhead)
- Persistent via **localStorage** — transactions, role, and theme survive page refresh
- Auto-seeds 12 months of realistic mock data on first load

### 6. UX & Design
- **Luxury dark fintech aesthetic** — Syne + DM Mono + DM Sans fonts
- Fully **responsive** — works on mobile, tablet, desktop
- **Dark / Light mode** toggle
- Smooth animations and hover states
- Empty state handling throughout
- Toast notifications for all actions
- Modal for add/edit with validation

---

## 🗂️ File Structure

```
finance-dashboard/
├── index.html        — App shell, semantic HTML (includes favicon link)
├── style.css         — All styles with CSS variables for theming
├── app.js            — State, data, charts, interactions
├── favicon.ico       — Data-analysis favicon
└── README.md         — Project documentation
```

---

## 🛠️ Technical Choices

| Concern | Approach |
|---|---|
| Framework | Vanilla JS (zero dependencies beyond Chart.js) |
| Styling | Custom CSS with CSS variables for theming |
| Charts | Chart.js v4 via CDN |
| State | Centralized `State` object + localStorage |
| Data | 12-month seeded mock data (auto-generated) |
| RBAC | Frontend flag check — `State.role` controls UI visibility |

---

## 📦 Dependencies

- [Chart.js 4.4.2](https://www.chartjs.org/) — via CDN, no install needed
- [Google Fonts](https://fonts.google.com/) — Syne, DM Mono, DM Sans

---

## 🎨 Design System

- **Primary accent:** `#4ade9b` (emerald green)
- **Danger:** `#f87171` (soft red)
- **Info:** `#60a5fa` (blue)
- **Font display:** Syne 800 (headings)
- **Font mono:** DM Mono (numbers, values)
- **Font body:** DM Sans (UI text)
