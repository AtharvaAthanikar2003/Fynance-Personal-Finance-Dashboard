/* ============================================================
   FYNANCE DASHBOARD — app.js
   State Management + Data + Charts + Interactions
   ============================================================ */

// ─── STATE ───────────────────────────────────────────────────
const State = {
  role: 'viewer',         // 'viewer' | 'admin'
  theme: 'dark',
  currentView: 'dashboard',
  transactions: [],
  filters: { search: '', type: '', category: '', month: '', sort: 'date-desc' },
  chartPeriod: '3m',
};

// ─── CATEGORY CONFIG ─────────────────────────────────────────
const CAT_ICONS = {
  Food: '🍜', Transport: '🚗', Housing: '🏠', Entertainment: '🎬',
  Healthcare: '💊', Shopping: '🛍', Utilities: '⚡', Education: '📚',
  Salary: '💼', Freelance: '💻', Investment: '📈', Other: '📌',
};
const CAT_COLORS = [
  '#4ade9b','#60a5fa','#f472b6','#fb923c','#a78bfa',
  '#34d399','#f87171','#fbbf24','#818cf8','#22d3ee','#e879f9','#94a3b8'
];

// ─── SEED DATA ───────────────────────────────────────────────
// Fixed deterministic seed: 1 Jan 2023 → 31 Mar 2026
// Uses a seeded pseudo-random so numbers are identical on every fresh install.
function seededRand(seed) {
  // Simple mulberry32 PRNG — deterministic from a numeric seed
  let s = seed >>> 0;
  return function() {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSeedData() {
  const rand = seededRand(0xABCD1234); // fixed seed → same data every time
  const data = [];
  let id = 1;

  // Every template is emitted every month; amounts vary by ±15% using the PRNG
  const monthly = [
    // ── Income (always present) ──────────────────────────────
    { desc: 'Monthly Salary',        cat: 'Salary',        type: 'income',  base: 82000, vary: 0.04, day: 1  },
    { desc: 'Freelance Project',     cat: 'Freelance',     type: 'income',  base: 18000, vary: 0.40, day: 15, skipChance: 0.35 },
    { desc: 'Stock Dividend',        cat: 'Investment',    type: 'income',  base: 4500,  vary: 0.30, day: 20, skipChance: 0.50 },
    { desc: 'Side Project Income',   cat: 'Freelance',     type: 'income',  base: 9000,  vary: 0.45, day: 22, skipChance: 0.40 },
    // ── Fixed monthly expenses ───────────────────────────────
    { desc: 'Monthly Rent',          cat: 'Housing',       type: 'expense', base: 20000, vary: 0.00, day: 2  },
    { desc: 'Electricity Bill',      cat: 'Utilities',     type: 'expense', base: 2100,  vary: 0.20, day: 7  },
    { desc: 'Internet Bill',         cat: 'Utilities',     type: 'expense', base: 999,   vary: 0.00, day: 8  },
    { desc: 'Netflix Subscription',  cat: 'Entertainment', type: 'expense', base: 649,   vary: 0.00, day: 5  },
    { desc: 'Gym Membership',        cat: 'Healthcare',    type: 'expense', base: 2000,  vary: 0.10, day: 3  },
    // ── Variable monthly expenses ────────────────────────────
    { desc: 'Grocery Shopping',      cat: 'Food',          type: 'expense', base: 4200,  vary: 0.20, day: 10 },
    { desc: 'Swiggy / Zomato',       cat: 'Food',          type: 'expense', base: 1800,  vary: 0.35, day: 14 },
    { desc: 'Restaurant Dinner',     cat: 'Food',          type: 'expense', base: 1400,  vary: 0.40, day: 18, skipChance: 0.20 },
    { desc: 'Petrol',                cat: 'Transport',     type: 'expense', base: 3200,  vary: 0.15, day: 9  },
    { desc: 'Uber Ride',             cat: 'Transport',     type: 'expense', base: 600,   vary: 0.50, day: 17, skipChance: 0.25 },
    { desc: 'Online Shopping',       cat: 'Shopping',      type: 'expense', base: 2800,  vary: 0.50, day: 21, skipChance: 0.20 },
    { desc: 'Clothing',              cat: 'Shopping',      type: 'expense', base: 3500,  vary: 0.55, day: 25, skipChance: 0.55 },
    { desc: 'Medicine',              cat: 'Healthcare',    type: 'expense', base: 700,   vary: 0.60, day: 12, skipChance: 0.35 },
    { desc: 'Movie Tickets',         cat: 'Entertainment', type: 'expense', base: 800,   vary: 0.40, day: 23, skipChance: 0.45 },
    { desc: 'Online Course',         cat: 'Education',     type: 'expense', base: 2200,  vary: 0.50, day: 16, skipChance: 0.65 },
    { desc: 'Books',                 cat: 'Education',     type: 'expense', base: 600,   vary: 0.50, day: 27, skipChance: 0.55 },
    { desc: 'Water Bill',            cat: 'Utilities',     type: 'expense', base: 450,   vary: 0.15, day: 6  },
    { desc: 'Mobile Recharge',       cat: 'Utilities',     type: 'expense', base: 299,   vary: 0.00, day: 4  },
    { desc: 'Doctor Visit',          cat: 'Healthcare',    type: 'expense', base: 1200,  vary: 0.30, day: 13, skipChance: 0.70 },
    { desc: 'Spotify',               cat: 'Entertainment', type: 'expense', base: 119,   vary: 0.00, day: 5  },
    { desc: 'Amazon Shopping',       cat: 'Shopping',      type: 'expense', base: 2200,  vary: 0.60, day: 19, skipChance: 0.30 },
  ];

  // Slight salary growth each year
  const salaryGrowth = { 2023: 1.00, 2024: 1.12, 2025: 1.22, 2026: 1.30 };
  // Slight inflation on expenses each year
  const inflationFactor = { 2023: 1.00, 2024: 1.06, 2025: 1.13, 2026: 1.18 };

  // Iterate month by month: Jan 2023 → Mar 2026
  const start = new Date(2023, 0, 1);  // Jan 2023
  const end   = new Date(2026, 2, 31); // Mar 2026

  let cur = new Date(start);
  while (cur <= end) {
    const year  = cur.getFullYear();
    const month = cur.getMonth(); // 0-based
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const sGrow = salaryGrowth[year]    || 1;
    const iGrow = inflationFactor[year] || 1;

    monthly.forEach(t => {
      // Probabilistic skip for optional items
      if (t.skipChance && rand() < t.skipChance) return;

      const growFactor = t.type === 'income' ? sGrow : iGrow;
      const deviation  = 1 + (rand() * 2 - 1) * t.vary;
      const amount     = parseFloat((t.base * growFactor * deviation).toFixed(2));

      // Pin the day within valid range for this month
      const day  = Math.min(t.day, daysInMonth);
      const date = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

      data.push({ id: id++, desc: t.desc, category: t.cat, type: t.type, amount, date });
    });

    // Advance to next month
    cur = new Date(year, month + 1, 1);
  }

  // Sort newest first
  data.sort((a, b) => new Date(b.date) - new Date(a.date));
  return data;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

// ─── PERSISTENCE ─────────────────────────────────────────────
// Bump this version string whenever seed data structure changes.
// Any stored data from an older version is automatically discarded.
const DATA_VERSION = 'v4';

function loadFromStorage() {
  try {
    const storedVersion = localStorage.getItem('fynance_version');

    // Wipe stale data from previous code versions
    if (storedVersion !== DATA_VERSION) {
      localStorage.removeItem('fynance_transactions');
      localStorage.setItem('fynance_version', DATA_VERSION);
    }

    const saved      = localStorage.getItem('fynance_transactions');
    const savedRole  = localStorage.getItem('fynance_role');
    const savedTheme = localStorage.getItem('fynance_theme');

    if (saved) {
      const parsed = JSON.parse(saved);
      // Extra guard: make sure we actually have transaction records
      if (Array.isArray(parsed) && parsed.length > 0) {
        State.transactions = parsed;
      } else {
        throw new Error('empty or invalid data');
      }
    } else {
      // Generate once and immediately persist so refresh never re-randomises
      State.transactions = generateSeedData();
      localStorage.setItem('fynance_transactions', JSON.stringify(State.transactions));
    }

    if (savedRole)  State.role  = savedRole;
    if (savedTheme) State.theme = savedTheme;
    // else         State.theme = 'dark';
    const savedView = localStorage.getItem('fynance_view');
    if (savedView && ['dashboard', 'transactions', 'insights'].includes(savedView)) {
      State.currentView = savedView;
    }

  } catch {
    State.transactions = generateSeedData();
    try {
      localStorage.setItem('fynance_transactions', JSON.stringify(State.transactions));
      localStorage.setItem('fynance_version', DATA_VERSION);
    } catch {}
  }
}

function saveToStorage() {
  try {
    localStorage.setItem('fynance_transactions', JSON.stringify(State.transactions));
    localStorage.setItem('fynance_role', State.role);
    localStorage.setItem('fynance_theme', State.theme);
    localStorage.setItem('fynance_view', State.currentView);
  } catch {}
}

// ─── UTILITIES ───────────────────────────────────────────────
const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmtShort = n => {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'K';
  return '₹' + Math.round(n);
};

function friendlyDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

function monthKey(dateStr) {
  return dateStr.slice(0, 7); // YYYY-MM
}

function monthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

// ─── CHART INSTANCES ─────────────────────────────────────────
let lineChartInst = null;
let donutChartInst = null;
let barChartInst = null;
let hbarChartInst = null;

function chartDefaults() {
  const dark = State.theme === 'dark';
  return {
    gridColor:  dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    labelColor: dark ? '#8b93a8' : '#6b7280',   // readable in both themes
    textColor:  dark ? '#c0c6d6' : '#374151',
  };
}

// ─── COMPUTED STATS ──────────────────────────────────────────
function computeStats() {
  const txs = State.transactions;
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? ((income - expense) / income * 100) : 0;
  return { income, expense, balance, savingsRate };
}

function computeMonthlyData() {
  const months = {};
  State.transactions.forEach(t => {
    const k = monthKey(t.date);
    if (!months[k]) months[k] = { income: 0, expense: 0 };
    months[k][t.type] += t.amount;
  });
  return months;
}

function computeCategoryTotals() {
  const cats = {};
  State.transactions.filter(t => t.type === 'expense').forEach(t => {
    cats[t.category] = (cats[t.category] || 0) + t.amount;
  });
  return Object.entries(cats).sort((a, b) => b[1] - a[1]);
}

// ─── RENDER DASHBOARD ────────────────────────────────────────
function renderDashboard() {
  const stats = computeStats();

  // Date subtitle
  document.getElementById('dashboardDate').textContent =
    new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Cards
  document.getElementById('totalBalance').textContent = fmt.format(stats.balance);
  document.getElementById('totalIncome').textContent = fmt.format(stats.income);
  document.getElementById('totalExpense').textContent = fmt.format(stats.expense);
  document.getElementById('savingsRate').textContent = stats.savingsRate.toFixed(1) + '%';

  const bar = document.getElementById('savingsBar');
  bar.style.width = Math.max(0, Math.min(100, stats.savingsRate)) + '%';

  // Trends (compare last 2 months)
  const monthly = computeMonthlyData();
  const keys = Object.keys(monthly).sort();
  if (keys.length >= 2) {
    const prev = monthly[keys[keys.length - 2]] || { income: 0, expense: 0 };
    const curr = monthly[keys[keys.length - 1]] || { income: 0, expense: 0 };
    const incDelta = prev.income ? ((curr.income - prev.income) / prev.income * 100).toFixed(1) : 0;
    const expDelta = prev.expense ? ((curr.expense - prev.expense) / prev.expense * 100).toFixed(1) : 0;
    setTrend('incomeTrend', incDelta, 'vs last month');
    setTrend('expenseTrend', -expDelta, 'vs last month', true);
    const balDelta = ((stats.balance / stats.income) * 100).toFixed(1);
    document.getElementById('balanceTrend').textContent = `Savings rate ${balDelta}%`;
  }

  renderLineChart();
  renderDonutChart();
  renderRecentTx();
}

function setTrend(id, delta, label, invert = false) {
  const el = document.getElementById(id);
  const up = parseFloat(delta) >= 0;
  const arrow = up ? '↑' : '↓';
  const cls = (invert ? !up : up) ? 'trend-up' : 'trend-down';
  el.innerHTML = `<span class="${cls}">${arrow} ${Math.abs(delta)}%</span> ${label}`;
}

// ─── LINE CHART ───────────────────────────────────────────────
function renderLineChart() {
  const monthly = computeMonthlyData();
  const allKeys = Object.keys(monthly).sort();
  const { gridColor, labelColor } = chartDefaults();

  // Period filter
  const limit = State.chartPeriod === '3m' ? 3 : State.chartPeriod === '6m' ? 6 : 12;
  const keys = allKeys.slice(-limit);

  // Running balance
  let bal = 0;
  const beforeKeys = allKeys.slice(0, allKeys.length - limit);
  beforeKeys.forEach(k => { bal += (monthly[k].income || 0) - (monthly[k].expense || 0); });
  const balances = keys.map(k => {
    bal += (monthly[k].income || 0) - (monthly[k].expense || 0);
    return Math.round(bal);
  });

  const income = keys.map(k => Math.round(monthly[k].income || 0));
  const expense = keys.map(k => Math.round(monthly[k].expense || 0));
  const labels = keys.map(monthLabel);

  const ctx = document.getElementById('lineChart').getContext('2d');
  if (lineChartInst) lineChartInst.destroy();

  lineChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Balance',
          data: balances,
          borderColor: '#4ade9b',
          backgroundColor: 'rgba(74,222,155,0.08)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: '#4ade9b',
          pointRadius: 3,
          pointHoverRadius: 6,
        },
        {
          label: 'Income',
          data: income,
          borderColor: '#60a5fa',
          backgroundColor: 'transparent',
          tension: 0.4,
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 2,
          pointHoverRadius: 5,
        },
        {
          label: 'Expenses',
          data: expense,
          borderColor: '#f87171',
          backgroundColor: 'transparent',
          tension: 0.4,
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 2,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: labelColor, font: { family: 'Roboto Mono', size: 11 }, boxWidth: 16, padding: 16 }
        },
        tooltip: {
          backgroundColor: State.theme === 'dark' ? '#1e2330' : '#fff',
          borderColor: State.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          titleColor: State.theme === 'dark' ? '#f0f2f7' : '#0d0f14',
          bodyColor: labelColor,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${fmtShort(ctx.parsed.y)}`,
          }
        },
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 11 } } },
        y: {
          grid: { color: gridColor },
          ticks: { color: labelColor, font: { size: 11 }, callback: v => fmtShort(v) },
        },
      },
    },
  });
}

// ─── DONUT CHART ─────────────────────────────────────────────
function renderDonutChart() {
  const cats = computeCategoryTotals().slice(0, 8);
  const labels = cats.map(c => c[0]);
  const data = cats.map(c => c[1]);
  const colors = CAT_COLORS.slice(0, cats.length);
  const { labelColor } = chartDefaults();

  const ctx = document.getElementById('donutChart').getContext('2d');
  if (donutChartInst) donutChartInst.destroy();

  donutChartInst = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: State.theme === 'dark' ? '#1e2330' : '#fff',
          borderColor: State.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          titleColor: State.theme === 'dark' ? '#f0f2f7' : '#0d0f14',
          bodyColor: labelColor,
          callbacks: {
            label: ctx => ` ${ctx.label}: ${fmtShort(ctx.parsed)}`,
          }
        },
      },
    },
  });

  // Legend
  const legend = document.getElementById('donutLegend');
  legend.innerHTML = cats.map((c, i) => `
    <div class="legend-item">
      <div class="legend-dot-label">
        <div class="legend-dot" style="background:${colors[i]}"></div>
        <span>${c[0]}</span>
      </div>
      <span class="legend-val">${fmtShort(c[1])}</span>
    </div>
  `).join('');
}

// ─── BAR CHART ───────────────────────────────────────────────
function renderBarChart() {
  const monthly = computeMonthlyData();
  const keys = Object.keys(monthly).sort().slice(-6);
  const { gridColor, labelColor } = chartDefaults();

  const ctx = document.getElementById('barChart').getContext('2d');
  if (barChartInst) barChartInst.destroy();

  barChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: keys.map(monthLabel),
      datasets: [
        {
          label: 'Income',
          data: keys.map(k => Math.round(monthly[k].income || 0)),
          backgroundColor: 'rgba(74,222,155,0.7)',
          borderRadius: 6,
          barPercentage: 0.6,
        },
        {
          label: 'Expenses',
          data: keys.map(k => Math.round(monthly[k].expense || 0)),
          backgroundColor: 'rgba(248,113,113,0.7)',
          borderRadius: 6,
          barPercentage: 0.6,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: labelColor, font: { family: 'Roboto Mono', size: 11 }, boxWidth: 14, padding: 14 } },
        tooltip: {
          backgroundColor: State.theme === 'dark' ? '#1e2330' : '#fff',
          borderColor: State.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          titleColor: State.theme === 'dark' ? '#f0f2f7' : '#0d0f14',
          bodyColor: labelColor,
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmtShort(ctx.parsed.y)}` }
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: labelColor, font: { size: 11 } } },
        y: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 11 }, callback: v => fmtShort(v) } },
      },
    },
  });
}

