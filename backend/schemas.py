from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import date, datetime

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = 'Pending'
    reminder: Optional[datetime] = None
    tags: Optional[List[str]] = []
    subtasks: Optional[List[dict]] = []
    recurrence: Optional[str] = None
    priority: Optional[str] = 'Medium'
    position: Optional[int] = None
    deleted: Optional[bool] = False
    pinned: Optional[bool] = False
    user_email: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    pass

class TaskOut(TaskBase):
    id: int
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)

# AI-related schemas
class SmartSuggestion(BaseModel):
    type: str
    title: str
    reason: str
    confidence: float
    suggested_due_date: Optional[str] = None
    suggested_time: Optional[str] = None
    suggested_priority: Optional[str] = None
    recurrence: Optional[str] = None

class NaturalLanguageInput(BaseModel):
    text: str

class NaturalLanguageResult(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    priority: str = "Medium"
    tags: List[str] = []
    confidence: float

class AISuggestionsResponse(BaseModel):
    suggestions: List[SmartSuggestion]
    total_suggestions: int

class UserPatterns(BaseModel):
    day_of_week: dict[str, List[str]]
    task_titles: dict[str, int]
    recurring_patterns: dict[str, int]
    priority_patterns: dict[str, int]
    tags_patterns: dict[str, int]

# Calendar-specific schemas
class DateRange(BaseModel):
    start_date: str  # YYYY-MM-DD format
    end_date: str    # YYYY-MM-DD format

class CalendarTask(TaskBase):
    id: int
    created_at: str
    updated_at: str
    is_overdue: bool
    days_until_due: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class CalendarStats(BaseModel):
    total_tasks: int
    overdue_tasks: int
    completed_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    tasks_by_date: dict[str, int]  # Date -> count mapping

class BulkTaskUpdate(BaseModel):
    id: int
    updates: dict

class BulkUpdateResponse(BaseModel):
    updated_tasks: list[TaskOut]
    errors: list[dict]
    success_count: int
    error_count: int

class UserProfileBase(BaseModel):
    display_name: Optional[str] = None
    email: Optional[str] = None
    photo_url: Optional[str] = None
    theme_preference: Optional[str] = None
    language_preference: Optional[str] = None
    reminders_enabled: Optional[bool] = True

class UserProfileOut(UserProfileBase):
    user_id: str

    model_config = ConfigDict(from_attributes=True)

class Task(TaskBase):
    id: int
    user_id: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    deleted: Optional[bool]

    class Config:
        orm_mode = True