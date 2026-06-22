import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

const root = path.resolve('..')
const outDir = path.resolve('backend/app/data')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const loadModule = async (relativePath) => {
  const fullPath = path.resolve(relativePath)
  const module = await import(pathToFileURL(fullPath).href)
  return module
}

const subjectsMod = await loadModule('../frontend/src/data/subjects.js')
const facultyMod = await loadModule('../frontend/src/data/facultySeed.js')
const programsMod = await loadModule('../frontend/src/data/programs.js')
const accountsMod = await loadModule('../frontend/src/auth/accounts.js')

fs.writeFileSync(path.join(outDir, 'subjects.json'), JSON.stringify(subjectsMod.SUBJECTS, null, 2))
fs.writeFileSync(path.join(outDir, 'faculty.json'), JSON.stringify(facultyMod.FACULTY_SEED, null, 2))
fs.writeFileSync(path.join(outDir, 'programs.json'), JSON.stringify(programsMod.PROGRAMS, null, 2))
fs.writeFileSync(path.join(outDir, 'accounts.json'), JSON.stringify(accountsMod.MOCK_ACCOUNTS, null, 2))
console.log('Export completed')
