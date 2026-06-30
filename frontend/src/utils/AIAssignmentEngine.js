// AIAssignmentEngine.js — REMOVED
//
// This file previously contained an AIAssignmentEngine class that was never
// imported or used anywhere in the application. It also referenced incorrect
// field names (faculty.specialization instead of fac.spec, subject.units
// instead of subject.lec + subject.lab).
//
// The functionality it aimed to provide is fully covered by:
//   • DataContext.getFacultyRecommendations(subjectId) — smart top-5 candidate ranking
//   • DataContext.getFacultyWorkload(ay, sem)           — workload analytics
//   • data/validation.js checkAssignmentCompatibility() — per-assignment rules
//   • data/specCategories.js specMatchScore()           — proper spec matching
//
// If a standalone AI engine is needed in the future (e.g. for bulk auto-assign),
// build it in this file and import specMatchScore + getFacultyMaxUnits from
// the modules above so field names and scoring stay consistent.
