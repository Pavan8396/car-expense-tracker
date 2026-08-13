import React, { useState } from "react";
import axios from "axios";
import { validateExpense } from "./utils";
import "./EditExpense.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function EditExpense({ expense, onUpdate, onCancel, showToast, categories = [] }) {
  const [category, setCategory] = useState(expense.category);
  const [amount, setAmount] = useState(expense.amount);
  const [date, setDate] = useState(expense.date);
  const [notes, setNotes] = useState(expense.notes || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    const validation = validateExpense(category, amount, date);
    if (!validation.valid) {
      showToast(validation.error, "error");
      return;
    }

    try {
      await axios.put(`${API_URL}/api/expenses/${expense._id}`, {
        category,
        amount: Number(amount),
        date,
        notes,
      });
      onUpdate();
      showToast("Expense updated successfully!", "success");
    } catch (err) {
      console.error("Error updating expense:", err.message);
      const errorMsg = err.response?.data?.error || "Failed to update expense";
      showToast(errorMsg, "error");
    }
  };

  return (
    <form className="edit-expense-form" onSubmit={handleSubmit} aria-label="Edit expense">
      <label htmlFor="edit-category-select" className="sr-only">Category</label>
      <select 
        id="edit-category-select"
        value={category} 
        onChange={(e) => setCategory(e.target.value)}
        required
      >
        <option value="">Select Category</option>
        {categories.map(cat => (
          <option key={cat._id} value={cat.name}>{cat.name}</option>
        ))}
      </select>
      
      <label htmlFor="edit-amount-input" className="sr-only">Amount</label>
      <input
        id="edit-amount-input"
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        step="0.01"
        min="0"
        required
        aria-label="Expense amount"
      />
      
      <label htmlFor="edit-date-input" className="sr-only">Date</label>
      <input
        id="edit-date-input"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
        aria-label="Expense date"
      />
      
      <label htmlFor="edit-notes-input" className="sr-only">Notes</label>
      <input
        id="edit-notes-input"
        type="text"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength="100"
        aria-label="Expense notes"
      />
      
      <div className="edit-buttons">
        <button type="submit" aria-label="Update expense button">Update</button>
        <button type="button" onClick={onCancel} aria-label="Cancel editing">Cancel</button>
      </div>
    </form>
  );
}

export default EditExpense;
