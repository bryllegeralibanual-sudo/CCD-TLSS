const fs = require('fs');
const path = require('path');
// Parse subjects
const subjFile = path.join(__dirname, '..', 'src', 'data', 'subjects.js');
const subjText = fs.readFileSync(subjFile, 'utf8');
const subjects = (function parseSubjects(text) {
  // fallback parsing: find object literals and extract common fields
  const objs = text.match(/\{[\s\S]*?\}/g) || [];
  const candidates = objs.filter(e => /\bcode:\s*"/.test(e));
  return candidates.map(e => {
    const id = Number((e.match(/id:\s*(\d+)/)||[0,0])[1]);
    const code = (e.match(/code:\s*"([^\"]*)"/)||[])[1]||'';
    const title = (e.match(/title:\s*"([^\"]*)"/)||[])[1]||'';
    const prog = (e.match(/prog:\s*"([^\"]*)"/)||[])[1]||'';
    const yr = Number((e.match(/yr:\s*(\d+)/)||[0,0])[1]||0);
    const sem = (e.match(/sem:\s*"([^\"]*)"/)||[])[1]||'';
    const lec = Number((e.match(/lec:\s*(\d+)/)||[0,0])[1]||0);
    const lab = Number((e.match(/lab:\s*(\d+)/)||[0,0])[1]||0);
    const lecRoomType = (e.match(/lecRoomType:\s*"([^\"]*)"/)||[])[1]||'';
    const labRoomType = (e.match(/labRoomType:\s*"([^\"]*)"/)||[])[1]||'';
    return { id, code, title, prog, yr, sem, lec, lab, lecRoomType, labRoomType };
  });
})(subjText);

// Parse DEFAULT_ROOMS from DataContext.jsx
const dcFile = path.join(__dirname, '..', 'src', 'data', 'DataContext.jsx');
const dcText = fs.readFileSync(dcFile, 'utf8');
function parseRooms(text) {
  const key = 'export const DEFAULT_ROOMS';
  const start = text.indexOf(key);
  if (start === -1) return [];
  const openBracket = text.indexOf('[', start);
  let i = openBracket;
  let depth = 0;
  for (; i < text.length; i++) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']') { depth--; if (depth === 0) break; }
  }
  const arrText = text.substring(openBracket, i+1);
  const objs = arrText.match(/\{[\s\S]*?\}/g) || [];
  return objs.map(e => {
    const id = Number((e.match(/id:\s*(\d+)/) || [0,0])[1]);
    const name = (e.match(/name:\s*'([^']*)'|name:\s*"([^\"]*)"/)||[])[1]||((e.match(/name:\s*'([^']*)'|name:\s*"([^\"]*)"/)||[])[2]||'');
    const type = (e.match(/type:\s*'([^']*)'|type:\s*"([^\"]*)"/)||[])[1]||((e.match(/type:\s*'([^']*)'|type:\s*"([^\"]*)"/)||[])[2]||'');
    const capacity = Number((e.match(/capacity:\s*(\d+)/) || [0,0])[1] || 0);
    const prog = (e.match(/prog:\s*'([^']*)'|prog:\s*"([^\"]*)"/)||[])[1]||((e.match(/prog:\s*'([^']*)'|prog:\s*"([^\"]*)"/)||[])[2]||'');
    const status = (e.match(/status:\s*'([^']*)'|status:\s*"([^\"]*)"/)||[])[1]||((e.match(/status:\s*'([^']*)'|status:\s*"([^\"]*)"/)||[])[2]||'');
    return { id, name, type, capacity, prog, status };
  });
}
const rooms = parseRooms(dcText);

// Constants copied from SchedulerPage
const CLASS_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const OPEN = 450; // minutes
const CLOSE = 1290;
const SLOT = 30;
const OFF_CAMPUS = /(field study|internship|practicum|supervised industrial|work-based learning)/i;

function needsRoom(subject) {
  return !OFF_CAMPUS.test(`${subject.title || ''} ${subject.code || ''}`) && ((subject.lec || 0) > 0 || (subject.lab || 0) > 0);
}

