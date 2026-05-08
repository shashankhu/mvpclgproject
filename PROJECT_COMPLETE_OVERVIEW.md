# 📋 DIGANTA — Complete Project Overview & Documentation

> **Diganta** is a production-grade college event management system with sophisticated approval workflows, role-based access control, and a "mission control" dashboard. It manages the complete lifecycle of events from proposal through completion with immutable audit trails.

---

## 🎯 Executive Summary

A **comprehensive event management platform** for colleges that handles:
- Multi-stage approval workflows (Faculty → Dean → Principal → Admin)
- 11+ role-based access control system
- Festival/Standard event management with sub-events
- Resource requests (equipment, funding, transport, security)
- Vendor ecosystem (registration, quotations, billing)
- Budget tracking and escalation for high-value events (>₹50K)
- Real-time dashboard with role-aware analytics
- Immutable audit trail for compliance

---

## 🏗️ Architecture Overview

### **Tech Stack**

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16.2.1, React 19.2.4, Custom CSS Design System |
| **Backend** | Next.js API Routes, Prisma ORM v7.5.0 |
| **Database** | PostgreSQL 12+ with pg adapter |
| **Authentication** | JWT-based (7-day expiration) |
| **Icons** | Lucide React |
| **Styling** | Inter font, Indigo primary color scheme |
| **Password Hashing** | Bcryptjs v3.0.3 |
| **Validation** | JWTWebToken v9.0.3 |

### **Dependencies Summary**
```json
{
  "runtime": {
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
  "dev": {
    "dotenv": "^17.3.1",
    "eslint": "^9",
    "eslint-config-next": "16.2.1",
    "vitest": "^4.1.2"
  }
}
```

---

## 👥 Role System (11 Roles)

### **Academic Hierarchy**
| Role | Responsibilities | Permissions |
|------|------------------|-------------|
| **Student** | Create club events, participate | Create club events, join standard events |
| **Club Head** | Manage club, create events | Full club control, event creation |
| **Faculty Coordinator** | Approve club proposals | Approve events for assigned clubs |
| **Dean** | Create standard events, approve faculty proposals | Create standard events, approve sub-events |
| **Principal** | High-budget event final approval | Approve events > ₹50K |
| **Admin** | System management, final approvals | Full system access |

### **Department Roles (Execution Layer)**
| Role | Responsibilities | Permissions |
|------|------------------|-------------|
| **Transport Manager** | Execute transport needs | View transport requests, no approval rights |
| **Security Chief** | Execute security needs | View security requests, no approval rights |
| **Resource Manager** | Manage resources & allocations | Approve resource requests, allocate funding |
| **Finance Manager** | Process vendor bills | Approve vendor bills, process payments |
| **Vendor** | Provide quotations & billing | Register as vendor, submit quotations |

---

## 🔄 Event Approval Workflow

### **Workflow Chain for Club Events**

#### **Budget ≤ ₹50,000 (Standard Approval)**
```
Club Creates Event (DRAFT)
    ↓
Faculty Coordinator Review (WAITING_FOR_FACULTY)
    • Can approve with comments
    • Can request revisions
    • Can reject with reason
    ↓
Dean Review (WAITING_FOR_DEAN)
    • Reviews faculty-approved events
    • Final budget validation
    ↓
✅ APPROVED
    • Moves to execution
    • Resource requests can begin
```

#### **Budget > ₹50,000 (Escalated Approval)**
```
Club Creates Event (High-Budget)
    ↓
Faculty Coordinator (WAITING_FOR_FACULTY)
    ↓
Dean (WAITING_FOR_DEAN)
    ↓
Principal (WAITING_FOR_PRINCIPAL)
    • Mandatory for high-value events
    • Principal reviews budget justification
    ↓
Admin (WAITING_FOR_ADMIN)
    • Final system approval
    • Can audit all approvals
    ↓
✅ APPROVED
```

