# Diganta UI/UX Design Brief
## Comprehensive Analysis for AI Design Agent

---

## 1. SITEMAP & SCREENS

### Public Routes (No Authentication)
```
/                    → Landing/Redirect (redirects to /login or /dashboard)
/login               → Login Page
/signup              → Registration Page
```

### Authenticated Routes (App Shell with Sidebar)
```
/dashboard           → Mission Control Dashboard
/events              → Events List (Browse & Filter)
/events/new          → Create New Event Form
/events/[id]         → Event Detail Page (Tabbed: Overview, Approvals, Budget, Tasks)
/approvals           → Pending Approvals Queue (Approvers Only)
/clubs               → Club Directory + Create Club Form
/notifications       → Notification Center
```

### Total Screens: 9

---

## 2. SCREEN-BY-SCREEN BREAKDOWN

---

### 2.1 LOGIN PAGE (`/login`)

**Purpose:** Authenticate existing users

**Layout:** Centered card on gradient background

**Data Points:**
- Email input
- Password input

**Interactive Elements:**
- Email text input (required)
- Password text input (required)
- "Sign In" primary button (full-width)
- Link to /signup ("Don't have an account? Sign up")
- Toast notifications for errors

**Styling:**
- `.auth-page` - Full-height centered layout with subtle gradient background
- `.auth-card` - White/dark card with logo, form, and footer
- Indigo gradient on "DIGANTA" logo text

---

### 2.2 SIGNUP PAGE (`/signup`)

**Purpose:** Register new users with role selection

**Layout:** Centered card, same as login

**Data Points:**
- Full Name
- Email
- Password (min 6 chars)
- Role (dropdown with 10 options)
- Department (optional)

**Interactive Elements:**
- Name text input
- Email text input
- Password text input
- Role dropdown (10 roles: student, club_head, faculty_coordinator, dean, principal, admin, transport, security, resource, finance)
- Department text input
- "Create Account" primary button
- Link to /login

**Form Layout:** 2-column row for Role | Department

---

### 2.3 DASHBOARD (`/dashboard`) — Mission Control

**Purpose:** Central overview of system status, pending actions, and quick navigation

**Layout:**
- 4-column stats grid at top
- 2-column layout below (Pending Approvals + Recent Events OR Tasks)

**Data Points Displayed:**

| Metric | Icon | Color |
|--------|------|-------|
| Total Events | Calendar | Primary (Indigo) |
| Approved Events | CheckCircle | Success (Green) |
| Pending Approval | Clock | Warning (Amber) |
| Rejected Events | XCircle | Danger (Red) |

**Dynamic Sections (Role-Based):**

1. **Pending Approvals** (Approvers only: FC, Dean, Principal, Admin)
   - Event title
   - Creator name
   - Club name
   - Budget amount (₹ formatted)
   - Status badge
   - Click → navigates to /events/[id]

2. **Department Alerts** (Dept roles only: Transport, Security, Resource, Finance)
   - Event title
   - Alert message
   - Click → navigates to /events/[id]

3. **Recent Events** (All users)
   - Event title
   - Status badge
   - Creator name
   - Club name
   - Event date
   - Click → navigates to /events/[id]

4. **My Tasks** (If user has assigned tasks)
   - Task title
   - Event title
   - Deadline
   - Status badge (delayed = red, pending = amber)

**Interactive Elements:**
- "View All" button → /events
- Notification bell button with unread count → /notifications
- Event cards clickable

---

### 2.4 EVENTS LIST (`/events`)

**Purpose:** Browse, filter, and access all events

**Layout:**
- Page header with title + "Create Event" button
- Filter bar (2 dropdowns)
- Responsive card grid (auto-fill, min 340px)

**Data Points per Event Card:**
- Title
- Status badge (Draft, Awaiting Faculty, Approved, etc.)
- "STANDARD" badge (if standard event)
- Description (2-line clamp)
- Creator name
- Club name
- Budget (₹ formatted)
- Event date
- Review count
- Task count
- Participating clubs count (standard events only)

