
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const money = (amount) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const todayString = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const shiftMonth = (date, amount) => {
  const result = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  return result;
};

const formatMonth = (date) =>
  date.toLocaleDateString("en-MY", { month: "short" });

const formatDate = (dateString) => {
  if (!dateString) return "—";

  const parts = String(dateString).split("-");
  if (parts.length !== 3) return dateString;

  const date = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );

  return date.toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getMonthStart = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;

const getPresetRange = (preset) => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let from;
  const to = todayString();

  switch (preset) {
    case "3M":
      from = getMonthStart(shiftMonth(currentMonthStart, -2));
      break;
    case "6M":
      from = getMonthStart(shiftMonth(currentMonthStart, -5));
      break;
    case "YEAR":
      from = `${now.getFullYear()}-01-01`;
      break;
    case "CUSTOM":
      from = getMonthStart(currentMonthStart);
      break;
    case "MONTH":
    default:
      from = getMonthStart(currentMonthStart);
      break;
  }

  return { from, to };
};

const CHART_COLORS = [
  "#F15B79",
  "#B879F8",
  "#70D6A5",
  "#F0C674",
  "#64B5F6",
  "#FF9966",
  "#4DD0C8",
  "#E879F9",
];

function Reports() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [preset, setPreset] = useState("MONTH");
  const initialRange = getPresetRange("MONTH");
  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);

  const [draftFrom, setDraftFrom] = useState(initialRange.from);
  const [draftTo, setDraftTo] = useState(initialRange.to);

  const logout = useCallback(() => {
    localStorage.removeItem("spendwise_token");
    localStorage.removeItem("spendwise_user");
    navigate("/login");
  }, [navigate]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/transactions");

      setTransactions(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) {
        logout();
        return;
      }

      setError(
        err.response?.data?.error ||
          "Could not load report data. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const periodTransactions = useMemo(() => {
    return transactions
      .filter((item) => {
        const date = String(item.date || "");

        return (
          date &&
          date >= dateFrom &&
          date <= dateTo
        );
      })
      .sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || ""))
      );
  }, [transactions, dateFrom, dateTo]);

  const totalIncome = useMemo(
    () =>
      periodTransactions
        .filter((item) => item.type === "INCOME")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [periodTransactions]
  );

  const totalExpenses = useMemo(
    () =>
      periodTransactions
        .filter((item) => item.type === "EXPENSE")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [periodTransactions]
  );

  const netCashFlow = totalIncome - totalExpenses;

  const savingsRate =
    totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : null;

  const monthlyData = useMemo(() => {
    if (!dateFrom || !dateTo || dateFrom > dateTo) return [];

    const startParts = dateFrom.split("-").map(Number);
    const endParts = dateTo.split("-").map(Number);

    const start = new Date(startParts[0], startParts[1] - 1, 1);
    const end = new Date(endParts[0], endParts[1] - 1, 1);

    const months = [];
    const cursor = new Date(start);

    // Limit chart size for very long custom date ranges.
    while (cursor <= end && months.length < 36) {
      const key = `${cursor.getFullYear()}-${String(
        cursor.getMonth() + 1
      ).padStart(2, "0")}`;

      months.push({
        key,
        label: formatMonth(cursor),
        year: String(cursor.getFullYear()).slice(-2),
        income: 0,
        expenses: 0,
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }

    const monthLookup = new Map(
      months.map((month) => [month.key, month])
    );

    periodTransactions.forEach((item) => {
      const key = String(item.date || "").slice(0, 7);
      const month = monthLookup.get(key);

      if (!month) return;

      if (item.type === "INCOME") {
        month.income += Number(item.amount || 0);
      } else if (item.type === "EXPENSE") {
        month.expenses += Number(item.amount || 0);
      }
    });

    return months;
  }, [periodTransactions, dateFrom, dateTo]);

  const maxMonthlyAmount = Math.max(
    1,
    ...monthlyData.flatMap((month) => [
      month.income,
      month.expenses,
    ])
  );

  const expenseBreakdown = useMemo(() => {
    const totals = new Map();

    periodTransactions
      .filter((item) => item.type === "EXPENSE")
      .forEach((item) => {
        const name = item.category || "Uncategorized";
        totals.set(
          name,
          (totals.get(name) || 0) + Number(item.amount || 0)
        );
      });

    return [...totals.entries()]
      .map(([name, amount], index) => ({
        name,
        amount,
        color: CHART_COLORS[index % CHART_COLORS.length],
        percentage:
          totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodTransactions, totalExpenses]);

  const donutGradient = useMemo(() => {
    if (totalExpenses <= 0 || expenseBreakdown.length === 0) {
      return "conic-gradient(#392542 0% 100%)";
    }

    let currentPercentage = 0;

    const segments = expenseBreakdown.map((category) => {
      const start = currentPercentage;
      currentPercentage += category.percentage;

      return `${category.color} ${start}% ${currentPercentage}%`;
    });

    return `conic-gradient(${segments.join(", ")})`;
  }, [expenseBreakdown, totalExpenses]);

  function choosePreset(nextPreset) {
    const range = getPresetRange(nextPreset);

    setPreset(nextPreset);
    setDateFrom(range.from);
    setDateTo(range.to);
    setDraftFrom(range.from);
    setDraftTo(range.to);
    setError("");
  }

  function applyCustomRange(event) {
    event.preventDefault();

    if (!draftFrom || !draftTo) {
      setError("Please select both the start date and end date.");
      return;
    }

    if (draftFrom > draftTo) {
      setError("The start date cannot be after the end date.");
      return;
    }

    setDateFrom(draftFrom);
    setDateTo(draftTo);
    setPreset("CUSTOM");
    setError("");
  }

  const periodLabel = useMemo(() => {
    if (!dateFrom || !dateTo) return "Selected period";

    return `${formatDate(dateFrom)} – ${formatDate(dateTo)}`;
  }, [dateFrom, dateTo]);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">◈</span>
          <div>
            SpendWise
            <small>Your Money, Your Control</small>
          </div>
        </div>

        <nav className="nav-links">
          <Link className="nav-link" to="/dashboard">
            ⌂ Dashboard
          </Link>

          <Link className="nav-link" to="/transactions">
            ▤ Transactions
          </Link>

          <Link className="nav-link" to="/categories">
            ◇ Categories
          </Link>

          <Link className="nav-link active" to="/reports">
            ▥ Reports
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            ✦ Manage smarter
            <br />
            Spend wiser, one step at a time.
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={logout}
          >
            ↪ Log out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="month-label">
              {new Date().toLocaleDateString("en-MY", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        <section className="page-heading">
          <p>Understand your money</p>
          <h1>Financial Reports</h1>
          <p className="description">
            Review your financial performance and spending patterns.
          </p>
        </section>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {/* Reporting period */}
        <section className="panel report-period-panel">
          <div className="report-period-heading">
            <div>
              <h2>Reporting Period</h2>
              <p className="muted">
                Choose the period you want to analyse.
              </p>
            </div>
          </div>

          <div className="period-presets">
            {[
              { value: "MONTH", label: "This Month" },
              { value: "3M", label: "Last 3 Months" },
              { value: "6M", label: "Last 6 Months" },
              { value: "YEAR", label: "This Year" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={`period-preset ${
                  preset === option.value ? "active" : ""
                }`}
                onClick={() => choosePreset(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <form
            className="report-period-controls"
            onSubmit={applyCustomRange}
          >
            <label className="form-field">
              From date
              <input
                className="form-control"
                type="date"
                value={draftFrom}
                max={draftTo || undefined}
                onChange={(event) => setDraftFrom(event.target.value)}
                required
              />
            </label>

            <label className="form-field">
              To date
              <input
                className="form-control"
                type="date"
                value={draftTo}
                min={draftFrom || undefined}
                max={todayString()}
                onChange={(event) => setDraftTo(event.target.value)}
                required
              />
            </label>

            <div className="report-custom-action">
              <button type="submit" className="primary-button">
                Apply Date Range
              </button>
            </div>
          </form>

          <p className="muted report-range-label">
            Showing data for: <strong>{periodLabel}</strong>
          </p>
        </section>

        {loading ? (
          <div className="panel">
            <p className="loading-state">Loading financial reports...</p>
          </div>
        ) : (
          <>
            {/* Financial summary */}
            <section className="summary-grid report-summary-grid">
              <article className="summary-card">
                <div className="summary-label">Total Income</div>
                <div className="summary-value income-text">
                  {money(totalIncome)}
                </div>
                <div className="summary-note">Money received</div>
              </article>

              <article className="summary-card">
                <div className="summary-label">Total Expenses</div>
                <div className="summary-value expense-text">
                  {money(totalExpenses)}
                </div>
                <div className="summary-note">Money spent</div>
              </article>

              <article className="summary-card">
                <div className="summary-label">Net Cash Flow</div>
                <div
                  className={`summary-value ${
                    netCashFlow >= 0 ? "income-text" : "expense-text"
                  }`}
                >
                  {money(netCashFlow)}
                </div>
                <div className="summary-note">
                  Income minus expenses
                </div>
              </article>

              <article className="summary-card">
                <div className="summary-label">Savings Rate</div>
                <div className="summary-value report-savings-value">
                  {savingsRate === null
                    ? "N/A"
                    : `${savingsRate.toFixed(1)}%`}
                </div>
                <div className="summary-note">
                  {savingsRate === null
                    ? "No income recorded"
                    : "Net cash flow ÷ income"}
                </div>
              </article>
            </section>

            {/* Monthly chart and expense breakdown */}
            <section className="reports-chart-grid">
              <article className="panel report-chart-panel">
                <div className="report-section-heading">
                  <h2>Income vs. Expenses</h2>
                  <p className="muted">
                    Monthly comparison for the selected period.
                  </p>
                </div>

                <div className="report-chart-legend">
                  <span>
                    <i className="legend-dot income-dot" />
                    Income
                  </span>
                  <span>
                    <i className="legend-dot expense-dot" />
                    Expenses
                  </span>
                </div>

                {monthlyData.length === 0 ? (
                  <div className="empty-state">
                    No monthly data available for this period.
                  </div>
                ) : (
                  <div
                    className="monthly-chart"
                    aria-label="Monthly income and expense comparison"
                  >
                    {monthlyData.map((month) => {
                      const incomeHeight =
                        (month.income / maxMonthlyAmount) * 100;
                      const expenseHeight =
                        (month.expenses / maxMonthlyAmount) * 100;

                      return (
                        <div
                          className="monthly-chart-column"
                          key={month.key}
                          title={`${month.key}: Income ${money(
                            month.income
                          )}, Expenses ${money(month.expenses)}`}
                        >
                          <div className="monthly-chart-bars">
                            <div
                              className="monthly-bar income-bar"
                              style={{
                                height: `${month.income > 0 ? Math.max(incomeHeight, 3) : 0}%`,
                              }}
                            />
                            <div
                              className="monthly-bar expense-bar"
                              style={{
                                height: `${month.expenses > 0 ? Math.max(expenseHeight, 3) : 0}%`,
                              }}
                            />
                          </div>

                          <span className="monthly-chart-label">
                            {month.label}
                            <br />
                            <span>{month.year}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>

              <article className="panel report-chart-panel">
                <div className="report-section-heading">
                  <h2>Expense Breakdown</h2>
                  <p className="muted">
                    Where your money goes.
                  </p>
                </div>

                {expenseBreakdown.length === 0 ? (
                  <div className="empty-state">
                    No expenses recorded for this period.
                  </div>
                ) : (
                  <>
                    <div className="category-chart">
                      <div
                        className="category-donut"
                        style={{ background: donutGradient }}
                        role="img"
                        aria-label="Expense breakdown by category"
                      >
                        <div className="category-donut-center">
                          <span>Total expenses</span>
                          <strong>{money(totalExpenses)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="category-legend">
                      {expenseBreakdown.map((category) => (
                        <div
                          className="category-legend-row"
                          key={category.name}
                        >
                          <i
                            className="category-color-dot"
                            style={{ background: category.color }}
                          />

                          <span className="category-legend-name">
                            {category.name}
                          </span>

                          <span className="category-legend-percent">
                            {category.percentage.toFixed(1)}%
                          </span>

                          <strong>{money(category.amount)}</strong>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </article>
            </section>

            {/* Transaction details */}
            <section className="panel report-transactions-panel">
              <div className="panel-heading">
                <div>
                  <h2>Transaction Details</h2>
                  <p className="muted">
                    {periodTransactions.length} transaction(s) in this period
                  </p>
                </div>

                <Link
                  to="/transactions"
                  className="secondary-button report-view-all"
                >
                  View Transactions
                </Link>
              </div>

              {periodTransactions.length === 0 ? (
                <div className="empty-state">
                  No transactions found for the selected period.
                </div>
              ) : (
                <div className="report-table-wrap">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th className="report-amount-cell">Amount</th>
                      </tr>
                    </thead>

                    <tbody>
                      {periodTransactions.map((item) => (
                        <tr key={item.id}>
                          <td>{formatDate(item.date)}</td>
                          <td>
                            <strong>
                              {item.category || "Uncategorized"}
                            </strong>
                          </td>
                          <td>
                            {item.description?.trim() || "No description"}
                          </td>
                          <td>
                            <span
                              className={
                                item.type === "INCOME"
                                  ? "report-type-income"
                                  : "report-type-expense"
                              }
                            >
                              {item.type === "INCOME"
                                ? "Income"
                                : "Expense"}
                            </span>
                          </td>
                          <td
                            className={`report-amount-cell ${
                              item.type === "INCOME"
                                ? "income-text"
                                : "expense-text"
                            }`}
                          >
                            {item.type === "INCOME" ? "+" : "−"}
                            {money(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Reports;