### **Standard Event Workflow (Dean-Controlled)**
```
Dean Creates "Tech Fest 2026" (Standard Event)
    • Auto-approved (Dean authority)
    • Open for club participation
    ↓
Clubs JOIN the Festival
    • "Computer Science Club" joins
    • "Electronics Club" joins
    • "Cultural Club" joins
    ↓
Clubs Propose SUB-EVENTS
    • CS Club: "Coding Marathon" (WAITING_FOR_DEAN)
    • Electronics: "Robot Exhibition" (WAITING_FOR_DEAN)
    • Cultural: "Fashion Show" (WAITING_FOR_DEAN)
    ↓
Dean Reviews Each Sub-Event
    • Checks objectives, budget, venue conflicts
    • Approves or rejects individually
    ↓
Approved Sub-Events → Resource Management
    • Clubs can request equipment
    • Request transport/security/funding
    • Resource Manager reviews & approves
```

### **Complete Event Status Flow**
```
DRAFT 
  ↓
WAITING_FOR_FACULTY (Faculty Coordinator review)
  ↓
WAITING_FOR_DEAN (Dean review)
  ↓
WAITING_FOR_PRINCIPAL? (if budget > ₹50K)
  ↓
WAITING_FOR_ADMIN? (if budget > ₹50K)
  ↓
APPROVED
  ↓
IN_PROGRESS (execution phase)
  ↓
COMPLETED
  ↓
ARCHIVED

Alternative paths:
  → REJECTED (from any stage)
  → REVISION_REQUESTED (back to previous stage)
```

---

## 📊 Database Schema (17 Models)

### **Core Models**

#### **1. User**
```prisma
- id (CUID)
- name, email (unique), passwordHash
- role (student | club_head | faculty_coordinator | dean | principal | admin | transport | security | resource | finance | vendor)
- department, phone, avatarUrl
- isActive, createdAt, updatedAt
- Relations: clubs, events, approvals, tasks, notifications, expenses, etc.
```

#### **2. Club**
```prisma
- id, name (unique), description, department
- logoUrl, type (departmental | non_departmental)
- facultyCoordinatorId (required for routing)
- isActive, createdAt, updatedAt
- Relations: members, events, participants, resource requests
```

#### **3. ClubMember**
```prisma
- id, userId, clubId
- role (member | head | coordinator)
- joinedAt
- Unique constraint: [userId, clubId]
```

#### **4. Event (Core)**
```prisma
- id, title, description
- type (tech | cultural | sports | workshop | seminar | standard)
- eventType (club | standard — dean-created)
- status (DRAFT → WAITING_FOR_FACULTY → WAITING_FOR_DEAN → ...)

Proposal Fields:
- objectives, targetAudience, expectedAttendance
- venue, eventDate, eventEndDate

Budget & Resources:
- budgetEstimate (decimal)
- needsTransport, needsSecurity, needsResources (booleans)
- transportNotes, securityNotes, resourceNotes

Parent-Child (Festivals):
- parentEventId (null for top-level, references parent for sub-events)
- subEvents (array of child events)

Creator:
- createdById, clubId (null for dean-created)
- createdAt, updatedAt

Relations: approvalLogs, budget, expenses, tasks, participants, notifications
```

#### **5. EventParticipant**
```prisma
- id, eventId, clubId
- status (joined | left)
- joinedAt
- Tracks clubs joining standard events
```

#### **6. ApprovalLog (Event-Sourcing)**
```prisma
- id, eventId, userId
- role (frozen at time of action)
- action (approved | rejected | revision_requested)
- comment, stage (faculty_coordinator | dean | principal | admin)
- createdAt
- Immutable audit trail of all approvals
```

#### **7. Budget**
```prisma
- id, eventId (unique)
- totalAllocated (decimal)
- createdAt, updatedAt
- One-to-one with Event
```

#### **8. Expense**
```prisma
- id, eventId, amount (decimal)
- description, category (venue | catering | equipment | printing | transport | security | other)
- proofUrl (bill upload path)
- addedById, createdAt
```

#### **9. Task (Execution Tracking)**
```prisma
- id, eventId
- title, description
- assignedToId, createdById
- dueDate, status (pending | in_progress | completed | delayed | cancelled)
- createdAt, updatedAt
```

#### **10. Notification**
```prisma
- id, userId
- type, message, isRead
- relatedEventId, relatedUserId
- createdAt
```

#### **11. ResourceRequest**
```prisma
- id, eventId, clubId, requestedById
- title, description
- category (venue | equipment | transport | catering | printing | security | funding | other)
- amount, quantity, priority (low | medium | high | urgent)
- status (pending | approved | rejected | fulfilled | quotation_requested)
- reviewedById, reviewComment, reviewedAt
- Relations: quotationRequests, attachments
```

