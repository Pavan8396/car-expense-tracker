import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

ChartJS.register();

const formatMonth = (monthKey) => {
  const [year, month] = monthKey.split("-");
  return `${month}:${year}`;
};

function DistanceChart({ logs = [] }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="chart-box">
        <h2>Distance Driven Trend</h2>
        <div className="empty-state" style={{ padding: "30px" }}>
          <p>🛣️ No distance data to display</p>
          <small>Log your Odometer readings to see distance trends</small>
        </div>
      </div>
    );
  }

  // Aggregate distance by month
  const monthlyKm = logs.reduce((acc, log) => {
    if (log.date) {
      const monthKey = new Date(log.date).toISOString().slice(0, 7);
      acc[monthKey] = (acc[monthKey] || 0) + (log.distance || 0);
    }
    return acc;
  }, {});

  const sortedMonths = Object.keys(monthlyKm).sort();
  const kmValues = sortedMonths.map(m => monthlyKm[m]);

  const isMobile = window.innerWidth <= 768;

  const data = {
    labels: sortedMonths.map(formatMonth),
    datasets: [
      {
        label: "Distance Driven (KM)",
        data: kmValues,
        backgroundColor: "#10b981",
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: isMobile ? "bottom" : "top",
        labels: { boxWidth: 12, padding: 8, font: { size: 12 } }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw} KM`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value} KM`,
          font: { size: 10 }
        },
      },
      x: {
        ticks: { font: { size: 10 } }
      }
    },
  };

  return (
    <div className="chart-box">
      <h2>Distance Driven Trend (KM)</h2>
      <div className="chart-canvas-container">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

export default DistanceChart;
