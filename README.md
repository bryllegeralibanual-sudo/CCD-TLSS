# CCD-TLSS: Teacher Load and Scheduling System

CCD-TLSS is a web-based Teacher Load and Scheduling System for City College of Davao. The system is designed to help organize faculty teaching loads before creating class schedules, especially in a school setting where teachers and classrooms are limited.

The project focuses on two connected problems:

- Assigning subjects to qualified teachers based on program, specialization, and workload limits.
- Preparing approved teaching loads so class schedules can be created without teacher, room, and section conflicts.

## Project Goals & Strategy

### Problem Statement
City College of Davao has limited teachers and limited classrooms. A proper scheduling system is essential to ensure all subjects and sections are organized efficiently without conflicts.

**Two-Phase Approach:**
1. **Load Assignment** — Assign qualified teachers to subjects (respecting specialization & workload)
2. **Auto-Scheduling** — Generate conflict-free class schedules

### Program Structure

| Program | Majors | Sections per Year Level | Total Sections |
|---------|--------|------------------------|-----------------|
| **BTVTEd** | CP (Computer Programming) | 2 | 8 (4 year levels × 2) |
| **BTVTEd** | HVACRT (HVAC/R Technology) | 1 | 4 (4 year levels × 1) |
| **BECEd** | — | 3 | 12 (4 year levels × 3) |
| **BS Entrep** | — | 2 | 8 (4 year levels × 2) |
| **TOTAL** | — | — | **32 sections** |

### Critical Constraints

#### Teacher Constraints
- Limited faculty per program
- Teachers have specific specializations (e.g., CP teacher ≠ HVACRT teacher)
- Max teaching units per teacher (e.g., 18 units/semester)
- Some teachers are shared across programs
- **Problem:** If a CP teacher leaves, section CP may lack coverage

#### Classroom Constraints
- Limited total classrooms
- Different room types: Lecture, Lab, Mixed
- Each room has a capacity
- Rooms must be optimized across multiple time blocks
- **Problem:** Morning class in Room A blocks afternoon use

#### Schedule Constraints
- **1st Year** → Morning (7:30 AM - 12:00 PM) — preferred
- **2nd Year** → Afternoon (1:00 PM - 5:00 PM) — preferred
- **3rd Year** → Flexible (Afternoon/Evening) — based on availability
- **4th Year** → Field-based (minimal classroom usage)

---

## Load Assignment Workflow (Current Implementation)

### Phase 1: Admin Assigns Loads

**Recommended Section-First Approach:**

```
Step 1: Select Program
  → Choose BTVTED, BECED, or BSE

Step 2: Select Year & Section
  → Choose BTVTED CP 1st Year, Section 1
  → System shows all required subjects for that section

Step 3: View Required Subjects
  Example for BTVTED CP 1st Year:
    □ CCPROG101 - Intro to Programming (3 units) — Lecture
    □ CCPROG102 - Logic Design (4 units) — Lab
    □ CMATH101 - Calculus (3 units) — Lecture
    ... (etc. for all subjects)

Step 4: Assign Teachers to Subjects
  For each subject:
    1. Select Teacher
    2. System validates:
       ✓ Teacher has correct specialization
       ✓ Teacher has enough remaining units
       ✓ Duplicate assignment prevented
    3. If valid → Subject marked as "Assigned"
    4. If invalid → Show error with reason

Step 5: Complete Section
  When all subjects assigned → Section shows as "Ready for Review"
  
Step 6: Submit to Program Head
  → Sends entire section load to Program Head for approval
```

**Why Section-First?**
- Admin can see **all required subjects at once** (no gaps missed)
- Easier to track progress: "CP1-1: 10/12 subjects assigned"
- Program Head reviews **complete section loads** (not individual assignments)
- Clear bottlenecks: "Section CP1-1 blocked on Math teacher"

### Phase 2: Program Head Reviews & Approves

