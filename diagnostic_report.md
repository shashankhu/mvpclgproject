
# Diganta Project Diagnostic Report

## 1. PROJECT STRUCTURE
```text
.gitignore
AGENTS.md
CLAUDE.md
LICENSE
README.md
eslint.config.mjs
jsconfig.json
next.config.mjs
package-lock.json
package.json
prisma.config.ts
prisma/schema.prisma
public/file.svg
public/globe.svg
public/next.svg
public/vercel.svg
public/window.svg
src/app/(app)/approvals/page.js
src/app/(app)/clubs/page.js
src/app/(app)/dashboard/page.js
src/app/(app)/events/[id]/page.js
src/app/(app)/events/new/page.js
src/app/(app)/events/page.js
src/app/(app)/layout.js
src/app/(app)/notifications/page.js
src/app/api/approvals/pending/route.js
src/app/api/auth/login/route.js
src/app/api/auth/me/route.js
src/app/api/auth/signup/route.js
src/app/api/clubs/[id]/members/route.js
src/app/api/clubs/route.js
src/app/api/dashboard/route.js
src/app/api/events/[id]/approve/route.js
src/app/api/events/[id]/budget/route.js
src/app/api/events/[id]/expenses/route.js
src/app/api/events/[id]/join/route.js
src/app/api/events/[id]/route.js
src/app/api/events/[id]/submit/route.js
src/app/api/events/[id]/tasks/route.js
src/app/api/events/route.js
src/app/api/notifications/route.js
src/app/favicon.ico
src/app/globals.css
src/app/layout.js
src/app/login/page.js
src/app/page.js
src/app/page.module.css
src/app/signup/page.js
src/components/Sidebar.js
src/components/Toast.js
src/context/AuthContext.js
src/lib/api.js
src/lib/approval.js
src/lib/auth.js
src/lib/constants.js
src/lib/prisma.js
src/lib/utils.js

```

## 2. DEPENDENCIES
```json
{
  "name": "mvptrail",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "node prisma/seed.js",
    "db:setup": "prisma generate && prisma db push && node prisma/seed.js",
    "db:reset": "prisma migrate reset --force && node prisma/seed.js",
    "db:studio": "prisma studio"
  },
  "prisma": {
    "seed": "node prisma/seed.js"
  },
  "dependencies": {
    "@prisma/adapter-pg": "^7.5.0",
    "@prisma/client": "^7.5.0",
    "bcryptjs": "^3.0.3",
    "jsonwebtoken": "^9.0.3",
    "lucide-react": "^1.4.0",
    "next": "16.2.1",
    "pg": "^8.20.0",
    "prisma": "^7.5.0",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "dotenv": "^17.3.1",
    "eslint": "^9",
    "eslint-config-next": "16.2.1",
    "vitest": "^4.1.2"
  }
}
```

## 3. DATABASE SCHEMA
```prisma
// Diganta — College Event Management System
// Prisma Schema — PostgreSQL

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// ─────────────────────────────────────────────
// USERS & ROLES
// ─────────────────────────────────────────────

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  role         String   // student | club_head | faculty_coordinator | dean | principal | admin | transport | security | resource | finance | vendor
  department   String?
  phone        String?
  avatarUrl    String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  clubMemberships ClubMember[]
  createdEvents   Event[]         @relation("EventCreator")
  approvalLogs    ApprovalLog[]
  assignedTasks   Task[]          @relation("TaskAssignee")
  createdTasks    Task[]          @relation("TaskCreator")
  notifications   Notification[]
  expenses        Expense[]
  coordinatedClubs Club[]         @relation("ClubFacultyCoordinator")
  createdResourceRequests ResourceRequest[] @relation("ResourceRequestCreator")
  reviewedResourceRequests ResourceRequest[] @relation("ResourceRequestReviewer")
  vendorProfile        Vendor?           @relation("VendorProfile")
  verifiedVendors      Vendor[]          @relation("VendorVerifier")
  quotationRequests    QuotationRequest[] @relation("QuotationRequester")
  uploadedAttachments  Attachment[]      @relation("AttachmentUploader")
  processedBills       VendorBill[]      @relation("BillProcessor")
  auditLogs            AuditLog[]        @relation("AuditUser")

  @@index([role])
  @@index([email])
  @@index([department])
}

// ─────────────────────────────────────────────
// CLUBS & MEMBERSHIPS
// ─────────────────────────────────────────────

model Club {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  department  String?
  logoUrl     String?
  type        String   @default("departmental") // departmental | non_departmental
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Assigned Faculty Coordinator (required for approval routing)
  facultyCoordinatorId String?
  facultyCoordinator   User?   @relation("ClubFacultyCoordinator", fields: [facultyCoordinatorId], references: [id])

  // Relations
  members        ClubMember[]
  events         Event[]
  eventJoins     EventParticipant[]
  resourceRequests ResourceRequest[]

  @@index([name])
  @@index([type])
  @@index([facultyCoordinatorId])
}

model ClubMember {
  id       String @id @default(cuid())
  userId   String
  clubId   String
  role     String @default("member") // member | head | coordinator
  joinedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  club Club @relation(fields: [clubId], references: [id], onDelete: Cascade)

  @@unique([userId, clubId])
  @@index([clubId])
  @@index([userId])
}

// ─────────────────────────────────────────────
// EVENTS (Core Entity)
// ─────────────────────────────────────────────

model Event {
  id             String   @id @default(cuid())
  title          String
  description    String
  type           String   // tech | cultural | sports | workshop | seminar | standard
  eventType      String   @default("club") // club | standard (dean-created)
  status         String   @default("DRAFT")
  // DRAFT → WAITING_FOR_FACULTY → WAITING_FOR_DEAN → WAITING_FOR_PRINCIPAL → WAITING_FOR_ADMIN → APPROVED → REJECTED → IN_PROGRESS → COMPLETED → ARCHIVED

  // Proposal fields
  objectives     String?
  targetAudience String?
  expectedAttendance Int?
  venue          String?
  eventDate      DateTime?
  eventEndDate   DateTime?

  // Budget
  budgetEstimate Decimal    @default(0) @db.Decimal(12, 2)

  // Addons (execution layer metadata)
  needsTransport Boolean  @default(false)
  needsSecurity  Boolean  @default(false)
  needsResources Boolean  @default(false)
  transportNotes String?
  securityNotes  String?
  resourceNotes  String?

  // Creator & ownership
  createdById    String
  clubId         String?   // null for dean-created standard events

  // Parent-child hierarchy for sub-events within standard events
  parentEventId  String?   // null for top-level events, references parent standard event for sub-events

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  createdBy      User             @relation("EventCreator", fields: [createdById], references: [id])
  club           Club?            @relation(fields: [clubId], references: [id])
  parentEvent    Event?           @relation("ParentSubEvents", fields: [parentEventId], references: [id])
  subEvents      Event[]          @relation("ParentSubEvents")
  approvalLogs   ApprovalLog[]
  budget         Budget?
  expenses       Expense[]
  tasks          Task[]
  participants   EventParticipant[]
  notifications  Notification[]
  deptNotifications DeptNotification[]
  resourceRequests ResourceRequest[]
  quotationRequests QuotationRequest[]
  attachments      Attachment[]
  vendorBills      VendorBill[]

  @@index([status])
  @@index([eventType])
  @@index([clubId])
  @@index([createdById])
  @@index([createdById, status])
  @@index([eventDate])
  @@index([parentEventId])
  @@index([eventType, parentEventId])
}

// ─────────────────────────────────────────────
// EVENT PARTICIPANTS (Clubs joining Standard Events)
// ─────────────────────────────────────────────

model EventParticipant {
  id       String   @id @default(cuid())
  eventId  String
  clubId   String
  status   String   @default("joined") // joined | left
  joinedAt DateTime @default(now())

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  club  Club  @relation(fields: [clubId], references: [id], onDelete: Cascade)

  @@unique([eventId, clubId])
  @@index([eventId])
}

// ─────────────────────────────────────────────
// RESOURCE REQUESTS (Clubs request resources within Standard Events)
// ─────────────────────────────────────────────

model ResourceRequest {
  id          String   @id @default(cuid())
  eventId     String
  clubId      String
  requestedById String

  // Request details
  title       String
  description String?
  category    String   // venue | equipment | transport | catering | printing | security | funding | other
  amount      Decimal? @db.Decimal(12, 2) // If requesting funding
  quantity    Int?     // If requesting items
  priority    String   @default("medium") // low | medium | high | urgent

  // Status workflow
  status      String   @default("pending") // pending | approved | rejected | fulfilled | quotation_requested
  reviewedById String?
  reviewComment String?
  reviewedAt  DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  event       Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  club        Club  @relation(fields: [clubId], references: [id], onDelete: Cascade)
  requestedBy User  @relation("ResourceRequestCreator", fields: [requestedById], references: [id])
  reviewedBy  User? @relation("ResourceRequestReviewer", fields: [reviewedById], references: [id])
  quotationRequests QuotationRequest[]
  attachments      Attachment[]

  @@index([eventId])
  @@index([clubId])
  @@index([status])
}

// ─────────────────────────────────────────────
// APPROVAL ENGINE (Immutable Event-Sourcing Logs)
// ─────────────────────────────────────────────

model ApprovalLog {
  id        String   @id @default(cuid())
  eventId   String
  userId    String
  role      String   // role at time of action (frozen — survives user role changes)
  action    String   // approved | rejected | revision_requested
  comment   String?
  stage     String   // faculty_coordinator | dean | principal | admin
  createdAt DateTime @default(now())

  event   Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user    User  @relation(fields: [userId], references: [id])

  @@index([eventId])
  @@index([userId])
  @@index([stage])
}

// ─────────────────────────────────────────────
// DEPARTMENT NOTIFICATIONS (Dean's intent on approval)
// ─────────────────────────────────────────────

model DeptNotification {
  id            String   @id @default(cuid())
  eventId       String
  departmentRole String  // transport | security | resource | finance
  message       String?
  isAcknowledged Boolean @default(false)
  createdAt     DateTime @default(now())

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId])
  @@index([departmentRole])
}

// ─────────────────────────────────────────────
// BUDGET & EXPENSES
// ─────────────────────────────────────────────

model Budget {
  id             String   @id @default(cuid())
  eventId        String   @unique
  totalAllocated Decimal  @db.Decimal(12, 2)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

model Expense {
  id          String   @id @default(cuid())
  eventId     String
  amount      Decimal  @db.Decimal(12, 2)
  description String
  category    String   // venue | catering | equipment | printing | transport | security | other
  proofUrl    String?  // bill upload path
  addedById   String
  createdAt   DateTime @default(now())

  event   Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  addedBy User  @relation(fields: [addedById], references: [id])

  @@index([eventId])
  @@index([category])
}

// ─────────────────────────────────────────────
// TASK MANAGEMENT (Execution Tracker)
// ─────────────────────────────────────────────

model Task {
  id          String    @id @default(cuid())
  eventId     String
  title       String
  description String?
  status      String    @default("pending") // pending | in_progress | completed | delayed
  priority    String    @default("medium")  // low | medium | high | urgent
  deadline    DateTime?
  assigneeId  String?
  createdById String
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  event     Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  assignee  User? @relation("TaskAssignee", fields: [assigneeId], references: [id])
  createdBy User  @relation("TaskCreator", fields: [createdById], references: [id])

  @@index([eventId])
  @@index([assigneeId])
  @@index([status])
}

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

model Notification {
  id        String   @id @default(cuid())
  userId    String
  eventId   String?
  type      String   // approval_required | event_approved | event_rejected | task_assigned | dept_alert | general
  title     String
  message   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  event Event? @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([userId, isRead, createdAt])
  @@index([userId])
  @@index([eventId])
}

// ─────────────────────────────────────────────
// VENDORS (External Service Providers)
// ─────────────────────────────────────────────

model Vendor {
  id             String   @id @default(cuid())
  userId         String   @unique
  companyName    String
  contactPerson  String
  phone          String
  email          String
  address        String?
  gstNumber      String?
  panNumber      String?
  categories     String[]
  description    String?
  isVerified     Boolean  @default(false)
  verifiedById   String?
  verifiedAt     DateTime?
  rating         Decimal? @db.Decimal(3, 2)
  totalOrders    Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user           User     @relation("VendorProfile", fields: [userId], references: [id])
  verifiedBy     User?    @relation("VendorVerifier", fields: [verifiedById], references: [id])
  quotations     Quotation[]
  documents      VendorDocument[]
  awardedQuotationRequests QuotationRequest[] @relation("AwardedQuotations")
  vendorBills    VendorBill[]

  @@index([isVerified])
}

// ─────────────────────────────────────────────
// QUOTATION REQUESTS (Dean requests quotes from vendors)
// ─────────────────────────────────────────────

model QuotationRequest {
  id                String   @id @default(cuid())
  resourceRequestId String
  eventId           String
  title             String
  description       String?
  requirements      String?
  category          String
  budgetLimit       Decimal? @db.Decimal(12, 2)
  deadline          DateTime?
  status            String   @default("open") // open | closed | awarded

  requestedById     String
  awardedToId       String?
  awardedAt         DateTime?
  awardComment      String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  resourceRequest   ResourceRequest @relation(fields: [resourceRequestId], references: [id])
  event             Event           @relation(fields: [eventId], references: [id])
  requestedBy       User            @relation("QuotationRequester", fields: [requestedById], references: [id])
  awardedTo         Vendor?         @relation("AwardedQuotations", fields: [awardedToId], references: [id])
  quotations        Quotation[]
  attachments       Attachment[]
  vendorBill        VendorBill?

  @@index([eventId])
  @@index([status])
  @@index([category])
  @@index([resourceRequestId])
}

// ─────────────────────────────────────────────
// QUOTATIONS (Vendor submissions — versioned)
// ─────────────────────────────────────────────

model Quotation {
  id                  String   @id @default(cuid())
  quotationRequestId  String
  vendorId            String
  version             Int      @default(1)
  amount              Decimal  @db.Decimal(12, 2)
  description         String?
  deliveryTimeline    String?
  termsAndConditions  String?
  validUntil          DateTime?
  status              String   @default("submitted") // submitted | superseded | accepted | rejected | withdrawn
  isLatest            Boolean  @default(true)
  submittedAt         DateTime @default(now())

  reviewComment       String?
  reviewedAt          DateTime?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  quotationRequest    QuotationRequest @relation(fields: [quotationRequestId], references: [id])
  vendor              Vendor           @relation(fields: [vendorId], references: [id])
  attachments         Attachment[]
  vendorBill          VendorBill?

  @@unique([quotationRequestId, vendorId, version])
  @@index([quotationRequestId])
  @@index([vendorId])
  @@index([status])
  @@index([isLatest])
}

// ─────────────────────────────────────────────
// VENDOR BILLS (Auto-created on vendor award)
// ─────────────────────────────────────────────

model VendorBill {
  id                  String   @id @default(cuid())
  quotationRequestId  String   @unique
  quotationId         String   @unique
  vendorId            String
  eventId             String

  billNumber          String?
  billAmount          Decimal  @db.Decimal(12, 2)
  taxAmount           Decimal? @db.Decimal(12, 2)
  totalAmount         Decimal  @db.Decimal(12, 2)
  paymentStatus       String   @default("pending") // pending | processing | paid | rejected
  paymentDate         DateTime?
  paymentReference    String?
  paymentComment      String?
  processedById       String?
  processedAt         DateTime?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  quotationRequest    QuotationRequest @relation(fields: [quotationRequestId], references: [id])
  quotation           Quotation        @relation(fields: [quotationId], references: [id])
  vendor              Vendor           @relation(fields: [vendorId], references: [id])
  event               Event            @relation(fields: [eventId], references: [id])
  processedBy         User?            @relation("BillProcessor", fields: [processedById], references: [id])
  attachments         Attachment[]

  @@index([vendorId])
  @@index([eventId])
  @@index([paymentStatus])
}

// ─────────────────────────────────────────────
// ATTACHMENTS (Universal file attachment system)
// ─────────────────────────────────────────────

model Attachment {
  id           String   @id @default(cuid())
  fileName     String
  fileUrl      String
  fileSize     Int
  mimeType     String
  uploadedById String

  // Polymorphic references (only one should be set)
  eventId              String?
  quotationRequestId   String?
  quotationId          String?
  resourceRequestId    String?
  vendorBillId         String?

  createdAt   DateTime @default(now())

  uploadedBy          User              @relation("AttachmentUploader", fields: [uploadedById], references: [id])
  event               Event?            @relation(fields: [eventId], references: [id], onDelete: Cascade)
  quotationRequest    QuotationRequest? @relation(fields: [quotationRequestId], references: [id], onDelete: Cascade)
  quotation           Quotation?        @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  resourceRequest     ResourceRequest?  @relation(fields: [resourceRequestId], references: [id], onDelete: Cascade)
  vendorBill          VendorBill?       @relation(fields: [vendorBillId], references: [id], onDelete: Cascade)

  @@index([eventId])
  @@index([quotationRequestId])
  @@index([quotationId])
  @@index([resourceRequestId])
  @@index([vendorBillId])
}

// ─────────────────────────────────────────────
// VENDOR DOCUMENTS (Registration documents)
// ─────────────────────────────────────────────

model VendorDocument {
  id         String   @id @default(cuid())
  vendorId   String
  docType    String   // gst_certificate | pan_card | registration | portfolio | other
  fileName   String
  fileUrl    String
  fileSize   Int
  mimeType   String
  createdAt  DateTime @default(now())

  vendor     Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)

  @@index([vendorId])
}

// ─────────────────────────────────────────────
// AUDIT LOG (Immutable action trail)
// ─────────────────────────────────────────────

model AuditLog {
  id         String   @id @default(cuid())
  action     String   // vendor_registered | vendor_verified | quotation_submitted | vendor_awarded | etc.
  entityType String   // vendor | quotation_request | quotation | vendor_bill
  entityId   String
  userId     String
  metadata   String?  // JSON string
  createdAt  DateTime @default(now())

  user       User     @relation("AuditUser", fields: [userId], references: [id])

  @@index([entityType, entityId])
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}

```

