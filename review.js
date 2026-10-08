const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderQuestionReview(q,objective){
 return `<div class="review-guidance"><p><strong>What to review:</strong> ${esc(q.reviewFocus||q.topic)}</p><p class="small"><strong>Knowledge objective:</strong> ${esc(objective?.text||q.learningObjectiveId)}</p>${objective?.coverageNote?`<p class="small muted"><strong>Material gap:</strong> ${esc(objective.coverageNote)}</p>`:''}</div>`;
}
