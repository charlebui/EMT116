import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TYPE_LABELS,shuffle,grade,evidence,selectQuestions,chapterLearningPool,selectChapterBatch,comprehensiveLearningPool,selectComprehensiveBatch,reviewTargets,selectReviewQuestions,attempts,validateProgress} from '../engine.js';
import {renderQuestionReview} from '../review.js';
import {chapterResults,renderDashboard} from '../dashboard.js';
const chapters=[1,2,3,5,6,7,8,10,11,12,13,14].map(n=>JSON.parse(readFileSync(new URL('../questions/chapter'+String(n).padStart(2,'0')+'.json',import.meta.url))));
const expectedCounts={"1": 34, "2": 37, "3": 36, "5": 31, "6": 87, "7": 35, "8": 34, "10": 88, "11": 81, "12": 75, "13": 68, "14": 75};
for(const b of chapters){assert.equal(b.questions.length,expectedCounts[b.chapter]);assert.deepEqual(new Set(b.questions.map(q=>q.learningObjectiveId)),new Set(b.learningObjectives.map(lo=>lo.id)));}
const bank=chapters.flatMap(b=>b.questions);
const pool=bank.filter(q=>q.includeInCourseExam);
assert.equal(pool.length,681);assert.equal(bank.length,681);
assert.equal(new Set(bank.map(q=>q.id)).size,681);
for(const q of bank){assert(TYPE_LABELS[q.questionType],q.id);assert.equal(new Set(q.choices.map(c=>c.id)).size,4);assert(q.choices.some(c=>c.id===q.correctAnswer));assert.equal(Object.keys(q.incorrectChoiceExplanations).length,3);}
const items=pool.map(q=>({id:q.id,version:q.version,answer:q.correctAnswer,order:shuffle(q.choices.map(c=>c.id))}));
assert.equal(grade(items,bank).score,100);
items[0].answer=null;assert.equal(grade(items,bank).correct,680);
assert.equal(grade(items.slice(0,1),bank).score,0);
const now=Date.now(),day=86400000;
const a={id:'a',correct:true,date:now-10*day,objective:'one',topic:'x',type:'recall'};
let rows=[a,{...a,date:now-1,correct:false}];assert.equal(evidence(rows).distinct,1);assert.equal(evidence(rows).accuracy,0);assert.equal(evidence(rows).firstAccuracy,100);assert.equal(evidence(rows).status,'Insufficient evidence');
rows=Array.from({length:5},(_,i)=>({...a,id:String(i)}));assert.equal(evidence(rows).status,'Strong — check retention');
rows.push({...rows[0],date:now});rows.push({...rows[0],date:now+1});assert.equal(evidence(rows).delayed,1);assert.equal(evidence(rows).status,'Strong — check retention');
rows.push({...rows[1],date:now});assert.equal(evidence(rows).status,'Mastery evidence');
rows.push({...rows[1],date:now+1,correct:false});assert.equal(evidence(rows).status,'Strong — check retention');
for(const mode of ['chapter','comprehensive','weak','recall','reasoning','low']){const out=selectQuestions(pool,mode,100,[],now);assert(out.length<=100);assert.equal(new Set(out.map(q=>q.id)).size,out.length);if(mode==='recall')assert(out.every(q=>q.questionType==='recall'));if(mode==='reasoning')assert(out.every(q=>['best_answer','multi_step'].includes(q.questionType)));}
assert.equal(selectQuestions(pool,'missed',25,[],now).length,0);
const q=pool[0];const wrong=q.choices.find(c=>c.id!==q.correctAnswer).id;
const history=[{id:'e1',completedAt:now-8*day,score:0,items:[{id:q.id,version:q.version,answer:wrong,order:['A','B','C','D']}]}];
const freshMiss=selectQuestions(pool,'missed',25,attempts(history,bank),now)[0];if(pool.some(x=>x.id!==q.id&&x.learningObjectiveId===q.learningObjectiveId))assert.notEqual(freshMiss.id,q.id);else assert.equal(freshMiss.id,q.id);assert.equal(freshMiss.learningObjectiveId,q.learningObjectiveId);assert.deepEqual(freshMiss.retestFor,{id:q.id,version:q.version});
assert.equal(selectQuestions(pool,'retention',25,attempts(history,bank),now)[0].id,q.id);
const before=JSON.stringify(history);const backup=validateProgress(JSON.parse(JSON.stringify({schemaVersion:1,history})),bank);assert.equal(JSON.stringify(history),before);assert.deepEqual(backup.history[0].items[0].order,['A','B','C','D']);assert.equal(backup.history[0].score,0);
assert.throws(()=>validateProgress({schemaVersion:9,history:[]},bank));assert.throws(()=>validateProgress({schemaVersion:1,history:[{...history[0],items:[{...history[0].items[0],answer:'Z'}]}]},bank));
assert.equal(attempts([{...history[0],items:[{...history[0].items[0],version:99}]}],bank).length,0);
const first=selectQuestions(pool,'chapter',25,[]);assert.equal(first.length,25);
for(let i=0;i<20;i++){const choiceOrder=shuffle(q.choices.map(c=>c.id));assert.equal(q.choices.find(c=>c.id===choiceOrder.find(id=>id===q.correctAnswer)).text,q.choices.find(c=>c.id===q.correctAnswer).text);}
console.log('PASS: bank validation, grading, unanswered items, selection, missed/retention filters, distinct evidence, delayed evidence, imports, version exclusion, and answer randomization.');

