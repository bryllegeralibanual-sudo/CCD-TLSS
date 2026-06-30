// specCategories.js
// Defines the mapping between subject code prefixes and specialization category
// keys, and maps those keys to the specialization strings used in facultySeed.
//
// WHY THIS EXISTS:
// The old system matched the first 2 letters of a subject code ("CP") against
// the free-text spec string. That caused false positives: a faculty member
// specialising in "CP Networking" would match "CP 101 Computer Programming 1"
// and also "CP 312 Information Assurance Security" equally, even though those
// are very different domains.
//
// HOW IT WORKS:
// 1. Every subject gets a `specKey` — a short domain tag (e.g. "cp-prog",
//    "cp-network", "ge", "pe"). This is derived from its code prefix via
//    SUBJECT_CODE_TO_SPEC_KEY below.
// 2. Every faculty specialisation string starts with a tag prefix that maps to
//    one or more specKeys via SPEC_STRING_TO_KEYS below.
// 3. canTeachSubjectBySpec(fac, subject) returns true when there is overlap
//    between the faculty's specKeys and the subject's specKey.
// 4. specMatchLabel(fac, subject) returns a human-readable match description
//    for display in the load-assignment UI.

// ─── 1. Subject code prefix → specKey ────────────────────────────────────────
// Covers every prefix found in subjects.js. Shared subjects (GE, PE, NSTP,
// TE, TV, BT) are accessible to faculty from any program that teaches them.

export const SUBJECT_CODE_TO_SPEC_KEY = {
  // BTVTED-CP major subjects
  'CP':        'cp-prog',      // all CP### codes: programming, HCI, networking, security, DBs

  // BTVTED-HVACRT major subjects
  'HVACR':     'hv',           // HVACR###: refrigeration, electrical, welding, technical drawing

  // BECED major subjects (EC prefix used in this codebase)
  'EC':        'ec',           // all EC### codes: early childhood education

  // BSENTREP major subjects
  'EN':        'en',           // all EN### codes: entrepreneurship, business, finance

  // Shared professional education subjects (appear in both BTVTED programs)
  'TEFC':      'te',           // Foundation of Ed, Child & Adolescent Learners
  'TEPC':      'te',           // Assessment, Technology for Teaching
  'TEELC':     'te',           // Field Study 1 & 2
  'TVFC':      'tv',           // Teacher and Community, School Culture
  'TVPC':      'tv',           // Facilitating Learning, Andragogy, Curriculum Dev
  'TVAC':      'tv',           // Technology Research / Thesis
  'TVSIT':     'bt-field',     // Supervised Industrial Training
  'TVELC':     'bt-field',     // Teaching Internship

  // BTVTEd common courses (Industrial Arts, AFA, HE, ICT teaching)
  'BTVTEd':    'bt',           // BTVTEd 201–310: Industrial Arts, AFA, HE, ICT teaching
  'CCDBTVTEd': 'bt-field',     // CCDBTVTEd 401–402: Teaching Competency Appraisal (off-campus)

  // General Education subjects (shared across all programs)
  'GECC':      'ge',
  'GEEC':      'ge',
  'GEIC':      'ge',
  'GEMC':      'ge',

  // PE / NSTP (cross-program, handled by dedicated PE/NSTP staff)
  'PE':        'pe-nstp',
  'NSTP':      'pe-nstp',
}

// ─── 2. Faculty specialisation string prefix → specKey(s) ────────────────────
// Each spec string in facultySeed.js starts with a 2–3 letter tag.
// We map those tags to one or more specKeys so a single faculty can be
// a match for related (but not all) subjects.

export const SPEC_TAG_TO_KEYS = {
  // BTVTED-CP specialisations
  'CP Programming':  ['cp-prog'],          // "CP Programming, Web Systems & Application Development"
  'CP Database':     ['cp-prog'],          // "CP Database, Information Management & Data Structures"
  'CP Networking':   ['cp-prog'],          // "CP Networking, Cybersecurity & Computer Lab Systems"

  // BTVTED-HVACRT specialisations
  'HV HVACR':        ['hv'],
  'HV Domestic':     ['hv'],
  'HV Installation': ['hv'],

  // BECED specialisations
  'EC Child':        ['ec'],
  'EC Foundations':  ['ec'],
  'EC Language':     ['ec'],
  'EC Mathematics':  ['ec'],
  'EC Creative':     ['ec'],
  'EC Inclusive':    ['ec'],
  'EC Assessment':   ['ec'],
  'EC Family':       ['ec'],
  'EC Pedagogy':     ['ec'],
  'EC Practicum':    ['ec', 'bt-field'],

  // BSENTREP specialisations
  'EN Entrepreneurship': ['en'],
  'EN Accounting':       ['en'],
  'EN Marketing':        ['en'],
  'EN Operations':       ['en'],
  'EN Economics':        ['en'],
  'EN Business Law':     ['en'],
  'EN E-Commerce':       ['en'],
  'EN Strategy':         ['en'],
  'EN Human Resource':   ['en'],
  'EN Agribusiness':     ['en'],

  // Shared professional education (TE, TV, BT)
  'GE General':      ['ge'],
  'GE Mathematics':  ['ge'],
  'TE Professional': ['te'],
  'TV Pedagogy':     ['tv', 'bt'],
  'BT Industrial':   ['bt', 'hv'],        // Industrial Arts covers both CP and HVACRT BTVTEd
  'BT Field':        ['bt-field', 'bt'],

  // PE / NSTP
  'PE/NSTP':         ['pe-nstp'],
}

