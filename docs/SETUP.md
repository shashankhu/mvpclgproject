# 🚀 Diganta Development Setup

## Quick Start Guide

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Update .env.local with your PostgreSQL credentials:
# DATABASE_URL="postgresql://username:password@localhost:5432/diganta_mvp"
```

### 2. Database Setup
```bash
# Install dependencies
npm install

# Setup database (generate client + push schema + seed data)
npm run db:setup
```

### 3. Start Development
```bash
# Start the development server
npm run dev

# App will be available at http://localhost:3000
```

## Default Login Credentials
- **Admin**: admin@college.edu / password123
- **Dean**: dean@college.edu / password123
- **Club Head**: student1@college.edu / password123
- **Student**: student2@college.edu / password123

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build production app |
| `npm run db:setup` | Setup database (one command) |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create and apply migrations |
| `npm run db:seed` | Seed database with test data |
| `npm run db:reset` | Reset database and reseed |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |

## Database Requirements
- PostgreSQL 12+ running locally or remotely
- Database named `diganta_mvp` (will be created automatically)

## Project Structure
```
src/
├── app/
│   ├── (app)/          # Protected pages (dashboard, events, clubs)
│   ├── api/            # API routes (REST endpoints)
│   ├── login/          # Authentication pages
│   └── globals.css     # Premium UI styles
├── components/         # Reusable UI components
├── context/           # React context providers
└── lib/               # Utilities and configurations

prisma/
├── schema.prisma      # Database schema
└── seed.js           # Initial data seeding
```

## Tech Stack
- **Frontend**: Next.js 16.2.1, React 19, Premium CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with pg adapter
- **Authentication**: JWT with role-based access control
- **UI**: Mission Control aesthetic with Lucide icons