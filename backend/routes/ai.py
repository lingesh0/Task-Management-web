from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json
import traceback

from database import get_db
from auth import get_current_user
from crud import get_tasks, create_task as crud_create_task
from schemas import (
    SmartSuggestion, 
    NaturalLanguageInput, 
    NaturalLanguageResult, 
    AISuggestionsResponse,
    UserPatterns,
    TaskCreate
)
from ai_utils import smart_suggestions, nlp_processor

router = APIRouter(prefix="/ai", tags=["AI Features"])

def parse_tags(tags_str):
    """Parse tags from JSON string or comma-separated string"""
    if not tags_str:
        return []
    try:
        # Try to parse as JSON first
        return json.loads(tags_str)
    except (json.JSONDecodeError, TypeError):
        # Fall back to comma-separated
        return [tag.strip() for tag in tags_str.split(',') if tag.strip()]

@router.get("/suggestions/public")
async def get_public_suggestions():
    """Get default suggestions without authentication (for testing)"""
    try:
        print("🔍 Getting public suggestions...")
        
        default_suggestions = [
            {
                'type': 'welcome',
                'title': 'Create your first task',
                'reason': 'Start by creating a simple task to get familiar with the app',
                'confidence': 0.9,
                'suggested_due_date': datetime.now().strftime('%Y-%m-%d')
            },
            {
                'type': 'morning_routine',
                'title': 'Morning Check-in',
                'reason': 'Good time for daily planning and review',
                'confidence': 0.7,
                'suggested_time': '09:00'
            },
            {
                'type': 'common_task',
                'title': 'Review emails',
                'reason': 'Common daily task for most users',
                'confidence': 0.6,
                'suggested_priority': 'Medium'
            }
        ]
        
        print("✅ Public suggestions created successfully")
        return AISuggestionsResponse(
            suggestions=default_suggestions,
            total_suggestions=len(default_suggestions)
        )
    
    except Exception as e:
        print(f"❌ Error in get_public_suggestions: {str(e)}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")