**Interactive Elements:**
- Status filter dropdown:
  - All Status
  - Draft
  - Awaiting Faculty
  - Awaiting Dean
  - Approved
  - Rejected
  - In Progress
  - Completed
- Event Type filter dropdown:
  - All Types
  - Club Events
  - Standard Events
- "Create Event" button (roles: student, club_head, dean, admin)
- Event cards clickable → /events/[id]

**Empty State:**
- Calendar icon
- "No events found"
- "Try adjusting your filters or create a new event"

---

### 2.5 CREATE EVENT (`/events/new`)

**Purpose:** Submit new event proposal for approval

**Layout:**
- Back button
- Page header
- 3 card sections (Basic Info, Proposal Details, Addons)
- Budget warning alert (conditional)
- Submit button

**Form Fields:**

**Section 1: Basic Information**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Event Category | Toggle (Club/Standard) | Dean/Admin only | Standard = auto-approved |
| Event Title | Text | Yes | |
| Description | Textarea | Yes | |
| Event Type | Dropdown | Yes | tech, cultural, sports, workshop, seminar |
| Club | Dropdown | Yes (club events) | Fetched from /api/clubs |

**Section 2: Proposal Details**
| Field | Type | Required |
|-------|------|----------|
| Objectives | Textarea | No |
| Target Audience | Text | No |
| Expected Attendance | Number | No |
| Venue | Text | No |
| Budget Estimate (₹) | Number | No |
| Event Start Date | DateTime | No |
| Event End Date | DateTime | No |

**Section 3: Addons (Execution Requirements)**
| Field | Type | Conditional |
|-------|------|-------------|
| Needs Transport | Checkbox | Shows text input when checked |
| Transport Notes | Text | Only if Needs Transport |
| Needs Security | Checkbox | Shows text input when checked |
| Security Notes | Text | Only if Needs Security |
| Needs Resources | Checkbox | Shows text input when checked |
| Resource Notes | Text | Only if Needs Resources |

**Conditional UI:**
- Budget > ₹50,000 shows warning: "This event will require Principal & Administrator approval"

**Interactive Elements:**
- Back button
- Event Category toggle (Dean/Admin only)
- All form inputs
- "Create Event" submit button

---

### 2.6 EVENT DETAIL (`/events/[id]`)

**Purpose:** Single source of truth for one event - view, approve, manage tasks/budget

**Layout:**
- Back button
- Event header (title, status, type badges)
- "Submit for Approval" button (creator only, DRAFT status)
- 4-tab navigation: Overview | Approvals | Budget | Tasks
- Tab content area

**Tab 1: Overview**

*Left Column (2/3 width):*
- Description card (title, full description, objectives)
- Execution Requirements card (Transport, Security, Resources with notes)

*Right Column (1/3 width):*
- Details card:
  - Created by
  - Club
  - Budget
  - Venue
  - Date
  - Target Audience
  - Expected Attendance
- Participating Clubs card (standard events only)

**Tab 2: Approvals**

*Approval Actions Panel (if current user can approve):*
- Comment textarea
- Department notification checkboxes (Dean only):
  - Transport
  - Security
  - Resources
  - Finance
- Approve button (green)
- Reject button (red)

*Approval Timeline:*
- Vertical timeline with dots (green=approved, red=rejected, amber=pending)
- Each entry shows:
  - User name
  - Stage (faculty_coordinator, dean, principal, admin)
  - Action (approved/rejected)
  - Timestamp
  - Comment (if any)

**Tab 3: Budget**

*Stats Grid (4 cards):*
| Metric | Color |
|--------|-------|
| Estimated | Info (Blue) |
| Allocated | Success (Green) |
| Spent | Danger (Red) |
| Remaining | Warning (Amber) |

*Expenses Section:*
- "Add Expense" button
- Inline form (amount, category, description)
- Expenses table:
  - Description
  - Category (badge)
  - Amount
  - Added By
  - Date

**Tab 4: Tasks**

*Add Task:*
- "Add Task" button
- Inline form (title, priority dropdown, deadline)

