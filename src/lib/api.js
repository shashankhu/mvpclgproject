// ─────────────────────────────────────────────
// Diganta — API Response Helpers
// Consistent error/success responses across all endpoints
// ─────────────────────────────────────────────

import { NextResponse } from "next/server";

export function success(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message, status = 400, details = null) {
  const body = { error: message };
  if (details) body.details = details;
  return NextResponse.json(body, { status });
}

export function unauthorized(message = "Authentication required") {
  return error(message, 401);
}

export function forbidden(message = "Insufficient permissions") {
  return error(message, 403);
}

export function notFound(message = "Resource not found") {
  return error(message, 404);
}

export function conflict(message = "Conflict") {
  return error(message, 409);
}

// ─── Input Validation ───

export function validateRequired(body, fields) {
  const missing = fields.filter(
    (f) => body[f] === undefined || body[f] === null || body[f] === ""
  );
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(", ")}`;
  }
  return null;
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateEnum(value, validValues, fieldName) {
  if (!validValues.includes(value)) {
    return `Invalid ${fieldName}: "${value}". Must be one of: ${validValues.join(", ")}`;
  }
  return null;
}
