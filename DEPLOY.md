# Deploying MHS Org Chart OS

Monorepo with two deployables:

- **`client/`** → Vercel (React static site)
- **`server/`** → Render (Express API + Prisma)
- **PostgreSQL** → your existing remote DB (already migrated + seeded), or a new Render Postgres.

Deploy the **backend first** (you need its URL for the frontend), then the frontend, then link them.

---

## A. Backend on Render

1. **dashboard.render.com → New + → Web Service** → connect GitHub → pick
   `MHSTechIT/shyam-sir-requirement`.
2. Fill in **exactly**:
   | Field | Value |
   |---|---|
   | Name | `mhs-orgchart-api` |
   | Root Directory | `server` |
   | Runtime | `Node` |
   | Build Command | `npm install --include=dev && npm run build` |
   | Start Command | `npm start` |
   | Health Check Path | `/api/health` |
   > **Why `--include=dev`:** we set `NODE_ENV=production` (below), which makes npm
   > skip devDependencies — but `typescript`/`prisma` live there and are needed to
   > build. This flag is the #1 fix for "tsc: not found" / "prisma: not found" build
   > failures.
3. **Advanced → Pre-Deploy Command:**
   ```
   npx prisma migrate deploy
   ```
4. **Environment Variables** (Advanced → Add):
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | `postgresql://postgres:%24erver2026@13.202.225.50:5432/nsi_team?schema=public` |
   | `NODE_ENV` | `production` |
   | `UPLOAD_DIR` | `/var/data/uploads` |

   > The `$` in the password is written as `%24` (URL-encoded) — paste it exactly.
5. **Add a Disk** (so uploaded documents survive redeploys):
   Name `uploads`, Mount Path `/var/data`, Size `1 GB`.
6. **Create Web Service.** Wait for "Live", then test:
   `https://<your-service>.onrender.com/api/health` → must return `{"ok":true}`.
7. Copy the service URL, e.g. `https://mhs-orgchart-api.onrender.com`.

> **Shortcut:** instead of steps 1–5, use **New + → Blueprint** and pick the repo —
> Render reads `render.yaml` and pre-fills everything; you only set `DATABASE_URL`.

> **Fresh database?** If you point `DATABASE_URL` at a brand-new empty DB, open the
> Render **Shell** tab once and run `npm run db:seed` to load the org structure.
> (Your existing DB is already seeded, so skip this.)

---

## B. Frontend on Vercel

1. **vercel.com → Add New → Project** → import `MHSTechIT/shyam-sir-requirement`.
2. **Root Directory:** click **Edit** and select **`client`**. *(Critical — without
   this Vercel builds from the repo root and fails.)*
3. Framework Preset auto-detects **Vite**. Leave Build/Output as default
   (`npm run build` → `dist`).
4. **Environment Variables → Add:**
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://mhs-orgchart-api.onrender.com/api` |

   > Use **your** Render URL from step A.7, and **keep the `/api` suffix**.
   > This var is read at build time, so it must exist before the build.
5. **Deploy.** You'll get a URL like `https://shyam-sir-requirement.vercel.app`.

---

## C. Link them (CORS) — final step

1. **Render → your service → Environment → Add:**
   | Key | Value |
   |---|---|
   | `CLIENT_ORIGIN` | `https://shyam-sir-requirement.vercel.app` |
   (your Vercel URL, no trailing slash)
2. Save → Render auto-redeploys.
3. Open the Vercel URL → the chart loads, reads/writes Postgres. Done. ✅

Every `git push` to `main` now auto-redeploys both.

---

## Troubleshooting (avoid these errors)

| Symptom | Cause / Fix |
|---|---|
| Render build: `tsc: not found` / `prisma: not found` | Build command missing `--include=dev`. Use `npm install --include=dev && npm run build`. |
| Render: `Can't reach database server` during deploy | `DATABASE_URL` wrong or DB unreachable. Verify the value; the `$` must be `%24`. |
| Vercel build fails immediately | Root Directory not set to `client`. |
| App loads but "Couldn't load the chart / timed out" | `VITE_API_URL` missing or wrong on Vercel, or backend asleep (free tier) — wait ~60s and Retry. |
| Browser console: CORS error | Set `CLIENT_ORIGIN` on Render to the exact Vercel URL (no trailing slash). |
| Uploaded documents vanish after redeploy | Add the Render Disk (step A.5) and set `UPLOAD_DIR=/var/data/uploads`. |
| Render free service slow first load | Free instances sleep after ~15 min idle; first request wakes it (~30–60s). Upgrade to avoid. |

---

## Local development (unchanged)

```bash
# backend
cd server && npm install && npm run db:migrate && npm run db:seed && npm run dev
# frontend (new terminal)
cd client && npm install && npm run dev   # http://localhost:5180
```
