from fastapi import FastAPI, WebSocket, WebSocketDisconnect, status, Request
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine, SessionLocal
import models
from routes.tasks import router as tasks_router, manager
from routes.profile import router as profile_router
from routes.ai import router as ai_router
from routes.chat import router as chat_router
from routes.insights import router as insights_router
from routes.ai_assistant import router as ai_assistant_router
from utils.email import send_reminder_email
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from models import EmailLog, UserProfile, Task
import asyncio
import traceback
import logging
from firebase_admin import auth as firebase_auth
from datetime import datetime, timedelta, time as dt_time
from sqlalchemy import and_, or_
from threading import Lock

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

daily_email_count = {'count': 0, 'date': datetime.now().date()}
daily_email_lock = Lock()
EMAIL_DAILY_LIMIT = 300

def can_send_email():
    with daily_email_lock:
        today = datetime.now().date()
        if daily_email_count['date'] != today:
            daily_email_count['date'] = today
            daily_email_count['count'] = 0
        if daily_email_count['count'] < EMAIL_DAILY_LIMIT:
            daily_email_count['count'] += 1
            return True
        else:
            return False

@app.get("/")
async def root():
    return {"message": "Task Management API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Server is running"}

app.include_router(tasks_router)
app.include_router(profile_router)
app.include_router(ai_router)
app.include_router(insights_router)
app.include_router(ai_assistant_router)
app.include_router(chat_router)

print("[DEBUG] Routers registered")

@app.websocket("/ws/tasks")
async def websocket_endpoint(websocket: WebSocket):
    print("[DEBUG] WebSocket handler reached")
    token = websocket.query_params.get('token')
    if not token:
        logging.error("WebSocket connection rejected: No token provided.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        uid = decoded_token["uid"]
    except Exception as e:
        logging.error(f"WebSocket token verification failed: {e}, token: {token[:30]}...")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep the connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)

def get_users_with_pending_reminders(db: Session):
    users = db.query(UserProfile).all()
    result = []
    from datetime import datetime, timedelta
    now = datetime.now()
    window_start = now - timedelta(minutes=5)
    for user in users:
        tasks = db.query(Task).filter(
            Task.user_id == user.user_id,
            Task.status != 'Completed',
            Task.deleted == False,
            Task.reminder != None,
            Task.reminder_sent == False
        ).all()
        due_reminders = []
        for t in tasks:
            try:
                reminder_dt = datetime.fromisoformat(t.reminder)
                if window_start <= reminder_dt <= now:
                    due_reminders.append(t)
            except Exception as e:
                logger.error(f"Error parsing reminder datetime for task {t.id}: {e}")
                continue
        if due_reminders:
            result.append((user, due_reminders))
    return result

async def send_all_reminders():
    from database import SessionLocal
    db = SessionLocal()
    try:
        users_tasks = get_users_with_pending_reminders(db)
        for user, tasks in users_tasks:
            try:
                await send_reminder_email(user.email, user.display_name or user.email, tasks)
                for t in tasks:
                    t.reminder_sent = True
                log = EmailLog(user_id=user.user_id, email=user.email, status='success')
                logger.info(f"Reminder email sent to {user.email} for {len(tasks)} tasks.")
            except Exception as e:
                log = EmailLog(user_id=user.user_id, email=user.email, status='failed', error=str(e))
                logger.error(f"Failed to send reminder to {user.email}: {e}\n{traceback.format_exc()}")
            db.add(log)
        db.commit()
    finally:
        db.close()

