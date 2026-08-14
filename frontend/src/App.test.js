import { render, screen, act } from "@testing-library/react";
import App from "./App";
import axios from "axios";

// Mock axios
jest.mock("axios");

// Mock Chart.js to prevent rendering errors in tests
jest.mock("react-chartjs-2", () => ({
  Pie: () => <div data-testid="pie-chart">Pie Chart</div>,
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
}));

test("renders Car Expense Tracker title", async () => {
  // Mock API responses
  axios.get.mockImplementation((url) => {
    if (url.includes("/api/expenses")) {
      return Promise.resolve({ data: [] });
    }
    if (url.includes("/api/categories")) {
      return Promise.resolve({ data: [] });
    }
    return Promise.reject(new Error("Unknown URL"));
  });

  await act(async () => {
    render(<App />);
  });

  const titleElement = screen.getByText(/Car Expense Tracker/i);
  expect(titleElement).toBeInTheDocument();
});
