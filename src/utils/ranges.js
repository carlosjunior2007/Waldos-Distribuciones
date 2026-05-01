import { formatInputDate } from "./dates";

export function getCurrentMonthRange() {
  const now = new Date();
  return {
    start: formatInputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: formatInputDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

export function getThisYearRange() {
  const now = new Date();
  return {
    start: formatInputDate(new Date(now.getFullYear(), 0, 1)),
    end: formatInputDate(new Date(now.getFullYear(), 11, 31)),
  };
}

export function getLast30DaysRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);

  return {
    start: formatInputDate(start),
    end: formatInputDate(now),
  };
}