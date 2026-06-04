from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models import User, Role, SystemSetting
from app.schemas import UserResponse, UserChangeRole, SystemSettingResponse, AIConfigUpdate
from app.security import RoleChecker
from app.crud import get_users, get_user_by_id, update_user_role, set_system_setting, get_system_setting

router = APIRouter(prefix="/admin", tags=["Platform Administration"])

# Protect all routes under this router for Admin role
admin_dependency = Depends(RoleChecker(["admin"]))

@router.get("/users", response_model=List[UserResponse])
def list_platform_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = admin_dependency,
    db: Session = Depends(get_db)
):
    users = get_users(db, skip=skip, limit=limit)
    response_users = []
    for u in users:
        role_name = u.role_rel.name if u.role_rel else "attendee"
        response_users.append(
            UserResponse(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                role=role_name,
                created_at=u.created_at
            )
        )
    return response_users

@router.put("/users/{user_id}/role", response_model=UserResponse)
def change_user_role(
    user_id: str,
    role_change: UserChangeRole,
    current_user: User = admin_dependency,
    db: Session = Depends(get_db)
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    updated_user = update_user_role(db, user=user, role_name=role_change.role_name)
    return UserResponse(
        id=updated_user.id,
        email=updated_user.email,
        full_name=updated_user.full_name,
        role=role_change.role_name,
        created_at=updated_user.created_at
    )

@router.get("/settings", response_model=Dict[str, Any])
def get_ai_settings(
    current_user: User = admin_dependency,
    db: Session = Depends(get_db)
):
    provider = get_system_setting(db, "active_ai_provider")
    groq_key = get_system_setting(db, "groq_api_key")
    hf_key = get_system_setting(db, "hf_api_key")
    
    return {
        "primary_provider": provider.value if provider else "groq",
        "groq_api_key": groq_key.value if groq_key else "",
        "hf_api_key": hf_key.value if hf_key else ""
    }

@router.put("/settings")
def update_ai_settings(
    config: AIConfigUpdate,
    current_user: User = admin_dependency,
    db: Session = Depends(get_db)
):
    if config.primary_provider not in ["groq", "huggingface", "mock"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider must be 'groq', 'huggingface' or 'mock'."
        )
        
    set_system_setting(db, "active_ai_provider", config.primary_provider, "Active AI schedule/insights provider")
    
    if config.groq_api_key is not None:
        set_system_setting(db, "groq_api_key", config.groq_api_key, "API Key for Groq Cloud Platform")
        
    if config.hf_api_key is not None:
        set_system_setting(db, "hf_api_key", config.hf_api_key, "API Token for Hugging Face Inference API")
        
    return {"message": "System AI configuration updated successfully."}
