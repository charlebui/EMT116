const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Count distinct answered current-version questions, never repeated attempts.
export function objectiveCoverage(banks,rows,mode=null){
 return banks.map(bank=>{
  const questions=new Map(bank.questions.map(q=>[q.id,q]));
  const answered=new Set(rows.filter(r=>r.answered&&(!mode||r.mode===mode)&&questions.get(r.id)?.version===r.version).map(r=>r.id));
  const objectives=bank.learningObjectives.map(o=>{const pool=bank.questions.filter(q=>q.learningObjectiveId===o.id);return {...o,answered:pool.filter(q=>answered.has(q.id)).length,total:pool.length};});
  return {chapter:bank.chapter,title:bank.title,total:objectives.length,objectives,answered:objectives.reduce((n,o)=>n+o.answered,0),questions:objectives.reduce((n,o)=>n+o.total,0),untested:objectives.filter(o=>o.answered===0)};
 });
}
export function renderUntested(chapter){
 return `<details class="untested-objectives"><summary><strong>Knowledge objective coverage · ${chapter.answered}/${chapter.questions} questions answered</strong>${chapter.untested.length?`<span class="coverage-unseen">${chapter.untested.length} objectives not yet tested</span>`:''}</summary><p class="small muted">Distinct questions answered / available. Repeats do not increase coverage; blanks do not count.</p><ul>${chapter.objectives.map(o=>`<li class="objective-coverage-row"><span>${esc(o.text)}</span><strong class="${o.answered===0?'coverage-zero':''}" aria-label="${o.answered} of ${o.total} questions answered">${o.answered}/${o.total}</strong></li>`).join('')}</ul></details>`;
}
export function renderComprehensiveCoverage(banks,rows){
 const chapters=objectiveCoverage(banks,rows,'comprehensive'),answered=chapters.reduce((n,c)=>n+c.answered,0),total=chapters.reduce((n,c)=>n+c.questions,0);
 return `<section class="panel comprehensive-coverage" aria-labelledby="comprehensive-coverage-title"><h2 id="comprehensive-coverage-title">Knowledge objective coverage · Mock exams</h2><p><strong>${answered}/${total} distinct questions answered</strong></p><p class="small muted">Based on completed mock exams. Each objective shows questions answered / available. Incorrect answers count; blanks do not. </p>${chapters.map(c=>`<div class="coverage-chapter"><h3>Chapter ${c.chapter} · ${esc(c.title)}</h3>${renderUntested(c)}</div>`).join('')}</section>`;
}