async def send_daily_summary_reminders():
    from database import SessionLocal
    db = SessionLocal()
    try:
        users = db.query(UserProfile).all()
        today = datetime.now().date()
        logger.info(f"[DailySummary] Processing {len(users)} users for daily summary reminders.")
        for user in users:
            if not user.email:
                logger.warning(f"[DailySummary] Skipping user {user.user_id} (no email)")
                continue
            # Find all due today or overdue and not completed, not deleted
            tasks = db.query(Task).filter(
                Task.user_id == user.user_id,
                Task.status != 'Completed',
                Task.deleted == False,
                Task.due_date != None
            ).all()
            due_tasks = []
            for t in tasks:
                try:
                    due_date = datetime.strptime(t.due_date, '%Y-%m-%d').date()
                    if due_date <= today:
                        due_tasks.append(t)
                        logger.info(f"[DailySummary] User {user.email}: Task '{t.title}' (due {t.due_date}) included in summary.")
                except Exception as e:
                    logger.error(f"[DailySummary] Error parsing due_date for task {t.id}: {e}")
                    continue
            if due_tasks:
                if can_send_email():
                    try:
                        await send_reminder_email(user.email, user.display_name or user.email, due_tasks)
                        logger.info(f"[DailySummary] Daily summary email sent to {user.email} for {len(due_tasks)} tasks.")
                    except Exception as e:
                        logger.error(f"[DailySummary] Failed to send daily summary to {user.email}: {e}\n{traceback.format_exc()}")
                else:
                    logger.warning(f"[DailySummary] Daily email limit reached. Skipping email to {user.email}.")
            else:
                logger.info(f"[DailySummary] No due/overdue tasks for user {user.email}.")
    finally:
        db.close()

async def send_overdue_reminders():
    from database import SessionLocal
    db = SessionLocal()
    try:
        users = db.query(UserProfile).all()
        now = datetime.now().date()
        for user in users:
            if not user.email:
                continue
            # Find tasks that just became overdue and haven't had an overdue reminder sent
            tasks = db.query(Task).filter(
                Task.user_id == user.user_id,
                Task.status != 'Completed',
                Task.deleted == False,
                Task.due_date != None,
                or_(Task.overdue_reminder_sent == False, Task.overdue_reminder_sent == None)
            ).all()
            overdue_tasks = []
            for t in tasks:
                try:
                    due_date = datetime.strptime(t.due_date, '%Y-%m-%d').date()
                    if due_date < now:
                        overdue_tasks.append(t)
                except Exception:
                    continue
            if overdue_tasks:
                if can_send_email():
                    try:
                        await send_reminder_email(user.email, user.display_name or user.email, overdue_tasks)
                        for t in overdue_tasks:
                            t.overdue_reminder_sent = True
                        db.commit()
                        logger.info(f"[OverdueReminder] Overdue reminder sent to {user.email} for {len(overdue_tasks)} tasks.")
                    except Exception as e:
                        logger.error(f"[OverdueReminder] Failed to send overdue reminder to {user.email}: {e}\n{traceback.format_exc()}")
                else:
                    logger.warning(f"[OverdueReminder] Daily email limit reached. Skipping email to {user.email}.")
    finally:
        db.close()

def schedule_reminders():
    scheduler = BackgroundScheduler()
    def run_async():
        asyncio.run(send_all_reminders())
    scheduler.add_job(run_async, 'interval', minutes=5)
    # Add daily summary jobs
    def run_daily_summary():
        asyncio.run(send_daily_summary_reminders())
    scheduler.add_job(run_daily_summary, 'cron', hour=8, minute=0)
    scheduler.add_job(run_daily_summary, 'cron', hour=10, minute=0)
    scheduler.add_job(run_daily_summary, 'cron', hour=12, minute=0)
    scheduler.add_job(run_daily_summary, 'cron', hour=13, minute=0)
    scheduler.add_job(run_daily_summary, 'cron', hour=14, minute=0)
    scheduler.add_job(run_daily_summary, 'cron', hour=17, minute=0)
    scheduler.add_job(run_daily_summary, 'cron', hour=20, minute=0)
    scheduler.add_job(run_daily_summary, 'cron', hour=21, minute=0)
    # Add overdue reminder job
    def run_overdue_reminders():
        asyncio.run(send_overdue_reminders())
    scheduler.add_job(run_overdue_reminders, 'interval', minutes=5)
    scheduler.start()
    logger.info("Reminder scheduler started. Running every 5 minutes, daily summaries at 8:00 AM/2:00 PM/8:00 PM, and overdue reminders every 5 minutes.")

schedule_reminders()

# --- Test endpoint for daily summary ---
@app.post("/test/daily-summary")
async def test_daily_summary(request: Request):
    logger.info("[Test] Manual trigger of daily summary reminders.")
    await send_daily_summary_reminders()
    return {"status": "ok", "message": "Daily summary triggered."}