*Task List:*
- Task title
- Assignee name (or "Unassigned")
- Deadline
- Priority badge (urgent=red, high=amber, low/medium=gray)
- Status badge (completed=green, delayed=red, pending=amber)

**Interactive Elements:**
- Back button
- Submit for Approval button
- Tab buttons
- Approve/Reject buttons
- Add Task button + form
- Add Expense button + form
- Department notification checkboxes

---

### 2.7 APPROVALS (`/approvals`)

**Purpose:** Queue of events awaiting the current user's approval

**Layout:**
- Page header with count
- Event card grid

**Data Points per Card:**
- Event title
- Status badge
- Creator name
- Club name
- Budget (₹ formatted)
- Previous reviews section:
  - Reviewer name
  - Stage
  - Action (approved/rejected)
  - Emoji indicator (✅/❌)

**Interactive Elements:**
- Event cards clickable → /events/[id]

**Access Control:** Only visible to: faculty_coordinator, dean, principal, admin

**Empty State:**
- ClipboardCheck icon
- "All caught up!"
- "No events require your approval right now"

---

### 2.8 CLUBS (`/clubs`)

**Purpose:** View all clubs, create new clubs with head & FC assignment

**Layout:**
- Page header with count + "New Club" button
- Create Club form (collapsible)
- Club card grid

**Data Points per Club Card:**
- Initial letter avatar (gradient background)
- Club name
- Type badge (Departmental=blue, Non-Departmental=green)
- Department (if departmental)
- Description
- Club Head name
- Faculty Coordinator name
- Member count
- Event count

**Create Club Form Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Club Type | Toggle (Departmental/Non-Departmental) | Yes | |
| Club Name | Text | Yes | |
| Department | Text | Yes (if Departmental) | |
| Description | Textarea | No | |
| Club Head | Dropdown | Yes | Fetches students from /api/users/students |
| Faculty Coordinator | Dropdown | Yes | Fetches FCs from /api/users/faculty-coordinators |

**Interactive Elements:**
- "New Club" button (roles: admin, dean, faculty_coordinator)
- Club Type toggle
- All form inputs
- "Create Club" submit button
- "Cancel" button

---

### 2.9 NOTIFICATIONS (`/notifications`)

**Purpose:** View and manage all notifications

**Layout:**
- Page header with unread count + "Mark all read" button
- Vertical notification list

**Data Points per Notification:**
- Type icon (emoji):
  - approval_required: 📋
  - event_approved: ✅
  - event_rejected: ❌
  - task_assigned: 📌
  - dept_alert: 🚨
  - general: 📢
- Title
- Message
- Related event title
- Timestamp (formatted)
- Read/unread state (border color + opacity)

**Interactive Elements:**
- "Mark all read" button
- Individual notifications clickable:
  - Marks as read
  - Navigates to related event (if any)

**Empty State:**
- Bell icon
- "No notifications"

---

## 3. CORE DATA MODELS

### 3.1 User
```
id              String     Primary key (CUID)
name            String     Full name
email           String     Unique, login identifier
passwordHash    String     bcrypt hash
role            String     One of: student, club_head, faculty_coordinator,
                           dean, principal, admin, transport, security,
                           resource, finance
department      String?    Optional department name
phone           String?    Optional phone number
avatarUrl       String?    Optional profile image
isActive        Boolean    Default true
createdAt       DateTime
updatedAt       DateTime
```

### 3.2 Club
```
id                     String     Primary key (CUID)
name                   String     Unique club name
description            String?    Optional description
department             String?    Required for departmental clubs
logoUrl                String?    Optional logo
type                   String     "departmental" | "non_departmental"
isActive               Boolean    Default true
facultyCoordinatorId   String?    FK to User (assigned FC)
createdAt              DateTime
updatedAt              DateTime

Relations:
- facultyCoordinator   User       The assigned FC
- members              ClubMember[] All memberships
- events               Event[]    Events created by this club
```