const archived=chapters[0].archivedQuestions;assert(archived.length>=100);const old=archived.find(x=>x.id===q.id);assert(old.version!==q.version);assert.equal(attempts([{...history[0],items:[{...history[0].items[0],version:old.version}]}],bank).length,0);const retained=validateProgress({schemaVersion:1,history:[{...history[0],score:77,items:[{...history[0].items[0],version:old.version}]}]},bank);assert.equal(retained.history[0].score,77);assert.equal(selectQuestions(chapters[2].questions,'chapter',100,[]).length,36);

for(let i=0;i<20;i++){const mixed=selectQuestions(pool,'comprehensive',25,[]);const chapterCounts=[1,2,3,5,6,7,8,10,11,12,13,14].map(ch=>mixed.filter(q=>q.chapter===ch).length);assert.deepEqual(chapterCounts.slice().sort((a,b)=>a-b),[2,2,2,2,2,2,2,2,2,2,2,3]);}

const full=selectQuestions(pool,'comprehensive',50,[]);assert.equal(full.length,50);assert.deepEqual([1,2,3,5,6,7,8,10,11,12,13,14].map(ch=>full.filter(q=>q.chapter===ch).length).sort((a,b)=>a-b),[4,4,4,4,4,4,4,4,4,4,5,5]);

assert.equal(selectQuestions(chapters[4].questions,'chapter',1000,[]).length,chapters[4].questions.length);
for(const b of chapters)for(const q of b.questions){assert(q.sourceReferences.every(r=>b.sources.some(s=>s.id===r.sourceId)));assert(!/outline|transcript|slides|course material/i.test(q.question));assert.equal(q.contentBasis,'Uploaded course materials only');if(q.questionType==='best_answer'){for(const key of ['secondMostPlausibleAnswer','whyTempting','whyNotBest','keyDistinction'])assert(q[key]);}}

assert.equal(selectQuestions(chapters[7].questions,'chapter',1000,[]).length,chapters[7].questions.length);

assert.equal(selectQuestions(chapters[8].questions,'chapter',1000,[]).length,chapters[8].questions.length);

// Chapter bars and objective lists must track current misses, not accumulated attempts.
const airway=chapters[8],aq=airway.questions[0],aq2=airway.questions[1];
const makeRow=(q,correct,date)=>({id:q.id,version:q.version,objective:q.learningObjectiveId,correct,date});
let chart=chapterResults([airway],[])[0];
assert.deepEqual([chart.correct,chart.incorrect,chart.attempted,chart.reviews.length],[0,0,0,0]);
const chartRows=[makeRow(aq,false,1),makeRow(aq2,false,2),makeRow(aq,true,3)];
chart=chapterResults([airway],chartRows)[0];
assert.deepEqual([chart.correct,chart.incorrect,chart.attempted],[1,1,2]);
assert.equal(chart.reviews.length,1);assert.equal(chart.reviews[0].id,aq.learningObjectiveId);assert.equal(chart.reviews[0].incorrect,1);
chartRows.push(makeRow(aq2,true,4));assert.equal(chapterResults([airway],chartRows)[0].reviews.length,0);
const stale=makeRow(aq,false,5);stale.version=0;
assert.equal(chapterResults([airway],[stale])[0].attempted,0);
const minimalDashboard=renderDashboard([airway],[makeRow(aq,false,1)]);
assert(minimalDashboard.includes(aq.learningObjectiveId)===false);
assert(minimalDashboard.includes(airway.learningObjectives[0].text));
assert(!/Your next step|Build confidence|Recent practice|Course bank explored|Textbook|pages not provided/.test(minimalDashboard));
assert(minimalDashboard.includes('0 correct'));assert(minimalDashboard.includes('1 incorrect'));

