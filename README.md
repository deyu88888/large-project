# Infinite Loop Innovators (Large Group Project)

This is a **fullstack monorepo** containing:

- **Frontend**: Vite + React + TypeScript + TailwindCSS + MUI
- **Backend**: Django + ASGI + WebSockets + Daphne + SQLDB
- **Docker**: Development setup with Docker Compose
- **CI/CD**: GitHub Actions in `.github/workflows/`
- **Developer Manual**: Frontend in `frontend/README.md` and Backend in `backend/README.md`
- **SEG Report**: SEG Report is `SEG_report.pdf` and src in `SEG_report/`

Production app is at [https://infiniteloop.space](https://infiniteloop.space)

---

## Directory Overview

```bash
├── backend/                 # Django backend (ASGI, WebSockets, REST API)
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
│     React + Nginx    │                      │   ASGI + Daphne + WS   │
└──────────────────────┘                      └────────────────────────┘
                                                        │
                                                        ▼
                                            ┌────────────────────────┐
                                            │    Database (SQL)      │
                                            │        (SQLite)        │
                                            └────────────────────────┘

```