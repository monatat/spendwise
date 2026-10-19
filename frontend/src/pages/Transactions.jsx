
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const money = (amount) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);

const emptyForm = () => ({
  type: "EXPENSE",
  amount: "",
  category: "",
  description: "",
  date: today(),
});

function Transactions() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const logout = useCallback(() => {
    localStorage.removeItem("spendwise_token");
    localStorage.removeItem("spendwise_user");
    navigate("/login");
  }, [navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [transactionResponse, categoryResponse] = await Promise.all([
        api.get("/transactions"),
        api.get("/categories"),
      ]);

      setTransactions(
        Array.isArray(transactionResponse.data)
          ? transactionResponse.data
          : []
      );

      setCategories(
        Array.isArray(categoryResponse.data)
          ? categoryResponse.data
          : []
      );
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) {
        logout();
        return;
      }

      setError(
        err.response?.data?.error ||
          "Could not load transactions. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((item) => item.type === "INCOME")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [transactions]
  );

  const totalExpenses = useMemo(
    () =>
      transactions
        .filter((item) => item.type === "EXPENSE")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions
      .filter((item) => {
        const matchesSearch = [
          item.category || "",
          item.description || "",
          item.date || "",
          item.type || "",
          String(item.amount ?? ""),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

        const matchesType =
          filterType === "ALL" || item.type === filterType;

        const matchesCategory =
          filterCategory === "ALL" ||
          item.category === filterCategory;

        const date = String(item.date || "");
        const matchesFrom = !filterFrom || date >= filterFrom;
        const matchesTo = !filterTo || date <= filterTo;

        return (
          matchesSearch &&
          matchesType &&
          matchesCategory &&
          matchesFrom &&
          matchesTo
        );
      })
      .sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || ""))
      );
  }, [
    transactions,
    search,
    filterType,
    filterCategory,
    filterFrom,
    filterTo,
  ]);

  const activeFilterCount = [
    filterType !== "ALL",
    filterCategory !== "ALL",
    Boolean(filterFrom),
    Boolean(filterTo),
  ].filter(Boolean).length;

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.type === form.type),
    [categories, form.type]
  );

  function resetFilters() {
    setFilterType("ALL");
    setFilterCategory("ALL");
    setFilterFrom("");
    setFilterTo("");
  }

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setModalOpen(true);
  }

  function openEditForm(item) {
    setEditingId(item.id);
    setForm({
      type: item.type || "EXPENSE",
      amount: String(item.amount ?? ""),
      category: item.category || "",
      description: item.description || "",
      date: item.date || today(),
    });
    setError("");
    setModalOpen(true);
  }

  function updateForm(event) {
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
      setError("Please enter an amount greater than zero.");
      return;
    }

    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    if (!form.date) {
      setError("Please select a date.");
      return;
    }

    const validCategory = categories.some(
      (category) =>
        category.name === form.category &&
        category.type === form.type
    );

    if (!validCategory) {
      setError("Select a category matching the transaction type.");
      return;
    }

    const payload = {
      type: form.type,
      amount,
      category: form.category,
      description: form.description.trim(),
      date: form.date,
    };

    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload);
      } else {
        await api.post("/transactions", payload);
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm());

      await loadData();
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) {
        logout();
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

  async function deleteTransaction(item) {
    const confirmed = window.confirm(
      `Delete this ${item.category || "transaction"} record?`
    );

    if (!confirmed) return;

    setError("");

    try {
      await api.delete(`/transactions/${item.id}`);
      await loadData();
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) {
        logout();
        return;
      }

      setError(
        err.response?.data?.error ||
          "Could not delete the transaction."
      );
    }
  }

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
          <Link className="nav-link active" to="/transactions">
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
          <p>Your money activity</p>
          <h1>Transactions</h1>
          <p className="description">
            Manage and review your income and expenses.
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
                totalIncome - totalExpenses >= 0
                  ? "income-text"
                  : "expense-text"
              }`}
            >
              {money(totalIncome - totalExpenses)}
            </div>
            <div className="summary-note">Income minus expenses</div>
          </article>
        </section>

        <section className="panel transactions-panel">
          <div className="panel-heading">
            <div>
              <h2>All Transactions</h2>
              <p className="muted transaction-subtitle">
                {filteredTransactions.length} transaction(s) found
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={openAddForm}
            >
              + Add Transaction
            </button>
          </div>

          {/* Search toolbar and floating filter panel */}
          <div className="transaction-filter-anchor">
            <div className="transaction-toolbar">
              <div className="search-box transaction-search">
                <input
                  type="search"
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search transactions"
                />
              </div>

              <button
                type="button"
                className="secondary-button filter-toggle"
                onClick={() => setFilterOpen((open) => !open)}
                aria-expanded={filterOpen}
              >
                ☷ Filter
                {activeFilterCount > 0 && (
                  <span className="filter-count">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {filterOpen && (
              <div className="transaction-filter-panel">
                <div className="transaction-filter-grid">
                  <label className="form-field">
                    Transaction type
                    <select
                      className="form-control"
                      value={filterType}
                      onChange={(event) =>
                        setFilterType(event.target.value)
                      }
                    >
                      <option value="ALL">All types</option>
                      <option value="INCOME">Income</option>
                      <option value="EXPENSE">Expenses</option>
                    </select>
                  </label>

                  <label className="form-field">
                    Category
                    <select
                      className="form-control"
                      value={filterCategory}
                      onChange={(event) =>
                        setFilterCategory(event.target.value)
                      }
                    >
                      <option value="ALL">All categories</option>
                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.name}
                        >
                          {category.name} (
                          {category.type === "INCOME" ? "Income" : "Expense"})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    From date
                    <input
                      className="form-control"
                      type="date"
                      value={filterFrom}
                      max={filterTo || undefined}
                      onChange={(event) =>
                        setFilterFrom(event.target.value)
                      }
                    />
                  </label>

                  <label className="form-field">
                    To date
                    <input
                      className="form-control"
                      type="date"
                      value={filterTo}
                      min={filterFrom || undefined}
                      onChange={(event) =>
                        setFilterTo(event.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={resetFilters}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setFilterOpen(false)}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Transaction list stays outside the floating panel */}
          {loading ? (
            <p className="loading-state">Loading transactions...</p>
          ) : filteredTransactions.length === 0 ? (
            <div className="empty-state">
              {transactions.length === 0
                ? "No transactions yet. Add your first transaction to get started."
                : "No transactions match your search or filters."}
            </div>
          ) : (
            <div className="transaction-list">
              {filteredTransactions.map((item) => (
                <article className="transaction-record" key={item.id}>
                  <div className="transaction-record-icon">
                    {item.type === "INCOME" ? "↙" : "↗"}
                  </div>

                  <div className="transaction-record-info">
                    <strong className="transaction-record-category">
                      {item.category || "Uncategorized"}
                    </strong>
                    <span className="transaction-record-description">
                      {item.description?.trim() || "No description"}
                    </span>
                    <span className="transaction-record-date">
                      {item.date || "No date"}
                    </span>
                  </div>

                  <div className="transaction-record-right">
                    <strong
                      className={
                        item.type === "INCOME"
                          ? "income-text"
                          : "expense-text"
                      }
                    >
                      {item.type === "INCOME" ? "+" : "−"}{" "}
                      {money(item.amount)}
                    </strong>
                    <span className="muted transaction-record-type">
                      {item.type === "INCOME" ? "Income" : "Expense"}
                    </span>
                    <div className="section-actions">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Edit transaction"
                        title="Edit"
                        onClick={() => openEditForm(item)}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="icon-button expense-text"
                        aria-label="Delete transaction"
                        title="Delete"
                        onClick={() => deleteTransaction(item)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false);
              setError("");
            }
          }}
        >
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-form-title"
          >
            <h2 className="modal-title" id="transaction-form-title">
              {editingId ? "Edit Transaction" : "Add Transaction"}
            </h2>

            <form className="transaction-form" onSubmit={saveTransaction}>
              <label className="form-field">
                Transaction type
                <select
                  className="form-control"
                  name="type"
                  value={form.type}
                  onChange={updateForm}
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </label>

              <label className="form-field">
                Amount (MYR)
                <input
                  className="form-control"
                  type="number"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={updateForm}
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
                  onChange={updateForm}
                  required
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {categoryOptions.length === 0 && (
                  <small className="muted">
                    Create a {form.type.toLowerCase()} category on the
                    Categories page first.
                  </small>
                )}
              </label>

              <label className="form-field">
                Description
                <input
                  className="form-control"
                  name="description"
                  value={form.description}
                  onChange={updateForm}
                  placeholder="Optional description"
                  maxLength={200}
                />
              </label>

              <label className="form-field">
                Date
                <input
                  className="form-control"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={updateForm}
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
                  disabled={saving}
                  onClick={() => {
                    setModalOpen(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving || categoryOptions.length === 0}
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

export default Transactions;
