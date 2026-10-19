
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const DEFAULT_COLOR = "#8B5CF6";

const COLORS = [
  "#F43F5E",
  "#A855F7",
  "#FB7185",
  "#8B5CF6",
  "#34D399",
  "#60A5FA",
  "#FBBF24",
  "#F97316",
];

const emptyForm = () => ({
  name: "",
  type: "EXPENSE",
  color: DEFAULT_COLOR,
});

function Categories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("spendwise_user") || "{}"
      );
    } catch {
      return {};
    }
  }, []);

  const handleAuthError = (err) => {
    if (err.response?.status === 401 ||
        err.response?.status === 403) {
      localStorage.removeItem("spendwise_token");
      localStorage.removeItem("spendwise_user");
      navigate("/login");
      return true;
    }

    return false;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [categoryResponse, transactionResponse] =
        await Promise.all([
          api.get("/categories"),
          api.get("/transactions"),
        ]);

      setCategories(
        Array.isArray(categoryResponse.data)
          ? categoryResponse.data
          : []
      );

      setTransactions(
        Array.isArray(transactionResponse.data)
          ? transactionResponse.data
          : []
      );
    } catch (err) {
      if (handleAuthError(err)) return;

      setError(
        err.response?.data?.error ||
        "Could not load categories. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        category.name.toLowerCase().includes(query);

      const matchesType =
        filter === "ALL" || category.type === filter;

      return matchesSearch && matchesType;
    });
  }, [categories, search, filter]);

  const incomeCount = categories.filter(
    (category) => category.type === "INCOME"
  ).length;

  const expenseCount = categories.filter(
    (category) => category.type === "EXPENSE"
  ).length;

  const usedCategoryCount = categories.filter((category) =>
    transactions.some(
      (transaction) =>
        (transaction.category || "").toLowerCase() ===
        category.name.toLowerCase()
    )
  ).length;

  function openAddModal() {
    setEditingCategory(null);
    setForm(emptyForm());
    setError("");
    setModalOpen(true);
  }

  function openEditModal(category) {
    setEditingCategory(category);
    setForm({
      name: category.name,
      type: category.type,
      color: category.color || DEFAULT_COLOR,
    });
    setError("");
    setModalOpen(true);
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function saveCategory(event) {
    event.preventDefault();
    setError("");

    const name = form.name.trim();

    if (name.length < 2 || name.length > 40) {
      setError("Category name must be between 2 and 40 characters.");
      return;
    }

    const duplicate = categories.some(
      (category) =>
        category.name.toLowerCase() === name.toLowerCase() &&
        category.id !== editingCategory?.id
    );

    if (duplicate) {
      setError("A category with this name already exists.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name,
        type: form.type,
        color: form.color,
      };

      if (editingCategory) {
        await api.put(
          `/categories/${editingCategory.id}`,
          payload
        );
      } else {
        await api.post("/categories", payload);
      }

      setModalOpen(false);
      setEditingCategory(null);
      setForm(emptyForm());

      await loadData();
    } catch (err) {
      if (handleAuthError(err)) return;

      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Could not save the category. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category) {
    const isUsed = transactions.some(
      (transaction) =>
        (transaction.category || "").toLowerCase() ===
        category.name.toLowerCase()
    );

    if (isUsed) {
      setError(
        `"${category.name}" is used by existing transactions. ` +
        "It cannot be deleted until those transactions are updated."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete the "${category.name}" category? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");

    try {
      await api.delete(`/categories/${category.id}`);
      await loadData();
    } catch (err) {
      if (handleAuthError(err)) return;

      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Could not delete the category. Please try again."
      );
    }
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingCategory(null);
    setError("");
  }

  function logout() {
    localStorage.removeItem("spendwise_token");
    localStorage.removeItem("spendwise_user");
    navigate("/login");
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
          <Link className="nav-link" to="/dashboard#transactions">
            ▤ Transactions
          </Link>
          <Link className="nav-link active" to="/categories">
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
          <div className="search-box">
            <input
              type="search"
              placeholder="Search categories..."
              aria-label="Search categories"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
          <p>Organise your finances</p>
          <h1>Categories</h1>
          <p className="description">
            Manage the categories you use to track your money.
          </p>
        </section>

        {error && (
          <div className="error-message" role="alert">
            {error}
            <button
              type="button"
              className="icon-button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        <section className="summary-grid">
          <article className="summary-card">
            <div className="summary-label">Total Categories</div>
            <div className="summary-value">{categories.length}</div>
            <div className="summary-note">All your categories</div>
          </article>

          <article className="summary-card">
            <div className="summary-label">Income Categories</div>
            <div className="summary-value income-text">
              {incomeCount}
            </div>
            <div className="summary-note">Money received</div>
          </article>

          <article className="summary-card">
            <div className="summary-label">Expense Categories</div>
            <div className="summary-value expense-text">
              {expenseCount}
            </div>
            <div className="summary-note">Money spent</div>
          </article>

          <article className="summary-card">
            <div className="summary-label">Categories in Use</div>
            <div className="summary-value balance-text">
              {usedCategoryCount}
            </div>
            <div className="summary-note">Linked to transactions</div>
          </article>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Your Categories</h2>
              <p className="muted transaction-subtitle">
                Create and maintain your income and expense groups.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={openAddModal}
            >
              + Add Category
            </button>
          </div>

          <div className="category-toolbar">
            <div className="category-filters">
              {[
                ["ALL", "All"],
                ["EXPENSE", "Expenses"],
                ["INCOME", "Income"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`category-filter ${
                    filter === value ? "selected" : ""
                  }`}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <span className="muted category-result-count">
              {filteredCategories.length} categories
            </span>
          </div>

          {loading ? (
            <p className="loading-state">Loading categories...</p>
          ) : filteredCategories.length === 0 ? (
            <div className="empty-state">
              {search || filter !== "ALL"
                ? "No categories match your search or filter."
                : "You haven't created any categories yet. Add your first category to get started."}
            </div>
          ) : (
            <div className="category-card-grid">
              {filteredCategories.map((category) => {
                const used = transactions.some(
                  (transaction) =>
                    (transaction.category || "").toLowerCase() ===
                    category.name.toLowerCase()
                );

                return (
                  <article className="managed-category-card" key={category.id}>
                    <div className="managed-category-top">
                      <span
                        className="category-color-dot"
                        style={{
                          backgroundColor: category.color || DEFAULT_COLOR,
                        }}
                      />
                      <span
                        className={`type-pill ${
                          category.type === "INCOME"
                            ? "income"
                            : "expense"
                        }`}
                      >
                        {category.type === "INCOME" ? "Income" : "Expense"}
                      </span>
                    </div>

                    <h3>{category.name}</h3>

                    <p className="muted managed-category-status">
                      {used ? "Currently in use" : "No transactions linked"}
                    </p>

                    <div className="managed-category-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => openEditModal(category)}
                      >
                        ✎ Edit
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => deleteCategory(category)}
                        disabled={used}
                        title={
                          used
                            ? "This category is used by transactions"
                            : "Delete category"
                        }
                      >
                        × Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
          >
            <h2 className="modal-title" id="category-modal-title">
              {editingCategory ? "Edit Category" : "Add Category"}
            </h2>

            <form className="transaction-form" onSubmit={saveCategory}>
              <label className="form-field">
                Category name
                <input
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="e.g. Food & Drinks"
                  maxLength={40}
                  minLength={2}
                  required
                />
              </label>

              <label className="form-field">
                Category type
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
                Category colour
                <div className="category-color-options">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`category-color-choice ${
                        form.color === color ? "selected" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select ${color}`}
                      aria-pressed={form.color === color}
                      onClick={() =>
                        setForm((current) => ({ ...current, color }))
                      }
                    />
                  ))}
                </div>
              </label>

              {error && (
                <p className="error-message" role="alert">{error}</p>
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
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingCategory
                      ? "Save Changes"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Categories;
