import realAxios from "axios";

const OFFLINE_MODE = process.env.REACT_APP_OFFLINE === "true";

// Helper for generating unique IDs like MongoDB ObjectIds
const generateId = (prefix) => {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}${Date.now().toString(36)}`;
};

// Seed default categories if none exist
const DEFAULT_CATEGORIES = ["EMI", "Fuel", "Insurance", "Maintenance", "Parking", "Accessories"];

const initDb = () => {
  if (!localStorage.getItem("car_categories")) {
    const initialCategories = DEFAULT_CATEGORIES.map(name => ({
      _id: generateId("cat"),
      name,
      createdAt: new Date().toISOString()
    }));
    localStorage.setItem("car_categories", JSON.stringify(initialCategories));
  }
  if (!localStorage.getItem("car_expenses")) {
    localStorage.setItem("car_expenses", JSON.stringify([]));
  }
};

// Auto backup helper
export const saveAutoBackup = () => {
  try {
    const expenses = localStorage.getItem("car_expenses") || "[]";
    const categories = localStorage.getItem("car_categories") || "[]";
    localStorage.setItem("car_expenses_backup_auto", JSON.stringify({
      expenses: JSON.parse(expenses),
      categories: JSON.parse(categories),
      timestamp: new Date().toISOString()
    }));
  } catch (err) {
    console.error("Failed to save automatic backup:", err);
  }
};

if (OFFLINE_MODE) {
  initDb();
}

const throwAxiosError = (message) => {
  const err = new Error(message);
  err.response = { data: { error: message } };
  throw err;
};

// Simulated network delay (ms) for natural feel
const DELAY = 50;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const localApi = {
  get: async (url) => {
    await sleep(DELAY);

    if (url.endsWith("/api/expenses")) {
      const expenses = JSON.parse(localStorage.getItem("car_expenses") || "[]");
      // Sort by date descending, then createdAt descending
      const sorted = expenses.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      return { data: sorted };
    }

    if (url.endsWith("/api/categories")) {
      const categories = JSON.parse(localStorage.getItem("car_categories") || "[]");
      const sorted = categories.sort((a, b) => a.name.localeCompare(b.name));
      return { data: sorted };
    }

    throw new Error(`404 Not Found: GET ${url}`);
  },

  post: async (url, data) => {
    await sleep(DELAY);

    if (url.endsWith("/api/expenses")) {
      const { category, amount, date, notes } = data;
      if (!category || !amount || !date) {
        throwAxiosError("Missing required expense fields");
      }

      const expenses = JSON.parse(localStorage.getItem("car_expenses") || "[]");
      const newExpense = {
        _id: generateId("exp"),
        category,
        amount: Number(amount),
        date,
        notes: notes || "",
        createdAt: new Date().toISOString()
      };

      expenses.push(newExpense);
      localStorage.setItem("car_expenses", JSON.stringify(expenses));
      saveAutoBackup();
      return { data: newExpense };
    }

    if (url.endsWith("/api/categories")) {
      const { name } = data;
      if (!name || !name.trim()) {
        throwAxiosError("Category name is required");
      }
      if (name.length > 30) {
        throwAxiosError("Category name cannot exceed 30 characters");
      }

      const categories = JSON.parse(localStorage.getItem("car_categories") || "[]");
      const exists = categories.some(cat => cat.name.toLowerCase() === name.trim().toLowerCase());
      if (exists) {
        throwAxiosError("Category already exists");
      }

      const newCategory = {
        _id: generateId("cat"),
        name: name.trim(),
        createdAt: new Date().toISOString()
      };

      categories.push(newCategory);
      localStorage.setItem("car_categories", JSON.stringify(categories));
      saveAutoBackup();
      return { data: newCategory };
    }

    // Duplicate expense endpoint: /api/expenses/:id/duplicate
    const duplicateMatch = url.match(/\/api\/expenses\/([^/]+)\/duplicate$/);
    if (duplicateMatch) {
      const expenseId = duplicateMatch[1];
      const expenses = JSON.parse(localStorage.getItem("car_expenses") || "[]");
      const original = expenses.find(exp => String(exp._id) === String(expenseId));
      if (!original) {
        throwAxiosError("Expense not found");
      }

      const today = data?.localDate || new Date().toISOString().split("T")[0];
      const duplicated = {
        _id: generateId("exp"),
        category: original.category,
        amount: original.amount,
        date: today,
        notes: original.notes || "",
        createdAt: new Date().toISOString()
      };

      expenses.push(duplicated);
      localStorage.setItem("car_expenses", JSON.stringify(expenses));
      saveAutoBackup();
      return { data: duplicated };
    }

    throw new Error(`404 Not Found: POST ${url}`);
  },

  put: async (url, data) => {
    await sleep(DELAY);

    // Update expense endpoint: /api/expenses/:id
    const expenseMatch = url.match(/\/api\/expenses\/([^/]+)$/);
    if (expenseMatch) {
      const expenseId = expenseMatch[1];
      const expenses = JSON.parse(localStorage.getItem("car_expenses") || "[]");
      const index = expenses.findIndex(exp => String(exp._id) === String(expenseId));
      if (index === -1) {
        throwAxiosError("Expense not found");
      }

      const { category, amount, date, notes } = data;
      if (!category || !amount || !date) {
        throwAxiosError("Missing required expense fields");
      }

      expenses[index] = {
        ...expenses[index],
        category,
        amount: Number(amount),
        date,
        notes: notes || "",
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem("car_expenses", JSON.stringify(expenses));
      saveAutoBackup();
      return { data: expenses[index] };
    }

    throw new Error(`404 Not Found: PUT ${url}`);
  },

  delete: async (url) => {
    await sleep(DELAY);

    // Delete expense endpoint: /api/expenses/:id
    const expenseMatch = url.match(/\/api\/expenses\/([^/]+)$/);
    if (expenseMatch) {
      const expenseId = expenseMatch[1];
      const expenses = JSON.parse(localStorage.getItem("car_expenses") || "[]");
      const filtered = expenses.filter(exp => String(exp._id) !== String(expenseId));
      if (filtered.length === expenses.length) {
        throwAxiosError("Expense not found");
      }
      localStorage.setItem("car_expenses", JSON.stringify(filtered));
      saveAutoBackup();
      return { data: { message: "Expense deleted successfully" } };
    }

    // Delete category endpoint: /api/categories/:id
    const categoryMatch = url.match(/\/api\/categories\/([^/]+)$/);
    if (categoryMatch) {
      const categoryId = categoryMatch[1];
      const categories = JSON.parse(localStorage.getItem("car_categories") || "[]");
      const filtered = categories.filter(cat => String(cat._id) !== String(categoryId));
      if (filtered.length === categories.length) {
        throwAxiosError("Category not found");
      }
      localStorage.setItem("car_categories", JSON.stringify(filtered));
      saveAutoBackup();
      return { data: { message: "Category deleted successfully" } };
    }

    throw new Error(`404 Not Found: DELETE ${url}`);
  }
};

export default OFFLINE_MODE ? localApi : realAxios;
