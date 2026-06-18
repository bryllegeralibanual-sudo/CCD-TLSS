from supabase import create_client, Client
from app.core.config import SUPABASE_URL, SUPABASE_KEY

def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)
