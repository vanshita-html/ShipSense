import time
import logging
from datetime import datetime, timezone
from collections import defaultdict
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.models.user import User
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    ForgotPasswordRequest,
    ChangePasswordRequest
)
from app.api.deps import get_current_user

logger = logging.getLogger("ShipSenseAuth")
router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory simple rate limiting for login protection (5 attempts per 60s per IP)
login_attempts: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
MAX_LOGIN_ATTEMPTS = 5

def check_login_rate_limit(client_ip: str):
    now = time.time()
    attempts = [t for t in login_attempts[client_ip] if now - t < RATE_LIMIT_WINDOW]
    login_attempts[client_ip] = attempts
    if len(attempts) >= MAX_LOGIN_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please wait 60 seconds before trying again."
        )

def record_failed_attempt(client_ip: str):
    login_attempts[client_ip].append(time.time())

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, response: Response, db: Session = Depends(get_db)):
    """Register a new user account (Operations Manager or Analyst)."""
    # Check if email is already taken
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this corporate email address already exists."
        )
    
    # Hash password with bcrypt
    hashed_pwd = get_password_hash(payload.password)
    
    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        hashed_password=hashed_pwd,
        role=payload.role,
        company_name=payload.company_name.strip() if payload.company_name else None,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Issue tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # Set httpOnly cookies
    response.set_cookie(
        key="shipsense_access_token",
        value=access_token,
        httponly=True,
        max_age=60 * 60 * 24, # 24h
        samesite="lax",
        secure=False # set to True in production HTTPS
    )
    response.set_cookie(
        key="shipsense_refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=60 * 60 * 24 * 7, # 7 days
        samesite="lax",
        secure=False
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    """Authenticate with corporate email and password."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    check_login_rate_limit(client_ip)

    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials."
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account has been deactivated. Please contact support."
        )

    # Reset attempts on success
    if client_ip in login_attempts:
        login_attempts[client_ip] = []

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # Set httpOnly cookies
    response.set_cookie(
        key="shipsense_access_token",
        value=access_token,
        httponly=True,
        max_age=60 * 60 * 24,
        samesite="lax",
        secure=False
    )
    response.set_cookie(
        key="shipsense_refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=60 * 60 * 24 * 7,
        samesite="lax",
        secure=False
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/logout")
def logout(response: Response):
    """Clear session tokens and httpOnly cookies."""
    response.delete_cookie(key="shipsense_access_token")
    response.delete_cookie(key="shipsense_refresh_token")
    return {"message": "Successfully logged out of ShipSense."}

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    """Refresh an access token using a valid refresh token."""
    refresh_tok = request.cookies.get("shipsense_refresh_token")
    if not refresh_tok:
        # Check header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            refresh_tok = auth_header.split(" ")[1]
            
    if not refresh_tok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing."
        )

    payload = decode_token(refresh_tok)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive."
        )

    new_access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)

    response.set_cookie(
        key="shipsense_access_token",
        value=new_access_token,
        httponly=True,
        max_age=60 * 60 * 24,
        samesite="lax",
        secure=False
    )
    response.set_cookie(
        key="shipsense_refresh_token",
        value=new_refresh_token,
        httponly=True,
        max_age=60 * 60 * 24 * 7,
        samesite="lax",
        secure=False
    )

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Return the profile of the authenticated user."""
    return UserResponse.model_validate(current_user)

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change the authenticated user's password."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password entered is incorrect."
        )
    
    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Password updated successfully."}

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Simulate password reset by logging a reset token link to console.
    Safe against user enumeration.
    """
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if user:
        reset_token = create_access_token(user.id)
        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
        logger.warning(f"\n==================================================")
        logger.warning(f"[PASSWORD RESET STUB] For: {user.email}")
        logger.warning(f"[RESET LINK]: {reset_link}")
        logger.warning(f"==================================================\n")
        print(f"\n>>> [ShipSense AUTH] Password Reset Link for {user.email}: {reset_link}\n", flush=True)
    
    return {"message": "If an account with this email exists, a password reset link has been dispatched to the server logs."}
