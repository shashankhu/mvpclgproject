# Diganta Design System
## Execution OS for Students — Mission Control UI

---

## Design Philosophy

> "From Chaos to Clarity"

Diganta transforms chaotic student activities into structured execution systems. The UI must feel like a **command center** — calm, powerful, and information-dense without being overwhelming.

### Core Principles

1. **Clarity Over Decoration** — Every element serves a purpose
2. **Information Density Done Right** — Show more, scroll less
3. **Accountability is Visual** — Owners, statuses, deadlines are always visible
4. **Progressive Disclosure** — Complexity reveals itself when needed
5. **Calm Confidence** — Professional, not playful

---

## Color System

### Primary Palette

```css
/* Core Brand */
--primary-600: #4F46E5;      /* Indigo — Primary actions, links */
--primary-700: #4338CA;      /* Indigo dark — Hover states */
--primary-50: #EEF2FF;       /* Indigo tint — Backgrounds */

/* Neutrals — The backbone */
--gray-900: #111827;         /* Primary text */
--gray-700: #374151;         /* Secondary text */
--gray-500: #6B7280;         /* Muted text, placeholders */
--gray-300: #D1D5DB;         /* Borders */
--gray-100: #F3F4F6;         /* Subtle backgrounds */
--gray-50: #F9FAFB;          /* Page background */
--white: #FFFFFF;            /* Cards, modals */
```

### Status Colors

```css
/* Semantic — Status indicators */
--success-500: #10B981;      /* Approved, Complete */
--success-50: #ECFDF5;       /* Success background */

--warning-500: #F59E0B;      /* Pending, In Review */
--warning-50: #FFFBEB;       /* Warning background */

--error-500: #EF4444;        /* Rejected, Blocked, Overdue */
--error-50: #FEF2F2;         /* Error background */

--info-500: #3B82F6;         /* In Progress, Active */
--info-50: #EFF6FF;          /* Info background */
```

### Dark Mode (Optional Enhancement)

```css
/* Dark theme overrides */
--bg-primary: #0F172A;       /* Slate 900 */
--bg-secondary: #1E293B;     /* Slate 800 */
--bg-card: #334155;          /* Slate 700 */
--text-primary: #F8FAFC;     /* Slate 50 */
--text-secondary: #94A3B8;   /* Slate 400 */
```

---

## Typography

### Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

| Name | Size | Weight | Line Height | Use Case |
|------|------|--------|-------------|----------|
| `display` | 30px | 700 | 1.2 | Page titles |
| `heading-1` | 24px | 600 | 1.3 | Section headers |
| `heading-2` | 20px | 600 | 1.4 | Card titles |
| `heading-3` | 16px | 600 | 1.5 | Subsections |
| `body` | 14px | 400 | 1.6 | Default text |
| `body-sm` | 13px | 400 | 1.5 | Secondary info |
| `caption` | 12px | 500 | 1.4 | Labels, tags |
| `overline` | 11px | 600 | 1.3 | Section labels (uppercase) |

### Typography Rules

- **Never use font-weight below 400** — Maintain readability
- **Headings use gray-900**, body uses gray-700
- **Muted text uses gray-500** — timestamps, secondary info
- **Links use primary-600** — underline on hover only

---

## Spacing System

Based on 4px grid:

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Application

- **Card padding**: 24px (space-6)
- **Section gaps**: 32px (space-8)
- **Element gaps within cards**: 16px (space-4)
- **Tight spacing** (labels, tags): 8px (space-2)

---

## Component Library

### 1. Status Tags

The most critical visual element — instant status recognition.

```
┌─────────────┐
│ ● Approved  │  → Green bg, green text, green dot
└─────────────┘

┌─────────────┐
│ ● Pending   │  → Amber bg, amber text, amber dot
└─────────────┘

┌─────────────┐
│ ● Rejected  │  → Red bg, red text, red dot
└─────────────┘

┌─────────────┐
│ ● In Review │  → Blue bg, blue text, blue dot
└─────────────┘

┌─────────────┐
│ ● Blocked   │  → Red bg, red text, red dot (pulsing)
└─────────────┘
```

