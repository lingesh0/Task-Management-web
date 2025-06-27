from pydantic import BaseModel
from typing import Optional

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None
    reminder: Optional[str] = None
    tags: Optional[list[str]] = None
    subtasks: Optional[list[dict]] = None  # Each subtask: {text: str, done: bool}
    recurrence: Optional[str] = None
    priority: Optional[str] = None
    position: Optional[int] = None
    deleted: Optional[bool] = False
    pinned: Optional[bool] = False

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    pass

class TaskOut(TaskBase):
    id: int
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True

class UserProfileBase(BaseModel):
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    theme_preference: Optional[str] = None
    language_preference: Optional[str] = None
    reminders_enabled: Optional[bool] = True

class UserProfileOut(UserProfileBase):
    user_id: str

    class Config:
        orm_mode = True