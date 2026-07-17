# 🏛️ JanSwar AI | Website + Mobile App | Constituency Intelligence Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg?logo=next.js)
![React Native](https://img.shields.io/badge/React_Native-Expo-02569B.svg?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg?logo=node.js)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688.svg?logo=fastapi)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?logo=docker)

**JanSwar AI** is a comprehensive platform designed for modern civic engagement, connecting citizens directly with their representatives (Members of Parliament, District Admins). It is available as both a **Web Platform** and a **Mobile App**, leveraging AI to streamline and prioritize public infrastructure and policy requests.

---

## 🚀 Key Features

- **Integrated Ecosystem:** Features a fully-responsive Next.js Website alongside a native Expo React Native Mobile App for seamless cross-device civic engagement.
- **Robust Multi-View Authentication:** Complete password-based login with independent eye toggles for all password fields (Login, Signup, Confirm Password) and email OTP verification.
- **Dynamic Development Routing:** The mobile app automatically resolves the host computer's Wi-Fi network IP to connect to backend containers without manual `.env` updates.
- **Offline OTP testing:** The backend handles email dispatch failures gracefully, printing OTP codes directly in the docker console so development is never blocked by API key/IP restrictions.
- **Multi-Role Dashboards:**
  - **Citizen / User Dashboard (`/user`):** Submit suggestions, report infrastructure gaps, and track request status.
  - **MP / Representative Dashboard (`/mp`):** View macro intelligence reports, approve AI infrastructure proposals, and map village gaps.
  - **Admin Dashboard:** Manage district settings, route flagged issues, and configure categories.
- **AI-Powered Insights:** Analyzes civic suggestions using Google Gemini to categorize topics, score priorities, and evaluate community sentiments.

---

## 🏗️ Architecture & Tech Stack

JanSwar AI is divided into distinct microservices and client applications:

1. **Mobile App (`/app`)**
   - **Framework:** React Native with Expo (Expo Router)
   - **Styling/UI:** Native Components, Expo Glass Effect, Lucide Icons
   - **Data Management:** Axios, AsyncStorage

2. **Frontend Website (`/frontend`)**
   - **Framework:** Next.js 14 (App Router)
   - **Styling:** Tailwind CSS, Framer Motion
   - **State Management:** Zustand
   - **Data Visualization:** Recharts, custom SVGs

3. **Backend API (`/backend`)**
   - **Framework:** Node.js with Express
   - **Database:** PostgreSQL
   - **ORM:** Prisma
   - **Auth:** JSON Web Tokens (JWT) + Nodemailer

4. **AI Service (`/ai-service`)**
   - **Framework:** Python, FastAPI
   - **LLM Integration:** Google Gemini API

---

## ⚙️ Prerequisites

- **Docker & Docker Compose** (Highly recommended for running backend services)
- **Node.js 18+** (For frontend and backend local development)
- **Expo CLI** (For running the mobile app locally)
- **PostgreSQL 15+** (If running locally without Docker)
- **Python 3.10+** (If running AI service locally without Docker)

---

## 🛠️ Environment Configuration

Environment variables have been cleanly separated into their respective service directories.

1. **Backend:** Copy `backend/.env.example` to `backend/.env` and update secrets.
2. **Frontend:** Copy `frontend/.env.example` to `frontend/.env.local`.
3. **AI Service:** Copy `ai-service/.env.example` to `ai-service/.env` and add your Gemini API Key.
4. **Mobile App:** Check `app/` for any environment or configuration needs (points to Backend API).

---

## 🏃‍♂️ Getting Started

The easiest way to boot the backend services is using Docker Compose.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/janswar-ai.git
   cd janswar-ai
   ```

2. **Spin up the Backend and Website stack:**
   ```bash
   docker compose up -d --build
   ```

3. **Access the Web Services:**
   - **Frontend Website:** `http://localhost:3000`
   - **Backend API:** `http://localhost:5000`
   - **AI Service Docs:** `http://localhost:8000/docs`
   - **Database Admin (Adminer):** `http://localhost:8080` (System: `PostgreSQL`, Server: `db`, User: `postgres`, Pass: `postgrespassword`)

4. **Run the Mobile App:**
   Open a new terminal and navigate to the `app` directory to start the Expo server:
   ```bash
   cd app
   npm install
   npx expo start
   ```
   *You can then run the app on an iOS Simulator, Android Emulator, or your physical device via the Expo Go app.*

---

## 🔑 Default Credentials

Use the following default accounts to access and test the platform roles:

| Role / Dashboard | Email | Password |
| :--- | :--- | :--- |
| **MP / Admin Portal** | `admin@janswar.com` | `Admin@123` |
| **Demo Citizen Portal** | `demo@user.com` | `123456` |

---

## 🧪 Development & Testing (Local without Docker)

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

## 📁 Project Structure

```text
janswar-ai/
├── ai-service/        # Python FastAPI application for LLM processing
├── app/               # React Native / Expo Mobile Application
├── backend/           # Node.js/Express API, Prisma schema, Authentication
├── frontend/          # Next.js UI Web Application
├── docker-compose.yml # Main orchestration file for Web and Backend
└── README.md          # You are here!
```

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
