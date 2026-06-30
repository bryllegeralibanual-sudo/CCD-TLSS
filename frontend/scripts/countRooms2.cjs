const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'data', 'DataContext.jsx');
const text = fs.readFileSync(file, 'utf8');
const key = 'export const DEFAULT_ROOMS';
const start = text.indexOf(key);
if (start === -1) { console.error('DEFAULT_ROOMS not found'); process.exit(1); }
const openBracket = text.indexOf('[', start);
let i = openBracket;
let depth = 0;
for (; i < text.length; i++) {
  if (text[i] === '[') depth++;
  else if (text[i] === ']') { depth--; if (depth === 0) break; }
}
const arrText = text.substring(openBracket, i+1);
const objs = arrText.match(/\{[\s\S]*?\}/g) || [];
const rooms = objs.map(e => {
  const id = Number((e.match(/id:\s*(\d+)/) || [0,0])[1]);
  const name = (e.match(/name:\s*'([^']*)'|name:\s*"([^\"]*)"/) || [])[1] || (e.match(/name:\s*'([^']*)'|name:\s*"([^\"]*)"/) || [])[2] || '';
  const type = (e.match(/type:\s*'([^']*)'|type:\s*"([^\"]*)"/) || [])[1] || (e.match(/type:\s*'([^']*)'|type:\s*"([^\"]*)"/) || [])[2] || '';
  const capacity = Number((e.match(/capacity:\s*(\d+)/) || [0,0])[1] || 0);
  const prog = (e.match(/prog:\s*'([^']*)'|prog:\s*"([^\"]*)"/) || [])[1] || (e.match(/prog:\s*'([^']*)'|prog:\s*"([^\"]*)"/) || [])[2] || '';
  const status = (e.match(/status:\s*'([^']*)'|status:\s*"([^\"]*)"/) || [])[1] || (e.match(/status:\s*'([^']*)'|status:\s*"([^\"]*)"/) || [])[2] || '';
  return { id, name, type, capacity, prog, status };
});
const totals = { total: rooms.length };
rooms.forEach(r => {
  totals[r.type] = (totals[r.type]||0)+1;
  if (r.type === 'Classroom' || r.type === 'Speech Lab') totals.regularClassrooms = (totals.regularClassrooms||0)+1;
  if (/(Lab|lab)$/.test(r.type)) totals.labs = (totals.labs||0)+1;
});
console.log(JSON.stringify({ rooms, totals }, null, 2));
