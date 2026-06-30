const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'data', 'DataContext.jsx');
const text = fs.readFileSync(file, 'utf8');
const match = text.match(/export const DEFAULT_ROOMS = \[([\s\S]*?)\];/);
const roomsText = match ? match[1] : '';
const entries = roomsText.split(/\n\s*\{/).filter(Boolean).map((s,i)=> (i===0?'{'+s:'{'+s));
const rooms = entries.map(e=>{
  const id = Number((e.match(/id:\s*(\d+)/)||[0,0])[1]);
  const name = (e.match(/name:\s*'([^']*)'|name:\s*"([^\"]*)"/)||[])[1]||((e.match(/name:\s*'([^']*)'|name:\s*"([^\"]*)"/)||[])[2]||'');
  const type = (e.match(/type:\s*'([^']*)'|type:\s*"([^\"]*)"/)||[])[1]||((e.match(/type:\s*'([^']*)'|type:\s*"([^\"]*)"/)||[])[2]||'');
  const capacity = Number((e.match(/capacity:\s*(\d+)/)||[0,0])[1]||0);
  const prog = (e.match(/prog:\s*'([^']*)'|prog:\s*"([^\"]*)"/)||[])[1]||((e.match(/prog:\s*'([^']*)'|prog:\s*"([^\"]*)"/)||[])[2]||'');
  const status = (e.match(/status:\s*'([^']*)'|status:\s*"([^\"]*)"/)||[])[1]||((e.match(/status:\s*'([^']*)'|status:\s*"([^\"]*)"/)||[])[2]||'');
  return { id, name, type, capacity, prog, status };
});
const totals = { total: rooms.length };
rooms.forEach(r=>{
  totals[r.type] = (totals[r.type]||0)+1;
  if (r.type === 'Classroom' || r.type === 'Speech Lab') totals.regularClassrooms = (totals.regularClassrooms||0)+1;
  if (r.type.endsWith('Lab')) totals.labs = (totals.labs||0)+1;
});
console.log(JSON.stringify({ rooms, totals }, null, 2));