// ─── 3. Helper: resolve a faculty's spec string → Set of specKeys ─────────────

export function getFacultySpecKeys(fac) {
  if (!fac?.spec) return new Set()
  const spec = fac.spec
  const keys = new Set()
  for (const [tag, tagKeys] of Object.entries(SPEC_TAG_TO_KEYS)) {
    if (spec.startsWith(tag)) {
      tagKeys.forEach(k => keys.add(k))
    }
  }
  return keys
}

// ─── 4. Helper: resolve a subject's code → specKey ───────────────────────────

export function getSubjectSpecKey(subject) {
  if (!subject?.code) return null
  const code = subject.code.trim()
  // Try progressively shorter prefixes so "BTVTEd" matches before "BT"
  for (const prefix of Object.keys(SUBJECT_CODE_TO_SPEC_KEY).sort((a, b) => b.length - a.length)) {
    if (code.startsWith(prefix)) return SUBJECT_CODE_TO_SPEC_KEY[prefix]
  }
  return null
}

// ─── 5. Main check: can this faculty teach this subject by specialisation? ────
// Returns one of: 'strong' | 'acceptable' | 'mismatch'
//   strong     – faculty's specKeys directly include the subject's specKey
//   acceptable – faculty is in the right program but specKey doesn't match
//                (e.g. a GE teacher assigned to a PE subject — allowed but flagged)
//   mismatch   – no match at all

export function specMatchLevel(fac, subject) {
  const subjectKey = getSubjectSpecKey(subject)
  if (!subjectKey) return 'acceptable'   // unknown code prefix — don't block

  const facKeys = getFacultySpecKeys(fac)
  if (facKeys.size === 0) return 'acceptable' // no spec on record — don't block

  if (facKeys.has(subjectKey)) return 'strong'

  // GE, TE, TV, BT faculty can teach across programs — these are general enough
  // that a mismatch is acceptable rather than wrong
  const generalKeys = new Set(['ge', 'te', 'tv', 'bt', 'pe-nstp'])
  if ([...facKeys].some(k => generalKeys.has(k))) return 'acceptable'
  if (generalKeys.has(subjectKey)) return 'acceptable'

  return 'mismatch'
}

// ─── 6. Human-readable label for the UI ──────────────────────────────────────

export function specMatchLabel(fac, subject) {
  const level = specMatchLevel(fac, subject)
  const subjectKey = getSubjectSpecKey(subject)
  const facKeys = getFacultySpecKeys(fac)

  switch (level) {
    case 'strong':
      return {
        level,
        message: `Specialisation match: ${fac.spec} covers ${subject.code}.`,
      }
    case 'acceptable':
      return {
        level,
        message: fac.spec
          ? `Partial match: ${fac.spec} — qualified by program but not a direct specialisation for ${subject.code}. Allowed, but flagged for the Program Head.`
          : `No specialisation on record for ${fac.ln}. Allowed, but flagged for the Program Head.`,
      }
    case 'mismatch':
      return {
        level,
        message: `Specialisation mismatch: ${fac.spec} does not cover ${subject.code} (expected: ${subjectKey}). Assigning this requires Program Head justification.`,
      }
    default:
      return { level: 'acceptable', message: '' }
  }
}

// ─── 7. Scoring helper for getFacultyRecommendations in DataContext ───────────
// Returns 0–100. Used to rank candidates in the smart-suggest dropdown.

export function specMatchScore(fac, subject) {
  switch (specMatchLevel(fac, subject)) {
    case 'strong':     return 100
    case 'acceptable': return 45
    case 'mismatch':   return 5
    default:           return 45
  }
}
