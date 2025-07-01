from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from auth import get_current_user
from models import Task
from datetime import datetime, timedelta
import numpy as np
from sklearn.linear_model import LinearRegression

router = APIRouter(prefix="/insights", tags=["insights"])

@router.get("/weekly-summary")
def get_weekly_summary(db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    """
    Returns a summary of tasks created and completed per day for the past week,
    and a status breakdown (Pending, Done, Overdue).
    """
    today = datetime.now().date()
    week_ago = today - timedelta(days=6)
    # Get all tasks for the user in the last 7 days
    tasks = db.query(Task).filter(
        Task.user_id == uid,
        Task.created_at >= week_ago,
        Task.created_at <= today + timedelta(days=1)
    ).all()
    # Aggregate by day
    summary = {}
    for i in range(7):
        day = week_ago + timedelta(days=i)
        day_str = day.strftime('%Y-%m-%d')
        summary[day_str] = {'created': 0, 'completed': 0}
    status_breakdown = {'Pending': 0, 'Done': 0, 'Overdue': 0}
    for task in tasks:
        created_day = task.created_at.date().strftime('%Y-%m-%d') if task.created_at else None
        completed_day = task.completed_at.date().strftime('%Y-%m-%d') if task.completed_at else None
        if created_day in summary:
            summary[created_day]['created'] += 1
        if completed_day in summary:
            summary[completed_day]['completed'] += 1
        # Status breakdown
        if task.status == 'Completed' or task.status == 'Done':
            status_breakdown['Done'] += 1
        elif task.due_date and task.status != 'Completed':
            try:
                due = datetime.strptime(task.due_date, '%Y-%m-%d').date()
                if due < today:
                    status_breakdown['Overdue'] += 1
                else:
                    status_breakdown['Pending'] += 1
            except Exception:
                status_breakdown['Pending'] += 1
        else:
            status_breakdown['Pending'] += 1
    return {
        'summary': summary,
        'status_breakdown': status_breakdown
    }

@router.get("/predict-completion")
def predict_completion_rate(db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    """
    Predicts the user's upcoming task completion rate using a linear regression model.
    """
    # Get all tasks for the user
    tasks = db.query(Task).filter(Task.user_id == uid).order_by(Task.created_at).all()
    if not tasks or len(tasks) < 2:
        return {"prediction": None, "message": "Not enough data to predict."}
    # Prepare data: x = day index, y = completed count
    days = {}
    for t in tasks:
        if t.completed_at:
            day = t.completed_at.date()
            days[day] = days.get(day, 0) + 1
    if not days:
        return {"prediction": 0, "message": "No completed tasks yet."}
    x = np.array([(d - min(days)).days for d in days.keys()]).reshape(-1, 1)
    y = np.array(list(days.values()))
    model = LinearRegression()
    model.fit(x, y)
    # Predict for next day
    next_day = (max(days) - min(days)).days + 1
    prediction = model.predict(np.array([[next_day]]))[0]
    return {"prediction": float(prediction), "history": list(zip([d.strftime('%Y-%m-%d') for d in days.keys()], y.tolist()))} 