### 3.3 ClubMember
```
id        String     Primary key (CUID)
userId    String     FK to User
clubId    String     FK to Club
role      String     "member" | "head" | "coordinator"
joinedAt  DateTime
```

### 3.4 Event (Core Entity)
```
id                 String     Primary key (CUID)
title              String     Event title
description        String     Full description
type               String     tech | cultural | sports | workshop | seminar | standard
eventType          String     "club" | "standard" (dean-created)
status             String     DRAFT | WAITING_FOR_FACULTY | WAITING_FOR_DEAN |
                              WAITING_FOR_PRINCIPAL | WAITING_FOR_ADMIN |
                              APPROVED | REJECTED | IN_PROGRESS | COMPLETED | ARCHIVED

# Proposal Fields
objectives         String?    Event objectives
targetAudience     String?    Who is this for
expectedAttendance Int?       Expected number of attendees
venue              String?    Event location
eventDate          DateTime?  Start date/time
eventEndDate       DateTime?  End date/time
budgetEstimate     Float      Estimated budget (default 0)

# Execution Addons
needsTransport     Boolean    Default false
needsSecurity      Boolean    Default false
needsResources     Boolean    Default false
transportNotes     String?    Details for transport dept
securityNotes      String?    Details for security dept
resourceNotes      String?    Details for resource dept

# Ownership
createdById        String     FK to User (creator)
clubId             String?    FK to Club (null for standard events)
createdAt          DateTime
updatedAt          DateTime

Relations:
- createdBy        User       Event creator
- club             Club?      Owning club
- approvalLogs     ApprovalLog[]
- budget           Budget?
- expenses         Expense[]
- tasks            Task[]
- participants     EventParticipant[] (standard events)
- notifications    Notification[]
```

### 3.5 ApprovalLog (Immutable Event-Sourcing)
```
id        String     Primary key (CUID)
eventId   String     FK to Event
userId    String     FK to User (approver)
role      String     Role at time of action (frozen)
action    String     "approved" | "rejected" | "revision_requested"
comment   String?    Optional feedback
stage     String     "faculty_coordinator" | "dean" | "principal" | "admin"
createdAt DateTime
```

### 3.6 Budget
```
id             String     Primary key (CUID)
eventId        String     FK to Event (unique)
totalAllocated Float      Total allocated budget
createdAt      DateTime
updatedAt      DateTime
```

### 3.7 Expense
```
id          String     Primary key (CUID)
eventId     String     FK to Event
amount      Float      Expense amount
description String     What was purchased
category    String     venue | catering | equipment | printing |
                       transport | security | other
proofUrl    String?    Bill/receipt upload path
addedById   String     FK to User
createdAt   DateTime
```

### 3.8 Task
```
id          String     Primary key (CUID)
eventId     String     FK to Event
title       String     Task title
description String?    Optional details
status      String     "pending" | "in_progress" | "completed" | "delayed"
priority    String     "low" | "medium" | "high" | "urgent"
deadline    DateTime?  Optional due date
assigneeId  String?    FK to User (optional)
createdById String     FK to User
completedAt DateTime?  When marked complete
createdAt   DateTime
updatedAt   DateTime
```

### 3.9 Notification
```
id        String     Primary key (CUID)
userId    String     FK to User (recipient)
eventId   String?    FK to Event (optional)
type      String     approval_required | event_approved | event_rejected |
                     task_assigned | dept_alert | general
title     String     Notification title
message   String     Full message
isRead    Boolean    Default false
createdAt DateTime
```

### 3.10 EventParticipant (Clubs joining Standard Events)
```
id       String     Primary key (CUID)
eventId  String     FK to Event
clubId   String     FK to Club
status   String     "joined" | "left"
joinedAt DateTime
```

### 3.11 DeptNotification
```
id             String     Primary key (CUID)
eventId        String     FK to Event
departmentRole String     transport | security | resource | finance
message        String?    Optional message
isAcknowledged Boolean    Default false
createdAt      DateTime
```

---

## 4. CURRENT TECH STACK & STYLING

