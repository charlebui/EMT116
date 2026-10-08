import {objectiveCoverage,renderUntested} from './objective-coverage.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function chapterResults(banks,rows){
 const latest=new Map();
 for(const row of [...rows].sort((a,b)=>a.date-b.date))latest.set(row.id,row);
 return banks.map(bank=>{
  const pool=bank.questions.filter(q=>q.includeInCourseExam||q.includeInLearning);
  const answered=pool.filter(q=>latest.has(q.id)&&latest.get(q.id).version===q.version);
  const missed=answered.filter(q=>!latest.get(q.id).correct);
  const reviews=bank.learningObjectives.map(lo=>({...lo,incorrect:missed.filter(q=>q.learningObjectiveId===lo.id).length})).filter(lo=>lo.incorrect);
  return {chapter:bank.chapter,title:bank.title,correct:answered.length-missed.length,incorrect:missed.length,attempted:answered.length,unanswered:pool.length-answered.length,total:pool.length,reviews};
 });
}

export function renderDashboard(banks,rows){
 const chapters=chapterResults(banks,rows),coverage=objectiveCoverage(banks,rows);
 return `<section class="panel chapter-results" aria-labelledby="chapter-results-title"><div class="section-head"><h1 id="chapter-results-title">Chapter results</h1><span class="small muted">Latest answer per question · Untested objectives shown below each chapter</span></div><div class="chart-legend"><span><i class="legend-dot correct-dot"></i>Correct</span><span><i class="legend-dot incorrect-dot"></i>Incorrect</span><span><i class="legend-dot unanswered-dot"></i>Unanswered</span></div>${chapters.map(ch=>{
  const correctWidth=ch.total?100*ch.correct/ch.total:0;
  const incorrectWidth=ch.total?100*ch.incorrect/ch.total:0;
  const unansweredWidth=ch.total?100*ch.unanswered/ch.total:0;
  return `<article class="chapter-result"><div class="chapter-result-head"><h2>Chapter ${ch.chapter} · ${esc(ch.title)}</h2><div class="chapter-counts"><span class="correct-count">${ch.correct} correct</span><span class="incorrect-count">${ch.incorrect} incorrect</span><span class="unanswered-count">${ch.unanswered} unanswered</span></div></div><div class="answer-bar" role="img" aria-label="Chapter ${ch.chapter}: ${ch.correct} correct, ${ch.incorrect} incorrect, ${ch.unanswered} unanswered out of ${ch.total}"><span class="correct-segment" style="width:${correctWidth}%"></span><span class="incorrect-segment" style="width:${incorrectWidth}%"></span><span class="unanswered-segment" style="width:${unansweredWidth}%"></span></div>${ch.reviews.length?`<div class="objective-review"><h3>Brush up on</h3><ul>${ch.reviews.map(lo=>`<li><div>${esc(lo.text)}</div><div class="objective-reference"><span>${lo.incorrect} incorrect</span></div></li>`).join('')}</ul></div>`:''}${renderUntested(coverage.find(c=>c.chapter===ch.chapter))}</article>`;
 }).join('')}</section>`;
}