function isPESubject(subject) {
  const text = `${subject.code || ''} ${subject.title || ''}`;
  return /(^|\s)(PE|P\.E\.?|PATH\s*FIT)\b/i.test(text) || /Physical Education/i.test(text);
}
function isNSTPSubject(subject) {
  return /^NSTP\b/i.test(subject.code || '') || /National Service Training Program/i.test(subject.title || '');
}
function effectiveLabRoomType(subject) {
  if (['BECED', 'BSENTREP'].includes(subject.prog)) return 'Classroom';
  if (subject.prog === 'BTVTED-CP') return subject.labRoomType || 'Computer Lab';
  if (subject.prog === 'BTVTED-HVACRT') return subject.labRoomType || 'HVAC Lab';
  return subject.labRoomType || 'Classroom';
}
function effectiveLectureRoomType(subject) {
  return subject.lecRoomType || 'Classroom';
}

function isActivityVenue(room) {
  return /gym|social hall/i.test(`${room?.name || ''} ${room?.type || ''}`);
}
function isRegularClassroom(room) {
  return room?.type === 'Classroom' || room?.type === 'Speech Lab';
}

function roomMatches(room, roomType, program, subject, allowCrossProgramFallback = false, day = null, roomUse = new Map()) {
  if (!roomType || room.status === 'Inactive') return false;
  const isGym = room.type === 'Gym' || /gym/i.test(room.name);
  if (isGym && day === 'Saturday' && !isNSTPSubject(subject)) return false;
  if (isActivityVenue(room) && !isPESubject(subject) && !(isGym && isNSTPSubject(subject) && day === 'Saturday')) return false;
  if (isPESubject(subject) && isActivityVenue(room)) return true;
  const typeOk = room.type === roomType || (roomType === 'Classroom' && isRegularClassroom(room));
  const isSharedVacantLab = ['HVAC Lab', 'Welding Lab'].includes(room.type) && ((roomUse.get(room.id) || []).length === 0);
  const ownerOk = isNSTPSubject(subject) || allowCrossProgramFallback ? true : (!room.prog || room.prog === program || isSharedVacantLab);
  return typeOk && ownerOk;
}

// meetingPatterns simplified from SchedulerPage
function meetingPatterns(hours) {
  if (hours === 1) return [ { days: ['Monday'], minutes: 60 }, { days:['Tuesday'], minutes:60 } ];
  if (hours === 2) return [ { days: ['Tuesday','Thursday'], minutes:60 }, { days:['Monday','Wednesday'], minutes:60 } ];
  if (hours === 3) return [ { days:['Monday','Wednesday','Friday'], minutes:60 }, { days:['Tuesday','Thursday'], minutes:90 } ];
  return [ { days:['Monday','Tuesday','Thursday'], minutes:Math.ceil((hours*60)/3) }, { days:['Monday','Wednesday','Friday'], minutes:Math.ceil((hours*60)/3) } ];
}

function subjectMeetingOptions(subject) {
  const options = [];
  if (subject.lec > 0) {
    const patterns = meetingPatterns(subject.lec);
    for (const p of patterns) {
      for (const day of p.days) options.push({ kind: 'Lecture', day, duration: p.minutes, roomType: effectiveLectureRoomType(subject) });
    }
  }
  if (subject.lab > 0) {
    // labs are often single block, schedule as one session per lab with duration lab*180
    const labDur = subject.lab * 180;
    options.push({ kind: 'Laboratory', day: 'Monday', duration: labDur, roomType: effectiveLabRoomType(subject) });
  }
  return options;
}

// Build tasks for sem '1st'
const tasks = subjects.filter(s => s.sem === '1st' && needsRoom(s)).map(s => ({ subject: s, meetings: subjectMeetingOptions(s) }));
// Flatten tasks into items needing placement: for simplicity treat each meeting option as a separate item
const items = [];
tasks.forEach(t => {
  t.meetings.forEach(m => items.push({ subject: t.subject, meeting: m }));
});

// Debug output
console.error('parsedSubjects=', subjects.length, 'rooms=', rooms.length, 'tasksSem1st=', tasks.length, 'items=', items.length);

