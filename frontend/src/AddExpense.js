import React, { useState } from "react";
import axios from "./api";
import { validateExpense } from "./utils";
import "./AddExpense.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function AddExpense({ onAdd, showToast, categories = [] }) {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    const validation = validateExpense(category, amount, date);
    if (!validation.valid) {
      showToast(validation.error, "error");
      return;
    }

    try {
      await axios.post(`${API_URL}/api/expenses`, {
        category,
        amount: Number(amount),
        date,
        notes,
      });
      setCategory("");
      setAmount("");
      setDate("");
      setNotes("");
      onAdd();
      showToast("Expense added successfully!", "success");
    } catch (err) {
      console.error("Error adding expense:", err.message);
      const errorMsg = err.response?.data?.error || "Failed to add expense";
      showToast(errorMsg, "error");
    }
  };

  return (
    <form className="add-expense-form" onSubmit={handleSubmit} aria-label="Add new expense">
      <label htmlFor="category-select" className="sr-only">Category</label>
      <select 
        id="category-select"
        value={category} 
        onChange={(e) => setCategory(e.target.value)}
        required
      >
        <option value="">Select Category</option>
        {categories.map(cat => (
          <option key={cat._id} value={cat.name}>{cat.name}</option>
        ))}
      </select>
      
      <label htmlFor="amount-input" className="sr-only">Amount</label>
      <input
        id="amount-input"
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        step="0.01"
        min="0"
        required
        aria-label="Expense amount"
      />
      
      <label htmlFor="date-input" className="sr-only">Date</label>
      <input
        id="date-input"
        type="date"
        placeholder="Select Expense Date (YYYY-MM-DD)"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
        aria-label="Expense date"
      />
      
      <label htmlFor="notes-input" className="sr-only">Notes</label>
      <input
        id="notes-input"
        type="text"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength="100"
        aria-label="Expense notes"
      />
      
      <button type="submit" aria-label="Add expense button">Add Expense</button>
    </form>
  );
}

export default AddExpense;