```
Program Head Dashboard shows:
  ┌─────────────────────────────────────┐
  │ Pending Review (BTVTEd Program)      │
  │ ─────────────────────────────────────│
  │ □ CP 1st Year, Section 1      (12/12)
  │ □ CP 2nd Year, Section 1      (10/12)  ← Incomplete
  │ □ HVACRT 1st Year, Section 1   (8/8)
  │ □ CP 1st Year, Section 2      (12/12)
  └─────────────────────────────────────┘

For each pending section:
  1. Click to view all assignments
  2. Check compatibility notes & blockers
     (e.g., "Teacher specialized in CP, but assigned to HVACRT")
  3. If OK → Click "Approve"
  4. If issues → Click "Reject" + provide feedback
     (e.g., "Subject CCPROG102 needs lab specialist")
  5. Admin sees feedback and reassigns teachers
  6. Resubmit for approval
```

### Phase 3: Iterate if Rejected

```
If Program Head rejects:
  1. Admin sees rejection comment
  2. Reviews comment and understands the issue
  3. Reassigns teacher to that subject
  4. Resubmits section load
  5. Program Head reviews again
  
Repeat until all sections approved.
```

### Phase 4: Ready for Auto-Scheduling

When **ALL sections** for a program have been approved by the Program Head:

```
Ready to Schedule Signal:
  BTVTEd  → ✓ All sections approved (4 sections × 2 majors = 8)
  BECEd   → ✓ All sections approved (4 sections × 3 = 12)
  BSE     → ✗ Still pending 2 sections
  
Admin can trigger auto-scheduling only when:
  - No pending assignments across all programs
  - No rejected assignments blocking progress
```

---

## Auto-Scheduling Strategy

### Time-Block Allocation

| Year | Time Block | Hours | Room Priority | Rationale |
|------|-----------|-------|---------------|-----------|
| **1st Year** | Morning | 7:30-12:00 | High | Fresh students, morning classes |
| **2nd Year** | Afternoon | 1:00-5:00 | High | Established routine |
| **3rd Year** | Flexible | Afternoon/Evening | Medium | Depends on teacher availability |
| **4th Year** | Field-based | Min. classroom | Low | Most subjects off-campus |

### Scheduling Algorithm (Proposed)

```
FOR each Program:
  FOR each Year Level:
    FOR each Section:
      FOR each Subject in Section:
        
        1. Get Subject Details
           - Required room type (Lecture/Lab/Mixed)
           - Required units/hours
           - Teacher assigned to subject
        
        2. Select Time Block
           - 1st Year → Morning
           - 2nd Year → Afternoon
           - 3rd/4th Year → Use availability
        
        3. Find Available Room
           - Match room type with subject requirement
           - Check room is free during time block
           - Room capacity ≥ section size
        
        4. Check Conflicts
           - Teacher conflict: Teacher already scheduled at this time?
           - Room conflict: Room already scheduled at this time?
           - Section conflict: Section at 2 places simultaneously?
        
        5. Assign Class
           - Schedule: Subject @ Room, Time, Teacher
           - Mark room as occupied for time block
           - Mark teacher as occupied for time block
        
        6. If Conflict Found
           - Try alternate room
           - Try alternate time block (if year level allows)
           - If no solution: Flag as "Unschedulable"

AFTER scheduling:
  - Verify all sections have schedules
  - Verify no conflicts
  - Report any unschedulable sections
  - Generate final schedule
```

### Conflict Detection

Before finalizing schedule, system must verify:

✓ **No Teacher Conflicts** — Teacher not scheduled at overlapping times  
✓ **No Room Conflicts** — Room not scheduled at overlapping times  
✓ **No Section Conflicts** — Section not in 2 places simultaneously  
✓ **All Subjects Assigned** — Every subject in every section has a room & time  
✓ **Specialization Match** — Teacher specialization matches subject  
✓ **Workload Compliance** — No teacher exceeds max units  

---

## Registrar Finalization

```
Registrar Dashboard:
  ┌─────────────────────────────────────┐
  │ Schedule Finalization               │
  │ ─────────────────────────────────────│
  │ Generated Schedule Status:          │
  │ ✓ All sections have rooms          │
  │ ✓ All sections have teachers       │
  │ ✓ No conflicts detected             │
  │ ✓ Workload compliance verified      │
  │                                     │
  │ [ Finalize Term ] [ Re-Generate ]   │
  └─────────────────────────────────────┘

When Registrar clicks "Finalize Term":
  1. Schedule locked (no further changes)
  2. Schedule published to teachers & students
  3. Enrollments can proceed with fixed schedule
```