#### **12. QuotationRequest**
```prisma
- id, resourceRequestId, vendorId, requestedById
- status (pending | quoted | accepted | rejected)
- quotedAmount (decimal)
- description, validUntil
- Relations: vendor, attachments
```

#### **13. Vendor**
```prisma
- id, userId (unique)
- vendorName, registrationNumber
- contactEmail, contactPhone
- companyAddress, bankDetails
- isVerified, verifiedById, verificationDate
- createdAt, updatedAt
```

#### **14. VendorBill**
```prisma
- id, vendorId, eventId, processedById
- billNumber, billDate (unique per vendor)
- amount (decimal), description
- status (pending | approved | paid | rejected)
- approvedAmount (decimal)
- paymentDate, proofUrl
- createdAt, updatedAt
```

#### **15. Attachment**
```prisma
- id, uploadedById
- fileName, fileUrl, fileSize, mimeType
- relatedResourceId, relatedExpenseId, relatedBillId
- createdAt
```

#### **16. DeptNotification**
```prisma
- id, eventId
- departmentRole (transport | security | resource | finance)
- message, isAcknowledged
- createdAt
- Alerts to department roles on event approval
```

#### **17. AuditLog**
```prisma
- id, userId
- action, entityType, entityId
- changes (JSON)
- ipAddress, userAgent
- createdAt
```

---

## 🌐 API Routes Structure

### **Authentication Routes (/api/auth)**
```
POST   /api/auth/login              → Authenticate user, return JWT
POST   /api/auth/signup             → Register new user
GET    /api/auth/me                 → Get current user profile
```

### **Dashboard Routes (/api/dashboard)**
```
GET    /api/dashboard               → Role-aware dashboard stats
GET    /api/dashboard/pending       → Pending approvals for user
GET    /api/dashboard/events        → User's events
GET    /api/dashboard/tasks         → User's tasks
```

### **Events Routes (/api/events)**
```
GET    /api/events                  → List all events (with filters)
POST   /api/events                  → Create new event
GET    /api/events/[id]             → Get event details
PUT    /api/events/[id]             → Update event
GET    /api/events/[id]/approvals   → Get approval history
GET    /api/events/[id]/budget      → Get budget details
GET    /api/events/[id]/expenses    → Get expenses
GET    /api/events/[id]/tasks       → Get tasks
GET    /api/events/[id]/subevents   → Get sub-events (if festival)
POST   /api/events/[id]/approve     → Approve event (approvers only)
POST   /api/events/[id]/reject      → Reject event
POST   /api/events/[id]/submit      → Submit for review
GET    /api/events/calendar         → Calendar view
```

### **Clubs Routes (/api/clubs)**
```
GET    /api/clubs                   → List all clubs
POST   /api/clubs                   → Create club (admin)
GET    /api/clubs/[id]              → Get club details
PUT    /api/clubs/[id]              → Update club
GET    /api/clubs/[id]/members      → Get club members
POST   /api/clubs/[id]/members      → Add member
DELETE /api/clubs/[id]/members/[uid] → Remove member
GET    /api/clubs/my                → Get user's clubs
```

### **Approvals Routes (/api/approvals)**
```
GET    /api/approvals/pending       → Pending approval queue
GET    /api/approvals/[id]/history  → Approval history for event
```

### **Notifications Routes (/api/notifications)**
```
GET    /api/notifications           → Get user notifications
GET    /api/notifications/unread    → Get unread count
POST   /api/notifications/[id]/read → Mark as read
DELETE /api/notifications/[id]      → Delete notification
```

### **Resource Requests Routes (/api/resource-requests)**
```
GET    /api/resource-requests       → List requests (filtered)
POST   /api/resource-requests       → Create request
GET    /api/resource-requests/[id]  → Get request details
PUT    /api/resource-requests/[id]  → Update request
POST   /api/resource-requests/[id]/approve → Resource manager approval
```

### **Quotation Requests Routes (/api/quotation-requests)**
```
GET    /api/quotation-requests      → List quotation requests
POST   /api/quotation-requests      → Create quotation request
GET    /api/quotation-requests/[id] → Get request details
PUT    /api/quotation-requests/[id] → Update request status
```

