// Program + section metadata. Mirrors PROGRAM_META in public/ccd-scheduling.html.
// "headGroup" is which Program Head account is responsible for approving loads
// for that program — BTVTEd's two majors share one head, matching the school's
// 3-Program-Head structure (BTVTEd / BECEd / BSEntrep).
export const PROGRAMS = [
  {
    code: 'BTVTED-CP',
    label: 'BTVTEd - CP',
    name: 'Bachelor of Technical-Vocational Teacher Education',
    major: 'Computer Programming',
    sections: 2,
    years: 4,
    headGroup: 'BTVTED',
  },
  {
    code: 'BTVTED-HVACRT',
    label: 'BTVTEd - HVACRT',
    name: 'Bachelor of Technical-Vocational Teacher Education',
    major: 'HVAC/R Technology',
    sections: 1,
    years: 4,
    headGroup: 'BTVTED',
  },
  {
    code: 'BECED',
    label: 'BECEd',
    name: 'Bachelor of Early Childhood Education',
    major: 'General',
    sections: 3,
    years: 4,
    headGroup: 'BECED',
  },
  {
    code: 'BSENTREP',
    label: 'BS Entrepreneurship',
    name: 'Bachelor of Science in Entrepreneurship',
    major: 'General',
    sections: 2,
    years: 4,
    headGroup: 'BSENTREP',
  },
]

export const PROGRAM_BY_CODE = Object.fromEntries(PROGRAMS.map((p) => [p.code, p]))

export function programLabel(code) {
  return PROGRAM_BY_CODE[code]?.label || code
}

// Builds the section list the same way getSections() does in the legacy scheduler:
// one row per program + year level + section letter.
export function getSections() {
  const out = []
  PROGRAMS.forEach((p) => {
    for (let yr = 1; yr <= p.years; yr++) {
      for (let i = 0; i < p.sections; i++) {
        const lbl = String.fromCharCode(65 + i)
        out.push({ prog: p.code, yr, lbl, full: `${p.code} ${yr}${lbl}` })
      }
    }
  })
  return out
}

export const YEAR_LABELS = { 1: 'First Year', 2: 'Second Year', 3: 'Third Year', 4: 'Fourth Year' }
export const SEM_LABELS = { '1st': '1st Semester', '2nd': '2nd Semester', Summer: 'Summer Class' }