### Framework
- **Next.js 16.2.1** (App Router)
- **React 19**
- **PostgreSQL** with **Prisma ORM v7.5.0**

### Styling Approach
- **Pure CSS** (no Tailwind, no component library)
- **CSS Custom Properties** (design tokens)
- Single `globals.css` file (~985 lines)

### Design System Tokens

#### Color Palette
```css
/* Backgrounds */
--bg-primary: #0a0e1a;        /* Deep navy - page background */
--bg-secondary: #111827;      /* Sidebar, header */
--bg-surface: #1a1f35;        /* Cards */
--bg-surface-hover: #222842;  /* Card hover */
--bg-elevated: #252b45;       /* Approval actions, elevated UI */

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.06);
--border-default: rgba(255, 255, 255, 0.1);
--border-focus: #6366f1;

/* Text */
--text-primary: #f1f5f9;      /* Headings, primary content */
--text-secondary: #94a3b8;    /* Body text */
--text-muted: #64748b;        /* Timestamps, labels */
--text-inverse: #0f172a;      /* Text on light backgrounds */

/* Accent - Primary (Indigo) */
--accent-primary: #6366f1;
--accent-primary-hover: #818cf8;
--accent-primary-glow: rgba(99, 102, 241, 0.2);

/* Semantic Colors */
--accent-success: #22c55e;    /* Approved, Complete */
--accent-success-bg: rgba(34, 197, 94, 0.1);
--accent-warning: #f59e0b;    /* Pending */
--accent-warning-bg: rgba(245, 158, 11, 0.1);
--accent-danger: #ef4444;     /* Rejected, Error */
--accent-danger-bg: rgba(239, 68, 68, 0.1);
--accent-info: #3b82f6;       /* In Progress */
--accent-info-bg: rgba(59, 130, 246, 0.1);

/* Status-Specific */
--status-draft: #64748b;
--status-pending: #f59e0b;
--status-approved: #22c55e;
--status-rejected: #ef4444;
--status-progress: #3b82f6;
```

#### Typography
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Type Scale */
--text-xs: 0.75rem;    /* 12px - captions, labels */
--text-sm: 0.875rem;   /* 14px - body text */
--text-base: 1rem;     /* 16px - default */
--text-lg: 1.125rem;   /* 18px - card titles */
--text-xl: 1.25rem;    /* 20px - section headers */
--text-2xl: 1.5rem;    /* 24px - page titles */
--text-3xl: 1.875rem;  /* 30px - auth logo */
--text-4xl: 2.25rem;   /* 36px */
```

#### Spacing
```css
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
```

#### Shadows & Radii
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.4);
--shadow-glow: 0 0 20px var(--accent-primary-glow);

--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
--radius-xl: 20px;
--radius-full: 9999px;
```

#### Layout Constants
```css
--sidebar-width: 260px;
--header-height: 64px;
```

### Components Available

| Component | CSS Class | Description |
|-----------|-----------|-------------|
| Card | `.card` | Surface container with border, padding, hover effect |
| Stat Card | `.stat-card` | Metric display with icon and value |
| Button | `.btn`, `.btn-primary`, `.btn-success`, `.btn-danger`, `.btn-outline`, `.btn-ghost` | Button variants |
| Button Sizes | `.btn-sm`, `.btn-lg` | Size modifiers |
| Form Input | `.form-input` | Text input styling |
| Form Select | `.form-select` | Dropdown styling |
| Form Textarea | `.form-textarea` | Multiline input |
| Form Label | `.form-label` | Input labels |
| Form Group | `.form-group` | Input container with spacing |
| Form Row | `.form-row` | 2-column grid for forms |
| Badge | `.badge`, `.badge-draft`, `.badge-pending`, `.badge-approved`, `.badge-rejected`, `.badge-progress` | Status tags |
| Table | `.table-wrap`, `table`, `th`, `td` | Data tables |
| Timeline | `.timeline`, `.timeline-item`, `.timeline-dot` | Approval history |
| Tabs | `.tabs`, `.tab`, `.tab.active` | Tab navigation |
| Empty State | `.empty-state` | Empty list placeholder |
| Event Card | `.event-card` | Event list item |
| Toast | `.toast`, `.toast-success`, `.toast-error`, `.toast-info` | Notifications |
| Modal | `.modal-overlay`, `.modal` | Modal dialogs |
| Spinner | `.spinner` | Loading indicator |
| Sidebar | `.sidebar`, `.nav-link`, `.nav-badge` | Navigation |
| Header | `.header` | Top bar |
| Auth Card | `.auth-card`, `.auth-page`, `.auth-logo` | Login/signup styling |

