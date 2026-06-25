import { useState } from 'react'
import { BookOpen, Camera, CheckCircle2, Clock, GraduationCap, Save, UserRound, XCircle } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { programLabel } from '../../data/programs'
import { getFacultyMaxUnits } from '../../data/validation'
import StatusBadge from '../../components/StatusBadge'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TIME_OPTIONS = Array.from({ length: ((1290 - 450) / 30) + 1 }, (_, index) => 450 + (index * 30))
const YEAR_LEVELS = [
  { value: 1, label: '1st Year' },
  { value: 2, label: '2nd Year' },
  { value: 3, label: '3rd Year' },
  { value: 4, label: '4th Year' },
]

function minutesToInput(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

function inputToMinutes(value) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function timeLabel(minutes) {
  const hour24 = Math.floor(minutes / 60)
  const minute = minutes % 60
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour = hour24 % 12 || 12
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`
}

function preferredYears(faculty) {
  const years = faculty?.preferredYearLevels || faculty?.preferredYears || []
  if (Array.isArray(years)) return years.map(Number).filter(Boolean)
  if (years) return [Number(years)].filter(Boolean)
  return []
}

function initials(faculty) {
  return [faculty?.fn?.[0], faculty?.ln?.[0]].filter(Boolean).join('').toUpperCase()
}

function LoadBar({ used, max }) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0
  const over = used > max
  const warn = pct >= 80 && !over
  const color = over ? '#DC2626' : warn ? '#D97706' : MID_GREEN
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(3,56,38,0.5)' }}>Teaching load this term</span>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{used} / {max} units</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(3,56,38,0.08)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: `${color}0D`, border: `1px solid ${color}28`, flex: 1, minWidth: 100 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} style={{ color }} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: FOREST, lineHeight: 1, fontFamily: "'EB Garamond',Georgia,serif" }}>{value}</p>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'rgba(3,56,38,0.45)', marginTop: 2 }}>{label}</p>
      </div>
    </div>
  )
}

export default function MyLoadPage() {
  const { account, updateAccount } = useAuth()
  const { term, facultyById, subjectsById, assignmentsForFaculty, upsertFaculty, settings, setSettings } = useData()
  const fac = facultyById[account.facultyId]
  const [profileOpen, setProfileOpen] = useState(false)
  const [profile, setProfile] = useState(null)

  const semLabel = term.sem === '1st' ? '1st' : term.sem === '2nd' ? '2nd' : 'Summer'
  const mine = assignmentsForFaculty(account.facultyId).filter(a => a.ay === term.ay && subjectsById[a.subjectId]?.sem === term.sem)
  const approved = mine.filter(a => a.status === 'approved')
  const pending = mine.filter(a => a.status === 'pending')
  const rejected = mine.filter(a => a.status === 'rejected')
  const approvedUnits = approved.reduce((sum, a) => {
    const subject = subjectsById[a.subjectId]
    return sum + (subject ? subject.lec + subject.lab : 0)
  }, 0)
  const maxUnits = fac ? getFacultyMaxUnits(fac) : 18
  const unavailable = (settings.facultyUnavailable || []).filter(item => String(item.facultyId) === String(account.facultyId))

  function openProfile() {
    setProfile({
      ...fac,
      email: account.email,
      password: account.password || '',
      preferredYearLevels: preferredYears(fac),
      preferredTimeStart: fac.preferredTimeStart || 450,
      preferredTimeEnd: fac.preferredTimeEnd || 1290,
      unavailable,
    })
    setProfileOpen(true)
  }

  function updateProfile(field, value) {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  function toggleYear(year) {
    setProfile(prev => {
      const current = new Set(preferredYears(prev))
      if (current.has(year)) current.delete(year)
      else current.add(year)
      return { ...prev, preferredYearLevels: Array.from(current).sort((a, b) => a - b) }
    })
  }

  function updateUnavailable(index, patch) {
    setProfile(prev => ({ ...prev, unavailable: prev.unavailable.map((item, i) => i === index ? { ...item, ...patch } : item) }))
  }

  function addUnavailable() {
    setProfile(prev => ({ ...prev, unavailable: [...(prev.unavailable || []), { facultyId: account.facultyId, day: 'Monday', start: 450, end: 510 }] }))
  }

  function removeUnavailable(index) {
    setProfile(prev => ({ ...prev, unavailable: prev.unavailable.filter((_, i) => i !== index) }))
  }

  function handlePhoto(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateProfile('photo', reader.result)
    reader.readAsDataURL(file)
  }

  function saveProfile(e) {
    e.preventDefault()
    const savedFaculty = {
      ...fac,
      ...profile,
      email: profile.email,
      preferredYearLevels: preferredYears(profile),
      preferredTimeStart: Number(profile.preferredTimeStart || 450),
      preferredTimeEnd: Number(profile.preferredTimeEnd || 1290),
    }
    upsertFaculty(savedFaculty)
    updateAccount({ email: profile.email, password: profile.password || account.password, name: `${savedFaculty.fn} ${savedFaculty.ln}` })
    setSettings(prev => ({
      ...prev,
      facultyUnavailable: [
        ...(prev.facultyUnavailable || []).filter(item => String(item.facultyId) !== String(account.facultyId)),
        ...(profile.unavailable || []).map(item => ({ ...item, facultyId: account.facultyId })),
      ],
    }))
    setProfileOpen(false)
  }

  if (!fac) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p style={{ color: 'rgba(3,56,38,0.4)', fontSize: 13 }}>Faculty record not found.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(3,56,38,0.10)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(3,56,38,0.06)' }}>
        <div style={{ background: `linear-gradient(105deg,${FOREST} 0%,${MID_GREEN} 100%)`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1.4px)', backgroundSize: '14px 14px', opacity: 0.05, pointerEvents: 'none' }} />
          <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.15)', boxShadow: `0 0 0 2.5px ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '0.05em', overflow: 'hidden', zIndex: 1 }}>
            {fac.photo ? <img src={fac.photo} alt={`${fac.fn} ${fac.ln}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(fac)}
          </div>
          <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'EB Garamond',Georgia,serif", letterSpacing: '-0.01em' }}>{fac.fn} {fac.ln}</p>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(220,252,231,0.65)' }}>{fac.spec || 'No specialization on file'} · {fac.type}</p>
            <p style={{ margin: '5px 0 0', fontSize: 11, color: 'rgba(220,252,231,0.65)' }}>Priority: {preferredYears(fac).length ? preferredYears(fac).map(y => `${y}${['st', 'nd', 'rd'][y - 1] || 'th'} Year`).join(', ') : 'Any year'} · {timeLabel(fac.preferredTimeStart || 450)} - {timeLabel(fac.preferredTimeEnd || 1290)}</p>
          </div>
          <button type="button" onClick={openProfile} style={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: 7, padding: '8px 11px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.10)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
            <UserRound size={14} /> Edit Profile
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <LoadBar used={approvedUnits} max={maxUnits} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatPill icon={CheckCircle2} label="Approved" value={approved.length} color="#059669" />
            <StatPill icon={Clock} label="Pending review" value={pending.length} color="#D97706" />
            <StatPill icon={XCircle} label="Rejected" value={rejected.length} color="#DC2626" />
            <StatPill icon={BookOpen} label="Total subjects" value={mine.length} color={MID_GREEN} />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(3,56,38,0.10)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(3,56,38,0.06)' }}>
        <div style={{ padding: '16px 20px', borderBottom: mine.length > 0 ? '1px solid rgba(3,56,38,0.08)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(3,56,38,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={15} style={{ color: MID_GREEN }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif" }}>My Subjects This Term</p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.45)', marginTop: 1 }}>AY {term.ay} · {semLabel} Semester</p>
          </div>
        </div>

        {mine.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 20px', gap: 10 }}>
            <BookOpen size={32} style={{ color: 'rgba(3,56,38,0.2)' }} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(3,56,38,0.35)' }}>No subjects assigned to you yet this term.</p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.25)' }}>The Admin-in-Charge will assign your load and submit it for Program Head approval.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(3,56,38,0.03)', borderBottom: '1px solid rgba(3,56,38,0.08)' }}>
                  {['Subject', 'Section', 'Units', 'Status', 'Note'].map((h) => <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(3,56,38,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {mine.map((a, idx) => {
                  const subj = subjectsById[a.subjectId]
                  const units = subj ? subj.lec + subj.lab : 0
                  return (
                    <tr key={a.id} style={{ borderBottom: idx < mine.length - 1 ? '1px solid rgba(3,56,38,0.06)' : 'none', background: idx % 2 === 0 ? 'transparent' : 'rgba(3,56,38,0.015)' }}>
                      <td style={{ padding: '11px 14px' }}><span style={{ fontWeight: 700, color: FOREST }}>{subj?.code}</span><span style={{ color: 'rgba(3,56,38,0.5)', marginLeft: 6, fontSize: 12 }}>{subj?.title}</span></td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}><span style={{ fontSize: 12, fontWeight: 600, color: FOREST }}>{a.section}</span><span style={{ fontSize: 11, color: 'rgba(3,56,38,0.38)', marginLeft: 4 }}>({programLabel(subj?.prog)})</span></td>
                      <td style={{ padding: '11px 14px' }}><span style={{ fontSize: 12, fontWeight: 700, color: MID_GREEN, background: 'rgba(15,107,60,0.08)', border: '1px solid rgba(15,107,60,0.18)', borderRadius: 6, padding: '2px 8px' }}>{units} {units === 1 ? 'unit' : 'units'}</span></td>
                      <td style={{ padding: '11px 14px' }}><StatusBadge status={a.status} /></td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'rgba(3,56,38,0.4)', maxWidth: 200 }}>{a.comment || <span style={{ opacity: 0.4 }}>-</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {profileOpen && profile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.45)' }}>
          <form onSubmit={saveProfile} style={{ width: 'min(760px, 100%)', maxHeight: '92vh', overflowY: 'auto', background: '#fff', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.24)' }}>
            <div style={{ padding: '16px 20px', background: `linear-gradient(105deg,${FOREST},${MID_GREEN})`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 800, fontFamily: "'EB Garamond',Georgia,serif" }}>Faculty Profile</p>
                <p style={{ margin: '2px 0 0', color: 'rgba(220,252,231,0.72)', fontSize: 12 }}>Photo, login, load priority, and schedule availability</p>
              </div>
              <button type="button" onClick={() => setProfileOpen(false)} style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.10)', color: '#fff', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontWeight: 800 }}>Close</button>
            </div>

            <div style={{ padding: 20, display: 'grid', gap: 16 }}>
              <section style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 96, height: 96, borderRadius: 18, overflow: 'hidden', background: `linear-gradient(135deg, ${FOREST}, ${MID_GREEN})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 26, fontWeight: 900 }}>
                  {profile.photo ? <img src={profile.photo} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(profile)}
                </div>
                <div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(3,56,38,0.15)', borderRadius: 10, padding: '9px 12px', color: FOREST, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                    <Camera size={15} /> Upload picture
                    <input type="file" accept="image/*" onChange={e => handlePhoto(e.target.files?.[0])} style={{ display: 'none' }} />
                  </label>
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: 'rgba(3,56,38,0.45)', fontWeight: 600 }}>Saved locally for this demo profile.</p>
                </div>
              </section>

              <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {[
                  ['fn', 'First Name', 'text'],
                  ['ln', 'Last Name', 'text'],
                  ['email', 'Email', 'email'],
                  ['password', 'Password', 'password'],
                ].map(([field, label, type]) => (
                  <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontWeight: 900, color: 'rgba(3,56,38,0.48)', textTransform: 'uppercase' }}>
                    {label}
                    <input type={type} value={profile[field] || ''} onChange={e => updateProfile(field, e.target.value)} style={{ border: '1px solid rgba(3,56,38,0.15)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: FOREST, fontWeight: 700, textTransform: 'none' }} />
                  </label>
                ))}
              </section>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontWeight: 900, color: 'rgba(3,56,38,0.48)', textTransform: 'uppercase' }}>
                Specialization
                <input value={profile.spec || ''} onChange={e => updateProfile('spec', e.target.value)} style={{ border: '1px solid rgba(3,56,38,0.15)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: FOREST, fontWeight: 700, textTransform: 'none' }} />
              </label>

              <section>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: 'rgba(3,56,38,0.48)', textTransform: 'uppercase' }}>Year Level Priority</p>
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
                  {YEAR_LEVELS.map(year => {
                    const active = preferredYears(profile).includes(year.value)
                    return <button key={year.value} type="button" onClick={() => toggleYear(year.value)} style={{ border: `1.5px solid ${active ? MID_GREEN : 'rgba(3,56,38,0.14)'}`, background: active ? 'rgba(15,107,60,0.10)' : '#fff', color: active ? MID_GREEN : 'rgba(3,56,38,0.55)', borderRadius: 10, padding: '9px 8px', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>{year.label}</button>
                  })}
                </div>
              </section>

              <section>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: 'rgba(3,56,38,0.48)', textTransform: 'uppercase' }}>Preferred Teaching Time</p>
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <select value={minutesToInput(profile.preferredTimeStart)} onChange={e => updateProfile('preferredTimeStart', inputToMinutes(e.target.value))} style={{ border: '1px solid rgba(3,56,38,0.15)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: FOREST, fontWeight: 800 }}>
                    {TIME_OPTIONS.filter(v => v < profile.preferredTimeEnd).map(v => <option key={v} value={minutesToInput(v)}>{timeLabel(v)}</option>)}
                  </select>
                  <select value={minutesToInput(profile.preferredTimeEnd)} onChange={e => updateProfile('preferredTimeEnd', inputToMinutes(e.target.value))} style={{ border: '1px solid rgba(3,56,38,0.15)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: FOREST, fontWeight: 800 }}>
                    {TIME_OPTIONS.filter(v => v > profile.preferredTimeStart).map(v => <option key={v} value={minutesToInput(v)}>{timeLabel(v)}</option>)}
                  </select>
                </div>
              </section>

              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: 'rgba(3,56,38,0.48)', textTransform: 'uppercase' }}>Unavailable Times</p>
                  <button type="button" onClick={addUnavailable} style={{ border: '1px solid rgba(3,56,38,0.15)', background: '#fff', borderRadius: 9, padding: '7px 10px', color: FOREST, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>Add time</button>
                </div>
                <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                  {(profile.unavailable || []).map((item, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: 8 }}>
                      <select value={item.day} onChange={e => updateUnavailable(index, { day: e.target.value })} style={{ border: '1px solid rgba(3,56,38,0.15)', borderRadius: 9, padding: '8px', fontSize: 12, fontWeight: 700 }}>{DAYS.map(day => <option key={day}>{day}</option>)}</select>
                      <select value={minutesToInput(item.start)} onChange={e => updateUnavailable(index, { start: inputToMinutes(e.target.value) })} style={{ border: '1px solid rgba(3,56,38,0.15)', borderRadius: 9, padding: '8px', fontSize: 12, fontWeight: 700 }}>{TIME_OPTIONS.filter(v => v < item.end).map(v => <option key={v} value={minutesToInput(v)}>{timeLabel(v)}</option>)}</select>
                      <select value={minutesToInput(item.end)} onChange={e => updateUnavailable(index, { end: inputToMinutes(e.target.value) })} style={{ border: '1px solid rgba(3,56,38,0.15)', borderRadius: 9, padding: '8px', fontSize: 12, fontWeight: 700 }}>{TIME_OPTIONS.filter(v => v > item.start).map(v => <option key={v} value={minutesToInput(v)}>{timeLabel(v)}</option>)}</select>
                      <button type="button" onClick={() => removeUnavailable(index)} style={{ border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.06)', borderRadius: 9, padding: '8px 10px', color: '#991B1B', fontWeight: 900, cursor: 'pointer' }}>Remove</button>
                    </div>
                  ))}
                </div>
              </section>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid rgba(3,56,38,0.10)', paddingTop: 16 }}>
                <button type="button" onClick={() => setProfileOpen(false)} style={{ border: '1px solid rgba(3,56,38,0.15)', background: '#fff', borderRadius: 10, padding: '10px 14px', color: FOREST, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ border: 'none', background: `linear-gradient(105deg,${FOREST},${MID_GREEN})`, borderRadius: 10, padding: '10px 14px', color: '#fff', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Save size={15} /> Save Profile</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