// ─── HORIZONTAL BAR CHART ────────────────────────────────────
function renderHbarChart() {
  const cats = computeCategoryTotals().slice(0, 7);
  const { gridColor, labelColor } = chartDefaults();

  const ctx = document.getElementById('hbarChart').getContext('2d');
  if (hbarChartInst) hbarChartInst.destroy();

  hbarChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: cats.map(c => c[0]),
      datasets: [{
        label: 'Spending',
        data: cats.map(c => Math.round(c[1])),
        backgroundColor: CAT_COLORS.slice(0, cats.length).map(c => c + 'cc'),
        borderRadius: 5,
        barPercentage: 0.65,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: State.theme === 'dark' ? '#1e2330' : '#fff',
          borderColor: State.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          titleColor: State.theme === 'dark' ? '#f0f2f7' : '#0d0f14',
          bodyColor: labelColor,
          callbacks: { label: ctx => ` ${fmtShort(ctx.parsed.x)}` }
        },
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 11 }, callback: v => fmtShort(v) } },
        y: { grid: { display: false }, ticks: { color: labelColor, font: { size: 11 } } },
      },
    },
  });
}

// ─── RECENT TX ───────────────────────────────────────────────
function renderRecentTx() {
  const recent = [...State.transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);
  const el = document.getElementById('recentTxList');

  if (!recent.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">💸</div><div class="empty-title">No transactions yet</div></div>';
    return;
  }

  el.innerHTML = recent.map(t => txItemHtml(t)).join('');
}

