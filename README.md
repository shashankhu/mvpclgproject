# Diganta — College Event Management System

**Diganta** is a production-grade, scalable college event management system built from scratch. It features a robust, event-driven approval engine, conditional routing, and a comprehensive role-based dashboard.

## 🚀 Key Features

- **Lifecycle Engine:** Idea → Proposal → Multi-layer Approval → Execution → Completion.
- **Approval Engine:** Immutable log-based tracking with conditional routing (Budget-based escalation).
- **Role-Based Access (RBAC):** 10+ distinct roles including Club Head, Dean, Principal, and Admin.
- **Execution Addons:** Integrated support for Transport, Security, and Resource management.
- **Budget & Tasks:** Built-in financial tracking and task assignment for event teams.
- **Premium UI:** High-performance dark-mode aesthetic with glassmorphism and real-time notifications.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL (via Prisma ORM)
- **Styling:** Vanilla CSS (Custom Design System)
- **Auth:** JWT-based secure authentication

## 🚦 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shashankhu/mvpclaude.git
   cd mvpclaude
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment:
   Create a `.env` file with:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/diganta"
   JWT_SECRET="your_secret_key"
   ```

4. Database Setup:
   ```bash
   npx prisma db push
   ```

5. Run Development Server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to explore Diganta.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
