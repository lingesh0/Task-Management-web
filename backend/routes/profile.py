from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import crud, schemas
import firebase_admin
from firebase_admin import auth

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
        email=data.email,
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
            email=data.email,
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

@router.put("/email", response_model=schemas.UserProfileOut)
def update_email(data: schemas.UserProfileBase, db: Session = Depends(get_db), uid: str = Depends(get_current_user)):
    """Update user email in both Firebase and local database"""
    if not data.email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    try:
        # Update email in Firebase
        auth.update_user(uid, email=data.email, email_verified=False)
        
        # Update email in local database
        profile = crud.get_profile(db, uid)
        if not profile:
            # Create profile if it doesn't exist
            from models import UserProfile
            new_profile = UserProfile(
                user_id=uid,
                email=data.email,
                display_name=data.display_name or "",
                photo_url=data.photo_url or "",
                theme_preference=data.theme_preference or "light",
                language_preference=data.language_preference or "en",
                reminders_enabled=data.reminders_enabled if data.reminders_enabled is not None else True
            )
            db.add(new_profile)
            db.commit()
            db.refresh(new_profile)
            return new_profile
        else:
            # Update existing profile
            profile.email = data.email
            if data.display_name is not None:
                profile.display_name = data.display_name
            if data.photo_url is not None:
                profile.photo_url = data.photo_url
            if data.theme_preference is not None:
                profile.theme_preference = data.theme_preference
            if data.language_preference is not None:
                profile.language_preference = data.language_preference
            if data.reminders_enabled is not None:
                profile.reminders_enabled = data.reminders_enabled
            
            db.commit()
            db.refresh(profile)
            return profile
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update email: {str(e)}")