from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import crud, schemas
import json
from sklearn.ensemble import RandomForestClassifier
import numpy as np
from datetime import datetime, date, timedelta
from typing import Optional, List
from models import EmailLog
import models
from utils.email import send_reminder_email
import asyncio
from firebase_admin import auth as firebase_auth
from fastapi import status
import logging

router = APIRouter(prefix="/tasks", tags=["tasks"])

def serialize_task(task):
    return {
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'due_date': task.due_date,
        'status': task.status,
        'priority': getattr(task, 'priority', 'Low'),
        'reminder': task.reminder,
        'tags': json.loads(task.tags) if task.tags else [],
        'subtasks': json.loads(task.subtasks) if task.subtasks else [],
        'recurrence': task.recurrence,
        'position': task.position,
        'deleted': task.deleted,
        'pinned': task.pinned,
        'created_at': task.created_at.isoformat() if task.created_at else None,
        'updated_at': task.updated_at.isoformat() if task.updated_at else None,
    }

def serialize_calendar_task(task):
    """Enhanced serialization for calendar view with overdue and days until due info"""
    base_data = serialize_task(task)
    
    # Calculate overdue status and days until due
    is_overdue = False
    days_until_due = None
    
    if task.due_date and task.status != 'Completed':
        try:
            due_date = datetime.strptime(task.due_date, '%Y-%m-%d').date()
            today = datetime.now().date()
            days_until_due = (due_date - today).days
            is_overdue = days_until_due < 0
        except ValueError:
            pass
    
    base_data.update({
        'is_overdue': is_overdue,
        'days_until_due': days_until_due
    })
    
    return base_data

