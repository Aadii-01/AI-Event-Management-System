from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import UserCreate, UserResponse, Token, UserLogin
from app.crud import get_user_by_email, create_user, get_role_by_name
from app.security import verify_password, create_access_token, get_current_user
from app.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email is already registered."
        )
    user = create_user(db, user_in=user_in)
    
    # Load role name to match response model
    role_name = user_in.role_name
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=role_name,
        created_at=user.created_at
    )

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Fetch user's role name
    role = user.role_rel.name if user.role_rel else "attendee"
    
    access_token = create_access_token(data={"sub": user.email, "role": role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role
    }

# Alternative JSON-payload login route for frontend convenience
@router.post("/login/json", response_model=Token)
def login_json(user_login: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_email(db, email=user_login.email)
    if not user or not verify_password(user_login.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    role = user.role_rel.name if user.role_rel else "attendee"
    access_token = create_access_token(data={"sub": user.email, "role": role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role
    }

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    role = current_user.role_rel.name if current_user.role_rel else "attendee"
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=role,
        created_at=current_user.created_at
    )
