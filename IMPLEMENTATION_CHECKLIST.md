# CCD-TLSS Implementation Checklist

Quick reference for daily progress tracking.

## 📋 Week 1-2: Section-First Load Assignment UX

### Day 1-2: Section Selector Component
- [ ] Create `SectionSelector.jsx` component
- [ ] Input: `program`, `yearLevel`
- [ ] Output: Shows all sections (e.g., "CP 1st Year - Section 1", "CP 1st Year - Section 2")
- [ ] Add to `LoadAssignmentPage.jsx`

**Test:** Can select and display sections

### Day 3-4: Required Subjects Display
- [ ] Modify `LoadAssignmentPage.jsx` to show required subjects when section selected
- [ ] Display format:
  ```
  □ CCPROG101 - Intro to Programming (3 units, Lecture)
  □ CCPROG102 - Logic Design (4 units, Lab)
  □ CMATH101 - Calculus (3 units, Lecture)
  ...
  ```
- [ ] Each subject shows assignment status (assigned/unassigned)
- [ ] Click on subject to assign teacher

**Test:** Show CP1-1 subjects correctly

### Day 5-6: Assignment Modal
- [ ] Create `AssignmentModal.jsx` component
- [ ] Show selected subject details
- [ ] Filter faculty by specialization
- [ ] Validate workload before assigning
- [ ] Handle duplicate prevention

**Test:** Assign subject to teacher without errors

### Day 7-8: Progress Indicator
- [ ] Add progress bar to section view
- [ ] Show "5/8 subjects assigned"
- [ ] Color code: red (0-33%), yellow (34-66%), green (67-100%)
- [ ] Disable "Submit Section" until 100% complete

**Test:** Progress updates as subjects assigned

### Day 9-10: Submit Section Button
- [ ] Change from individual assignment submission to section submission
- [ ] Add button: "Submit Entire Section for Review"
- [ ] On click: Mark all assignments in section as "pending_review"
- [ ] Show confirmation: "Submitted 8 subjects to Program Head for review"
- [ ] Hide submitted sections from assignment view

**Test:** Submit section, verify in Program Head account

### Testing
- [ ] Complete BTVTED CP 1st Year - Section 1
- [ ] Verify Program Head can see it as pending
- [ ] Verify Admin cannot see completed sections in assignment view

---

## 📋 Week 3: Program Head Dashboard Enhancement

### Day 1-3: Group by Section
- [ ] Modify `ApprovalsPage.jsx` to group assignments by section
- [ ] Group structure: `{ sectionId → [assignment1, assignment2, ...] }`
- [ ] Display section card instead of individual cards

**Test:** Show all CP1-1 assignments grouped together

### Day 4-5: Section Status Card
- [ ] Create `SectionReviewCard.jsx` component
- [ ] Show:
  ```
  Section: CP 1st Year - Section 1
  Status: Ready for Review (8/8 subjects)
  Program: BTVTED (CP)
  Submitted: Jun 23, 2025 10:30 AM
  
  [View Assignments] [Approve] [Request Changes]
  ```

**Test:** Can view section details

### Day 6-8: Expandable Assignment List
- [ ] Inside section card, show expandable list of assignments
- [ ] Format:
  ```
  ✓ CCPROG101 → John Doe (CP Specialist, 3/18 units)
  ✓ CCPROG102 → Jane Smith (CP Specialist, 15/18 units)
  ⚠ CMATH101 → (BLOCKER: Teacher not certified in Math)
  ```
- [ ] Show compatibility notes/blockers

**Test:** Expand section to see all assignments

### Day 9-10: Bulk Approve/Reject
- [ ] Add "Approve Entire Section" button
  - Marks all assignments as approved
  - Records approval time & user
- [ ] Add "Request Changes" button
  - Prompts for feedback comment
  - Marks entire section as rejected
  - Returns to Admin

**Test:** Approve section, verify Admin sees completed status

### Testing
- [ ] Admin submits section
- [ ] Program Head reviews and approves
- [ ] Admin sees section marked as approved
- [ ] Cannot re-edit approved sections

---

## 📋 Week 4-5: React Scheduler

### Day 1-3: Scheduler Page Setup
- [ ] Create `SchedulerPage.jsx` (replace legacy iframe)
- [ ] Add filters:
  - Program selector
  - Year level toggles
  - Time block preferences
- [ ] Add buttons: "Generate", "Preview", "Save"

**Test:** Page loads, filters visible

### Day 4-5: Scheduling Algorithm
- [ ] Create `frontend/src/data/scheduler.js`
- [ ] Implement `generateSchedule()` function
- [ ] Algorithm:
  1. Get all approved section loads
  2. For each subject: assign time block (1st→AM, 2nd→PM, 3rd→Eve, 4th→Field)
  3. Find available room matching subject's room type
  4. Check teacher availability
  5. Check for conflicts
  6. Add to schedule

**Test:** Generate schedule without errors

### Day 6-7: Conflict Detection
- [ ] Implement `checkScheduleConflicts()` function
- [ ] Check:
  - Teacher conflicts (same teacher, overlapping times)
  - Room conflicts (same room, overlapping times)
  - Section conflicts (section at 2+ places)
- [ ] Return list of conflicts with descriptions

**Test:** Detect conflicts in test data

