# CCD-TLSS: Teacher Load and Scheduling System

CCD-TLSS is a web-based Teacher Load and Scheduling System for City College of Davao. The system is designed to help organize faculty teaching loads before creating class schedules, especially in a school setting where teachers and classrooms are limited.

The project focuses on two connected problems:

- Assigning subjects to qualified teachers based on program, specialization, and workload limits.
- Preparing approved teaching loads so class schedules can be created without teacher, room, and section conflicts.

## Problem Background

The school has limited classrooms and limited teachers. Because of this, class scheduling must be handled carefully so that:

- All subjects are assigned to teachers.
- Teachers are qualified or reasonably fit to teach the subject.
- Teacher workloads do not exceed allowed unit limits.
- Program Heads can review and approve teaching assignments.
- Approved loads can later be used to generate schedules.
- Classroom usage can be planned around morning, afternoon, and evening time blocks.

Before scheduling can happen, the teacher load assignment process must be completed first.

## Programs Covered

The current system models the following programs:

| Program | Major | Sections Per Year Level |
| --- | --- | --- |
| BTVTEd | Computer Programming (CP) | 2 sections |
| BTVTEd | HVAC/R Technology (HVACRT) | 1 section |
| BECEd | General | 3 sections |
| BS Entrepreneurship | General | 2 sections |

BTVTEd has two majors, but both are handled by one BTVTEd Program Head account.

## User Roles

The system currently supports these account roles:

| Role | Purpose |
| --- | --- |
| Admin / Teacher-in-Charge | Assigns teaching loads and accesses the scheduler prototype. |
| Program Head | Reviews, approves, or rejects submitted teaching loads for their program. |
| Registrar | Reviews load completion status and finalizes the term. |
| Teacher | Views assigned subjects and approved teaching load. |

## Demo Accounts

