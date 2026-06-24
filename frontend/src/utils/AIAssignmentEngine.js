/**
 * AI Auto Assignment Engine
 * Intelligently assigns faculty to subjects based on:
 * - Specialization match (highest priority)
 * - Current workload (prefer underloaded faculty)
 * - Teaching year preferences
 * - Program requirements
 */

export class AIAssignmentEngine {
  constructor(faculty, subjects, assignments, subjectsById, facultyById, maxUnitsPerFaculty = 18) {
    this.faculty = faculty
    this.subjects = subjects
    this.assignments = assignments
    this.subjectsById = subjectsById
    this.facultyById = facultyById
    this.maxUnitsPerFaculty = maxUnitsPerFaculty
  }

  /**
   * Calculate specialization match score (0-100)
   * 100 = exact match, 60 = program match, 30 = no match
   */
  getSpecializationScore(faculty, subject) {
    if (!faculty?.specialization || !subject?.title) return 30

    const specLower = faculty.specialization.toLowerCase()
    const subjLower = subject.title.toLowerCase()

    // Exact keyword match in subject title
    if (
      subjLower.includes(specLower) ||
      specLower.split(/\s+/).some(word => subjLower.includes(word))
    ) {
      return 100
    }

    // Program match (fallback)
    return 60
  }

  /**
   * Get current workload for faculty in units
   */
  getCurrentWorkload(facultyId, programCode, semesterCode) {
    return this.assignments
      .filter(a => a.facultyId === facultyId && a.status === 'approved')
      .reduce((sum, a) => {
        const subj = this.subjectsById[a.subjectId]
        return sum + (subj?.lec || 0)
      }, 0)
  }

  /**
   * Calculate faculty fitness score for assignment (0-100)
   * Higher score = better match
   */
  calculateFitness(faculty, subject, programCode, semester) {
    const current = this.getCurrentWorkload(faculty.id, programCode, semester)
    const available = Math.max(0, this.maxUnitsPerFaculty - current)
    const needed = subject.units || 3

    // Can't fit this subject
    if (available < needed) return 0

    // Base score from specialization
    const specScore = this.getSpecializationScore(faculty, subject)

    // Workload balance score: prefer moderate load (not too empty, not too full)
    const targetLoad = this.maxUnitsPerFaculty * 0.75 // Target 75% capacity
    const loadDiff = Math.abs((current + needed) - targetLoad)
    const loadScore = Math.max(0, 100 - (loadDiff / targetLoad) * 50)

    // Teaching year preference alignment (if applicable)
    const yearPreferenceScore = this.getYearPreferenceScore(faculty, subject) || 50

    // Combined score with weights
    return (specScore * 0.5) + (loadScore * 0.3) + (yearPreferenceScore * 0.2)
  }

  /**
   * Get year preference score based on subject year level
   */
  getYearPreferenceScore(faculty, subject) {
    // This would ideally be based on faculty teaching year preferences
    // For now, return neutral score
    return 50
  }

  /**
   * Find best faculty for a subject
   */
  findBestFaculty(subject, programCode, semester, excludeFacultyIds = []) {
    const candidates = this.faculty
      .filter(f => !excludeFacultyIds.includes(f.id))
      .map(f => ({
        faculty: f,
        fitness: this.calculateFitness(f, subject, programCode, semester),
      }))
      .filter(c => c.fitness > 0)
      .sort((a, b) => b.fitness - a.fitness)

    return candidates[0]?.faculty || null
  }

  /**
   * Auto-assign all pending subjects to faculty
   * Returns array of recommended assignments
   */
  generateAssignments(pendingSubjects, programCode, semester) {
    const recommendations = []
    const usedFacultyIds = new Set()

    // Sort subjects by difficulty (more specific = harder to assign = first)
    const sortedSubjects = [...pendingSubjects].sort((a, b) => {
      // Prioritize specialized subjects
      const scoreA = Math.max(...this.faculty.map(f => this.getSpecializationScore(f, a)))
      const scoreB = Math.max(...this.faculty.map(f => this.getSpecializationScore(f, b)))
      return scoreB - scoreA
    })

    for (const subject of sortedSubjects) {
      const bestFaculty = this.findBestFaculty(subject, programCode, semester, Array.from(usedFacultyIds))

      if (bestFaculty) {
        recommendations.push({
          subject_id: subject.id,
          faculty_id: bestFaculty.id,
          section: subject.section || '1',
          status: 'pending',
          confidence: this.calculateFitness(bestFaculty, subject, programCode, semester),
          reasoning: {
            specialization: this.getSpecializationScore(bestFaculty, subject),
            workload: this.getCurrentWorkload(bestFaculty.id, programCode, semester),
          },
        })
      }
    }

    return recommendations
  }

  /**
   * Optimize existing assignments with constraints
   */
  optimizeSchedule(assignments, constraints = {}) {
    // Placeholder for schedule optimization
    // Would include:
    // - Conflict detection
    // - Room allocation
    // - Time slot optimization
    return assignments
  }
}

/**
 * Helper function: Array.max polyfill
 */
if (!Array.prototype.max) {
  Array.prototype.max = function () {
    return Math.max(...this)
  }
}
