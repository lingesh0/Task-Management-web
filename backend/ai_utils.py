import re
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from collections import defaultdict, Counter
import dateparser
from dateutil import parser as date_parser
from dateutil.relativedelta import relativedelta
import nltk
from nltk.tokenize import word_tokenize
from nltk.tag import pos_tag
from nltk.chunk import RegexpParser

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('taggers/averaged_perceptron_tagger')
except LookupError:
    nltk.download('averaged_perceptron_tagger')

class SmartTaskSuggestions:
    def __init__(self):
        self.patterns = {
            'weekly_review': ['weekly review', 'week review', 'review week'],
            'daily_check': ['daily check', 'daily review', 'morning check'],
            'monthly_report': ['monthly report', 'month report', 'monthly summary'],
            'meeting_prep': ['meeting prep', 'prepare meeting', 'meeting preparation'],
            'email_check': ['check email', 'email check', 'review emails'],
            'backup': ['backup', 'back up', 'data backup'],
            'exercise': ['exercise', 'workout', 'gym', 'fitness'],
            'reading': ['read', 'reading', 'study'],
            'planning': ['plan', 'planning', 'schedule'],
        }
    
    def analyze_user_patterns(self, tasks: List[Dict]) -> Dict:
        """Analyze user task patterns to generate smart suggestions"""
        if not tasks:
            return {}
        
        try:
            patterns = {
                'day_of_week': defaultdict(list),
                'time_of_day': defaultdict(list),
                'task_titles': Counter(),
                'recurring_patterns': defaultdict(int),
                'priority_patterns': defaultdict(int),
                'tags_patterns': defaultdict(int)
            }
            
            for task in tasks:
                try:
                    # Analyze day of week patterns
                    if task.get('due_date'):
                        try:
                            due_date = datetime.strptime(task['due_date'], '%Y-%m-%d')
                            day_name = due_date.strftime('%A')
                            patterns['day_of_week'][day_name].append(task.get('title', ''))
                        except (ValueError, TypeError):
                            pass
                    
                    # Analyze task title patterns
                    title = task.get('title', '').lower()
                    if title:
                        patterns['task_titles'][title] += 1
                    
                    # Analyze priority patterns
                    priority = task.get('priority', 'Medium')
                    if priority:
                        patterns['priority_patterns'][priority] += 1
                    
                    # Analyze tags patterns
                    if task.get('tags'):
                        for tag in task['tags']:
                            if tag:
                                patterns['tags_patterns'][tag.lower()] += 1
                    
                    # Detect recurring patterns
                    if task.get('recurrence'):
                        patterns['recurring_patterns'][task['recurrence']] += 1
                        
                except Exception as e:
                    print(f"⚠️ Error analyzing task pattern: {str(e)}")
                    continue
            
            return patterns
            
        except Exception as e:
            print(f"❌ Error in analyze_user_patterns: {str(e)}")
            return {}
    
    def generate_suggestions(self, user_patterns: Dict, current_date: datetime = None) -> List[Dict]:
        """Generate smart task suggestions based on user patterns"""
        try:
            if not current_date:
                current_date = datetime.now()
            
            suggestions = []
            
            # Suggest based on day of week patterns
            current_day = current_date.strftime('%A')
            day_tasks = user_patterns.get('day_of_week', {}).get(current_day, [])
            if day_tasks:
                for task_title in day_tasks[:3]:  # Top 3 tasks for this day
                    if task_title:
                        suggestions.append({
                            'type': 'day_pattern',
                            'title': task_title,
                            'reason': f"You usually set '{task_title}' on {current_day}s",
                            'confidence': 0.8,
                            'suggested_due_date': current_date.strftime('%Y-%m-%d')
                        })
            
            # Suggest based on recurring patterns
            recurring_patterns = user_patterns.get('recurring_patterns', {})
            for recurrence, count in recurring_patterns.items():
                if count >= 2:  # Only suggest if user has done this at least twice
                    suggestions.append({
                        'type': 'recurring_pattern',
                        'title': f"Recurring {recurrence} task",
                        'reason': f"You have {count} tasks with {recurrence} recurrence",
                        'confidence': 0.7,
                        'recurrence': recurrence
                    })
            
            # Suggest based on common task patterns
            task_titles = user_patterns.get('task_titles', {})
            if hasattr(task_titles, 'most_common'):
                common_tasks = task_titles.most_common(5)
                for task_title, count in common_tasks:
                    if count >= 2 and task_title:  # Only suggest if user has done this at least twice
                        priority_patterns = user_patterns.get('priority_patterns', {})
                        suggested_priority = 'Medium'
                        if hasattr(priority_patterns, 'most_common') and priority_patterns:
                            most_common_priority = priority_patterns.most_common(1)
                            if most_common_priority:
                                suggested_priority = most_common_priority[0][0]
                        
                        suggestions.append({
                            'type': 'frequent_task',
                            'title': task_title,
                            'reason': f"You've created this task {count} times before",
                            'confidence': 0.6,
                            'suggested_priority': suggested_priority
                        })
            
            # Suggest based on time-based patterns
            if current_date.hour < 12:
                suggestions.append({
                    'type': 'morning_routine',
                    'title': 'Morning Check-in',
                    'reason': 'Good time for daily planning and review',
                    'confidence': 0.5,
                    'suggested_time': '09:00'
                })
            
            return suggestions[:5]  # Return top 5 suggestions
            
        except Exception as e:
            print(f"❌ Error in generate_suggestions: {str(e)}")
            # Return default suggestions if there's an error
            return [
                {
                    'type': 'fallback',
                    'title': 'Create a new task',
                    'reason': 'Start organizing your day',
                    'confidence': 0.5,
                    'suggested_due_date': current_date.strftime('%Y-%m-%d') if current_date else datetime.now().strftime('%Y-%m-%d')
                }
            ]

