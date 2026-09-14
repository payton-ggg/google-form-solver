(function(){async function e(e){let t=e.src||e.getAttribute(`data-src`)||``;if(!t||t.startsWith(`chrome-extension://`))return null;if(t.startsWith(`data:image/`)){let n=t.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);if(n)return{src:t,alt:e.alt||``,mimeType:n[1],base64:n[2]}}try{let n=await(await fetch(t)).blob();return new Promise(r=>{let i=new FileReader;i.onloadend=()=>{let a=i.result.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);r(a?{src:t,alt:e.alt||``,mimeType:a[1]||n.type||`image/jpeg`,base64:a[2]}:null)},i.onerror=()=>r(null),i.readAsDataURL(n)})}catch{try{let n=document.createElement(`canvas`);n.width=e.naturalWidth||e.width||300,n.height=e.naturalHeight||e.height||200;let r=n.getContext(`2d`);if(r){r.drawImage(e,0,0);let i=n.toDataURL(`image/jpeg`,.85).match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);if(i)return{src:t,alt:e.alt||``,mimeType:i[1],base64:i[2]}}}catch{console.warn(`Could not extract image data:`,t)}return null}}async function t(t,n){if(!t)return null;let r=t.getAttribute(`data-item-id`)||`question-${n}-${Date.now()}`,i=t.querySelector(`.M7eMe`)||t.querySelector(`[role="heading"]`)||t.querySelector(`.HoLwm`)||t.querySelector(`.ahS2le`),a=i?(i.textContent||``).trim():``,o=t.querySelector(`.g6ldxf`)||t.querySelector(`.e4eG1b`);o&&o.textContent&&(a+=`\n(Описание: ${o.textContent.trim()})`);let s=Array.from(t.querySelectorAll(`img`)).filter(e=>!(e.width>0&&e.width<32&&e.height>0&&e.height<32||e.classList.contains(`ai-solver-icon`))),c=[];for(let t of s){let n=await e(t);n&&c.push(n)}let l=`unknown`,u=[],d,f=t.querySelector(`[role="radiogroup"]`)||t.querySelector(`.appsMaterialWizToggleRadiogroupEl`),p=t.querySelectorAll(`[role="radio"]`),m=t.querySelectorAll(`[role="checkbox"]`),h=t.querySelector(`input.whsOnd`)||t.querySelector(`input[type="text"]`),g=t.querySelector(`textarea.KHxj8b`)||t.querySelector(`textarea`),_=t.querySelector(`[role="listbox"]`);if(f||p.length>0&&m.length===0){l=`radio`;let e=t.querySelectorAll(`.docssharedWizToggleLabeledContainer, .nWQGrd, [role="radio"]`),n=new Set,r=0;e.forEach(e=>{let t=e.getAttribute(`role`)===`radio`?e:e.querySelector(`[role="radio"]`)||e;if(n.has(t))return;n.add(t);let i=t.getAttribute(`data-value`)||``;i||=((e.querySelector(`.aDTYNe, .ulDsOb, .bzfPab`)||e).textContent||``).trim(),u.push({index:r++,text:i||`Вариант ${r}`,element:t,inputElement:t})})}else if(m.length>0){l=`checkbox`;let e=t.querySelectorAll(`.docssharedWizToggleLabeledContainer, .Y6Holder, [role="checkbox"]`),n=new Set,r=0;e.forEach(e=>{let t=e.getAttribute(`role`)===`checkbox`?e:e.querySelector(`[role="checkbox"]`)||e;if(n.has(t))return;n.add(t);let i=t.getAttribute(`data-value`)||``;i||=((e.querySelector(`.aDTYNe, .ulDsOb, .bzfPab`)||e).textContent||``).trim(),u.push({index:r++,text:i||`Вариант ${r}`,element:t,inputElement:t})})}else g?(l=`paragraph`,d=g):h?(l=`text`,d=h):_&&(l=`dropdown`,_.querySelectorAll(`[role="option"]`).forEach((e,t)=>{u.push({index:t,text:(e.textContent||e.getAttribute(`data-value`)||`Опция ${t+1}`).trim(),element:e})}));return a||=`Вопрос #${n+1}`,{id:r,container:t,title:a,type:l,required:!!t.querySelector(`[aria-label*="обязательный"], [aria-label*="required"], .v3duvd`),options:u,textInput:d,images:c}}function n(){return Array.from(document.querySelectorAll(`.Qr7Oae`))}function r(e){e.scrollIntoView({behavior:`smooth`,block:`nearest`}),[`mouseover`,`mousedown`,`mouseup`,`click`].forEach(t=>{let n=new MouseEvent(t,{view:window,bubbles:!0,cancelable:!0,buttons:1});e.dispatchEvent(n)})}function i(e,t){e.focus();let n=e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,r=Object.getOwnPropertyDescriptor(n,`value`)?.set;r?r.call(e,t):e.value=t,e.dispatchEvent(new Event(`input`,{bubbles:!0})),e.dispatchEvent(new Event(`change`,{bubbles:!0})),e.dispatchEvent(new FocusEvent(`blur`,{bubbles:!0}))}async function a(e,t){try{if(e.type===`radio`){let n=null;if(t.selectedIndices&&t.selectedIndices.length>0){let r=t.selectedIndices[0];r>=0&&r<e.options.length&&(n=e.options[r])}if(!n&&t.selectedTexts&&t.selectedTexts.length>0){let r=t.selectedTexts[0].toLowerCase().trim();n=e.options.find(e=>e.text.toLowerCase().trim()===r)||null}if(n)return r(n.inputElement||n.element),!0}else if(e.type===`checkbox`){let n=0;if(t.selectedIndices&&t.selectedIndices.length>0){for(let i of t.selectedIndices)if(i>=0&&i<e.options.length){let t=e.options[i],a=t.inputElement||t.element;a.getAttribute(`aria-checked`)!==`true`&&r(a),n++}}if(n===0&&t.selectedTexts&&t.selectedTexts.length>0)for(let i of t.selectedTexts){let t=i.toLowerCase().trim(),a=e.options.find(e=>e.text.toLowerCase().trim()===t);if(a){let e=a.inputElement||a.element;e.getAttribute(`aria-checked`)!==`true`&&r(e),n++}}return n>0}else if(e.type===`text`||e.type===`paragraph`){let n=e.textInput||e.container.querySelector(`input, textarea`);if(n&&t.textAnswer)return i(n,t.textAnswer),!0}else if(e.type===`dropdown`&&t.selectedIndices&&t.selectedIndices.length>0){let n=t.selectedIndices[0];if(n>=0&&n<e.options.length){let t=e.options[n];return r(t.element),!0}}return!1}catch(e){return console.error(`Failed to apply solution to DOM:`,e),!1}}function o(e,t){if(e.querySelector(`.ai-solver-btn-wrapper`))return e.querySelector(`.ai-solver-solve-btn`);let n=document.createElement(`div`);n.className=`ai-solver-btn-wrapper`;let r=document.createElement(`button`);return r.type=`button`,r.className=`ai-solver-solve-btn`,r.innerHTML=`
    <svg class="ai-solver-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
    <span>✨ AI Решить</span>
  `,r.addEventListener(`click`,async e=>{e.preventDefault(),e.stopPropagation(),await t(r)}),n.appendChild(r),e.firstChild?e.insertBefore(n,e.firstChild):e.appendChild(n),r}function s(e,t,n=`⚡ Решаю...`){t?(e.classList.add(`loading`),e.disabled=!0,e.innerHTML=`
      <span class="ai-solver-spinner"></span>
      <span>${n}</span>
    `):(e.classList.remove(`loading`),e.disabled=!1,e.innerHTML=`
      <svg class="ai-solver-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      </svg>
      <span>✨ AI Решить</span>
    `)}function c(e,t,n){let r=e.querySelector(`.ai-solver-card, .ai-solver-error-card`);r&&r.remove();let i=document.createElement(`div`);i.className=`ai-solver-card`;let a=``;a=n.type===`radio`||n.type===`checkbox`||n.type===`dropdown`?t.selectedTexts&&t.selectedTexts.length>0?t.selectedTexts.join(`; `):t.selectedIndices&&t.selectedIndices.length>0?t.selectedIndices.map(e=>n.options[e]?.text||`Вариант ${e+1}`).join(`; `):`Ответ выбран`:t.textAnswer||`Введен ответ`,i.innerHTML=`
    <div class="ai-solver-card-header">
      <div class="ai-solver-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.5">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        </svg>
        <span>Ответ от Gemini AI</span>
        <span class="ai-solver-confidence-badge">${Math.round(t.confidence||95)}% уверенность</span>
      </div>
      <button type="button" class="ai-solver-card-close" title="Закрыть карточку">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="ai-solver-selected-answer">
      <div class="ai-solver-selected-answer-label">✓ Выбранный ответ:</div>
      <div class="ai-solver-selected-answer-value">${d(a)}</div>
    </div>

    <div class="ai-solver-explanation-body">
      ${d(t.explanation)}
    </div>

    <div class="ai-solver-card-actions">
      <button type="button" class="ai-solver-action-btn copy-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
        <span>Скопировать объяснение</span>
      </button>
    </div>
  `,i.querySelector(`.ai-solver-card-close`)?.addEventListener(`click`,()=>{i.remove()});let o=i.querySelector(`.copy-btn`);o?.addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(t.explanation);let e=o.querySelector(`span`);e&&(e.textContent=`✓ Скопировано!`,setTimeout(()=>{e.textContent=`Скопировать объяснение`},2e3))}catch{}}),e.appendChild(i)}function l(e,t){let n=e.querySelector(`.ai-solver-card, .ai-solver-error-card`);n&&n.remove();let r=document.createElement(`div`);r.className=`ai-solver-error-card`,r.innerHTML=`
    <div style="display:flex; justify-content:space-between; align-items:center; font-weight:700;">
      <span style="display:flex; align-items:center; gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Ошибка решения
      </span>
      <button type="button" class="ai-solver-card-close" style="color:#ef4444;" title="Закрыть">✕</button>
    </div>
    <div>${d(t)}</div>
  `,r.querySelector(`.ai-solver-card-close`)?.addEventListener(`click`,()=>{r.remove()}),e.appendChild(r)}function u(e){if(document.getElementById(`ai-solver-floating-bar`))return;let t=document.createElement(`div`);t.id=`ai-solver-floating-bar`,t.className=`ai-solver-floating-bar`,t.innerHTML=`
    <div class="ai-solver-bar-brand">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.5">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      </svg>
      <span>AI Solver</span>
    </div>

    <button type="button" id="ai-solver-solve-all" class="ai-solver-solve-all-btn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      <span class="btn-text">✨ Решить всю форму</span>
    </button>

    <div id="ai-solver-progress-wrap" class="ai-solver-progress-bar-container">
      <div id="ai-solver-progress-fill" class="ai-solver-progress-bar-fill"></div>
    </div>

    <button type="button" class="ai-solver-floating-close" title="Скрыть панель">✕</button>
  `,document.body.appendChild(t);let n=t.querySelector(`#ai-solver-solve-all`),r=t.querySelector(`#ai-solver-progress-wrap`),i=t.querySelector(`#ai-solver-progress-fill`);t.querySelector(`.ai-solver-floating-close`).addEventListener(`click`,()=>{t.remove()}),n.addEventListener(`click`,async()=>{n.disabled=!0,r.style.display=`block`,i.style.width=`0%`;let t=(e,t)=>{let r=t>0?e/t*100:0;i.style.width=`${r}%`;let a=n.querySelector(`.btn-text`);a&&(a.textContent=`Решаю (${e}/${t})...`)};try{await e(n,t);let r=n.querySelector(`.btn-text`);r&&(r.textContent=`✓ Форма решена!`,setTimeout(()=>{r.textContent=`✨ Решить всю форму`},3e3))}catch(e){console.error(e)}finally{n.disabled=!1,setTimeout(()=>{r.style.display=`none`},2e3)}})}function d(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}var f={apiKey:``,model:`gemini-2.5-flash`,autoScroll:!0,language:`auto`};async function p(){return new Promise(e=>{if(typeof chrome<`u`&&chrome.storage?.sync)chrome.storage.sync.get(f,t=>{let n={...f,...t};!n.apiKey&&f.apiKey&&(n.apiKey=f.apiKey),e(n)});else if(typeof chrome<`u`&&chrome.storage?.local)chrome.storage.local.get(f,t=>{e({...f,...t})});else try{let t=localStorage.getItem(`gemini_solver_settings`),n=t?JSON.parse(t):{};e({...f,...n})}catch{e(f)}})}var m=`https://generativelanguage.googleapis.com/v1beta/models`;async function h(e,t){let n=t.apiKey?.trim();if(!n)throw Error(`API ключ Gemini не установлен. Откройте настройки расширения в панели браузера и введите ключ.`);let r=`${m}/${t.model||`gemini-2.5-flash`}:generateContent?key=${n}`,i=[];if(e.images&&e.images.length>0)for(let t of e.images)t.base64&&t.mimeType&&i.push({inlineData:{mimeType:t.mimeType,data:t.base64}});let a=``;e.options.length>0&&(a=e.options.map((e,t)=>`[Вариант ${t}]: ${e.text}`).join(`
`));let o=t.language===`ru`?`Объяснение дай на русском языке.`:t.language===`en`?`Provide the explanation in English.`:`Provide the explanation in the same language as the question.`,s=`Ты — экспертный ИИ-ассистент для точного решения тестов и заданий в Google Формах.
Твоя задача — проанализировать вопрос (включая изображения, если они есть), варианты ответов и определить единственно верный или все верные ответы.

Формат вопроса:
- Тип: ${e.type} (radio: одиночный выбор, checkbox: множественный выбор, text: короткий ответ, paragraph: развернутый ответ, dropdown: выпадающий список)
- Текст вопроса: "${e.title}"
${a?`- Доступные варианты:\n${a}`:`- Поле для свободного ввода ответа`}

Требования:
1. Для "radio" и "dropdown": выбери ровно 1 правильный индекс в "selectedIndices" (например [0]) и его текст в "selectedTexts".
2. Для "checkbox": выбери ВСЕ правильные индексы в "selectedIndices" (например [0, 2]) и их тексты в "selectedTexts".
3. Для "text" и "paragraph": сформулируй максимально точный и лаконичный ответ в "textAnswer".
4. Укажи "confidence" от 0 до 100 (уверенность в ответе).
5. Напиши "explanation" — четкое, понятное пошаговое объяснение, почему этот ответ верный. ${o}

Верни ответ СТРОГО в формате JSON:
{
  "selectedIndices": [number],
  "selectedTexts": [string],
  "textAnswer": string,
  "confidence": number,
  "explanation": string
}`;i.push({text:s});try{let t=await fetch(r,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{role:`user`,parts:i}],generationConfig:{responseMimeType:`application/json`,temperature:.1,maxOutputTokens:2048}})});if(!t.ok){let e=(await t.json().catch(()=>({})))?.error?.message||`HTTP ${t.status}: ${t.statusText}`;throw t.status===400||t.status===403?Error(`Ошибка доступа к Gemini API (${t.status}): ${e}. Проверьте ваш API ключ.`):t.status===429?Error(`Превышен лимит запросов к Gemini API (Rate Limit). Подождите несколько секунд.`):Error(`Ошибка Gemini API: ${e}`)}let n=(await t.json())?.candidates?.[0]?.content?.parts?.[0]?.text;if(!n)throw Error(`Gemini вернул пустой ответ или ответ был заблокирован фильтром безопасности.`);let a;try{let e=n.replace(/^```json\s*/i,``).replace(/\s*```$/i,``).trim();a=JSON.parse(e)}catch{console.warn(`Failed to parse strict JSON, attempting regex extraction:`,n);let e=n.match(/\{[\s\S]*\}/);if(e)a=JSON.parse(e[0]);else throw Error(`Не удалось распарсить JSON ответ от Gemini: ${n}`)}return{questionType:e.type,selectedIndices:Array.isArray(a.selectedIndices)?a.selectedIndices:[],selectedTexts:Array.isArray(a.selectedTexts)?a.selectedTexts:[],textAnswer:a.textAnswer||``,confidence:typeof a.confidence==`number`?a.confidence:95,explanation:a.explanation||`Объяснение не предоставлено.`,rawResponse:n}}catch(e){throw console.error(`Error solving question with Gemini:`,e),e}}console.log(`🚀 [Google Forms AI Solver] Content script initialized.`);async function g(e,n,r){s(n,!0);try{let i=await p();if(!i.apiKey||i.apiKey.trim()===``){l(e,`⚠️ API ключ Gemini не установлен. Пожалуйста, откройте иконку расширения в правом верхнем углу браузера и введите ваш Gemini API Key.`),s(n,!1);return}let o=await t(e,r);if(!o){l(e,`Не удалось распознать структуру вопроса.`),s(n,!1);return}let u=await h(o,i);await a(o,u),c(e,u,o),i.autoScroll&&e.scrollIntoView({behavior:`smooth`,block:`center`})}catch(t){console.error(`Error during AI solve:`,t),l(e,t?.message||`Произошла непредвиденная ошибка при обращении к ИИ.`)}finally{s(n,!1)}}async function _(e,t){let r=n();if(r.length!==0)for(let e=0;e<r.length;e++){let n=r[e],i=n.querySelector(`.ai-solver-solve-btn`);i&&await g(n,i,e),t(e+1,r.length),await new Promise(e=>setTimeout(e,800))}}function v(){let e=n();e.forEach((e,t)=>{o(e,async n=>{await g(e,n,t)})}),e.length>0&&u(_)}v(),new MutationObserver(()=>{v()}).observe(document.body,{childList:!0,subtree:!0})})();