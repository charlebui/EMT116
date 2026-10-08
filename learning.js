export const formatOf=q=>q?.format||'mcq';
export const FORMAT_LABELS={mcq:'Multiple choice',active_recall:'Active recall',fill_blank:'Fill in the blank'};
export function normalizeAnswer(value){return String(value??'').normalize('NFKC').toLowerCase().replace(/[‐‑‒–—-]/g,' ').replace(/[^\p{L}\p{N}\s]/gu,'').replace(/\s+/g,' ').trim();}
export function isAnswered(item,q){
 if(formatOf(q)==='active_recall')return item.revealed===true&&['correct','incorrect'].includes(item.selfRating);
 if(formatOf(q)==='fill_blank')return Boolean(String(item.response??'').trim());
 return Boolean(item.answer);
}
export function isCorrect(item,q){
 if(formatOf(q)==='active_recall')return isAnswered(item,q)&&item.selfRating==='correct'&&Boolean(String(item.response??'').trim());
 if(formatOf(q)==='fill_blank'){const value=normalizeAnswer(item.response);return Boolean(value)&&q.acceptedAnswers.some(a=>normalizeAnswer(a)===value);}
 return item.answer===q.correctAnswer;
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderLearningReview(q,item){
 return `<p><strong>Your response:</strong> ${esc(item.response?.trim()||'No written response')}</p>${formatOf(q)==='active_recall'?`<p class="small muted">${item.selfRating==='correct'?'Self-assessed as recalled':item.selfRating==='incorrect'?'Self-assessed as needing review':'Not self-assessed'}</p><h3>Key points</h3><ul>${q.checkpoints.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:`<p><strong>Answer:</strong> ${esc(q.correctAnswer)}</p><p><strong>Why:</strong> ${esc(q.explanation)}</p>`}`;
}
