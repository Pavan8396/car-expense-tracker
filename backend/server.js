const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Connect to MongoDB with environment variable
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/car_expenses";
const port = process.env.PORT || 5000;

mongoose.connect(mongoUri)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ Categories Schema
const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Category name is required"],
    unique: true,
    trim: true,
    maxlength: [30, "Category name cannot exceed 30 characters"]
  },
  createdAt: { type: Date, default: Date.now }
});

const Category = mongoose.model("Category", CategorySchema);

// ✅ Default categories
const DEFAULT_CATEGORIES = ["EMI", "Fuel", "Insurance", "Maintenance", "Parking", "Accessories"];

const initializeDefaultCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES.map(name => ({ name })));
      console.log("✅ Default categories created");
    }
  } catch (err) {
    console.error("Error initializing categories:", err);
  }
};

initializeDefaultCategories();

// ✅ Schema with validation
const ExpenseSchema = new mongoose.Schema({
  category: { 
    type: String, 
    required: [true, "Category is required"]
  },
  amount: { 
    type: Number, 
    required: [true, "Amount is required"],
    min: [0.01, "Amount must be greater than 0"]
  },
  date: { 
    type: String, 
    required: [true, "Date is required"],
    validate: {
      validator: function(v) {
        if (!v) return false;
        const inputDate = new Date(v);
        if (isNaN(inputDate.getTime())) return false;

        // Allow up to tomorrow's date in server time to accommodate timezone differences
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() + 1);
        limitDate.setHours(23, 59, 59, 999);
        return inputDate <= limitDate;
      },
      message: "Date must be valid and not in the future"
    }
  },
  notes: { 
    type: String,
    maxlength: [100, "Notes cannot exceed 100 characters"]
  },
  createdAt: { type: Date, default: Date.now }
});

const Expense = mongoose.model("Expense", ExpenseSchema);

// ✅ Validation middleware
const validateExpense = (req, res, next) => {
  const { category, amount, date, notes } = req.body;

  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number" });
  }

  if (!date) {
    return res.status(400).json({ error: "Date is required" });
  }

  const selectedDate = new Date(date);
  if (isNaN(selectedDate.getTime())) {
    return res.status(400).json({ error: "Date must be valid" });
  }

  // Allow up to tomorrow's date in server time to accommodate timezone differences
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() + 1);
  limitDate.setHours(23, 59, 59, 999);

  if (selectedDate > limitDate) {
    return res.status(400).json({ error: "Date must be valid and not in the future" });
  }

  if (notes && notes.length > 100) {
    return res.status(400).json({ error: "Notes cannot exceed 100 characters" });
  }

  next();
};

// ✅ Routes
app.get("/api/expenses", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

app.post("/api/expenses", validateExpense, async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    const message = err.message || "Failed to add expense";
    res.status(400).json({ error: message });
  }
});

app.put("/api/expenses/:id", validateExpense, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(updatedExpense);
  } catch (err) {
    const message = err.message || "Failed to update expense";
    res.status(400).json({ error: message });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete expense" });
  }
});

// ✅ Duplicate expense route
app.post("/api/expenses/:id/duplicate", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Use client's local date if provided, fallback to server's UTC date
    const today = req.body.localDate || new Date().toISOString().split("T")[0];
    const newExpense = new Expense({
      category: expense.category,
      amount: expense.amount,
      date: today,
      notes: expense.notes
    });

    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(400).json({ error: "Failed to duplicate expense" });
  }
});

// ✅ Categories routes
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    if (name.length > 30) {
      return res.status(400).json({ error: "Category name cannot exceed 30 characters" });
    }

    const category = new Category({ name: name.trim() });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Category already exists" });
    }
    res.status(400).json({ error: "Failed to add category" });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete category" });
  }
});

// ✅ Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// ✅ Start server
app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