**CSS Pattern:**
```css
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;  /* Pill shape */
  font-size: 12px;
  font-weight: 500;
}

.status-tag::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-approved {
  background: var(--success-50);
  color: var(--success-700);
}
```

---

### 2. Cards

The primary container for information groupings.

```
┌────────────────────────────────────────────────┐
│                                                │
│  OVERLINE LABEL                                │
│  Card Title                          [Action]  │
│                                                │
│  ─────────────────────────────────────────     │
│                                                │
│  Content area with consistent padding          │
│                                                │
└────────────────────────────────────────────────┘
```

**Specifications:**
- Background: white
- Border: 1px solid gray-200 (or none with shadow)
- Border radius: 12px
- Shadow: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
- Padding: 24px

---

### 3. Data Tables

For vendor lists, budget items, task lists.

```
┌──────────────────────────────────────────────────────────────┐
│ VENDOR NAME        │ CATEGORY    │ AMOUNT      │ STATUS     │
├──────────────────────────────────────────────────────────────┤
│ Sharma Caterers    │ Food        │ ₹45,000     │ ● Paid     │
│ PrintMax           │ Printing    │ ₹12,500     │ ● Pending  │
│ SoundWave Audio    │ Equipment   │ ₹28,000     │ ● Approved │
└──────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Header: gray-50 background, overline typography, gray-500 text
- Rows: white background, gray-100 on hover
- Row height: 52px minimum
- Cell padding: 16px horizontal
- Border: 1px solid gray-200 between rows

---

### 4. Progress Indicators

#### Linear Progress
```
Event Progress                              75%
[████████████████████████░░░░░░░░░░░░░░░░░]
```

#### Stage Pipeline (Approval Flow)
```
 ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
 │   FC    │───▶│  DEAN   │───▶│PRINCIPAL│───▶│  ADMIN  │
 │    ✓    │    │    ●    │    │    ○    │    │    ○    │
 └─────────┘    └─────────┘    └─────────┘    └─────────┘
   Complete      Current         Pending        Pending
