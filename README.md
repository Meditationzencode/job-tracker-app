# Job Tracker

> A full-stack web app that helps job seekers organise applications, interviews, deadlines, and contacts in one place — so the search stops living in a messy spreadsheet.

**Live demo:** _coming soon_ &nbsp;·&nbsp; **Demo login:** `demo@example.com` / `demopass123`

![Dashboard](docs/screenshots/dashboard.png)

---

## Who it's for

Students, graduates, and career changers tracking 10+ open applications across saved roles, applied roles, interviews, offers, and rejections. The product is built around the workflow of one person job-hunting — not a recruiter tool.

## Features

- **User accounts** — register, sign in, sign out (JWT with silent token refresh)
- **Track applications** — company, title, status, salary range, deadlines, applied dates, CV / cover letter version, notes
- **Interviews** — type (phone, technical, on-site, etc.), scheduled time, location/link, completion tracking
- **Contacts** — recruiters and hiring managers per job, with email and LinkedIn links
- **Dashboard** — status counts, applications-over-time chart, upcoming interviews (next 5), approaching deadlines (next 14 days)
- **Search, filter, sort** — by company, title, status, archived state, plus 6 sort orders
- **CSV export** — download all jobs as a CSV via a streaming endpoint
- **Archive** — hide jobs without deleting them; toggle "Show archived" to see them again
- **Demo account** — `demo@example.com` / `demopass123` with realistic seeded data
- **Responsive** — works on mobile and desktop with a hamburger menu under 640px
- **Toast notifications** — every save / delete / archive action confirms

---

## Screenshots

| Dashboard | Jobs list |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Jobs](docs/screenshots/jobs-list.png) |

| Job detail | Mobile view |
|---|---|
| ![Job detail](docs/screenshots/job-detail.png) | ![Mobile](docs/screenshots/mobile.png) |

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Django 5, Django REST Framework, SimpleJWT |
| Database | SQLite (dev) · PostgreSQL via Supabase (prod) |
| Hosting | Vercel (frontend) · Render (backend) |
| Testing | Django TestCase, Vitest + React Testing Library |

### Why this stack?

- **Django + DRF over Flask or FastAPI** — DRF gives serializers, ViewSets, permission classes, and built-in filtering for free. For a CRUD-heavy app with auth, this saved hundreds of lines of boilerplate.
- **React + TypeScript over plain JS** — types caught real bugs at the API boundary (e.g. nullable `salary_min`) before they hit runtime. TypeScript is also the modern default in most job postings I'm targeting.
- **Tailwind over CSS modules or a component library** — utility classes kept all styling colocated with markup and stopped me from over-engineering a design system for a single-developer project.
- **JWT (SimpleJWT) over Django session auth** — letting the frontend and backend live on different origins (Vercel + Render) is much simpler with stateless tokens than with cross-domain cookies.
- **Supabase over Render's free PostgreSQL** — Render's free tier expires the database after 90 days. Supabase's free tier doesn't, so the demo link stays alive.

---

## Architecture

```
┌───────────────────┐      JWT       ┌──────────────────────┐
│  React + Vite     │ ─────────────▶ │  Django REST API     │
│  (Vercel)         │ ◀───────────── │  (Render)            │
└───────────────────┘     JSON       └──────────┬───────────┘
                                                │
                                                ▼
                                     ┌──────────────────────┐
                                     │  PostgreSQL          │
                                     │  (Supabase)          │
                                     └──────────────────────┘
```

The frontend is a standalone Vite SPA. The backend is a separate Django service that exposes a REST API. They share nothing at runtime — auth happens via JWTs the frontend stores in `localStorage` and attaches via an Axios interceptor.

### Key backend decisions

- **Custom user model from migration 0001** — replacing Django's built-in user after the first migration is painful, so this was set up day one with `email` as `USERNAME_FIELD`.
- **`IsOwner` permission class** — enforces user-scoped access at *both* the queryset level (so you can't even see other users' job IDs in 404s) *and* the object level.
- **Split settings** — `config/settings/base.py`, `development.py`, `production.py`. Production enables HSTS, SSL redirect, secure cookies, and whitenoise.
- **Streaming CSV export** — uses Django's `StreamingHttpResponse` so the response can scale to thousands of rows without holding the whole CSV in memory.

### Key frontend decisions

- **Axios response interceptor for silent JWT refresh** — when the API returns 401, the interceptor tries `/api/auth/token/refresh/` once with the stored refresh token and retries the original request. Users almost never have to log in again until their refresh token expires.
- **Plain Tailwind charts** — the dashboard's status breakdown and weekly chart are built from `<div>`s with width/height percentages instead of pulling in `recharts` or `chart.js`. Keeps the bundle small (~165 kB gzipped).
- **One context per concern** — `AuthContext` and `ToastContext` are separate. Lets components subscribe to only what they need.

---

## API overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Create account |
| `POST` | `/api/auth/token/` | Obtain access + refresh JWT |
| `POST` | `/api/auth/token/refresh/` | Exchange refresh token for new access token |
| `GET` | `/api/auth/me/` | Current user |
| `GET` `POST` | `/api/jobs/` | List / create jobs (supports `?search=`, `?status=`, `?ordering=`, `?archived=true`) |
| `GET` `PATCH` `DELETE` | `/api/jobs/:id/` | Job detail |
| `GET` | `/api/jobs/export/` | Stream a CSV of all the user's jobs |
| `GET` | `/api/dashboard/` | Aggregated counts + upcoming items for the home page |
| `GET` `POST` | `/api/interviews/` | List / create interviews |
| `GET` `POST` | `/api/contacts/` | List / create contacts |

---

## Local setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then set SECRET_KEY
python manage.py migrate
python manage.py seed_demo        # optional: creates demo@example.com / demopass123
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The Vite dev server runs at `http://localhost:5173` and proxies `/api/*` to Django on port 8000.

### Running tests

```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm test
```

---

## What I learned

A few things that genuinely caught me out:

1. **Custom Django user models can't be retrofitted.** I almost shipped with the default `User`, then realised I wanted `email` as the login field. Switching after the first migration means dropping the database and migrating fresh — a strong argument for setting `AUTH_USER_MODEL` on day one even when you "don't need it yet."
2. **JWT silent refresh is most of the auth UX work.** Generating tokens is trivial; gracefully handling expiry without bouncing the user to login is the hard part. The Axios response interceptor (`src/api/client.ts`) ended up being one of the more interesting files in the project.
3. **Render's free PostgreSQL expires after 90 days.** Discovered this while deploying. Switched to Supabase mid-deploy. Lesson: read the free-tier fine print *before* the architecture diagram.
4. **`StreamingHttpResponse` is simple but non-obvious.** First version of the CSV export loaded everything into memory. Switching to a generator pattern + an `Echo`-style pseudo file object was a 10-line change but made the export scale linearly.
5. **TypeScript catches API drift fast.** The day I added an `archived` field on the backend, the frontend `JobListItem` type went red across three files. That's the kind of bug I'd rather a compiler tell me about than a user.

---

## Future improvements

- Email reminders for upcoming interviews and deadlines (Celery + Django email backend)
- Kanban board view with drag-and-drop between status columns
- Conversion-rate analytics (applied → interview → offer)
- Saved searches and bulk actions on the Jobs list
- File uploads for CVs and cover letters (S3-backed)
- Accessibility audit and screen-reader pass

---

## License

MIT
