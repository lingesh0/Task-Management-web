from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
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
    status = Column(String, default="Pending")
    user_id = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    reminder = Column(String, nullable=True)  # for AI Reminder Optimization
    recurrence = Column(String, nullable=True)  # for Smart Recurrence Predictor
    priority = Column(String, default='Medium')
    position = Column(Integer, nullable=True)
    deleted = Column(Boolean, default=False)
    pinned = Column(Boolean, default=False)
    user_email = Column(String, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    tags = Column(Text, nullable=True, default='[]')
    subtasks = Column(Text, nullable=True, default='[]')
    reminder_sent = Column(Boolean, default=False)
    overdue_reminder_sent = Column(Boolean, default=False)

class EmailLog(Base):
    __tablename__ = "email_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    email = Column(String)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String)  # e.g. 'success', 'failed'
    error = Column(Text, nullable=True)