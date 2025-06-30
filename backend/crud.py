from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
import models, schemas
import json
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional

# --- Task CRUD ---
def get_tasks(db: Session, user_id: str):
    print(f"🔍 Getting tasks for user: {user_id}")
    try:
        tasks = db.query(models.Task).filter(models.Task.user_id == user_id).all()
        print(f"✅ Found {len(tasks)} tasks for user {user_id}")
        return tasks
    except Exception as e:
        print(f"❌ Error getting tasks for user {user_id}: {str(e)}")
        return []

def get_tasks_by_date_range(db: Session, user_id: str, start_date: str, end_date: str):
    """Get tasks within a specific date range for calendar view"""
    return db.query(models.Task).filter(
        and_(
            models.Task.user_id == user_id,
            models.Task.deleted == False,
            models.Task.due_date >= start_date,
            models.Task.due_date <= end_date
        )
    ).all()

def get_tasks_for_month(db: Session, user_id: str, year: int, month: int):
    """Get all tasks for a specific month"""
    start_date = f"{year:04d}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1:04d}-01-01"
    else:
        end_date = f"{year:04d}-{month + 1:02d}-01"
    
    return db.query(models.Task).filter(
        and_(
            models.Task.user_id == user_id,
            models.Task.deleted == False,
            models.Task.due_date >= start_date,
            models.Task.due_date < end_date
        )
    ).all()

def get_tasks_for_date(db: Session, user_id: str, target_date: str):
    """Get all tasks for a specific date"""
    return db.query(models.Task).filter(
        and_(
            models.Task.user_id == user_id,
            models.Task.deleted == False,
            models.Task.due_date == target_date
        )
    ).all()

def get_calendar_stats(db: Session, user_id: str, start_date: str, end_date: str):
    """Get calendar statistics for a date range"""
    tasks = get_tasks_by_date_range(db, user_id, start_date, end_date)
    
    stats = {
        'total_tasks': len(tasks),
        'overdue_tasks': 0,
        'completed_tasks': 0,
        'pending_tasks': 0,
        'in_progress_tasks': 0,
        'tasks_by_date': {}
    }
    
    today = datetime.now().date()
    
    for task in tasks:
        # Count by status
        if task.status == 'Completed':
            stats['completed_tasks'] += 1
        elif task.status == 'In Progress':
            stats['in_progress_tasks'] += 1
        elif task.status == 'Pending':
            stats['pending_tasks'] += 1
        
        # Check if overdue
        if task.due_date and task.status != 'Completed':
            try:
                due_date = datetime.strptime(task.due_date, '%Y-%m-%d').date()
                if due_date < today:
                    stats['overdue_tasks'] += 1
            except ValueError:
                pass
        
        # Count tasks by date
        if task.due_date:
            if task.due_date not in stats['tasks_by_date']:
                stats['tasks_by_date'][task.due_date] = 0
            stats['tasks_by_date'][task.due_date] += 1
    
    return stats

def get_overdue_tasks(db: Session, user_id: str):
    """Get all overdue tasks for a user"""
    today = datetime.now().date()
    return db.query(models.Task).filter(
        and_(
            models.Task.user_id == user_id,
            models.Task.deleted == False,
            models.Task.status != 'Completed',
            models.Task.due_date < today.isoformat()
        )
    ).all()

def get_upcoming_tasks(db: Session, user_id: str, days: int = 7):
    """Get upcoming tasks within specified days"""
    today = datetime.now().date()
    end_date = (today + timedelta(days=days)).isoformat()
    
    return db.query(models.Task).filter(
        and_(
            models.Task.user_id == user_id,
            models.Task.deleted == False,
            models.Task.status != 'Completed',
            models.Task.due_date >= today.isoformat(),
            models.Task.due_date <= end_date
        )
    ).order_by(models.Task.due_date).all()

def get_todays_tasks(db: Session, user_id: str):
    """Get all tasks due today"""
    today = datetime.now().date().isoformat()
    return get_tasks_for_date(db, user_id, today)

def get_tasks_by_status(db: Session, user_id: str, status: str):
    """Get all tasks with a specific status"""
    return db.query(models.Task).filter(
        and_(
            models.Task.user_id == user_id,
            models.Task.deleted == False,
            models.Task.status == status
        )
    ).all()

def create_task(db: Session, user_id: str, task: schemas.TaskCreate):
    try:
        # Use Pydantic v2 model_dump method
        data = task.model_dump()
        
        # Convert tags and subtasks to JSON strings if present
        if data.get('tags') is not None:
            data['tags'] = json.dumps(data['tags'])
        if data.get('subtasks') is not None:
            data['subtasks'] = json.dumps(data['subtasks'])
        
        db_task = models.Task(**data, user_id=user_id)
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task
    except Exception as e:
        print(f"Error in create_task: {str(e)}")
        print(f"Task object type: {type(task)}")
        print(f"Task object: {task}")
        raise

def update_task(db: Session, user_id: str, task_id: int, task: schemas.TaskUpdate):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == user_id).first()
    if not db_task:
        return None
    
    # Use Pydantic v2 model_dump method
    data = task.model_dump(exclude_unset=True)
    
    if data.get('tags') is not None:
        data['tags'] = json.dumps(data['tags'])
    if data.get('subtasks') is not None:
        data['subtasks'] = json.dumps(data['subtasks'])
    
    for k, v in data.items():
        setattr(db_task, k, v)
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, user_id: str, task_id: int):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == user_id).first()
    if not db_task:
        return False
    db_task.deleted = True
    db.commit()
    return True

# --- Profile CRUD ---
def get_profile(db: Session, user_id: str):
    return db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()

def update_profile(db: Session, user_id: str, data: schemas.UserProfileBase):
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    if not profile:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(profile, k, v)
    db.commit()
    db.refresh(profile)
    return profile