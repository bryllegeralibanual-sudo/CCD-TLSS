import json
from pathlib import Path
from threading import Lock

DATA_DIR = Path(__file__).resolve().parent.parent / 'data'
DATA_DIR.mkdir(parents=True, exist_ok=True)

_LOCK = Lock()


def _path(filename: str) -> Path:
    return DATA_DIR / filename


def load_json(filename: str, default):
    path = _path(filename)
    if not path.exists():
        return default
    try:
        with path.open('r', encoding='utf-8') as handle:
            return json.load(handle)
    except json.JSONDecodeError:
        return default


def save_json(filename: str, payload) -> None:
    path = _path(filename)
    with _LOCK:
        with path.open('w', encoding='utf-8') as handle:
            json.dump(payload, handle, indent=2)


def load_accounts() -> list[dict]:
    return load_json('accounts.json', [])


def save_accounts(accounts: list[dict]) -> None:
    save_json('accounts.json', accounts)


def load_faculty() -> list[dict]:
    return load_json('faculty.json', [])


def load_subjects() -> list[dict]:
    return load_json('subjects.json', [])


def load_programs() -> list[dict]:
    return load_json('programs.json', [])


def load_assignments() -> list[dict]:
    return load_json('assignments.json', [])


def save_assignments(assignments: list[dict]) -> None:
    save_json('assignments.json', assignments)


def load_finalized_terms() -> list[dict]:
    return load_json('finalized_terms.json', [])


def save_finalized_terms(terms: list[dict]) -> None:
    save_json('finalized_terms.json', terms)
