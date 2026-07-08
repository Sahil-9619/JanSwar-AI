# JanSwar AI | Constituency Intelligence Platform

**JanSwar AI** is a comprehensive platform designed for modern civic engagement, connecting citizens directly with their representatives (Members of Parliament, District Admins) and leveraging AI to streamline and prioritize public infrastructure and policy requests.

---

## 🚀 Features

- **Custom OTP Authentication:** Secure, passwordless login flow using email OTP (NodeMailer) and JWT.
- **Multi-Role Dashboards:**
  - **Citizen Dashboard:** Submit suggestions, report issues, and track the status of requests.
  - **MP Dashboard:** View a macro-level intelligence report of the constituency, approve AI-generated infrastructure project proposals, and track village-level gaps via interactive maps.
  - **Admin Dashboard:** Review flagged issues, manage district-level settings, and route tasks to the appropriate departments.
- **AI-Powered Insights:** Uses LLMs (Google Gemini) to analyze citizen suggestions, group them by category, determine sentiment, and calculate an automated "Priority Score" based on urgency and infrastructure gaps.
- **Geospatial Visualization:** Interactive maps rendering constituency data directly on the dashboard.

---

## 🏗️ Architecture & Tech Stack

JanSwar AI is divided into distinct microservices managed entirely via Docker:

1. **Frontend (`/frontend`)**
   - **Framework:** Next.js 14 (App Router)
   - **Styling:** Tailwind CSS, Framer Motion
   - **State Management:** Zustand
   - **Data Visualization:** Recharts, custom SVGs

2. **Backend (`/backend`)**
   - **Framework:** Node.js with Express
   - **Database:** PostgreSQL
   - **ORM:** Prisma
   - **Auth:** JSON Web Tokens (JWT) + Nodemailer

3. **AI Service (`/ai-service`)**
   - **Framework:** Python, FastAPI
   - **LLM Integration:** Google Gemini API

4. **Database Tools**
   - **DB:** PostgreSQL
   - **Management:** Adminer

---

## ⚙️ Prerequisites

- **Docker & Docker Compose** (Highly recommended for running all services together)
- **Node.js 18+** (If running locally without Docker)
- **PostgreSQL 15+** (If running locally without Docker)
- **Python 3.10+** (If running AI service locally without Docker)

---

## 🛠️ Environment Configuration

Environment variables have been cleanly separated into their respective service directories.

1. **Backend:** Copy `backend/.env.example` to `backend/.env` and update secrets.
2. **Frontend:** Copy `frontend/.env.example` to `frontend/.env.local`.
3. **AI Service:** Copy `ai-service/.env.example` to `ai-service/.env` and add your Gemini API Key.

*(Note: There is no `.env` file in the root directory. `docker-compose.yml` automatically mounts the inner `.env` files into their respective containers.)*

---

## 🏃‍♂️ Getting Started

The easiest way to boot the entire stack is using Docker Compose.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/janswar-ai.git
   cd janswar-ai
   ```

2. **Set up Environment Variables:**
   Configure your `.env` files inside `backend/`, `frontend/`, and `ai-service/` as mentioned above.

3. **Spin up the stack:**
   ```bash
   docker compose up -d --build
   ```

4. **Access the Application:**
   - **Frontend App:** `http://localhost:3000`
   - **Backend API:** `http://localhost:5000`
   - **AI Service Docs:** `http://localhost:8000/docs`
   - **Database Admin (Adminer):** `http://localhost:8080`
     - System: `PostgreSQL`
     - Server: `db`
     - Username: `postgres`
     - Password: `postgrespassword`
     - Database: `janswar_db`

---

## 🔑 Default Credentials

Use the following default accounts to access and test the platform roles:

| Role / Dashboard | Email | Password |
| :--- | :--- | :--- |
| **MP / Admin Portal** | `admin@janswar.com` | `Admin@123` |
| **Demo Citizen Portal** | `demo@user.com` | `123456` |

---

## 🧪 Development & Testing

If you want to run services individually outside of Docker:

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
