/**
 * API client for the Nikah Deen backend (backend/ folder).
 *
 * Plain fetch — no new dependencies. Every function matches a documented
 * endpoint in backend/docs/API.md. Access token + refresh token live in
 * localStorage; a 401 triggers one silent refresh-and-retry.
 *
 * Configure the API origin with NEXT_PUBLIC_API_URL (defaults to the local
 * dev server at :5000).
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// OAuth রিডাইরেক্ট API-র মূল origin-এ যায় (ব্রাউজার থেকে)
export const API_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "");

const ACCESS_KEY = "nk_access";
const REFRESH_KEY = "nk_refresh";

export const tokenStore = {
  getAccess: () => (typeof window === "undefined" ? null : window.localStorage.getItem(ACCESS_KEY)),
  getRefresh: () => (typeof window === "undefined" ? null : window.localStorage.getItem(REFRESH_KEY)),
  set(access, refresh) {
    window.localStorage.setItem(ACCESS_KEY, access);
    if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(message, { status = 0, errorCode = "NETWORK_ERROR", details, data = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
    this.data = data;
  }
}

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    q.set(key, value);
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function request(path, { method = "GET", body, params, auth = true, retried = false, raw = false } = {}) {
  const url = `${API_BASE}${path}${buildQuery(params)}`;
  const headers = {};
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const access = tokenStore.getAccess();
  if (auth && access) headers.Authorization = `Bearer ${access}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      credentials: "include",
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running?", { status: 0 });
  }

  const json = await res.json().catch(() => ({}));

  // Token expired → try one silent refresh, then replay the original request.
  if (res.status === 401 && auth && !retried && tokenStore.getRefresh()) {
    const refreshed = await request("/auth/refresh", {
      method: "POST",
      body: { refreshToken: tokenStore.getRefresh() },
      auth: false,
    }).catch(() => null);
    if (refreshed?.accessToken) {
      tokenStore.set(refreshed.accessToken, refreshed.refreshToken);
      return request(path, { method, body, params, auth, retried: true });
    }
    tokenStore.clear();
  }

  if (!res.ok) {
    throw new ApiError(json.message || `Request failed (${res.status})`, {
      status: res.status,
      errorCode: json.errorCode,
      details: json.details,
      data: json.data,
    });
  }

  // raw → full envelope ({ data, pagination }) for list endpoints.
  if (raw) return { data: json.data ?? null, pagination: json.pagination ?? null };
  return json.data ?? null;
}

const api = {
  get: (path, params) => request(path, { method: "GET", params }),
  // list() keeps the pagination envelope for server-paginated collections.
  list: (path, params) => request(path, { method: "GET", params, raw: true }),
  post: (path, body, opts) => request(path, { method: "POST", body, ...opts }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout", { refreshToken: tokenStore.getRefresh() }),
  changePassword: (data) => api.patch("/auth/change-password", data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, newPassword) => api.post("/auth/reset-password", { token, newPassword }),
  // OAuth — কোন প্রোভাইডার কনফিগার করা আছে + one-time কোড এক্সচেঞ্জ
  oauthProviders: () => api.get("/auth/oauth/providers"),
  oauthExchange: (code) => api.post("/auth/oauth/exchange", { code }),
  oauthStartUrl: (provider) => `${API_ORIGIN}/api/v1/auth/oauth/${provider}/start`,
};

// ---------------------------------------------------------------------------
// Biodatas (directory + own)
// ---------------------------------------------------------------------------
export const biodataApi = {
  // list() keeps the server pagination envelope ({ data, pagination })
  list: (params) => api.list("/biodatas", params),
  get: (id) => api.get(`/biodatas/${id}`),
  similar: (id) => api.get(`/biodatas/${id}/similar`),
  mine: () => api.get("/biodatas/me"),
  completion: () => api.get("/biodatas/me/completion"),
  create: (body) => api.post("/biodatas", body),
  update: (body) => api.patch("/biodatas/me", body),
  submit: () => api.post("/biodatas/me/submit"),
  like: (id) => api.post(`/biodatas/${id}/like`),
  unlike: (id) => api.del(`/biodatas/${id}/like`),
  likesSent: (params) => api.list("/biodatas/likes/sent", params),
  likesReceived: (params) => api.list("/biodatas/likes/received", params),
  // photos — multipart upload + main-photo / delete management
  uploadPhoto: (file) => {
    const fd = new FormData();
    fd.append("photo", file);
    return api.post("/biodatas/me/photos", fd);
  },
  setProfilePhoto: (biodataId, url) => api.patch(`/biodatas/${biodataId}/profile-photo`, { url }),
  deletePhoto: (biodataId, index) => api.del(`/biodatas/${biodataId}/photos/${index}`),
};

// ---------------------------------------------------------------------------
// Membership + orders
// ---------------------------------------------------------------------------
export const membershipApi = {
  plans: () => api.get("/membership/plans"),
  packs: () => api.get("/membership/packs"),
  mine: () => api.get("/membership/me"),
};

export const orderApi = {
  create: (body) => api.post("/orders", body),
  mine: (params) => api.get("/orders/me", params),
  get: (id) => api.get(`/orders/${id}`),
  pay: (id, body) => api.post(`/orders/${id}/pay`, body),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  validateCoupon: (code) => api.post("/orders/validate-coupon", { code }),
  // staff-only: full order/invoice list with filters
  adminList: (params) => api.list("/orders", params),
};

// ---------------------------------------------------------------------------
// Social
// ---------------------------------------------------------------------------
export const notificationApi = {
  // raw envelope: { data: { items, unreadCount }, pagination } — bell ব্যাজ unreadCount পড়ে
  list: (params) => api.list("/notifications", params),
  read: (id) => api.patch(`/notifications/${id}/read`, {}),
  readAll: () => api.patch("/notifications/read-all", {}),
  remove: (id) => api.del(`/notifications/${id}`),
};

// ---------------------------------------------------------------------------
// Partner preferences + matching
// ---------------------------------------------------------------------------
export const preferencesApi = {
  mine: () => api.get("/preferences/me"),
  save: (body) => api.put("/preferences/me", body),
  matches: (params) => api.list("/preferences/matches", params),
};

export const userApi = {
  // member-directory search (messenger-এ নতুন কথোপকথন শুরুর জন্য)
  search: (q, limit) => api.get("/users/search", { q, limit }),
  // guard-পূর্ব প্রিভিউ — rows-এ block/limit নিষ্ক্রিয় দেখানোর জন্য
  searchIntent: (ids) => api.get("/users/search-intent", { ids: ids.join(",") }),
};

export const conversationApi = {
  list: (params) => api.get("/conversations", params),
  start: (body) => api.post("/conversations", body),
  messages: (id, params) => api.get(`/conversations/${id}/messages`, params),
  send: (id, text) => api.post(`/conversations/${id}/messages`, { text }),
  markRead: (id) => api.patch(`/conversations/${id}/read`, {}),
};

// ---------------------------------------------------------------------------
// Block / Unblock (messaging gate)
// ---------------------------------------------------------------------------
export const blockApi = {
  list: (params) => api.list("/blocks", params),
  block: (userId, reason) => api.post("/blocks", { userId, reason }),
  unblock: (userId) => api.del(`/blocks/${userId}`),
  statusFor: (userId) => api.get(`/blocks/${userId}/status`),
};

export const contactApi = {
  send: (body) => api.post("/contacts", body, { auth: false }),
  // staff inbox
  newCount: () => api.get("/contacts/new-count"),
  list: (params) => api.list("/contacts", params),
  get: (id) => api.get(`/contacts/${id}`),
  update: (id, body) => api.patch(`/contacts/${id}`, body),
  remove: (id) => api.del(`/contacts/${id}`),
};

// ---------------------------------------------------------------------------
// Admin / staff
// ---------------------------------------------------------------------------
export const usersApi = {
  list: (params) => api.list("/users", params),
  create: (body) => api.post("/users", body),
  update: (id, body) => api.patch(`/users/${id}`, body),
  remove: (id) => api.del(`/users/${id}`),
};

export const adminApi = {
  stats: () => api.get("/admin/stats"),
  // OAuth ইভেন্ট হিস্ট্রি (Mongo capped collection — restart-persistent)
  oauthEvents: (params) => api.get("/admin/oauth/events", params),
  // Contact spam-drop হিস্ট্রি (capped collection — restart-persistent)
  contactEvents: (params) => api.get("/admin/contact/events", params),
  moderate: (id, status, rejectionReason) =>
    api.patch(`/biodatas/${id}/status`, rejectionReason ? { status, rejectionReason } : { status }),
};

// ---------------------------------------------------------------------------
// Public site counters
// ---------------------------------------------------------------------------
export const siteApi = {
  stats: () => api.get("/site/stats"),
};

export default api;
