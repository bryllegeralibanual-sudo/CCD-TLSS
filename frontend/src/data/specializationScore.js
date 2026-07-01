// Scores how well a faculty member's specialization fits a subject, replacing
// the old "does the subject code's first 2 letters appear anywhere in the
// spec string" heuristic with real keyword overlap between the spec text and
// the subject's own code prefix, program area, and title.
//
// Score bands (used consistently across Load Assignment + Auto Assign):
//   80-100  Strong match    — subject area words clearly present in spec
//   50-79   Possible match  — same program/department, partial keyword overlap
//   1-49    Weak match      — same program only, no keyword overlap
//   0       No match        — different program, or no specialization on file

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'a', 'an', 'of', 'in', 'to', 'on', 'or', 'its', 'their',
])

function words(text) {
  return (text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

// CP101 -> "cp", EC405 -> "ec", EN201 -> "en". Subject codes encode the
// department area as a 2-letter prefix; faculty specs start the same way
// (e.g. "CP Programming, Web Systems...", "EC Child Growth...").
function codeArea(code) {
  const match = /^([A-Za-z]{2})/.exec((code || '').trim())
  return match ? match[1].toLowerCase() : ''
}

export function specializationScore(faculty, subject) {
  const spec = faculty?.spec || ''
  if (!spec || !subject) return 0

  const specWords = new Set(words(spec))
  const specLower = spec.toLowerCase()
  const area = codeArea(subject.code)

  // Department-area prefix match (e.g. faculty spec starts with "CP " and
  // subject code starts with "CP") — strong structural signal.
  const areaMatch = area && specLower.startsWith(area + ' ')

  // Keyword overlap between the subject title and the faculty's spec text.
  const titleWords = words(subject.title)
  const overlap = titleWords.filter((w) => specWords.has(w))
  const overlapRatio = titleWords.length ? overlap.length / titleWords.length : 0

  if (areaMatch && overlap.length >= 2) return 95
  if (areaMatch && overlap.length === 1) return 85
  if (areaMatch) return 70
  if (overlap.length >= 2) return 60
  if (overlap.length === 1) return 45
  if (overlapRatio > 0) return 30
  return 10
}

export function matchLabel(score) {
  if (score >= 80) return { label: 'Strong match', tone: 'strong' }
  if (score >= 50) return { label: 'Possible match', tone: 'possible' }
  if (score > 0) return { label: 'Weak match', tone: 'weak' }
  return { label: 'No match on file', tone: 'none' }
}
