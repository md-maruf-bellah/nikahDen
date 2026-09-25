import { MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from "../constants/index.js";

/**
 * Parse & clamp pagination query params.
 * @returns {{ page, limit, skip }}
 */
export function parsePagination(query) {
  let page = Number.parseInt(query.page, 10);
  let limit = Number.parseInt(query.limit, 10);

  if (Number.isNaN(page) || page < 1) page = 1;
  if (Number.isNaN(limit) || limit < 1) limit = DEFAULT_PAGE_SIZE;
  if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;

  return { page, limit, skip: (page - 1) * limit };
}

export function buildPagination(total, page, limit) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Whitelist-protected sort builder. sortBy must be in allowed list and
 * sortOrder only asc|desc. Returns a Mongo sort object.
 */
export function parseSort(query, allowed = ["createdAt", "updatedAt"], defaultBy = "createdAt") {
  const sortBy = allowed.includes(query.sortBy) ? query.sortBy : defaultBy;
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  return { [sortBy]: sortOrder };
}

export default { parsePagination, buildPagination, parseSort };