### Day 8-10: Calendar View Display
- [ ] Create `ScheduleCalendarView.jsx` component
- [ ] Display schedule in table format:
  ```
  Time | Monday | Tuesday | Wednesday | Friday
  ─────┼────────┼─────────┼───────────┼────────
  7:30 | Class  | Class   | Class     |
  8:30 | Class  | Class   | Class     |
  ...
  ```
- [ ] Show: Subject, Room, Teacher
- [ ] Highlight conflicts in red
- [ ] Add "Export PDF" button

**Test:** Display generated schedule correctly

### Testing
- [ ] Generate schedule for all approved sections
- [ ] Verify no conflicts
- [ ] Verify all subjects scheduled
- [ ] Verify time blocks followed (1st=AM, 2nd=PM, etc.)

---

## 📋 Week 6: Testing & Polish

### Day 1-2: Happy Path Test
- [ ] Follow full workflow:
  1. Admin assigns all CP 1st Year - Section 1 subjects
  2. Submit for review
  3. Program Head approves
  4. Generate schedule
  5. Registrar finalizes
- [ ] Verify schedule generated with no conflicts

**Test:** Full workflow succeeds

### Day 3-4: Rejection & Re-assignment Test
- [ ] Program Head rejects section with comment
- [ ] Admin sees comment
- [ ] Admin reassigns problematic subject
- [ ] Resubmit
- [ ] Program Head approves resubmission

**Test:** Rejection workflow works

### Day 5-6: Workload Limit Test
- [ ] Try to assign 20 units to teacher with 18 max
- [ ] Verify blocked with error
- [ ] Try to assign 15 units (within 18)
- [ ] Verify allowed

**Test:** Workload validation works

### Day 7: Multi-Program Test
- [ ] Assign all BTVTED sections
- [ ] Assign all BECED sections
- [ ] Assign all BSE sections
- [ ] Generate schedule for all
- [ ] Verify no cross-program conflicts

**Test:** Large schedule generates correctly

### Day 8-10: Polish & Performance
- [ ] Add loading spinners
- [ ] Improve error messages
- [ ] Add success toast notifications
- [ ] Test on mobile/tablet
- [ ] Profile performance bottlenecks

**Test:** App feels smooth and responsive

---

## 📋 Week 7+: Backend Integration (Future)

### Phase 1: Database Setup
- [ ] Create Supabase project
- [ ] Design schema (users, faculty, assignments, schedules)
- [ ] Create tables and indexes
- [ ] Seed initial data

### Phase 2: API Endpoints
- [ ] Create FastAPI endpoints for all operations
- [ ] Implement authentication (JWT)
- [ ] Test with Postman/Insomnia

### Phase 3: Frontend Integration
- [ ] Replace localStorage with API calls
- [ ] Update DataContext to use axios
- [ ] Test full workflow with real backend

---

## 🧪 Test Accounts (Already Setup)

```
ADMIN
  admin@ccd.edu.ph / admin123

PROGRAM HEADS
  head.btvted@ccd.edu.ph / head123
  head.beced@ccd.edu.ph / head123
  head.bsentrep@ccd.edu.ph / head123

REGISTRAR
  registrar@ccd.edu.ph / registrar123

FACULTY
  romel.salazar@ccd.edu.ph / teacher123
  (+ 50+ more)
```

---

## 📂 Key Files to Edit

### Week 1-2
- `frontend/src/pages/admin/LoadAssignmentPage.jsx` — Main changes
- `frontend/src/data/DataContext.jsx` — Add helper functions
- Create: `frontend/src/components/SectionSelector.jsx`
- Create: `frontend/src/components/AssignmentModal.jsx`

### Week 3
- `frontend/src/pages/head/ApprovalsPage.jsx` — Main changes
- Create: `frontend/src/components/SectionReviewCard.jsx`

### Week 4-5
- `frontend/src/pages/SchedulerPage.jsx` — Main changes (already exists)
- Create: `frontend/src/data/scheduler.js`
- Create: `frontend/src/components/ScheduleCalendarView.jsx`

### Week 6+
- Various (polish, testing)

---

## 🚀 Daily Progress Template

```
### Day N: [Task Name]

**Completed:**
- [ ] Task 1
- [ ] Task 2

**Tested:**
- [ ] Scenario 1
- [ ] Scenario 2

**Issues Found:**
- Issue A: [description]
  Fix: [solution]

**Next Day:**
- [ ] Task 3
- [ ] Task 4
```

---

## 🎯 Success Criteria

### Week 1-2 Complete When:
- ✅ Admin can select section and see all required subjects
- ✅ Admin can assign all subjects to teachers in one workflow
- ✅ Admin can submit entire section for review
- ✅ Program Head sees section as pending (grouped by section)

### Week 3 Complete When:
- ✅ Program Head can approve/reject entire sections
- ✅ Rejected sections return to Admin
- ✅ Admin can resubmit updated sections

### Week 4-5 Complete When:
- ✅ Schedule generates without crashes
- ✅ No conflicts in generated schedule
- ✅ All subjects have rooms and teachers
- ✅ Calendar view displays correctly

### Week 6 Complete When:
- ✅ Full workflow succeeds end-to-end
- ✅ All test scenarios pass
- ✅ No performance issues
- ✅ Mobile responsive

---

## 💡 Tips

- **Test frequently** — Don't wait until end of week
- **Use browser DevTools** — Check console for errors
- **Update DataContext carefully** — It's the source of truth
- **Commit to git regularly** — Push after each daily success
- **Document bugs** — Write them down for fixing

Good luck! 🚀