### **Vendors Routes (/api/vendors)**
```
POST   /api/vendors/register        → Register as vendor
GET    /api/vendors                 → List all vendors (admin)
GET    /api/vendors/[id]            → Get vendor profile
PUT    /api/vendors/[id]            → Update vendor info
GET    /api/vendors/[id]/quotations → Get vendor's quotations
POST   /api/vendors/[id]/quotations → Submit quotation
```

### **Vendor Bills Routes (/api/vendor-bills)**
```
GET    /api/vendor-bills            → List bills (filtered by role)
POST   /api/vendor-bills            → Submit bill (vendor)
GET    /api/vendor-bills/[id]       → Get bill details
POST   /api/vendor-bills/[id]/approve → Finance manager approval
POST   /api/vendor-bills/[id]/pay   → Mark as paid
```

### **Users Routes (/api/users)**
```
GET    /api/users/faculty-coordinators → List faculty coordinators
GET    /api/users/students            → List students
GET    /api/users/[id]                → Get user profile (admin)
PUT    /api/users/[id]                → Update user (admin)
```

### **Admin Routes (/api/admin)**
```
POST   /api/admin/impersonate        → Impersonate user (admin only)
POST   /api/admin/setup              → System setup
```

### **Upload Route (/api/upload)**
```
POST   /api/upload                   → Upload file (returns URL)
```

---

## 🎨 UI/UX Design System

### **Color Palette**

#### **Primary & Semantic Colors**
```css
/* Core Brand */
--primary-600: #4F46E5;        /* Indigo — Primary actions */
--primary-700: #4338CA;        /* Indigo dark — Hover states */
--primary-50: #EEF2FF;         /* Indigo tint — Backgrounds */

/* Status Indicators */
--success-500: #10B981;        /* Approved, Complete */
--success-50: #ECFDF5;         /* Success background */

--warning-500: #F59E0B;        /* Pending, In Review */
--warning-50: #FFFBEB;         /* Warning background */

--error-500: #EF4444;          /* Rejected, Blocked */
--error-50: #FEF2F2;           /* Error background */

--info-500: #3B82F6;           /* In Progress */
--info-50: #EFF6FF;            /* Info background */

/* Neutrals */
--gray-900: #111827;           /* Primary text */
--gray-700: #374151;           /* Secondary text */
--gray-500: #6B7280;           /* Muted text */
--gray-300: #D1D5DB;           /* Borders */
--gray-100: #F3F4F6;           /* Subtle backgrounds */
--gray-50: #F9FAFB;            /* Page background */
--white: #FFFFFF;              /* Cards, modals */
```

#### **Dark Mode (Future Enhancement)**
```css
--bg-primary: #0F172A;         /* Slate 900 */
--bg-secondary: #1E293B;       /* Slate 800 */
--bg-card: #334155;            /* Slate 700 */
--text-primary: #F8FAFC;       /* Slate 50 */
--text-secondary: #94A3B8;     /* Slate 400 */
```

### **Typography**

#### **Font Stack**
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

#### **Type Scale**
| Scale | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Display | 30px | 700 | 1.2 | Page titles |
| Heading-1 | 24px | 600 | 1.3 | Section headers |
| Heading-2 | 20px | 600 | 1.4 | Card titles |
| Heading-3 | 16px | 600 | 1.5 | Subsections |
| Body | 14px | 400 | 1.6 | Default text |
| Body-sm | 13px | 400 | 1.5 | Secondary info |
| Caption | 12px | 500 | 1.4 | Labels, tags |
| Overline | 11px | 600 | 1.3 | Section labels |

---

## 📱 Page & Screen Structure

### **Public Routes (No Auth Required)**
```
/                              → Redirect to /login or /dashboard
/login                         → Login page
/signup                        → Registration with role selection
/vendor-register               → Vendor registration
```

### **Authenticated Routes (With Sidebar Layout)**
```
/dashboard                     → Mission control dashboard
/events                        → Events list & filter
/events/new                    → Create new event
/events/[id]                   → Event details (tabs)
/approvals                     → Approval queue
/clubs                         → Club directory
/notifications                 → Notification center
/quotation-requests            → Quotation management
/vendors                       → Vendor directory (if admin)
/vendor-bills                  → Vendor billing (if finance)
/vendor-register               → Register as vendor
```

### **Screen Details**

