from fastapi import Depends, HTTPException
from app.routes.auth import get_current_user

def require_role(*allowed_roles: str):
    """
    Usage on any future route:
        @router.post("/assignments/{id}/approve")
        def approve(id: int, user: dict = Depends(require_role("program_head", "admin"))):
            ...
    """
    def dependency(current_user: dict = Depends(get_current_user)) -> dict:
        role = current_user.get("role")
        if role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Not authorized for this action")
        return current_user
    return dependency
