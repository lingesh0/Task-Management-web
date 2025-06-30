from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from database import Base

class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    display_name = Column(String)
    email = Column(String)
    photo_url = Column(String)
    theme_preference = Column(String)
    language_preference = Column(String, nullable=True)
    reminders_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    due_date = Column(String)
    status = Column(String)
    user_id = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    reminder = Column(DateTime, nullable=True)
    tags = Column(Text, nullable=True)  # JSON string or comma-separated
    subtasks = Column(Text, nullable=True)  # JSON string
    recurrence = Column(String, nullable=True)
    priority = Column(String, default='Medium')
    position = Column(Integer, nullable=True)
    deleted = Column(Boolean, default=False)
    pinned = Column(Boolean, default=False)
    user_email = Column(String, nullable=True)