import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const money = (amount) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const initialForm = () => ({
  type: "EXPENSE",
  amount: "",
  category: "",
  description: "",
  date: today(),
});

const categoryColors = [
  "#f43f5e",
  "#a855f7",
  "#fb7185",
  "#8b5cf6",
  "#34d399",
  "#60a5fa",
  "#fbbf24",
];

function Dashboard() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("spendwise_user") || "{}");
    } catch {
      return {};
    }
  }, []);

  // Load transactions from the backend.
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/transactions");

      setTransactions(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("spendwise_token");
        localStorage.removeItem("spendwise_user");
        navigate("/login");
        return;
      }

      setError(
        "Could not load transactions. Check your backend and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Load categories created on the Categories page.
  const loadCategories = useCallback(async () => {
    try {
      const response = await api.get("/categories");

      setAvailableCategories(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("spendwise_token");
        localStorage.removeItem("spendwise_user");
        navigate("/login");
        return;
      }

      setError("Could not load categories. Please try again.");
    }
  }, [navigate]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Summary calculations.
  const totalIncome = transactions
    .filter((item) => item.type === "INCOME")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalExpenses = transactions
    .filter((item) => item.type === "EXPENSE")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const balance = totalIncome - totalExpenses;

  const incomeCount = transactions.filter(
    (item) => item.type === "INCOME"
  ).length;

  const expenseCount = transactions.filter(
    (item) => item.type === "EXPENSE"
  ).length;

  // Search and sort transactions.
  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions
      .filter((item) => {
        const searchable = [
          item.description || "",
          item.category || "",
          item.type || "",
          item.date || "",
          String(item.amount ?? ""),
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      })
      .sort((a, b) => {
        const dateComparison = String(b.date || "").localeCompare(
          String(a.date || "")
        );

        if (dateComparison !== 0) {
          return dateComparison;
        }

        return String(b.id || "").localeCompare(String(a.id || ""));
      });
  }, [transactions, search]);

  // Group expenses by category.
  const categoryTotals = transactions
    .filter((item) => item.type === "EXPENSE")
    .reduce((result, item) => {
      const category = item.category?.trim() || "Other";

      result[category] =
        (result[category] || 0) + Number(item.amount || 0);

      return result;
    }, {});

  const categories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const largestCategoryExpense = Math.max(
    1,
    ...categories.map(([, amount]) => amount)
  );

  // Build the last six months using transaction dates.
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - offset,
        1
      );

      months.push({
        key: `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`,
        label: date.toLocaleDateString("en-MY", {
          month: "short",
        }),
        income: 0,
        expenses: 0,
      });
    }

    transactions.forEach((item) => {
      const transactionMonth = String(item.date || "").slice(0, 7);

      const month = months.find(
        (entry) => entry.key === transactionMonth
      );

      if (!month) return;

      const amount = Number(item.amount || 0);

      if (item.type === "INCOME") {
        month.income += amount;
      } else if (item.type === "EXPENSE") {
        month.expenses += amount;
      }
    });

    return months;
  }, [transactions]);

  // Use a shared scale for both chart series.
  const chartMax = Math.max(
    0,
    ...monthlyData.flatMap((item) => [
      item.income,
      item.expenses,
    ])
  );

  function logout() {
    localStorage.removeItem("spendwise_token");
    localStorage.removeItem("spendwise_user");
    navigate("/login");
  }

  function openAddForm() {
    setEditingId(null);
    setForm(initialForm());
    setError("");
    setModalOpen(true);
  }

  function openEditForm(transaction) {
    setEditingId(transaction.id);

    setForm({
      type: transaction.type || "EXPENSE",
      amount: String(transaction.amount ?? ""),
      category: transaction.category || "",
      description: transaction.description || "",
      date: transaction.date || today(),
    });

    setError("");
    setModalOpen(true);
  }

  // When the transaction type changes, clear the selected category.
  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "type" ? { category: "" } : {}),
    }));
  }

  async function saveTransaction(event) {
    event.preventDefault();
    setError("");

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    if (!form.category.trim()) {
      setError("Please select a category.");
      return;
    }

    // Make sure the selected category exists and matches the transaction type.
    const selectedCategory = availableCategories.find(
      (category) =>
        category.name === form.category &&
        category.type === form.type
    );

    if (!selectedCategory) {
      setError(
        "Please select a valid category for the selected transaction type."
      );
      return;
    }

    if (!form.date) {
      setError("Please select a transaction date.");
      return;
    }

    setSaving(true);

    const payload = {
      type: form.type,
      amount,
      category: form.category.trim(),
      description: form.description.trim(),
      date: form.date,
    };

    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload);
      } else {
        await api.post("/transactions", payload);
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(initialForm());

      await loadTransactions();
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("spendwise_token");
        localStorage.removeItem("spendwise_user");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.error ||
          "Could not save the transaction. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteTransaction(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    setError("");

    try {
      await api.delete(`/transactions/${id}`);
      await loadTransactions();
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("spendwise_token");
        localStorage.removeItem("spendwise_user");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.error ||
          "Could not delete the transaction. Please try again."
      );
    }
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setError("");
  }

  // Categories available for the currently selected transaction type.
  const filteredCategories = availableCategories.filter(
    (category) => category.type === form.type
  );

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
          <Link className="nav-link active" to="/dashboard">
            ⌂ Dashboard
          </Link>

          <Link className="nav-link" to="/transactions">
            ▤ Transactions
          </Link>

          <Link className="nav-link" to="/categories">
            ◇ Categories
          </Link>

          <Link className="nav-link" to="/reports">
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

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="search-box">
            <input
              type="search"
              placeholder="Search transactions, categories..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search transactions"
            />
          </div>

          <span className="month-label">
            {new Date().toLocaleDateString("en-MY", {
              month: "long",
              year: "numeric",
            })}
          </span>

          <div className="user-chip">
            <div className="avatar">
              {(user.name || user.email || "S")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>{user.name || "SpendWise User"}</strong>
              <small>{user.email || "Your finance dashboard"}</small>
            </div>
          </div>
        </header>

        <section className="page-heading">
          <p>Welcome back,</p>
          <h1>{user.name || "Money Manager"} 👋</h1>
          <p className="description">
            Here is your financial overview.
          </p>
        </section>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        <section className="summary-grid">
          <article className="summary-card">
            <div className="summary-label">Total Income</div>
            <div className="summary-value income-text">
              {money(totalIncome)}
            </div>
            <div className="summary-note">↗ Money received</div>
          </article>

          <article className="summary-card">
            <div className="summary-label">Total Expenses</div>
            <div className="summary-value expense-text">
              {money(totalExpenses)}
            </div>
            <div className="summary-note">↘ Money spent</div>
          </article>

          <article className="summary-card">
            <div className="summary-label">Balance</div>
            <div className="summary-value balance-text">
              {money(balance)}
            </div>
            <div className="summary-note">
              Income minus expenses
            </div>
          </article>

          <article className="summary-card">
            <div className="summary-label">Transactions</div>
            <div className="summary-value">{transactions.length}</div>
            <div className="summary-note">
              {incomeCount} income · {expenseCount} expense
            </div>
          </article>
        </section>

        <section className="chart-grid">
          <article className="panel">
            <div className="panel-heading">
              <h2>Income vs Expenses</h2>
              <span className="muted">Last 6 months</span>
            </div>

            {loading ? (
              <p className="loading-state">Loading chart...</p>
            ) : (
              <>
                <div className="monthly-chart">
                  {monthlyData.map((month) => {
                    const incomeHeight =
                      chartMax > 0
                        ? (month.income / chartMax) * 100
                        : 0;

                    const expenseHeight =
                      chartMax > 0
                        ? (month.expenses / chartMax) * 100
                        : 0;

                    return (
                      <div className="month-column" key={month.key}>
                        <div className="month-bars">
                          <div
                            className="chart-bar income-bar"
                            title={`Income: ${money(month.income)}`}
                            style={{
                              height:
                                month.income > 0
                                  ? `${Math.max(2, incomeHeight)}%`
                                  : "0%",
                            }}
                          />

                          <div
                            className="chart-bar expense-bar"
                            title={`Expenses: ${money(month.expenses)}`}
                            style={{
                              height:
                                month.expenses > 0
                                  ? `${Math.max(2, expenseHeight)}%`
                                  : "0%",
                            }}
                          />
                        </div>

                        <small className="muted">{month.label}</small>
                      </div>
                    );
                  })}
                </div>

                <div className="chart-legend">
                  <span>
                    <i
                      className="legend-dot"
                      style={{ background: "#f43f5e" }}
                    />
                    Income
                  </span>

                  <span>
                    <i
                      className="legend-dot"
                      style={{ background: "#a855f7" }}
                    />
                    Expenses
                  </span>
                </div>
              </>
            )}
          </article>

          <article className="panel" id="categories">
            <div className="panel-heading">
              <h2>Expenses by Category</h2>
            </div>

            {categories.length === 0 ? (
              <p className="empty-state">
                Your expense categories will appear here once you add
                expenses.
              </p>
            ) : (
              <div className="category-list">
                {categories.map(([category, amount], index) => (
                  <div className="category-item" key={category}>
                    <div className="category-row">
                      <span>{category}</span>
                      <span>{money(amount)}</span>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${
                            (amount / largestCategoryExpense) * 100
                          }%`,
                          background:
                            categoryColors[index % categoryColors.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section
          className="panel transactions-panel"
          id="transactions"
        >
          <div className="panel-heading">
            <div>
              <h2>Recent Transactions</h2>
              <p className="muted transaction-subtitle">
                Your latest income and expenses
              </p>
            </div>

            <div className="section-actions">
              <button
                type="button"
                className="primary-button"
                onClick={openAddForm}
              >
                + Add Transaction
              </button>
            </div>
          </div>

          {loading ? (
            <p className="loading-state">
              Loading your transactions...
            </p>
          ) : filteredTransactions.length === 0 ? (
            <div className="empty-state">
              {search
                ? "No transactions match your search."
                : "No transactions yet. Add your first transaction to get started."}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th className="amount-column">Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map((item) => (
                    <tr key={item.id}>
                      <td className="date-cell">
                        {item.date || "—"}
                      </td>

                      <td className="description-cell">
                        {item.description?.trim() || "—"}
                      </td>

                      <td className="category-cell">
                        {item.category || "Other"}
                      </td>

                      <td>
                        <span
                          className={`type-pill ${
                            item.type === "INCOME"
                              ? "income"
                              : "expense"
                          }`}
                        >
                          {item.type === "INCOME"
                            ? "↑ Income"
                            : "↓ Expense"}
                        </span>
                      </td>

                      <td
                        className={`amount-cell ${
                          item.type === "INCOME"
                            ? "income-text"
                            : "expense-text"
                        }`}
                      >
                        <span>
                          {item.type === "EXPENSE" ? "− " : "+ "}
                          {money(item.amount)}
                        </span>
                      </td>

                      <td>
                        <div className="section-actions">
                          <button
                            type="button"
                            className="icon-button"
                            title="Edit transaction"
                            aria-label="Edit transaction"
                            onClick={() => openEditForm(item)}
                          >
                            ✎
                          </button>

                          <button
                            type="button"
                            className="icon-button expense-text"
                            title="Delete transaction"
                            aria-label="Delete transaction"
                            onClick={() => deleteTransaction(item.id)}
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
          >
            <h2 className="modal-title" id="transaction-modal-title">
              {editingId ? "Edit Transaction" : "Add Transaction"}
            </h2>

            <form
              className="transaction-form"
              onSubmit={saveTransaction}
            >
              <label className="form-field">
                Transaction type
                <select
                  className="form-control"
                  name="type"
                  value={form.type}
                  onChange={updateField}
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </label>

              <label className="form-field">
                Amount (MYR)
                <input
                  className="form-control"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={updateField}
                  placeholder="0.00"
                  required
                />
              </label>

              <label className="form-field">
                Category
                <select
                  className="form-control"
                  name="category"
                  value={form.category}
                  onChange={updateField}
                  required
                >
                  <option value="">Select a category</option>

                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {filteredCategories.length === 0 && (
                  <small className="muted">
                    No {form.type.toLowerCase()} categories found. Create one
                    on the Categories page first.
                  </small>
                )}
              </label>

              <label className="form-field">
                Description
                <input
                  className="form-control"
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  placeholder="What was this transaction for?"
                  maxLength={200}
                />
              </label>

              <label className="form-field">
                Date
                <input
                  className="form-control"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={updateField}
                  required
                />
              </label>

              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving || filteredCategories.length === 0}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Add Transaction"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Dashboard;