@router.get("/suggestions", response_model=AISuggestionsResponse)
async def get_smart_suggestions(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get smart task suggestions based on user patterns"""
    try:
        print(f"🔍 Starting AI suggestions for user: {current_user}")
        
        # Get user's task history
        tasks = get_tasks(db, current_user)
        print(f"📊 Found {len(tasks)} tasks for user")
        
        # Convert SQLAlchemy objects to dictionaries
        task_dicts = []
        for task in tasks:
            try:
                task_dict = {
                    'title': task.title or '',
                    'due_date': task.due_date,
                    'priority': task.priority or 'Medium',
                    'tags': parse_tags(task.tags),
                    'recurrence': task.recurrence
                }
                task_dicts.append(task_dict)
            except Exception as e:
                print(f"⚠️ Error processing task {task.id}: {str(e)}")
                continue
        
        print(f"✅ Processed {len(task_dicts)} task dictionaries")
        
        # Handle case where user has no tasks
        if not task_dicts:
            print("📝 No tasks found, returning default suggestions")
            default_suggestions = [
                {
                    'type': 'welcome',
                    'title': 'Create your first task',
                    'reason': 'Start by creating a simple task to get familiar with the app',
                    'confidence': 0.9,
                    'suggested_due_date': datetime.now().strftime('%Y-%m-%d')
                },
                {
                    'type': 'morning_routine',
                    'title': 'Morning Check-in',
                    'reason': 'Good time for daily planning and review',
                    'confidence': 0.7,
                    'suggested_time': '09:00'
                },
                {
                    'type': 'common_task',
                    'title': 'Review emails',
                    'reason': 'Common daily task for most users',
                    'confidence': 0.6,
                    'suggested_priority': 'Medium'
                }
            ]
            return AISuggestionsResponse(
                suggestions=default_suggestions,
                total_suggestions=len(default_suggestions)
            )
        
        # Analyze user patterns
        print("🧠 Analyzing user patterns...")
        user_patterns = smart_suggestions.analyze_user_patterns(task_dicts)
        print(f"📈 User patterns analyzed: {list(user_patterns.keys())}")
        
        # Generate suggestions
        print("💡 Generating suggestions...")
        suggestions = smart_suggestions.generate_suggestions(user_patterns)
        print(f"✨ Generated {len(suggestions)} suggestions")
        
        # Ensure suggestions are properly formatted
        formatted_suggestions = []
        for suggestion in suggestions:
            try:
                formatted_suggestion = {
                    'type': suggestion.get('type', 'general'),
                    'title': suggestion.get('title', 'New Task'),
                    'reason': suggestion.get('reason', 'Based on your patterns'),
                    'confidence': suggestion.get('confidence', 0.5),
                    'suggested_due_date': suggestion.get('suggested_due_date'),
                    'suggested_time': suggestion.get('suggested_time'),
                    'suggested_priority': suggestion.get('suggested_priority'),
                    'recurrence': suggestion.get('recurrence')
                }
                formatted_suggestions.append(formatted_suggestion)
            except Exception as e:
                print(f"⚠️ Error formatting suggestion: {str(e)}")
                continue
        
        print(f"🎯 Returning {len(formatted_suggestions)} formatted suggestions")
        
        return AISuggestionsResponse(
            suggestions=formatted_suggestions,
            total_suggestions=len(formatted_suggestions)
        )
    
    except Exception as e:
        print(f"❌ Error in get_smart_suggestions: {str(e)}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")

@router.post("/parse-natural-language", response_model=NaturalLanguageResult)
async def parse_natural_language(
    input_data: NaturalLanguageInput,
    current_user: str = Depends(get_current_user)
):
    """Parse natural language input and extract task information"""
    try:
        # Parse the natural language input
        result = nlp_processor.parse_natural_language(input_data.text)
        
        return NaturalLanguageResult(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse natural language: {str(e)}")

@router.get("/user-patterns", response_model=UserPatterns)
async def get_user_patterns(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analyzed user patterns for debugging and insights"""
    try:
        # Get user's task history
        tasks = get_tasks(db, current_user)
        
        # Convert SQLAlchemy objects to dictionaries
        task_dicts = []
        for task in tasks:
            task_dict = {
                'title': task.title,
                'due_date': task.due_date,
                'priority': task.priority,
                'tags': parse_tags(task.tags),
                'recurrence': task.recurrence
            }
            task_dicts.append(task_dict)
        
        # Analyze user patterns
        user_patterns = smart_suggestions.analyze_user_patterns(task_dicts)
        
        # Convert defaultdict to regular dict for JSON serialization
        patterns = {
            'day_of_week': dict(user_patterns.get('day_of_week', {})),
            'task_titles': dict(user_patterns.get('task_titles', {})),
            'recurring_patterns': dict(user_patterns.get('recurring_patterns', {})),
            'priority_patterns': dict(user_patterns.get('priority_patterns', {})),
            'tags_patterns': dict(user_patterns.get('tags_patterns', {}))
        }
        
        return UserPatterns(**patterns)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze user patterns: {str(e)}")

@router.post("/create-from-natural-language")
async def create_task_from_natural_language(
    input_data: NaturalLanguageInput,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a task directly from natural language input"""
    try:
        # Parse the natural language input
        parsed_result = nlp_processor.parse_natural_language(input_data.text)
        
        # Create task data with proper validation
        task_data_dict = {
            'title': parsed_result['title'],
            'description': parsed_result.get('description'),
            'due_date': parsed_result.get('due_date'),
            'priority': parsed_result.get('priority', 'Medium'),
            'tags': parsed_result.get('tags', []),
            'status': 'Pending'
        }
        
        # Remove None values to avoid validation issues
        task_data_dict = {k: v for k, v in task_data_dict.items() if v is not None}
        
        # Create TaskCreate object
        task_data = TaskCreate(**task_data_dict)
        
        # If time is specified, set it as reminder
        if parsed_result.get('due_time'):
            if parsed_result.get('due_date'):
                reminder_datetime = f"{parsed_result['due_date']}T{parsed_result['due_time']}"
                task_data.reminder = reminder_datetime
        
        # Create the task using the aliased function
        created_task = crud_create_task(db, current_user, task_data)
        
        # Convert the created task to a response format
        task_response = {
            'id': created_task.id,
            'title': created_task.title,
            'description': created_task.description,
            'due_date': created_task.due_date,
            'status': created_task.status,
            'priority': created_task.priority,
            'tags': parse_tags(created_task.tags),
            'reminder': created_task.reminder,
            'created_at': created_task.created_at.isoformat() if created_task.created_at else None,
            'updated_at': created_task.updated_at.isoformat() if created_task.updated_at else None
        }
        
        return {
            "message": "Task created successfully from natural language input",
            "task": task_response,
            "parsed_data": parsed_result,
            "confidence": parsed_result['confidence']
        }
    
    except Exception as e:
        import traceback
        print(f"Error creating task: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

@router.get("/test")
async def test_ai_endpoint():
    """Test endpoint to verify AI routes are working"""
    return {"message": "AI routes are working!", "status": "success"} 