```

- Completed: primary-600 fill, white checkmark
- Current: primary-600 ring, pulsing dot
- Pending: gray-300 ring, empty

---

### 5. Stat Cards (Dashboard)

```
┌─────────────────────┐
│  ↑ 12%              │
│  24                 │  ← Large number
│  Events This Month  │  ← Label
└─────────────────────┘
```

**Layout:**
- Trend indicator top-right (green up, red down)
- Large number: display typography
- Label: caption, gray-500

---

### 6. Navigation

#### Sidebar (Desktop)
```
┌──────────────────────┐
│  ◆ DIGANTA           │  ← Logo
│                      │
│  ▣ Dashboard         │  ← Active (primary bg)
│  ◎ Events            │
│  ✓ Approvals    (3)  │  ← Badge for pending
│  ☐ Tasks             │
│  $ Budget            │
│  ⚙ Settings          │
│                      │
│  ─────────────────   │
│                      │
│  👤 Rahul Singh      │
│     Faculty Coord    │
└──────────────────────┘
```

**Specifications:**
- Width: 260px (collapsible to 72px)
- Background: gray-900 (dark) or white
- Active item: primary-50 bg, primary-600 text, left border accent
- Icons: 20px, Lucide icon set

---

### 7. Buttons

#### Hierarchy
```
[▓▓▓▓▓▓▓▓▓▓▓]  Primary   → Indigo fill, white text
[░░░░░░░░░░░]  Secondary → White fill, gray border, gray text
[           ]  Ghost     → No fill, primary text
[!!! Danger ]  Danger    → Red fill for destructive actions
```

**Specifications:**
- Height: 40px (default), 36px (sm), 48px (lg)
- Padding: 16px horizontal
- Border radius: 8px
- Font: 14px, weight 500
- Transitions: 150ms ease

---

### 8. Form Elements

#### Input Fields
```
Label *
┌────────────────────────────────────┐
│ Placeholder text                   │
└────────────────────────────────────┘
Helper text or error message
```

**Specifications:**
- Height: 44px
- Border: 1px solid gray-300
- Focus: 2px primary-600 ring
- Error: red border, red helper text
- Border radius: 8px
- Padding: 12px 16px

---

## Screen Layouts

### 1. Dashboard — Mission Control

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR │                    MAIN CONTENT                               │
│         │ ┌─────────────────────────────────────────────────────────┐   │
│ ◆ DIGANTA│ │  Good morning, Rahul                                    │   │
│         │ │  Here's your mission status                             │   │
│ ▣ Dash  │ └─────────────────────────────────────────────────────────┘   │
│ ◎ Events│                                                               │
│ ✓ Approv│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│ ☐ Tasks │ │ 24         │ │ 8          │ │ 3          │ │ ₹4.2L      │   │
│ $ Budget│ │ Total      │ │ Active     │ │ Pending    │ │ Total      │   │
│ ⚙ Config│ │ Events     │ │ Events     │ │ Approvals  │ │ Budget     │   │
│         │ └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│         │                                                               │
│         │ ┌─────────────────────────────┐ ┌─────────────────────────┐   │
│         │ │ PENDING APPROVALS           │ │ UPCOMING DEADLINES      │   │
│         │ │                             │ │                         │   │
│         │ │ TechFest Budget Request     │ │ ⏰ Venue booking (2d)   │   │
│         │ │ Literary Club → ₹35,000     │ │ ⏰ Catering confirm (3d)│   │
│         │ │ [Review] [Approve] [Reject] │ │ ⏰ Poster design (5d)   │   │
│         │ │                             │ │                         │   │
│         │ │ Cultural Night Venue        │ │                         │   │
│         │ │ Music Club → Auditorium     │ │                         │   │
│         │ │ [Review] [Approve] [Reject] │ │                         │   │
│         │ └─────────────────────────────┘ └─────────────────────────┘   │
│         │                                                               │
│         │ ┌───────────────────────────────────────────────────────────┐ │
│         │ │ ACTIVE EVENTS                                             │ │
│         │ │                                                           │ │
│         │ │ ┌─────────────────────────────────────────────────────┐   │ │
│         │ │ │ TechFest 2026                          Mar 15-17    │   │ │
│         │ │ │ ████████████████████░░░░░░  68% complete            │   │ │
│         │ │ │ 12 tasks remaining • ● 2 blocked                    │   │ │
│         │ │ └─────────────────────────────────────────────────────┘   │ │
│         │ │                                                           │ │
│         │ │ ┌─────────────────────────────────────────────────────┐   │ │
│         │ │ │ Annual Sports Meet                     Apr 5-7      │   │ │
│         │ │ │ ██████░░░░░░░░░░░░░░░░░░░░  24% complete            │   │ │
│         │ │ │ 28 tasks remaining • ● Pending approval             │   │ │
│         │ │ └─────────────────────────────────────────────────────┘   │ │
│         │ └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Event Detail — Single Source of Truth

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Back to Events                                                        │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ TechFest 2026                                        ● In Progress  │ │
│ │ Tech Club • Mar 15-17, 2026                                         │ │
│ │                                                                     │ │
│ │ [Edit Event]  [Submit for Approval]  [Download Report]              │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [Overview] [Timeline] [Tasks] [Approvals] [Budget] [Vendors]        │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌───────────────────────────────────┐ ┌───────────────────────────────┐ │
│ │ APPROVAL STATUS                   │ │ BUDGET OVERVIEW               │ │
│ │                                   │ │                               │ │
│ │  ✓ FC  ───▶  ● Dean  ───▶  ○ Prin │ │ Allocated    ₹1,50,000       │ │
│ │                                   │ │ Spent        ₹85,400         │ │
│ │ Currently with: Dr. Sharma (Dean) │ │ Remaining    ₹64,600         │ │
│ │ Submitted: 2 days ago             │ │                               │ │
│ └───────────────────────────────────┘ │ [████████████░░░░░░] 57%      │ │
│                                       └───────────────────────────────┘ │
│                                                                         │
│ ┌───────────────────────────────────────────────────────────────────────┐
│ │ TASKS                                                    [+ Add Task] │
│ │                                                                       │
│ │ ☑ Venue booking confirmed                    Rahul    Mar 1   ● Done │
│ │ ☑ Speaker invitations sent                   Priya    Mar 3   ● Done │
│ │ ☐ Catering vendor finalized                  Amit     Mar 8   ● Open │
│ │ ☐ Stage design approval                      Sneha    Mar 10  ● Open │
│ │ ⚠ AV equipment testing                       Rahul    Mar 5   ●Overdue│
│ └───────────────────────────────────────────────────────────────────────┘
│                                                                         │
│ ┌───────────────────────────────────────────────────────────────────────┐
│ │ EVENT TIMELINE                                                        │
│ │                                                                       │
│ │  Feb 15        Mar 1         Mar 10        Mar 15-17                 │
│ │    │             │             │              │                      │
│ │    ●─────────────●─────────────●──────────────●                      │
│ │  Planning     Approvals     Execution      Event                     │
│ │   Done         Active        Pending       Pending                   │
│ └───────────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Approval Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Approvals                                          [●Pending] [All]     │
│                                                                         │
│ ┌───────────────────────────────────────────────────────────────────────┐
│ │ APPROVAL PIPELINE                                                     │
│ │                                                                       │
│ │  Submitted (4)  →  In Review (2)  →  Approved (12)  →  Rejected (1)  │
│ │      ████            ██                 ████████████        █        │
│ └───────────────────────────────────────────────────────────────────────┘
│                                                                         │
│ ┌───────────────────────────────────────────────────────────────────────┐
│ │ PENDING YOUR REVIEW                                                   │
│ │                                                                       │
│ │ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ │                                                                 │   │
│ │ │  TechFest 2026 Budget Request              ₹1,50,000           │   │
│ │ │  Tech Club • Submitted by Rahul Singh • 2 days ago             │   │
│ │ │                                                                 │   │
│ │ │  "Annual technical festival with workshops, hackathon,         │   │
│ │ │   and guest lectures from industry experts."                   │   │
│ │ │                                                                 │   │
│ │ │  Budget Breakdown:                                              │   │
│ │ │  • Venue & Logistics    ₹45,000                                │   │
│ │ │  • Speakers & Travel    ₹35,000                                │   │
│ │ │  • Prizes              ₹40,000                                 │   │
│ │ │  • Marketing           ₹30,000                                 │   │
│ │ │                                                                 │   │
│ │ │  ┌────────────────────────────────────────────────────────┐    │   │
│ │ │  │ Add comment (optional)                                  │    │   │
│ │ │  │                                                         │    │   │
│ │ │  └────────────────────────────────────────────────────────┘    │   │
│ │ │                                                                 │   │
│ │ │  [Request Changes]    [Reject]    [███ Approve ███]            │   │
│ │ │                                                                 │   │
│ │ └─────────────────────────────────────────────────────────────────┘   │
│ │                                                                       │
│ │ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ │  Cultural Night Venue Booking               Auditorium         │   │
│ │ │  Music Club • Submitted by Priya Patel • 5 hours ago           │   │
│ │ │  [View Details]                   [Reject]  [███ Approve ███]  │   │
│ │ └─────────────────────────────────────────────────────────────────┘   │
│ └───────────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 4. Task Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Tasks                                    [+ New Task]  [Filter ▼]       │
│                                                                         │
│ ┌───────────────────────────────────────────────────────────────────────┐
│ │ MY TASKS                                                      (8)    │
│ │                                                                       │
│ │ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ │ ⚠ OVERDUE                                                       │   │
│ │ │                                                                 │   │
│ │ │ ☐ Complete AV equipment testing                                 │   │
│ │ │   TechFest 2026 • Due Mar 5 (2 days overdue)                   │   │
│ │ │   [Mark Complete]                                               │   │
│ │ └─────────────────────────────────────────────────────────────────┘   │
│ │                                                                       │
│ │ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ │ 📅 TODAY                                                        │   │
│ │ │                                                                 │   │
│ │ │ ☐ Review catering proposals                                     │   │
│ │ │   TechFest 2026 • Due today                                    │   │
│ │ │                                                                 │   │
│ │ │ ☐ Send reminder to sponsors                                     │   │
│ │ │   TechFest 2026 • Due today                                    │   │
│ │ └─────────────────────────────────────────────────────────────────┘   │
│ │                                                                       │
│ │ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ │ 📆 UPCOMING                                                     │   │
│ │ │                                                                 │   │
│ │ │ ☐ Finalize event schedule           Due Mar 10                 │   │
│ │ │ ☐ Coordinate volunteer training     Due Mar 12                 │   │
│ │ │ ☐ Final walkthrough with venue      Due Mar 14                 │   │
│ │ └─────────────────────────────────────────────────────────────────┘   │
│ └───────────────────────────────────────────────────────────────────────┘
│                                                                         │
│ ┌───────────────────────────────────────────────────────────────────────┐
│ │ TEAM TASKS                                                            │
│ │                                                                       │
│ │ NAME             OPEN    OVERDUE    EVENT                            │
│ │ ───────────────────────────────────────────────────────────────────  │
│ │ Rahul Singh      3       1          TechFest 2026                    │
│ │ Priya Patel      5       0          Cultural Night                   │
│ │ Amit Kumar       2       0          TechFest 2026                    │
│ │ Sneha Reddy      4       2          Sports Meet                      │
│ └───────────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 5. Budget & Vendor Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Budget — TechFest 2026                              [Export] [+ Add]    │
│                                                                         │
│ ┌───────────────────────────────────────────────────────────────────────┐
│ │ BUDGET SUMMARY                                                        │
│ │                                                                       │
│ │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐              │
│ │  │ ₹1,50,000    │   │ ₹85,400      │   │ ₹64,600      │              │
│ │  │ Allocated    │   │ Spent        │   │ Remaining    │              │
│ │  └──────────────┘   └──────────────┘   └──────────────┘              │
│ │                                                                       │
│ │  [████████████████████████████░░░░░░░░░░░░░░░░░░░░] 57% utilized     │
│ └───────────────────────────────────────────────────────────────────────┘
│                                                                         │
│ ┌───────────────────────────────────────────────────────────────────────┐
│ │ SPENDING BY CATEGORY                                                  │
│ │                                                                       │
│ │ Venue & Logistics  [████████████████]  ₹45,000 (53%)                 │
│ │ Catering           [████████████]      ₹32,400 (38%)                 │
│ │ Marketing          [███]               ₹8,000  (9%)                  │
│ │ Equipment          [░░░░░░░░░░░░░░░░]  ₹0      (pending)             │
│ └───────────────────────────────────────────────────────────────────────┘
│                                                                         │
│ ┌───────────────────────────────────────────────────────────────────────┐
│ │ VENDORS                                                               │
│ │                                                                       │
│ │ VENDOR           │ CATEGORY     │ AMOUNT    │ STATUS    │ INVOICE   │
│ │ ──────────────────────────────────────────────────────────────────── │
│ │ Grand Hall       │ Venue        │ ₹45,000   │ ● Paid    │ INV-001   │
│ │ Sharma Caterers  │ Catering     │ ₹32,400   │ ● Partial │ INV-002   │
│ │ PrintMax         │ Marketing    │ ₹8,000    │ ● Pending │ —         │
│ │ SoundWave        │ Equipment    │ ₹28,000   │ ● Draft   │ —         │
│ │                                                                       │
│ │                              [Load More]                              │
│ └───────────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Interaction Patterns

### 1. Micro-interactions

- **Button hover**: Subtle scale (1.02) + shadow increase
- **Card hover**: Slight lift (translateY -2px) + shadow
- **Status tags**: No animation (clarity over decoration)
- **Progress bars**: Smooth transitions (300ms ease)
- **Checkboxes**: Satisfying checkmark animation on complete

### 2. Loading States

```
┌─────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Skeleton pulse
│ ░░░░░░░░░░░░░░░░░░░░░                  │
│ ░░░░░░░░░░░░░                          │
└─────────────────────────────────────────┘
```

- Use skeleton loaders, not spinners
- Match skeleton shapes to actual content
- Subtle pulse animation (opacity 0.5 → 1)

### 3. Empty States

```
┌─────────────────────────────────────────┐
│                                         │
│            ◎                            │
│      No pending approvals               │
│                                         │
│   You're all caught up! New requests    │
│   will appear here when submitted.      │
│                                         │
└─────────────────────────────────────────┘
```

- Simple illustration or icon
- Clear heading
- Helpful context text
- Optional CTA if applicable

### 4. Toast Notifications

```
┌─────────────────────────────────────────────┐
│ ✓  Event approved successfully              │  → Success (green left border)
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ⚠  Budget exceeds threshold. Needs review  │  → Warning (amber left border)
└─────────────────────────────────────────────┘
```

- Position: Top-right
- Duration: 4 seconds auto-dismiss
- Dismissible manually
- Stack vertically if multiple

---

## Responsive Behavior

### Breakpoints

```css
--bp-sm: 640px;   /* Mobile landscape */
--bp-md: 768px;   /* Tablet */
--bp-lg: 1024px;  /* Desktop */
--bp-xl: 1280px;  /* Large desktop */
```

### Layout Adjustments

| Breakpoint | Sidebar | Columns | Cards |
|------------|---------|---------|-------|
| Mobile (<768) | Hidden (hamburger) | 1 | Stacked |
| Tablet (768-1024) | Collapsed (icons) | 2 | Grid |
| Desktop (>1024) | Full | 3-4 | Grid |

---

## Accessibility

### Requirements

1. **Color contrast**: Minimum 4.5:1 for text
2. **Focus indicators**: Visible 2px rings on all interactive elements
3. **Keyboard navigation**: Full functionality without mouse
4. **Screen reader**: Semantic HTML, ARIA labels
5. **Motion**: Respect `prefers-reduced-motion`

### Focus States

```css
:focus-visible {
  outline: 2px solid var(--primary-600);
  outline-offset: 2px;
}
```

---

## Implementation Notes

### Tech Stack Alignment

This design system is built for:
- **Next.js 16+** with App Router
- **React 19** with Server Components
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Framer Motion** for animations (sparingly)

### File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── StatusTag.jsx
│   │   ├── DataTable.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── Input.jsx
│   │   └── ...
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── PageWrapper.jsx
│   └── dashboard/
│       ├── StatCard.jsx
│       ├── PendingApprovals.jsx
│       └── ActiveEvents.jsx
├── styles/
│   └── globals.css (Tailwind + CSS variables)
└── lib/
    └── cn.js (classname utility)
```

---

## Summary

Diganta's UI is a **Mission Control Center** — calm, powerful, and clarity-focused. Every pixel serves the user's need to feel in control of complex operations.

**Key Takeaways:**
1. Status is always visible (tags, progress, pipelines)
2. Information density without clutter
3. Accountability is built into every view (owners, deadlines)
4. Minimal decoration, maximum utility
5. Professional and calm, never playful

> "I can run this entire operation smoothly. I know exactly what is happening. I am in control."
