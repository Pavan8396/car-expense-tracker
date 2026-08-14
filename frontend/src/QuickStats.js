import React from "react";
import "./QuickStats.css";

function QuickStats({ expenses, previousMonthExpenses }) {
  if (expenses.length === 0) {
    return null;
  }

  // Calculate insights
  const currentTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const previousTotal = previousMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  let percentChangeText = "0.0%";
  let trendClass = "";
  let trendIcon = "➡️";

  if (previousTotal > 0) {
    const percentChange = ((currentTotal - previousTotal) / previousTotal) * 100;
    percentChangeText = `${percentChange > 0 ? "+" : ""}${percentChange.toFixed(1)}%`;
    trendClass = percentChange > 0 ? "trend-up" : percentChange < 0 ? "trend-down" : "";
    trendIcon = percentChange > 0 ? "📈" : percentChange < 0 ? "📉" : "➡️";
  } else if (currentTotal > 0) {
    percentChangeText = "New";
    trendClass = "trend-up";
    trendIcon = "📈";
  }

  // Find top category
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const dailyAverage = (currentTotal / expenses.length).toFixed(2);

  return (
    <div className="quick-stats">
      <div className="stat-card">
        <div className="stat-icon">💰</div>
        <div className="stat-content">
          <span className="stat-label">This Month</span>
          <span className="stat-value">₹ {currentTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">{trendIcon}</div>
        <div className="stat-content">
          <span className="stat-label">vs Last Month</span>
          <span className={`stat-value ${trendClass}`}>
            {percentChangeText}
          </span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">🏷️</div>
        <div className="stat-content">
          <span className="stat-label">Top Category</span>
          <span className="stat-value">{topCategory?.[0] || "N/A"}</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">📊</div>
        <div className="stat-content">
          <span className="stat-label">Daily Average</span>
          <span className="stat-value">₹ {dailyAverage}</span>
        </div>
      </div>
    </div>
  );
}

export default QuickStats;