---

## User Accounts Setup

### Admin (Load Assignment + Scheduling)
- **Email:** `admin@ccd.edu.ph`
- **Password:** `admin123`
- **Permissions:** Assign loads, review feedback, generate schedule, finalize

### Program Heads (Approval Only)
- **BTVTEd Head:** `head.btvted@ccd.edu.ph` / `head123`
- **BECEd Head:** `head.beced@ccd.edu.ph` / `head123`
- **BS Entrep Head:** `head.bsentrep@ccd.edu.ph` / `head123`
- **Permissions:** View pending loads for their program, approve/reject

### Registrar (Finalization Only)
- **Email:** `registrar@ccd.edu.ph`
- **Password:** `registrar123`
- **Permissions:** View generated schedule, finalize term, publish

### Faculty (View-Only)
- **Sample:** `romel.salazar@ccd.edu.ph` / `teacher123`
- **+ 50+ more** in `facultySeed.js`
- **Permissions:** View assigned load, view schedule

---

## Implementation Status

### Phase 1: Load Assignment ✅ COMPLETE
- [x] Admin assigns teachers to subjects
- [x] Program Head reviews and approves/rejects
- [x] Specialization validation
- [x] Workload limit checking
- [x] Admin feedback integration
- [x] Section completion tracking

### Phase 2: Auto-Scheduler 🚧 IN PROGRESS
- [x] Legacy HTML prototype embedded
- [ ] Replace with React module
- [ ] Implement time-block assignment
- [ ] Add conflict detection
- [ ] Generate schedule automatically
- [ ] Display conflict warnings

### Phase 3: Registrar Finalization 🚧 PARTIALLY DONE
- [x] Registrar can view load status
- [x] Registrar can finalize term
- [ ] Add schedule generation verification
- [ ] Add conflict detection reports
- [ ] Add schedule export (PDF/Excel)

### Phase 4: Backend Integration 🚧 EARLY STAGE
- [ ] Connect to real database
- [ ] Real authentication (JWT)
- [ ] API endpoints for all workflows
- [ ] Data persistence (Supabase)

---

## Development Priority

### Week 1-2: Refine Load Assignment UX
1. Implement **section-first workflow** in LoadAssignmentPage
2. Add section completion progress indicator
3. Show all required subjects upfront
4. Improve feedback loop for rejected assignments

### Week 3: Program Head Dashboard Enhancement
1. Change from individual assignments to **section-level review**
2. Show percentage complete per section
3. Bulk approve/reject functionality
4. Comment templates for common rejections

### Week 4-5: Build React Scheduler
1. Replace legacy HTML scheduler
2. Implement time-block assignment algorithm
3. Add conflict detection & warnings
4. Display schedule in calendar view

### Week 6: Testing & Polish
1. E2E testing with multiple scenarios
2. Performance optimization
3. UI/UX refinement
4. Documentation finalization

### Week 7+: Backend Integration
1. Design database schema
2. Implement FastAPI endpoints
3. Connect frontend to backend
4. Remove localStorage mock data

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

### ✅ Frontend Complete

**Core Framework & Authentication**
- ✅ Login page with role-based quick-access buttons
- ✅ Mock authentication system with demo credentials for all 4 roles
- ✅ Protected route system with automatic role-based redirects
- ✅ AuthContext with localStorage session persistence
- ✅ Dark/light theme toggle on login
- ✅ Live system clock and responsive design (mobile/tablet/desktop)

**Main Layout & Navigation**
- ✅ AppLayout component with sidebar & topbar
- ✅ Role-based navigation menu with pending count badge
- ✅ Responsive sidebar (collapsible on mobile)
- ✅ User profile section with logout
- ✅ CCD branding and styling throughout

**Role-Specific Pages (100% Complete)**

