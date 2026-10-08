const KEY='emt-anatomy-matching-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function gradeMatches(set,answers={}) {
  return set.parts.map(p=>({...p,answer:answers[p.letter]||'',status:!answers[p.letter]?'unanswered':answers[p.letter]===p.name?'correct':'incorrect'}));
}
export function matchingCoverage(sets,evidence={}) {
  return sets.map(s=>({id:s.id,total:s.parts.length,correct:s.parts.filter(p=>evidence[s.id]?.[p.letter]===true).length,incorrect:s.parts.filter(p=>evidence[s.id]?.[p.letter]===false).length}));
}
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function diagramMarkup(set){
  const [width,height]=set.imageSize;
  const [x,y,w,h]=set.crop||[0,0,width,height];
  return `<svg class="ap-cropped-diagram" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="${esc(set.title)} diagram with lettered leader lines"><title>${esc(set.title)}</title><image href="${esc(set.image)}" width="${width}" height="${height}" /></svg>`;
}
let sets=null,pending=null,selected='skull',state={drafts:{},evidence:{}},storageMessage='';
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageMessage='Matching progress could not be saved in this browser.';}}
async function load(){
  if(sets)return;
  if(!pending)pending=(async()=>{
    const response=await fetch('./anatomy/sets.json');if(!response.ok)throw Error('The anatomy diagrams could not load.');
    sets=await response.json();
    try{
      const saved=JSON.parse(localStorage.getItem(KEY)||'null');
      if(saved&&typeof saved==='object')for(const s of sets){
        const draft=saved.drafts?.[s.id],answers={};
        if(draft?.answers&&typeof draft.answers==='object')for(const p of s.parts){const a=draft.answers[p.letter];if(s.parts.some(x=>x.name===a))answers[p.letter]=a;}
        state.drafts[s.id]={answers,checked:draft?.checked===true};state.evidence[s.id]={};
        for(const p of s.parts){const v=saved.evidence?.[s.id]?.[p.letter];if(typeof v==='boolean')state.evidence[s.id][p.letter]=v;}
      }
    }catch{storageMessage='Saved matching progress could not be loaded. You can start a fresh matching round.';}
  })().catch(e=>{pending=null;throw e;});
  await pending;
}
export async function renderAnatomy(app){
  app.innerHTML='<p class="loading">Loading anatomy matching…</p>';
  try{await load();}catch(e){if(location.hash==='#anatomy')app.innerHTML=`<h1>A&amp;P matching</h1><p>${esc(e.message)} Refresh to try again.</p>`;return;}
  if(location.hash!=='#anatomy')return;
  draw(app);
}
function draw(app){
  const s=sets.find(x=>x.id===selected)||sets[0],draft=state.drafts[s.id]||(state.drafts[s.id]={answers:{},checked:false});
  const results=gradeMatches(s,draft.answers),coverage=matchingCoverage(sets,state.evidence),total=coverage.reduce((n,c)=>n+c.total,0),correct=coverage.reduce((n,c)=>n+c.correct,0),incorrect=coverage.reduce((n,c)=>n+c.incorrect,0);
  const options=shuffle([...new Set(s.parts.map(p=>p.name))]);
  const count=status=>results.filter(p=>p.status===status).length;
  app.innerHTML=`<div class="page-head"><div><h1>A&amp;P matching</h1><p>Match each diagram letter to a structure. Check your answers to learn its location or function.</p></div><span class="pill">13 DIAGRAMS · ${total} PARTS</span></div>
    ${storageMessage?`<p role="status">${esc(storageMessage)}</p>`:''}
    <section class="panel ap-controls"><label class="field">Diagram<select id="ap-set">${sets.map(x=>{const c=coverage.find(c=>c.id===x.id);return `<option value="${x.id}" ${x.id===s.id?'selected':''}>${esc(x.title)} · ${c.correct+c.incorrect}/${c.total} tested</option>`;}).join('')}</select></label><p class="small muted">Matching progress: <strong>${correct} correct · ${incorrect} incorrect · ${total-correct-incorrect} unanswered</strong>. Counts reflect the latest checked answer for each part.</p></section>
    <div class="ap-layout"><section class="panel ap-diagram"><h2>${esc(s.title)}</h2><div class="ap-diagram-frame">${diagramMarkup(s)}</div><a class="btn secondary" href="./anatomy-diagram.html?id=${s.id}" target="_blank" rel="noopener">Enlarge diagram ↗</a>${s.originalImage?`<a class="ap-original small" href="${s.originalImage}" target="_blank" rel="noopener">Compare original photo ↗</a>`:''}</section>
    <section class="panel ap-matches"><h2>${draft.checked?'Your matches':'Match the labels'}</h2><p class="small muted">Choose a name for each letter. A name can appear more than once when the diagram shows multiple views.</p>
    <form id="ap-form">${results.map(p=>`<div class="ap-row ${draft.checked?'ap-'+p.status:''}"><label class="field" for="ap-${p.letter}"><span class="ap-letter">${p.letter}</span><select id="ap-${p.letter}" data-letter="${p.letter}" ${draft.checked?'disabled':''}><option value="">Choose a structure</option>${options.map(n=>`<option value="${esc(n)}" ${p.answer===n?'selected':''}>${esc(n)}</option>`).join('')}</select></label>${draft.checked?`<div class="ap-feedback"><strong>${p.status==='correct'?'✓ Correct':p.status==='incorrect'?'× Incorrect':'— Unanswered'} · ${esc(p.name)}</strong>${p.status==='incorrect'?`<p class="small">Your answer: ${esc(p.answer)}</p>`:''}<p>${esc(p.description)}</p></div>`:''}</div>`).join('')}
    ${draft.checked?`<div class="ap-score" role="status"><strong>${count('correct')}/${s.parts.length} correct</strong> · ${count('incorrect')} incorrect · ${count('unanswered')} unanswered</div><div class="ap-actions"><button class="btn secondary" type="button" id="ap-retry" ${count('correct')===s.parts.length?'disabled':''}>Retry missed labels</button><button class="btn" type="button" id="ap-new">New round</button></div>`:'<button class="btn" type="submit">Check matches →</button>'}</form></section></div>`;
  app.querySelector('#ap-set').onchange=e=>{selected=e.target.value;draw(app);};
  app.querySelectorAll('[data-letter]').forEach(el=>el.onchange=()=>{draft.answers[el.dataset.letter]=el.value;persist();});
  app.querySelector('#ap-form').onsubmit=e=>{
    e.preventDefault();if(draft.checked)return;
    draft.checked=true;const evidence=state.evidence[s.id]||(state.evidence[s.id]={});
    for(const p of gradeMatches(s,draft.answers))if(p.status!=='unanswered')evidence[p.letter]=p.status==='correct';
    persist();draw(app);app.querySelector('.ap-score')?.scrollIntoView({block:'center',behavior:'smooth'});
  };
  if(draft.checked){
    app.querySelector('#ap-retry').onclick=()=>{for(const p of results)if(p.status!=='correct')delete draft.answers[p.letter];draft.checked=false;persist();draw(app);};
    app.querySelector('#ap-new').onclick=()=>{draft.answers={};draft.checked=false;persist();draw(app);};
  }
}
