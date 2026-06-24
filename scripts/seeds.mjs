// One-off seed script: pushes frontend/src/data/{programs,subjects,facultySeed}.js
// into Supabase tables (programs, subjects, faculty). Safe to rerun — uses
// upsert, so editing the JS files and rerunning this keeps the DB in sync.
//
// Usage:
//   cd frontend
//   npm install @supabase/supabase-js   (one-time, dev dependency is fine)
//   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node ../scripts/seed.mjs
//
// IMPORTANT: uses the service-role key (bypasses RLS) — never run this from
// a browser or commit the key. Run it locally or in a one-off CI step only.
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../backend/.env'), override: true })

console.log('ENV path:', path.join(__dirname, '../backend/.env'))
console.log('SUPABASE_URL:', process.env.SUPABASE_URL)
console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY)

import { createClient } from '@supabase/supabase-js'
import { PROGRAMS } from '../frontend/src/data/programs.js'
import { SUBJECTS } from '../frontend/src/data/subjects.js'
import { FACULTY_SEED } from '../frontend/src/data/facultySeed.js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars before running.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function seedPrograms() {
  const rows = PROGRAMS.map((p) => ({
    code: p.code,
    label: p.label,
    name: p.name,
    major: p.major,
    sections: p.sections,
    years: p.years,
    head_group: p.headGroup,
  }))
  const { error, count } = await supabase.from('programs').upsert(rows, { onConflict: 'code' }).select('*', { count: 'exact' })
  if (error) throw error
  console.log(`programs: upserted ${rows.length}`)
}

async function seedSubjects() {
  const rows = SUBJECTS.map((s) => ({
    id: s.id,
    code: s.code,
    title: s.title,
    program_code: s.prog,
    yr: s.yr,
    sem: s.sem,
    lec: s.lec,
    lab: s.lab,
    lec_room_type: s.lecRoomType || null,
    lab_room_type: s.labRoomType || null,
    prereq_code: s.prereq || null,
  }))
  const { error } = await supabase.from('subjects').upsert(rows, { onConflict: 'id' })
  if (error) throw error
  console.log(`subjects: upserted ${rows.length}`)
}

async function seedFaculty() {
  const rows = FACULTY_SEED.map((f) => ({
    id: f.id,
    first_name: f.fn,
    last_name: f.ln,
    email: f.email,
    program_code: f.prog,
    shared_programs: f.shared || [],
    specialization: f.spec || null,
    employment_type: f.type || null,
    max_units: f.maxUnits || 21,
    preferred_time: f.preferred || null,
  }))
  const { error } = await supabase.from('faculty').upsert(rows, { onConflict: 'id' })
  if (error) throw error
  console.log(`faculty: upserted ${rows.length}`)
}

// Room list ported from frontend/public/ccd-scheduling.html (db.rooms array).
// No standalone rooms.js exists yet — this is the one dataset still inline
// in the legacy HTML rather than a frontend/src/data/*.js file.
const ROOMS = [
  { name: 'B1-C1', type: 'Classroom', prog: '' },
  { name: 'B1-C3', type: 'Classroom', prog: '' },
  { name: 'B1-C4', type: 'Classroom', prog: '' },
  { name: 'B4-C3', type: 'Classroom', prog: '' },
  { name: 'B4-C4', type: 'Classroom', prog: '' },
  { name: 'B4-C5', type: 'Classroom', prog: '' },
  { name: 'B4-C6', type: 'Classroom', prog: '' },
  { name: 'B4-C7', type: 'Classroom', prog: '' },
  { name: 'B1-C2 – HVACRT LAB', type: 'HVAC Lab', prog: 'BTVTED-HVACRT' },
  { name: 'WELDING LABORATORY', type: 'Welding Lab', prog: 'BTVTED-HVACRT' },
  { name: 'B4-C1 – COMPUTER LAB', type: 'Computer Lab', prog: 'BTVTED-CP' },
  { name: 'B4-C2 – SPEECH LAB', type: 'Speech Lab', prog: '' },
  { name: 'SCIENCE LABORATORY', type: 'Science Lab', prog: '' },
]

async function seedRooms() {
  const rows = ROOMS.map((r) => ({
    name: r.name,
    type: r.type,
    program_code: r.prog || null,
  }))
  const { error } = await supabase.from('rooms').upsert(rows, { onConflict: 'name' })
  if (error) throw error
  console.log(`rooms: upserted ${rows.length}`)
}

async function main() {
  // Order matters: subjects.program_code and faculty.program_code are FKs
  // into programs.code, so programs must be seeded first.
  await seedPrograms()
  await seedSubjects()
  await seedFaculty()
  await seedRooms()
  console.log('Done.')
}

main().catch((err) => {
  console.error('Seed failed:', err.message || err)
  process.exit(1)
})
