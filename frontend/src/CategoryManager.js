import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CategoryManager.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function CategoryManager({ isOpen, onClose, onCategoriesUpdate }) {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
    setLoading(false);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      await axios.post(`${API_URL}/api/categories`, { name: newCategory });
      setNewCategory("");
      fetchCategories();
      onCategoriesUpdate();
    } catch (err) {
      console.error("Error adding category:", err);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category? Expenses won't be affected.")) return;

    try {
      await axios.delete(`${API_URL}/api/categories/${id}`);
      fetchCategories();
      onCategoriesUpdate();
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal category-manager" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Categories</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          <form onSubmit={handleAddCategory} className="add-category-form">
            <input
              type="text"
              placeholder="Enter new category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              maxLength="30"
            />
            <button type="submit">Add Category</button>
          </form>

          <div className="categories-list">
            <h3>Existing Categories ({categories.length})</h3>
            {loading ? (
              <p>Loading...</p>
            ) : categories.length === 0 ? (
              <p className="empty">No custom categories yet</p>
            ) : (
              categories.map((cat) => (
                <div key={cat._id} className="category-item">
                  <span>{cat.name}</span>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteCategory(cat._id)}
                    aria-label={`Delete ${cat.name} category`}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default CategoryManager;
