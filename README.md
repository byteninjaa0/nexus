# Nexus — Dark Glassmorphism Command Center

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-20.x-339933.svg)
![React](https://img.shields.io/badge/react-18-61dafb.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-16-336791.svg)

Nexus is a production-grade project management platform with a deep-space glass UI, JWT auth (access + refresh), Prisma on PostgreSQL, Express REST, Socket.io realtime task sync, and a Vite + React client with Framer Motion throughout.

## Live URL

Deploy to Railway (see below), then paste your public URL here:

**`https://YOUR-SERVICE.up.railway.app`**

> This repository ships a single **root `Dockerfile`** that serves the built SPA from Express and exposes `/api/*` on the same origin, which is ideal for Railway health checks and browser security.

## Features

- 🔐 JWT access + refresh flow with rotation and server-side refresh token storage  
- 🧱 Global roles (`ADMIN`, `MEMBER`) and project roles (`OWNER`, `ADMIN`, `MEMBER`) with RBAC middleware  
- 📡 Socket.io rooms per project (`task:*`, `member:*`, `notification:new`)  
- 🧭 Kanban with drag-and-drop (`@hello-pangea/dnd`), list + timeline views, task drawer  
- 📊 Dashboard charts (Recharts), activity feed, overdue radar  
- 🛡️ Helmet, CORS, rate limiting, express-validator + Zod on the client  
- 🐳 `docker-compose` for local Postgres + API + nginx SPA proxy  
- 🚂 `railway.toml` + root Dockerfile for one-click style deploys  

## Screenshots

Add screenshots under `docs/screenshots/` and link them here after your first deploy.

## Tech Stack

| Area        | Stack |
|------------|--------|
| API        | Node 20, Express, Prisma, PostgreSQL, Socket.io |
| Auth       | JWT, bcryptjs, refresh token table |
| Client     | React 18, Vite, React Router 6, Zustand, Framer Motion |
| Forms      | React Hook Form + Zod |
| Charts     | Recharts |
| DnD        | @hello-pangea/dnd |

## Local Setup (without Docker)

### Prerequisites

- Node.js 20+  
- PostgreSQL 16+  

### Database: migrate before seed

Tables (including `RefreshToken`) are created by **migrations**. If you seed before migrating, you will see `P2021` / “table does not exist”.

**One command (recommended):** from `nexus/` or `nexus/backend/`, after `nexus/backend/.env` exists with `DATABASE_URL`:

```bash
cd nexus
npm run db:setup
```

That runs `prisma migrate deploy` then `prisma db seed`.

**Or step by step:** `npx prisma migrate deploy` then `npx prisma db seed` (with schema path / cwd as below).

### Seeding from different folders

- **`nexus/backend`** (canonical): `cd nexus/backend && npm install && npx prisma migrate deploy && npx prisma db seed`.  
- **`nexus`**: `npm install` in `nexus/` (Prisma CLI + `package.json` → `backend/prisma/schema.prisma`). Ensure **`nexus/backend/.env`** has `DATABASE_URL`. Then `npm run db:setup`, or `npx prisma migrate deploy` then `npx prisma db seed`.  
- **Repo root** (`Razorpay_project`): `npm run db:setup` or `npm run migrate:deploy` then `npm run prisma:seed`.

### Backend

```bash
cd nexus/backend
cp .env.example .env
# edit DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, FRONTEND_URL
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

### Frontend

```bash
cd nexus/frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` and `/socket.io` to `http://localhost:3001`.

### Demo accounts (after seed)

All seeded users share password: **`NexusDemo123!`**

- Admins: `admin1@nexus.app`, `admin2@nexus.app`  
- Members: `member1@nexus.app` … `member5@nexus.app`  

## Docker Setup

```bash
cd nexus
docker compose up --build
```

- App (nginx + static UI): `http://localhost`  
- API (direct): `http://localhost:3001`  
- Postgres: `localhost:5432` (`postgres` / `postgres`, database `nexus`)  

Migrate + seed the database (first run, or empty DB):

```bash
docker compose exec backend npm run db:setup
```

## Railway Deployment (single service + Postgres)

1. Create a **new Railway project** and add the **PostgreSQL** plugin. Copy the generated `DATABASE_URL`.  
2. Connect this GitHub repository (or push this `nexus/` folder to a repo Railway can read).  
3. Create a **new service from the repo** and set the **root directory** to `nexus` (or keep repo root if you moved files).  
4. Railway should detect `railway.toml` and build using the **root `Dockerfile`**.  
5. In the service variables, set at minimum:

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | *(from Railway Postgres)* |
| `JWT_SECRET` | 32+ random bytes string |
| `JWT_REFRESH_SECRET` | different 32+ random bytes string |
| `FRONTEND_URL` | `https://YOUR-SERVICE.up.railway.app` |
| `PORT` | `3001` *(Railway usually injects `PORT` — keep default if unset)* |

6. Deploy. Visit `/api/health` — expect `{ "status": "ok", ... }`.  
7. Open `/` for the SPA. Run `npx prisma db seed` **once** via a Railway shell if you want demo data.

> I cannot create a Railway account or provision a live URL from this environment. After you deploy, replace the **Live URL** section at the top of this README with your real `https://…` link.

## API Reference

Base path: `/api`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness JSON |
| POST | `/auth/signup` | Register |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Invalidate refresh token |
| POST | `/auth/refresh` | Rotate refresh token |
| GET | `/auth/me` | Current user |
| GET | `/auth/check-email` | Email availability |
| GET | `/users` | List users (**ADMIN**) |
| GET | `/users/:id` | Get user (self or **ADMIN**) |
| PATCH | `/users/:id` | Update user (self or **ADMIN**) |
| DELETE | `/users/:id` | Delete user (**ADMIN**) |
| GET | `/users/:id/activity` | Activity for user |
| GET | `/projects` | My projects |
| POST | `/projects` | Create project |
| GET | `/projects/:id` | Project detail + tasks |
| PATCH | `/projects/:id` | Update project (**OWNER/ADMIN**) |
| DELETE | `/projects/:id` | Delete project (**OWNER/ADMIN**) |
| POST | `/projects/:id/members` | Add member (**OWNER/ADMIN**) |
| DELETE | `/projects/:id/members/:uid` | Remove member (**OWNER**) |
| PATCH | `/projects/:id/members/:uid` | Change member role (**OWNER**) |
| GET | `/projects/:id/tasks` | List tasks |
| POST | `/projects/:id/tasks` | Create task (**OWNER/ADMIN**) |
| GET | `/tasks/:id` | Task detail + comments + activity |
| PATCH | `/tasks/:id` | Update task (RBAC) |
| DELETE | `/tasks/:id` | Delete task (**OWNER/ADMIN**) |
| PATCH | `/tasks/:id/status` | Status change |
| PATCH | `/tasks/:id/assign` | Assignee change (**OWNER/ADMIN**) |
| POST | `/tasks/:id/comments` | Add comment |
| GET | `/tasks/:id/comments` | List comments |
| GET | `/dashboard/stats` | Dashboard stats |
| GET | `/dashboard/activity` | Activity feed |
| GET | `/dashboard/overdue` | Overdue tasks |
| GET | `/notifications` | Notifications |
| POST | `/notifications/read-all` | Mark all read |
| PATCH | `/notifications/:id/read` | Mark one read |
| DELETE | `/notifications/:id` | Dismiss |
| GET | `/admin/stats` | Platform stats (**ADMIN**) |
| GET | `/admin/activity` | Platform activity (**ADMIN**) |

## Environment Variables

| Name | Required | Description |
|------|----------|-------------|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | Access token signing secret |
| `JWT_REFRESH_SECRET` | yes | Refresh token signing secret |
| `JWT_ACCESS_EXPIRES` | no | Access TTL (default `15m`) |
| `JWT_REFRESH_EXPIRES` | no | Refresh TTL (default `7d`) |
| `FRONTEND_URL` | yes* | Comma-separated allowed CORS origins |
| `PORT` | no | HTTP port (default `3001`) |
| `NODE_ENV` | no | `production` or `development` |

\*Strictly required when the browser origin differs from the API (local Vite + remote API). For the all-in-one Railway image, set it to your public HTTPS URL.

## Role Permissions Matrix

| Capability | Global ADMIN | Project OWNER | Project ADMIN | Project MEMBER |
|------------|:------------:|:-------------:|:-------------:|:----------------:|
| View any project | ✅ | — | — | — |
| Manage platform users | ✅ | — | — | — |
| View project | ✅ | ✅ | ✅ | ✅ |
| Create tasks | ✅ | ✅ | ✅ | ❌ |
| Delete tasks | ✅ | ✅ | ✅ | ❌ |
| Edit any task field | ✅ | ✅ | ✅ | assignee-only\* |
| Change project settings | ✅ | ✅ | ✅ | ❌ |
| Delete project | ✅ | ✅ | ✅ | ❌ |
| Manage members (add) | ✅ | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ✅ | ❌ | ❌ |
| Comment on tasks | ✅ | ✅ | ✅ | ✅ |

\*Project **MEMBER** may update tasks assigned to them (status, fields); **OWNER/ADMIN** may update any task in the project.

## Contributing

1. Fork the repository and create a feature branch.  
2. Keep changes focused; match existing formatting and patterns.  
3. Run `npm run build` in `frontend` and smoke-test `docker compose up` when you touch infra.  
4. Open a PR with a clear description and screenshots for UI changes.  

## License

MIT © Nexus contributors