## 4. ENVIRONMENT CONFIG
```env
# ─────────────────────────────────────────────
# Diganta — Environment Configuration
# ─────────────────────────────────────────────

# Database Configuration
# Generic placeholders for security
DATABASE_URL="postgresql://username:your_secure_password@localhost:5432/diganta_db"
# Example for local development:
# DATABASE_URL="postgresql://postgres:password123@localhost:5432/diganta_mvp"

# JWT Authentication Secret
JWT_SECRET="diganta_super_secret_jwt_key_change_in_production"

# Next.js Configuration
NEXTAUTH_SECRET="diganta_nextauth_secret_key"
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"

# Optional: Database Pool Config
DATABASE_POOL_SIZE=10
DATABASE_TIMEOUT=30000

# ─────────────────────────────────────────────
# Instructions:
# 1. Copy this file to .env.local for development
# 2. Update DATABASE_URL with your PostgreSQL credentials
# 3. Change JWT_SECRET to a secure random string in production
# 4. Never commit .env files with real credentials to git
# ─────────────────────────────────────────────
```

## 5. AUTH IMPLEMENTATION

### src/lib/auth.js
```javascript
// ─────────────────────────────────────────────
// Diganta — Auth Utilities
// JWT token generation/verification + password hashing
// ─────────────────────────────────────────────

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("FATAL: JWT_SECRET must be set and at least 32 characters in production");
  }
}
// Temporary fallback for local dev ONLY
const SECRET_KEY = JWT_SECRET || "diganta_development_jwt_secret_key_super_long_and_secure";

// Token expiry (reduced to 2 hours for security)
const TOKEN_EXPIRY = "2h";
const SALT_ROUNDS = 12;

// ─── Token Management ───

export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET || SECRET_KEY,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET || SECRET_KEY);
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

```

### src/app/api/auth/login/route.js
```javascript
// ─────────────────────────────────────────────
// POST /api/auth/login
// Authenticate user and return JWT
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { comparePassword, generateToken } from "@/lib/auth";
import { success, error, validateRequired } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(request) {
  try {
    const body = await request.json();

    const missing = validateRequired(body, ["email", "password"]);
    if (missing) return error(missing);

    // --- Rate Limiting (10 attempts per 15 minutes per email) ---
    const rl = checkRateLimit(`login_${body.email.toLowerCase()}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) {
      return error("Too many login attempts. Please try again later.", 429);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return error("Invalid email or password", 401);
    }

    if (!user.isActive) {
      return error("Account is deactivated", 403);
    }

    // Verify password
    const valid = await comparePassword(body.password, user.passwordHash);
    if (!valid) {
      return error("Invalid email or password", 401);
    }

    // Generate token
    const token = generateToken(user);

    return success({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    console.error("[login]", err);
    return error("Internal server error", 500);
  }
}

