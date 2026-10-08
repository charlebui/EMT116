import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {formatOf} from '../learning.js';
import {grade,attempts,validateProgress,selectComprehensiveBatch,selectChapterBatch} from '../engine.js';
import {objectiveCoverage,renderComprehensiveCoverage,renderUntested} from '../objective-coverage.js';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const banks=read('../questions/manifest.json').map(f=>read('../questions/'+f)),all=banks.flatMap(b=>b.questions);
const blanks=all.filter(q=>q.blankMultipleChoice);
assert.equal(all.length,681);assert.equal(blanks.length,36);assert(all.every(q=>formatOf(q)==='mcq'&&q.includeInCourseExam));
for(const q of blanks){assert.equal(q.version,2);assert.equal(q.choices.length,4);assert.equal(new Set(q.choices.map(c=>c.text)).size,4);assert(q.question.includes('_____'));assert.equal(Object.keys(q.incorrectChoiceExplanations).length,3);assert.equal(grade([{id:q.id,version:2,answer:'A'}],[q]).score,100);}
assert.equal(selectComprehensiveBatch(blanks,[]).length,36);assert(selectChapterBatch(blanks,[]).every(q=>q.blankMultipleChoice));
// Keep completed written-response history, while excluding retired formats from new coverage.
const old=banks[0].archivedQuestions.find(q=>q.format==='fill_blank');
const oldRecall=banks[0].archivedQuestions.find(q=>q.format==='active_recall');
const oldItems=[{id:old.id,version:1,format:'fill_blank',answer:null,order:[],response:old.correctAnswer,revealed:false,selfRating:null},{id:oldRecall.id,version:1,format:'active_recall',answer:null,order:[],response:'remembered response',revealed:true,selfRating:'correct'}];
const history=[{id:'historical',completedAt:1,score:100,mode:'chapter',items:oldItems}];
const restored=validateProgress({schemaVersion:1,history},all);assert.equal(restored.history[0].score,100);assert.equal(restored.history[0].items[0].response,old.correctAnswer);assert.equal(attempts(restored.history,all).length,0);
assert.equal(grade(oldItems,[old,oldRecall]).score,100);
const testBank={chapter:99,title:'Test',learningObjectives:[{id:'one',text:'First objective'},{id:'two',text:'Second objective'}],questions:[{id:'a',version:2,learningObjectiveId:'one'},{id:'b',version:1,learningObjectiveId:'one'},{id:'c',version:1,learningObjectiveId:'two'}]};
const row={id:'a',version:2,answered:true,correct:false,mode:'comprehensive'};
let coverage=objectiveCoverage([testBank],[row,row])[0];assert.deepEqual(coverage.objectives.map(o=>[o.answered,o.total]),[[1,2],[0,1]]);
assert.equal(objectiveCoverage([testBank],[{...row,answered:false}])[0].answered,0);
assert.equal(objectiveCoverage([testBank],[{...row,version:1}])[0].answered,0);
assert.equal(objectiveCoverage([testBank],[{...row,mode:'chapter'}],'comprehensive')[0].answered,0);
assert.equal(objectiveCoverage([testBank],[{...row,mode:'chapter'}])[0].answered,1);
coverage=objectiveCoverage([testBank],[row,{...row,id:'b',version:1}])[0];assert.deepEqual(coverage.objectives.map(o=>[o.answered,o.total]),[[2,2],[0,1]]);
assert(renderUntested(coverage).includes('2/2'));assert(renderUntested(coverage).includes('0/1'));
assert(renderComprehensiveCoverage([testBank],[row]).includes('1/3 distinct questions answered'));
console.log('PASS: 36 multiple-choice blanks, 681 MCQ-only active questions, integration with exam selection, archived written-response history, and distinct x/x objective coverage.');
