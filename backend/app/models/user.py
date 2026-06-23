from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    role: str | None = 'teacher'
    programs: list[str] | None = None
    facultyId: int | None = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None = None
    full_name: str | None = None
    role: str | None = 'user'
    programs: list[str] | None = None
    facultyId: int | None = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user: UserResponse
