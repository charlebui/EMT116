const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Correct answers never clear a question. Only an explicit learned marker does.
// A later missed or guessed attempt adds it again; markers apply to one version.
export function missedQuestionBank(pool,rows,learned=[]){
 const current=new Map(pool.map(q=>[q.id,q.version])),markers=new Map();
 for(const x of learned){const key=x.id+'@'+x.version;markers.set(key,Math.max(markers.get(key)??-Infinity,x.at));}
 const pending=new Map();
 for(const r of rows){
  if(current.get(r.id)!==r.version||r.correct&&!r.guessed)continue;
  if(r.date<=(markers.get(r.id+'@'+r.version)??-Infinity))continue;
  const entry=pending.get(r.id)||{missed:false,guessed:false};
  entry.missed||=!r.correct;entry.guessed||=!!r.guessed;pending.set(r.id,entry);
 }
 return pool.filter(q=>pending.has(q.id)).map(q=>({...q,reviewReason:pending.get(q.id)})).sort((a,b)=>a.chapter-b.chapter||a.id.localeCompare(b.id));
}
export function renderMissedBank(queue){
 return `<div class="page-head"><div><h1>Missed or guessed</h1></div><span class="pill">${queue.length} questions</span></div>${queue.length?queue.map(q=>`<details class="panel result-item"><summary><span>Chapter ${q.chapter}</span><span>${esc(q.question)}</span><span class="tag">${q.reviewReason.missed?'Missed':''}${q.reviewReason.missed&&q.reviewReason.guessed?' · ':''}${q.reviewReason.guessed?'Guessed':''}</span></summary><div class="detail"><div class="result-choices">${q.choices.map((c,n)=>`<div class="result-choice ${c.id===q.correctAnswer?'correct':''}"><strong>${'ABCD'[n]}.</strong> ${esc(c.text)}${c.id===q.correctAnswer?' · Correct':''}</div>`).join('')}</div><p><strong>Why:</strong> ${esc(q.explanation)}</p>${q.choices.filter(c=>c.id!==q.correctAnswer).map(c=>`<p class="small"><strong>${esc(c.text)}:</strong> ${esc(q.incorrectChoiceExplanations[c.id])}</p>`).join('')}<button class="btn secondary" data-learned="${esc(q.id)}">Mark learned</button></div></details>`).join(''):'<div class="panel empty">No missed or guessed questions to review.</div>'}`;
}