```

### src/app/api/auth/signup/route.js
```javascript
// ─────────────────────────────────────────────
// POST /api/auth/signup
// Create a new user account
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { hashPassword, generateToken } from "@/lib/auth";
import { success, error, validateRequired, validateEmail, validateEnum } from "@/lib/api";
import { ALL_ROLES } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(request) {
  try {
    // Use IP for signup rate limiting (fallback to generic if IP unavailable)
    const ip = request.headers.get("x-forwarded-for") || "unknown_ip";

    // --- Rate Limiting (5 signups per hour per IP) ---
    const rl = checkRateLimit(`signup_${ip}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) {
      return error("Too many accounts created from this IP. Please try again later.", 429);
    }

    const body = await request.json();

    // Validate required fields
    const missing = validateRequired(body, ["name", "email", "password", "role"]);
    if (missing) return error(missing);

    // Validate email format
    if (!validateEmail(body.email)) {
      return error("Invalid email format");
    }

    // Validate role: self-registration is strictly for students
    // Admin users create authoritative roles via /api/admin/users
    const ALLOWED_SIGNUP_ROLES = ["student"];
    if (!ALLOWED_SIGNUP_ROLES.includes(body.role)) {
      return error("Self-registration is only available for students. Contact admin for other roles.", 403);
    }

    // Validate password strength
    if (body.password.length < 6) {
      return error("Password must be at least 6 characters");
    }

    // Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return error("Email already registered", 409);
    }

    // Create user
    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role,
        department: body.department || null,
        phone: body.phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    const token = generateToken(user);

    return success({ user, token }, 201);
  } catch (err) {
    console.error("[signup]", err);
    return error("Internal server error", 500);
  }
}

```

## 6. CORE API ROUTES

### src/app/api/events/route.js
```javascript
// ─────────────────────────────────────────────
// GET  /api/events — List events (role-filtered)
// POST /api/events — Create event
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import {
  success,
  error,
  unauthorized,
  forbidden,
  validateRequired,
} from "@/lib/api";
import { EVENT_STATUS, ROLES } from "@/lib/constants";

// ─── GET: List Events ───

export async function GET(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const eventType = searchParams.get("eventType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where filter
    const where = { parentEventId: null }; // Only show top-level events, not sub-events
    if (status) where.status = status;
    if (type) where.type = type;
    if (eventType) where.eventType = eventType;

    // Role-based filtering
    if (decoded.role === ROLES.STUDENT || decoded.role === ROLES.CLUB_HEAD) {
      // Students/Club heads see: their own events + standard events
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { clubMemberships: { select: { clubId: true } } },
      });
      const clubIds = user?.clubMemberships.map((m) => m.clubId) || [];

      where.OR = [
        { clubId: { in: clubIds } },
        { eventType: "standard" },
      ];
    }
    // Faculty/Dean/Principal/Admin see all events

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          club: { select: { id: true, name: true } },
          _count: {
            select: {
              approvalLogs: true,
              tasks: true,
              participants: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return success({
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[events:list]", err);
    return error("Internal server error", 500);
  }
}

// ─── POST: Create Event ───

export async function POST(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const body = await request.json();

    const missing = validateRequired(body, ["title", "description", "type"]);
    if (missing) return error(missing);

    // ─── Standard Event (Dean creates) ───
    if (body.eventType === "standard") {
      if (decoded.role !== ROLES.DEAN && decoded.role !== ROLES.ADMIN) {
        return forbidden("Only Dean or Admin can create standard events");
      }

      const event = await prisma.event.create({
        data: {
          title: body.title,
          description: body.description,
          type: body.type,
          eventType: "standard",
          status: EVENT_STATUS.APPROVED, // Standard events auto-approved
          objectives: body.objectives || null,
          targetAudience: body.targetAudience || null,
          expectedAttendance: body.expectedAttendance || null,
          venue: body.venue || null,
          eventDate: body.eventDate ? new Date(body.eventDate) : null,
          eventEndDate: body.eventEndDate ? new Date(body.eventEndDate) : null,
          budgetEstimate: body.budgetEstimate || 0,
          needsTransport: body.needsTransport || false,
          needsSecurity: body.needsSecurity || false,
          needsResources: body.needsResources || false,
          transportNotes: body.transportNotes || null,
          securityNotes: body.securityNotes || null,
          resourceNotes: body.resourceNotes || null,
          createdById: decoded.userId,
          clubId: null,
        },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
        },
      });

      return success({ event }, 201);
    }

    // ─── Club Event (Club members create) ───
    if (
      decoded.role !== ROLES.STUDENT &&
      decoded.role !== ROLES.CLUB_HEAD
    ) {
      return forbidden("Only students and club heads can create club events");
    }

    // Must belong to a club
    if (!body.clubId) {
      return error("clubId is required for club events");
    }

    const membership = await prisma.clubMember.findUnique({
      where: {
        userId_clubId: {
          userId: decoded.userId,
          clubId: body.clubId,
        },
      },
    });

    if (!membership) {
      return forbidden("You are not a member of this club");
    }

    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        eventType: "club",
        status: EVENT_STATUS.DRAFT,
        objectives: body.objectives || null,
        targetAudience: body.targetAudience || null,
        expectedAttendance: body.expectedAttendance || null,
        venue: body.venue || null,
        eventDate: body.eventDate ? new Date(body.eventDate) : null,
        eventEndDate: body.eventEndDate ? new Date(body.eventEndDate) : null,
        budgetEstimate: body.budgetEstimate || 0,
        needsTransport: body.needsTransport || false,
        needsSecurity: body.needsSecurity || false,
        needsResources: body.needsResources || false,
        transportNotes: body.transportNotes || null,
        securityNotes: body.securityNotes || null,
        resourceNotes: body.resourceNotes || null,
        createdById: decoded.userId,
        clubId: body.clubId,
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        club: { select: { id: true, name: true } },
      },
    });

    return success({ event }, 201);
  } catch (err) {
    console.error("[events:create]", err);
    return error("Internal server error", 500);
  }
}

```

### src/app/api/events/[id]/route.js
```javascript
// ─────────────────────────────────────────────
// GET  /api/events/[id] — Event detail
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, notFound, forbidden } from "@/lib/api";

export async function GET(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        club: {
          select: { id: true, name: true, description: true },
        },
        parentEvent: {
          select: { id: true, title: true, status: true, eventType: true },
        },
        subEvents: {
          orderBy: { createdAt: "desc" },
          include: {
            club: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true, role: true } },
            _count: {
              select: {
                resourceRequests: true,
                tasks: true,
                expenses: true,
              },
            },
          },
        },
        approvalLogs: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
        },
        budget: true,
        expenses: {
          orderBy: { createdAt: "desc" },
          include: {
            addedBy: { select: { id: true, name: true } },
          },
        },
        tasks: {
          orderBy: { createdAt: "desc" },
          include: {
            assignee: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
          },
        },
        participants: {
          include: {
            club: { select: { id: true, name: true } },
          },
        },
        deptNotifications: true,
        resourceRequests: {
          orderBy: { createdAt: "desc" },
          include: {
            club: { select: { id: true, name: true } },
            requestedBy: { select: { id: true, name: true } },
            reviewedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!event) {
      console.error("[events:detail] Event not found for id:", id);
      return notFound("Event not found");
    }

    // --- Access Control Authorization ---
    // Standard events are public to all authenticated users
    if (event.eventType !== "standard") {
      let hasAccess = false;
      const { role, userId } = decoded;

      // 1. Creator always has access
      if (event.createdById === userId) hasAccess = true;
      // 2. Admins and Deans always have access
      else if (role === "admin" || role === "super_admin" || role === "dean") hasAccess = true;
      // 3. Department roles might have access to approved events
      else if (["transport", "security", "resource", "finance"].includes(role) && event.status === "APPROVED") hasAccess = true;
      // 4. Approver roles (faculty coordinator, principal) have access
      else if (["faculty_coordinator", "principal"].includes(role)) hasAccess = true;
      // 5. Club members have access if it's a club event
      else if (event.clubId) {
        const membership = await prisma.clubMember.findUnique({
          where: { userId_clubId: { userId, clubId: event.clubId } }
        });
        if (membership) hasAccess = true;
      }
      // 6. If it's a sub-event, members of the club that created it have access
      else if (event.parentEventId && event.clubId) {
        const membership = await prisma.clubMember.findUnique({
          where: { userId_clubId: { userId, clubId: event.clubId } }
        });
        if (membership) hasAccess = true;
      }

      if (!hasAccess) {
        return forbidden("You do not have access to view this event's details");
      }
    }

    // Add computed fields
    const totalExpenses = event.expenses.reduce((sum, e) => sum + e.amount, 0);
    const budgetRemaining = event.budget
      ? event.budget.totalAllocated - totalExpenses
      : 0;

    // Add sub-event statistics for standard events
    const subEventStats = event.eventType === "standard" ? {
      totalSubEvents: event.subEvents.length,
      totalResourceRequests: event.subEvents.reduce((sum, se) => sum + se._count.resourceRequests, 0),
      totalSubEventTasks: event.subEvents.reduce((sum, se) => sum + se._count.tasks, 0),
      totalSubEventExpenses: event.subEvents.reduce((sum, se) => sum + se._count.expenses, 0),
    } : null;

    return success({
      event: {
        ...event,
        totalExpenses,
        budgetRemaining,
        budgetAllocated: event.budget?.totalAllocated || 0,
        subEventStats,
      },
    });
  } catch (err) {
    console.error("[events:detail]", err);
    return error("Internal server error", 500);
  }
}

```

### src/app/api/dashboard/route.js
```javascript
// ─────────────────────────────────────────────
// GET /api/dashboard — Role-aware dashboard data
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized } from "@/lib/api";
import { ROLES, EVENT_STATUS } from "@/lib/constants";

export async function GET(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const role = decoded.role;
    const userId = decoded.userId;

    // ─── Common stats (Optimized via single aggregation) ───
    const statusCounts = await prisma.event.groupBy({
      by: ['status'],
      _count: true,
    });

    let totalEvents = 0;
    let approvedEvents = 0;
    let pendingEvents = 0;
    let rejectedEvents = 0;

    const pendingStatuses = [
      EVENT_STATUS.WAITING_FOR_FACULTY,
      EVENT_STATUS.WAITING_FOR_DEAN,
      EVENT_STATUS.WAITING_FOR_PRINCIPAL,
      EVENT_STATUS.WAITING_FOR_ADMIN,
    ];

    statusCounts.forEach((group) => {
      const count = group._count;
      totalEvents += count;
      if (group.status === EVENT_STATUS.APPROVED) approvedEvents += count;
      else if (group.status === EVENT_STATUS.REJECTED) rejectedEvents += count;
      else if (pendingStatuses.includes(group.status)) pendingEvents += count;
    });

    let dashboardData = {
      stats: { totalEvents, approvedEvents, pendingEvents, rejectedEvents },
      recentEvents: [],
      pendingApprovals: [],
      myTasks: [],
      myClubs: [],           // Clubs user heads (for club_head role)
      coordinatedClubs: [],  // Clubs FC is responsible for (for FC role)
      unreadNotifications: 0,
    };

    // ─── Unread notifications ───
    dashboardData.unreadNotifications = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    // ─── Role-specific data ───
    if (role === ROLES.STUDENT || role === ROLES.CLUB_HEAD) {
      // Get user with their club memberships
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          clubMemberships: {
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  department: true,
                  facultyCoordinator: {
                    select: { id: true, name: true, email: true },
                  },
                },
              },
            },
          },
        },
      });

      const clubIds = user?.clubMemberships.map((m) => m.clubId) || [];

      // Get clubs where user is the head
      dashboardData.myClubs = user?.clubMemberships
        .filter((m) => m.role === "head")
        .map((m) => ({
          id: m.club.id,
          name: m.club.name,
          type: m.club.type,
          department: m.club.department,
          facultyCoordinator: m.club.facultyCoordinator,
          membershipRole: m.role,
        })) || [];

      dashboardData.recentEvents = await prisma.event.findMany({
        where: {
          OR: [
            { createdById: userId },
            { clubId: { in: clubIds } },
            { eventType: "standard" },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          club: { select: { id: true, name: true } },
          createdBy: { select: { name: true } },
        },
      });

      dashboardData.myTasks = await prisma.task.findMany({
        where: { assigneeId: userId, status: { not: "completed" } },
        orderBy: { deadline: "asc" },
        take: 10,
        include: {
          event: { select: { id: true, title: true } },
        },
      });
    }

    if (role === ROLES.FACULTY_COORDINATOR) {
      // Get clubs this FC is responsible for
      const coordinatedClubs = await prisma.club.findMany({
        where: { facultyCoordinatorId: userId, isActive: true },
        select: {
          id: true,
          name: true,
          type: true,
          department: true,
          members: {
            where: { role: "head" },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          _count: { select: { members: true, events: true } },
        },
      });

      dashboardData.coordinatedClubs = coordinatedClubs.map((club) => ({
        id: club.id,
        name: club.name,
        type: club.type,
        department: club.department,
        head: club.members[0]?.user || null,
        memberCount: club._count.members,
        eventCount: club._count.events,
      }));

      const coordinatedClubIds = coordinatedClubs.map((c) => c.id);

      // Only show pending approvals for events from FC's coordinated clubs
      dashboardData.pendingApprovals = await prisma.event.findMany({
        where: {
          status: EVENT_STATUS.WAITING_FOR_FACULTY,
          club: { facultyCoordinatorId: userId },
        },
        orderBy: { createdAt: "asc" },
        include: {
          createdBy: { select: { name: true, role: true } },
          club: { select: { id: true, name: true } },
          approvalLogs: {
            orderBy: { createdAt: "asc" },
            include: {
              user: { select: { name: true, role: true } },
            },
          },
        },
      });

      // Recent events from coordinated clubs
      dashboardData.recentEvents = await prisma.event.findMany({
        where: {
          OR: [
            { clubId: { in: coordinatedClubIds } },
            { eventType: "standard" },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          club: { select: { id: true, name: true } },
          createdBy: { select: { name: true } },
        },
      });
    }

    if (role === ROLES.DEAN || role === ROLES.PRINCIPAL || role === ROLES.ADMIN) {
      // Determine which status they need to act on
      const statusMap = {
        [ROLES.DEAN]: EVENT_STATUS.WAITING_FOR_DEAN,
        [ROLES.PRINCIPAL]: EVENT_STATUS.WAITING_FOR_PRINCIPAL,
        [ROLES.ADMIN]: EVENT_STATUS.WAITING_FOR_ADMIN,
      };

      const pendingStatus = statusMap[role];
      if (pendingStatus) {
        dashboardData.pendingApprovals = await prisma.event.findMany({
          where: { status: pendingStatus },
          orderBy: { createdAt: "asc" },
          include: {
            createdBy: { select: { name: true, role: true } },
            club: { select: { id: true, name: true } },
            approvalLogs: {
              orderBy: { createdAt: "asc" },
              include: {
                user: { select: { name: true, role: true } },
              },
            },
          },
        });
      }

      // Recent events for admin view
      dashboardData.recentEvents = await prisma.event.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          club: { select: { id: true, name: true } },
          createdBy: { select: { name: true } },
        },
      });
    }

    // Department roles
    if (
      [ROLES.TRANSPORT, ROLES.SECURITY, ROLES.RESOURCE, ROLES.FINANCE].includes(role)
    ) {
      // Show department notifications for this role
      const deptNotifs = await prisma.deptNotification.findMany({
        where: { departmentRole: role },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          event: {
            select: { id: true, title: true, status: true, eventDate: true },
          },
        },
      });
      dashboardData.departmentAlerts = deptNotifs;

      dashboardData.recentEvents = await prisma.event.findMany({
        where: { status: EVENT_STATUS.APPROVED },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          club: { select: { id: true, name: true } },
          createdBy: { select: { name: true } },
        },
      });
    }

    // ─── Vendor Role Data ───
    if (role === ROLES.VENDOR) {
      const vendor = await prisma.vendor.findUnique({
        where: { userId },
        include: {
          _count: {
            select: {
              quotations: true,
              awardedQuotationRequests: true,
              vendorBills: true,
            }
          }
        }
      });
      
      if (vendor) {
        dashboardData.vendorProfile = {
          isVerified: vendor.isVerified,
          totalOrders: vendor.totalOrders,
          stats: {
            submissions: vendor._count.quotations,
            awards: vendor._count.awardedQuotationRequests,
            bills: vendor._count.vendorBills,
          }
        };

        // Open quotation requests matching their categories
        dashboardData.availableRequestsCount = await prisma.quotationRequest.count({
          where: {
            status: "open",
            category: { in: vendor.categories },
            deadline: { gt: new Date() }
          }
        });
        
        // Pending bills for this vendor
        dashboardData.pendingBillsCount = await prisma.vendorBill.count({
          where: {
             vendorId: vendor.id,
             paymentStatus: { in: ["pending", "processing"] }
          }
        });
        
        // Let recent events reflect awarded quotation requests
        dashboardData.recentEvents = await prisma.quotationRequest.findMany({
          where: { awardedToId: vendor.id },
          take: 5,
          orderBy: { awardedAt: "desc" },
          include: { event: { select: { title: true, eventDate: true } } }
        });
      }
    }

    // ─── Finance Extra Data ───
    if (role === ROLES.FINANCE || role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN || role === ROLES.DEAN) {
      dashboardData.financeStats = {
        pendingBills: await prisma.vendorBill.count({ where: { paymentStatus: "pending" } }),
        processingBills: await prisma.vendorBill.count({ where: { paymentStatus: "processing" } }),
      };
      
      // Also get recent Unverified vendors for DEAN/ADMIN
      if (role === ROLES.DEAN || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) {
        dashboardData.unverifiedVendorsCount = await prisma.vendor.count({ where: { isVerified: false } });
      }
    }

    return success(dashboardData);
  } catch (err) {
    console.error("[dashboard]", err);
    return error("Internal server error", 500);
  }
}

```

## 7. APPROVAL LOGIC

### src/lib/approval.js
```javascript
// ─────────────────────────────────────────────
// Diganta — Approval Engine
// Event-sourcing-lite: immutable logs → derive state
// Conditional routing: budget > ₹50K → Principal + Admin
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import {
  EVENT_STATUS,
  APPROVAL_ACTION,
  APPROVAL_CHAIN,
  getRequiredStages,
  getSubEventRequiredStages,
  DEPARTMENT_ROLES,
} from "@/lib/constants";

// ─── Derive Status from Logs ───

/**
 * Determines the current event status by inspecting approval logs.
 * This is the source-of-truth derivation — the cached `status` field
 * on the Event is just a performance mirror.
 *
 * @param {object} event - Event with budgetEstimate and parentEventId
 * @param {Array} approvalLogs - Ordered by createdAt
 * @returns {string} The derived EVENT_STATUS
 */
export function deriveEventStatus(event, approvalLogs) {
  // Sub-events (with parentEventId) skip faculty coordinator stage
  const isSubEvent = !!event.parentEventId;
  const requiredStages = isSubEvent
    ? getSubEventRequiredStages(event)
    : getRequiredStages(event);

  // Check each required stage in order
  for (const stage of requiredStages) {
    // Get the latest log for this stage
    const stageLogs = approvalLogs
      .filter((log) => log.stage === stage)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const latestLog = stageLogs[0];

    if (!latestLog) {
      // No action at this stage yet — waiting here
      return stageToWaitingStatus(stage);
    }

    if (latestLog.action === APPROVAL_ACTION.REJECTED) {
      return EVENT_STATUS.REJECTED;
    }

    if (latestLog.action === APPROVAL_ACTION.REVISION_REQUESTED) {
      return EVENT_STATUS.DRAFT; // sent back for revision
    }

    // If approved, continue to next stage
  }

  // All required stages approved
  return EVENT_STATUS.APPROVED;
}

// ─── Validate & Add Approval (Transaction-safe) ───

/**
 * Core approval action — validates stage ordering, role permissions,
 * and records the approval log within a transaction.
 *
 * @param {string} eventId
 * @param {object} user - { userId, role, name }
 * @param {string} action - "approved" | "rejected" | "revision_requested"
 * @param {string|null} comment
 * @param {string[]} deptNotifications - department roles to notify (dean only)
 * @returns {{ success: boolean, event: object, log: object, error?: string }}
 */
export async function validateAndAddApproval(
  eventId,
  user,
  action,
  comment = null,
  deptNotifications = []
) {
  // ─── Execute entire validation within transaction to prevent race conditions ───
  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch event with all logs and club info (INSIDE TRANSACTION)
    const event = await tx.event.findUnique({
      where: { id: eventId },
      include: {
        approvalLogs: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { name: true, role: true } } },
        },
        club: {
          select: {
            id: true,
            facultyCoordinatorId: true,
            facultyCoordinator: { select: { id: true, name: true } }
          },
        },
        parentEvent: {
          select: { id: true, title: true },
        },
      },
    });

    if (!event) {
      return { success: false, error: "Event not found", status: 404 };
    }

    // Check event is in a reviewable state
    if (
      event.status === EVENT_STATUS.APPROVED ||
      event.status === EVENT_STATUS.REJECTED
    ) {
      return {
        success: false,
        error: "Event has already been finalized",
        status: 409,
      };
    }

    if (event.status === EVENT_STATUS.DRAFT) {
      return {
        success: false,
        error: "Event has not been submitted for approval",
        status: 400,
      };
    }

    // Determine which stage we're at
    // Sub-events (with parentEventId) skip faculty coordinator stage
    const isSubEvent = !!event.parentEventId;
    const requiredStages = isSubEvent
      ? getSubEventRequiredStages(event)
      : getRequiredStages(event);
    const currentStage = getCurrentStage(event, event.approvalLogs, requiredStages);

    if (!currentStage) {
      return {
        success: false,
        error: "No pending approval stage found",
        status: 409,
      };
    }

    // Validate: user's role must match the current stage
    const stageConfig = APPROVAL_CHAIN.find((s) => s.stage === currentStage);
    if (!stageConfig || user.role !== stageConfig.role) {
      // Super admin can override role checks
      if (user.role !== ROLES.SUPER_ADMIN) {
        return {
          success: false,
          error: `This event is waiting for ${currentStage.replace("_", " ")} approval. Your role (${user.role}) cannot act at this stage.`,
          status: 403,
        };
      }
    }

    // For faculty_coordinator stage, validate that this FC is the assigned coordinator for the club
    if (currentStage === "faculty_coordinator" && event.club) {
      if (event.club.facultyCoordinatorId !== user.userId && user.role !== ROLES.SUPER_ADMIN) {
        return {
          success: false,
          error: "You are not the assigned faculty coordinator for this club. Only the assigned coordinator can approve this event.",
          status: 403,
        };
      }
    }

    // Check for duplicate: same user already acted at this stage
    const existingLog = event.approvalLogs.find(
      (log) => log.stage === currentStage && log.userId === user.userId
    );
    if (existingLog) {
      return {
        success: false,
        error: "You have already reviewed this event at this stage",
        status: 409,
      };
    }

    // 2. Create immutable approval log
    const log = await tx.approvalLog.create({
      data: {
        eventId,
        userId: user.userId,
        role: user.role,
        action,
        comment,
        stage: currentStage,
      },
    });

    // Compute new cached status
    const allLogs = [...event.approvalLogs, log];
    const newStatus = deriveEventStatus(event, allLogs);

    // Update cached status on event
    const updatedEvent = await tx.event.update({
      where: { id: eventId },
      data: { status: newStatus },
    });

    // ─── Department Notifications (Dean's intent) ───
    if (
      action === APPROVAL_ACTION.APPROVED &&
      currentStage === "dean" &&
      deptNotifications.length > 0
    ) {
      const validDepts = deptNotifications.filter((d) =>
        DEPARTMENT_ROLES.includes(d)
      );

      if (validDepts.length > 0) {
        // Create DeptNotification records
        await tx.deptNotification.createMany({
          data: validDepts.map((dept) => ({
            eventId,
            departmentRole: dept,
            message: comment || `Event "${event.title}" approved — action required`,
          })),
        });

        // Notify department users
        const deptUsers = await tx.user.findMany({
          where: { role: { in: validDepts }, isActive: true },
          select: { id: true },
        });

        if (deptUsers.length > 0) {
          await tx.notification.createMany({
            data: deptUsers.map((u) => ({
              userId: u.id,
              eventId,
              type: "dept_alert",
              title: "Action Required",
              message: `Event "${event.title}" has been approved. Your department has been notified for execution.`,
            })),
          });
        }
      }
    }

    // ─── Notify next approver ───
    if (newStatus !== EVENT_STATUS.APPROVED && newStatus !== EVENT_STATUS.REJECTED) {
      const nextStage = getCurrentStage(event, allLogs, requiredStages);
      if (nextStage) {
        const nextStageConfig = APPROVAL_CHAIN.find((s) => s.stage === nextStage);
        if (nextStageConfig) {
          let nextApprovers = [];

          // For faculty_coordinator stage, notify only the assigned FC for the club
          if (nextStage === "faculty_coordinator" && event.club?.facultyCoordinatorId) {
            nextApprovers = [{ id: event.club.facultyCoordinatorId }];
          } else {
            // For other stages, notify all users with that role
            nextApprovers = await tx.user.findMany({
              where: { role: nextStageConfig.role, isActive: true },
              select: { id: true },
            });
          }

          if (nextApprovers.length > 0) {
            await tx.notification.createMany({
              data: nextApprovers.map((u) => ({
                userId: u.id,
                eventId,
                type: "approval_required",
                title: "Approval Required",
                message: `Event "${event.title}" is waiting for your review.`,
              })),
            });
          }
        }
      }
    }

    // ─── Notify event creator on final decision ───
    if (
      newStatus === EVENT_STATUS.APPROVED ||
      newStatus === EVENT_STATUS.REJECTED
    ) {
      await tx.notification.create({
        data: {
          userId: event.createdById,
          eventId,
          type:
            newStatus === EVENT_STATUS.APPROVED
              ? "event_approved"
              : "event_rejected",
          title:
            newStatus === EVENT_STATUS.APPROVED
              ? "Event Approved!"
              : "Event Rejected",
          message:
            newStatus === EVENT_STATUS.APPROVED
              ? `Your event "${event.title}" has been fully approved!`
              : `Your event "${event.title}" has been rejected. ${comment || ""}`,
        },
      });
    }

    return { log, event: updatedEvent };
  }); // end of transaction block

  // If the transaction returned an error object directly (validation failed inside tx)
  if (result.error) {
    return result;
  }

  return {
    success: true,
    event: result.event,
    log: result.log,
  };
}

// ─── Helpers ───

function getCurrentStage(event, approvalLogs, requiredStages) {
  for (const stage of requiredStages) {
    const stageLogs = approvalLogs
      .filter((log) => log.stage === stage)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const latestLog = stageLogs[0];

    if (!latestLog) {
      return stage; // this stage needs action
    }

    if (latestLog.action === APPROVAL_ACTION.REJECTED) {
      return null; // already rejected, no more stages
    }

    if (latestLog.action === APPROVAL_ACTION.REVISION_REQUESTED) {
      return null; // sent back, no active stage
    }

    // Approved — move to next stage
  }

  return null; // all stages done
}

function stageToWaitingStatus(stage) {
  const map = {
    faculty_coordinator: EVENT_STATUS.WAITING_FOR_FACULTY,
    dean: EVENT_STATUS.WAITING_FOR_DEAN,
    principal: EVENT_STATUS.WAITING_FOR_PRINCIPAL,
    admin: EVENT_STATUS.WAITING_FOR_ADMIN,
  };
  return map[stage] || EVENT_STATUS.DRAFT;
}

```

### src/app/api/events/[id]/approve/route.js
```javascript
// ─────────────────────────────────────────────
// POST /api/events/[id]/approve — Approve/Reject event
// Core approval engine endpoint
// ─────────────────────────────────────────────

import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, validateRequired } from "@/lib/api";
import { validateAndAddApproval } from "@/lib/approval";
import { APPROVAL_ACTION } from "@/lib/constants";

export async function POST(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const missing = validateRequired(body, ["action"]);
    if (missing) return error(missing);

    const validActions = Object.values(APPROVAL_ACTION);
    if (!validActions.includes(body.action)) {
      return error(
        `Invalid action. Must be one of: ${validActions.join(", ")}`
      );
    }

    // Rejection requires a comment
    if (body.action === APPROVAL_ACTION.REJECTED && !body.comment) {
      return error("A comment is required when rejecting an event");
    }

    // Department notifications (dean can specify which departments to notify)
    const deptNotifications = Array.isArray(body.notifyDepartments)
      ? body.notifyDepartments
      : [];

    // Delegate to approval engine
    const result = await validateAndAddApproval(
      id,
      decoded,
      body.action,
      body.comment || null,
      deptNotifications
    );

    if (!result.success) {
      return error(result.error, result.status);
    }

    return success({
      message: `Event ${body.action} successfully`,
      event: result.event,
      log: result.log,
    });
  } catch (err) {
    console.error("[events:approve]", err);
    return error("Internal server error", 500);
  }
}

```

## 8. MIDDLEWARE / RBAC
```javascript
// File not found or error reading: src/middleware.js
// Error: ENOENT: no such file or directory, open 'D:\mvptrail\src\middleware.js'
```

## 9. FRONTEND — KEY PAGES

### src/app/(app)/dashboard/page.js
```javascript
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle, Clock, XCircle, Bell, ListTodo, AlertTriangle, FileText, Users, Building2 } from "lucide-react";
import { getStatusBadgeClass, getStatusLabel, formatDate, formatCurrency } from "@/lib/utils";
import EventCalendar from "@/components/EventCalendar";

export default function DashboardPage() {
  const { user, apiFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    apiFetch("/api/dashboard")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, apiFetch, authLoading, router]);

  if (authLoading || loading) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }

  if (!data) return null;

  const isApprover = ["faculty_coordinator", "dean", "principal", "admin"].includes(user?.role);
  const isDeptRole = ["transport", "security", "resource", "finance"].includes(user?.role);
  const isClubHead = data.myClubs?.length > 0;
  const isFC = data.coordinatedClubs?.length > 0;
  const isVendor = user?.role === "vendor";

  if (isVendor) {
    const vp = data.vendorProfile;
    if (!vp) return <div className="p-8 text-center text-red-500">Vendor Profile Not Found</div>;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">{user?.name}</h1>
            <p className="page-subtitle">Your Supplier Dashboard</p>
          </div>
          <div>
            {!vp.isVerified ? (
              <span className="badge badge-pending" title="Account under review by Admin">Pending Verification</span>
            ) : (
              <span className="badge badge-approved"><CheckCircle size={14} /> Verified Vendor</span>
            )}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon primary"><ListTodo size={22} /></div>
            <div className="stat-content">
              <p>Available Requests</p>
              <h3>{data.availableRequestsCount || 0}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><FileText size={22} /></div>
            <div className="stat-content">
              <p>Submitted Quotes</p>
              <h3>{vp.stats.submissions || 0}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success"><CheckCircle size={22} /></div>
            <div className="stat-content">
              <p>Contracts Won</p>
              <h3>{vp.stats.awards || 0}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon info"><Clock size={22} /></div>
            <div className="stat-content">
              <p>Pending Bills</p>
              <h3>{data.pendingBillsCount || 0}</h3>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)" }}>
          <div className="card">
             <div className="card-header">
                <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                   <ListTodo size={18} style={{ color: "var(--accent-primary)" }}/> Actions Needed
                </h3>
             </div>
             <div className="empty-state">
                {data.availableRequestsCount > 0 ? (
                  <>
                     <h3 style={{ color: "var(--accent-primary)", marginBottom: "var(--space-3)" }}>
                        You have {data.availableRequestsCount} open quotation requests!
                     </h3>
                     <button onClick={() => router.push("/quotation-requests")} className="btn btn-primary">
                        View & Submit Bids
                     </button>
                  </>
                ) : (
                  <>
                    <p>No action required at the moment. You'll be notified when new requests are available.</p>
                  </>
                )}
             </div>
          </div>

          <div className="card">
             <div className="card-header">
                <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                   <Building2 size={18} style={{ color: "var(--accent-info)" }}/> Recently Awarded Contracts
                </h3>
             </div>
             <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
               {data.recentEvents?.length > 0 ? (
                 data.recentEvents.map(e => (
                    <div key={e.id} style={{ padding: "var(--space-4)", background: "var(--bg-muted)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                       <div>
                          <div style={{ fontWeight: 600 }}>{e.title}</div>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Event: {e.event.title}</div>
                       </div>
                       <button onClick={() => router.push(`/vendor-bills`)} className="btn btn-ghost btn-sm">View Bill</button>
                    </div>
                 ))
               ) : (
                 <div className="empty-state" style={{ padding: "var(--space-6)" }}>
                    <p>You haven't been awarded any contracts yet. Keep submitting quotations!</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header - Mission Control Style */}
      <div className="page-header">
        <div>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "var(--space-1)" }}>
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},
          </p>
          <h1 className="page-title">{user?.name}</h1>
          <p className="page-subtitle">
            Here&apos;s your mission status for today
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          {data.unreadNotifications > 0 && (
            <button className="btn btn-outline" onClick={() => router.push("/notifications")}>
              <Bell size={16} />
              {data.unreadNotifications} unread
            </button>
          )}
          <button className="btn btn-outline" onClick={() => setShowCalendar(true)} title="View Event Calendar">
            <Calendar size={16} />
            <span style={{ display: "none" }}>Calendar</span>
          </button>
        </div>
      </div>

      {/* Stats Grid - 4 Column Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary"><Calendar size={22} /></div>
          <div className="stat-content">
            <p>Total Events</p>
            <h3>{data.stats.totalEvents}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><CheckCircle size={22} /></div>
          <div className="stat-content">
            <p>Approved</p>
            <h3>{data.stats.approvedEvents}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><Clock size={22} /></div>
          <div className="stat-content">
            <p>Pending</p>
            <h3>{data.stats.pendingEvents}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger"><XCircle size={22} /></div>
          <div className="stat-content">
            <p>Rejected</p>
            <h3>{data.stats.rejectedEvents}</h3>
          </div>
        </div>
      </div>

      {/* ─── Vendor Management (Unified Section) ─── */}
      {(data.financeStats || data.unverifiedVendorsCount > 0) && (
        <div className="card" style={{ marginBottom: "var(--space-6)", borderLeft: "4px solid var(--accent-primary)" }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Building2 size={18} style={{ color: "var(--accent-primary)" }} />
              Vendor Management
            </h2>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button className="btn btn-outline btn-sm" onClick={() => router.push("/vendors")}>
                Registry
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => router.push("/vendor-bills")}>
                Bills
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => router.push("/quotation-requests")}>
                Quotations
              </button>
            </div>
          </div>

          {/* Billing stats row */}
          {data.financeStats && (
            <div style={{ display: "grid", gridTemplateColumns: data.unverifiedVendorsCount > 0 ? "1fr 1fr 1fr" : "1fr 1fr", gap: "var(--space-4)", marginBottom: data.unverifiedVendorsCount > 0 ? "var(--space-4)" : 0 }}>
              <div style={{ background: "var(--bg-muted)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-1)" }}>Pending Bills</p>
                <h3 style={{ fontSize: "24px", color: "var(--accent-warning)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{data.financeStats.pendingBills}</h3>
              </div>
              <div style={{ background: "var(--bg-muted)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-1)" }}>Processing</p>
                <h3 style={{ fontSize: "24px", color: "var(--accent-info)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{data.financeStats.processingBills}</h3>
              </div>
              {data.unverifiedVendorsCount > 0 && (
                <div style={{ background: "var(--accent-danger-bg)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", textAlign: "center", cursor: "pointer" }} onClick={() => router.push("/vendors?verified=false")}>
                  <p style={{ color: "var(--accent-danger-text)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-1)" }}>Pending Verification</p>
                  <h3 style={{ fontSize: "24px", color: "var(--accent-danger)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{data.unverifiedVendorsCount}</h3>
                </div>
              )}
            </div>
          )}

          {/* Alert banner if unverified vendors exist but no financeStats */}
          {!data.financeStats && data.unverifiedVendorsCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-4)", background: "var(--accent-danger-bg)", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <AlertTriangle size={18} style={{ color: "var(--accent-danger)" }} />
                <span style={{ fontWeight: 600, color: "var(--accent-danger-text)" }}>{data.unverifiedVendorsCount} vendor(s) pending verification</span>
              </div>
              <button onClick={() => router.push("/vendors?verified=false")} className="btn btn-danger btn-sm">Review</button>
            </div>
          )}
        </div>
      )}

      {/* My Clubs Section (for Club Heads) */}
      {isClubHead && (
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Users size={18} style={{ color: "var(--accent-primary)" }} />
              My Clubs
              <span style={{
                background: "var(--accent-primary-light)",
                color: "var(--accent-primary)",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                marginLeft: "var(--space-2)"
              }}>
                Club Head
              </span>
            </h2>
            <button className="btn btn-primary btn-sm" onClick={() => router.push("/events/new")}>
              Create Event
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
            {data.myClubs.map((club) => (
              <div
                key={club.id}
                onClick={() => router.push("/clubs")}
                style={{
                  padding: "var(--space-4)",
                  background: "var(--bg-muted)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  borderLeft: "3px solid var(--accent-primary)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "var(--radius-md)",
                    background: "linear-gradient(135deg, var(--accent-primary), #4F46E5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, color: "white", fontSize: "var(--text-sm)"
                  }}>
                    {club.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{club.name}</div>
                    <span className="badge badge-progress" style={{ fontSize: "10px" }}>
                      {club.type === "departmental" ? "Departmental" : "Non-Departmental"}
                    </span>
                  </div>
                </div>
                {club.facultyCoordinator && (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                    FC: {club.facultyCoordinator.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coordinated Clubs Section (for Faculty Coordinators) */}
      {isFC && (
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Building2 size={18} style={{ color: "var(--accent-info)" }} />
              Clubs You Coordinate
              <span style={{
                background: "var(--accent-info-bg)",
                color: "var(--accent-info-text)",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                marginLeft: "var(--space-2)"
              }}>
                {data.coordinatedClubs.length} club{data.coordinatedClubs.length !== 1 ? "s" : ""}
              </span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
            {data.coordinatedClubs.map((club) => (
              <div
                key={club.id}
                onClick={() => router.push("/clubs")}
                style={{
                  padding: "var(--space-4)",
                  background: "var(--bg-muted)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  borderLeft: "3px solid var(--accent-info)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "var(--radius-md)",
                    background: "linear-gradient(135deg, var(--accent-info), #3B82F6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, color: "white", fontSize: "var(--text-sm)"
                  }}>
                    {club.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{club.name}</div>
                    <span className="badge badge-progress" style={{ fontSize: "10px" }}>
                      {club.type === "departmental" ? "Departmental" : "Non-Departmental"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                  <span>Head: {club.head?.name || "Not assigned"}</span>
                  <span>{club.memberCount} members • {club.eventCount} events</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: isApprover || isDeptRole ? "1fr 1fr" : "1fr", gap: "var(--space-6)" }}>

        {/* Pending Approvals - Floating Card */}
        {isApprover && data.pendingApprovals?.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <AlertTriangle size={18} style={{ color: "var(--accent-warning)" }} />
                Pending Approvals
                <span style={{
                  background: "var(--accent-warning-bg)",
                  color: "var(--accent-warning-text)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  marginLeft: "var(--space-2)"
                }}>
                  {data.pendingApprovals.length}
                </span>
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {data.pendingApprovals.map((event) => (
                <div
                  key={event.id}
                  onClick={() => router.push(`/events/${event.id}`)}
                  style={{
                    padding: "var(--space-4)",
                    background: "var(--bg-muted)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    borderLeft: "3px solid var(--accent-warning)"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-primary)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "var(--bg-muted)"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{event.title}</span>
                    <span className={`badge ${getStatusBadgeClass(event.status)}`}>
                      {getStatusLabel(event.status)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                    <span>By {event.createdBy?.name}</span>
                    {event.club && <span>{event.club.name}</span>}
                    <span style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(event.budgetEstimate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Department Alerts */}
        {isDeptRole && data.departmentAlerts?.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Bell size={18} style={{ color: "var(--accent-info)" }} />
                Department Alerts
                <span style={{
                  background: "var(--accent-info-bg)",
                  color: "var(--accent-info-text)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  marginLeft: "var(--space-2)"
                }}>
                  {data.departmentAlerts.length}
                </span>
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {data.departmentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => router.push(`/events/${alert.event?.id}`)}
                  style={{
                    padding: "var(--space-4)",
                    background: "var(--bg-muted)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    borderLeft: "3px solid var(--accent-info)"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-primary)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "var(--bg-muted)"}
                >
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>
                    {alert.event?.title}
                  </div>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Events - Timeline View */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Events</h2>
            <button className="btn btn-outline btn-sm" onClick={() => router.push("/events")}>
              View All
            </button>
          </div>
          {data.recentEvents?.length === 0 ? (
            <div className="empty-state">
              <Calendar size={56} />
              <h3>No events yet</h3>
              <p>Get started by creating your first event</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {data.recentEvents?.map((event, index) => (
                <div
                  key={event.id}
                  onClick={() => router.push(`/events/${event.id}`)}
                  style={{
                    padding: "var(--space-4)",
                    background: "var(--bg-muted)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    position: "relative",
                    paddingLeft: "var(--space-6)"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-primary)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "var(--bg-muted)"}
                >
                  {/* Timeline dot */}
                  <div style={{
                    position: "absolute",
                    left: "var(--space-2)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: event.status === "APPROVED" ? "var(--accent-success)" :
                               event.status === "REJECTED" ? "var(--accent-danger)" :
                               "var(--accent-warning)"
                  }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{event.title}</span>
                    <span className={`badge ${getStatusBadgeClass(event.status)}`}>
                      {getStatusLabel(event.status)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                    <span>{event.createdBy?.name}</span>
                    {event.club && <span>{event.club.name}</span>}
                    {event.eventDate && <span style={{ fontFamily: "var(--font-mono)" }}>{formatDate(event.eventDate)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Tasks */}
        {data.myTasks?.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <ListTodo size={18} />
                My Tasks
                <span style={{
                  background: "var(--bg-muted)",
                  color: "var(--text-muted)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  marginLeft: "var(--space-2)"
                }}>
                  {data.myTasks.length}
                </span>
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {data.myTasks.map((task) => (
                <div key={task.id} style={{
                  padding: "var(--space-3) var(--space-4)",
                  background: "var(--bg-muted)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--text-primary)" }}>{task.title}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                      {task.event?.title} {task.deadline && (
                        <span style={{ fontFamily: "var(--font-mono)" }}>
                          {" "}• Due {formatDate(task.deadline)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`badge ${task.status === "delayed" ? "badge-rejected" : "badge-pending"}`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Calendar Popout */}
      {showCalendar && (
        <div className="modal-overlay" onClick={() => setShowCalendar(false)} style={{ zIndex: 300 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: "0", maxWidth: "800px" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "var(--space-3) var(--space-4)", background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCalendar(false)}>
                <XCircle size={18} />
                Close
              </button>
            </div>
            <div style={{ padding: "var(--space-4)" }}>
              <EventCalendar />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

```

### src/app/(app)/events/page.js
```javascript
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Calendar, Plus, Filter } from "lucide-react";
import { getStatusBadgeClass, getStatusLabel, formatDate, formatCurrency } from "@/lib/utils";

export default function EventsPage() {
  const { user, apiFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "", eventType: "" });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    const params = new URLSearchParams();
    if (filter.status) params.set("status", filter.status);
    if (filter.eventType) params.set("eventType", filter.eventType);

    apiFetch(`/api/events?${params.toString()}`)
      .then((data) => setEvents(data.events))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, apiFetch, authLoading, router, filter]);

  if (authLoading || loading) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }

  const canCreate = ["student", "club_head", "dean", "admin"].includes(user?.role);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">Browse and manage all events</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => router.push("/events/new")}>
            <Plus size={18} />
            Create Event
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>
        <select
          className="form-select"
          style={{ width: "auto", minWidth: 160 }}
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="WAITING_FOR_FACULTY">Awaiting Faculty</option>
          <option value="WAITING_FOR_DEAN">Awaiting Dean</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <select
          className="form-select"
          style={{ width: "auto", minWidth: 160 }}
          value={filter.eventType}
          onChange={(e) => setFilter({ ...filter, eventType: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="club">Club Events</option>
          <option value="standard">Standard Events</option>
        </select>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} />
          <h3>No events found</h3>
          <p>Try adjusting your filters or create a new event</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <div
              key={event.id}
              className="event-card"
              onClick={() => router.push(`/events/${event.id}`)}
            >
              <div className="event-card-header">
                <div>
                  <span className="event-card-title">{event.title}</span>
                  {event.eventType === "standard" && (
                    <span className="badge badge-progress" style={{ marginLeft: 8, fontSize: 10 }}>STANDARD</span>
                  )}
                </div>
                <span className={`badge ${getStatusBadgeClass(event.status)}`}>
                  {getStatusLabel(event.status)}
                </span>
              </div>

              <p style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
                marginTop: "var(--space-2)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {event.description}
              </p>

              <div className="event-card-meta">
                <span>👤 {event.createdBy?.name}</span>
                {event.club && <span>🏢 {event.club.name}</span>}
                {event.budgetEstimate > 0 && <span>💰 {formatCurrency(event.budgetEstimate)}</span>}
                {event.eventDate && <span>📅 {formatDate(event.eventDate)}</span>}
              </div>

              <div className="event-card-meta" style={{ marginTop: "var(--space-2)" }}>
                <span>📋 {event._count?.approvalLogs || 0} reviews</span>
                <span>✅ {event._count?.tasks || 0} tasks</span>
                {event.eventType === "standard" && (
                  <span>🤝 {event._count?.participants || 0} clubs joined</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

```

### src/app/(app)/events/[id]/page.js
```javascript
"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import {
  ArrowLeft, Send, CheckCircle, XCircle, Clock, Users,
  DollarSign, ListTodo, Plus, MessageSquare, UserPlus, Calendar,
} from "lucide-react";
import { getStatusBadgeClass, getStatusLabel, formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

export default function EventDetailPage({ params }) {
  const { id } = use(params);
  const { user, apiFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [deptNotifs, setDeptNotifs] = useState([]);

  // Task form
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", deadline: "" });
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Expense form
  const [expenseForm, setExpenseForm] = useState({ amount: "", description: "", category: "other" });
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  // User's clubs (for joining standard events)
  const [userClubs, setUserClubs] = useState([]);
  const [selectedClubToJoin, setSelectedClubToJoin] = useState("");

  // Sub-event form (for standard events)
  const [subEventForm, setSubEventForm] = useState({
    title: "",
    description: "",
    type: "tech",
    objectives: "",
    targetAudience: "",
    expectedAttendance: "",
    venue: "",
    eventDate: "",
    eventEndDate: "",
    budgetEstimate: "",
    clubId: "",
    needsTransport: false,
    needsSecurity: false,
    needsResources: false,
    transportNotes: "",
    securityNotes: "",
    resourceNotes: "",
  });
  const [showSubEventForm, setShowSubEventForm] = useState(false);

  // Resource request form
  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    category: "equipment",
    amount: "",
    quantity: "",
    priority: "medium",
    clubId: "",
  });
  const [showResourceForm, setShowResourceForm] = useState(false);

  const fetchEvent = () => {
    apiFetch(`/api/events/${id}`)
      .then((data) => setEvent(data.event))
      .catch(() => showToast("Failed to load event", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    fetchEvent();
    // Fetch user's clubs for joining standard events
    apiFetch("/api/clubs/my")
      .then((data) => setUserClubs(data.clubs || []))
      .catch(() => {});
  }, [id, user, authLoading]);

  const handleSubmitForApproval = async () => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/events/${id}/submit`, { method: "POST" });
      showToast("Event submitted for approval!", "success");
      fetchEvent();
    } catch (err) {
      showToast(err.message, "error");
    }
    setActionLoading(false);
  };

  const handleApproval = async (action) => {
    if (action === "rejected" && !comment) {
      showToast("Comment required when rejecting", "error");
      return;
    }
    setActionLoading(true);
    try {
      await apiFetch(`/api/events/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ action, comment, notifyDepartments: deptNotifs }),
      });
      showToast(`Event ${action}!`, action === "approved" ? "success" : "info");
      fetchEvent();
      setComment("");
      setDeptNotifs([]);
    } catch (err) {
      showToast(err.message, "error");
    }
    setActionLoading(false);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/events/${id}/tasks`, {
        method: "POST",
        body: JSON.stringify(taskForm),
      });
      showToast("Task created!", "success");
      setShowTaskForm(false);
      setTaskForm({ title: "", description: "", priority: "medium", deadline: "" });
      fetchEvent();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/events/${id}/expenses`, {
        method: "POST",
        body: JSON.stringify({ ...expenseForm, amount: parseFloat(expenseForm.amount) }),
      });
      showToast("Expense added!", "success");
      setShowExpenseForm(false);
      setExpenseForm({ amount: "", description: "", category: "other" });
      fetchEvent();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleJoinEvent = async () => {
    if (!selectedClubToJoin) {
      showToast("Please select a club to join with", "error");
      return;
    }
    setActionLoading(true);
    try {
      await apiFetch(`/api/events/${id}/join`, {
        method: "POST",
        body: JSON.stringify({ clubId: selectedClubToJoin }),
      });
      showToast("Club joined the event!", "success");
      setSelectedClubToJoin("");
      fetchEvent();
    } catch (err) {
      showToast(err.message, "error");
    }
    setActionLoading(false);
  };

  const handleCreateSubEvent = async (e) => {
    e.preventDefault();
    if (!subEventForm.clubId) {
      showToast("Please select a club", "error");
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        ...subEventForm,
        expectedAttendance: subEventForm.expectedAttendance ? parseInt(subEventForm.expectedAttendance) : null,
        budgetEstimate: subEventForm.budgetEstimate ? parseFloat(subEventForm.budgetEstimate) : 0,
      };

      await apiFetch(`/api/events/${id}/subevents`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showToast("Sub-event created and submitted for Dean approval!", "success");
      setShowSubEventForm(false);
      setSubEventForm({
        title: "",
        description: "",
        type: "tech",
        objectives: "",
        targetAudience: "",
        expectedAttendance: "",
        venue: "",
        eventDate: "",
        eventEndDate: "",
        budgetEstimate: "",
        clubId: "",
        needsTransport: false,
        needsSecurity: false,
        needsResources: false,
        transportNotes: "",
        securityNotes: "",
        resourceNotes: "",
      });
      fetchEvent(); // Refresh to show new sub-event
    } catch (err) {
      showToast(err.message, "error");
    }
    setActionLoading(false);
  };

  const handleCreateResourceRequest = async (e) => {
    e.preventDefault();
    if (!resourceForm.clubId) {
      showToast("Please select a club", "error");
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        ...resourceForm,
        amount: resourceForm.amount ? parseFloat(resourceForm.amount) : null,
        quantity: resourceForm.quantity ? parseInt(resourceForm.quantity) : null,
      };

      await apiFetch(`/api/events/${id}/resources`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showToast("Resource request created!", "success");
      setShowResourceForm(false);
      setResourceForm({
        title: "",
        description: "",
        category: "equipment",
        amount: "",
        quantity: "",
        priority: "medium",
        clubId: "",
      });
      fetchEvent(); // Refresh to show new request
    } catch (err) {
      showToast(err.message, "error");
    }
    setActionLoading(false);
  };

  const toggleDeptNotif = (dept) => {
    setDeptNotifs((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  if (authLoading || loading) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }

  if (!event) {
    return (
      <div style={{ padding: "var(--space-6)", textAlign: "center" }}>
        <h2>Event not found</h2>
        <p>The event you're looking for doesn't exist or you don't have permission to view it.</p>
        <button className="btn btn-primary" onClick={() => router.push("/events")}>
          Back to Events
        </button>
      </div>
    );
  }

  const isCreator = event.createdById === user?.id;
  const canSubmit = isCreator && event.status === "DRAFT";
  const canApprove = (() => {
    const roleStageMap = {
      faculty_coordinator: "WAITING_FOR_FACULTY",
      dean: "WAITING_FOR_DEAN",
      principal: "WAITING_FOR_PRINCIPAL",
      admin: "WAITING_FOR_ADMIN",
    };
    return roleStageMap[user?.role] === event.status;
  })();

  return (
    <div>
      {ToastComponent}
      <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: "var(--space-4)" }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Event Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1 className="page-title">
            {event.eventType === "standard" && "🎪 "}{event.title}
          </h1>
          {event.eventType === "standard" && (
            <p className="page-subtitle" style={{ marginTop: "var(--space-1)", marginBottom: "var(--space-2)" }}>
              Festival Management Dashboard
            </p>
          )}
          <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)", flexWrap: "wrap" }}>
            <span className={`badge ${getStatusBadgeClass(event.status)}`}>{getStatusLabel(event.status)}</span>
            <span className="badge badge-draft" style={{ textTransform: "capitalize" }}>{event.type}</span>
            {event.eventType === "standard" && <span className="badge badge-progress">FESTIVAL</span>}
          </div>
        </div>
        {canSubmit && (
          <button className="btn btn-primary" onClick={handleSubmitForApproval} disabled={actionLoading}>
            <Send size={16} /> Submit for Approval
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {["overview", "approvals", "budget", "tasks", ...(event.eventType === "standard" ? ["subevents"] : [])].map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "subevents" ? "Sub-Events" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Festival Statistics for Standard Events */}
      {event.eventType === "standard" && (
        <div>
          {/* Festival Info Alert */}
          {(!event.eventDate || !event.participants?.length) && (
            <div className="card" style={{
              marginBottom: "var(--space-4)",
              border: "1px solid var(--accent-info)",
              background: "var(--accent-info-bg)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-4)" }}>
                <div style={{ fontSize: "24px" }}>🎪</div>
                <div>
                  <h3 style={{ fontSize: "var(--text-base)", fontWeight: 600, marginBottom: "var(--space-1)" }}>
                    Festival Setup
                  </h3>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                    {!event.eventDate && !event.participants?.length
                      ? "Set event dates and invite clubs to join this festival"
                      : !event.eventDate
                      ? "Set the festival dates to complete setup"
                      : "Invite clubs to join this festival"
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="stats-grid" style={{ marginBottom: "var(--space-6)" }}>
            <div className="stat-card">
              <div className="stat-icon primary"><Users size={20} /></div>
              <div className="stat-content">
                <h3>{event.participants?.length || 0}</h3>
                <p>Participating Clubs</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success"><Calendar size={20} /></div>
              <div className="stat-content">
                <h3>{event.subEvents?.length || 0}</h3>
                <p>Sub-Events</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning"><Clock size={20} /></div>
              <div className="stat-content">
                <h3>{event.subEvents?.filter(se => se.status === "WAITING_FOR_DEAN").length || 0}</h3>
                <p>Pending Approvals</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon info"><DollarSign size={20} /></div>
              <div className="stat-content">
                <h3>{formatCurrency(event.budgetEstimate || 0)}</h3>
                <p>Total Budget</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-6)" }}>
          <div>
            <div className="card" style={{ marginBottom: "var(--space-6)" }}>
              <h3 className="card-title" style={{ marginBottom: "var(--space-4)" }}>Description</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", whiteSpace: "pre-wrap" }}>{event.description}</p>

              {event.objectives && (
                <>
                  <h4 style={{ marginTop: "var(--space-5)", marginBottom: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 600 }}>Objectives</h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", whiteSpace: "pre-wrap" }}>{event.objectives}</p>
                </>
              )}
            </div>

            {/* Addons */}
            {(event.needsTransport || event.needsSecurity || event.needsResources) && (
              <div className="card">
                <h3 className="card-title" style={{ marginBottom: "var(--space-4)" }}>Execution Requirements</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  {event.needsTransport && (
                    <div style={{ padding: "var(--space-3)", background: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
                      <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Transport Required</span>
                      {event.transportNotes && <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 4 }}>{event.transportNotes}</p>}
                    </div>
                  )}
                  {event.needsSecurity && (
                    <div style={{ padding: "var(--space-3)", background: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
                      <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Security Required</span>
                      {event.securityNotes && <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 4 }}>{event.securityNotes}</p>}
                    </div>
                  )}
                  {event.needsResources && (
                    <div style={{ padding: "var(--space-3)", background: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
                      <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Special Resources</span>
                      {event.resourceNotes && <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 4 }}>{event.resourceNotes}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="card" style={{ marginBottom: "var(--space-4)" }}>
              <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "var(--space-3)" }}>
                {event.eventType === "standard" ? "Festival Details" : "Details"}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", fontSize: "var(--text-sm)" }}>
                <div><span style={{ color: "var(--text-muted)" }}>Created by:</span> {event.createdBy?.name}</div>
                {event.club && <div><span style={{ color: "var(--text-muted)" }}>Club:</span> {event.club.name}</div>}
                <div><span style={{ color: "var(--text-muted)" }}>Budget:</span> {formatCurrency(event.budgetEstimate)}</div>
                {event.venue && <div><span style={{ color: "var(--text-muted)" }}>Venue:</span> {event.venue}</div>}

                {/* Enhanced date display for festivals */}
                {event.eventType === "standard" ? (
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Festival Dates:</span>
                    {event.eventDate ? (
                      <span>
                        {formatDate(event.eventDate)}
                        {event.eventEndDate && event.eventEndDate !== event.eventDate && ` - ${formatDate(event.eventEndDate)}`}
                      </span>
                    ) : (
                      <span style={{ color: "var(--accent-warning)", fontStyle: "italic" }}>Not set yet</span>
                    )}
                  </div>
                ) : (
                  event.eventDate && <div><span style={{ color: "var(--text-muted)" }}>Date:</span> {formatDate(event.eventDate)}</div>
                )}

                {event.targetAudience && <div><span style={{ color: "var(--text-muted)" }}>Audience:</span> {event.targetAudience}</div>}
                {event.expectedAttendance && <div><span style={{ color: "var(--text-muted)" }}>Expected:</span> {event.expectedAttendance} attendees</div>}
              </div>
            </div>

            {/* Sub-Events Statistics for Standard Events */}
            {event.eventType === "standard" && event.subEventStats && (
              <div className="card" style={{ marginBottom: "var(--space-4)" }}>
                <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "var(--space-3)" }}>
                  📅 Sub-Events Overview
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Total Sub-Events:</span>
                    <span style={{ fontWeight: 600 }}>{event.subEventStats.totalSubEvents}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Resource Requests:</span>
                    <span style={{ fontWeight: 600 }}>{event.subEventStats.totalResourceRequests}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Active Tasks:</span>
                    <span style={{ fontWeight: 600 }}>{event.subEventStats.totalSubEventTasks}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Total Expenses:</span>
                    <span style={{ fontWeight: 600 }}>{event.subEventStats.totalSubEventExpenses}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Participating Clubs & Join Section */}
            {event.eventType === "standard" && (
              <div className="card">
                <div className="card-header">
                  <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>
                    <Users size={16} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />
                    Participating Clubs ({event.participants?.length || 0})
                  </h4>
                </div>

                {/* Join Section - only show if user has clubs that haven't joined */}
                {userClubs.length > 0 && (
                  (() => {
                    const joinedClubIds = event.participants?.map(p => p.club.id) || [];
                    const availableClubs = userClubs.filter(c => !joinedClubIds.includes(c.id));

                    if (availableClubs.length > 0) {
                      return (
                        <div style={{
                          padding: "var(--space-4)",
                          background: "var(--accent-primary-light)",
                          borderRadius: "var(--radius-md)",
                          marginBottom: "var(--space-4)"
                        }}>
                          <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "var(--space-2)", color: "var(--accent-primary)" }}>
                            <UserPlus size={16} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />
                            Join this Standard Event
                          </div>
                          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                            <select
                              className="form-select"
                              value={selectedClubToJoin}
                              onChange={(e) => setSelectedClubToJoin(e.target.value)}
                              style={{ flex: 1 }}
                            >
                              <option value="">Select your club</option>
                              {availableClubs.map((club) => (
                                <option key={club.id} value={club.id}>
                                  {club.name} {club.membershipRole === "head" ? "(Head)" : ""}
                                </option>
                              ))}
                            </select>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={handleJoinEvent}
                              disabled={actionLoading || !selectedClubToJoin}
                            >
                              Join Event
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()
                )}

                {/* List of participating clubs */}
                {event.participants?.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: "var(--space-6)",
                    color: "var(--text-muted)",
                    background: "var(--bg-muted)",
                    borderRadius: "var(--radius-md)"
                  }}>
                    <div style={{ fontSize: "32px", marginBottom: "var(--space-2)" }}>🎪</div>
                    <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "var(--space-1)" }}>
                      No clubs have joined this festival yet
                    </h4>
                    <p style={{ fontSize: "var(--text-xs)" }}>
                      Share the festival details with clubs to get them to join and create sub-events
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                    {event.participants?.map((p) => (
                      <div key={p.id} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        padding: "var(--space-2) var(--space-3)",
                        background: "var(--bg-muted)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "var(--text-sm)"
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "var(--radius-sm)",
                          background: "var(--accent-primary)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white", fontWeight: 600, fontSize: "12px"
                        }}>
                          {p.club.name.charAt(0)}
                        </div>
                        <span>{p.club.name}</span>
                        {userClubs.some(c => c.id === p.club.id) && (
                          <span className="badge badge-approved" style={{ marginLeft: "auto", fontSize: "10px" }}>
                            Your Club
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approvals Tab */}
      {tab === "approvals" && (
        <div>
          {/* Approval Actions */}
          {canApprove && (
            <div className="approval-actions" style={{ flexDirection: "column" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 600, marginBottom: "var(--space-3)" }}>
                Your Review
              </h3>
              <div className="form-group">
                <label className="form-label">Comment</label>
                <textarea
                  className="form-textarea"
                  placeholder="Add your review comments..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{ minHeight: 80 }}
                />
              </div>

              {/* Department notification checkboxes (Dean only) */}
              {user?.role === "dean" && (
                <div className="form-group">
                  <label className="form-label">Notify Departments (upon approval)</label>
                  <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
                    {[
                      { value: "transport", label: "🚌 Transport" },
                      { value: "security", label: "🛡️ Security" },
                      { value: "resource", label: "📦 Resources" },
                      { value: "finance", label: "💰 Finance" },
                    ].map((dept) => (
                      <div key={dept.value} className="form-checkbox-group">
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          checked={deptNotifs.includes(dept.value)}
                          onChange={() => toggleDeptNotif(dept.value)}
                        />
                        <label style={{ fontSize: "var(--text-sm)" }}>{dept.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <button className="btn btn-success" onClick={() => handleApproval("approved")} disabled={actionLoading}>
                  <CheckCircle size={16} /> Approve
                </button>
                <button className="btn btn-danger" onClick={() => handleApproval("rejected")} disabled={actionLoading}>
                  <XCircle size={16} /> Reject
                </button>
              </div>
            </div>
          )}

          {/* Approval Timeline */}
          <div className="card" style={{ marginTop: "var(--space-6)" }}>
            <h3 className="card-title" style={{ marginBottom: "var(--space-5)" }}>Approval Timeline</h3>
            {event.approvalLogs?.length === 0 ? (
              <div className="empty-state">
                <Clock size={48} />
                <h3>No approval actions yet</h3>
              </div>
            ) : (
              <div className="timeline">
                {event.approvalLogs?.map((log) => (
                  <div key={log.id} className="timeline-item">
                    <div className={`timeline-dot ${log.action}`} />
                    <div className="timeline-content">
                      <h4>
                        {log.user?.name} ({log.stage?.replace("_", " ")}) — {log.action}
                      </h4>
                      <p>{formatDateTime(log.createdAt)}</p>
                      {log.comment && <div className="comment">{log.comment}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Budget Tab */}
      {tab === "budget" && (
        <div>
          <div className="stats-grid" style={{ marginBottom: "var(--space-6)" }}>
            <div className="stat-card">
              <div className="stat-icon info"><DollarSign size={22} /></div>
              <div className="stat-content">
                <h3>{formatCurrency(event.budgetEstimate)}</h3>
                <p>Estimated</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success"><DollarSign size={22} /></div>
              <div className="stat-content">
                <h3>{formatCurrency(event.budgetAllocated)}</h3>
                <p>Allocated</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon danger"><DollarSign size={22} /></div>
              <div className="stat-content">
                <h3>{formatCurrency(event.totalExpenses)}</h3>
                <p>Spent</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning"><DollarSign size={22} /></div>
              <div className="stat-content">
                <h3>{formatCurrency(event.budgetRemaining)}</h3>
                <p>Remaining</p>
              </div>
            </div>
          </div>

          {/* Add Expense */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Expenses</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowExpenseForm(!showExpenseForm)}>
                <Plus size={14} /> Add Expense
              </button>
            </div>

            {showExpenseForm && (
              <form onSubmit={handleAddExpense} style={{ marginBottom: "var(--space-4)", padding: "var(--space-4)", background: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount (₹)</label>
                    <input type="number" className="form-input" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                      {["venue", "catering", "equipment", "printing", "transport", "security", "other"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} required />
                </div>
                <button type="submit" className="btn btn-primary btn-sm">Save Expense</button>
              </form>
            )}

            {event.expenses?.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>No expenses recorded</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Description</th><th>Category</th><th>Amount</th><th>Added By</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {event.expenses?.map((exp) => (
                      <tr key={exp.id}>
                        <td>{exp.description}</td>
                        <td><span className="badge badge-draft" style={{ textTransform: "capitalize" }}>{exp.category}</span></td>
                        <td>{formatCurrency(exp.amount)}</td>
                        <td>{exp.addedBy?.name}</td>
                        <td>{formatDate(exp.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Resource Requests */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📦 Resource Requests</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowResourceForm(!showResourceForm)}>
                <Plus size={14} /> Request Resource
              </button>
            </div>

            {showResourceForm && (
              <form onSubmit={handleCreateResourceRequest} style={{ marginBottom: "var(--space-4)", padding: "var(--space-4)", background: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Resource Title *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Sound System"
                      value={resourceForm.title}
                      onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Club *</label>
                    <select
                      className="form-select"
                      value={resourceForm.clubId}
                      onChange={(e) => setResourceForm({ ...resourceForm, clubId: e.target.value })}
                      required
                    >
                      <option value="">Select club</option>
                      {event.eventType === "standard" ? (
                        event.participants?.map((p) => (
                          <option key={p.clubId} value={p.clubId}>{p.club.name}</option>
                        ))
                      ) : event.club ? (
                        <option value={event.club.id}>{event.club.name}</option>
                      ) : null}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe the resource needed..."
                    value={resourceForm.description}
                    onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={resourceForm.category}
                      onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                    >
                      <option value="venue">Venue</option>
                      <option value="equipment">Equipment</option>
                      <option value="transport">Transport</option>
                      <option value="catering">Catering</option>
                      <option value="printing">Printing</option>
                      <option value="security">Security</option>
                      <option value="funding">Funding</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={resourceForm.priority}
                      onChange={(e) => setResourceForm({ ...resourceForm, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 2"
                      value={resourceForm.quantity}
                      onChange={(e) => setResourceForm({ ...resourceForm, quantity: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount (₹) - if funding</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 5000"
                      value={resourceForm.amount}
                      onChange={(e) => setResourceForm({ ...resourceForm, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={actionLoading}>
                    Create Request
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowResourceForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {event.resourceRequests?.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>No resource requests yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {event.resourceRequests?.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      padding: "var(--space-4)",
                      background: "var(--bg-muted)",
                      borderRadius: "var(--radius-md)",
                      borderLeft: `3px solid ${
                        req.status === "fulfilled" ? "var(--accent-success)" :
                        req.status === "approved" ? "var(--accent-info)" :
                        req.status === "rejected" ? "var(--accent-danger)" :
                        "var(--accent-warning)"
                      }`
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
                      <div>
                        <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "var(--space-1)" }}>
                          {req.title}
                        </h4>
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: "var(--space-2)" }}>
                          {req.description}
                        </p>
                      </div>
                      <span className={`badge ${
                        req.status === "fulfilled" ? "badge-approved" :
                        req.status === "approved" ? "badge-progress" :
                        req.status === "rejected" ? "badge-rejected" :
                        "badge-pending"
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--text-xs)", color: "var(--text-muted)", flexWrap: "wrap" }}>
                      <span>📋 {req.category}</span>
                      <span>🏢 {req.club.name}</span>
                      <span>👤 {req.requestedBy.name}</span>
                      {req.quantity && <span>📦 Qty: {req.quantity}</span>}
                      {req.amount && <span>💰 {formatCurrency(req.amount)}</span>}
                      <span className={`badge ${req.priority === "urgent" ? "badge-rejected" : req.priority === "high" ? "badge-pending" : "badge-draft"}`}>
                        {req.priority} priority
                      </span>
                    </div>

                    {req.reviewComment && (
                      <div style={{ marginTop: "var(--space-2)", padding: "var(--space-2)", background: "var(--bg-surface)", borderRadius: "var(--radius-sm)" }}>
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                          <strong>Review:</strong> {req.reviewComment}
                        </p>
                        {req.reviewedBy && (
                          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "var(--space-1)" }}>
                            — {req.reviewedBy.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tasks Tab */}
      {tab === "tasks" && (
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><ListTodo size={20} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8 }} /> Tasks</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowTaskForm(!showTaskForm)}>
                <Plus size={14} /> Add Task
              </button>
            </div>

            {showTaskForm && (
              <form onSubmit={handleAddTask} style={{ marginBottom: "var(--space-4)", padding: "var(--space-4)", background: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
                <div className="form-group">
                  <label className="form-label">Task Title</label>
                  <input className="form-input" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Deadline</label>
                    <input type="datetime-local" className="form-input" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm">Create Task</button>
              </form>
            )}

            {event.tasks?.length === 0 ? (
              <div className="empty-state">
                <ListTodo size={48} />
                <h3>No tasks yet</h3>
                <p>Add tasks to track event execution</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {event.tasks?.map((task) => (
                  <div key={task.id} style={{
                    padding: "var(--space-4)",
                    background: "var(--bg-muted)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{task.title}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
                        {task.assignee ? `Assigned to ${task.assignee.name}` : "Unassigned"}
                        {task.deadline && ` • Due ${formatDate(task.deadline)}`}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                      <span className={`badge ${task.priority === "urgent" ? "badge-rejected" : task.priority === "high" ? "badge-pending" : "badge-draft"}`}>
                        {task.priority}
                      </span>
                      <span className={`badge ${task.status === "completed" ? "badge-approved" : task.status === "delayed" ? "badge-rejected" : "badge-pending"}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Events Tab - Festival Management */}
      {tab === "subevents" && event.eventType === "standard" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-6)" }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🎭 Festival Sub-Events Management</h3>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                {event.status === "APPROVED" && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowSubEventForm(true)}>
                    <Plus size={16} /> Create Sub-Event
                  </button>
                )}
              </div>
            </div>

            {showSubEventForm && (
              <div style={{ marginBottom: "var(--space-6)", padding: "var(--space-5)", background: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
                <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, marginBottom: "var(--space-4)" }}>Create Sub-Event</h4>
                <form onSubmit={handleCreateSubEvent}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Title *</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Coding Competition"
                        value={subEventForm.title}
                        onChange={(e) => setSubEventForm({ ...subEventForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Club *</label>
                      <select
                        className="form-select"
                        value={subEventForm.clubId}
                        onChange={(e) => setSubEventForm({ ...subEventForm, clubId: e.target.value })}
                        required
                      >
                        <option value="">Select club</option>
                        {event.participants?.map((p) => (
                          <option key={p.clubId} value={p.clubId}>{p.club.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description *</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Describe your sub-event..."
                      value={subEventForm.description}
                      onChange={(e) => setSubEventForm({ ...subEventForm, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Event Type</label>
                      <select
                        className="form-select"
                        value={subEventForm.type}
                        onChange={(e) => setSubEventForm({ ...subEventForm, type: e.target.value })}
                      >
                        <option value="tech">Technical</option>
                        <option value="cultural">Cultural</option>
                        <option value="sports">Sports</option>
                        <option value="workshop">Workshop</option>
                        <option value="seminar">Seminar</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Venue</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Lab 201"
                        value={subEventForm.venue}
                        onChange={(e) => setSubEventForm({ ...subEventForm, venue: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Start Date</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={subEventForm.eventDate}
                        onChange={(e) => setSubEventForm({ ...subEventForm, eventDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Date</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={subEventForm.eventEndDate}
                        onChange={(e) => setSubEventForm({ ...subEventForm, eventEndDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                    <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                      Create Sub-Event
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowSubEventForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {event.subEvents?.length === 0 ? (
              <div className="empty-state">
                <Calendar size={48} />
                <h3>No sub-events yet</h3>
                <p>Create sub-events for clubs within this standard event</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
                {event.subEvents?.map((subEvent) => (
                  <div
                    key={subEvent.id}
                    onClick={() => router.push(`/events/${subEvent.id}`)}
                    style={{
                      padding: "var(--space-4)",
                      background: "var(--bg-surface)",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                      border: "1px solid var(--border-subtle)",
                      borderLeft: "3px solid var(--accent-primary)"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-surface-hover)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "var(--bg-surface)"}
                  >
                    <div style={{ marginBottom: "var(--space-3)" }}>
                      <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, marginBottom: "var(--space-1)" }}>
                        {subEvent.title}
                      </h4>
                      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                        <span className="badge badge-progress" style={{ fontSize: "10px", textTransform: "capitalize" }}>
                          {subEvent.type}
                        </span>
                        <span className="badge badge-approved" style={{ fontSize: "10px" }}>
                          {subEvent.club.name}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginBottom: "var(--space-3)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {subEvent.description}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                      <span>By {subEvent.createdBy.name}</span>
                      <div style={{ display: "flex", gap: "var(--space-3)" }}>
                        {subEvent._count.resourceRequests > 0 && <span>📦 {subEvent._count.resourceRequests} requests</span>}
                        {subEvent._count.tasks > 0 && <span>✅ {subEvent._count.tasks} tasks</span>}
                        {subEvent._count.expenses > 0 && <span>💰 {subEvent._count.expenses} expenses</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

```

## 10. SEED FILE
```javascript
// ─────────────────────────────────────────────
// Diganta — Database Seed Script
// Initializes the database with default users and clubs
// ─────────────────────────────────────────────

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/auth.js";

// Load environment variables
config({ path: ".env.local" });

// Create connection pool and adapter for Prisma v7
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["warn", "error"],
});

async function main() {
  console.log("🌱 Starting database seed...");

  // ─── Create Default Users ───
  const users = [
    {
      name: "System Administrator",
      email: "admin@college.edu",
      role: "admin",
      department: "Administration",
    },
    {
      name: "Dr. Jane Smith",
      email: "dean@college.edu",
      role: "dean",
      department: "Academic Affairs",
    },
    {
      name: "Prof. Robert Johnson",
      email: "principal@college.edu",
      role: "principal",
      department: "Administration",
    },
    {
      name: "Dr. Alice Brown",
      email: "faculty1@college.edu",
      role: "faculty_coordinator",
      department: "Computer Science",
    },
    {
      name: "Dr. Mike Davis",
      email: "faculty2@college.edu",
      role: "faculty_coordinator",
      department: "Electronics",
    },
    {
      name: "John Doe",
      email: "student1@college.edu",
      role: "club_head",
      department: "Computer Science",
    },
    {
      name: "Sarah Wilson",
      email: "student2@college.edu",
      role: "student",
      department: "Computer Science",
    },
    {
      name: "Transport Manager",
      email: "transport@college.edu",
      role: "transport",
      department: "Transport",
    },
    {
      name: "Security Chief",
      email: "security@college.edu",
      role: "security",
      department: "Security",
    },
    {
      name: "Resource Manager",
      email: "resource@college.edu",
      role: "resource",
      department: "Resources",
    },
    {
      name: "Finance Manager",
      email: "finance@college.edu",
      role: "finance",
      department: "Finance",
    },
  ];

  const defaultPassword = await hashPassword("password123");

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        passwordHash: defaultPassword,
      },
    });
    console.log(`✓ Created user: ${userData.name} (${userData.role})`);
  }

  // ─── Get Faculty Coordinators for Club Assignment ───
  const aliceBrown = await prisma.user.findUnique({ where: { email: "faculty1@college.edu" } });
  const mikeDavis = await prisma.user.findUnique({ where: { email: "faculty2@college.edu" } });

  // ─── Create Default Clubs ───
  const clubs = [
    {
      name: "Computer Science Club",
      description: "Promoting tech innovation and coding excellence",
      department: "Computer Science",
      type: "departmental",
      facultyCoordinatorId: aliceBrown.id,
    },
    {
      name: "Electronics Society",
      description: "Advancing electronics and circuit design",
      department: "Electronics",
      type: "departmental",
      facultyCoordinatorId: mikeDavis.id,
    },
    {
      name: "Cultural Committee",
      description: "Organizing cultural events and festivals",
      department: null,
      type: "non_departmental",
      facultyCoordinatorId: aliceBrown.id,
    },
    {
      name: "Sports Club",
      description: "Promoting sports and physical fitness",
      department: null,
      type: "non_departmental",
      facultyCoordinatorId: mikeDavis.id,
    },
  ];

  for (const clubData of clubs) {
    const club = await prisma.club.upsert({
      where: { name: clubData.name },
      update: {},
      create: clubData,
    });
    console.log(`✓ Created club: ${club.name}`);
  }

  // ─── Assign Club Head Membership ───
  const johnDoe = await prisma.user.findUnique({ where: { email: "student1@college.edu" } });
  const csClub = await prisma.club.findUnique({ where: { name: "Computer Science Club" } });

  await prisma.clubMember.upsert({
    where: {
      userId_clubId: {
        userId: johnDoe.id,
        clubId: csClub.id,
      },
    },
    update: {},
    create: {
      userId: johnDoe.id,
      clubId: csClub.id,
      role: "head",
    },
  });
  console.log(`✓ Assigned ${johnDoe.name} as head of ${csClub.name}`);

  console.log("🎉 Database seeded successfully!");
  console.log("\n📋 Default Login Credentials:");
  console.log("Admin: admin@college.edu / password123");
  console.log("Dean: dean@college.edu / password123");
  console.log("Club Head: student1@college.edu / password123");
  console.log("Student: student2@college.edu / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
```

## 11. KNOWN ISSUES
- The system is under active refactoring and hardening.
- Vendor verification UI originally relied on `window.confirm` which failed in strict automation environments (fixed).
- Database connections needed separation between `.env` and `.env.local` to properly sync the schema to `diganta_mvp`.
- `pg-pool` errors may appear if Next.js singletons are incorrectly evaluated without dotenv loading environment variables in standalone node scripts.

## 12. WHAT IS WORKING vs WHAT IS NOT
- **Working**: 
  - Vendor Registration Flow
  - Admin Vendor Verification & Approval Dashboard (Fixed custom modal)
  - Next.js development server
  - Authentication (JWT-based custom implementation)
  - Standard Events Dashboard layout & filtering
- **Not Working / Unfinished**:
  - The milestone achieved badge may need to be removed (as per previous conversation summary).
  - Certain approval logic pieces were recently updated to be club-specific, might need full integration testing.
  - Email integrations / notification delivery may just be DB entries currently.
