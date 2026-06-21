# 🎓 QuizMaster Pro v2

> An industry-grade, full-stack MERN quiz platform with AI question generation, anti-cheat engine, gamification, certificates, leaderboards, and deep analytics.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, CSS Modules |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT |
| AI | Google Gemini 1.5 Flash |
| Charts | Recharts |
| Excel | SheetJS (xlsx) |
| Icons | React Icons |
| Notifications | React Hot Toast |

---

## ✨ Features

### 👨‍🏫 Faculty
- Create quizzes with full settings (duration, shuffle, access codes, etc.)
- Add questions **manually** with marks, negative marks, hints, explanations
- **AI question generation** via Google Gemini — topic → instant MCQs
- **Excel/CSV bulk import** with downloadable template
- Per-quiz **deep analytics** (question accuracy, score distribution, time trends)
- **Anti-cheat configuration** (tab-switch detection, copy-paste blocking, disqualification)
- Publish/unpublish with student notifications
- **Certificate issuance** for qualifying students
- Export results as CSV
- Faculty dashboard with performance charts

### 🎓 Student
- Browse quizzes with search, subject & difficulty filters
- Timed exam with **question navigator** & **flag system**
- **Anti-cheat monitoring** with live warning count
- Access-code protected quiz support
- Detailed result review with correct answers & explanations
- **Quiz feedback** (star rating + comment)
- **XP points, levels & badges** (gamification)
- **Global & per-quiz leaderboards**
- **Digital verifiable certificates**
- Personal analytics (subject breakdown, score trend, radar chart)
- Real-time notification bell
- Daily streak tracking

---

## ⚙️ Setup Instructions

### Prerequisites
- **Node.js v18+** → https://nodejs.org
- **MongoDB** → local install OR [MongoDB Atlas](https://mongodb.com/atlas) (free)
- **Gemini API Key** (free) → https://aistudio.google.com/app/apikey

---

### Step 1 — Extract & Enter Project
```bash
unzip QuizMaster-Pro-v2.zip
cd quizapp
```

### Step 2 — Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Open `backend/.env` and set your values:
```env
MONGODB_URI=mongodb://localhost:27017/quizmaster
JWT_SECRET=any_very_long_random_string_here
GEMINI_API_KEY=your_gemini_key_here
FRONTEND_URL=http://localhost:3000
```
Start backend:
```bash
npm run dev
# ✅ Running on http://localhost:5000
```

### Step 3 — Frontend Setup
Open a **new terminal**:
```bash
cd frontend
npm install
```
Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```
Start frontend:
```bash
npm start
# ✅ Opens at http://localhost:3000
```

### Step 4 — Use the App
1. Visit `http://localhost:3000`
2. Register as **Faculty** → create a quiz → add questions → publish
3. Open incognito → register as **Student** → take the quiz

---

## 🌐 Deployment

### Backend → [Render.com](https://render.com) (free tier)
1. Push to GitHub
2. New Web Service → Root Dir: `backend` · Start: `npm start`
3. Add env vars: `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `FRONTEND_URL`, `NODE_ENV=production`

### Frontend → [Vercel.com](https://vercel.com) (free)
1. New Project → Root Dir: `frontend`
2. Add env var: `REACT_APP_API_URL=https://your-backend.onrender.com/api`
3. Deploy

### Database → [MongoDB Atlas](https://mongodb.com/atlas) (free 512MB)
1. Create free cluster → get connection string
2. Network Access → Allow `0.0.0.0/0`
3. Use the Atlas URI as your `MONGODB_URI`

---

## 📊 Excel Import Format

| Column | Example |
|---|---|
| Question | What is 2+2? |
| Option A | 3 |
| Option B | 4 |
| Option C | 5 |
| Option D | 6 |
| Correct Answer | B |
| Explanation | Basic arithmetic |
| Marks | 1 |
| Difficulty | easy |

Download the template from the app: **Faculty → Edit Quiz → Excel/CSV tab → Download Template**

---

## 🔐 API Overview

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/quizzes` | Both | List quizzes |
| POST | `/api/quizzes` | Faculty | Create quiz |
| PATCH | `/api/quizzes/:id/publish` | Faculty | Toggle publish |
| POST | `/api/questions/bulk` | Faculty | Add questions |
| POST | `/api/ai/generate` | Faculty | Gemini AI generation |
| POST | `/api/upload/questions` | Faculty | Parse Excel/CSV |
| GET | `/api/upload/template` | Faculty | Download template |
| POST | `/api/attempts/start` | Student | Start quiz |
| POST | `/api/attempts/:id/submit` | Student | Submit quiz |
| POST | `/api/attempts/:id/anticheat` | Student | Log violation |
| GET | `/api/leaderboard/global` | Both | Global leaderboard |
| GET | `/api/analytics/quiz/:id` | Faculty | Deep analytics |
| GET | `/api/certificates/:attemptId` | Student | Get certificate |
| GET | `/api/certificates/verify/:id` | Public | Verify certificate |

---

Built with ❤️ · MERN Stack + Google Gemini AI · QuizMaster Pro v2
