// ─────────────────────────────────────────────
// POST /api/vendors/register — Public vendor self-registration
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { success, error, validateRequired } from "@/lib/api";
import { VENDOR_CATEGORIES, ROLES } from "@/lib/constants";
import { createAuditLog, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/lib/audit";

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    const missing = validateRequired(body, [
      "companyName", "contactPerson", "phone", "email", "password",
    ]);
    if (missing) return error(missing);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return error("Invalid email format");
    }

    // Validate password strength
    if (body.password.length < 8) {
      return error("Password must be at least 8 characters");
    }

    // Validate phone (10 digit Indian format)
    const phoneClean = body.phone.replace(/[\s-]/g, "");
    if (!/^\d{10}$/.test(phoneClean)) {
      return error("Phone must be a valid 10-digit number");
    }

    // Validate company name length
    if (body.companyName.length < 3 || body.companyName.length > 200) {
      return error("Company name must be between 3 and 200 characters");
    }

    // Validate categories
    const categories = body.categories || [];
    if (categories.length === 0) {
      return error("At least one service category is required");
    }
    if (categories.length > 5) {
      return error("Maximum 5 categories allowed");
    }
    const invalidCats = categories.filter((c) => !VENDOR_CATEGORIES.includes(c));
    if (invalidCats.length > 0) {
      return error(`Invalid categories: ${invalidCats.join(", ")}`);
    }

    // Validate GST number format (if provided)
    if (body.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(body.gstNumber)) {
      return error("Invalid GST number format");
    }

    // Validate PAN number format (if provided)
    if (body.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(body.panNumber)) {
      return error("Invalid PAN number format");
    }

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existingUser) {
      return error("An account with this email already exists", 409);
    }

    // Check GST uniqueness (if provided)
    if (body.gstNumber) {
      const existingGst = await prisma.vendor.findFirst({
        where: { gstNumber: body.gstNumber },
      });
      if (existingGst) {
        return error("A vendor with this GST number is already registered", 409);
      }
    }

    // Create user + vendor profile in a transaction
    const passwordHash = await hashPassword(body.password);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User (inactive until verified)
      const user = await tx.user.create({
        data: {
          name: body.contactPerson,
          email: body.email,
          passwordHash,
          role: ROLES.VENDOR,
          phone: phoneClean,
          isActive: false, // Activated on verification
        },
      });

      // 2. Create Vendor profile
      const vendor = await tx.vendor.create({
        data: {
          userId: user.id,
          companyName: body.companyName,
          contactPerson: body.contactPerson,
          phone: phoneClean,
          email: body.email,
          address: body.address || null,
          gstNumber: body.gstNumber || null,
          panNumber: body.panNumber || null,
          categories,
          description: body.description || null,
        },
      });

      // 3. Create audit log
      await createAuditLog(tx, {
        action: AUDIT_ACTIONS.VENDOR_REGISTERED,
        entityType: AUDIT_ENTITY_TYPES.VENDOR,
        entityId: vendor.id,
        userId: user.id,
        metadata: { companyName: body.companyName, categories },
      });

      // 4. Notify all Dean and Admin users
      const admins = await tx.user.findMany({
        where: {
          role: { in: [ROLES.DEAN, ROLES.ADMIN] },
          isActive: true,
        },
        select: { id: true },
      });

      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: "vendor_registration",
            title: "New Vendor Registration",
            message: `${body.companyName} has registered as a vendor and is awaiting verification.`,
          })),
        });
      }

      return { user, vendor };
    });

    return success({
      message: "Vendor registration submitted successfully! Your account will be reviewed and verified by the administration.",
      vendorId: result.vendor.id,
    }, 201);
  } catch (err) {
    console.error("[vendors:register]", err);
    return error("Registration failed. Please try again.", 500);
  }
}
