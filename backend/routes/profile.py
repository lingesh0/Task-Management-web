from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import crud, schemas

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("/", response_model=schemas.UserProfileOut)
def get_profile(db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    profile = crud.get_profile(db, uid)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.post("/", response_model=schemas.UserProfileOut)
def create_profile(data: schemas.UserProfileBase, db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    profile = crud.get_profile(db, uid)
    if profile:
        raise HTTPException(status_code=400, detail="Profile already exists")
    # Create new profile
    from models import UserProfile
    new_profile = UserProfile(
        user_id=uid,
        display_name=data.display_name,
        photo_url=data.photo_url,
        theme_preference=data.theme_preference,
        language_preference=data.language_preference,
        reminders_enabled=data.reminders_enabled
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile

@router.put("/", response_model=schemas.UserProfileOut)
def update_profile(data: schemas.UserProfileBase, db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    profile = crud.get_profile(db, uid)
    if not profile:
        # Upsert: create if not exists
        from models import UserProfile
        new_profile = UserProfile(
            user_id=uid,
            display_name=data.display_name,
            photo_url=data.photo_url,
            theme_preference=data.theme_preference,
            language_preference=data.language_preference,
            reminders_enabled=data.reminders_enabled
        )
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)
        return new_profile
    profile = crud.update_profile(db, uid, data)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile