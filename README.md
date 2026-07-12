# NeedStack AI

NeedStack AI is a modern, full-stack application designed to streamline problem reporting, clustering, and resolution. By leveraging artificial intelligence, it intelligently groups similar user-reported problems into clusters, allowing developers to efficiently identify and resolve high-impact issues.

## 🚀 Features

- **AI-Powered Problem Clustering:** Automatically groups similar user problems using Sentence Transformers and Scikit-Learn.
- **Role-Based Access Control:** Distinct dashboards and workflows for Users, Developers, and Admins.
- **Real-Time Communication:** Built-in WebSockets for instant messaging and collaboration.
- **Interactive Analytics:** Visualize problem trends, cluster confidences, and resolution rates.
- **Notifications System:** Real-time alerts for claims, messages, and problem resolutions.

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 15+ (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI
- **Database:** MongoDB (Motor Async Driver)
- **AI/ML:** Sentence Transformers, Scikit-Learn, Numpy
- **Authentication:** JWT (PyJWT), Bcrypt
- **Real-time:** WebSockets
- **Security:** Rate Limiting, CORS Middleware

## 📁 Project Structure

```text
needstack-ai/
├── frontend/       # Next.js frontend application
│   ├── app/        # App router pages (admin, developer, user, auth)
│   ├── components/ # Reusable React components (Shared, Admin, Developer, User)
│   ├── lib/        # API utilities and mock data
│   └── public/     # Static assets
└── backend/        # FastAPI backend application
    ├── routers/    # API endpoints (auth, problems, messages, analytics, etc.)
    ├── models/     # Pydantic & MongoDB models
    ├── services/   # Business logic and AI processing (ai_service.py, auth_service.py)
    ├── database/   # MongoDB connection setup
    └── middleware/ # Rate limiting and auth middleware
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- MongoDB instance

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your MongoDB URI and JWT secrets.
5. Run the development server:
   ```bash
   python run.py
   # or
   uvicorn main:app --reload --port 8002
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env.local` file and set `NEXT_PUBLIC_API_URL=http://localhost:8002`.
4. Run the development server:
   ```bash
   npm run dev
   ```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