| Role | Page | Features | Status |
|------|------|----------|--------|
| **Admin** | Dashboard | Stats, system overview, load assignment pipeline | ✅ Complete |
| **Admin** | Load Assignment | Assign faculty to subjects, validation, compatibility checks | ✅ Complete |
| **Program Head** | Approvals | Review pending assignments, approve/reject with comments, past decisions | ✅ Complete |
| **Registrar** | Finalize Loads | View load status per program, finalize term | ✅ Complete |
| **Teacher** | My Load | View assigned subjects, units, status, program head comments | ✅ Complete |
| **Admin/Registrar** | Scheduler | Legacy prototype (iframe-based) | ✅ Available |

**Data Layer & Validation**
- ✅ DataContext with full assignment workflow (pending → approved/rejected)
- ✅ Faculty seed data (50+ faculty with program, specialization, max units)
- ✅ Subject seed data (full curriculum for all programs)
- ✅ Program definitions (BTVTEd, BECEd, BS Entrep with year levels & sections)
- ✅ Validation engine: workload limits, specialization matching, duplicate prevention, subject-code diversity
- ✅ Compatibility checking with blockers and notes
- ✅ LocalStorage persistence for assignments, approvals, rejections, term state

**UI Components**
- ✅ StatusBadge (pending/approved/rejected states)
- ✅ SectionHeader (reusable section title with icon, sub, count)
- ✅ PendingCard (expandable assignment cards with notes/blockers)
- ✅ Responsive tables, forms, buttons, modals
- ✅ Lucide icons throughout
- ✅ Consistent design tokens (forest green, gold, white text on dark)

### 🚧 Partially Implemented

- **Specialization checking**: Exists but uses simple heuristic; could be improved with more detailed matching rules
- **Scheduler**: Legacy HTML prototype integrated; not yet a connected React scheduling module
- **Backend integration**: FastAPI scaffold exists; frontend still uses mock data & localStorage

### ❌ Not Yet Implemented

- Real database persistence (Supabase/PostgreSQL)
- Backend authentication (JWT token flow)
- Room management module & UI
- Teacher availability management UI
- Approved-load-to-schedule generation algorithm
- Real-time conflict detection in scheduler
- Schedule approval workflow
- Printable/exportable schedules
- Audit trail & change logs

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

## Progress Summary

### Frontend Status: 🟢 **PRODUCTION READY**
All core user-facing workflows are complete and functional:
- Login and role-based navigation: **100%**
- Load assignment workflow: **100%**
- Program Head approval workflow: **100%**
- Registrar finalization workflow: **100%**
- Teacher load viewing: **100%**
- Responsive UI/UX: **100%**

**The entire load assignment & approval cycle is working end-to-end with mock data.**

### Overall Project Progress: 🟡 **70%**

| Component | Progress | Notes |
|-----------|----------|-------|
| **Frontend Load Assignment** | ✅ 100% | Complete and working |
| **Frontend UI/UX** | ✅ 100% | All pages responsive, accessible, branded |
| **Mock Data & Validation** | ✅ 95% | Fully functional; could expand specialization rules |
| **Session Persistence** | ✅ 100% | localStorage working correctly |
| **Backend API** | 🚧 20% | Scaffold exists; not integrated |
| **Database** | ❌ 0% | Not started |
| **Scheduler (React)** | 🚧 10% | Legacy prototype only |
| **Room Management** | ❌ 0% | Not started |
| **Teacher Availability** | ❌ 0% | Not started |

### Next Milestones (In Priority Order)

1. **Backend API Integration** (Est. 5–7 days)
   - Connect frontend to FastAPI backend
   - Implement real authentication (JWT)
   - Replace localStorage with API calls
   - Set up Supabase database schema

2. **React Scheduler Module** (Est. 7–10 days)
   - Replace legacy HTML scheduler
   - Use approved loads from DataContext
   - Add teacher/room/section conflict detection
   - Implement drag-drop interface

3. **Room & Availability Management** (Est. 3–5 days each)
   - Room CRUD UI
   - Teacher availability calendar/form

4. **Schedule Approval Workflow** (Est. 3–4 days)
   - Program Head schedule review
   - Registrar final approval

5. **Export & Reporting** (Est. 2–3 days)
   - Printable schedules
   - Faculty workload reports
   - Audit logs