#### **1. Login Page (/login)**
- Centered card on gradient background
- Email & password inputs
- "Sign In" button
- Link to /signup
- Error/success toast notifications

#### **2. Dashboard (/dashboard)**
**Components:**
- Stats grid (4 cards): Total Events, Approved, Pending, Rejected
- Pending Approvals section (if approver)
- Department Alerts (if department role)
- Recent Events section
- My Tasks section (if assigned)
- Interactive cards linking to detail pages

#### **3. Events List (/events)**
- Header with "Create Event" button
- Filter bar: Status, Type, Club
- Responsive card grid (min 340px)
- Event cards show: Title, Status badge, Description (2-line clamp), Creator, Date
- Click card → Event detail page

#### **4. Event Detail (/events/[id])**
**Tabs:**
- **Overview**: Title, description, dates, venue, budget, club
- **Approvals**: Approval history with timeline, comments
- **Budget**: Budget estimate, expenses, breakdown
- **Tasks**: Event execution tasks
- **Resources**: Resource requests (post-approval)
- **Sub-events**: (If festival)

**Approval Actions** (if approver):
- Approve button
- Request revision button (back to DRAFT)
- Reject button with reason

#### **5. Create Event Form (/events/new)**
**Fields:**
- Title, Description (textarea)
- Type dropdown (tech, cultural, sports, workshop, seminar)
- Club (readonly for students/club heads)
- Objectives, Target Audience, Expected Attendance
- Venue, Event Date, Event End Date
- Budget Estimate (decimal)
- Checkboxes: Needs Transport, Needs Security, Needs Resources
- Notes fields for each resource type
- Submit button (goes to DRAFT)

#### **6. Approvals Queue (/approvals)**
- Pending approvals for current user (only if approver role)
- Table/list: Event title, Creator, Club, Budget, Submitted date
- Click → Event detail page for review

#### **7. Clubs Directory (/clubs)**
- Club grid with: Name, Description, Members count, Faculty Coordinator
- "Create Club" button (admin only)
- Click club → /clubs/[id] detail page

#### **8. Notifications (/notifications)**
- List of user notifications (most recent first)
- Badge: Read/Unread status
- Delete button per notification
- Click → Links to relevant entity

---

## 🔐 Authentication & Security

### **JWT Implementation**
- **Token Duration**: 7 days
- **Payload**: { userId, role, email, issuedAt, expiresAt }
- **Storage**: HTTP-only cookie (secure by default)
- **Refresh**: Automatic on API calls (sliding window)

### **Password Security**
- **Hashing**: Bcryptjs with 10 salt rounds
- **Minimum Length**: 6 characters (stored requirement)
- **Never Stored**: Plain passwords never logged or cached

### **API Security**
- **Rate Limiting**: 100 requests per 15 minutes (configurable)
- **CORS**: Allow only same-origin requests
- **Input Validation**: All inputs validated server-side
- **SQL Injection Prevention**: Prisma parameterized queries
- **XSS Prevention**: React's default escaping
- **CSRF Protection**: SameSite cookie attribute

### **Role-Based Access Control (RBAC)**
- **Middleware**: Every route checks `req.user.role`
- **Permissions Matrix**: Defined per route
- **Data Isolation**: Users only see/modify own data (except admin)
- **Immutable Audit**: All actions logged to ApprovalLog

---

## 🔄 Key Features & Workflows

### **1. Complete Event Lifecycle**
```
Proposal Phase → Review Phase → Approval Phase → Execution Phase → Completion
     ↓               ↓               ↓               ↓               ↓
DRAFT          WAITING_FOR_*   APPROVED        IN_PROGRESS        COMPLETED
                                                                   ARCHIVED
```

### **2. Budget-Based Auto-Escalation**
```
if (budgetEstimate > 50000) {
  // Add Principal & Admin to approval chain
  statusFlow = [FACULTY, DEAN, PRINCIPAL, ADMIN]
} else {
  // Standard flow
  statusFlow = [FACULTY, DEAN]
}
```

### **3. Festival/Standard Event System**
- Dean creates festivals → Auto-approved
- Clubs join festivals
- Clubs propose sub-events within festivals → WAITING_FOR_DEAN
- Dean reviews each sub-event
- Approved → Resource requests allowed

