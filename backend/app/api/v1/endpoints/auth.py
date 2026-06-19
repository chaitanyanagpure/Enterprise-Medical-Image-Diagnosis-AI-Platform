from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any

from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.api import deps
from app.schemas import user as user_schemas
from app.repositories.user import user_repo
from app.models.user import User
from app.models.audit import AuditLog

router = APIRouter()

def log_audit(db: Session, user_id: Any, action: str, status_str: str, details: str) -> None:
    try:
        log = AuditLog(
            user_id=user_id,
            action=action,
            status=status_str,
            details=details
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()

@router.post("/signup", response_model=user_schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def signup(
    *,
    db: Session = Depends(get_db),
    user_in: user_schemas.SignupRequest
) -> Any:
    user = user_repo.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username/email already exists in the system.",
        )
    
    hashed_password = security.get_password_hash(user_in.password)
    db_obj = User(
        email=user_in.email,
        password_hash=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role
    )
    new_user = user_repo.create(db, obj_in=db_obj)
    log_audit(db, new_user.id, "SIGNUP", "SUCCESS", f"User registered: {new_user.email}")
    return new_user

@router.post("/login", response_model=user_schemas.Token)
def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    user = user_repo.get_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.password_hash):
        log_audit(db, user.id if user else None, "LOGIN", "FAILURE", f"Failed login attempt for email: {form_data.username}")
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(user.email, expires_delta=access_token_expires)
    
    log_audit(db, user.id, "LOGIN", "SUCCESS", f"User logged in: {user.email}")
    return {
        "access_token": token,
        "token_type": "bearer",
    }

@router.get("/me", response_model=user_schemas.UserResponse)
def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return current_user

@router.put("/me", response_model=user_schemas.UserResponse)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: user_schemas.UserUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if user_in.password:
        user_in.password = security.get_password_hash(user_in.password)
        # Update field name to password_hash
        user_data = user_in.model_dump(exclude_unset=True)
        user_data["password_hash"] = user_data.pop("password")
    else:
        user_data = user_in.model_dump(exclude_unset=True)
        
    updated_user = user_repo.update(db, db_obj=current_user, obj_in=user_data)
    log_audit(db, current_user.id, "PROFILE_UPDATE", "SUCCESS", f"User profile updated: {current_user.email}")
    return updated_user

@router.post("/forgot-password")
def forgot_password(
    *,
    db: Session = Depends(get_db),
    req: user_schemas.PasswordResetRequest
) -> Any:
    user = user_repo.get_by_email(db, email=req.email)
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
        
    # In a real app, generate a secure token and send email.
    # For demo, return a success code indicating reset link sent.
    log_audit(db, user.id, "PASSWORD_RESET_REQUEST", "SUCCESS", f"Password reset link requested for: {user.email}")
    return {"message": "Password reset link sent to registered email address"}

@router.post("/reset-password")
def reset_password(
    *,
    db: Session = Depends(get_db),
    req: user_schemas.PasswordResetConfirm
) -> Any:
    # Simulating token check
    if not req.token or len(req.token) < 10:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    # For demo, parse the email or look up a user
    # Let's say the token contains user email or we reset the admin account for demonstration.
    email = security.decode_access_token(req.token)
    if not email:
         raise HTTPException(status_code=400, detail="Token decoding failed or expired")
         
    user = user_repo.get_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    hashed_password = security.get_password_hash(req.new_password)
    user_repo.update(db, db_obj=user, obj_in={"password_hash": hashed_password})
    log_audit(db, user.id, "PASSWORD_RESET_CONFIRM", "SUCCESS", f"Password reset completed for user: {user.email}")
    return {"message": "Password has been reset successfully"}