assert.equal(selectQuestions(chapters[9].questions,'chapter',1000,[]).length,chapters[9].questions.length);

assert.equal(selectQuestions(chapters[10].questions,'chapter',1000,[]).length,chapters[10].questions.length);

assert.equal(selectQuestions(chapters[11].questions,'chapter',1000,[]).length,chapters[11].questions.length);

// Learning batches exhaust every answered question before repeating.
for(const chapter of [chapters[0],chapters[11]]){
 const learning=chapter.questions.filter(q=>q.includeInCourseExam),log=[],seen=new Set();let date=1;
 while(seen.size<learning.length){
  const batch=selectChapterBatch(learning,log);
  assert.equal(batch.length,Math.min(10,learning.length-seen.size));
  assert.equal(new Set(batch.map(q=>q.id)).size,batch.length);
  for(const q of batch){assert(!seen.has(q.id));seen.add(q.id);log.push({id:q.id,version:q.version,date,answered:true,correct:false});}
  date++;
 }
 assert.equal(chapterLearningPool(learning,log).length,learning.length);
 const repeat=selectChapterBatch(learning,log);assert.equal(repeat.length,10);
 log.push(...repeat.map(q=>({id:q.id,version:q.version,date,answered:true,correct:true})));
 const second=selectChapterBatch(learning,log);assert(second.every(q=>!repeat.some(r=>r.id===q.id)));
}
const learn=chapters[0].questions,firstBatch=selectChapterBatch(learn,[]);
const partial=firstBatch.map((q,i)=>({id:q.id,version:q.version,date:1,answered:i!==0,correct:false}));
assert.equal(chapterLearningPool(learn,partial).length,learn.length-9);
assert(chapterLearningPool(learn,partial).some(q=>q.id===firstBatch[0].id));
assert(!chapterLearningPool(learn,partial).some(q=>q.id===firstBatch[1].id));
assert.equal(chapterLearningPool(learn,[{id:learn[0].id,version:0,date:1,answered:true}]).length,learn.length);
assert.equal(chapterLearningPool(learn,[{id:chapters[1].questions[0].id,version:1,date:1,answered:true}]).length,learn.length);
const submitted={schemaVersion:1,history:[{id:'learning',mode:'comprehensive',completedAt:1,score:0,secondsPerQuestion:90,items:firstBatch.map(q=>({id:q.id,version:q.version,answer:q.choices.find(c=>c.id!==q.correctAnswer).id,order:['A','B','C','D']}))}]};
const restored=validateProgress(JSON.parse(JSON.stringify(submitted)),bank);
assert.equal(restored.history[0].secondsPerQuestion,90);
assert.equal(chapterLearningPool(learn,attempts(restored.history,bank)).length,learn.length-10);
// Existing comprehensive and missed selection remain independent of the learning queue.
assert.equal(selectQuestions(pool,'comprehensive',50,attempts(restored.history,bank)).length,50);
assert.equal(selectQuestions(pool,'missed',1000,attempts(restored.history,bank)).length,10);
console.log('PASS: fixed learning batches, exhaustion, cycle restart, unanswered eligibility, version isolation, saved-history restoration, and unchanged comprehensive/missed selection.');

// Three chart segments account for the entire active chapter bank.
let coverage=chapterResults([airway],[])[0];
assert.equal(coverage.unanswered,airway.questions.length);assert.equal(coverage.total,airway.questions.length);
coverage=chapterResults([airway],[makeRow(aq,false,1),makeRow(aq2,true,2)])[0];
assert.equal(coverage.unanswered,airway.questions.length-2);
assert.equal(coverage.correct+coverage.incorrect+coverage.unanswered,coverage.total);
assert(renderDashboard([airway],[]).includes(`${airway.questions.length} unanswered`));
assert(renderDashboard([airway],[]).includes('unanswered-segment" style="width:100%"'));
const completeChart=chapterResults([airway],airway.questions.map(q=>makeRow(q,true,1)))[0];
assert.equal(completeChart.unanswered,0);assert.equal(completeChart.correct,airway.questions.length);
assert.equal(chapterResults([airway],[stale])[0].unanswered,airway.questions.length);
console.log('PASS: full-bank chart proportions, unanswered counts, complete coverage, and retired-version exclusion.');

