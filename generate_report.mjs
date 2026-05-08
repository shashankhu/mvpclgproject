import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const basePath = process.cwd();

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(basePath, filePath), 'utf8');
  } catch (e) {
    return `// File not found or error reading: ${filePath}\n// Error: ${e.message}`;
  }
}

function getProjectTree() {
  try {
    return execSync('git ls-files', { encoding: 'utf8' });
  } catch (e) {
    return `Error getting tree: ${e.message}`;
  }
}

const md = `
# Diganta Project Diagnostic Report

## 1. PROJECT STRUCTURE
\`\`\`text
${getProjectTree()}
\`\`\`

## 2. DEPENDENCIES
\`\`\`json
${readFile('package.json')}
\`\`\`

## 3. DATABASE SCHEMA
\`\`\`prisma
${readFile('prisma/schema.prisma')}
\`\`\`

## 4. ENVIRONMENT CONFIG
\`\`\`env
${readFile('.env.example')}
\`\`\`

## 5. AUTH IMPLEMENTATION

### src/lib/auth.js
\`\`\`javascript
${readFile('src/lib/auth.js')}
\`\`\`

### src/app/api/auth/login/route.js
\`\`\`javascript
${readFile('src/app/api/auth/login/route.js')}
\`\`\`

### src/app/api/auth/signup/route.js
\`\`\`javascript
${readFile('src/app/api/auth/signup/route.js')}
\`\`\`

## 6. CORE API ROUTES

### src/app/api/events/route.js
\`\`\`javascript
${readFile('src/app/api/events/route.js')}
\`\`\`

### src/app/api/events/[id]/route.js
\`\`\`javascript
${readFile('src/app/api/events/[id]/route.js')}
\`\`\`

### src/app/api/dashboard/route.js
\`\`\`javascript
${readFile('src/app/api/dashboard/route.js')}
\`\`\`

## 7. APPROVAL LOGIC

### src/lib/approval.js
\`\`\`javascript
${readFile('src/lib/approval.js')}
\`\`\`

### src/app/api/events/[id]/approve/route.js
\`\`\`javascript
${readFile('src/app/api/events/[id]/approve/route.js')}
\`\`\`

## 8. MIDDLEWARE / RBAC
\`\`\`javascript
${readFile('src/middleware.js')}
\`\`\`

## 9. FRONTEND — KEY PAGES

### src/app/(app)/dashboard/page.js
\`\`\`javascript
${readFile('src/app/(app)/dashboard/page.js')}
\`\`\`

### src/app/(app)/events/page.js
\`\`\`javascript
${readFile('src/app/(app)/events/page.js')}
\`\`\`

### src/app/(app)/events/[id]/page.js
\`\`\`javascript
${readFile('src/app/(app)/events/[id]/page.js')}
\`\`\`

## 10. SEED FILE
\`\`\`javascript
${readFile('prisma/seed.js')}
\`\`\`

## 11. KNOWN ISSUES
- The system is under active refactoring and hardening.
- Vendor verification UI originally relied on \`window.confirm\` which failed in strict automation environments (fixed).
- Database connections needed separation between \`.env\` and \`.env.local\` to properly sync the schema to \`diganta_mvp\`.
- \`pg-pool\` errors may appear if Next.js singletons are incorrectly evaluated without dotenv loading environment variables in standalone node scripts.

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
`;

fs.writeFileSync('diagnostic_report.md', md, 'utf8');
console.log('Report generated at diagnostic_report.md');
