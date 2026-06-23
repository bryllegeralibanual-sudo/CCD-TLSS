from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.user import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.core.security import create_access_token, verify_token
from app.core.storage import load_accounts, save_accounts

router = APIRouter()
bearer_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


def _build_user_response(account: dict) -> UserResponse:
    return UserResponse(
        id=account["id"],
        email=account["email"],
        name=account.get("name"),
        full_name=account.get("full_name"),
        role=account.get("role"),
        programs=account.get("programs"),
        facultyId=account.get("facultyId"),
    )

@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest):
    accounts = load_accounts()
    if any(account for account in accounts if account["email"].lower() == body.email.lower()):
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = {
        "id": f"user-{len(accounts) + 1}",
        "email": body.email,
        "password": body.password,
        "name": body.full_name,
        "full_name": body.full_name,
        "role": body.role or "teacher",
        "programs": body.programs or [],
        "facultyId": body.facultyId,
    }
    accounts.append(new_user)
    save_accounts(accounts)

    token = create_access_token({
        "sub": new_user["id"],
        "email": new_user["email"],
        "name": new_user.get("name"),
        "full_name": new_user.get("full_name"),
        "role": new_user.get("role"),
        "programs": new_user.get("programs"),
        "facultyId": new_user.get("facultyId"),
    })

    return TokenResponse(
        access_token=token,
        user=_build_user_response(new_user),
    )

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    accounts = load_accounts()
    user = next(
        (account for account in accounts if account["email"].lower() == body.email.lower() and account["password"] == body.password),
        None,
    )
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "name": user.get("name"),
        "full_name": user.get("full_name"),
        "role": user.get("role"),
        "programs": user.get("programs"),
        "facultyId": user.get("facultyId"),
    })

    return TokenResponse(
        access_token=token,
        user=_build_user_response(user),
    )

@router.get("/me", response_model=UserResponse)
def me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["sub"],
        email=current_user["email"],
        name=current_user.get("name"),
        full_name=current_user.get("full_name"),
        role=current_user.get("role"),
        programs=current_user.get("programs"),
        facultyId=current_user.get("facultyId"),
    )

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
