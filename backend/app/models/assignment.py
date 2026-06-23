from pydantic import BaseModel
from typing import Literal

StatusType = Literal['pending', 'approved', 'rejected', 'withdrawn']


class AssignmentCreate(BaseModel):
    facultyId: int
    subjectId: int
    section: str
    ay: str
    sem: str


class AssignmentAction(BaseModel):
    comment: str | None = None


class Assignment(BaseModel):
    id: int
    ay: str
    sem: str
    facultyId: int
    subjectId: int
    section: str
    status: StatusType
    submittedBy: str
    submittedAt: str
    reviewedBy: str | None = None
    reviewedAt: str | None = None
    comment: str | None = None


class FinalizeTermRequest(BaseModel):
    ay: str
    sem: str


class ReopenTermRequest(BaseModel):
    ay: str
    sem: str
