from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine, SessionLocal
import models
from routes import tasks, profile, ai, chat
from routes.insights import router as insights_router
from routes.ai_assistant import router as ai_assistant_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Task Management API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Server is running"}

app.include_router(tasks.router)
app.include_router(profile.router)
app.include_router(ai.router)
app.include_router(insights_router)
app.include_router(ai_assistant_router)
app.include_router(chat.router)