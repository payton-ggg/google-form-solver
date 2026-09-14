(function(){async function e(e){let t=e.src||e.getAttribute(`data-src`)||``;if(!t||t.startsWith(`chrome-extension://`))return null;if(t.startsWith(`data:image/`)){let n=t.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);if(n)return{src:t,alt:e.alt||``,mimeType:n[1],base64:n[2]}}try{let n=await(await fetch(t)).blob();return new Promise(r=>{let i=new FileReader;i.onloadend=()=>{let a=i.result.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);r(a?{src:t,alt:e.alt||``,mimeType:a[1]||n.type||`image/jpeg`,base64:a[2]}:null)},i.onerror=()=>r(null),i.readAsDataURL(n)})}catch{try{let n=document.createElement(`canvas`);n.width=e.naturalWidth||e.width||300,n.height=e.naturalHeight||e.height||200;let r=n.getContext(`2d`);if(r){r.drawImage(e,0,0);let i=n.toDataURL(`image/jpeg`,.85).match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);if(i)return{src:t,alt:e.alt||``,mimeType:i[1],base64:i[2]}}}catch{console.warn(`Could not extract image data:`,t)}return null}}async function t(t,n){if(!t)return null;let r=t.getAttribute(`data-item-id`)||`question-${n}-${Date.now()}`,i=t.querySelector(`.M7eMe`)||t.querySelector(`[role="heading"]`)||t.querySelector(`.HoLwm`)||t.querySelector(`.ahS2le`),a=i?(i.textContent||``).trim():``,o=t.querySelector(`.g6ldxf`)||t.querySelector(`.e4eG1b`);o&&o.textContent&&(a+=`\n(Описание: ${o.textContent.trim()})`);let s=Array.from(t.querySelectorAll(`img`)).filter(e=>!(e.width>0&&e.width<32&&e.height>0&&e.height<32||e.classList.contains(`ai-solver-icon`))),c=[];for(let t of s){let n=await e(t);n&&c.push(n)}let l=`unknown`,u=[],d,f=t.querySelector(`[role="radiogroup"]`)||t.querySelector(`.appsMaterialWizToggleRadiogroupEl`),p=t.querySelectorAll(`[role="radio"]`),m=t.querySelectorAll(`[role="checkbox"]`),h=t.querySelector(`input.whsOnd`)||t.querySelector(`input[type="text"]`),g=t.querySelector(`textarea.KHxj8b`)||t.querySelector(`textarea`),_=t.querySelector(`[role="listbox"]`);if(f||p.length>0&&m.length===0){l=`radio`;let e=t.querySelectorAll(`.docssharedWizToggleLabeledContainer, .nWQGrd, [role="radio"]`),n=new Set,r=0;e.forEach(e=>{let t=e.getAttribute(`role`)===`radio`?e:e.querySelector(`[role="radio"]`)||e;if(n.has(t))return;n.add(t);let i=t.getAttribute(`data-value`)||``;i||=((e.querySelector(`.aDTYNe, .ulDsOb, .bzfPab`)||e).textContent||``).trim(),u.push({index:r++,text:i||`Вариант ${r}`,element:t,inputElement:t})})}else if(m.length>0){l=`checkbox`;let e=t.querySelectorAll(`.docssharedWizToggleLabeledContainer, .Y6Holder, [role="checkbox"]`),n=new Set,r=0;e.forEach(e=>{let t=e.getAttribute(`role`)===`checkbox`?e:e.querySelector(`[role="checkbox"]`)||e;if(n.has(t))return;n.add(t);let i=t.getAttribute(`data-value`)||``;i||=((e.querySelector(`.aDTYNe, .ulDsOb, .bzfPab`)||e).textContent||``).trim(),u.push({index:r++,text:i||`Вариант ${r}`,element:t,inputElement:t})})}else g?(l=`paragraph`,d=g):h?(l=`text`,d=h):_&&(l=`dropdown`,_.querySelectorAll(`[role="option"]`).forEach((e,t)=>{u.push({index:t,text:(e.textContent||e.getAttribute(`data-value`)||`Опция ${t+1}`).trim(),element:e})}));return a||=`Вопрос #${n+1}`,{id:r,container:t,title:a,type:l,required:!!t.querySelector(`[aria-label*="обязательный"], [aria-label*="required"], .v3duvd`),options:u,textInput:d,images:c}}function n(){return Array.from(document.querySelectorAll(`.Qr7Oae`))}function r(e){e.scrollIntoView({behavior:`smooth`,block:`nearest`}),[`mouseover`,`mousedown`,`mouseup`,`click`].forEach(t=>{let n=new MouseEvent(t,{view:window,bubbles:!0,cancelable:!0,buttons:1});e.dispatchEvent(n)})}function i(e,t){e.focus();let n=e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,r=Object.getOwnPropertyDescriptor(n,`value`)?.set;r?r.call(e,t):e.value=t,e.dispatchEvent(new Event(`input`,{bubbles:!0})),e.dispatchEvent(new Event(`change`,{bubbles:!0})),e.dispatchEvent(new FocusEvent(`blur`,{bubbles:!0}))}async function a(e,t){try{if(e.type===`radio`){let n=null;if(t.selectedIndices&&t.selectedIndices.length>0){let r=t.selectedIndices[0];r>=0&&r<e.options.length&&(n=e.options[r])}if(!n&&t.selectedTexts&&t.selectedTexts.length>0){let r=t.selectedTexts[0].toLowerCase().trim();n=e.options.find(e=>e.text.toLowerCase().trim()===r)||null}if(n)return r(n.inputElement||n.element),!0}else if(e.type===`checkbox`){let n=0;if(t.selectedIndices&&t.selectedIndices.length>0){for(let i of t.selectedIndices)if(i>=0&&i<e.options.length){let t=e.options[i],a=t.inputElement||t.element;a.getAttribute(`aria-checked`)!==`true`&&r(a),n++}}if(n===0&&t.selectedTexts&&t.selectedTexts.length>0)for(let i of t.selectedTexts){let t=i.toLowerCase().trim(),a=e.options.find(e=>e.text.toLowerCase().trim()===t);if(a){let e=a.inputElement||a.element;e.getAttribute(`aria-checked`)!==`true`&&r(e),n++}}return n>0}else if(e.type===`text`||e.type===`paragraph`){let n=e.textInput||e.container.querySelector(`input, textarea`);if(n&&t.textAnswer)return i(n,t.textAnswer),!0}else if(e.type===`dropdown`&&t.selectedIndices&&t.selectedIndices.length>0){let n=t.selectedIndices[0];if(n>=0&&n<e.options.length){let t=e.options[n];return r(t.element),!0}}return!1}catch(e){return console.error(`Failed to apply solution to DOM:`,e),!1}}var o={apiKey:``,model:`gemini-3.6-flash`,autoScroll:!0,language:`auto`,fontFamily:`outfit`};async function s(){return new Promise(e=>{if(typeof chrome<`u`&&chrome.storage?.sync)chrome.storage.sync.get(o,t=>{let n={...o,...t};!n.apiKey&&o.apiKey&&(n.apiKey=o.apiKey),e(n)});else if(typeof chrome<`u`&&chrome.storage?.local)chrome.storage.local.get(o,t=>{e({...o,...t})});else try{let t=localStorage.getItem(`gemini_solver_settings`),n=t?JSON.parse(t):{};e({...o,...n})}catch{e(o)}})}async function c(e){return new Promise(t=>{if(typeof chrome<`u`&&chrome.storage?.sync)chrome.storage.sync.set(e,()=>{t()});else if(typeof chrome<`u`&&chrome.storage?.local)chrome.storage.local.set(e,()=>{t()});else{try{let t=localStorage.getItem(`gemini_solver_settings`),n=t?JSON.parse(t):o;localStorage.setItem(`gemini_solver_settings`,JSON.stringify({...n,...e}))}catch(e){console.error(`Failed to save to localStorage:`,e)}t()}})}function l(){try{if(typeof chrome<`u`&&chrome.runtime?.getURL)return chrome.runtime.getURL(`icons/icon48.png`)}catch{}return``}function u(e,t){if(e.querySelector(`.ai-solver-btn-wrapper`))return e.querySelector(`.ai-solver-solve-btn`);let n=document.createElement(`div`);n.className=`ai-solver-btn-wrapper`;let r=l();r&&`${r}`;let i=document.createElement(`button`);return i.type=`button`,i.className=`ai-solver-solve-btn`,i.title=`Решить вопрос и показать объяснение`,i.innerHTML=`
    <span>Решить</span>
  `,i.addEventListener(`click`,async e=>{e.preventDefault(),e.stopPropagation(),await t(i)}),n.appendChild(i),e.firstChild?e.insertBefore(n,e.firstChild):e.appendChild(n),i}function d(e,t,n=`Решение...`){if(t)e.classList.add(`loading`),e.disabled=!0,e.innerHTML=`
      <span class="ai-solver-spinner"></span>
      <span>${n}</span>
    `;else{let t=l();t&&`${t}`,e.classList.remove(`loading`),e.disabled=!1,e.innerHTML=`
      <span>Решить</span>
    `}}function f(e,t,n){let r=e.querySelector(`.ai-solver-card, .ai-solver-error-card`);r&&r.remove();let i=document.createElement(`div`);i.className=`ai-solver-card`;let a=``;a=n.type===`radio`||n.type===`checkbox`||n.type===`dropdown`?t.selectedTexts&&t.selectedTexts.length>0?t.selectedTexts.join(`; `):t.selectedIndices&&t.selectedIndices.length>0?t.selectedIndices.map(e=>n.options[e]?.text||`Вариант ${e+1}`).join(`; `):`Ответ выбран`:t.textAnswer||`Введен ответ`;let o=Math.round(t.confidence||95),s=l();i.innerHTML=`
    <div class="ai-solver-card-header">
      <div class="ai-solver-card-title">
        ${s?`<img src="${s}" class="ai-solver-card-logo" alt="FormIQ" width="16" height="16">`:`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
      </svg>`}
        <span>Пояснение к ответу</span>
        <span class="ai-solver-confidence-badge">${o}% точность</span>
      </div>
      <button type="button" class="ai-solver-card-close" title="Закрыть">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="ai-solver-selected-answer">
      <div class="ai-solver-selected-answer-label">Выбранный ответ</div>
      <div class="ai-solver-selected-answer-value">${h(a)}</div>
    </div>

    <div class="ai-solver-explanation-body">
      ${h(t.explanation)}
    </div>

    <div class="ai-solver-card-actions">
      <button type="button" class="ai-solver-action-btn copy-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
        <span>Скопировать</span>
      </button>
    </div>
  `,i.querySelector(`.ai-solver-card-close`)?.addEventListener(`click`,()=>{i.remove()});let c=i.querySelector(`.copy-btn`);c?.addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(t.explanation);let e=c.querySelector(`span`);e&&(e.textContent=`✓ Скопировано`,setTimeout(()=>{e.textContent=`Скопировать`},2e3))}catch{}}),e.appendChild(i)}function p(e,t){let n=e.querySelector(`.ai-solver-card, .ai-solver-error-card`);n&&n.remove();let r=document.createElement(`div`);r.className=`ai-solver-error-card`,r.innerHTML=`
    <div style="display:flex; justify-content:space-between; align-items:center; font-weight:600;">
      <span style="display:flex; align-items:center; gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Внимание
      </span>
      <button type="button" class="ai-solver-card-close" style="color:#e53e3e;" title="Закрыть">✕</button>
    </div>
    <div>${h(t)}</div>
  `,r.querySelector(`.ai-solver-card-close`)?.addEventListener(`click`,()=>{r.remove()}),e.appendChild(r)}async function m(e){if(document.getElementById(`ai-solver-floating-bar`))return;let t=await s(),n=l();n&&`${n}`;let r=document.createElement(`div`);r.id=`ai-solver-floating-bar`,r.className=`ai-solver-floating-bar`,r.innerHTML=`
    <div class="ai-solver-bar-brand">
      <span>FormIQ</span>
    </div>

    <button type="button" id="ai-solver-solve-all" class="ai-solver-solve-all-btn" title="Автоматически решить все вопросы">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      <span class="btn-text">Решить все</span>
    </button>

    <label class="ai-solver-scroll-toggle" title="Плавная автопрокрутка к текущему вопросу">
      <input type="checkbox" id="ai-solver-scroll-check" ${t.autoScroll?`checked`:``}>
      <span>Скролл</span>
    </label>

    <div id="ai-solver-progress-wrap" class="ai-solver-progress-bar-container">
      <div id="ai-solver-progress-fill" class="ai-solver-progress-bar-fill"></div>
    </div>

    <button type="button" class="ai-solver-floating-close" title="Скрыть панель">✕</button>
  `,document.body.appendChild(r);let i=r.querySelector(`#ai-solver-solve-all`),a=r.querySelector(`#ai-solver-scroll-check`),o=r.querySelector(`#ai-solver-progress-wrap`),u=r.querySelector(`#ai-solver-progress-fill`),d=r.querySelector(`.ai-solver-floating-close`);a.addEventListener(`change`,async()=>{await c({autoScroll:a.checked})}),d.addEventListener(`click`,()=>{r.remove()}),i.addEventListener(`click`,async()=>{i.disabled=!0,o.style.display=`block`,u.style.width=`0%`;let t=(e,t)=>{let n=t>0?e/t*100:0;u.style.width=`${n}%`;let r=i.querySelector(`.btn-text`);r&&(r.textContent=`(${e}/${t})...`)};try{await e(i,t);let n=i.querySelector(`.btn-text`);n&&(n.textContent=`✓ Решено!`,setTimeout(()=>{n.textContent=`Решить все`},3e3))}catch(e){console.error(e)}finally{i.disabled=!1,setTimeout(()=>{o.style.display=`none`},2e3)}})}function h(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}var g=`https://generativelanguage.googleapis.com/v1beta/models`;async function _(e,t){let n=t.apiKey?.trim();if(!n)throw Error(`API ключ Gemini не установлен. Откройте настройки расширения в панели браузера и введите ключ.`);let r=`${g}/${t.model||`gemini-3.6-flash`}:generateContent?key=${n}`,i=[];if(e.images&&e.images.length>0)for(let t of e.images)t.base64&&t.mimeType&&i.push({inlineData:{mimeType:t.mimeType,data:t.base64}});let a=``;e.options.length>0&&(a=e.options.map((e,t)=>`[Вариант ${t}]: ${e.text}`).join(`
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
}`;i.push({text:s});try{let t=await fetch(r,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{role:`user`,parts:i}],generationConfig:{responseMimeType:`application/json`,temperature:.1,maxOutputTokens:2048}})});if(!t.ok){let e=(await t.json().catch(()=>({})))?.error?.message||`HTTP ${t.status}: ${t.statusText}`;throw t.status===400||t.status===403?Error(`Ошибка доступа к Gemini API (${t.status}): ${e}. Проверьте ваш API ключ.`):t.status===429?Error(`Превышен лимит запросов к Gemini API (Rate Limit). Подождите несколько секунд.`):Error(`Ошибка Gemini API: ${e}`)}let n=(await t.json())?.candidates?.[0]?.content?.parts?.[0]?.text;if(!n)throw Error(`Gemini вернул пустой ответ или ответ был заблокирован фильтром безопасности.`);let a;try{let e=n.replace(/^```json\s*/i,``).replace(/\s*```$/i,``).trim();a=JSON.parse(e)}catch{console.warn(`Failed to parse strict JSON, attempting regex extraction:`,n);let e=n.match(/\{[\s\S]*\}/);if(e)a=JSON.parse(e[0]);else throw Error(`Не удалось распарсить JSON ответ от Gemini: ${n}`)}return{questionType:e.type,selectedIndices:Array.isArray(a.selectedIndices)?a.selectedIndices:[],selectedTexts:Array.isArray(a.selectedTexts)?a.selectedTexts:[],textAnswer:a.textAnswer||``,confidence:typeof a.confidence==`number`?a.confidence:95,explanation:a.explanation||`Объяснение не предоставлено.`,rawResponse:n}}catch(e){throw console.error(`Error solving question with Gemini:`,e),e}}console.log(`🚀 [FormIQ Assistant] Content script initialized.`);async function v(){let e=`formiq-local-fonts`;if(!document.getElementById(e))try{let t=chrome.runtime.getURL(`fonts/fonts.css.template`),n=await(await fetch(t)).text(),r=chrome.runtime.getURL(`fonts`),i=n.replaceAll(`__FONT_BASE_URL__`,r),a=document.createElement(`style`);a.id=e,a.textContent=i,(document.head||document.documentElement).appendChild(a)}catch(e){console.warn(`[FormIQ] Could not load local extension fonts:`,e)}}var y={outfit:`'Outfit', sans-serif`,jakarta:`'Plus Jakarta Sans', sans-serif`,manrope:`'Manrope', sans-serif`,"space-grotesk":`'Space Grotesk', sans-serif`,inter:`'Inter', sans-serif`};function b(e){let t=e||`outfit`;[`ai-font-outfit`,`ai-font-jakarta`,`ai-font-manrope`,`ai-font-space-grotesk`,`ai-font-inter`].forEach(e=>{document.body?.classList.remove(e),document.documentElement.classList.remove(e)}),document.body?.classList.add(`ai-font-${t}`),document.documentElement.classList.add(`ai-font-${t}`);let n=y[t]||y.outfit;document.documentElement.style.setProperty(`--ai-solver-font`,n),document.body&&document.body.style.setProperty(`--ai-solver-font`,n)}async function x(e,n,r){d(n,!0);try{let i=await s();if(!i.apiKey||i.apiKey.trim()===``){p(e,`API ключ не установлен. Откройте настройки расширения в браузере и введите ключ.`),d(n,!1);return}i.autoScroll&&e.scrollIntoView({behavior:`smooth`,block:`center`});let o=await t(e,r);if(!o){p(e,`Не удалось распознать структуру вопроса.`),d(n,!1);return}let c=await _(o,i);await a(o,c),f(e,c,o)}catch(t){console.error(`Error during solve:`,t),p(e,t?.message||`Произошла ошибка при получении ответа.`)}finally{d(n,!1)}}async function S(e,t){let r=n();if(r.length!==0)for(let e=0;e<r.length;e++){let n=r[e],i=n.querySelector(`.ai-solver-solve-btn`);i&&((await s()).autoScroll&&(n.scrollIntoView({behavior:`smooth`,block:`center`}),await new Promise(e=>setTimeout(e,300))),await x(n,i,e)),t(e+1,r.length),await new Promise(e=>setTimeout(e,600))}}async function C(){b((await s()).fontFamily||`outfit`);let e=n();e.forEach((e,t)=>{u(e,async n=>{await x(e,n,t)})}),e.length>0&&await m(S)}v(),typeof chrome<`u`&&chrome.storage?.onChanged&&chrome.storage.onChanged.addListener(e=>{e.fontFamily&&b(e.fontFamily.newValue)}),C();var w=new MutationObserver(()=>{C()});document.body?w.observe(document.body,{childList:!0,subtree:!0}):document.addEventListener(`DOMContentLoaded`,()=>{w.observe(document.body,{childList:!0,subtree:!0})})})();