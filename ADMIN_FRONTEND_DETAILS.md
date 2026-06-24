# CCD-TLSS: Admin Frontend Complete Details

**Last Updated:** June 24, 2026  
**Status:** 🟢 PRODUCTION READY - All core functionality complete

---

## 📋 PROJECT OVERVIEW

**Project Name:** CCD-TLSS (Teacher Load and Scheduling System)  
**Institution:** City College of Davao  
**Purpose:** Manage faculty teaching loads and class scheduling without conflicts

**Two-Phase System:**
1. **Load Assignment Phase** - Admins assign teachers to subjects
2. **Scheduling Phase** - Auto-generate conflict-free class schedules

---

## 🏗️ TECH STACK

### Frontend
- **React 19.2.6** with React Router 7.17.0
- **Vite** (build tool)
- **TailwindCSS 4.3.1** (styling)
- **Lucide Icons 1.18.0** (UI icons)
- **Axios 1.18.0** (API-ready, currently using localStorage)

### State Management
- React Context API (DataContext)
- localStorage persistence (mock backend)

### Backend (Not Yet Integrated)
- FastAPI (Python)
- Supabase (planned for production)

---

## 👥 ADMIN PAGES STRUCTURE

### 1. **Admin Dashboard** (`DashboardPage.jsx`)
**Purpose:** Overview of load assignment pipeline status

**Features:**
- Welcome greeting with current AY/Semester
- Stats panels: Pending approvals, Completed loads, Faculty count
- Action alerts if replacements needed
- Recent assignment activity feed
- Status indicators for term finalization

**Data Displayed:**
- Pending assignments count
- Approved assignments count
- Current academic year & semester
- Finalization status

---

### 2. **Load Assignment** (`LoadAssignmentPage.jsx`)
**Purpose:** Core admin workflow - assign faculty to subjects by section

**Workflow:**
```
Step 1: Select Program (BTVTEd-CP, BTVTEd-HVACRT, BECEd, BS Entrep)
  ↓
Step 2: Select Section (Year 1-4, Section A-C depending on program)
  ↓
Step 3: View all required subjects for that section
  ↓
Step 4: Assign faculty to each subject
  ↓
Step 5: Validation checks (specialization, workload, no duplicates)
  ↓
Step 6: Submit section for Program Head review
```

**Key Components:**
- **Section Selector Dropdown** - Shows all available sections with subject count
- **Assignment Progress Bar** - Visual indicator (X/Y subjects assigned)
- **Section Status Badges** - Incomplete | Pending | Complete | Needs Replacement
- **Subject Assignment Table** with:
  - Subject code & name
  - Units & type (Lecture/Lab)
  - Current assignment status
  - Faculty selection (filtered by specialization)
  