---

## 5. KEY USER FLOWS

### 5.1 User Registration & Login

```
1. User visits /signup
2. Fills form: Name, Email, Password, Role, Department
3. Clicks "Create Account"
4. API creates user, returns JWT token
5. Token stored in localStorage
6. Redirect to /dashboard
```

### 5.2 Create a Club Event

```
1. Club Head/Student navigates to /events/new
2. Fills Basic Information:
   - Title, Description, Type (tech/cultural/etc)
   - Selects their Club from dropdown
3. Fills Proposal Details:
   - Objectives, Audience, Attendance, Venue, Budget, Dates
4. Checks Addons if needed:
   - Transport/Security/Resources with notes
5. Sees budget warning if > ₹50,000
6. Clicks "Create Event"
7. Event created in DRAFT status
8. Redirected to /events/[id]
9. Clicks "Submit for Approval"
10. Status changes to WAITING_FOR_FACULTY
11. Assigned Faculty Coordinator receives notification
```

### 5.3 Approval Workflow (Multi-Stage)

```
Stage 1: Faculty Coordinator
1. FC sees event in /approvals (filtered to their clubs only)
2. Clicks event card → /events/[id]
3. Reviews Overview tab (description, requirements)
4. Goes to Approvals tab
5. Adds comment (optional)
6. Clicks "Approve" or "Reject"
   - If Approved → Status: WAITING_FOR_DEAN
   - If Rejected → Status: REJECTED, creator notified

Stage 2: Dean
1. Dean sees event in /approvals
2. Reviews event details + FC comments
3. Optionally selects department notifications (Transport, Security, etc.)
4. Approves → Status: WAITING_FOR_PRINCIPAL (if budget > ₹50K)
              OR APPROVED (if budget <= ₹50K)

Stage 3 & 4: Principal → Admin (Budget > ₹50,000 only)
1. Same review and approve/reject flow
2. Final approval → Status: APPROVED
3. All stakeholders notified
```

### 5.4 Create a Standard Event (Dean/Admin)

```
1. Dean/Admin visits /events/new
2. Selects "Standard Event" toggle
3. Fills event details (no club selection)
4. Creates event → Status: APPROVED (auto-approved)
5. All clubs can view and join the event
6. Clubs use "Join Event" on event detail page
```

### 5.5 Managing Event Budget & Expenses

```
1. Event creator/organizer goes to /events/[id]
2. Clicks "Budget" tab
3. Views 4 stat cards: Estimated | Allocated | Spent | Remaining
4. Clicks "Add Expense"
5. Fills inline form: Amount, Category (venue/catering/etc), Description
6. Clicks "Save Expense"
7. Expense added to table, "Spent" and "Remaining" update
```

### 5.6 Task Management

```
1. Go to /events/[id] → Tasks tab
2. Click "Add Task"
3. Fill form: Title, Priority (low/medium/high/urgent), Deadline
4. Task created with status "pending"
5. Tasks displayed with priority and status badges
6. Dashboard shows "My Tasks" for assigned tasks
```

### 5.7 Club Creation

```
1. Admin/Dean/FC goes to /clubs
2. Clicks "New Club"
3. Selects Club Type (Departmental/Non-Departmental)
4. Fills: Name, Department (if departmental), Description
5. Selects Club Head from student dropdown
6. Selects Faculty Coordinator from FC dropdown
7. Clicks "Create Club"
8. Club appears in grid with head and FC assigned
```

### 5.8 Notification Handling

