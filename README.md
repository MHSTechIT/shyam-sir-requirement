# MyHealthSchool — Org Chart OS

Full-stack rebuild of the single-file `mhs_orgchart_v7.html` org-chart tool.

- **Frontend:** React + TypeScript + Vite + React Flow
- **Backend:** Node + Express + TypeScript + node-postgres (pg) + raw SQL
- **Database:** PostgreSQL
- **File storage:** local disk (dev / single-server) — swappable for S3/R2

A **single shared org chart** that everyone with the URL sees and edits live. No login
(an optional shared-password gate can be enabled — see below). All data, uploaded
role-clarity documents, and the full change history live in PostgreSQL + object storage,
not the browser.

```
frontend (React + React Flow)  ──REST/JSON──►  backend (Express)  ──►  PostgreSQL
                                                     │
                                                     └──►  uploads/ (files)
```

---

## Repository layout

```
nsi/
├─ frontend/        React + Vite app
├─ backend/         Express + pg API (also serves the built frontend in prod)
├─ render.yaml      Render deploy blueprint (backend)
└─ package.json     root scripts to run both apps
```

---

## Quick start (local development)

### 1. PostgreSQL

Point `DATABASE_URL` (in `backend/.env`) at any PostgreSQL instance — a local one
(e.g. managed with pgAdmin) or a remote server. Tables are created automatically
on first boot.

### 2. Backend

```bash
cd backend
cp .env.example .env        # adjust DATABASE_URL if needed
npm install
npm run db:setup            # create tables (also auto-created on server boot)
npm run db:seed             # load the real MHS org structure
npm run dev                 # API on http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # app on http://localhost:5173 (proxies /api → :4000)
```

Open http://localhost:5173.

---

## How it maps to the old single-file app

| Old (browser-only)                     | New (full-stack)                                   |
| -------------------------------------- | -------------------------------------------------- |
| `State.nodes` in `localStorage`        | `nodes` table in PostgreSQL                         |
| `State.connections` in `localStorage`  | `connections` table                                |
| Files as base64 in `localStorage`      | `files` table (metadata) + `uploads/` bytes        |
| History in `localStorage` (capped)     | `history` table — **kept forever**, shared         |
| "Save & Export" HTML download          | every edit auto-persists to the DB; backup export kept too |
| Per-browser data                       | one shared chart, any device                        |

Client-only UI preferences (project filters, line-style default, zoom) stay in the
browser's `localStorage` since they are per-viewer, not shared.

---

## Production build & deploy

The Express server can serve the built React app, so you deploy **one service** plus a
managed Postgres.

```bash
cd frontend && npm run build          # outputs frontend/dist
cd ../backend && npm run build       # compiles TS → dist
NODE_ENV=production npm start       # serves API + client on PORT
```

Recommended hosts: Render / Railway (long-running Node + managed Postgres + a persistent
disk for `uploads/`). For multi-instance hosting, switch file storage to S3/R2 (see
`backend/src/storage.ts`).

### Environment variables (server)

| Var                | Required | Description                                             |
| ------------------ | -------- | ------------------------------------------------------- |
| `DATABASE_URL`     | yes      | Postgres connection string                              |
| `PORT`             | no       | API port (default 4000)                                 |
| `UPLOAD_DIR`       | no       | Where uploaded files are stored (default `./uploads`)   |
| `SHARED_PASSWORD`  | no       | If set, gates the app behind one shared password        |
| `CLIENT_ORIGIN`    | no       | CORS origin for the dev frontend (default `*`)          |

---

## Importing existing data from an exported backup

If you already made edits in the old HTML and downloaded a `mhs_orgchart_*.html` backup,
import its embedded state:

```bash
cd backend
npm run import -- "C:/path/to/mhs_orgchart_2026-01-01.html"
```
