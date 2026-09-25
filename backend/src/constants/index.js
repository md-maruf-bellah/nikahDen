// ---------------------------------------------------------------
// Global constants for the Nikah Deen matrimony platform.
// Roles/permissions mirror the actual frontend:
//   - Admin user table offers  User / Admin / Editor / Owner
//   - Status badges:          Active / Pending / Inactive
// ---------------------------------------------------------------

export const ROLES = Object.freeze({
  SUPERADMIN: "SUPERADMIN", // platform owner (seeded)
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  USER: "USER",
});

export const ALL_ROLES = Object.values(ROLES);

export const USER_STATUSES = Object.freeze({
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  INACTIVE: "INACTIVE",
});

// UI user-management modal also shows an "Owner" role. We intentionally map it
// to the seeded SUPERADMIN so only the platform owner has global powers.
export const ROLE_DISPLAY = {
  [ROLES.SUPERADMIN]: "Owner",
  [ROLES.ADMIN]: "Admin",
  [ROLES.EDITOR]: "Editor",
  [ROLES.USER]: "User",
};

// ------------------------------------------------------------------
// Permission model (resource:action)
// ------------------------------------------------------------------
export const PERMISSIONS = Object.freeze({
  USER_READ: "user:read",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  BIODATA_CREATE: "biodata:create",
  BIODATA_READ: "biodata:read",
  BIODATA_UPDATE: "biodata:update",
  BIODATA_DELETE: "biodata:delete",
  BIODATA_APPROVE: "biodata:approve",

  MEMBERSHIP_READ: "membership:read",
  MEMBERSHIP_MANAGE: "membership:manage",

  ORDER_CREATE: "order:create",
  ORDER_READ: "order:read",
  ORDER_MANAGE: "order:manage",

  CONTACT_READ: "contact:read",
  CONTACT_MANAGE: "contact:manage",

  STATS_READ: "stats:read",
  NOTIFICATION_READ: "notification:read",
  MESSAGE_READ: "message:read",
  MESSAGE_WRITE: "message:write",
});

export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.SUPERADMIN]: ["*"], // wildcard => everything
  [ROLES.ADMIN]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.BIODATA_READ,
    PERMISSIONS.BIODATA_APPROVE,
    PERMISSIONS.BIODATA_DELETE,
    PERMISSIONS.MEMBERSHIP_MANAGE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_MANAGE,
    PERMISSIONS.CONTACT_READ,
    PERMISSIONS.CONTACT_MANAGE,
    PERMISSIONS.STATS_READ,
  ],
  [ROLES.EDITOR]: [
    PERMISSIONS.BIODATA_READ,
    PERMISSIONS.BIODATA_UPDATE,
    PERMISSIONS.BIODATA_APPROVE,
    PERMISSIONS.CONTACT_READ,
  ],
  [ROLES.USER]: [
    PERMISSIONS.BIODATA_CREATE,
    PERMISSIONS.BIODATA_READ,
    PERMISSIONS.BIODATA_UPDATE,
    PERMISSIONS.MEMBERSHIP_READ,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_WRITE,
  ],
});

export function hasPermission(role, permission) {
  const list = ROLE_PERMISSIONS[role];
  if (!list) return false;
  return list.includes("*") || list.includes(permission);
}

// ------------------------------------------------------------------
// Entity enums (values match the Bengali UI + form options)
// ------------------------------------------------------------------
export const GENDERS = Object.freeze({
  MALE: "MALE",
  FEMALE: "FEMALE",
});

export const MARITAL_STATUSES = Object.freeze({
  UNMARRIED: "UNMARRIED", // অবিবাহিত
  DIVORCED: "DIVORCED", // তালাকপ্রাপ্ত
  WIDOWED: "WIDOWED", // বিধবা / বিপত্নীক
  OTHER: "OTHER",
});

export const RELIGIONS = Object.freeze({
  ISLAM: "Islam",
  HINDUISM: "Hinduism",
  CHRISTIANITY: "Christianity",
  BUDDHISM: "Buddhism",
  OTHER: "Other",
});

// Skin colours used on the profile cards (গায়ের রং).
export const SKIN_COLORS = ["উজ্জ্বল ফর্সা", "ফর্সা", "উজ্জ্বল শ্যামলা", "শ্যামলা", "কালো"];

export const BIODATA_STATUSES = Object.freeze({
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  HIDDEN: "HIDDEN",
  ARCHIVED: "ARCHIVED",
});

export const ORDER_STATUSES = Object.freeze({
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
});

export const PAYMENT_METHODS = ["CARD", "PAYPAL", "BKASH", "NAGAD", "ROCKET", "OFFLINE"];

export const ORDER_KINDS = Object.freeze({
  PLAN: "PLAN", // membership subscription
  PACK: "PACK", // extra connects
});

export const SUBSCRIPTION_STATUSES = Object.freeze({
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
});

// Connect ledger event types (connects behave like inventory: every change is
// recorded so the balance is always auditable).
export const CONNECT_TYPES = Object.freeze({
  PLAN_GRANT: "PLAN_GRANT",
  PACK_PURCHASE: "PACK_PURCHASE",
  ADMIN_ADJUST: "ADMIN_ADJUST",
  BIODATA_VIEW: "BIODATA_VIEW",
  REFUND: "REFUND",
});

export const NOTIFICATION_TYPES = Object.freeze({
  BIODATA_LIKE: "BIODATA_LIKE",
  MUTUAL_LIKE: "MUTUAL_LIKE",
  BIODATA_STATUS: "BIODATA_STATUS",
  ORDER_PAID: "ORDER_PAID",
  MEMBERSHIP_EXPIRY: "MEMBERSHIP_EXPIRY",
  MESSAGE: "MESSAGE",
  SYSTEM: "SYSTEM",
});

export const CONTACT_STATUSES = Object.freeze({
  NEW: "NEW",
  REPLIED: "REPLIED",
  CLOSED: "CLOSED",
});

export const MESSAGE_STATUSES = Object.freeze({
  SENT: "SENT",
  READ: "READ",
});

export const COUNTER_NAMES = Object.freeze({
  BIODATA_NO: "biodata_no",
  ORDER_NO: "order_no",
  INVOICE_NO: "invoice_no",
});

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_VIEW_COST = 1;

// Zod re-usable enums are defined per-module; this is a single source for the
// raw enum arrays consumed by validators.
export const ENUM_ARRAYS = Object.freeze({
  ROLES: ALL_ROLES,
  USER_STATUSES: Object.values(USER_STATUSES),
  GENDERS: Object.values(GENDERS),
  MARITAL_STATUSES: Object.values(MARITAL_STATUSES),
  RELIGIONS: Object.values(RELIGIONS),
  BIODATA_STATUSES: Object.values(BIODATA_STATUSES),
  ORDER_STATUSES: Object.values(ORDER_STATUSES),
  PAYMENT_METHODS,
  ORDER_KINDS: Object.values(ORDER_KINDS),
  SUBSCRIPTION_STATUSES: Object.values(SUBSCRIPTION_STATUSES),
  CONNECT_TYPES: Object.values(CONNECT_TYPES),
  NOTIFICATION_TYPES: Object.values(NOTIFICATION_TYPES),
  CONTACT_STATUSES: Object.values(CONTACT_STATUSES),
});

// Bangladesh divisions as shown in the landing search bar (values sent by the
// frontend are Bengali display strings).
export const DIVISIONS = [
  "ঢাকা",
  "চট্টগ্রাম",
  "রাজশাহী",
  "সিলেট",
  "বরিশাল",
  "খুলনা",
  "রংপুর",
  "ময়মনসিংহ",
];
