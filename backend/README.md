# Backend

This is a **Django** backend application using **SQLite** (by default). The project is structured for real-time features and includes a startup script to automate setup and server start.

---

## Quick Start

### Prerequisites

- [Python 3.10+](https://www.python.org/downloads/)
- [pip](https://pip.pypa.io/en/stable/)
- [virtualenv](https://virtualenv.pypa.io/) (recommended)
- [Django](https://www.djangoproject.com/)

### Install Dependencies

Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Running the backend

```bash
# With reset db, migrations, etc
./start.sh

# Just run backend
./run.sh
```

---

```bash
├── api/                    # Core Django app
│   ├── migrations/         # Django migrations
│   ├── models.py           # Data models
│   ├── middleware.py       # Middleware
│   ├── views.py            # HTTP views
│   ├── serializers_files/   # Serializers
│   └── ...
├── backend/
│   ├── asgi.py             # ASGI application entrypoint
│   ├── settings.py         # Django settings
│   └── urls.py             # Root URL config
│   ├── wsgi.py             # WSGI application entrypoint
├── db.sqlite3              # SQLite DB (auto-generated)
├── start.sh                # Startup script (DB reset + django run)
├── run.sh                  # Startup script (DB reset + django run)
├── manage.py
└── requirements.txt        # Python dependencies
└── requirements.prod.txt   # Prod Python dependencies
└── Dockerfile              # Dockerfile
```

