from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine, SessionLocal
import models
from routes import tasks, profile

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(profile.router)