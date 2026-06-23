from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.assignment import AssignmentCreate, AssignmentAction, Assignment, FinalizeTermRequest, ReopenTermRequest
from app.core.storage import (
    load_faculty,
    load_subjects,
    load_programs,
    load_assignments,
    save_assignments,
    load_finalized_terms,
    save_finalized_terms,
)
from app.routes.auth import get_current_user

router = APIRouter()


def _filter_assignments(assignments: list[dict], faculty_id: int | None, ay: str | None, sem: str | None, status: str | None):
    out = assignments
    if faculty_id is not None:
        out = [a for a in out if a.get('facultyId') == faculty_id]
    if ay is not None:
        out = [a for a in out if a.get('ay') == ay]
    if sem is not None:
        out = [a for a in out if a.get('sem') == sem]
    if status is not None:
        out = [a for a in out if a.get('status') == status]
    return out


@router.get('/metadata')
def get_metadata(current_user: dict = Depends(get_current_user)):
    return {
        'faculty': load_faculty(),
        'subjects': load_subjects(),
        'programs': load_programs(),
        'assignments': load_assignments(),
        'finalizedTerms': load_finalized_terms(),
    }


@router.get('/assignments', response_model=list[Assignment])
def list_assignments(
    facultyId: int | None = Query(None),
    ay: str | None = Query(None),
    sem: str | None = Query(None),
    status: str | None = Query(None),
    current_user: dict = Depends(get_current_user),
):
    assignments = load_assignments()
    return _filter_assignments(assignments, facultyId, ay, sem, status)


@router.post('/assignments', response_model=Assignment)
def create_assignment(body: AssignmentCreate, current_user: dict = Depends(get_current_user)):
    assignments = load_assignments()
    finalized_terms = load_finalized_terms()
    if any(term for term in finalized_terms if term['ay'] == body.ay and term['sem'] == body.sem):
        raise HTTPException(status_code=400, detail='This term has already been finalized and cannot accept new assignments.')

    duplicate = next(
        (
            a
            for a in assignments
            if a['facultyId'] == body.facultyId
            and a['subjectId'] == body.subjectId
            and a['section'] == body.section
            and a['status'] not in ['rejected', 'withdrawn']
        ),
        None,
    )
    if duplicate:
        raise HTTPException(status_code=400, detail='This faculty member is already assigned to the exact subject and section.')

    next_id = max((a['id'] for a in assignments), default=0) + 1
    new_assignment = {
        'id': next_id,
        'ay': body.ay,
        'sem': body.sem,
        'facultyId': body.facultyId,
        'subjectId': body.subjectId,
        'section': body.section,
        'status': 'pending',
        'submittedBy': current_user['sub'],
        'submittedAt': datetime.utcnow().isoformat() + 'Z',
        'reviewedBy': None,
        'reviewedAt': None,
        'comment': None,
    }
    assignments.append(new_assignment)
    save_assignments(assignments)
    return new_assignment


def _find_assignment(assignments: list[dict], assignment_id: int) -> dict | None:
    return next((a for a in assignments if a['id'] == assignment_id), None)


@router.patch('/assignments/{assignment_id}/withdraw', response_model=Assignment)
def withdraw_assignment(assignment_id: int, current_user: dict = Depends(get_current_user)):
    assignments = load_assignments()
    assignment = _find_assignment(assignments, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail='Assignment not found.')
    if assignment['status'] in ['approved', 'withdrawn']:
        raise HTTPException(status_code=400, detail='Assignment cannot be withdrawn.')
    assignment['status'] = 'withdrawn'
    save_assignments(assignments)
    return assignment


@router.patch('/assignments/{assignment_id}/approve', response_model=Assignment)
def approve_assignment(assignment_id: int, body: AssignmentAction, current_user: dict = Depends(get_current_user)):
    assignments = load_assignments()
    assignment = _find_assignment(assignments, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail='Assignment not found.')
    if assignment['status'] != 'pending':
        raise HTTPException(status_code=400, detail='Only pending assignments can be approved.')
    assignment['status'] = 'approved'
    assignment['reviewedBy'] = current_user['sub']
    assignment['reviewedAt'] = datetime.utcnow().isoformat() + 'Z'
    assignment['comment'] = None
    save_assignments(assignments)
    return assignment


@router.patch('/assignments/{assignment_id}/reject', response_model=Assignment)
def reject_assignment(assignment_id: int, body: AssignmentAction, current_user: dict = Depends(get_current_user)):
    assignments = load_assignments()
    assignment = _find_assignment(assignments, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail='Assignment not found.')
    if assignment['status'] != 'pending':
        raise HTTPException(status_code=400, detail='Only pending assignments can be rejected.')
    if not body.comment or not body.comment.strip():
        raise HTTPException(status_code=400, detail='Rejection requires a comment.')
    assignment['status'] = 'rejected'
    assignment['reviewedBy'] = current_user['sub']
    assignment['reviewedAt'] = datetime.utcnow().isoformat() + 'Z'
    assignment['comment'] = body.comment.strip()
    save_assignments(assignments)
    return assignment


@router.post('/terms/finalize')
def finalize_term(body: FinalizeTermRequest, current_user: dict = Depends(get_current_user)):
    finalized_terms = load_finalized_terms()
    if any(term for term in finalized_terms if term['ay'] == body.ay and term['sem'] == body.sem):
        raise HTTPException(status_code=400, detail='Term is already finalized.')
    finalized_terms.append({
        'ay': body.ay,
        'sem': body.sem,
        'finalizedBy': current_user['sub'],
        'finalizedAt': datetime.utcnow().isoformat() + 'Z',
    })
    save_finalized_terms(finalized_terms)
    return {'ok': True}


@router.post('/terms/reopen')
def reopen_term(body: ReopenTermRequest, current_user: dict = Depends(get_current_user)):
    finalized_terms = load_finalized_terms()
    updated = [term for term in finalized_terms if not (term['ay'] == body.ay and term['sem'] == body.sem)]
    if len(updated) == len(finalized_terms):
        raise HTTPException(status_code=400, detail='Term was not finalized.')
    save_finalized_terms(updated)
    return {'ok': True}
