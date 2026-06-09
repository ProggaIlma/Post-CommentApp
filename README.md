# RBAC Full-Stack App

Role-based CRUD application with NestJS + Prisma + PostgreSQL (backend) and React + Vite + TailwindCSS + Zustand (frontend).

---

## Role Matrix

| Role         | Permissions |
|-------------|------------|
| SUPER_ADMIN | Delete anything (users, posts, comments) |
| MODERATOR   | Delete any post or comment (no user management) |
| REGULAR_USER | Create posts/comments; edit/delete own posts; delete own comments; delete comments on own posts |
| GUEST       | Read-only |

---

## 1. PostgreSQL Setup

### Option A — Install PostgreSQL locally (Recommended)

#### macOS (Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Ubuntu / Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
Download and install from: https://www.postgresql.org/download/windows/
During install, set a password for the `postgres` user (remember it).

---

### Create the database

After PostgreSQL is running, open a terminal:

```bash
# Connect as postgres superuser
# macOS / Linux:
psql -U postgres

# Windows (from PostgreSQL install directory):
psql -U postgres
```

Inside the psql shell, run these commands:

```sql
-- Create a dedicated user for the app
CREATE USER rbac_user WITH PASSWORD 'rbac_password';

-- Create the database
CREATE DATABASE rbac_db OWNER rbac_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE rbac_db TO rbac_user;

-- Exit
\q
```

Test the connection:
```bash
psql -U rbac_user -d rbac_db -h localhost
# Should connect successfully. Type \q to exit.
```

---

## 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DATABASE_URL="postgresql://rbac_user:rbac_password@localhost:5432/rbac_db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="1h"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

```bash
# Run Prisma migrations (creates all tables)
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed the database with test data
npm run seed

# Start development server
npm run start:dev
```

Backend runs on: http://localhost:3000/api

---

## 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: http://localhost:5173

---

## 4. Test Accounts (after seeding)

| Role         | Email              | Password    |
|-------------|-------------------|-------------|
| SUPER_ADMIN | admin@test.com    | password123 |
| MODERATOR   | mod@test.com      | password123 |
| REGULAR_USER | user1@test.com   | password123 |
| REGULAR_USER | user2@test.com   | password123 |

---

## API Endpoints

### Auth
```
POST /api/auth/register   — Register new account
POST /api/auth/login      — Login, returns JWT token
```

### Posts (public GET, JWT required for mutations)
```
GET    /api/posts            — List posts (paginated: ?page=1&limit=10)
GET    /api/posts/:id        — Get single post
POST   /api/posts            — Create post (REGULAR_USER+)
PUT    /api/posts/:id        — Update post (owner only)
DELETE /api/posts/:id        — Delete post (owner / MODERATOR / SUPER_ADMIN)
```

### Comments (public GET, JWT required for mutations)
```
GET    /api/comments/post/:postId  — List comments for post (paginated)
POST   /api/comments               — Create comment (REGULAR_USER+)
DELETE /api/comments/:id           — Delete comment (owner / post owner / MODERATOR / SUPER_ADMIN)
```

### Users (SUPER_ADMIN only)
```
GET    /api/users      — List all users (paginated)
DELETE /api/users/:id  — Delete user
```

---

## Project Structure

```
backend/
  prisma/
    schema.prisma         — Database schema (User, Post, Comment models)
    seed.ts               — Test data seeder
  src/
    auth/                 — JWT auth (login, register, JWT strategy)
    users/                — User management (SUPER_ADMIN only)
    posts/                — Post CRUD with role-based delete
    comments/             — Comment CRUD with cascaded permission logic
    guards/               — JwtAuthGuard, RolesGuard
    decorators/           — @CurrentUser(), @Roles(), @Public()
    dto/                  — Validation DTOs (class-validator)
    prisma.service.ts     — Prisma client wrapper
    app.module.ts         — Root module
    main.ts               — Bootstrap with CORS, ValidationPipe

frontend/
  src/
    components/
      ui/                 — Button, Modal, Pagination, Toast, FormInput, FormTextarea, RoleBadge
      PostCard.tsx        — Post with role-aware edit/delete actions
      CommentItem.tsx     — Comment with permission-aware delete
      CommentsSection.tsx — Comments list + load more + add form
      Navbar.tsx          — Navigation with role-based links
      ProtectedRoute.tsx  — Route guard component
    hooks/
      index.ts            — useForm, useToast, useRole, useDebounce, useClickOutside
    stores/
      authStore.ts        — Zustand auth store (with persistence)
      postStore.ts        — Zustand post store
      commentStore.ts     — Zustand comment store (keyed by postId)
    pages/
      Login.tsx           — Login form with demo account shortcuts
      Register.tsx        — Registration form
      Home.tsx            — Posts feed with pagination + create modal
      AdminUsers.tsx      — User management table (SUPER_ADMIN only)
    services/
      api.ts              — Axios instance + API functions
    schemas/
      index.ts            — Zod validation schemas (shared)
    App.tsx               — Router setup with lazy loading
    main.tsx              — React entry point
```

---

## Key Architecture Decisions

### Why Zustand over Redux?
Minimal boilerplate. Three stores (auth, posts, comments) cover all state without reducers, actions, or selectors overhead. Persist middleware handles localStorage sync.

### Why cursor-less pagination here?
Offset pagination is simpler to implement and sufficient for this demo scale. Cursor pagination would be added for production with large datasets.

### Comment Delete Permission Logic
Implemented in `CommentsService.remove()`:
```
canDelete = (comment.authorId === userId)     // own comment
         || (post.authorId === userId)         // post owner deleting comment on their post
         || role === 'MODERATOR'               // moderator
         || role === 'SUPER_ADMIN'             // super admin
```

### Custom useForm vs react-hook-form
Demonstrates understanding of form state management internals: validation on blur, re-validation on change after touch, zod integration, and submit handling — without library magic.

---

## Common Issues

**Prisma migration fails:**
```bash
# Check your DATABASE_URL is correct in .env
# Make sure PostgreSQL is running
npx prisma db push  # alternative to migrate dev
```

**CORS errors:**
Make sure `FRONTEND_URL` in backend `.env` matches where your frontend is running (default: http://localhost:5173).

**Token expired:**
JWT tokens expire in 1 hour. Just log in again.

**Port already in use:**
```bash
# Change PORT in backend .env (e.g. PORT=3001)
# Update vite.config.ts proxy target accordingly
```
