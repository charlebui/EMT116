const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let dataPromise,chapter=1,query='';
const renderSections=sections=>sections.map(s=>`<section>${s.heading?`<h3>${esc(s.heading)}</h3>`:''}${s.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}${s.bullets.length?`<ul>${s.bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}</section>`).join('');
export function renderOutside(supplement){
 if(!supplement)return '';
 return `<aside class="study-outside"><h3>Outside sources · Added detail</h3>${renderSections(supplement.sections)}${supplement.note?`<p class="small">${esc(supplement.note)}</p>`:''}<h4>Sources</h4><ul class="study-source-links">${supplement.sources.map(s=>/^https:\/\//.test(s.url)?`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a></li>`:`<li>${esc(s.title)}</li>`).join('')}</ul></aside>`;
}
export function studyMatches(objective,term){
 const text=[objective.objective,objective.summary,...[...objective.sections,...(objective.outside?.sections||[])].flatMap(s=>[s.heading,...s.paragraphs,...s.bullets])].join(' ').toLowerCase();
 return term.trim().toLowerCase().split(/\s+/).every(word=>text.includes(word));
}
export function renderStudyAnswers(chapterData,term=''){
 const objectives=chapterData.objectives.filter(o=>studyMatches(o,term));
 return `<div class="section-head"><h2>Chapter ${chapterData.chapter} · ${esc(chapterData.title)}</h2><span class="small muted">${objectives.length} objectives</span></div>${objectives.length?objectives.map(o=>`<details class="panel study-objective"><summary>${esc(o.objective)}</summary><div class="study-answer"><p class="study-summary">${esc(o.summary)}</p>${renderSections(o.sections)}${o.coverage==='partial'?`<p class="study-gap"><strong>Class material gap:</strong> ${esc(o.gap)}</p>${renderOutside(o.outside)}`:''}</div></details>`).join(''):'<div class="panel empty">No matching objectives.</div>'}`;
}
export async function renderStudy(app){
 app.innerHTML='<h1>Study</h1><p role="status">Loading…</p>';
 let data;
 try{data=await (dataPromise??=fetch('./study/chapters.json').then(r=>{if(!r.ok)throw new Error('Study material unavailable.');return r.json();}).catch(e=>{dataPromise=null;throw e;}));}
 catch(e){if(location.hash==='#study')app.innerHTML=`<h1>Study</h1><p role="status">${esc(e.message)}</p>`;return;}
 if(location.hash!=='#study')return;
 if(!data.some(c=>c.chapter===chapter))chapter=data[0].chapter;
 app.innerHTML=`<div class="page-head"><h1>Study</h1></div><section class="panel study-controls"><label class="field">Chapter<select id="study-chapter">${data.map(c=>`<option value="${c.chapter}" ${c.chapter===chapter?'selected':''}>Chapter ${c.chapter} · ${esc(c.title)}</option>`).join('')}</select></label><label class="field">Search<input id="study-search" type="search" value="${esc(query)}" placeholder="Search this chapter"></label></section><div id="study-answers"></div>`;
 const update=()=>{app.querySelector('#study-answers').innerHTML=renderStudyAnswers(data.find(c=>c.chapter===chapter),query);};
 app.querySelector('#study-chapter').onchange=e=>{chapter=Number(e.target.value);query='';app.querySelector('#study-search').value='';update();};
 app.querySelector('#study-search').oninput=e=>{query=e.target.value;update();};update();
}
