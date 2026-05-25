# Job Tracker

A full-stack web application for organizing job applications, tracking interview stages, and recording contacts and notes.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Django 5, Django REST Framework |
| Auth | JWT (SimpleJWT) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Deployment | Render / Railway |

## Project structure

```
job-tracker/
├── backend/              # Django project
│   ├── config/           # Settings (base / dev / prod), URLs
│   ├── accounts/         # Custom user model, JWT auth endpoints
│   └── jobs/             # Job, Interview, Contact models + API
└── frontend/             # Vite + React app
    └── src/
        ├── api/          # Axios client + typed API functions
        ├── context/      # AuthContext (JWT management)
        ├── pages/        # Dashboard, Jobs, JobDetail, Login, Register
        └── types/        # Shared TypeScript interfaces
```

## Local setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # fill in SECRET_KEY
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo      # optional: create demo@example.com / demopass123
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The React app runs at `http://localhost:5173` and proxies `/api` requests to Django on port 8000.

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Create account |
| POST | `/api/auth/token/` | Obtain JWT |
| POST | `/api/auth/token/refresh/` | Refresh JWT |
| GET | `/api/auth/me/` | Current user |
| GET/POST | `/api/jobs/` | List / create jobs |
| GET/PATCH/DELETE | `/api/jobs/:id/` | Job detail |
| GET/POST | `/api/interviews/` | List / create interviews |
| GET/POST | `/api/contacts/` | List / create contacts |

## Running tests

```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm test
```

## Deployment

See [Render](https://render.com) or [Railway](https://railway.app) for one-click deployment. Set `DJANGO_SETTINGS_MODULE=config.settings.production` and provide `DATABASE_URL`, `SECRET_KEY`, and `CORS_ALLOWED_ORIGIN` environment variables.
