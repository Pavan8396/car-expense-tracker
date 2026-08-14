// Utility functions for date formatting and validation

// Format date as DD-MM-YYYY
export const formatDate = (dateString) => {
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Format amount with comma separators and currency symbol
export const formatAmount = (amount) => {
  return `₹ ${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Validate amount (must be positive)
export const validateAmount = (amount) => {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: "Amount must be a positive number" };
  }
  return { valid: true };
};

// Validate date (cannot be in the future)
export const validateDate = (dateString) => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const localTodayStr = `${year}-${month}-${day}`;
  
  if (dateString > localTodayStr) {
    return { valid: false, error: "Date cannot be in the future" };
  }
  return { valid: true };
};

// Validate all expense fields
export const validateExpense = (category, amount, date) => {
  if (!category) {
    return { valid: false, error: "Please select a category" };
  }
  if (!amount) {
    return { valid: false, error: "Please enter an amount" };
  }
  if (!date) {
    return { valid: false, error: "Please select a date" };
  }

  const amountValidation = validateAmount(amount);
  if (!amountValidation.valid) {
    return amountValidation;
  }

  const dateValidation = validateDate(date);
  if (!dateValidation.valid) {
    return dateValidation;
  }

  return { valid: true };
};

// Get date range shortcuts
export const getDateRangeShortcut = (shortcut) => {
  const today = new Date();
  const start = new Date();
  
  switch (shortcut) {
    case "today":
      return {
        startDate: formatDateForInput(today),
        endDate: formatDateForInput(today),
      };
    case "week":
      start.setDate(today.getDate() - 7);
      return {
        startDate: formatDateForInput(start),
        endDate: formatDateForInput(today),
      };
    case "month":
      start.setDate(1);
      return {
        startDate: formatDateForInput(start),
        endDate: formatDateForInput(today),
      };
    case "quarter":
      start.setMonth(Math.floor(today.getMonth() / 3) * 3);
      start.setDate(1);
      return {
        startDate: formatDateForInput(start),
        endDate: formatDateForInput(today),
      };
    case "year":
      start.setMonth(0);
      start.setDate(1);
      return {
        startDate: formatDateForInput(start),
        endDate: formatDateForInput(today),
      };
    case "30days":
      start.setDate(today.getDate() - 30);
      return {
        startDate: formatDateForInput(start),
        endDate: formatDateForInput(today),
      };
    default:
      return { startDate: "", endDate: "" };
  }
};

// Format date for input[type="date"]
const formatDateForInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Calculate statistics
export const calculateStats = (expenses) => {
  if (expenses.length === 0) {
    return {
      total: 0,
      average: 0,
      highest: 0,
      lowest: 0,
      count: 0,
    };
  }

  const amounts = expenses.map(e => e.amount);
  const total = amounts.reduce((a, b) => a + b, 0);
  const average = total / amounts.length;
  const highest = Math.max(...amounts);
  const lowest = Math.min(...amounts);

  return {
    total,
    average: Math.round(average * 100) / 100,
    highest,
    lowest,
    count: expenses.length,
  };
};
