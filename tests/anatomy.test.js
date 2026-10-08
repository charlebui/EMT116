import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {gradeMatches,matchingCoverage,diagramMarkup} from '../anatomy.js';
const sets=JSON.parse(readFileSync(new URL('../anatomy/sets.json',import.meta.url)));
assert.equal(sets.length,13);
assert.equal(sets.reduce((n,s)=>n+s.parts.length,0),141);
for(const s of sets){
  const [iw,ih]=s.imageSize,[x,y,w,h]=s.crop;
  assert(x>=0&&y>=0&&w>0&&h>0&&x+w<=iw&&y+h<=ih);
  assert(diagramMarkup(s).includes(`viewBox="${s.crop.join(' ')}"`));
  assert(existsSync(new URL('../'+s.image.slice(2),import.meta.url)));
  assert.equal(new Set(s.parts.map(p=>p.letter)).size,s.parts.length);
  assert(s.parts.every(p=>p.name&&p.description));
  assert(gradeMatches(s).every(p=>p.status==='unanswered'));
  const answers=Object.fromEntries(s.parts.map(p=>[p.letter,p.name]));
  assert(gradeMatches(s,answers).every(p=>p.status==='correct'));
  const wrong=s.parts.find(p=>p.name!==s.parts[0].name).name;
  answers[s.parts[0].letter]=wrong;
  assert.equal(gradeMatches(s,answers).filter(p=>p.status==='incorrect').length,1);
}
for(const s of sets)for(const t of sets){
  if(s.id===t.id||s.image!==t.image)continue;
  const [x,y,w,h]=s.crop,[a,b,c,d]=t.crop;
  assert(x+w<=a||a+c<=x||y+h<=b||b+d<=y,`${s.id}/${t.id}: diagram crop regions must not overlap`);
}
// Multiple views legitimately share a term; matching must permit repeated names.
const male=sets.find(s=>s.id==='male');
assert.equal(gradeMatches(male,{D:'Prostate gland',F:'Prostate gland',G:'Urethra',H:'Urethra'}).filter(p=>p.status==='correct').length,4);
let evidence={skull:{A:false,B:true,unknown:true}};
let c=matchingCoverage(sets,evidence)[0];
assert.deepEqual(c,{id:'skull',total:10,correct:1,incorrect:1});
evidence.skull.A=true;c=matchingCoverage(sets,evidence)[0];
assert.equal(c.correct,2);assert.equal(c.incorrect,0);assert.equal(c.total,10);
console.log('PASS: 13 diagrams, 141 descriptions, matching grading, unanswered distinction, repeated terms, latest-answer progress, and worksheet assets.');
