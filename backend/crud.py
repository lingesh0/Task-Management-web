from sqlalchemy.orm import Session
import models, schemas
import json

# --- Task CRUD ---
def get_tasks(db: Session, user_id: str):
    return db.query(models.Task).filter(models.Task.user_id == user_id).all()

def create_task(db: Session, user_id: str, task: schemas.TaskCreate):
    data = task.dict()
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

def update_task(db: Session, user_id: str, task_id: int, task: schemas.TaskUpdate):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == user_id).first()
    if not db_task:
        return None
    data = task.dict(exclude_unset=True)
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
    for k, v in data.dict(exclude_unset=True).items():
        setattr(profile, k, v)
    db.commit()
    db.refresh(profile)
    return profile