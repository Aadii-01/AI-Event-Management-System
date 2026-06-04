# AI-Powered Event Management System

A production-grade, full-stack event planning, registration, ticketing, and scheduling application. Organizers can manage events, sell tickets, register attendees, and use **AI scheduling models (Groq Llama 3 & Hugging Face Falcon)** to build multi-day session agendas.

---

## Tech Stack

- **Backend Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Database ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) with [Pydantic V2](https://docs.pydantic.dev/) data validation
- **Frontend Framework**: [React 19](https://react.dev/) built on [Vite](https://vite.dev/)
- **UI Design System**: [Material UI (MUI v9)](https://mui.com/)
- **Data Visualization**: [Recharts](https://recharts.org/) for beautiful registrations and revenue dashboards
- **AI Integration**: [Groq Cloud SDK](https://console.groq.com) (Llama 3) & [Hugging Face](https://huggingface.co/) (Falcon 7B Instruct) with smart simulator failover mode
- **Testing**: [Pytest](https://docs.pytest.org/) for backend router and controller test suites
- **PDF Generation**: [ReportLab](https://www.reportlab.com/) for generating dynamic ticket passes with QR codes
- **Infrastructure**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) containerization with [Nginx](https://www.nginx.com/) reverse proxy server

---

## Project Structure

```text
├── backend
│   ├── app
│   │   ├── main.py            # API entry point & seeder triggers
│   │   ├── config.py          # Pydantic Settings schema
│   │   ├── database.py        # SQLAlchemy connector setup
│   │   ├── models.py          # SQLAlchemy models (users, events, tickets, payments, etc.)
│   │   ├── schemas.py         # Pydantic request/response validation schemas
│   │   ├── security.py        # JWT auth, bcrypt hashing & RBAC dependencies
│   │   ├── crud.py            # DB query utilities
│   │   ├── routers/           # FastAPI controller endpoints
│   │   └── services/          # Abstracted AI, SMTP email, and reportlab PDF generators
│   ├── tests/                 # FastAPI test suite (conftest, auth, event tests)
│   ├── Dockerfile
│   ├── seed.py                # Database data seeder
│   └── requirements.txt
├── frontend
│   ├── src
│   │   ├── components/        # private router guards, custom metric cards, navbar
│   │   ├── context/           # React Auth state provider
│   │   ├── pages/             # Auth forms, dashboards, AI timeline schedulers
│   │   ├── services/          # Axios API endpoints interceptor
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

---

## Key Features Implemented

- **User Authentication & RBAC**: Fully-featured JWT authentication with granular Role-Based Access Control (Admin, Organizer, and Attendee roles).
- **Event Scheduling & Management**: Organizers can create, edit, delete, and publish events, configure ticket categories, pricing, and ticket capacity limits.
- **AI-Powered Session Scheduling**: Uses **Groq API (Llama 3)** or **Hugging Face Inference (Falcon 7B)** (with automatic local mock-fallback) to build customizable, detailed multi-day session agendas.
- **PDF Ticket Generation**: Fully-automated, professional PDF ticket generation containing event details, attendee profile, and secure registration hashes.
- **Email Notifications**: Integrated SMTP email service dispatcher to send confirmation notifications on successful registration (falls back to console stdout logging if unconfigured).
- **Interactive Dashboards & Analytics**: Live analytics visualizers for user registrations, ticketing revenue, ticket sales distribution, and trend over time.
- **Admin Control Panel**: Interface to manage registered users, update roles, configure active AI engines, and view global system statistics.

## Recent Fixes & Improvements

- **Frontend Code Quality & Compilation**: Fixed missing Material UI component imports (`Tooltip` in `ManageEvents.jsx`, `Chip` in `Registrations.jsx`) and cleaned up ESLint flat configurations (`eslint.config.js`) to support React 19 / Fast Refresh hook architectures.
- **Multi-Environment Database Flexibility**: Enabled SQLite fallback configuration in backend `.env` (`DATABASE_URL=sqlite:///./local_dev.db`) allowing zero-dependency local running without a PostgreSQL instance.
- **Robust Database Seeding**: Updated `seed.py` to auto-initialize the database schema (`Base.metadata.create_all`) ensuring one-step database seeding for clean developer environments.
- **Docker Frontend Node.js Base Image**: Upgraded the frontend Docker container build stage to Node.js `20-alpine` to fix build incompatibilities with Vite 8.

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 20+
- Docker & Docker Compose (optional, for container running)

---

### Method 1: Local Development Setup (Quickest)

#### 1. Setup & Run the Backend
1. Move to backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the data seeder:
   ```bash
   python seed.py
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
The Swagger documentation is available at `http://localhost:8000/docs`.

#### 2. Run Backend Tests
Ensure the backend directory is in your path and run `pytest`:
```bash
pytest tests/ -v
```

#### 3. Setup & Run the Frontend
1. Move to frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Launch Vite development server:
   ```bash
   npm run dev
   ```
Access the application at `http://localhost:5173`.

---

### Method 2: Docker Compose Setup (Recommended)

To spin up the entire application stack including a PostgreSQL database instance:
```bash
docker-compose up --build
```
*(If you run into permission errors, run with `sudo docker-compose up --build`)*

- **Frontend Application**: `http://localhost:3000`
- **FastAPI Documentation Docs**: `http://localhost:8000/docs`

---

## Seed Accounts and Credentials

The database auto-seeds the following user logins on first startup:

| Role | Username / Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@eventmanagement.com` | `password123` |
| **Organizer** | `organizer@eventmanagement.com` | `password123` |
| **Attendee** | `attendee@eventmanagement.com` | `password123` |

---

## AI Providers Setup

The platform features an abstract AI Service layer that handles text generation with failover fallback support. You can configure active providers via the **Admin Portal > AI Configuration**.

### Obtaining API Keys:
- **Groq API**: Create an account and retrieve a key at [Groq Console](https://console.groq.com).
- **Hugging Face**: Create a User Access Token in your account [Hugging Face settings](https://huggingface.co/settings/tokens).
- **Simulator Mode**: If keys are empty or missing, the backend will auto-switch to a simulated generator that outputs correct JSON timeline outputs and statistics without failing.
