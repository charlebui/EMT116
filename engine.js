import {formatOf,isAnswered,isCorrect} from './learning.js';
export const TYPES=['recall','low_yield','conceptual','best_answer','multi_step'];
export const TYPE_LABELS={recall:'Recall',low_yield:'Low-yield details',conceptual:'Conceptual',best_answer:'Best answer',multi_step:'Multi-step',active_recall:'Active recall · self-assessed',fill_blank:'Fill in the blank'};
export const KEY='emt-exam-lab.v1';
export function shuffle(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function attempts(history,bank){const map=new Map(bank.map(q=>[q.id,q]));const rows=[];for(const exam of history){for(const item of exam.items){const q=map.get(item.id);if(!q||q.version!==item.version)continue;rows.push({id:q.id,version:q.version,objective:q.learningObjectiveId,topic:q.conceptId,type:q.questionType,date:exam.completedAt,correct:isCorrect(item,q),answered:isAnswered(item,q),mode:exam.mode,guessed:!!item.guessed,retestFor:item.retestFor||null});}}return rows.sort((a,b)=>a.date-b.date);}
export function evidence(rows,now=Date.now()){
 const first=new Map(),latest=new Map(),delayedLatest=new Map();
 for(const a of rows){if(!first.has(a.id))first.set(a.id,a);else if(a.date-first.get(a.id).date>=7*86400000){delayedLatest.set(a.id,a);}latest.set(a.id,a);}
 const delayed=delayedLatest.size,delayedCorrect=[...delayedLatest.values()].filter(a=>a.correct).length;
 const n=latest.size,accuracy=n?100*[...latest.values()].filter(x=>x.correct).length/n:null;
 const firstAccuracy=n?100*[...first.values()].filter(x=>x.correct).length/n:null;
 const status=n===0?'Untested':n<5?'Insufficient evidence':accuracy>=80&&delayed>=2&&delayedCorrect/delayed>=.8?'Mastery evidence':accuracy>=80?'Strong — check retention':'Needs review';
 return {distinct:n,accuracy,firstAccuracy,status,delayed,delayedCorrect,latest,first};
}
export function selectQuestions(pool,mode,count,rows,now=Date.now()){
 const ev=evidence(rows,now), latest=ev.latest;let eligible=mode==='random'?chapterLearningPool(pool,rows):pool;
 if(mode==='recall')eligible=pool.filter(q=>q.questionType==='recall');
 if(mode==='reasoning')eligible=pool.filter(q=>['best_answer','multi_step'].includes(q.questionType));
 if(mode==='low')eligible=pool.filter(q=>q.questionType==='low_yield');
 if(mode==='missed')return selectReviewQuestions(pool,count,rows);
 if(mode==='retention')eligible=pool.filter(q=>latest.has(q.id)&&now-latest.get(q.id).date>=7*86400000);
 let a=shuffle(eligible);count=Math.min(count,a.length);
 if(mode==='comprehensive'){
  const groups=shuffle([...new Set(a.map(q=>q.chapter))]).map(chapter=>({pool:a.filter(q=>q.chapter===chapter),count:0}));
  for(let n=0;n<count;){for(const group of groups){if(n>=count)break;if(group.count<group.pool.length){group.count++;n++;}}}
  return shuffle(groups.flatMap(group=>selectQuestions(group.pool,'chapter',group.count,rows,now)));
 }
 if(mode==='weak'){
  const groups={};for(const r of rows)(groups[r.objective]??=[]).push(r);
  const stats=Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,evidence(v)]));
  const rank=q=>{const st=stats[q.learningObjectiveId];if(!st)return 2;const last=latest.get(q.id);return (st.accuracy<80?0:3)+(last?0.6:0);};
  return a.sort((x,y)=>rank(x)-rank(y)).slice(0,count);
 }
 if(['chapter','comprehensive'].includes(mode)){
  const weights=[.25,.2,.2,.25,.1],chosen=[];
  TYPES.forEach((t,i)=>chosen.push(...a.filter(q=>q.questionType===t).slice(0,Math.floor(count*weights[i]))));
  const used=new Set(chosen.map(q=>q.id));chosen.push(...a.filter(q=>!used.has(q.id)).slice(0,count-chosen.length));return shuffle(chosen);
 }
 return a.slice(0,count);
}
// A fresh, confidently correct retest resolves one recorded review target.
// Actual scores and dashboard answers are never rewritten by a retest.
export function reviewTargets(pool,rows){
 const current=new Map(pool.map(q=>[q.id,q]));
 const valid=rows.filter(r=>current.get(r.id)?.version===r.version);
 const latest=new Map();for(const row of [...valid].sort((a,b)=>a.date-b.date))latest.set(row.id,row);
 return pool.filter(q=>{
  const last=latest.get(q.id);
  if(!last||(last.correct&&!last.guessed))return false;
  return !valid.some(r=>r.correct&&!r.guessed&&r.answered&&r.date>last.date&&r.objective===q.learningObjectiveId&&r.retestFor?.id===q.id&&r.retestFor.version===q.version);
 });
}
export function selectReviewQuestions(pool,count,rows){
 const targets=shuffle(reviewTargets(pool,rows)),problemIds=new Set(targets.map(q=>q.id)),used=new Set(),out=[];
 const versions=new Map(pool.map(q=>[q.id,q.version])),latest=new Map();for(const r of [...rows].sort((a,b)=>a.date-b.date))if(versions.get(r.id)===r.version)latest.set(r.id,r);
 for(const target of targets){
  if(out.length>=count)break;
  const alternatives=shuffle(pool.filter(q=>q.learningObjectiveId===target.learningObjectiveId&&formatOf(q)===formatOf(target)&&q.id!==target.id&&!used.has(q.id)));
  // Prefer an unseen question, then the least recently attempted alternative.
  alternatives.sort((a,b)=>Number(problemIds.has(a.id))-Number(problemIds.has(b.id))||(latest.get(a.id)?.date??-Infinity)-(latest.get(b.id)?.date??-Infinity));
  const selected=alternatives[0]||(!used.has(target.id)?target:null);
  if(!selected)continue;
  used.add(selected.id);out.push({...selected,retestFor:{id:target.id,version:target.version}});
 }
 return shuffle(out);
}
// Submitted answers from any mode advance each chapter's learning cycle.
// Unanswered submissions and retired question versions remain eligible.
export function chapterLearningPool(pool,rows){
 const current=new Map(pool.map(q=>[q.id,q.version])),seen=new Set();let previousDate;
 for(const row of [...rows].sort((a,b)=>a.date-b.date)){
  if(!row.answered||current.get(row.id)!==row.version)continue;
  // Complete an exam atomically: its remaining answers do not begin a new cycle.
  if(previousDate!==row.date&&seen.size===current.size)seen.clear();
  seen.add(row.id);previousDate=row.date;
 }
 return seen.size===current.size?[...pool]:pool.filter(q=>!seen.has(q.id));
}
// Comprehensive exams sample the full MCQ pool each time; repeats across exams are allowed.
export function comprehensiveLearningPool(pool,rows){
 return pool.filter(q=>formatOf(q)==='mcq'&&q.includeInCourseExam!==false);
}
export function selectComprehensiveBatch(pool,rows){
 return selectQuestions(comprehensiveLearningPool(pool,rows),'comprehensive',50,rows);
}
export function selectChapterBatch(pool,rows){
 return selectQuestions(chapterLearningPool(pool,rows),'chapter',10,rows);
}
export function grade(items,bank){const map=new Map(bank.map(q=>[q.id,q]));let correct=0;const breakdown={objective:{},topic:{},type:{},chapter:{}};
 for(const item of items){const q=map.get(item.id);if(!q||item.version!==q.version)throw new Error('Question version unavailable.');const ok=isCorrect(item,q);if(ok)correct++;
 for(const [group,key] of [['objective',q.learningObjectiveId],['topic',q.topic],['type',q.questionType],['chapter',String(q.chapter)]]){const x=breakdown[group][key]??={correct:0,total:0};x.total++;x.correct+=Number(ok);}}
 return {correct,total:items.length,score:items.length?Math.round(100*correct/items.length):0,breakdown};
}
export function validateProgress(p,bank){
 const map=new Map(bank.map(q=>[q.id,q]));
 if(!p||p.schemaVersion!==1||!Array.isArray(p.history)||p.history.length>500)throw new Error('This is not a supported progress backup.');
 const ids=new Set();for(const e of p.history){if(typeof e.id!=='string'||ids.has(e.id)||!Number.isFinite(e.completedAt)||!Array.isArray(e.items)||!e.items.length||e.items.length>1000)throw new Error('Invalid exam history.');ids.add(e.id);
 const seen=new Set();for(const i of e.items){if(typeof i.id!=='string'||seen.has(i.id)||!Number.isInteger(i.version)||!validAttempt(i,map.get(i.id)?.version===i.version?map.get(i.id):undefined))throw new Error('Invalid question attempt.');if(i.guessed!=null&&typeof i.guessed!=='boolean')throw new Error('Invalid guess marker.');if(i.retestFor!=null&&(typeof i.retestFor!=='object'||typeof i.retestFor.id!=='string'||!Number.isInteger(i.retestFor.version)))throw new Error('Invalid review target.');seen.add(i.id);}
 if(!Number.isFinite(e.score)||e.score<0||e.score>100)throw new Error('Invalid score.');}
 return {schemaVersion:1,history:p.history.map(e=>({id:e.id,completedAt:e.completedAt,mode:typeof e.mode==='string'?e.mode:'Imported',secondsPerQuestion:[0,90,120].includes(e.secondsPerQuestion)?e.secondsPerQuestion:0,score:e.items.every(i=>map.get(i.id)?.version===i.version)?grade(e.items,bank).score:e.score,items:e.items.map(i=>({id:i.id,version:i.version,answer:i.answer,order:i.order,flagged:!!i.flagged,guessed:!!i.guessed,retestFor:i.retestFor?{id:i.retestFor.id,version:i.retestFor.version}:null,format:i.format||formatOf(map.get(i.id)),response:typeof i.response==='string'?i.response:'',revealed:!!i.revealed,selfRating:i.selfRating||null}))})),active:null};
}

export function validAttempt(item,q){
 const format=item.format||formatOf(q);
 if(q&&format!==formatOf(q))return false;
 if(format==='mcq')return [null,'A','B','C','D'].includes(item.answer)&&Array.isArray(item.order)&&item.order.length===4&&new Set(item.order).size===4&&item.order.every(x=>['A','B','C','D'].includes(x));
 if(!['active_recall','fill_blank'].includes(format)||typeof item.response!=='string'||item.response.length>2000||!Array.isArray(item.order)||item.order.length)return false;
 if(q&&format!==formatOf(q))return false;
 return [undefined,null,'correct','incorrect'].includes(item.selfRating)&&[undefined,false,true].includes(item.revealed)&&!(item.selfRating&&!item.revealed);
}
