from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import crud, schemas
import json
from sklearn.ensemble import RandomForestClassifier
import numpy as np

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

@router.get("/", response_model=list[schemas.TaskOut])
def list_tasks(db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    tasks = crud.get_tasks(db, uid)
    # Only return non-deleted tasks
    return [serialize_task(t) for t in tasks if not getattr(t, 'deleted', False)]

@router.get("/history", response_model=list[schemas.TaskOut])
def task_history(db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    tasks = crud.get_tasks(db, uid)
    # Return completed or deleted tasks
    return [serialize_task(t) for t in tasks if getattr(t, 'deleted', False) or t.status == 'Completed']

@router.post("/", response_model=schemas.TaskOut)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    t = crud.create_task(db, uid, task)
    return serialize_task(t)

@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    db_task = crud.update_task(db, uid, task_id, task)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return serialize_task(db_task)

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    ok = crud.delete_task(db, uid, task_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Task not found")
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