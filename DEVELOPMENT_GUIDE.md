# CCD-TLSS Development Guide

Complete step-by-step guide for implementing the Teacher Load and Scheduling System.

## Table of Contents
1. [Current Status](#current-status)
2. [Week 1-2: Load Assignment UX](#week-1-2-load-assignment-ux)
3. [Week 3: Program Head Dashboard](#week-3-program-head-dashboard)
4. [Week 4-5: React Scheduler](#week-4-5-react-scheduler)
5. [Week 6: Testing & Polish](#week-6-testing--polish)
6. [Week 7+: Backend Integration](#week-7-backend-integration)
7. [Testing Scenarios](#testing-scenarios)
8. [Troubleshooting](#troubleshooting)

---

## Current Status

### ✅ Complete
- Login with role-based access (Admin, 3 Program Heads, Registrar, Faculty)
- Load assignment page (teacher-centric view)
- Program Head approval page
- Registrar finalization page
- Teacher load viewing page
- Data layer with mock persistence
- Specialization & workload validation

### 🚧 In Progress
- Scheduler (legacy HTML prototype only)
- Load assignment UI refinement (needs section-first approach)

### ❌ Not Started
- React-based scheduler
- Backend API integration
- Database persistence

---

## Week 1-2: Load Assignment UX Refinement

**Goal:** Change from **teacher-centric** to **section-first** workflow

### Task 1.1: Add Section Selection to LoadAssignmentPage

**Current Flow:**
```
Select Program → Select Faculty → Assign to Subject
```

**New Flow:**
```
Select Program → Select Section → View All Required Subjects → Assign Subjects to Faculty
```

**File:** `frontend/src/pages/admin/LoadAssignmentPage.jsx`

**Changes Needed:**
1. Add "Section Selector" dropdown
   - Show all sections for selected program
   - Display as: "CP 1st Year - Section 1" (8 total subjects)

2. When section selected, display:
   ```
   ┌────────────────────────────────────────────┐
   │ Section: CP 1st Year - Section 1           │
   │ Program: BTVTED (CP)  |  Total Subjects: 8 │
   └────────────────────────────────────────────┘
   
   Assignment Progress: 5/8 subjects assigned
   [████████░░] 62%
   
   Subjects to Assign:
   ┌─────────────────────────────────────────┐
   │ ✓ CCPROG101 - Intro to Programming      │
   │   3 units | Lecture | → Assigned to ... │
   │                                          │
   │ □ CCPROG102 - Logic Design              │
   │   4 units | Lab | → Click to assign     │
   │                                          │
   │ □ CMATH101 - Calculus                   │
   │   3 units | Lecture | → Click to assign │
   └─────────────────────────────────────────┘
   ```

3. Clicking subject opens assignment modal:
   ```
   ┌──────────────────────────────────────────┐
   │ Assign Teacher to CCPROG102              │
   │ Laboratory | 4 units                     │
   │ ──────────────────────────────────────────│
   │                                          │
   │ Select Teacher:                          │
   │ [Dropdown ▼]  (filtered by specialization)
   │   - John Doe (CP Specialist, 3/18 units)│
   │   - Jane Smith (CP Specialist, 15/18)   │
   │   (Teachers without CP spec not shown)   │
   │                                          │
   │ Validation:                              │
   │ ✓ Specialization match (CP)              │
   │ ✓ Workload OK (3/18 units)               │
   │ ✓ No duplicate assignment                │
   │                                          │
   │ [Assign] [Cancel]                        │
   └──────────────────────────────────────────┘
   ```

**Implementation Steps:**
```javascript
// Step 1: Add program selector
const [selectedProgram, setSelectedProgram] = useState(null)

// Step 2: Add section selector (filtered by program)
const availableSections = getAvailableSections(selectedProgram)
const [selectedSection, setSelectedSection] = useState(null)

// Step 3: Get required subjects for section
const requiredSubjects = getSubjectsForSection(selectedSection)

// Step 4: Get assignments for this section
const sectionAssignments = getAssignmentsForSection(selectedSection)

// Step 5: Display progress
const assignedCount = sectionAssignments.length
const totalRequired = requiredSubjects.length
const progress = (assignedCount / totalRequired) * 100
```

---

### Task 1.2: Add Section Completion Indicator

**Display:**
```
Section Progress Card:
┌────────────────────────────────────┐
│ CP 1st Year - Section 1            │
│ Status: Ready for Review ✓         │
│ Progress: [██████████] 100%        │
│ Subjects: 8/8 Assigned             │
│                                    │
│ [ Submit for Review ]              │
└────────────────────────────────────┘
```

**Implementation:**
```javascript
// In DataContext, add function:
export function getSectionCompletionStatus(sectionId) {
  const required = getRequiredSubjectsForSection(sectionId)
  const assigned = getAssignedSubjectsForSection(sectionId)
  
  return {
    total: required.length,
    assigned: assigned.length,
    isComplete: required.length === assigned.length,
    percentage: (assigned.length / required.length) * 100
  }
}
```

---

### Task 1.3: Add "Submit Section" Button

**Current:** Submit individual assignments  
**New:** Submit entire section at once

```javascript
function handleSubmitSection(sectionId) {
  // Get all assignments for this section
  const sectionAssignments = getAssignmentsForSection(sectionId)
  
  // Check if all subjects assigned
  const requiredSubjects = getRequiredSubjectsForSection(sectionId)
  if (sectionAssignments.length !== requiredSubjects.length) {
    showError('Cannot submit section with unassigned subjects')
    return
  }
  
  // Change status to "pending_review"
  sectionAssignments.forEach(a => {
    a.status = 'pending_review'
    a.submittedAt = new Date()
  })
  
  // Save to localStorage (or API)
  saveSectionLoadForReview(sectionId, sectionAssignments)
}
```

---

## Week 3: Program Head Dashboard Enhancement

**Goal:** Make Program Heads review **entire sections**, not individual assignments

### Task 3.1: Update ApprovalsPage to Show Sections

**Current:** Shows individual pending assignments  
**New:** Group by section, show completion status

```javascript
// Group pending assignments by section
const pendingBySection = groupBy(pending, 'sectionId')

// Render section cards instead of individual cards
{Object.entries(pendingBySection).map(([sectionId, assignments]) => (
  <SectionCard
    key={sectionId}
    section={getSection(sectionId)}
    assignments={assignments}
    onReview={() => expandSection(sectionId)}
  />
))}
```

### Task 3.2: Add Bulk Approve/Reject

**UI:**
```
Section: CP 1st Year - Section 1
Subjects Assigned: 8/8 ✓

Assignment List:
□ CCPROG101 → John Doe (CP Specialist) ✓
□ CCPROG102 → Jane Smith (CP Specialist) ✓
... (etc)

No compatibility issues found.

[Approve Entire Section] [Request Changes]
```

**Implementation:**
```javascript
function handleApproveSectionLoad(sectionId) {
  const assignments = getAssignmentsForSection(sectionId)
  
  assignments.forEach(a => {
    a.status = 'approved'
    a.approvedBy = account.id
    a.approvedAt = new Date()
  })
  
  saveAssignments(assignments)
}

function handleRejectSectionLoad(sectionId, comment) {
  const assignments = getAssignmentsForSection(sectionId)
  
  assignments.forEach(a => {
    a.status = 'rejected'
    a.rejectedBy = account.id
    a.rejectedAt = new Date()
    a.comment = comment
  })
  
  saveAssignments(assignments)
}
```

---

## Week 4-5: React Scheduler

**Goal:** Build a React-based scheduler to replace legacy HTML prototype

### Task 4.1: Create SchedulerPage Component

**File:** `frontend/src/pages/SchedulerPage.jsx`

**Features:**
```
┌──────────────────────────────────────────────┐
│ Class Schedule Generator                     │
│ ──────────────────────────────────────────────│
│                                              │
│ Program: [BTVTED ▼] Section: [All ▼]       │
│                                              │
│ Year Level:  ○ 1st  ○ 2nd  ○ 3rd  ○ 4th  │
│              [✓] Include all                 │
│                                              │
│ Time Block Settings:                         │
│ □ 1st Year → Morning (7:30-12:00)           │
│ □ 2nd Year → Afternoon (1:00-5:00)         │
│ □ 3rd Year → Evening (opt.)                │
│ □ 4th Year → Field-based (minimal)         │
│                                              │
│ [Generate Schedule] [Preview] [Save]        │
└──────────────────────────────────────────────┘
```

### Task 4.2: Implement Scheduling Algorithm

**File:** `frontend/src/data/scheduler.js`

```javascript
export function generateSchedule(options) {
  const {
    program,
    section,
    yearLevels,
    approvedLoads,
    classrooms,
    teacherAvailability
  } = options
  
  const schedule = []
  const conflicts = []
  
  // For each section's approved load
  for (const load of approvedLoads) {
    // Get all subjects for this section
    const subjects = getSubjectsForLoad(load)
    
    for (const subject of subjects) {
      // Determine time block based on year level
      const timeBlock = getTimeBlock(subject.yearLevel)
      
      // Find available classroom
      const room = findAvailableRoom(
        subject.roomType,
        timeBlock,
        schedule
      )
      
      if (!room) {
        conflicts.push({
          subject,
          section: load.sectionId,
          reason: 'No available room'
        })
        continue
      }
      
      // Check teacher availability
      if (!isTeacherAvailable(load.teacherId, timeBlock)) {
        conflicts.push({
          subject,
          section: load.sectionId,
          teacher: load.teacherId,
          reason: 'Teacher not available'
        })
        continue
      }
      
      // Add to schedule
      schedule.push({
        subject,
        section: load.sectionId,
        teacher: load.teacherId,
        room: room.id,
        timeBlock,
        day: subject.preferredDay || 'MWF'
      })
    }
  }
  
  return {
    schedule,
    conflicts,
    isValid: conflicts.length === 0
  }
}

function getTimeBlock(yearLevel) {
  switch (yearLevel) {
    case 1: return { start: '07:30', end: '12:00', label: 'Morning' }
    case 2: return { start: '13:00', end: '17:00', label: 'Afternoon' }
    case 3: return { start: '17:00', end: '21:30', label: 'Evening' }
    case 4: return null // Field-based
  }
}

function findAvailableRoom(roomType, timeBlock, schedule) {
  // Get all classrooms matching room type
  const matchingRooms = getClassroomsByType(roomType)
  
  // Find one not occupied during this time block
  for (const room of matchingRooms) {
    const isOccupied = schedule.some(s =>
      s.room.id === room.id &&
      timesOverlap(s.timeBlock, timeBlock)
    )
    
    if (!isOccupied) return room
  }
  
  return null
}
```

### Task 4.3: Display Schedule in Calendar View

**UI:**
```
┌─────────────────────────────────────────────────────┐
│ Generated Schedule - BTVTED CP 1st Year             │
│ ─────────────────────────────────────────────────────│
│                                                     │
│ Time Block: Morning (7:30 AM - 12:00 PM)           │
│                                                     │
│        Monday    │  Tuesday   │ Wednesday │ Friday  │
│ ─────────────────┼────────────┼───────────┼─────────│
│ 7:30-8:30        │            │           │         │
│ CCPROG101        │ CCPROG101  │ CCPROG101 │         │
│ Room: Lab 1      │ Room: Lab 1│ Room: Lab1│         │
│ John Doe         │ John Doe   │ John Doe  │         │
│ ─────────────────┼────────────┼───────────┼─────────│
│ 8:30-10:00       │            │           │         │
│ CMATH101         │ CMATH101   │ CMATH101  │         │
│ Room: 104        │ Room: 104  │ Room: 104 │         │
│ Jane Smith       │ Jane Smith │ Jane Smith│         │
│ ─────────────────┼────────────┼───────────┼─────────│
│ 10:00-12:00      │            │           │         │
│ CCPROG102 (Lab)  │            │           │         │
│ Room: Lab 2      │            │           │         │
│ John Doe         │            │           │         │
└─────────────────────────────────────────────────────┘

Status: ✓ No conflicts detected
Conflicts Found: 0/32 sections
[ Export PDF ] [ Save Schedule ] [ Back to Review ]
```

### Task 4.4: Conflict Detection & Warnings

```javascript
function checkScheduleConflicts(schedule) {
  const conflicts = []
  
  // Check teacher conflicts
  for (const class1 of schedule) {
    for (const class2 of schedule) {
      if (class1.id === class2.id) continue
      
      if (class1.teacher === class2.teacher &&
          timesOverlap(class1.timeBlock, class2.timeBlock)) {
        conflicts.push({
          type: 'TEACHER_CONFLICT',
          teacher: class1.teacher,
          class1: class1.subject,
          class2: class2.subject,
          time: class1.timeBlock
        })
      }
    }
  }
  
  // Check room conflicts
  for (const class1 of schedule) {
    for (const class2 of schedule) {
      if (class1.id === class2.id) continue
      
      if (class1.room === class2.room &&
          timesOverlap(class1.timeBlock, class2.timeBlock)) {
        conflicts.push({
          type: 'ROOM_CONFLICT',
          room: class1.room,
          class1: class1.subject,
          class2: class2.subject,
          time: class1.timeBlock
        })
      }
    }
  }
  
  return conflicts
}
```

---

## Week 6: Testing & Polish

### Task 6.1: E2E Testing Scenarios

See [Testing Scenarios](#testing-scenarios) below.

### Task 6.2: Performance Optimization

- Profile React components with React DevTools
- Optimize re-renders with useMemo/useCallback
- Lazy load pages with React.lazy()
- Compress images and assets

### Task 6.3: UI/UX Polish

- Add loading skeletons
- Improve error messages
- Add toast notifications
- Refine responsive breakpoints

---

## Week 7+: Backend Integration

### Task 7.1: Database Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  role VARCHAR,
  name VARCHAR,
  created_at TIMESTAMP
)

-- Faculty
CREATE TABLE faculty (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  specialization VARCHAR,
  max_units INT,
  programs UUID[],
  created_at TIMESTAMP
)

-- Assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY,
  faculty_id UUID REFERENCES faculty,
  subject_id VARCHAR,
  section_id VARCHAR,
  status VARCHAR,
  submitted_at TIMESTAMP,
  approved_by UUID REFERENCES users,
  approved_at TIMESTAMP,
  rejected_by UUID REFERENCES users,
  rejected_at TIMESTAMP,
  comment TEXT,
  created_at TIMESTAMP
)

-- Classrooms
CREATE TABLE classrooms (
  id UUID PRIMARY KEY,
  name VARCHAR,
  room_type VARCHAR,
  capacity INT,
  created_at TIMESTAMP
)

-- Schedules
CREATE TABLE schedules (
  id UUID PRIMARY KEY,
  subject_id VARCHAR,
  section_id VARCHAR,
  faculty_id UUID REFERENCES faculty,
  classroom_id UUID REFERENCES classrooms,
  time_block VARCHAR,
  day VARCHAR,
  semester INT,
  academic_year INT,
  created_at TIMESTAMP
)
```

### Task 7.2: API Endpoints

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh

GET    /api/programs
GET    /api/programs/:id/sections
GET    /api/subjects
GET    /api/subjects/:id
GET    /api/faculty
GET    /api/faculty/:id

GET    /api/assignments
POST   /api/assignments
PATCH  /api/assignments/:id
DELETE /api/assignments/:id

POST   /api/assignments/:id/approve
POST   /api/assignments/:id/reject

GET    /api/schedules
POST   /api/schedules/generate
PATCH  /api/schedules/:id/finalize

GET    /api/classrooms
POST   /api/classrooms
PATCH  /api/classrooms/:id
```

### Task 7.3: Frontend API Integration

Replace localStorage calls with API calls:

```javascript
// OLD (localStorage)
const assignments = JSON.parse(localStorage.getItem('assignments'))

// NEW (API)
const { data: assignments } = await axios.get('/api/assignments')
```

---

## Testing Scenarios

### Scenario 1: Happy Path (All Approved)

**Steps:**
1. Login as Admin
2. Assign all subjects for CP 1st Year Section 1
3. Submit section for review
4. Login as Program Head (BTVTED)
5. Review and approve section
6. Generate schedule
7. Login as Registrar
8. Finalize schedule

**Expected:**
- ✓ Schedule generated with no conflicts
- ✓ All subjects have rooms and teachers
- ✓ No teacher teaches overlapping classes
- ✓ No room double-booked

---

### Scenario 2: Rejection Workflow

**Steps:**
1. Admin assigns CCPROG102 to Jane Smith (not a CP specialist)
2. Submit section
3. Program Head sees "Specialization mismatch" warning
4. Reject with comment "Need CP specialist for CCPROG102"
5. Admin reassigns CCPROG102 to John Doe (CP specialist)
6. Resubmit
7. Program Head approves

**Expected:**
- ✓ Validation catches specialization mismatch
- ✓ Program Head can see and approve on resubmit
- ✓ Assignment updates correctly

---

### Scenario 3: Workload Limit

**Steps:**
1. Admin tries to assign 8 units to Teacher A (already at 18/18 units)
2. System prevents assignment

**Expected:**
- ✗ Assignment blocked
- ✓ Error message: "Teacher at max units (18/18)"

---

### Scenario 4: Full Curriculum Assignment

**Steps:**
1. Admin assigns all 32 sections (BTVTED, BECED, BSE, all year levels)
2. All Program Heads approve their sections
3. Generate schedule for all approved sections

**Expected:**
- ✓ 128+ classes scheduled (4 year levels × sections × multiple subjects)
- ✓ No conflicts
- ✓ Time blocks respected (1st AM, 2nd PM, 3rd Evening, 4th Field)

---

## Troubleshooting

### Issue: "Section not found" error

**Cause:** Section ID mismatch between frontend and data  
**Fix:** Check `programs.js` section naming matches `subjects.js`

### Issue: Teachers disappearing from dropdown

**Cause:** Teacher doesn't match selected program  
**Fix:** Verify `facultySeed.js` includes teacher in program's faculty list

### Issue: Schedule shows conflicts

**Cause:** Time block algorithm not accounting for all overlaps  
**Fix:** Check `timesOverlap()` function handles all time comparisons

### Issue: Section won't submit for review

**Cause:** Required subjects not all assigned  
**Fix:** Verify all subjects in curriculum are included in assignment attempt

---

## Quick Commands

```bash
# Start frontend dev server
cd frontend
npm run dev

# Build frontend
npm run build

# Run backend
docker compose up --build

# Check backend health
curl http://localhost:8000/health

# View mock data
cat frontend/src/data/facultySeed.js
cat frontend/src/data/subjects.js
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `frontend/src/pages/admin/LoadAssignmentPage.jsx` | Admin load assignment UI |
| `frontend/src/pages/head/ApprovalsPage.jsx` | Program Head approval UI |
| `frontend/src/pages/registrar/RegistrarPage.jsx` | Registrar finalization UI |
| `frontend/src/pages/SchedulerPage.jsx` | Scheduler UI |
| `frontend/src/data/DataContext.jsx` | Central data management |
| `frontend/src/data/scheduler.js` | Scheduling algorithm (to create) |
| `frontend/src/data/facultySeed.js` | Mock faculty data |
| `frontend/src/data/subjects.js` | Mock curriculum |
| `frontend/src/data/programs.js` | Program & section definitions |
| `backend/main.py` | FastAPI entry point |

---

## Next Steps

1. Review this guide
2. Start with Week 1-2 tasks (section-first UX)
3. Test with scenarios from [Testing Scenarios](#testing-scenarios)
4. Move to Week 3 (Program Head dashboard)
5. Continue sequentially

**Estimated Total Time:** 6-8 weeks for full implementation  
**Current Progress:** Week 0 (foundation complete, UX refinement ready)

Good luck! 🚀
