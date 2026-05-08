# Diganta — College Event Management System

**Diganta** is a production-grade, scalable college event management system with a comprehensive approval workflow engine, role-based access control, and premium mission control UI.

## ✨ Key Features

- **🔄 Complete Event Lifecycle:** Draft → Faculty → Dean → Principal → Admin → Approved
- **📋 Event Sourcing Approval Engine:** Immutable audit trail with conditional routing
- **👥 10+ Role-Based Access Control:** Students, Club Heads, Faculty, Dean, Principal, Admin, Departments
- **💰 Budget-Based Escalation:** Events >₹50K require Principal + Admin approval
- **🎪 Festival Management:** Standard events work like festivals with Dean-controlled sub-event approval
- **📊 Real-Time Dashboard:** Role-aware analytics and mission control interface
- **📱 Premium UI:** Dark mode with accessible design and responsive layout

## 🏗️ Architecture

### Approval Chain
```
Club Event → Faculty Coordinator → Dean → Principal* → Admin* → Approved
                                    (*if budget > ₹50,000)

Standard Event (Dean-created) → Auto-approved → Clubs can join
```

### Role Hierarchy
- **Students/Club Heads:** Create events, manage assigned clubs
- **Faculty Coordinators:** Approve club events, coordinate assigned clubs
- **Dean:** Approve after faculty, create standard events
- **Principal/Admin:** Final approval for high-budget events
- **Department Roles:** Notified after approval for execution

## 🛠️ Tech Stack

- **Framework:** Next.js 16.2.1 with App Router and React 19
- **Database:** PostgreSQL with Prisma ORM and pg adapter
- **Authentication:** JWT with 7-day tokens and secure session management
- **UI:** Custom CSS design system with Inter font and Lucide icons
- **Architecture:** Event-sourcing approval logs, RBAC, and modular API design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database running locally or remotely

### Setup Instructions

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd mvptrail
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database credentials
   ```

3. **Database Setup**
   ```bash
   # One command to setup everything
   npm run db:setup
   ```

4. **Start Development**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

### 🔑 Default Login Credentials
After seeding, use these accounts to explore different roles:
- **Admin:** admin@college.edu / password123
- **Dean:** dean@college.edu / password123
- **Club Head:** student1@college.edu / password123
- **Student:** student2@college.edu / password123

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:setup` | Complete database setup (generate + push + seed) |
| `npm run db:seed` | Seed with sample data |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Reset and reseed database |

## 📂 Project Structure

```
src/
├── app/
│   ├── (app)/              # Protected pages with auth layout
│   │   ├── dashboard/      # Role-aware dashboard
│   │   ├── events/         # Event management and creation
│   │   ├── clubs/          # Club administration
│   │   └── notifications/  # Notification center
│   ├── api/                # REST API endpoints
│   │   ├── auth/           # Login, signup, me
│   │   ├── events/         # Event CRUD and approval
│   │   ├── clubs/          # Club management
│   │   └── users/          # User management
│   ├── login/              # Authentication pages
│   └── globals.css         # Premium design system
├── components/             # Reusable UI components
├── context/               # React Context providers
├── lib/                   # Core utilities and configurations
└── prisma/               # Database schema and seeding
```

## 🎯 Usage Examples

### Creating an Event (Club Head)
1. Login as club head → Dashboard → Create Event
2. Fill proposal details, budget, venue, dates
3. Submit for approval → Goes to Faculty Coordinator
4. Track approval status in real-time

### Approving Events (Faculty/Dean)
1. Dashboard shows pending approvals for your role
2. Review event details, budget, requirements
3. Approve/Reject with comments
4. System automatically routes to next approver

### Managing Standard Events (Dean)
1. Create standard events → Auto-approved
2. All clubs can join standard events
3. Track participation and resource requests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