// Order items by difficulty: labs and NSTP first
items.sort((a,b) => {
  const pa = (a.meeting.kind === 'Laboratory') ? 1000 : 0;
  const pb = (b.meeting.kind === 'Laboratory') ? 1000 : 0;
  const na = isNSTPSubject(a.subject) ? 900 : 0;
  const nb = isNSTPSubject(b.subject) ? 900 : 0;
  return (pb+nb) - (pa+na);
});

// Occupancy map: roomId -> day -> array of occupied [start,end)
const occupancy = new Map();
for (const r of rooms) occupancy.set(r.id, new Map());

function isFree(roomId, day, start, end) {
  const dayMap = occupancy.get(roomId) || new Map();
  const list = dayMap.get(day) || [];
  return !list.some(([s,e]) => s < end && start < e);
}
function book(roomId, day, start, end) {
  const dayMap = occupancy.get(roomId);
  if (!dayMap.has(day)) dayMap.set(day, []);
  dayMap.get(day).push([start,end]);
}
function unbook(roomId, day, start, end) {
  const dayMap = occupancy.get(roomId);
  const arr = dayMap.get(day) || [];
  const idx = arr.findIndex(([s,e]) => s===start && e===end);
  if (idx>=0) arr.splice(idx,1);
}

const scheduled = [];
let attempts = 0;
const MAX_ATTEMPTS = 200000; // safety

function findPlacementFor(itemIndex) {
  if (itemIndex >= items.length) return true;
  if (++attempts > MAX_ATTEMPTS) return false;
  const item = items[itemIndex];
  const subj = item.subject;
  const meet = item.meeting;
  // candidate rooms
  const candidates = rooms.filter(r => roomMatches(r, meet.roomType, subj.prog, subj));
  if (itemIndex === 0) {
    console.error('DEBUG first item', subj.code, 'meeting', meet, 'candidates=', candidates.map(r=>r.name));
  }
  // candidate start times
  const duration = meet.duration;
  const possibleStarts = [];
  for (let start = OPEN; start + duration <= CLOSE; start += SLOT) possibleStarts.push(start);

  for (const room of candidates) {
    for (const start of possibleStarts) {
      const end = start + duration;
      if (isFree(room.id, meet.day, start, end)) {
        // book and proceed
        book(room.id, meet.day, start, end);
        scheduled.push({ itemIndex, subject: subj.code, title: subj.title, kind: meet.kind, room: room.name, day: meet.day, start, end });
        const ok = findPlacementFor(itemIndex+1);
        if (ok) return true;
        // backtrack
        scheduled.pop();
        unbook(room.id, meet.day, start, end);
      }
    }
  }

  // no placement found for this item
  return false;
}

// Greedy scheduling: attempt to place each item in order, maximizing placements
const startTime = Date.now();
for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
  const item = items[itemIndex];
  const subj = item.subject;
  const meet = item.meeting;
  const candidates = rooms.filter(r => roomMatches(r, meet.roomType, subj.prog, subj));
  let placed = false;
  const duration = meet.duration;
  for (const room of candidates) {
    for (let start = OPEN; start + duration <= CLOSE; start += SLOT) {
      const end = start + duration;
      if (isFree(room.id, meet.day, start, end)) {
        book(room.id, meet.day, start, end);
        scheduled.push({ itemIndex, subject: subj.code, title: subj.title, kind: meet.kind, room: room.name, day: meet.day, start, end });
        placed = true;
        break;
      }
    }
    if (placed) break;
  }
  if (!placed) {
    // couldn't place this item
    // move on (counted as unscheduled)
  }
}
const elapsed = Date.now() - startTime;
const scheduledItemIndices = new Set(scheduled.map(s => s.itemIndex));
const unscheduledItems = items.map((it, idx) => ({ idx, subject: it.subject.code, kind: it.meeting.kind })).filter(it => !scheduledItemIndices.has(it.idx));
const result = {
  ok: scheduled.length === items.length,
  elapsedMs: elapsed,
  attempts,
  totalItems: items.length,
  scheduledCount: scheduled.length,
  unscheduledCount: unscheduledItems.length,
  scheduledSample: scheduled.slice(0,20),
  unscheduledSample: unscheduledItems.slice(0,20),
};
console.log(JSON.stringify(result, null, 2));
