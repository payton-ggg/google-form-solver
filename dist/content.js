(function(){async function e(e){let t=e.src||e.getAttribute(`data-src`)||``;if(!t||t.startsWith(`chrome-extension://`))return null;if(t.startsWith(`data:image/`)){let n=t.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);if(n)return{src:t,alt:e.alt||``,mimeType:n[1],base64:n[2]}}try{let n=await(await fetch(t)).blob();return new Promise(r=>{let i=new FileReader;i.onloadend=()=>{let a=i.result.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);r(a?{src:t,alt:e.alt||``,mimeType:a[1]||n.type||`image/jpeg`,base64:a[2]}:null)},i.onerror=()=>r(null),i.readAsDataURL(n)})}catch{try{let n=document.createElement(`canvas`);n.width=e.naturalWidth||e.width||300,n.height=e.naturalHeight||e.height||200;let r=n.getContext(`2d`);if(r){r.drawImage(e,0,0);let i=n.toDataURL(`image/jpeg`,.85).match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);if(i)return{src:t,alt:e.alt||``,mimeType:i[1],base64:i[2]}}}catch{console.warn(`Could not extract image data:`,t)}return null}}async function t(t,n){if(!t)return null;let r=t.getAttribute(`data-item-id`)||`question-${n}-${Date.now()}`,i=t.querySelector(`.M7eMe`)||t.querySelector(`[role="heading"]`)||t.querySelector(`.HoLwm`)||t.querySelector(`.ahS2le`),a=i?(i.textContent||``).trim():``,o=t.querySelector(`.g6ldxf`)||t.querySelector(`.e4eG1b`);o&&o.textContent&&(a+=`\n(Description: ${o.textContent.trim()})`);let s=Array.from(t.querySelectorAll(`img`)).filter(e=>!(e.width>0&&e.width<32&&e.height>0&&e.height<32||e.classList.contains(`ai-solver-icon`))),c=[];for(let t of s){let n=await e(t);n&&c.push(n)}let l=`unknown`,u=[],d,f=t.querySelector(`[role="radiogroup"]`)||t.querySelector(`.appsMaterialWizToggleRadiogroupEl`),p=t.querySelectorAll(`[role="radio"]`),m=t.querySelectorAll(`[role="checkbox"]`),h=t.querySelector(`input.whsOnd`)||t.querySelector(`input[type="text"]`),g=t.querySelector(`textarea.KHxj8b`)||t.querySelector(`textarea`),_=t.querySelector(`[role="listbox"]`);if(m.length>0){l=`checkbox`;let e=t.querySelectorAll(`.docssharedWizToggleLabeledContainer, .Y6Holder, [role="checkbox"]`),n=new Set,r=0;e.forEach(e=>{let t=e.getAttribute(`role`)===`checkbox`?e:e.querySelector(`[role="checkbox"]`)||e;if(n.has(t))return;n.add(t);let i=t.getAttribute(`data-value`)||``;i||=((e.querySelector(`.aDTYNe, .ulDsOb, .bzfPab`)||e).textContent||``).trim(),u.push({index:r++,text:i||`Option ${r}`,element:t,inputElement:t})})}else if(f||p.length>0){l=`radio`;let e=t.querySelectorAll(`.docssharedWizToggleLabeledContainer, .nWQGrd, [role="radio"]`),n=new Set,r=0;e.forEach(e=>{let t=e.getAttribute(`role`)===`radio`?e:e.querySelector(`[role="radio"]`)||e;if(n.has(t))return;n.add(t);let i=t.getAttribute(`data-value`)||``;i||=((e.querySelector(`.aDTYNe, .ulDsOb, .bzfPab`)||e).textContent||``).trim(),u.push({index:r++,text:i||`Option ${r}`,element:t,inputElement:t})})}else g?(l=`paragraph`,d=g):h?(l=`text`,d=h):_&&(l=`dropdown`,_.querySelectorAll(`[role="option"]`).forEach((e,t)=>{u.push({index:t,text:(e.textContent||e.getAttribute(`data-value`)||`Option ${t+1}`).trim(),element:e})}));return a||=`Question #${n+1}`,{id:r,container:t,title:a,type:l,required:!!t.querySelector(`[aria-label*="обязательный"], [aria-label*="required"], .v3duvd`),options:u,textInput:d,images:c}}function n(e){if(!e||!e.container)return!1;let t=e.container;if(t.querySelector(`[role="radio"][aria-checked="true"]`)||t.querySelector(`[role="checkbox"][aria-checked="true"]`))return!0;let n=e.textInput||t.querySelector(`input.whsOnd, input[type="text"], textarea.KHxj8b, textarea`);if(n&&n.value&&n.value.trim().length>0||t.querySelector(`[role="option"][aria-selected="true"]`))return!0;let r=t.querySelector(`[role="listbox"]`);if(r){let e=(r.textContent||``).trim();if(e&&!e.includes(`Выбрать`)&&!e.includes(`Choose`)&&!e.includes(`Select`))return!0}return!1}function r(){return Array.from(document.querySelectorAll(`.Qr7Oae`))}function i(e){e.scrollIntoView({behavior:`smooth`,block:`nearest`}),[`mouseover`,`mousedown`,`mouseup`,`click`].forEach(t=>{let n=new MouseEvent(t,{view:window,bubbles:!0,cancelable:!0,buttons:1});e.dispatchEvent(n)})}function a(e,t){e.focus();let n=e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,r=Object.getOwnPropertyDescriptor(n,`value`)?.set;r?r.call(e,t):e.value=t,e.dispatchEvent(new Event(`input`,{bubbles:!0})),e.dispatchEvent(new Event(`change`,{bubbles:!0})),e.dispatchEvent(new FocusEvent(`blur`,{bubbles:!0}))}async function o(e,t){try{if(e.type===`radio`){let n=null;if(t.selectedIndices&&t.selectedIndices.length>0){let r=t.selectedIndices[0];r>=0&&r<e.options.length&&(n=e.options[r])}if(!n&&t.selectedTexts&&t.selectedTexts.length>0){let r=t.selectedTexts[0].toLowerCase().trim();n=e.options.find(e=>e.text.toLowerCase().trim()===r)||null}if(n)return i(n.inputElement||n.element),!0}else if(e.type===`checkbox`){let n=new Set;if(Array.isArray(t.selectedIndices)&&t.selectedIndices.length>0)for(let r of t.selectedIndices)r>=0&&r<e.options.length&&n.add(r);if(n.size===0&&Array.isArray(t.selectedTexts)&&t.selectedTexts.length>0)for(let r of t.selectedTexts){let t=r.toLowerCase().trim(),i=e.options.findIndex(e=>e.text.toLowerCase().trim()===t);i!==-1&&n.add(i)}let r=0;for(let t=0;t<e.options.length;t++){let a=e.options[t],o=a.inputElement||a.element,s=o.getAttribute(`aria-checked`)===`true`,c=n.has(t);c&&!s?(i(o),await new Promise(e=>setTimeout(e,80)),r++):!c&&s?(i(o),await new Promise(e=>setTimeout(e,80))):c&&s&&r++}return r>0}else if(e.type===`text`||e.type===`paragraph`){let n=e.textInput||e.container.querySelector(`input, textarea`);if(n&&t.textAnswer)return a(n,t.textAnswer),!0}else if(e.type===`dropdown`&&t.selectedIndices&&t.selectedIndices.length>0){let n=t.selectedIndices[0];if(n>=0&&n<e.options.length){let t=e.options[n];return i(t.element),!0}}return!1}catch(e){return console.error(`Failed to apply solution to DOM:`,e),!1}}var s={apiKey:``,model:`gemini-3.8-flash`,autoScroll:!0,language:`auto`,fontFamily:`outfit`,skipAnswered:!0};async function c(){return new Promise(e=>{if(typeof chrome<`u`&&chrome.storage?.sync)chrome.storage.sync.get(s,t=>{let n={...s,...t};!n.apiKey&&s.apiKey&&(n.apiKey=s.apiKey),e(n)});else if(typeof chrome<`u`&&chrome.storage?.local)chrome.storage.local.get(s,t=>{e({...s,...t})});else try{let t=localStorage.getItem(`gemini_solver_settings`),n=t?JSON.parse(t):{};e({...s,...n})}catch{e(s)}})}async function l(e){return new Promise(t=>{if(typeof chrome<`u`&&chrome.storage?.sync)chrome.storage.sync.set(e,()=>{t()});else if(typeof chrome<`u`&&chrome.storage?.local)chrome.storage.local.set(e,()=>{t()});else{try{let t=localStorage.getItem(`gemini_solver_settings`),n=t?JSON.parse(t):s;localStorage.setItem(`gemini_solver_settings`,JSON.stringify({...n,...e}))}catch(e){console.error(`Failed to save to localStorage:`,e)}t()}})}function u(){try{if(typeof chrome<`u`&&chrome.runtime?.getURL)return chrome.runtime.getURL(`icons/icon48.png`)}catch{}return``}function d(e,t){if(e.querySelector(`.ai-solver-btn-wrapper`))return e.querySelector(`.ai-solver-solve-btn`);let n=document.createElement(`div`);n.className=`ai-solver-btn-wrapper`;let r=u();r&&`${r}`;let i=document.createElement(`button`);return i.type=`button`,i.className=`ai-solver-solve-btn`,i.title=`Solve question and show explanation`,i.innerHTML=`
    <span>Solve</span>
  `,i.addEventListener(`click`,async e=>{e.preventDefault(),e.stopPropagation(),await t(i)}),n.appendChild(i),e.firstChild?e.insertBefore(n,e.firstChild):e.appendChild(n),i}function f(e,t,n=`Solving...`){if(t)e.classList.add(`loading`),e.disabled=!0,e.innerHTML=`
      <span class="ai-solver-spinner"></span>
      <span>${n}</span>
    `;else{let t=u();t&&`${t}`,e.classList.remove(`loading`),e.disabled=!1,e.innerHTML=`
      <span>Solve</span>
    `}}function p(e,t,n){let r=e.querySelector(`.ai-solver-card, .ai-solver-error-card`);r&&r.remove();let i=document.createElement(`div`);i.className=`ai-solver-card`;let a=``;a=n.type===`radio`||n.type===`checkbox`||n.type===`dropdown`?t.selectedTexts&&t.selectedTexts.length>0?t.selectedTexts.join(`; `):t.selectedIndices&&t.selectedIndices.length>0?t.selectedIndices.map(e=>n.options[e]?.text||`Option ${e+1}`).join(`; `):`Answer selected`:t.textAnswer||`Answer entered`;let o=Math.round(t.confidence||95),s=u();i.innerHTML=`
    <div class="ai-solver-card-header">
      <div class="ai-solver-card-title">
        ${s?`<img src="${s}" class="ai-solver-card-logo" alt="FormIQ" width="16" height="16">`:`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
      </svg>`}
        <span>Answer Explanation</span>
        <span class="ai-solver-confidence-badge">${o}% confidence</span>
      </div>
      <button type="button" class="ai-solver-card-close" title="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="ai-solver-selected-answer">
      <div class="ai-solver-selected-answer-label">Selected Answer</div>
      <div class="ai-solver-selected-answer-value">${v(a)}</div>
    </div>

    <div class="ai-solver-explanation-body">
      ${v(t.explanation)}
    </div>

    <div class="ai-solver-card-actions">
      <button type="button" class="ai-solver-action-btn copy-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
        <span>Copy Explanation</span>
      </button>
    </div>
  `,i.querySelector(`.ai-solver-card-close`)?.addEventListener(`click`,()=>{i.remove()});let c=i.querySelector(`.copy-btn`);c?.addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(t.explanation);let e=c.querySelector(`span`);e&&(e.textContent=`✓ Copied!`,setTimeout(()=>{e.textContent=`Copy Explanation`},2e3))}catch{}}),e.appendChild(i)}function m(e,t){let n=e.querySelector(`.ai-solver-card, .ai-solver-error-card`);n&&n.remove();let r=document.createElement(`div`);r.className=`ai-solver-error-card`,r.innerHTML=`
    <div style="display:flex; justify-content:space-between; align-items:center; font-weight:600;">
      <span style="display:flex; align-items:center; gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Notice
      </span>
      <button type="button" class="ai-solver-card-close" style="color:#e53e3e;" title="Close">✕</button>
    </div>
    <div>${v(t)}</div>
  `,r.querySelector(`.ai-solver-card-close`)?.addEventListener(`click`,()=>{r.remove()}),e.appendChild(r)}var h=[{id:`gemini-3.8-flash`,label:`Gemini 3.8 Flash (Recommended • 5 RPM)`},{id:`gemini-3.6-flash`,label:`Gemini 3.6 Flash (Fast & Accurate • 5 RPM)`},{id:`gemini-3.5-flash-lite`,label:`Gemini 3.5 Flash-Lite (High Quota: 15 RPM / 500 RPD)`},{id:`gemini-3-flash`,label:`Gemini 3 Flash (5 RPM / 20 RPD)`},{id:`gemini-3.1-flash-lite`,label:`Gemini 3.1 Flash-Lite (High Quota: 15 RPM / 500 RPD)`},{id:`gemini-2.5-flash`,label:`Gemini 2.5 Flash (5 RPM / 20 RPD)`},{id:`gemini-2.5-flash-lite`,label:`Gemini 2.5 Flash-Lite (Fast • 10 RPM / 20 RPD)`},{id:`gemma-4-26b`,label:`Gemma 4 26B (High Speed • 30 RPM)`},{id:`gemma-4-31b`,label:`Gemma 4 31B (High Speed • 30 RPM)`}];function g({currentModel:e,onSwitchModelAndResume:t,onCancel:n}){let r=document.getElementById(`ai-solver-quota-modal`);r&&r.remove();let i=document.createElement(`div`);i.id=`ai-solver-quota-modal`,i.className=`ai-solver-modal-backdrop`;let a=h.find(t=>t.id!==e)?.id||`gemini-3.5-flash-lite`,o=h.map(t=>{let n=t.id===e,r=t.id===a;return`<option value="${t.id}" ${r?`selected`:``} ${n?`disabled`:``}>
      ${t.label}${n?` (Exhausted / Исчерпана)`:``}
    </option>`}).join(``);i.innerHTML=`
    <div class="ai-solver-modal-dialog">
      <div class="ai-solver-modal-header">
        <div class="ai-solver-modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Rate Limit / Quota Exceeded</span>
        </div>
        <button type="button" class="ai-solver-modal-close" title="Close">✕</button>
      </div>

      <div class="ai-solver-modal-body">
        <p class="ai-solver-modal-desc">
          У модели <b>${v(e)}</b> исчерпан лимит запросов или квота (429 / Resource Exhausted).
          Чтобы продолжить решение без потери прогресса, выберите другую модель:
        </p>

        <div class="ai-solver-modal-select-wrapper">
          <label for="ai-solver-quota-model-select">Выберите другую модель:</label>
          <select id="ai-solver-quota-model-select" class="ai-solver-modal-select">
            ${o}
          </select>
        </div>
      </div>

      <div class="ai-solver-modal-footer">
        <button type="button" class="ai-solver-modal-btn secondary cancel-btn">Отмена</button>
        <button type="button" class="ai-solver-modal-btn primary continue-btn">
          <span>⚡ Сменить модель и продолжить</span>
        </button>
      </div>
    </div>
  `,document.body.appendChild(i);let s=i.querySelector(`#ai-solver-quota-model-select`),c=i.querySelector(`.continue-btn`),u=i.querySelector(`.cancel-btn`),d=i.querySelector(`.ai-solver-modal-close`),f=()=>{i.remove()};d.addEventListener(`click`,()=>{f(),n?.()}),u.addEventListener(`click`,()=>{f(),n?.()}),c.addEventListener(`click`,async()=>{let e=s.value;c.disabled=!0,c.innerHTML=`<span>Переключение...</span>`,await l({model:e}),f(),await t(e)})}async function _(e){if(document.getElementById(`ai-solver-floating-bar`))return;let t=await c(),n=u();n&&`${n}`;let r=document.createElement(`div`);r.id=`ai-solver-floating-bar`,r.className=`ai-solver-floating-bar`,r.innerHTML=`
    <div class="ai-solver-bar-brand">
      <span>FormIQ</span>
    </div>

    <button type="button" id="ai-solver-solve-all" class="ai-solver-solve-all-btn" title="Automatically solve all questions">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      <span class="btn-text">Solve All</span>
    </button>

    <div class="ai-solver-dock-model-wrapper" title="Active Model">
      <select id="ai-solver-dock-model" class="ai-solver-dock-model-select">
        ${h.map(e=>`<option value="${e.id}" ${e.id===t.model?`selected`:``}>${e.label}</option>`).join(``)}
      </select>
    </div>

    <label class="ai-solver-scroll-toggle" title="Skip already answered questions">
      <input type="checkbox" id="ai-solver-skip-check" ${t.skipAnswered===!1?``:`checked`}>
      <span>Skip answered</span>
    </label>

    <label class="ai-solver-scroll-toggle" title="Smooth auto-scroll to current question">
      <input type="checkbox" id="ai-solver-scroll-check" ${t.autoScroll?`checked`:``}>
      <span>Auto-scroll</span>
    </label>

    <div id="ai-solver-progress-wrap" class="ai-solver-progress-bar-container">
      <div id="ai-solver-progress-fill" class="ai-solver-progress-bar-fill"></div>
    </div>

    <button type="button" class="ai-solver-floating-close" title="Hide Dock">✕</button>
  `,document.body.appendChild(r);let i=r.querySelector(`#ai-solver-solve-all`),a=r.querySelector(`#ai-solver-dock-model`),o=r.querySelector(`#ai-solver-skip-check`),s=r.querySelector(`#ai-solver-scroll-check`),d=r.querySelector(`#ai-solver-progress-wrap`),f=r.querySelector(`#ai-solver-progress-fill`),p=r.querySelector(`.ai-solver-floating-close`);a?.addEventListener(`change`,async()=>{await l({model:a.value})}),o?.addEventListener(`change`,async()=>{await l({skipAnswered:o.checked})}),s?.addEventListener(`change`,async()=>{await l({autoScroll:s.checked})}),typeof chrome<`u`&&chrome.storage?.onChanged&&chrome.storage.onChanged.addListener(e=>{e.model&&a&&typeof e.model.newValue==`string`&&(a.value=e.model.newValue),e.skipAnswered&&o&&(o.checked=!!e.skipAnswered.newValue),e.autoScroll&&s&&(s.checked=!!e.autoScroll.newValue)}),p.addEventListener(`click`,()=>{r.remove()}),i.addEventListener(`click`,async()=>{i.disabled=!0,d.style.display=`block`,f.style.width=`0%`;let t=(e,t)=>{let n=t>0?e/t*100:0;f.style.width=`${n}%`;let r=i.querySelector(`.btn-text`);r&&(r.textContent=`(${e}/${t})...`)};try{await e(i,t);let n=i.querySelector(`.btn-text`);n&&(n.textContent=`✓ Completed!`,setTimeout(()=>{n.textContent=`Solve All`},3e3))}catch(e){console.error(e)}finally{i.disabled=!1,setTimeout(()=>{d.style.display=`none`},2e3)}})}function v(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}var y=`https://generativelanguage.googleapis.com/v1beta/models`,b=class extends Error{isQuotaExceeded=!0;model;constructor(e,t){super(e),this.name=`GeminiQuotaError`,this.model=t}};async function x(e,t){let n=t.apiKey?.trim();if(!n)throw Error(`Gemini API key is not configured. Please open FormIQ settings and enter your key.`);let r=(t.model||`gemini-3.8-flash`).replace(/^models\//,``),i=`${y}/${r}:generateContent?key=${n}`,a=[];if(e.images&&e.images.length>0)for(let t of e.images)t.base64&&t.mimeType&&a.push({inlineData:{mimeType:t.mimeType,data:t.base64}});let o=``;e.options.length>0&&(o=e.options.map((e,t)=>`[Option ${t}]: ${e.text}`).join(`
`));let s=t.language===`ru`?`Provide the explanation in Russian.`:t.language===`en`?`Provide the explanation in English.`:`Provide the explanation in the same language as the question.`,c=``;e.type===`checkbox`?c=`
CRITICAL INSTRUCTION FOR MULTIPLE-CHOICE (CHECKBOX):
- THIS QUESTION TYPE ALLOWS AND EXPECTS MULTIPLE CORRECT ANSWERS.
- DO NOT PICK JUST ONE OPTION if multiple options are valid/correct!
- Carefully evaluate EACH option independently.
- If 2, 3, or more options are correct, you MUST return ALL their indices in "selectedIndices" (e.g. [0, 2] or [0, 1, 3]) and their full texts in "selectedTexts".
- Returning only 1 option when multiple options are correct is strictly penalized.`:(e.type===`radio`||e.type===`dropdown`)&&(c=`
INSTRUCTION FOR SINGLE-CHOICE (RADIO/DROPDOWN):
- Select exactly ONE best option in "selectedIndices" (e.g. [1]) and its text in "selectedTexts".`);let l=`You are an expert AI assistant dedicated to accurately solving tests and questionnaires in Google Forms.
Your task is to analyze the question (including attached images, if any), the answer options, and determine the exact correct answer(s).

Question Details:
- Type: ${e.type} (radio: single choice, checkbox: multiple choices, text: short answer, paragraph: long answer, dropdown: select dropdown)
- Question title: "${e.title}"
${o?`- Available options:\n${o}`:`- Free text input field`}
${c}

Requirements:
1. For "checkbox": Carefully evaluate all options. Select ALL correct and applicable indices in "selectedIndices" (e.g. [0, 2]) and their exact texts in "selectedTexts".
2. For "radio" and "dropdown": choose exactly 1 correct index in "selectedIndices" (e.g. [0]) and its text in "selectedTexts".
3. For "text" and "paragraph": formulate the most precise and concise answer in "textAnswer".
4. Provide a "confidence" score between 0 and 100.
5. Write an "explanation" — a clear, step-by-step reasoning explaining why this answer is correct. ${s}

Return the response STRICTLY as valid JSON matching this schema:
{
  "selectedIndices": [number],
  "selectedTexts": [string],
  "textAnswer": string,
  "confidence": number,
  "explanation": string
}`;a.push({text:l});try{let t=await fetch(i,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{role:`user`,parts:a}],generationConfig:{responseMimeType:`application/json`,temperature:.1,maxOutputTokens:2048}})});if(!t.ok){let e=(await t.json().catch(()=>({})))?.error?.message||`HTTP ${t.status}: ${t.statusText}`;throw t.status===429||e.includes(`RESOURCE_EXHAUSTED`)||e.toLowerCase().includes(`quota`)||e.toLowerCase().includes(`rate limit`)?new b(`Quota or rate limit reached for model "${r}". Please select another model to continue. (${e})`,r):t.status===400||t.status===403?Error(`Gemini API access error (${t.status}): ${e}. Please check your API key.`):Error(`Gemini API error: ${e}`)}let n=(await t.json())?.candidates?.[0]?.content?.parts?.[0]?.text;if(!n)throw Error(`Gemini returned an empty response or the response was blocked by safety filters.`);let o;try{let e=n.replace(/^```json\s*/i,``).replace(/\s*```$/i,``).trim();o=JSON.parse(e)}catch{console.warn(`Failed to parse strict JSON, attempting regex extraction:`,n);let e=n.match(/\{[\s\S]*\}/);if(e)o=JSON.parse(e[0]);else throw Error(`Failed to parse JSON response from Gemini: ${n}`)}return{questionType:e.type,selectedIndices:Array.isArray(o.selectedIndices)?o.selectedIndices:[],selectedTexts:Array.isArray(o.selectedTexts)?o.selectedTexts:[],textAnswer:o.textAnswer||``,confidence:typeof o.confidence==`number`?o.confidence:95,explanation:o.explanation||`No explanation provided.`,rawResponse:n}}catch(e){throw console.error(`Error solving question with Gemini:`,e),e}}console.log(`🚀 [FormIQ Assistant] Content script initialized.`);async function S(){let e=`formiq-local-fonts`;if(!document.getElementById(e))try{let t=chrome.runtime.getURL(`fonts/fonts.css.template`),n=await(await fetch(t)).text(),r=chrome.runtime.getURL(`fonts`),i=n.replaceAll(`__FONT_BASE_URL__`,r),a=document.createElement(`style`);a.id=e,a.textContent=i,(document.head||document.documentElement).appendChild(a)}catch(e){console.warn(`[FormIQ] Could not load local extension fonts:`,e)}}var C={outfit:`'Outfit', sans-serif`,jakarta:`'Plus Jakarta Sans', sans-serif`,manrope:`'Manrope', sans-serif`,"space-grotesk":`'Space Grotesk', sans-serif`,inter:`'Inter', sans-serif`};function w(e){let t=e||`outfit`;[`ai-font-outfit`,`ai-font-jakarta`,`ai-font-manrope`,`ai-font-space-grotesk`,`ai-font-inter`].forEach(e=>{document.body?.classList.remove(e),document.documentElement.classList.remove(e)}),document.body?.classList.add(`ai-font-${t}`),document.documentElement.classList.add(`ai-font-${t}`);let n=C[t]||C.outfit;document.documentElement.style.setProperty(`--ai-solver-font`,n),document.body&&document.body.style.setProperty(`--ai-solver-font`,n)}async function T(e,n,r){f(n,!0);try{let i=await c();if(!i.apiKey||i.apiKey.trim()===``)return m(e,`API key is not configured. Please open the FormIQ extension popup and enter your Gemini API key.`),f(n,!1),{success:!1};i.autoScroll&&e.scrollIntoView({behavior:`smooth`,block:`center`});let a=await t(e,r);if(!a)return m(e,`Could not detect the structure of this question.`),f(n,!1),{success:!1};let s=await x(a,i);return await o(a,s),p(e,s,a),{success:!0}}catch(t){console.error(`Error during solve:`,t);let n=!!t?.isQuotaExceeded;return m(e,t?.message||`An error occurred while generating the answer.`),{success:!1,quotaExceeded:n,error:t}}finally{f(n,!1)}}var E=!1;async function D(e,i,a=0){if(!(E&&a===0)){E=!0;try{let o=r();if(o.length===0)return;for(let r=a;r<o.length;r++){let a=await c(),s=a.skipAnswered!==!1,l=o[r],u=l.querySelector(`.ai-solver-solve-btn`);if(!u){i(r+1,o.length);continue}if(s){let e=await t(l,r);if(e&&n(e)){u.innerHTML=`<span>✓ Answered</span>`,u.title=`Question already answered (skipped according to settings)`,i(r+1,o.length);continue}}if(a.autoScroll&&(l.scrollIntoView({behavior:`smooth`,block:`center`}),await new Promise(e=>setTimeout(e,300))),(await T(l,u,r)).quotaExceeded){E=!1,g({currentModel:a.model||`gemini-3.8-flash`,onSwitchModelAndResume:async t=>{console.log(`[FormIQ] Switched to ${t}. Resuming solve from question #${r+1}...`),await D(e,i,r)},onCancel:()=>{let t=e.querySelector(`.btn-text`);t&&(t.textContent=`Solve All`)}});return}i(r+1,o.length),await new Promise(e=>setTimeout(e,600))}}finally{E=!1}}}async function O(){w((await c()).fontFamily||`outfit`);let e=r();e.forEach((e,t)=>{d(e,async n=>{(await T(e,n,t)).quotaExceeded&&g({currentModel:(await c()).model||`gemini-3.8-flash`,onSwitchModelAndResume:async r=>{console.log(`[FormIQ] Retrying question #${t+1} with ${r}...`),await T(e,n,t)}})})}),e.length>0&&await _(D)}S(),typeof chrome<`u`&&chrome.storage?.onChanged&&chrome.storage.onChanged.addListener(e=>{e.fontFamily&&w(e.fontFamily.newValue)}),O();var k=new MutationObserver(()=>{O()});document.body?k.observe(document.body,{childList:!0,subtree:!0}):document.addEventListener(`DOMContentLoaded`,()=>{k.observe(document.body,{childList:!0,subtree:!0})})})();