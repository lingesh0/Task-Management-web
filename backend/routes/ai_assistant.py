from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from models import Task
from datetime import datetime, timedelta
import os
import requests
import openai
from ai_utils import SmartTaskSuggestions, NaturalLanguageProcessor

router = APIRouter(prefix="/ai", tags=["ai"])

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# --- 1. AI Assistant Chatbot ---
@router.post("/assistant")
def ai_assistant_chat(
    message: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user)
):
    """
    AI Assistant chatbot: suggests subtasks, productivity summaries, etc.
    """
    # Try OpenAI GPT-4 first
    if OPENAI_API_KEY:
        try:
            openai.api_key = OPENAI_API_KEY
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[{"role": "system", "content": "You are a helpful productivity assistant."},
                          {"role": "user", "content": message}],
                max_tokens=256
            )
            return {"response": response.choices[0].message["content"]}
        except Exception as e:
            print(f"OpenAI error: {e}")
    # Fallback: Ollama local model
    if OLLAMA_API_URL:
        try:
            r = requests.post(f"{OLLAMA_API_URL}/api/chat", json={"model": "llama2", "messages": [{"role": "user", "content": message}]})
            if r.ok:
                return {"response": r.json().get("message", "AI response unavailable.")}
        except Exception as e:
            print(f"Ollama error: {e}")
    # Final fallback
    return {"response": "Sorry, the AI assistant is currently unavailable. Please try again later."}

# --- 2. Smart Scheduling ---
@router.post("/schedule-suggestion")
def smart_schedule_suggestion(
    task: dict = Body(...),
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user)
):
    """
    Suggests best time slots for a task based on priority, deadline, and user preferences.
    """
    # Rule-based: earlier slot for high priority, before deadline, prefer 10am-12pm
    priority = task.get("priority", "Medium")
    deadline = task.get("due_date")
    preferred_hours = [10, 11, 12, 14, 15, 16]  # Example: 10am-4pm
    now = datetime.now()
    if priority == "High":
        slot = now.replace(hour=10, minute=0, second=0, microsecond=0)
    elif deadline:
        try:
            due = datetime.strptime(deadline, "%Y-%m-%d")
            slot = due.replace(hour=11, minute=0, second=0, microsecond=0) - timedelta(days=1)
        except Exception:
            slot = now.replace(hour=14, minute=0, second=0, microsecond=0)
    else:
        slot = now.replace(hour=preferred_hours[0], minute=0, second=0, microsecond=0)
    return {"suggested_time": slot.strftime("%Y-%m-%d %H:%M")}

# --- 3. AI Summarization ---
@router.post("/summarize")
def ai_summarize(
    text: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user)
):
    """
    Summarizes long task descriptions using HuggingFace or OpenAI.
    """
    # Try HuggingFace first
    if HUGGINGFACE_API_KEY:
        try:
            api_url = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
            headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
            payload = {"inputs": text}
            r = requests.post(api_url, headers=headers, json=payload, timeout=20)
            if r.ok:
                summary = r.json()[0]["summary_text"]
                return {"summary": summary}
        except Exception as e:
            print(f"HuggingFace error: {e}")
    # Fallback: OpenAI
    if OPENAI_API_KEY:
        try:
            openai.api_key = OPENAI_API_KEY
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "system", "content": "Summarize the following text."},
                          {"role": "user", "content": text}],
                max_tokens=128
            )
            return {"summary": response.choices[0].message["content"]}
        except Exception as e:
            print(f"OpenAI error: {e}")
    return {"summary": "Sorry, summarization is currently unavailable."}

# --- 4. Smart Recurrence Predictor ---
@router.get("/recurrence-predict")
def smart_recurrence_predict(
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user)
):
    """
    Analyzes past tasks and suggests recurrence rules.
    """
    tasks = db.query(Task).filter(Task.user_id == uid).all()
    suggestions = []
    if not tasks:
        return {"recurrence": None, "message": "No tasks found."}
    # Use SmartTaskSuggestions to analyze patterns
    smart = SmartTaskSuggestions()
    patterns = smart.analyze_user_patterns([{
        'due_date': t.due_date,
        'title': t.title,
        'recurrence': t.recurrence
    } for t in tasks])
    # Suggest most common recurrence
    rec = None
    if patterns['recurring_patterns']:
        rec = max(patterns['recurring_patterns'], key=patterns['recurring_patterns'].get)
        suggestions.append({"recurrence": rec, "count": patterns['recurring_patterns'][rec]})
    return {"recurrence": rec, "suggestions": suggestions}

# --- 5. AI Reminder Optimization ---
@router.get("/optimize-reminder")
def ai_reminder_optimization(
    db: Session = Depends(get_db),
    uid: str = Depends(get_current_user)
):
    """
    Optimizes reminder timing based on user completion delays.
    """
    tasks = db.query(Task).filter(Task.user_id == uid).all()
    delays = []
    for t in tasks:
        if t.due_date and t.completed_at:
            try:
                due = datetime.strptime(t.due_date, "%Y-%m-%d")
                delay = (t.completed_at.date() - due).days
                delays.append(delay)
            except Exception:
                continue
    if not delays:
        return {"suggested_reminder": "No data"}
    avg_delay = sum(delays) / len(delays)
    # If user is often late, suggest earlier reminder
    if avg_delay > 1:
        suggestion = "Send reminder 2 days before due date."
    elif avg_delay > 0:
        suggestion = "Send reminder 1 day before due date."
    else:
        suggestion = "Current reminder timing is optimal."
    return {"suggested_reminder": suggestion, "average_delay_days": avg_delay} 