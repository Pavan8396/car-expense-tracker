import React, { useState, useEffect } from "react";
import axios from "axios";
import AddExpense from "./AddExpense";
import ExpenseChart from "./ExpenseChart";
import EditExpense from "./EditExpense";
import Toast from "./Toast";
import Modal from "./Modal";
import Loading from "./Loading";
import CategoryManager from "./CategoryManager";
import QuickStats from "./QuickStats";
import MonthlySummary from "./MonthlySummary";
import MonthlyComparisonChart from "./MonthlyComparisonChart";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import { formatDate, formatAmount, getDateRangeShortcut, calculateStats } from "./utils";
import "./App.css";

import { FaGasPump, FaCarCrash, FaTools, FaParking, FaCreditCard, FaShieldAlt } from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch all expenses
  const fetchExpenses = () => {
    setLoading(true);
    axios.get(`${API_URL}/api/expenses`)
      .then(res => {
        setExpenses(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching expenses:", err.message);
        showToast("Failed to load expenses", "error");
        setLoading(false);
      });
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  // Delete expense with confirmation
  const handleDeleteClick = (expense) => {
    setDeleteModal({
      id: expense._id,
      category: expense.category,
      amount: expense.amount,
    });
  };

  const confirmDelete = async () => {
    const expenseId = deleteModal.id;
    setDeleteModal(null);
    
    try {
      await axios.delete(`${API_URL}/api/expenses/${expenseId}`);
      fetchExpenses();
      showToast("Expense deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting expense:", err.message);
      showToast("Failed to delete expense", "error");
    }
  };

  // Duplicate expense
  const handleDuplicate = async (expense) => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const localTodayStr = `${year}-${month}-${day}`;

      await axios.post(`${API_URL}/api/expenses/${expense._id}/duplicate`, {
        localDate: localTodayStr
      });
      fetchExpenses();
      showToast(`${expense.category} expense duplicated!`, "success");
    } catch (err) {
      console.error("Error duplicating expense:", err.message);
      showToast("Failed to duplicate expense", "error");
    }
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter(exp => {
    const matchesCategory = filterCategory ? exp.category === filterCategory : true;
    const matchesStart = startDate ? exp.date >= startDate : true;
    const matchesEnd = endDate ? exp.date <= endDate : true;
    const matchesSearch = searchTerm
      ? exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        exp.amount.toString().includes(searchTerm)
      : true;
    return matchesCategory && matchesStart && matchesEnd && matchesSearch;
  });

  // Sorting
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortConfig.key) {
      case "amount":
        aVal = a.amount;
        bVal = b.amount;
        break;
      case "date":
        aVal = new Date(a.date);
        bVal = new Date(b.date);
        break;
      case "category":
        aVal = a.category;
        bVal = b.category;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // ✅ Summary calculations
  const stats = calculateStats(sortedExpenses);

  const currentMonth = new Date();
  const currentMonthKey = currentMonth.toISOString().slice(0, 7);
  const monthlyTotal = sortedExpenses
    .filter(exp => new Date(exp.date).toISOString().slice(0, 7) === currentMonthKey)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const currentMonthLabel = `${String(currentMonth.getMonth() + 1).padStart(2, "0")}:${currentMonth.getFullYear()}`;

  // ✅ Category subtotals
  const categoryTotals = sortedExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  // Export CSV
  const handleExportCSV = () => {
    if (sortedExpenses.length === 0) {
      showToast("No expenses to export", "warning");
      return;
    }
    const csv = Papa.unparse(sortedExpenses);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "expenses.csv");
    showToast("Expenses exported successfully", "success");
  };

  // Date shortcuts
  const applyDateShortcut = (shortcut) => {
    const range = getDateRangeShortcut(shortcut);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  // Category icons
  const categoryIcons = {
    Fuel: { icon: <FaGasPump color="#36A2EB" />, label: "Fuel" },
    Insurance: { icon: <FaShieldAlt color="#2ecc71" />, label: "Insurance" },
    Maintenance: { icon: <FaTools color="#f39c12" />, label: "Maintenance" },
    Parking: { icon: <FaParking color="#9b59b6" />, label: "Parking" },
    EMI: { icon: <FaCreditCard color="#e74c3c" />, label: "EMI" },
    Accessories: { icon: <FaCarCrash color="#ff9f40" />, label: "Accessories" },
  };

  // Calculate previous month expenses for quick stats
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const previousMonthKey = previousMonth.toISOString().slice(0, 7);
  const previousMonthExpenses = expenses.filter(
    exp => new Date(exp.date).toISOString().slice(0, 7) === previousMonthKey
  );

  return (
    <div className="container">
      <h1>Car Expense Tracker</h1>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <Modal
          title="Delete Expense"
          message={`Are you sure you want to delete this ${deleteModal.category} expense of ${formatAmount(deleteModal.amount)}? This action cannot be undone.`}
          type="delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}

      {/* Category Manager Modal */}
      <CategoryManager
        isOpen={categoryManagerOpen}
        onClose={() => {
          setCategoryManagerOpen(false);
          fetchCategories();
        }}
        onCategoriesUpdate={fetchCategories}
      />

      {/* Filters + AddExpense aligned */}
      <div className="top-bar">
        <AddExpense onAdd={fetchExpenses} showToast={showToast} categories={categories} />
        <div className="filters">
          <input
            type="text"
            placeholder="Search by category, notes, or amount"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Search expenses"
          />
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            aria-label="Filter by start date"
          />
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            aria-label="Filter by end date"
          />
          <button onClick={handleExportCSV} aria-label="Download CSV export">Download CSV</button>
          <button 
            onClick={() => setCategoryManagerOpen(true)}
            className="btn-manage-categories"
            aria-label="Manage categories"
          >
            ⚙️ Categories
          </button>
        </div>
      </div>

      {/* Date Shortcuts */}
      <div className="date-shortcuts">
        <span className="shortcuts-label">Quick Filters:</span>
        <button onClick={() => applyDateShortcut("today")} className="shortcut-btn">Today</button>
        <button onClick={() => applyDateShortcut("week")} className="shortcut-btn">Last 7 Days</button>
        <button onClick={() => applyDateShortcut("month")} className="shortcut-btn">This Month</button>
        <button onClick={() => applyDateShortcut("30days")} className="shortcut-btn">Last 30 Days</button>
        <button onClick={() => applyDateShortcut("year")} className="shortcut-btn">This Year</button>
        <button 
          onClick={() => {
            setStartDate("");
            setEndDate("");
          }} 
          className="shortcut-btn clear"
        >
          Clear
        </button>
      </div>

      {/* Summary bar with statistics */}
      <div className="summary-bar">
        <div>
          <div className="summary-label">Total Expenses</div>
          <div className="summary-value">{formatAmount(stats.total)}</div>
        </div>
        <div>
          <div className="summary-label">Average</div>
          <div className="summary-value">{formatAmount(stats.average)}</div>
        </div>
        <div>
          <div className="summary-label">Highest</div>
          <div className="summary-value">{formatAmount(stats.highest)}</div>
        </div>
        <div>
          <div className="summary-label">Count</div>
          <div className="summary-value">{stats.count}</div>
        </div>
        <div>
          <div className="summary-label">This Month</div>
          <div className="summary-value">{formatAmount(monthlyTotal)}</div>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats expenses={expenses.filter(e => new Date(e.date).toISOString().slice(0, 7) === currentMonthKey)} previousMonthExpenses={previousMonthExpenses} />

      {/* Charts side by side */}
      {loading ? (
        <Loading />
      ) : sortedExpenses.length > 0 ? (
        <>
          <ExpenseChart expenses={sortedExpenses} />
          <MonthlyComparisonChart expenses={expenses} />
        </>
      ) : (
        <div className="empty-state">
          <p>📊 No expense data to display</p>
          <small>Add your first expense to see charts</small>
        </div>
      )}

      {/* Expense List */}
      <h2>Expense List</h2>
      {loading ? (
        <Loading />
      ) : editingExpense ? (
        <EditExpense
          expense={editingExpense}
          onUpdate={() => { setEditingExpense(null); fetchExpenses(); }}
          onCancel={() => setEditingExpense(null)}
          showToast={showToast}
          categories={categories}
        />
      ) : sortedExpenses.length === 0 ? (
        <div className="empty-state">
          <p>📝 No expenses found</p>
          <small>{searchTerm || filterCategory || startDate || endDate ? "Try adjusting your filters" : "Add your first expense to get started"}</small>
        </div>
      ) : (
        <table className="expense-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("category")} className="sortable">
                Category {sortConfig.key === "category" && (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => handleSort("amount")} className="sortable">
                Amount (₹) {sortConfig.key === "amount" && (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => handleSort("date")} className="sortable">
                Date {sortConfig.key === "date" && (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.map(exp => (
              <tr key={exp._id}>
                <td>
                  <span className="category-icon">{categoryIcons[exp.category]?.icon}</span>
                  {exp.category}
                </td>
                <td className="amount">{formatAmount(exp.amount)}</td>
                <td>{formatDate(exp.date)}</td>
                <td className="notes">{exp.notes || "-"}</td>
                <td className="actions">
                  <button 
                    onClick={() => handleDuplicate(exp)}
                    className="btn-duplicate"
                    aria-label={`Duplicate ${exp.category} expense`}
                    title="Duplicate this expense"
                  >
                    📋
                  </button>
                  <button 
                    onClick={() => setEditingExpense(exp)}
                    className="btn-edit"
                    aria-label={`Edit ${exp.category} expense`}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(exp)}
                    className="btn-delete"
                    aria-label={`Delete ${exp.category} expense`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="5">
                <strong>Category Subtotals:</strong>{" "}
                {Object.entries(categoryTotals)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([cat, amt]) => (
                    <span key={cat}>{cat}: {formatAmount(amt)} &nbsp;</span>
                  ))}
              </td>
            </tr>
          </tfoot>
        </table>
      )}

      {/* Monthly Summary Report */}
      <MonthlySummary expenses={expenses} />
    </div>
  );
}

export default App;
