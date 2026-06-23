from app.core.config import SUPABASE_URL, SUPABASE_SERVICE_KEY
from supabase import create_client, Client

def get_supabase_admin() -> Client:
    """
    Service-role client — bypasses RLS. Used only for backend-trusted writes
    like creating a profile row right after auth.sign_up(). Never expose
    SUPABASE_SERVICE_KEY to the frontend.
    """
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def create_profile(user_id: str, email: str, full_name: str | None, role: str,
                    programs: list[str], faculty_id: int | None) -> dict:
    admin = get_supabase_admin()
    res = admin.table("profiles").insert({
        "id": user_id,
        "email": email,
        "full_name": full_name,
        "role": role,
        "programs": programs,
        "faculty_id": faculty_id,
    }).execute()
    return res.data[0] if res.data else {}

def get_profile(user_id: str) -> dict | None:
    admin = get_supabase_admin()
    res = admin.table("profiles").select("*").eq("id", user_id).single().execute()
    return res.data if res.data else None
