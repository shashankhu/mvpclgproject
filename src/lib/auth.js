// ─────────────────────────────────────────────
// Diganta — Auth Utilities
// JWT token generation/verification + password hashing
// ─────────────────────────────────────────────

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET;
const FALLBACK_SECRET = "diganta_development_jwt_secret_key_super_long_and_secure";

/**
 * Validates the JWT_SECRET in production.
 * Throws only when called at runtime to avoid blocking the build process.
 */
function validateSecret() {
  if (process.env.NODE_ENV === "production") {
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
      throw new Error("FATAL: JWT_SECRET must be set and at least 32 characters in production. Check your Vercel Environment Variables.");
    }
  }
}

// Token expiry
const TOKEN_EXPIRY = "24h";
const SALT_ROUNDS = 12;

// ─── Token Management ───

export function generateToken(user) {
  validateSecret();
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET || FALLBACK_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token) {
  validateSecret();
  try {
    return jwt.verify(token, JWT_SECRET || FALLBACK_SECRET);
  } catch {
    return null;
  }
}


// ─── Password Management ───

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ─── Request Authentication ───

export function authenticate(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  return verifyToken(token);
}

/**
 * Strict Authentication — validates the token AND checks the DB
 * Ensures the user is still active and their role hasn't changed.
 * MUST be used for all mutation endpoints (POST/PUT/PATCH/DELETE).
 */
export async function authenticateStrict(request) {
  const decoded = authenticate(request);
  if (!decoded) return null;

  try {
    const prisma = (await import("@/lib/prisma")).default;
    
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!dbUser || !dbUser.isActive) {
      return null;
    }

    return {
      ...decoded,
      role: dbUser.role,
    };
  } catch (err) {
    console.error("[authenticateStrict]", err);
    return null;
  }
}