The frontend currently uses mock accounts stored in code.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@ccd.edu.ph` | `admin123` |
| BTVTEd Program Head | `head.btvted@ccd.edu.ph` | `head123` |
| BECEd Program Head | `head.beced@ccd.edu.ph` | `head123` |
| BS Entrep Program Head | `head.bsentrep@ccd.edu.ph` | `head123` |
| Registrar | `registrar@ccd.edu.ph` | `registrar123` |
| Teacher sample | `romel.salazar@ccd.edu.ph` | `teacher123` |

Teacher accounts are generated from `frontend/src/data/facultySeed.js`, and all teacher accounts use `teacher123` in the current mock setup.

## Current Workflow

### 1. Admin Assigns Teaching Load

The Admin selects:

- Program
- Year level
- Section
- Subject
- Faculty member

The system checks the proposed assignment before submission.

Current validation includes:

- Faculty must belong to the selected program or be shared with that program.
- Faculty workload must not exceed the maximum unit limit.
- Faculty specialization mismatch is flagged for review.
- Faculty cannot exceed the subject-code diversity limit.
- Duplicate exact assignments are blocked.

Submitted assignments are saved with `pending` status.

### 2. Program Head Reviews Load

Program Heads only see pending assignments under their program scope.

They can:

- Approve the assignment.
- Reject the assignment with a required comment.

Rejected assignments return to the Admin for correction or withdrawal.

### 3. Registrar Finalizes Load

The Registrar can view the load status per program:

- Pending
- Approved
- Rejected

The Registrar can finalize the term only when there are no pending or rejected assignments blocking the process.

Once finalized, the term is locked from new load assignments until reopened.

### 4. Teacher Views Assigned Load

Teachers can log in and view:

- Their assigned subjects
- Section
- Units
- Assignment status
- Program Head comments, if any

### 5. Scheduling

Scheduling is currently available through a legacy prototype embedded in the React app:

```txt
frontend/public/ccd-scheduling.html
```

The React route that displays it is:

```txt
frontend/src/pages/SchedulerPage.jsx
```

At the moment, this scheduler is not yet fully connected to the approved React load-assignment data.

## Scheduling Strategy

The intended class scheduling strategy is:

| Year Level | Preferred Time Block |
| --- | --- |
| First Year | Morning, 7:30 AM to 12:00 PM |
| Second Year | Afternoon, 1:00 PM to 5:00 PM |
| Third Year | Afternoon or evening, depending on teacher availability |
| Fourth Year | Lower classroom priority because many subjects are field-based |

Evening classes may run from 1:00 PM to 9:30 PM depending on faculty availability and room constraints.

This strategy should remain adjustable by the Admin or scheduling in-charge.

## Current Implementation Status

### Completed or Mostly Working

- Login page with role-based access.
- Mock authentication using frontend account data.
- Admin load-assignment page.
- Program Head approval and rejection page.
- Registrar finalization page.
- Teacher load viewing page.
- Program and section metadata.
- Faculty seed data with program, specialization, employment type, max units, and preferred time.
- Subject seed data with program, year, semester, lecture units, lab units, and room type.
- LocalStorage persistence for assignments, finalized terms, and current term.
- Legacy scheduler iframe route.
- Updated login page visual design with CCD background and branding.

### Partially Implemented

- Specialization checking exists, but it uses a simple heuristic and should be improved.
- Scheduling exists only as a legacy prototype, not yet as a connected React scheduling module.
- Backend scaffold exists, but the active workflow still uses frontend mock data and localStorage.

### Not Yet Implemented

- Real database persistence for load assignments and schedules.
- Real backend authentication connected to the frontend.
- Room management module.
- Teacher availability management UI.
- Approved-load-to-schedule generation.
- Automatic detection of teacher, room, section, and time conflicts in the React scheduler.
- Schedule approval workflow.
- Printable or exportable final schedules.
- Audit trail for approval and schedule changes.

## Technical Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS utility classes
- Lucide React icons
- LocalStorage for mock persistence

### Backend Scaffold

- FastAPI
- Supabase client setup
- JWT helper utilities
- Docker Compose service for backend

The backend currently has basic authentication routes, but the React app is not yet fully integrated with it.

## Important Files

| File | Purpose |
| --- | --- |
| `frontend/src/App.jsx` | Main routes and role-protected pages. |
| `frontend/src/auth/accounts.js` | Mock user accounts and demo login credentials. |
| `frontend/src/auth/AuthContext.jsx` | Mock login session handling. |
| `frontend/src/data/DataContext.jsx` | Main frontend data store for assignments, approvals, terms, and finalization. |
| `frontend/src/data/facultySeed.js` | Faculty seed data. |
| `frontend/src/data/programs.js` | Program, major, year, and section metadata. |
| `frontend/src/data/subjects.js` | Curriculum and subject seed data. |
| `frontend/src/data/validation.js` | Teaching assignment compatibility checks. |
| `frontend/src/pages/admin/LoadAssignmentPage.jsx` | Admin load assignment screen. |
| `frontend/src/pages/head/ApprovalsPage.jsx` | Program Head review screen. |
| `frontend/src/pages/registrar/RegistrarPage.jsx` | Registrar finalization screen. |
| `frontend/src/pages/teacher/MyLoadPage.jsx` | Teacher load view. |
| `frontend/src/pages/SchedulerPage.jsx` | Iframe wrapper for legacy scheduler. |
| `frontend/public/ccd-scheduling.html` | Legacy scheduling prototype. |
| `backend/main.py` | FastAPI app entry point. |
| `docker-compose.yml` | Backend Docker service. |

## How to Run

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open the local Vite URL, usually:

```txt
http://localhost:5173
```

### Build Frontend

```bash
cd frontend
npm run build
```

### Backend

If Docker is available:

```bash
docker compose up --build
```

The backend runs on:

```txt
http://localhost:8000
```

Health check:

```txt
http://localhost:8000/health
```

## Recommended Next Development Steps

1. Build a room data module.
   - Room name
   - Room type
   - Capacity
   - Availability

2. Build teacher availability management.
   - Available days
   - Available time ranges
   - Preferred shifts
   - Restrictions

3. Replace the legacy scheduler iframe with a React scheduling page.
   - Use only approved loads.
   - Match subject room type with room type.
   - Prevent teacher conflicts.
   - Prevent room conflicts.
   - Prevent section conflicts.

4. Add schedule approval.
   - Admin creates schedule.
   - Program Head reviews schedule for their program.
   - Registrar views finalized schedule.

5. Connect the frontend to the backend.
   - Replace mock accounts.
   - Replace localStorage persistence.
   - Store assignments, approvals, rooms, and schedules in a database.

## Current Progress Estimate

| Area | Progress |
| --- | --- |
| Login and role navigation | High |
| Load assignment workflow | Medium to high |
| Program Head approval workflow | Medium to high |
| Registrar finalization workflow | Medium |
| Teacher load viewing | Medium |
| Scheduling workflow | Early stage |
| Backend integration | Early stage |

Overall, the project has a strong load-assignment foundation. The next major milestone is turning the scheduler from a legacy prototype into a connected scheduling module that uses approved teaching loads, rooms, teacher availability, and section time-block rules.