@router.get("/", response_model=list[schemas.TaskOut])
def list_tasks(db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    tasks = crud.get_tasks(db, uid)
    # Only return non-deleted tasks
    return [serialize_task(t) for t in tasks if not getattr(t, 'deleted', False)]

@router.get("/calendar", response_model=list[schemas.CalendarTask])
def get_calendar_tasks(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    db: Session = Depends(get_db), 
    uid: str = Depends(get_current_user)
):
    """Get tasks for calendar view within a date range"""
    try:
        # Validate date format
        datetime.strptime(start_date, '%Y-%m-%d')
        datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    tasks = crud.get_tasks_by_date_range(db, uid, start_date, end_date)
    return [serialize_calendar_task(t) for t in tasks]

@router.get("/calendar/month/{year}/{month}", response_model=list[schemas.CalendarTask])
def get_monthly_tasks(
    year: int, 
    month: int, 
    db: Session = Depends(get_db), 
    uid: str = Depends(get_current_user)
):
    """Get all tasks for a specific month"""
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Invalid month. Must be 1-12")
    
    tasks = crud.get_tasks_for_month(db, uid, year, month)
    return [serialize_calendar_task(t) for t in tasks]

@router.get("/calendar/date/{target_date}", response_model=list[schemas.CalendarTask])
def get_tasks_for_date(
    target_date: str, 
    db: Session = Depends(get_db), 
    uid: str = Depends(get_current_user)
):
    """Get all tasks for a specific date"""
    try:
        datetime.strptime(target_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    tasks = crud.get_tasks_for_date(db, uid, target_date)
    return [serialize_calendar_task(t) for t in tasks]

@router.get("/calendar/stats", response_model=schemas.CalendarStats)
def get_calendar_stats(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    db: Session = Depends(get_db), 
    uid: str = Depends(get_current_user)
):
    """Get calendar statistics for a date range"""
    try:
        datetime.strptime(start_date, '%Y-%m-%d')
        datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    return crud.get_calendar_stats(db, uid, start_date, end_date)

@router.get("/overdue", response_model=list[schemas.CalendarTask])
def get_overdue_tasks(db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    """Get all overdue tasks for the user"""
    tasks = crud.get_overdue_tasks(db, uid)
    return [serialize_calendar_task(t) for t in tasks]

@router.get("/upcoming", response_model=list[schemas.CalendarTask])
def get_upcoming_tasks(
    days: int = Query(7, description="Number of days to look ahead"),
    db: Session = Depends(get_db), 
    uid: str = Depends(get_current_user)
):
    """Get upcoming tasks within specified days"""
    if days < 1 or days > 365:
        raise HTTPException(status_code=400, detail="Days must be between 1 and 365")
    
    tasks = crud.get_upcoming_tasks(db, uid, days)
    return [serialize_calendar_task(t) for t in tasks]

@router.get("/today", response_model=list[schemas.CalendarTask])
def get_todays_tasks(db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    """Get all tasks due today"""
    tasks = crud.get_todays_tasks(db, uid)
    return [serialize_calendar_task(t) for t in tasks]

@router.get("/status/{status}", response_model=list[schemas.CalendarTask])
def get_tasks_by_status(
    status: str, 
    db: Session = Depends(get_db), 
    uid: str = Depends(get_current_user)
):
    """Get all tasks with a specific status"""
    valid_statuses = ['Pending', 'In Progress', 'Completed', 'Archived']
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    tasks = crud.get_tasks_by_status(db, uid, status)
    return [serialize_calendar_task(t) for t in tasks]

@router.get("/history", response_model=list[schemas.TaskOut])
def task_history(db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    tasks = crud.get_tasks(db, uid)
    # Return completed or deleted tasks
    return [serialize_task(t) for t in tasks if getattr(t, 'deleted', False) or t.status == 'Completed']

@router.post("/", response_model=schemas.TaskOut)
async def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    t = crud.create_task(db, uid, task)
    user = db.query(models.UserProfile).filter(models.UserProfile.user_id == uid).first()
    print(f"Created task: {t.id}, reminder: {t.reminder}, reminder_sent: {t.reminder_sent}, user: {user.email if user else None}")
    # Always send a confirmation/reminder email on task creation
    if user and user.email:
        try:
            await send_reminder_email(user.email, user.display_name or user.email, [t])
            db.add(EmailLog(user_id=uid, email=user.email, status='success'))
            db.commit()
            print(f"Confirmation/reminder email sent and logged for {user.email}")
        except Exception as e:
            db.add(EmailLog(user_id=uid, email=user.email if user else None, status='failed', error=str(e)))
            db.commit()
            print(f"Failed to send confirmation/reminder: {e}")
    else:
        print("No confirmation/reminder sent: user or email missing.")
    # Existing logic for reminder field
    if t.reminder and not t.reminder_sent and user and user.email:
        try:
            reminder_dt = datetime.fromisoformat(t.reminder)
            if reminder_dt <= datetime.now():
                print(f"Attempting to send reminder email to {user.email} for task {t.id}")
                await send_reminder_email(user.email, user.display_name or user.email, [t])
                t.reminder_sent = True
                db.add(EmailLog(user_id=uid, email=user.email, status='success'))
                db.commit()
                print(f"Reminder email sent and logged for {user.email}")
        except Exception as e:
            db.add(EmailLog(user_id=uid, email=user.email if user else None, status='failed', error=str(e)))
            db.commit()
            print(f"Failed to send reminder: {e}")
    else:
        print("No reminder sent: missing reminder, already sent, or user/email missing.")
    # Broadcast task creation
    await notify_task_change('TASK_CREATED', task=t)
    return serialize_task(t)

@router.put("/{task_id}", response_model=schemas.TaskOut)
async def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    db_task = crud.update_task(db, uid, task_id, task)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    # Broadcast task update
    await notify_task_change('TASK_UPDATED', task=db_task)
    return serialize_task(db_task)

@router.delete("/{task_id}")
async def delete_task(task_id: int, db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    ok = crud.delete_task(db, uid, task_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Task not found")
    # Broadcast task deletion
    await notify_task_change('TASK_DELETED', task_id=task_id)
    return {"ok": True}

@router.post("/ai-prioritize")
def ai_prioritize(db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    tasks = crud.get_tasks(db, uid)
    # Only consider non-deleted tasks
    tasks = [t for t in tasks if not getattr(t, 'deleted', False)]
    if not tasks:
        return {}

    # Gather user task history for ML
    history = []
    labels = []
    for t in tasks:
        # Only use tasks with a set priority as training data
        if t.priority:
            features = [
                len(t.title) if t.title else 0,
                len(t.description) if t.description else 0,
                0 if not t.due_date else 1,
                len(json.loads(t.tags)) if t.tags else 0,
                len(json.loads(t.subtasks)) if t.subtasks else 0,
                1 if t.pinned else 0,
            ]
            history.append(features)
            labels.append(t.priority)
    # If not enough data, use rule-based fallback
    if len(history) < 5 or len(set(labels)) < 2:
        # Fallback: Suggest 'High' if due_date is soon, else 'Low'
        from datetime import datetime, timedelta
        suggestions = {}
        for t in tasks:
            if not t.due_date:
                suggestions[t.id] = 'Low'
                continue
            try:
                due = datetime.fromisoformat(t.due_date)
                days_left = (due - datetime.now()).days
                if days_left <= 1:
                    suggestions[t.id] = 'High'
                elif days_left <= 3:
                    suggestions[t.id] = 'Medium'
                else:
                    suggestions[t.id] = 'Low'
            except Exception:
                suggestions[t.id] = 'Low'
        return suggestions
    # ML-based suggestion
    clf = RandomForestClassifier()
    clf.fit(np.array(history), labels)
    suggestions = {}
    for t in tasks:
        features = [
            len(t.title) if t.title else 0,
            len(t.description) if t.description else 0,
            0 if not t.due_date else 1,
            len(json.loads(t.tags)) if t.tags else 0,
            len(json.loads(t.subtasks)) if t.subtasks else 0,
            1 if t.pinned else 0,
        ]
        pred = clf.predict([features])[0]
        suggestions[t.id] = pred
    return suggestions

@router.post("/bulk-update", response_model=schemas.BulkUpdateResponse)
def bulk_update_tasks(
    task_updates: list[schemas.BulkTaskUpdate],
    db: Session = Depends(get_db), 
    uid: str = Depends(get_current_user)
):
    """Bulk update multiple tasks - useful for calendar drag & drop operations"""
    updated_tasks = []
    errors = []
    
    for update_data in task_updates:
        task_id = update_data.id
        updates = update_data.updates
        
        try:
            # Create a TaskUpdate object from the updates
            task_update = schemas.TaskUpdate(**updates)
            updated_task = crud.update_task(db, uid, task_id, task_update)
            
            if updated_task:
                updated_tasks.append(serialize_task(updated_task))
            else:
                errors.append({"task_id": task_id, "error": "Task not found or access denied"})
                
        except Exception as e:
            errors.append({"task_id": task_id, "error": str(e)})
    
    return schemas.BulkUpdateResponse(
        updated_tasks=updated_tasks,
        errors=errors,
        success_count=len(updated_tasks),
        error_count=len(errors)
    )

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Helper function to broadcast task changes
async def notify_task_change(event_type: str, task=None, task_id=None):
    import json
    if event_type in ('TASK_CREATED', 'TASK_UPDATED') and task is not None:
        message = json.dumps({
            'type': event_type,
            'data': serialize_task(task)
        })
    elif event_type == 'TASK_DELETED' and task_id is not None:
        message = json.dumps({
            'type': event_type,
            'data': {'id': task_id}
        })
    else:
        return
    await manager.broadcast(message) 