### **4. Resource Request Workflow**
```
Post-Approval:
  Club submits resource request
    ↓
  Resource Manager reviews
    ↓
  Approve/Reject/Request Quotation
    ↓
  If quotation → Vendor quotation cycle
    ↓
  Fulfilled/Rejected
```

### **5. Vendor Ecosystem**
```
Vendor Registration → Profile Setup → Quotation Submission → Bill Processing → Payment
```

### **6. Task Management (Execution)**
- Create tasks for event execution
- Assign to users with deadlines
- Track: Pending, In Progress, Completed, Delayed
- Visual indicators for overdue tasks

### **7. Department Notifications**
- On event approval, notify relevant departments
- Transport: If needsTransport = true
- Security: If needsSecurity = true
- Resource: If needsResources = true
- Finance: If high-value transaction

### **8. Immutable Audit Trail**
- Every approval/rejection logged to ApprovalLog
- Frozen role captured at time of action
- Survives user role changes
- Used for compliance & dispute resolution

---

## 🚀 Development Workflow

### **Setup Commands**
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with PostgreSQL credentials

# 3. Setup database (one command)
npm run db:setup
# Generates Prisma client + pushes schema + seeds data

# 4. Start development server
npm run dev
# Visit http://localhost:3000
```

### **Database Commands**
```bash
npm run db:generate          # Generate Prisma client
npm run db:push              # Push schema to database
npm run db:migrate           # Create migration
npm run db:seed              # Seed with test data
npm run db:reset             # Full database reset
npm run db:studio            # Open Prisma Studio GUI
```

### **Testing Credentials** (Post-Seed)
```
Admin:        admin@college.edu / password123
Dean:         dean@college.edu / password123
Club Head:    student1@college.edu / password123
Student:      student2@college.edu / password123
Faculty Coord: (created in seed)
```

### **Build Commands**
```bash
npm run build               # Production build
npm run start               # Start production server
npm run lint                # ESLint check
```

---

## 📂 Project Directory Structure

```
mvptrail/
├── src/
│   ├── app/
│   │   ├── (app)/                          # Protected routes with sidebar
│   │   │   ├── layout.js                   # App shell with auth
│   │   │   ├── dashboard/page.js           # Dashboard
│   │   │   ├── events/
│   │   │   │   ├── page.js                 # Events list
│   │   │   │   ├── new/page.js             # Create event
│   │   │   │   └── [id]/page.js            # Event detail
│   │   │   ├── clubs/page.js               # Club directory
│   │   │   ├── approvals/page.js           # Approval queue
│   │   │   └── notifications/page.js       # Notifications
│   │   │
│   │   ├── api/                            # REST API routes
│   │   │   ├── auth/
│   │   │   │   ├── login/route.js
│   │   │   │   ├── signup/route.js
│   │   │   │   └── me/route.js
│   │   │   ├── dashboard/route.js
│   │   │   ├── events/
│   │   │   │   ├── route.js
│   │   │   │   └── [id]/route.js
│   │   │   ├── clubs/
│   │   │   │   ├── route.js
│   │   │   │   ├── [id]/route.js
│   │   │   │   └── my/route.js
│   │   │   ├── approvals/pending/route.js
│   │   │   ├── notifications/route.js
│   │   │   ├── quotation-requests/route.js
│   │   │   ├── resource-requests/route.js
│   │   │   ├── vendors/
│   │   │   │   ├── route.js
│   │   │   │   └── [id]/route.js
│   │   │   ├── vendor-bills/
│   │   │   │   ├── route.js
│   │   │   │   └── [id]/route.js
│   │   │   ├── users/route.js
│   │   │   ├── admin/
│   │   │   │   ├── impersonate/route.js
│   │   │   │   └── setup/route.js
│   │   │   └── upload/route.js
│   │   │
│   │   ├── login/page.js                   # Login page
│   │   ├── signup/page.js                  # Signup page
│   │   ├── vendor-register/page.js         # Vendor registration
│   │   ├── layout.js                       # Root layout
│   │   ├── page.js                         # Root redirect
│   │   └── globals.css                     # Design system
│   │
│   ├── components/
│   │   ├── EventCalendar.js                # Calendar view
│   │   ├── Sidebar.js                      # Navigation sidebar
│   │   ├── Toast.js                        # Notification toast
│   │   └── [other reusable components]
│   │
│   ├── context/
│   │   └── AuthContext.js                  # Auth state management
│   │
│   └── lib/
│       ├── api.js                          # API utility functions
│       ├── auth.js                         # JWT handling
│       ├── prisma.js                       # Prisma client instance
│       ├── approval.js                     # Approval logic
│       ├── audit.js                        # Audit logging
│       ├── constants.js                    # Constants & config
│       ├── upload.js                       # File upload handler
│       ├── rate-limiter.js                 # Rate limiting
│       ├── utils.js                        # Utility functions
│       └── __tests__/                      # Unit tests
│
├── prisma/
│   ├── schema.prisma                       # Database schema (17 models)
│   ├── seed.js                             # Initial data seed
│   └── migrations/                         # Database migrations
│
├── public/                                 # Static assets
├── docs/
│   ├── DESIGN_SYSTEM.md                   # Design documentation
│   ├── FESTIVAL_WORKFLOW.md               # Festival feature docs
│   ├── UI_UX_DESIGN_BRIEF.md              # UI specifications
│   ├── SETUP.md                           # Setup instructions
│
├── .env.local                              # Environment variables
├── .env.example                            # Environment template
├── package.json                            # Dependencies & scripts
├── prisma.config.ts                        # Prisma config
├── next.config.mjs                         # Next.js config
├── jsconfig.json                           # JS config
├── eslint.config.mjs                       # ESLint config
├── README.md                               # Project overview
├── LICENSE                                 # MIT License
└── PROJECT_COMPLETE_OVERVIEW.md            # This file
```

---

## ⚡ Key Implementation Details

### **Event-Sourcing Approval Model**
```javascript
// Every approval is immutable
ApprovalLog {
  id: "unique",
  eventId: "event123",
  userId: "user456",
  role: "dean",                    // Frozen at action time
  action: "approved",
  comment: "Budget looks good",
  stage: "dean",
  createdAt: timestamp             // Never changes
}
```

### **Budget Auto-Escalation Logic**
```javascript
if (event.budgetEstimate > 50000) {
  // Must go through: Faculty → Dean → Principal → Admin
  event.status = "WAITING_FOR_PRINCIPAL" // after Dean approval
} else {
  // Standard path: Faculty → Dean → Approved
  event.status = "APPROVED" // after Dean approval
}
```

### **Sub-Event Hierarchy**
```javascript
// Festival (Standard Event)
Event {
  id: "fest2026",
  eventType: "standard",
  parentEventId: null            // Top-level
  subEvents: [event1, event2]    // Children
}