```
1. User sees badge count in sidebar (Notifications link)
2. Clicks → /notifications
3. Views list sorted by date (newest first)
4. Unread notifications have highlighted border
5. Clicks notification:
   - Marked as read
   - Navigates to related event (if any)
6. Can click "Mark all read" to clear all
```

---

## 6. ROLE-BASED ACCESS MATRIX

| Feature | Student | Club Head | FC | Dean | Principal | Admin | Transport | Security | Resource | Finance |
|---------|---------|-----------|-----|------|-----------|-------|-----------|----------|----------|---------|
| View Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Events | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Club Event | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Create Standard Event | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| View Approvals Page | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Approve Events | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Create Club | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| View Dept Alerts | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Notify Departments | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## 7. ICONS USED (Lucide React)

```
LayoutDashboard  - Dashboard nav
Calendar         - Events nav, event cards
CalendarPlus     - Create Event nav
ClipboardCheck   - Approvals nav, empty state
Bell             - Notifications nav
Users            - Clubs nav
LogOut           - Logout button
Menu / X         - Mobile menu toggle
ArrowLeft        - Back buttons
Send             - Submit for Approval
CheckCircle      - Approve button, approved stats
XCircle          - Reject button, rejected stats
Clock            - Pending stats, timeline
DollarSign       - Budget stats
ListTodo         - Tasks
Plus             - Add buttons
MessageSquare    - Comments
Filter           - Filter icon
Building2        - Departmental club icon
GraduationCap    - Non-departmental club icon
AlertTriangle    - Pending approvals warning
CheckCheck       - Mark all read
```

---

## 8. RESPONSIVE BREAKPOINTS

```css
/* Mobile: < 768px */
- Sidebar hidden (hamburger menu)
- Single column layouts
- Form rows stack vertically
- Reduced padding (--space-4)

/* Desktop: >= 768px */
- Fixed sidebar (260px)
- Multi-column grids
- Full padding (--space-8)
```

---

## 9. EMPTY STATES

| Screen | Icon | Title | Description |
|--------|------|-------|-------------|
| Events (filtered) | Calendar | "No events found" | "Try adjusting your filters or create a new event" |
| Dashboard (no events) | Calendar | "No events yet" | "Get started by creating your first event" |
| Approvals | ClipboardCheck | "All caught up!" | "No events require your approval right now" |
| Notifications | Bell | "No notifications" | — |
| Clubs | Users | "No clubs yet" | "Create the first club to get started" |
| Tasks | ListTodo | "No tasks yet" | "Add tasks to track event execution" |
| Approval Timeline | Clock | "No approval actions yet" | — |
| Expenses | — | "No expenses recorded" | (plain text) |

---

## 10. TOAST NOTIFICATIONS

| Scenario | Type | Message |
|----------|------|---------|
| Event created | success | "Event created!" |
| Event submitted | success | "Event submitted for approval!" |
| Event approved | success | "Event approved!" |
| Event rejected | info | "Event rejected!" |
| Club created | success | "Club created successfully!" |
| Task created | success | "Task created!" |
| Expense added | success | "Expense added!" |
| Club joined | success | "Club joined the event!" |
| Account created | success | "Account created!" |
| Validation error | error | Dynamic error message |
| Network error | error | "Network error" |
| Missing comment on reject | error | "Comment required when rejecting" |

---

## 11. DESIGN PRINCIPLES SUMMARY

1. **Dark Mode First** - Premium, professional aesthetic
2. **Information Density** - Show more, scroll less
3. **Status Clarity** - Color-coded badges everywhere
4. **Role-Based UI** - Features appear/hide based on permissions
5. **Progressive Disclosure** - Forms expand (addons), tabs organize content
6. **Immediate Feedback** - Toast notifications, loading spinners
7. **Consistent Navigation** - Fixed sidebar with badge counts
8. **Mobile Responsive** - Collapsible sidebar, stacked layouts

---

*This brief provides complete context for an AI design agent to generate accurate, production-ready screen layouts for Diganta.*
