import React, { useState } from "react";
import "./MonthlySummary.css";
import { formatAmount } from "./utils";

function MonthlySummary({ expenses }) {
  const [expandedMonth, setExpandedMonth] = useState(null);

  // Group expenses by month
  const expensesByMonth = expenses.reduce((acc, exp) => {
    const monthKey = new Date(exp.date).toISOString().slice(0, 7);
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(exp);
    return acc;
  }, {});

  // Sort months in descending order
  const sortedMonths = Object.keys(expensesByMonth).sort().reverse();

  const formatMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split("-");
    return new Date(year, month - 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  if (sortedMonths.length === 0) {
    return null;
  }

  return (
    <div className="monthly-summary">
      <h2>Monthly Summary Report</h2>
      <div className="months-list">
        {sortedMonths.map((monthKey) => {
          const monthExpenses = expensesByMonth[monthKey];
          const monthTotal = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          const categoryTotals = monthExpenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
          }, {});

          const isExpanded = expandedMonth === monthKey;

          return (
            <div key={monthKey} className="month-card">
              <div
                className="month-header"
                onClick={() => setExpandedMonth(isExpanded ? null : monthKey)}
              >
                <div className="month-info">
                  <h3>{formatMonthLabel(monthKey)}</h3>
                  <span className="expense-count">{monthExpenses.length} expenses</span>
                </div>
                <div className="month-total">
                  <span className="total-amount">{formatAmount(monthTotal)}</span>
                  <span className="toggle-icon">{isExpanded ? "▼" : "▶"}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="month-details">
                  <div className="category-breakdown">
                    {Object.entries(categoryTotals)
                      .sort((a, b) => b[1] - a[1])
                      .map(([category, total]) => (
                        <div key={category} className="category-row">
                          <span className="category-name">{category}</span>
                          <div className="category-bar">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${(total / monthTotal) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="category-amount">{formatAmount(total)}</span>
                        </div>
                      ))}
                  </div>

                  <div className="daily-stats">
                    <div className="stat-item">
                      <span className="stat-name">Daily Average:</span>
                      <span className="stat-value">
                        {formatAmount(monthTotal / monthExpenses.length)}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-name">Max Day:</span>
                      <span className="stat-value">
                        {formatAmount(
                          Math.max(
                            ...monthExpenses.map((e) => e.amount),
                            0
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MonthlySummary;