// Sub-Event (Proposed within festival)
Event {
  id: "event1",
  eventType: "club",
  parentEventId: "fest2026",     // Links to parent
  status: "WAITING_FOR_DEAN"     // All sub-events need Dean approval
}
```

### **Rate Limiting Middleware**
```javascript
// 100 requests per 15 minutes per IP
getOrCreateWindow(ip).requestCount++
if (requestCount > 100) {
  return 429 Too Many Requests
}
```

### **JWT Flow**
```javascript
// Login
POST /api/auth/login
→ Validate credentials
→ Generate JWT: { userId, role, email, iat, exp: now + 7d }
→ Set HTTP-only cookie

// Subsequent requests
Every API call includes JWT in cookie
→ Middleware verifies & decodes
→ Attaches req.user = { userId, role, email }
```

---

## 📊 Data Flow Diagrams

### **Event Creation to Approval**
```
User (Club Head) 
   ↓
Creates Event Form → /events/new
   ↓
POST /api/events → Create in DB (DRAFT)
   ↓
Notification → Faculty Coordinator
   ↓
Faculty Reviews → /events/[id]
   ↓
POST /api/events/[id]/approve 
   ↓
Event Status: DRAFT → WAITING_FOR_DEAN
Notification → Dean
   ↓
Dean Reviews & Approves
   ↓
Check: budgetEstimate > 50K?
   ├─ Yes → WAITING_FOR_PRINCIPAL
   └─ No → APPROVED
```

### **Resource Request Workflow**
```
Post-Approval Event
   ↓
Club Head → Create Resource Request
   ↓
POST /api/resource-requests
   ↓
Resource Manager Reviews
   ↓
Approve? 
   ├─ Yes → Status: approved (ready for execution)
   ├─ No → Status: rejected (notify club)
   └─ Quotation? → Request from vendors
       ↓
       Vendors Submit Quotations
       ↓
       Resource Manager Reviews Quotes
       ↓
       Accept Best Quote → Fulfill Request
