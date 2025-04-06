# Infinite Loop Innovators (Large Group Project)

This is a **fullstack monorepo** containing:

- **Frontend**: Vite + React + TypeScript + TailwindCSS + MUI
- **Backend**: Django + SQLDB
- **Docker**: Development setup with Docker Compose
- **CI/CD**: GitHub Actions in `.github/workflows/`
- **Developer Manual**: Frontend in `frontend/README.md` and Backend in `backend/README.md`
- **SEG Report**: SEG Report is `SEG_report.pdf` and src in `SEG_report/`
- **SEG Screencast**: SEG Screencast is `SEG_screencast`

Production app is at [https://infiniteloop.space](https://infiniteloop.space)
Screencast is at [https://www.youtube.com/watch?v=3u6wwups8_0&ab_channel=ihevgun](https://www.youtube.com/watch?v=3u6wwups8_0&ab_channel=ihevgun)

---

Test Account Credentials

Student:
Username: student_user
Password: studentpassword

Society President:
Username: president_user
Password: presidentpassword

Vice President:
Username: vice_president_user
Password: vicepresidentpassword

Event Manager:
Username: event_manager_user
Password: eventmanagerpassword

Administrator:
Username: admin1
Password: adminpassword

Super Administrator:
Username: superadmin1
Password: superadminpassword

## Directory Overview

```bash
├── backend/                 # Django backend (ASGI, REST API)
├── frontend/                # React frontend (Vite, Tailwind, MUI)
├── docker/                  # Docker-specific configs
│   ├── docker.base.yml      # Base Compose config used for extending
│   ├── docker.local.yml     # Local Compose config
│   └── docker.prod.yml      # Prod Compose config
├── SEG_report/              # Project documentation & report
├── .github/workflows/       # GitHub Actions (CI/CD pipelines)
├── .env.example             # Example env file for docker compose local
├── Makefile                 # Developer shortcuts (build, lint, test, etc.)
└── README.md                
```

## Running the Project

```bash
# uses docker compose
make docker-up-local

# get list of commands
make help
```

## Diagram of our current deployed application

```bash
                        ┌──────────────────────────────┐
                        │      End Users (Browser)     │
                        └────────────┬─────────────────┘
                                     │ HTTPS
                        ┌────────────▼────────────┐
                        │        Traefik          │
                        │  (Reverse Proxy / SSL)  │
                        └──────┬───────────┬──────┘
           ┌──────────────────┘           └────────────────────┐
           ▼                                                   ▼
┌──────────────────────┐                      ┌────────────────────────┐
│    Frontend (Vite)   │                      │   Backend (Django)     │
│     React + Nginx    │                      │   
└──────────────────────┘                      └────────────────────────┘
                                                        │
                                                        ▼
                                            ┌────────────────────────┐
                                            │    Database (SQL)      │
                                            │        (SQLite)        │
                                            └────────────────────────┘

```