class NaturalLanguageProcessor:
    def __init__(self):
        self.time_patterns = {
            'morning': ['morning', 'am', 'a.m.', 'early'],
            'afternoon': ['afternoon', 'pm', 'p.m.', 'midday'],
            'evening': ['evening', 'night', 'tonight', 'late'],
            'specific_times': r'(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?'
        }
        
        self.date_patterns = {
            'today': ['today', 'now', 'asap'],
            'tomorrow': ['tomorrow', 'tmr', 'tmrw'],
            'next_week': ['next week', 'following week'],
            'next_month': ['next month'],
            'weekend': ['weekend', 'sat', 'saturday', 'sun', 'sunday'],
            'specific_days': ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }
        
        self.priority_indicators = {
            'high': ['urgent', 'asap', 'important', 'critical', 'high priority'],
            'low': ['low priority', 'when possible', 'sometime', 'eventually']
        }
    
    def parse_natural_language(self, text: str) -> Dict:
        """Parse natural language input and extract task information"""
        text_lower = text.lower()
        
        # Initialize result
        result = {
            'title': '',
            'description': '',
            'due_date': None,
            'due_time': None,
            'priority': 'Medium',
            'tags': [],
            'confidence': 0.0
        }
        
        # Extract action/title
        action = self._extract_action(text)
        result['title'] = action
        
        # Extract date
        date_info = self._extract_date(text_lower)
        if date_info:
            result['due_date'] = date_info['date']
            result['due_time'] = date_info.get('time')
        
        # Extract priority
        priority = self._extract_priority(text_lower)
        if priority:
            result['priority'] = priority
        
        # Extract tags/keywords
        tags = self._extract_tags(text)
        if tags:
            result['tags'] = tags
        
        # Calculate confidence based on extracted information
        result['confidence'] = self._calculate_confidence(result)
        
        return result
    
    def _extract_action(self, text: str) -> str:
        """Extract the main action from the text"""
        # Remove common prefixes
        prefixes_to_remove = [
            'remind me to', 'remind me', 'please', 'can you', 'could you',
            'i need to', 'i want to', 'i should', 'i must', 'i have to'
        ]
        
        action = text.lower()
        for prefix in prefixes_to_remove:
            if action.startswith(prefix):
                action = action[len(prefix):].strip()
                break
        
        # Clean up the action
        action = action.strip()
        
        # Remove time/date references from the action
        time_date_patterns = [
            r'\b(today|tomorrow|next week|next month|morning|afternoon|evening|night)\b',
            r'\b(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?\b',
            r'\b(at|by|on|before|after)\b'
        ]
        
        for pattern in time_date_patterns:
            action = re.sub(pattern, '', action, flags=re.IGNORECASE)
        
        # Clean up extra spaces and punctuation
        action = re.sub(r'\s+', ' ', action).strip()
        action = re.sub(r'^\s*[.,;]\s*', '', action)
        action = re.sub(r'\s*[.,;]\s*$', '', action)
        
        # Capitalize first letter
        if action:
            action = action[0].upper() + action[1:]
        
        return action if action else "New Task"
    
    def _extract_date(self, text: str) -> Optional[Dict]:
        """Extract date and time information from text"""
        result = {}
        
        # Try to parse with dateparser first
        try:
            parsed_date = dateparser.parse(text, settings={'PREFER_DATES_FROM': 'future'})
            if parsed_date:
                result['date'] = parsed_date.strftime('%Y-%m-%d')
                result['time'] = parsed_date.strftime('%H:%M')
                return result
        except:
            pass
        
        # Manual pattern matching
        current_date = datetime.now()
        
        # Check for specific time patterns
        time_match = re.search(r'(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?', text, re.IGNORECASE)
        if time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2)) if time_match.group(2) else 0
            period = time_match.group(3).lower() if time_match.group(3) else ''
            
            # Convert to 24-hour format
            if period in ['pm', 'p.m.'] and hour != 12:
                hour += 12
            elif period in ['am', 'a.m.'] and hour == 12:
                hour = 0
            
            result['time'] = f"{hour:02d}:{minute:02d}"
        
        # Check for date patterns
        if any(word in text for word in self.date_patterns['today']):
            result['date'] = current_date.strftime('%Y-%m-%d')
        elif any(word in text for word in self.date_patterns['tomorrow']):
            tomorrow = current_date + timedelta(days=1)
            result['date'] = tomorrow.strftime('%Y-%m-%d')
        elif any(word in text for word in self.date_patterns['next_week']):
            next_week = current_date + timedelta(weeks=1)
            result['date'] = next_week.strftime('%Y-%m-%d')
        elif any(word in text for word in self.date_patterns['next_month']):
            next_month = current_date + relativedelta(months=1)
            result['date'] = next_month.strftime('%Y-%m-%d')
        elif any(word in text for word in self.date_patterns['weekend']):
            # Find next Saturday
            days_until_saturday = (5 - current_date.weekday()) % 7
            if days_until_saturday == 0:
                days_until_saturday = 7
            next_saturday = current_date + timedelta(days=days_until_saturday)
            result['date'] = next_saturday.strftime('%Y-%m-%d')
        
        return result if result else None
    
    def _extract_priority(self, text: str) -> Optional[str]:
        """Extract priority information from text"""
        for priority, indicators in self.priority_indicators.items():
            if any(indicator in text for indicator in indicators):
                return priority.title()
        return None
    
    def _extract_tags(self, text: str) -> List[str]:
        """Extract potential tags from text"""
        tags = []
        
        # Look for hashtags
        hashtags = re.findall(r'#(\w+)', text)
        tags.extend(hashtags)
        
        # Look for common task categories
        categories = {
            'work': ['work', 'job', 'office', 'meeting', 'report', 'presentation'],
            'personal': ['personal', 'family', 'home', 'house'],
            'health': ['exercise', 'workout', 'gym', 'health', 'doctor'],
            'finance': ['bill', 'payment', 'money', 'finance', 'budget'],
            'shopping': ['buy', 'purchase', 'shop', 'grocery', 'shopping'],
            'learning': ['study', 'learn', 'read', 'course', 'training']
        }
        
        for category, keywords in categories.items():
            if any(keyword in text for keyword in keywords):
                tags.append(category)
        
        return list(set(tags))  # Remove duplicates
    
    def _calculate_confidence(self, result: Dict) -> float:
        """Calculate confidence score for the parsed result"""
        confidence = 0.0
        
        # Base confidence for having a title
        if result['title'] and result['title'] != "New Task":
            confidence += 0.3
        
        # Confidence for having a date
        if result['due_date']:
            confidence += 0.3
        
        # Confidence for having a time
        if result['due_time']:
            confidence += 0.2
        
        # Confidence for having tags
        if result['tags']:
            confidence += 0.1
        
        # Confidence for having priority
        if result['priority'] != 'Medium':
            confidence += 0.1
        
        return min(confidence, 1.0)

# Initialize the processors
smart_suggestions = SmartTaskSuggestions()
nlp_processor = NaturalLanguageProcessor() 