// Hidden provenance stays mapped; learner review excludes source-file directions.
const audit=JSON.parse(readFileSync(new URL('../question-bank-audit.json',import.meta.url)));
assert.equal(audit.totalQuestions,681);assert.equal(audit.addedQuestions,148);assert.equal(audit.objectives.length,193);
assert.equal(audit.objectives.filter(o=>o.status==='partial_material').length,18);
for(const b of chapters){
 assert(b.sources.every(s=>!s.url));
 const versions=new Set();
 for(const q of [...b.questions,...(b.archivedQuestions||[])]){const k=q.id+'@'+q.version;assert(!versions.has(k),k);versions.add(k);}
 for(const q of b.questions){
  assert.equal(new Set(q.choices.map(c=>c.text)).size,4,q.id);
  assert(q.reviewFocus);assert(q.reviewReferences.length,q.id);
  for(const r of q.reviewReferences){assert.equal(r.filename,b.sources.find(s=>s.id===r.sourceId)?.filename);assert(r.section);assert(!/\bpages?\b|\bslides?\s*\d/i.test(r.section),q.id);}
  const objective=audit.objectives.find(o=>o.objectiveId===q.learningObjectiveId);
  assert(objective.questionIds.includes(q.id));
 }
 for(const lo of b.learningObjectives){assert(!/\(pp?\s*\d/i.test(lo.text));assert(lo.reviewReferences.length);if(lo.coverageStatus==='partial_material')assert(lo.coverageNote);}
}
const guided=chapterResults([airway],[makeRow(aq,false,1)])[0].reviews[0];
assert.equal(guided.incorrect,1);
const guidedHTML=renderDashboard([airway],[makeRow(aq,false,1)]);
assert(guidedHTML.includes(guided.text));assert(guidedHTML.includes('1 incorrect'));
assert(!guidedHTML.includes(aq.reviewReferences[0].filename));assert(!guidedHTML.includes('Review:</strong>'));assert(!guidedHTML.includes('review-files'));assert(!guidedHTML.includes(guided.coverageNote||'Material gap:'));
assert.equal(chapterResults([airway],[makeRow(aq,false,1),makeRow(aq,true,2)])[0].reviews.length,0);
console.log('PASS: audited objective coverage, material gaps, named source directions, question versions, and targeted review clearing.');

// Comprehensive exams can reuse prior questions, without duplicates within an exam.
const allSeen=pool.map(q=>({id:q.id,version:q.version,date:1,mode:'comprehensive',answered:true,correct:true}));
assert.equal(comprehensiveLearningPool(pool,allSeen).length,pool.length);
assert.equal(comprehensiveLearningPool(pool,allSeen.slice(0,-1)).length,pool.length);
assert.equal(selectComprehensiveBatch(pool,allSeen.slice(0,-1)).length,50);
for(let n=0;n<20;n++){
 const batch=selectComprehensiveBatch(pool,allSeen);
 assert.equal(batch.length,50);assert.equal(new Set(batch.map(q=>q.id)).size,50);
}
const smallPool=pool.slice(0,50);
const prior=smallPool.map(q=>({id:q.id,version:q.version,date:1,mode:'comprehensive',answered:true}));
assert.equal(selectComprehensiveBatch(smallPool,prior).length,50);
assert.equal(selectComprehensiveBatch(pool.slice(0,12),prior).length,12);
for(const chapter of chapters)assert(chapter.questions.filter(q=>q.definitionQuestion).length>=2);
console.log('PASS: comprehensive repeat eligibility, 50-question size, within-exam uniqueness, and limited-pool handling.');

// Fresh retests target missed/guessed items without rewriting the original score.
const rq=(id,objective='LO')=>({id,version:1,learningObjectiveId:objective,includeInCourseExam:true});
const rp=[rq('original'),rq('fresh'),rq('seen'),rq('other','OTHER')];
const wrongRow={id:'original',version:1,objective:'LO',date:1,correct:false,answered:true,guessed:false};
const seenRow={id:'seen',version:1,objective:'LO',date:2,correct:true,answered:true};
let retest=selectReviewQuestions(rp,10,[wrongRow,seenRow]);
assert.equal(retest.length,1);assert.equal(retest[0].id,'fresh');assert.equal(retest[0].retestFor.id,'original');
const pass={id:'fresh',version:1,objective:'LO',date:3,correct:true,answered:true,guessed:false,retestFor:{id:'original',version:1}};
assert.equal(reviewTargets(rp,[wrongRow,seenRow,pass]).length,0);
assert.equal(wrongRow.correct,false);
assert(reviewTargets(rp,[wrongRow,{...pass,guessed:true}]).some(q=>q.id==='original'));
assert(reviewTargets(rp,[wrongRow,{...pass,correct:false}]).some(q=>q.id==='original'));
assert(reviewTargets(rp,[wrongRow,{...pass,retestFor:{id:'original',version:0}}]).some(q=>q.id==='original'));
assert(reviewTargets(rp,[wrongRow,{...pass,objective:'OTHER'}]).some(q=>q.id==='original'));
assert(reviewTargets(rp,[wrongRow,pass,{...wrongRow,date:4}]).some(q=>q.id==='original'));
assert.equal(reviewTargets(rp,[{...wrongRow,correct:true,guessed:true}]).length,1);
assert.equal(reviewTargets(rp,[{...wrongRow,correct:true,guessed:false}]).length,0);
assert.equal(selectReviewQuestions([rp[0]],10,[wrongRow])[0].id,'original');
assert.equal(reviewTargets(rp,[{...wrongRow,version:0}]).length,0);
const actualRetest=selectReviewQuestions(pool,1,attempts(history,bank))[0];
const reviewHistory={schemaVersion:1,history:[...history,{id:'fresh-check',mode:'missed',completedAt:now,score:100,items:[{id:actualRetest.id,version:actualRetest.version,answer:actualRetest.correctAnswer,order:['A','B','C','D'],guessed:false,retestFor:actualRetest.retestFor}]}]};
const reloaded=validateProgress(JSON.parse(JSON.stringify(reviewHistory)),bank);
assert.deepEqual(reloaded.history[1].items[0].retestFor,actualRetest.retestFor);
assert.equal(selectReviewQuestions(pool,100,attempts(reloaded.history,bank)).length,0);
reloaded.history[1].items[0].guessed=true;
const guessedReload=validateProgress(JSON.parse(JSON.stringify(reloaded)),bank);
assert.equal(guessedReload.history[1].items[0].guessed,true);
assert(reviewTargets(pool,attempts(guessedReload.history,bank)).some(t=>t.id===q.id));
assert.equal(grade(guessedReload.history[1].items,bank).score,100);
assert.equal(validateProgress({schemaVersion:1,history},bank).history[0].items[0].guessed,false);
assert.throws(()=>validateProgress({...reviewHistory,history:[{...reviewHistory.history[1],items:[{...reviewHistory.history[1].items[0],guessed:'yes'}]}]},bank));
console.log('PASS: fresh objective retests, unseen preference, target resolution, guessed-correct review, failed retests, fallback, version isolation, reopened targets, saved markers, and unchanged scores.');

for (const b of chapters) for (const q of b.questions) {
 const html=renderQuestionReview(q,b.learningObjectives.find(o=>o.id===q.learningObjectiveId));
 assert(html.includes('Knowledge objective:'));assert(!html.includes('Where to review:'));
 for (const ref of q.reviewReferences) assert(!html.includes(ref.filename),q.id);
}
console.log('PASS: learner answer reviews retain objectives and omit source filenames.');

const randomFullPool=bank.filter(q=>q.includeInCourseExam||q.includeInLearning);
const randomTen=selectQuestions(randomFullPool,'random',10,[]);
assert.equal(randomTen.length,10);assert.equal(new Set(randomTen.map(q=>q.id)).size,10);
const randomSmall=selectQuestions(randomFullPool.slice(0,3),'random',10,[]);assert.equal(randomSmall.length,3);
const cyclePool=randomFullPool.slice(0,12);
const answeredRows=cyclePool.slice(0,10).map(q=>({id:q.id,version:q.version,answered:true,date:1,mode:'comprehensive'}));
const finalBatch=selectQuestions(cyclePool,'random',10,answeredRows);
assert.deepEqual(new Set(finalBatch.map(q=>q.id)),new Set(cyclePool.slice(10).map(q=>q.id)));
const completeRows=[...answeredRows,...cyclePool.slice(10).map(q=>({id:q.id,version:q.version,answered:true,date:2,mode:'random'}))];
assert.equal(selectQuestions(cyclePool,'random',10,completeRows).length,10);
const nextRows=[...completeRows,{id:cyclePool[0].id,version:cyclePool[0].version,answered:true,date:3,mode:'chapter'}];
assert(!selectQuestions(cyclePool,'random',12,nextRows).some(q=>q.id===cyclePool[0].id));
assert.equal(selectQuestions(cyclePool,'random',12,[{id:cyclePool[0].id,version:cyclePool[0].version,answered:false,date:1}]).length,12);
assert.equal(selectQuestions(cyclePool,'random',12,[{id:cyclePool[0].id,version:cyclePool[0].version-1,answered:true,date:1}]).length,12);
console.log('PASS: Random 10 excludes answered questions across all modes until full-bank exhaustion, preserves short final batches, resets cycles, and ignores blanks and retired versions.');