```

---

## 🔍 Quick Reference Stats

| Metric | Count |
|--------|-------|
| **Models** | 17 |
| **API Routes** | 13+ groups (~50+ endpoints) |
| **Pages/Screens** | 9 main pages |
| **Roles** | 11 |
| **Event Statuses** | 10 |
| **Resource Categories** | 8 |
| **Supported Languages** | JavaScript/JSX |
| **Test Users** | 4 pre-seeded |

---

## 🎯 Core Business Logic Rules

### **Event Approval Rules**
1. **Routing**: Faculty → (always) → Dean → (if budget > 50K) → Principal → Admin
2. **Role Requirement**: Each stage requires specific role
3. **Budget Escalation**: Automatic based on `budgetEstimate`
4. **Status Progression**: Linear progression (can backtrack for revisions)
5. **Immutability**: All approvals logged permanently

### **Festival Rules**
1. **Creation**: Only Dean can create standard events (festivals)
2. **Auto-Approval**: Festivals auto-approved on creation
3. **Sub-Event Requirements**: Sub-events propose → require Dean approval
4. **Resource Access**: Only approved sub-events can request resources
5. **Parent Tracking**: All sub-events maintain `parentEventId` link

### **Resource Request Rules**
1. **Timing**: Can only request after event is APPROVED
2. **Categories**: 8 pre-defined categories (venue, equipment, etc.)
3. **Priority**: Urgent requests escalated visually
4. **Approval Flow**: Resource Manager approves or requests quotation
5. **Quotation Path**: Vendors submit quotes, manager selects best

### **Department Notification Rules**
1. **Transport**: Triggered when `needsTransport = true`
2. **Security**: Triggered when `needsSecurity = true`
3. **Resource**: Triggered when `needsResources = true`
4. **Timing**: Sent immediately upon event approval
5. **Acknowledgment**: Department can mark as acknowledged

### **Budget Rules**
1. **Tracking**: Every event has max budget estimate
2. **Expenses**: Track against budget
3. **Escalation**: Budget > ₹50K requires extra approvals
4. **Forecasting**: Dashboard shows budget vs. actual
5. **Alerts**: Finance notified if spending exceeds 80%

---

## 🚀 Roadmap for Rebuilding

### **Phase 1: Foundation**
- [ ] Setup Next.js 16 + React 19 project
- [ ] Configure PostgreSQL database
- [ ] Create Prisma schema with 17 models
- [ ] Seed initial data

### **Phase 2: Authentication**
- [ ] JWT implementation
- [ ] Login/Signup pages
- [ ] Auth context & middleware
- [ ] Password hashing with bcryptjs

### **Phase 3: Core APIs**
- [ ] Event CRUD endpoints
- [ ] Approval endpoints with logic
- [ ] Club management endpoints
- [ ] User role system

### **Phase 4: UI/UX**
- [ ] Design system CSS
- [ ] Dashboard page
- [ ] Events list & detail
- [ ] Approval queue page
- [ ] Form components

### **Phase 5: Advanced Features**
- [ ] Budget escalation logic
- [ ] Festival/sub-event system
- [ ] Resource request workflow
- [ ] Vendor ecosystem
- [ ] Quotation system
- [ ] Bill processing

### **Phase 6: Execution Layer**
- [ ] Task management
- [ ] Notifications system
- [ ] Department alerts
- [ ] File uploads
- [ ] Audit logging

### **Phase 7: Polish**
- [ ] Performance optimization
- [ ] Rate limiting
- [ ] Error handling edge cases
- [ ] Testing
- [ ] Documentation

---

## 📝 Notes for Fresh Build

- **JWT Expiration**: 7 days (can be adjusted in `lib/auth.js`)
- **Database**: PostgreSQL required (no SQLite fallback)
- **Rate Limits**: 100 requests per 15 minutes (configurable)
- **File Uploads**: Store in `/public/uploads` or external storage
- **Email Notifications**: Currently in-app only (add sendgrid for email)
- **Dark Mode**: Designed for future enhancement (CSS ready)
- **Mobile**: Responsive design from start

---

**Last Updated**: April 20, 2026  
**Version**: 1.0.0  
**Status**: Production-Ready Specifications
