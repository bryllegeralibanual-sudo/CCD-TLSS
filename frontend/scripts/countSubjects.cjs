const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'data', 'subjects.js');
const text = fs.readFileSync(file, 'utf8');
const entries = text.match(/\{\s*id:\s*\d+[\s\S]*?\}(?=,?\s*\,|\n\s*\]|$)/g) || [];
const off = /field study|internship|practicum|supervised industrial|work-based learning/i;
let needRoom = 0;
entries.forEach(e => {
  const lec = Number((e.match(/lec:\s*(\d+)/) || [0,0])[1]);
  const lab = Number((e.match(/lab:\s*(\d+)/) || [0,0])[1]);
  const title = (e.match(/title:\s*"([^\"]*)"/) || [null, ''])[1] || '';
  if (!off.test(title) && (lec > 0 || lab > 0)) needRoom++;
});
console.log(JSON.stringify({ totalSubjects: entries.length, subjectsNeedingRooms: needRoom }, null, 2));
