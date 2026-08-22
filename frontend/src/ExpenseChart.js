import React, { useState } from "react";
import { Pie, Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import MonthlyComparisonChart from "./MonthlyComparisonChart";

ChartJS.register(ChartDataLabels);

const formatMonth = (monthKey) => {
  const [year, month] = monthKey.split("-");
  return `${month}:${year}`;
};

const calculateMovingAverage = (data, windowSize = 3) => {
  const averages = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const subset = data.slice(start, i + 1);
    const avg = subset.reduce((a, b) => a + b, 0) / subset.length;
    averages.push(avg);
  }
  return averages;
};

// ✅ Export chart data to CSV
const exportChartData = (categoryTotals, monthlyTotals) => {
  let csv = "Category,Amount\n";
  Object.entries(categoryTotals).forEach(([cat, amt]) => {
    csv += `${cat},${amt}\n`;
  });

  csv += "\nMonth,Amount\n";
  Object.entries(monthlyTotals).forEach(([month, amt]) => {
    csv += `${month},${amt}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "chart-data.csv";
  a.click();
  URL.revokeObjectURL(url);
};

function ExpenseChart({ expenses, allExpenses }) {
  const [showMovingAverage, setShowMovingAverage] = useState(true);
  const [trendView, setTrendView] = useState("monthly"); // "monthly" or "daily"

  if (!expenses || expenses.length === 0) {
    return <p>No expenses yet to display charts.</p>;
  }

  // Category totals
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});
  const totalAmount = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  const pieData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        data: Object.values(categoryTotals),
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"
        ],
      },
    ],
  };

  const isMobile = window.innerWidth <= 768;

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: isMobile ? "bottom" : "right",
        labels: { boxWidth: 12, padding: 10, font: { size: 12 } }
      },
      datalabels: {
        color: "#fff",
        formatter: (value, ctx) => {
          const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          return ((value / total) * 100).toFixed(1) + "%";
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const percentage = ((value / totalAmount) * 100).toFixed(1);
            return `${context.label}: ₹${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Calculate Trend Data based on view mode (monthly vs daily)
  let trendLabels = [];
  let trendValues = [];
  let trendDatasetLabel = "Monthly Expenses";

  if (trendView === "monthly") {
    const monthlyTotals = expenses.reduce((acc, exp) => {
      if (exp.date) {
        const month = new Date(exp.date).toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + exp.amount;
      }
      return acc;
    }, {});
    const sortedMonths = Object.keys(monthlyTotals).sort();
    trendLabels = sortedMonths.map(formatMonth);
    trendValues = sortedMonths.map(m => monthlyTotals[m]);
    trendDatasetLabel = "Monthly Expenses";
  } else {
    // Daily trend
    const dailyTotals = expenses.reduce((acc, exp) => {
      if (exp.date) {
        const dateStr = exp.date.split("T")[0];
        acc[dateStr] = (acc[dateStr] || 0) + exp.amount;
      }
      return acc;
    }, {});
    const sortedDays = Object.keys(dailyTotals).sort();
    trendLabels = sortedDays.map(d => {
      const parts = d.split("-");
      return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
    });
    trendValues = sortedDays.map(d => dailyTotals[d]);
    trendDatasetLabel = "Daily Expenses";
  }

  const movingAverageValues = calculateMovingAverage(trendValues, 3);

  const datasets = [
    {
      label: trendDatasetLabel,
      data: trendValues,
      fill: false,
      borderColor: "#36A2EB",
      tension: 0.3,
      pointBackgroundColor: "#36A2EB",
      pointRadius: 4,
    },
  ];

  if (showMovingAverage && trendValues.length > 0) {
    datasets.push({
      label: "3-Period Moving Avg",
      data: movingAverageValues,
      fill: false,
      borderColor: "#FF9F40",
      borderDash: [5, 5],
      tension: 0.3,
      pointRadius: 0,
    });
  }

  const lineData = {
    labels: trendLabels,
    datasets,
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: isMobile ? "bottom" : "top",
        labels: { boxWidth: 12, padding: 8, font: { size: 12 } }
      },
      tooltip: {
        callbacks: { label: (context) => `₹${context.raw}` },
      },
    },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div className="charts-container">
      <div className="chart-box">
        <h2>Category Breakdown</h2>
        <div className="chart-canvas-container">
          <Pie data={pieData} options={pieOptions} />
        </div>
      </div>

      <div className="chart-box">
        <div className="trend-header">
          <h2>Expense Trend</h2>
          <div className="trend-controls">
            <div className="trend-switch-group">
              <button
                className={`trend-switch-btn ${trendView === "monthly" ? "active" : ""}`}
                onClick={() => setTrendView("monthly")}
              >
                Monthly
              </button>
              <button
                className={`trend-switch-btn ${trendView === "daily" ? "active" : ""}`}
                onClick={() => setTrendView("daily")}
              >
                Daily
              </button>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right", marginBottom: "10px" }}>
          <label style={{ fontSize: "12px", color: "#475569" }}>
            <input
              type="checkbox"
              checked={showMovingAverage}
              onChange={() => setShowMovingAverage(!showMovingAverage)}
            />{" "}
              Moving Avg
          </label>
        </div>
        <div className="chart-canvas-container">
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      <MonthlyComparisonChart expenses={allExpenses || []} />
    </div>
  );
}

export default ExpenseChart;