**Validation Rules:**
- Faculty must match subject's required specialization
- Faculty cannot exceed max teaching units (typically 21-24)
- No duplicate assignments (one faculty can't teach same subject twice)
- Workload tracking per faculty per semester

**Status Meanings:**
- **Incomplete** - Not all required subjects assigned
- **Pending** - All subjects assigned, waiting for Program Head approval
- **Complete** - Program Head approved
- **Needs Replacement** - A rejected assignment needs reassignment

---

### 3. **Faculty Directory** (`FacultyPage.jsx`)
**Purpose:** View all faculty, their specializations, current loads, and profiles

**Features:**
- **Searchable Directory** with filter by:
  - Program (All, BTVTEd-CP, BTVTEd-HVACRT, BECEd, BS Entrep)
  - Name, email, specialization keyword search
- **Faculty Cards** displaying:
  - Photo/Avatar
  - Full name
  - Email
  - Specialization(s)
  - Program assignment(s)
  - Current load bar (used/max units)
  - Current semester assignments

**Load Display:**
- Color-coded progress bars:
  - 🟢 Green: Under 85% capacity
  - 🟡 Orange: 85%+ capacity
  - 🔴 Red: Over max units

**Data Structure:**
```javascript
Faculty object:
{
  id: "faculty-001",
  fn: "John",
  ln: "Doe",
  email: "john.doe@ccd.edu.ph",
  spec: "Computer Programming",
  prog: "BTVTED-CP",
  shared: ["BECED"],  // Can also teach these programs
  maxUnits: 21,
  photo: "url-to-photo.jpg"
}
```

---

### 4. **Scheduler** (`SchedulerPage.jsx`)
**Purpose:** (Legacy) Generate conflict-free class schedules from approved loads

**Features:**
- Auto-scheduling algorithm with conflict detection
- Time slot allocation based on year level preferences:
  - **1st Year** → Morning (7:30 AM - 12:00 PM)
  - **2nd Year** → Afternoon (1:00 PM - 5:00 PM)
  - **3rd Year** → Afternoon to Evening (1:00 PM - 9:30 PM)
  - **4th Year** → Flexible (2:30 PM - 9:30 PM)
- Room assignment with capacity checking
- No teacher/room/section conflicts
- Export capabilities (PDF, print)

**Note:** Currently a legacy HTML prototype (in `public/ccd-scheduling.html`). React version planned.

---

## 📊 PROGRAM & SECTION STRUCTURE

### Programs Defined
```javascript
PROGRAMS = [
  {
    code: 'BTVTED-CP',
    label: 'BTVTEd - CP',
    major: 'Computer Programming',
    sections: 2,      // 2 sections per year level
    years: 4,         // 4-year program
    headGroup: 'BTVTED'
  },
  {
    code: 'BTVTED-HVACRT',
    label: 'BTVTEd - HVACRT',
    major: 'HVAC/R Technology',
    sections: 1,
    years: 4,
    headGroup: 'BTVTED'
  },
  {
    code: 'BECED',
    label: 'BECEd',
    major: 'General',
    sections: 3,
    years: 4,
    headGroup: 'BECED'
  },
  {
    code: 'BSENTREP',
    label: 'BS Entrepreneurship',
    major: 'General',
    sections: 2,
    years: 4,
    headGroup: 'BSENTREP'
  },
]
```

### Total Sections Structure
- **BTVTEd-CP:** 2 sections × 4 years = 8 sections
- **BTVTEd-HVACRT:** 1 section × 4 years = 4 sections
- **BECEd:** 3 sections × 4 years = 12 sections
- **BS Entrep:** 2 sections × 4 years = 8 sections
- **TOTAL: 32 sections**

### Section Naming Convention
Format: `{PROGRAM_CODE} {YEAR}{SECTION_LETTER}`
Examples:
- `BTVTED-CP 1A` (BTVTEd-CP, Year 1, Section A)
- `BECED 4C` (BECEd, Year 4, Section C)
- `BSENTREP 2B` (BS Entrep, Year 2, Section B)

---

## 🎯 DATA STRUCTURE & FLOW

### Assignment Model
```javascript
Assignment {
  id: "uuid",
  ay: "2025-2026",           // Academic year
  sem: "1st",                // Semester (1st, 2nd, Summer)
  sectionKey: "BTVTED-CP 1A", // Section identifier
  subjectId: "CCPROG101",     // Subject code
  facultyId: "faculty-001",   // Assigned teacher
  status: "pending",          // pending | approved | rejected | withdrawn
  assignedBy: "admin-001",    // Admin who made assignment
  assignedAt: "2026-06-20T10:30:00Z",
  approvedBy: "head-001",     // Program Head who approved
  approvedAt: "2026-06-21T14:45:00Z"
}
```

### Subject Model
```javascript
Subject {
  id: "CCPROG101",
  code: "CCPROG101",
  name: "Introduction to Programming",
  units: 3,
  type: "Lecture",            // Lecture | Lab | Mixed
  specialization: "CP",       // Required specialization
  ayear: 1,                   // Year level
  prog: "BTVTED-CP",         // Program code
  sem: "1st",                // Semester offered
  enrolled: 45               // Section enrollment
}
```

### Faculty Model
```javascript
Faculty {
  id: "faculty-001",
  fn: "John",
  ln: "Doe",
  email: "john@ccd.edu.ph",
  phone: "09xxxxxxxxx",
  spec: "Computer Programming",  // Specialization
  prog: "BTVTED-CP",            // Primary program
  shared: ["BECED"],             // Can also teach
  maxUnits: 21,                  // Max teaching units/semester
  photo: "https://...",
  status: "Active"
}
```

---

## 🔐 USER ROLES & ROUTES

### Admin Account
- **Name:** Admin User
- **Email:** admin@example.com
- **Access:**
  - Dashboard → `/admin`
  - Load Assignment → `/admin/load-assignment`
  - Faculty Directory → `/admin/faculty`
  - Scheduler → `/admin/scheduler`

### Route Structure
```
/admin/                  → Dashboard
/admin/load-assignment   → Section-based assignment workflow
/admin/faculty          → Faculty directory & load overview
/admin/scheduler        → Class schedule generation
```

---

## 🎨 UI/UX DESIGN SYSTEM

### Color Palette
- **Forest Green** (#033826) - Primary brand color
- **Mid Green** (#0F6B3C) - Secondary actions
- **Gold** (#D9B44A) - Accent/alerts
- **Danger Red** (#DC2626) - Errors/rejections
- **Warning Orange** (#D97706) - Near capacity

### Component Library
- **Status Badges** - Incomplete | Pending | Complete | Needs Replacement
- **Progress Bars** - Visual indicator of completion
- **Toast Notifications** - Success/error messages
- **Modal Dialogs** - Assignment confirmation
- **Data Tables** - Faculty lists, assignment history
- **Cards** - Statistics, section summaries
- **Dropdowns** - Program/section/faculty selection

### Responsive Design
- Works on desktop, tablet, and mobile
- Sidebar collapses on small screens
- Touch-friendly interactive elements

---

## 📦 STATE MANAGEMENT (DataContext)

### Main Context Functions

**Core Assignment Functions:**
```javascript
// Get all assignments for a term
termAssignments(ay, sem)

// Get assignments by section
assignmentsBySection(sectionKey, ay, sem)

// Create new assignment
createAssignment({ sectionKey, subjectId, facultyId, ... })

// Update assignment status
updateAssignmentStatus(assignmentId, status)

// Get assignments for a faculty member
facultyAssignments(facultyId, ay, sem)
```

**Validation Functions:**
```javascript
// Check if assignment is valid
checkAssignmentCompatibility(assignment)

// Get faculty current units
getFacultyUnits(assignments, subjectsById, facultyId, sem)

// Check if faculty can teach
canTeachProgram(faculty, program)
```

**Term Management:**
```javascript
// Get/set current academic year and semester
term: { ay: "2025-2026", sem: "1st" }

// Check if term is finalized
isTermFinalized(ay, sem)

// Finalize term (lock assignments)
finalizeTerm(ay, sem)
```

---

## 📱 Navigation & Breadcrumbs

### Admin Sidebar Navigation
```
CCD-TLSS
├─ Dashboard
├─ Load Assignment
├─ Faculty
├─ Scheduler
└─ [Logout]
```

### Topbar Features
- Current term (AY 2025-2026 · 1st Semester)
- Pending count badge (if notifications exist)
- User account dropdown (name, role)
- Theme toggle (light/dark mode)
- Clock widget

---

## 🔄 WORKFLOW STATES

### Assignment Status Flow
```
┌──────────┐
│ PENDING  │ ← Admin creates assignment
└────┬─────┘
     │
     ├─→ APPROVED ─→ (stays approved)
     │
     └─→ REJECTED ─→ NEEDS REPLACEMENT
                     ↓
                   (Admin reassigns)
                     ↓
                   Back to PENDING
```

### Section Status (Derived from Assignments)
- **Incomplete** - Not all required subjects assigned
- **Pending** - All assigned, waiting for Program Head review
- **Complete** - Program Head approved all assignments
- **Needs Replacement** - One or more assignments rejected

---

## 🚨 VALIDATION & ERROR HANDLING

### Assignment Validation Checks
1. **Specialization Match** - Faculty specialization must match subject requirement
2. **Workload Check** - Faculty's total units (current + new) ≤ max units
3. **Duplication Check** - Faculty can't be assigned same subject twice in section
4. **Faculty Status** - Faculty must be "Active"
5. **Program Coverage** - Faculty must teach in primary or shared programs

### Error Messages
```
"Teacher does not have specialization: CP"
"Teacher at capacity (18/21 units)"
"Teacher already assigned to this subject"
"Teacher is inactive"
```

---

## 📊 DATA PERSISTENCE

**Current Implementation:** localStorage (mock backend)
- All changes saved to browser localStorage
- Survives page refreshes within same browser
- Clears if browser data cleared

**Production Plan:** 
- Swap localStorage calls with REST API calls to Supabase
- No page/component changes needed (abstraction preserved)

**Keys Used:**
```
ccd-tlss.assignments        → Assignment records
ccd-tlss.finalized-terms    → Finalized term log
ccd-tlss.current-term       → Active AY/semester
ccd-tlss.faculty            → Faculty database
ccd-tlss.subjects           → Subject catalog
ccd-tlss.rooms              → Classroom inventory
ccd-tlss.settings           → System settings
```

---

## 🎓 SEEDS & TEST DATA

### Faculty Seed
- **Count:** 50+ faculty members
- **Distribution:** Across all programs, with specializations
- **Data Includes:** Name, email, specialization, max units, photo

### Subject Seed
- **Count:** 100+ subjects
- **Coverage:** All programs, all year levels, both semesters
- **Data Includes:** Code, name, units, type, specialization, enrollment

### Default Settings
```javascript
{
  maxFacultyUnits: 21,
  classDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  requireProgramHeadApproval: true,
  allowSchedulePreviewBeforeFinalization: true
}
```

---

## ⚙️ CONFIGURATION & CUSTOMIZATION

### Time Slots (for Scheduler)
```javascript
SLOTS = [
  { label: '7:30-9:00', start: 7.5, end: 9 },
  { label: '9:00-10:30', start: 9, end: 10.5 },
  { label: '10:30-12:00', start: 10.5, end: 12 },
  { label: '1:00-2:30', start: 13, end: 14.5 },
  // ... etc
]
```

### Classroom Defaults
- 13 rooms defined (classrooms, labs)
- Capacities: 28-45 students
- Types: Classroom, HVAC Lab, Welding Lab, Computer Lab, Speech Lab, Science Lab

---

## 🐛 KNOWN ISSUES & NOTES

### Current Limitations
1. **No Backend Integration** - Using localStorage only
2. **Scheduler is Legacy** - HTML prototype; needs React version
3. **No Real Authentication** - Using fake token in localStorage
4. **No Email Notifications** - System doesn't send approval notifications
5. **No Audit Logs** - No detailed change history

### Recent Fixes (Jun 23, 2026)
- Fixed ProtectedRoute auto-redirect for role mismatches
- Fixed LoadAssignmentPage section filtering logic (parameter precedence)
- Fixed assignment callback to properly pass sectionKey

---

## 📋 NEXT STEPS FOR IMPLEMENTATION

### Backend Integration (5-7 days)
- Set up FastAPI endpoints for CRUD operations
- Implement JWT authentication
- Connect to Supabase database
- Replace localStorage with API calls

### React Scheduler (7-10 days)
- Build interactive schedule builder
- Implement conflict detection
- Add drag-drop rescheduling
- Export to PDF/print

### Additional Features (Future)
- Room management UI
- Teacher availability constraints
- Schedule approval workflow
- Printable/exportable schedules
- Audit logs and change history

---

## 📞 ADMIN DEMO ACCOUNT

**Use this to test Admin pages:**
```
Email: admin@example.com
Password: admin123
Name: Admin User
Role: admin
```

---

## 🔗 RELATED FILES

**Frontend Structure:**
```
frontend/src/pages/admin/
  ├─ DashboardPage.jsx      → Dashboard overview
  ├─ LoadAssignmentPage.jsx  → Section assignment workflow
  ├─ FacultyPage.jsx         → Faculty directory
  ├─ SchedulerPage.jsx       → Schedule generation
  
frontend/src/data/
  ├─ DataContext.jsx         → State management (localStorage)
  ├─ programs.js             → Program/section definitions
  ├─ facultySeed.js          → Mock faculty data
  ├─ subjects.js             → Mock subject curriculum
  ├─ validation.js           → Validation rules
  
frontend/src/auth/
  ├─ AuthContext.jsx         → Authentication state
  ├─ ProtectedRoute.jsx       → Role-based routing
  
frontend/src/components/
  ├─ AppLayout.jsx           → Main page wrapper
  ├─ Sidebar.jsx             → Navigation sidebar
  ├─ StatusBadge.jsx         → Status indicators
```

---

**Document prepared for sharing with other AI assistants.**