function txItemHtml(t, showActions = false) {
  const icon = CAT_ICONS[t.category] || '📌';
  const adminEdit = showActions && State.role === 'admin'
    ? `<div class="tx-actions">
        <button class="tx-act-btn" onclick="editTransaction(${t.id})">Edit</button>
        <button class="tx-act-btn del" onclick="deleteTransaction(${t.id})">Delete</button>
       </div>`
    : '';
  return `
    <div class="tx-item" id="tx-${t.id}">
      <div class="tx-icon ${t.type}">${icon}</div>
      <div class="tx-info">
        <div class="tx-desc">${escHtml(t.desc)}</div>
        <div class="tx-meta">
          <span class="tx-cat-badge">${t.category}</span>
          <span>${t.type === 'income' ? 'Income' : 'Expense'}</span>
        </div>
        ${adminEdit}
      </div>
      <div class="tx-right">
        <div class="tx-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${fmt.format(t.amount)}</div>
        <div class="tx-date">${friendlyDate(t.date)}</div>
      </div>
    </div>`;
}

// ─── TRANSACTIONS TABLE ──────────────────────────────────────
function getFilteredTx() {
  let txs = [...State.transactions];
  const f = State.filters;

  if (f.search) {
    const q = f.search.toLowerCase();
    txs = txs.filter(t => t.desc.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }
  if (f.type) txs = txs.filter(t => t.type === f.type);
  if (f.category) txs = txs.filter(t => t.category === f.category);
  if (f.month) txs = txs.filter(t => monthKey(t.date) === f.month);

  const [field, dir] = f.sort.split('-');
  txs.sort((a, b) => {
    let va = field === 'date' ? new Date(a.date) : a.amount;
    let vb = field === 'date' ? new Date(b.date) : b.amount;
    return dir === 'asc' ? va - vb : vb - va;
  });

  return txs;
}

function renderTransactions() {
  const txs = getFilteredTx();
  const table = document.getElementById('txTable');
  const empty = document.getElementById('txEmpty');
  const countEl = document.getElementById('txCount');

  countEl.textContent = `${txs.length} transaction${txs.length !== 1 ? 's' : ''}`;

  if (!txs.length) {
    table.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  const adminCols = State.role === 'admin' ? '<th>Actions</th>' : '';
  const rows = txs.map(t => {
    const icon = CAT_ICONS[t.category] || '📌';
    const adminCells = State.role === 'admin'
      ? `<td>
          <button class="btn btn-ghost btn-sm" onclick="editTransaction(${t.id})" style="padding:4px 10px">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteTransaction(${t.id})" style="margin-left:4px;padding:4px 10px">Del</button>
         </td>`
      : '';
    return `
      <tr>
        <td><span style="font-size:1.1rem">${icon}</span> ${escHtml(t.desc)}</td>
        <td><span class="badge badge-cat">${t.category}</span></td>
        <td><span class="badge badge-${t.type}">${t.type}</span></td>
        <td style="font-family:var(--font-mono);color:var(--${t.type === 'income' ? 'income' : 'expense'}-color)">
          ${t.type === 'income' ? '+' : '-'}${fmt.format(t.amount)}
        </td>
        <td style="color:var(--text-secondary);font-size:0.82rem">${friendlyDate(t.date)}</td>
        ${adminCells}
      </tr>`;
  }).join('');

  table.innerHTML = `
    <table class="tx-table">
      <thead><tr>
        <th>Description</th><th>Category</th><th>Type</th><th>Amount</th><th>Date</th>
        ${adminCols}
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ─── FILTER SETUP ─────────────────────────────────────────────
function setupFilters() {
  // Categories
  const allCats = [...new Set(State.transactions.map(t => t.category))].sort();
  const catSel = document.getElementById('filterCategory');
  catSel.innerHTML = '<option value="">All Categories</option>' +
    allCats.map(c => `<option value="${c}">${c}</option>`).join('');

  // Months
  const allMonths = [...new Set(State.transactions.map(t => monthKey(t.date)))].sort().reverse();
  const monSel = document.getElementById('filterMonth');
  monSel.innerHTML = '<option value="">All Months</option>' +
    allMonths.map(m => `<option value="${m}">${monthLabel(m)}</option>`).join('');
}

function applyFilters() {
  State.filters.search = document.getElementById('searchInput').value;
  State.filters.type = document.getElementById('filterType').value;
  State.filters.category = document.getElementById('filterCategory').value;
  State.filters.month = document.getElementById('filterMonth').value;
  State.filters.sort = document.getElementById('sortBy').value;
  renderTransactions();
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterType').value = '';
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterMonth').value = '';
  document.getElementById('sortBy').value = 'date-desc';
  State.filters = { search: '', type: '', category: '', month: '', sort: 'date-desc' };
  renderTransactions();
}

// ─── INSIGHTS ─────────────────────────────────────────────────
function renderInsights() {
  const cats = computeCategoryTotals();
  const monthly = computeMonthlyData();
  const keys = Object.keys(monthly).sort();
  const stats = computeStats();

  // Build insight cards
  const lastTwo = keys.slice(-2);
  const curr = monthly[lastTwo[1]] || { income: 0, expense: 0 };
  const prev = monthly[lastTwo[0]] || { income: 0, expense: 0 };
  const expChange = prev.expense ? ((curr.expense - prev.expense) / prev.expense * 100).toFixed(1) : 0;
  const topCat = cats[0] ? cats[0][0] : 'N/A';
  const topAmt = cats[0] ? cats[0][1] : 0;

  // Most frequent category
  const catCount = {};
  State.transactions.filter(t => t.type === 'expense').forEach(t => {
    catCount[t.category] = (catCount[t.category] || 0) + 1;
  });
  const mostFreq = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];

  // Avg monthly expense
  const avgExp = keys.length ? Object.values(monthly).reduce((s, v) => s + v.expense, 0) / keys.length : 0;
  const avgInc = keys.length ? Object.values(monthly).reduce((s, v) => s + v.income, 0) / keys.length : 0;

  const insights = [
    {
      icon: '🏆',
      label: 'Top Spending Category',
      value: topCat,
      sub: `Total: ${fmtShort(topAmt)} across all time`,
    },
    {
      icon: '📊',
      label: 'Month-over-Month Expenses',
      value: (expChange >= 0 ? '↑ ' : '↓ ') + Math.abs(expChange) + '%',
      sub: `${monthLabel(lastTwo[1])} vs ${monthLabel(lastTwo[0])}`,
      cls: expChange >= 0 ? 'color:var(--expense-color)' : 'color:var(--income-color)',
    },
    {
      icon: '💰',
      label: 'Savings Rate',
      value: stats.savingsRate.toFixed(1) + '%',
      sub: stats.savingsRate >= 20 ? '✅ Great! Above 20% target' : '⚠️ Consider cutting expenses',
    },
    {
      icon: '🔄',
      label: 'Most Frequent Category',
      value: mostFreq ? mostFreq[0] : 'N/A',
      sub: mostFreq ? `${mostFreq[1]} transactions recorded` : '',
    },
    {
      icon: '📅',
      label: 'Avg Monthly Income',
      value: fmtShort(avgInc),
      sub: `Over ${keys.length} months`,
    },
    {
      icon: '📉',
      label: 'Avg Monthly Expenses',
      value: fmtShort(avgExp),
      sub: avgExp < avgInc ? '✅ Below income' : '⚠️ Exceeds average income',
    },
  ];

  const grid = document.getElementById('insightsGrid');
  grid.innerHTML = insights.map(i => `
    <div class="insight-card">
      <div class="insight-icon">${i.icon}</div>
      <div class="insight-label">${i.label}</div>
      <div class="insight-value" style="${i.cls || ''}">${i.value}</div>
      <div class="insight-sub">${i.sub}</div>
    </div>`).join('');

  renderBarChart();
  renderHbarChart();
}

// ─── VIEW SWITCHING ───────────────────────────────────────────
function switchView(view) {
  State.currentView = view;

  // ✅ Save immediately (this is correct)
  localStorage.setItem('fynance_view', view);

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById('view-' + view).classList.add('active');
  document.querySelector(`[data-view="${view}"]`)?.classList.add('active');

  if (view === 'dashboard') renderDashboard();
  else if (view === 'transactions') { setupFilters(); renderTransactions(); }
  else if (view === 'insights') renderInsights();

  const mc = document.querySelector('.main-content');
  if (mc) mc.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: 'instant' });

  document.getElementById('sidebar').classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('visible');
}

// ─── ROLE ─────────────────────────────────────────────────────
function switchRole(role) {
  State.role = role;
  saveToStorage();
  applyRoleUI();
  // Re-render current view
  switchView(State.currentView);
  showToast(`Switched to ${role === 'admin' ? '⚡ Admin' : '👁 Viewer'} role`, 'success');
  document.getElementById('mobileRole').textContent = role === 'admin' ? '⚡ Admin' : '👁 Viewer';
}

function applyRoleUI() {
  const isAdmin = State.role === 'admin';
  document.querySelectorAll('.admin-only').forEach(el => {
    el.classList.toggle('hidden', !isAdmin);
  });
  document.getElementById('roleSelect').value = State.role;
}

// ─── THEME ────────────────────────────────────────────────────
function toggleTheme() {
  State.theme = State.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', State.theme);
  updateThemeUI();
  saveToStorage();
  // Redraw charts
  setTimeout(() => switchView(State.currentView), 50);
}

function updateThemeUI() {
  const isDark = State.theme === 'dark';
  document.getElementById('themeIcon').textContent  = isDark ? '☀️' : '🌙';
  document.getElementById('themeLabel').textContent = isDark ? 'Switch to Light' : 'Switch to Dark';
}

// ─── CHART PERIOD ─────────────────────────────────────────────
function setChartPeriod(period, btn) {
  State.chartPeriod = period;
  document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderLineChart();
}

// ─── MODAL ────────────────────────────────────────────────────
function openAddModal() {
  document.getElementById('editId').value = '';
  document.getElementById('modalTitle').textContent = 'Add Transaction';
  document.getElementById('fDesc').value = '';
  document.getElementById('fAmount').value = '';
  document.getElementById('fType').value = 'expense';
  document.getElementById('fCategory').value = 'Food';
  document.getElementById('fDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('modal').classList.remove('hidden');
}

function editTransaction(id) {
  const tx = State.transactions.find(t => t.id === id);
  if (!tx) return;
  document.getElementById('editId').value = id;
  document.getElementById('modalTitle').textContent = 'Edit Transaction';
  document.getElementById('fDesc').value = tx.desc;
  document.getElementById('fAmount').value = tx.amount;
  document.getElementById('fType').value = tx.type;
  document.getElementById('fCategory').value = tx.category;
  document.getElementById('fDate').value = tx.date;
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modal')) closeModal();
}

function saveTransaction() {
  const desc = document.getElementById('fDesc').value.trim();
  const amount = parseFloat(document.getElementById('fAmount').value);
  const type = document.getElementById('fType').value;
  const category = document.getElementById('fCategory').value;
  const date = document.getElementById('fDate').value;

  if (!desc || isNaN(amount) || amount <= 0 || !date) {
    showToast('Please fill all fields correctly', 'error');
    return;
  }

  const editId = document.getElementById('editId').value;

  if (editId) {
    const idx = State.transactions.findIndex(t => t.id === parseInt(editId));
    if (idx !== -1) {
      State.transactions[idx] = { ...State.transactions[idx], desc, amount, type, category, date };
      showToast('Transaction updated!', 'success');
    }
  } else {
    const newId = Math.max(0, ...State.transactions.map(t => t.id)) + 1;
    State.transactions.unshift({ id: newId, desc, amount, type, category, date });
    showToast('Transaction added!', 'success');
  }

  saveToStorage();
  setupFilters();
  closeModal();
  switchView(State.currentView);
}

function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;
  State.transactions = State.transactions.filter(t => t.id !== id);
  saveToStorage();
  setupFilters();
  showToast('Transaction deleted', 'success');
  switchView(State.currentView);
}

// ─── EXPORT ───────────────────────────────────────────────────
function exportData(format) {
  const txs = getFilteredTx();
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(txs, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'fynance-transactions.json');
  } else {
    const header = 'Date,Description,Category,Type,Amount\n';
    const rows = txs.map(t => `${t.date},"${t.desc}",${t.category},${t.type},${t.amount}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    downloadBlob(blob, 'fynance-transactions.csv');
  }
  showToast('Exported successfully!', 'success');
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─── TOAST ────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3000);
}

// ─── MOBILE SIDEBAR ──────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('visible');
}

// ─── HELPERS ─────────────────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── INIT ─────────────────────────────────────────────────────
function init() {
  // ✅ Hide UI first
  document.body.classList.add('app-loading');

  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.onclick = toggleSidebar;
  document.body.appendChild(overlay);

  loadFromStorage();

  applyRoleUI();
  document.documentElement.setAttribute('data-theme', State.theme);
  updateThemeUI();

  document.getElementById('mobileRole').textContent =
    State.role === 'admin' ? '⚡ Admin' : '👁 Viewer';

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo({ top: 0, behavior: 'instant' });

  // ✅ Render correct tab
  switchView(State.currentView);

  // ✅ Show UI AFTER everything is ready
  document.body.classList.remove('app-loading');
}

document.addEventListener('DOMContentLoaded', init);