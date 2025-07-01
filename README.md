# Task Management Web App

## Overview
This project is a full-stack Task Management Web Application featuring a modern React.js frontend (with Vite, i18n, and Lottie animations) and a robust FastAPI backend with SQLite and Alembic for database management. Firebase is used for authentication and Firestore for real-time database management. The app also includes AI-powered features to enhance productivity.

## Features
- User authentication with Firebase Authentication
- Real-time task management using Firestore
- CRUD operations for tasks
- Responsive, animated user interface (Lottie, Framer Motion)
- Route protection for secure access
- AI assistant for smart suggestions and natural language input
- Internationalization (i18n) with support for English, Hindi, and Tamil
- Analytics and data visualization (Recharts)
- Email reminders (backend)

## Project Structure
```
task-management-app/
├── alembic/                  # Alembic migrations for backend DB
├── backend/                  # FastAPI backend
│   ├── ai_utils.py           # AI features
│   ├── auth.py               # Auth logic
│   ├── crud.py               # CRUD operations
│   ├── database.py           # DB setup (SQLite)
│   ├── main.py               # FastAPI entrypoint
│   ├── models.py             # SQLAlchemy models
│   ├── routes/               # API routes
│   ├── schemas.py            # Pydantic schemas
│   └── ...
├── frontend/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── contexts/         # React contexts
│   │   ├── pages/            # App pages (Dashboard, Home, etc.)
│   │   ├── css/              # Styles
│   │   ├── locales/          # i18n translations
│   │   ├── firebase.js       # Firebase config
│   │   └── ...
│   ├── package.json          # Frontend dependencies
│   └── ...
├── firebase.json             # Firebase config
├── firestore.rules           # Firestore security rules
├── README.md                 # Project documentation
└── ...
```

## Frontend Setup
1. Navigate to the `frontend` directory:
   ```sh
   cd frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```

## Backend Setup
1. Navigate to the `backend` directory:
   ```sh
   cd backend
   ```
2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
3. Run Alembic migrations (for SQLite DB):
   ```sh
   alembic upgrade head
   ```
4. Start the FastAPI server:
   ```sh
   uvicorn main:app --reload
   ```

## Firebase Setup
- Configure Firebase in `frontend/src/firebase.js` with your project credentials.
- Place your Firebase service account JSON in the backend if using admin features.
- Use Firebase Emulator for local testing if desired.

## Deployment
- Deploy the frontend to Firebase Hosting:
  ```sh
  firebase login
  firebase init
  firebase deploy
  ```

## Key Dependencies
### Frontend
- React, Vite, react-router-dom, Firebase, Lottie, Framer Motion, i18next, recharts, react-beautiful-dnd, react-toastify

### Backend
- FastAPI, SQLAlchemy, Alembic, Pydantic, Uvicorn, Firebase Admin SDK

## Contributing
Feel free to fork the repository and submit pull requests for any improvements or features.

## License
This project is licensed under the MIT License.