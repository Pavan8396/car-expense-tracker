import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import "./MonthlyComparisonChart.css";

ChartJS.register();

function MonthlyComparisonChart({ expenses }) {
  if (expenses.length === 0) {
    return null;
  }

  // Get current and previous month
  const today = new Date();
  const currentMonthKey = today.toISOString().slice(0, 7);
  const previousMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousMonthKey = previousMonthDate.toISOString().slice(0, 7);

  // Get category totals for current and previous month
  const getCategoryTotals = (monthKey) => {
    return expenses
      .filter(exp => new Date(exp.date).toISOString().slice(0, 7) === monthKey)
      .reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {});
  };

  const currentCategoryTotals = getCategoryTotals(currentMonthKey);
  const previousCategoryTotals = getCategoryTotals(previousMonthKey);

  // Get all categories
  const allCategories = new Set([
    ...Object.keys(currentCategoryTotals),
    ...Object.keys(previousCategoryTotals),
  ]);

  const data = {
    labels: Array.from(allCategories).sort(),
    datasets: [
      {
        label: `${new Date(currentMonthKey).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`,
        data: Array.from(allCategories)
          .sort()
          .map(cat => currentCategoryTotals[cat] || 0),
        backgroundColor: "#36A2EB",
        borderRadius: 6,
      },
      {
        label: `${previousMonthDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`,
        data: Array.from(allCategories)
          .sort()
          .map(cat => previousCategoryTotals[cat] || 0),
        backgroundColor: "#ecf0f1",
        borderRadius: 6,
      },
    ],
  };

  const isMobile = window.innerWidth <= 768;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: isMobile ? "bottom" : "top",
        labels: { boxWidth: 12, padding: 8, font: { size: 12 } }
      },
      tooltip: {
        callbacks: {
          label: (context) => `₹${context.raw.toLocaleString("en-IN")}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`,
          font: { size: 10 }
        },
      },
      x: {
        ticks: {
          font: { size: 10 },
          maxRotation: 45,
          minRotation: 0,
          autoSkip: true,
        }
      }
    },
  };

  return (
    <div className="chart-box">
      <h2>Month-over-Month Comparison</h2>
      <div className="chart-canvas-container">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

export default MonthlyComparisonChart;
