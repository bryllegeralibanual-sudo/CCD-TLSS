from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.user import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.core.supabase import get_supabase
from app.core.security import create_access_token, verify_token

router = APIRouter()
bearer_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest):
    supabase = get_supabase()
    try:
        res = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
            "options": {"data": {"full_name": body.full_name}}
        })
        user = res.user
        if not user:
            raise HTTPException(status_code=400, detail="Registration failed")

        token = create_access_token({"sub": user.id, "email": user.email})
        return TokenResponse(
            access_token=token,
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=body.full_name,
            )
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    supabase = get_supabase()
    try:
        res = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password
        })
        user = res.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_access_token({"sub": user.id, "email": user.email})
        return TokenResponse(
            access_token=token,
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.user_metadata.get("full_name"),
            )
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")

@router.get("/me", response_model=UserResponse)
def me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["sub"],
        email=current_user["email"],
    )

@router.post("/logout")
def logout():
    supabase = get_supabase()
    supabase.auth.sign_out()
    return {"message": "Logged out successfully"}
