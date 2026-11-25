# Nexora — Team Collaboration Platform

Nexora is a full-stack project and team collaboration workspace. It brings projects, tasks, team workflows and progress tracking into one responsive dashboard.

## Features
- JWT-based registration and login with hashed passwords
- Workspace-style project management
- Create, update and delete projects
- Create, assign, update and delete tasks
- Kanban workflow: Todo, In Progress, Review, Done
- Task priorities, due dates and status filters
- Dashboard metrics and recent activity
- REST API with validation and centralized error handling
- PostgreSQL + Prisma data model
- Responsive React interface

## Stack
- Frontend: React, Vite, React Router, Axios, Lucide icons
- Backend: Node.js, Express, JWT, bcrypt, Zod
- Database: PostgreSQL, Prisma ORM
- Realtime-ready architecture: Socket.IO can be added for live collaboration

## Run locally
Requirements: Node.js 20+, npm, and Docker Desktop (or a local PostgreSQL server).

1. Copy environment files:
   - `backend/.env.example` to `backend/.env`
   - `frontend/.env.example` to `frontend/.env`
2. Start PostgreSQL from the repository root:
   ```bash
   docker compose up -d db
   ```
3. Start the API:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   npm run dev
   ```
4. In a second terminal, start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
5. Open http://localhost:5173. API health: http://localhost:4000/api/health.

## Environment
Backend variables are documented in `backend/.env.example`. Frontend uses `VITE_API_URL`.

## API overview
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id`
- `GET/POST /api/tasks`, `PATCH/DELETE /api/tasks/:id`
- `GET /api/dashboard/summary`

All project and task routes require a Bearer token. Users only access their own projects and tasks.

## Production notes
Set a strong `JWT_SECRET`, use managed PostgreSQL, configure HTTPS and CORS for your deployed frontend, and add rate limiting, email verification, password reset, automated tests and CI before production use. This repository is a portfolio starter, not a hardened enterprise service.
