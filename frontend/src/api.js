// Central API base URL - reads from env in prod, proxies in dev
export const API_BASE = process.env.REACT_APP_API_URL || "";

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(t) {
  localStorage.setItem("token", t);
}

export function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  register: (body) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  getExpenses: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/expenses${q ? "?" + q : ""}`);
  },
  addExpense: (body) =>
    request("/api/expenses", { method: "POST", body: JSON.stringify(body) }),
  deleteExpense: (id) => request(`/api/expenses/${id}`, { method: "DELETE" }),
  getAnalytics: (year) => request(`/api/analytics?year=${year}`),
};
