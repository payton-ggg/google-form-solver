import{r as e,t}from"./chunks/gemini.js";async function n(e){let t=e.src||e.getAttribute(`data-src`)||``;if(!t||t.startsWith(`chrome-extension://`))return null;if(t.startsWith(`data:image/`)){let n=t.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);if(n)return{src:t,alt:e.alt||``,mimeType:n[1],base64:n[2]}}try{let n=await(await fetch(t)).blob();return new Promise(r=>{let i=new FileReader;i.onloadend=()=>{let a=i.result.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);r(a?{src:t,alt:e.alt||``,mimeType:a[1]||n.type||`image/jpeg`,base64:a[2]}:null)},i.onerror=()=>r(null),i.readAsDataURL(n)})}catch{try{let n=document.createElement(`canvas`);n.width=e.naturalWidth||e.width||300,n.height=e.naturalHeight||e.height||200;let r=n.getContext(`2d`);if(r){r.drawImage(e,0,0);let i=n.toDataURL(`image/jpeg`,.85).match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);if(i)return{src:t,alt:e.alt||``,mimeType:i[1],base64:i[2]}}}catch{console.warn(`Could not extract image data:`,t)}return null}}async function r(e,t){if(!e)return null;let r=e.getAttribute(`data-item-id`)||`question-${t}-${Date.now()}`,i=e.querySelector(`.M7eMe`)||e.querySelector(`[role="heading"]`)||e.querySelector(`.HoLwm`)||e.querySelector(`.ahS2le`),a=i?(i.textContent||``).trim():``,o=e.querySelector(`.g6ldxf`)||e.querySelector(`.e4eG1b`);o&&o.textContent&&(a+=`\n(Описание: ${o.textContent.trim()})`);let s=Array.from(e.querySelectorAll(`img`)).filter(e=>!(e.width>0&&e.width<32&&e.height>0&&e.height<32||e.classList.contains(`ai-solver-icon`))),c=[];for(let e of s){let t=await n(e);t&&c.push(t)}let l=`unknown`,u=[],d,f=e.querySelector(`[role="radiogroup"]`)||e.querySelector(`.appsMaterialWizToggleRadiogroupEl`),p=e.querySelectorAll(`[role="radio"]`),m=e.querySelectorAll(`[role="checkbox"]`),h=e.querySelector(`input.whsOnd`)||e.querySelector(`input[type="text"]`),g=e.querySelector(`textarea.KHxj8b`)||e.querySelector(`textarea`),_=e.querySelector(`[role="listbox"]`);if(f||p.length>0&&m.length===0){l=`radio`;let t=e.querySelectorAll(`.docssharedWizToggleLabeledContainer, .nWQGrd, [role="radio"]`),n=new Set,r=0;t.forEach(e=>{let t=e.getAttribute(`role`)===`radio`?e:e.querySelector(`[role="radio"]`)||e;if(n.has(t))return;n.add(t);let i=t.getAttribute(`data-value`)||``;i||=((e.querySelector(`.aDTYNe, .ulDsOb, .bzfPab`)||e).textContent||``).trim(),u.push({index:r++,text:i||`Вариант ${r}`,element:t,inputElement:t})})}else if(m.length>0){l=`checkbox`;let t=e.querySelectorAll(`.docssharedWizToggleLabeledContainer, .Y6Holder, [role="checkbox"]`),n=new Set,r=0;t.forEach(e=>{let t=e.getAttribute(`role`)===`checkbox`?e:e.querySelector(`[role="checkbox"]`)||e;if(n.has(t))return;n.add(t);let i=t.getAttribute(`data-value`)||``;i||=((e.querySelector(`.aDTYNe, .ulDsOb, .bzfPab`)||e).textContent||``).trim(),u.push({index:r++,text:i||`Вариант ${r}`,element:t,inputElement:t})})}else g?(l=`paragraph`,d=g):h?(l=`text`,d=h):_&&(l=`dropdown`,_.querySelectorAll(`[role="option"]`).forEach((e,t)=>{u.push({index:t,text:(e.textContent||e.getAttribute(`data-value`)||`Опция ${t+1}`).trim(),element:e})}));return a||=`Вопрос #${t+1}`,{id:r,container:e,title:a,type:l,required:!!e.querySelector(`[aria-label*="обязательный"], [aria-label*="required"], .v3duvd`),options:u,textInput:d,images:c}}function i(){return Array.from(document.querySelectorAll(`.Qr7Oae`))}function a(e){e.scrollIntoView({behavior:`smooth`,block:`nearest`}),[`mouseover`,`mousedown`,`mouseup`,`click`].forEach(t=>{let n=new MouseEvent(t,{view:window,bubbles:!0,cancelable:!0,buttons:1});e.dispatchEvent(n)})}function o(e,t){e.focus();let n=e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,r=Object.getOwnPropertyDescriptor(n,`value`)?.set;r?r.call(e,t):e.value=t,e.dispatchEvent(new Event(`input`,{bubbles:!0})),e.dispatchEvent(new Event(`change`,{bubbles:!0})),e.dispatchEvent(new FocusEvent(`blur`,{bubbles:!0}))}async function s(e,t){try{if(e.type===`radio`){let n=null;if(t.selectedIndices&&t.selectedIndices.length>0){let r=t.selectedIndices[0];r>=0&&r<e.options.length&&(n=e.options[r])}if(!n&&t.selectedTexts&&t.selectedTexts.length>0){let r=t.selectedTexts[0].toLowerCase().trim();n=e.options.find(e=>e.text.toLowerCase().trim()===r)||null}if(n)return a(n.inputElement||n.element),!0}else if(e.type===`checkbox`){let n=0;if(t.selectedIndices&&t.selectedIndices.length>0){for(let r of t.selectedIndices)if(r>=0&&r<e.options.length){let t=e.options[r],i=t.inputElement||t.element;i.getAttribute(`aria-checked`)!==`true`&&a(i),n++}}if(n===0&&t.selectedTexts&&t.selectedTexts.length>0)for(let r of t.selectedTexts){let t=r.toLowerCase().trim(),i=e.options.find(e=>e.text.toLowerCase().trim()===t);if(i){let e=i.inputElement||i.element;e.getAttribute(`aria-checked`)!==`true`&&a(e),n++}}return n>0}else if(e.type===`text`||e.type===`paragraph`){let n=e.textInput||e.container.querySelector(`input, textarea`);if(n&&t.textAnswer)return o(n,t.textAnswer),!0}else if(e.type===`dropdown`&&t.selectedIndices&&t.selectedIndices.length>0){let n=t.selectedIndices[0];if(n>=0&&n<e.options.length){let t=e.options[n];return a(t.element),!0}}return!1}catch(e){return console.error(`Failed to apply solution to DOM:`,e),!1}}function c(e,t){if(e.querySelector(`.ai-solver-btn-wrapper`))return e.querySelector(`.ai-solver-solve-btn`);let n=document.createElement(`div`);n.className=`ai-solver-btn-wrapper`;let r=document.createElement(`button`);return r.type=`button`,r.className=`ai-solver-solve-btn`,r.innerHTML=`
    <svg class="ai-solver-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
    <span>✨ AI Решить</span>
  `,r.addEventListener(`click`,async e=>{e.preventDefault(),e.stopPropagation(),await t(r)}),n.appendChild(r),e.firstChild?e.insertBefore(n,e.firstChild):e.appendChild(n),r}function l(e,t,n=`⚡ Решаю...`){t?(e.classList.add(`loading`),e.disabled=!0,e.innerHTML=`
      <span class="ai-solver-spinner"></span>
      <span>${n}</span>
    `):(e.classList.remove(`loading`),e.disabled=!1,e.innerHTML=`
      <svg class="ai-solver-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      </svg>
      <span>✨ AI Решить</span>
    `)}function u(e,t,n){let r=e.querySelector(`.ai-solver-card, .ai-solver-error-card`);r&&r.remove();let i=document.createElement(`div`);i.className=`ai-solver-card`;let a=``;a=n.type===`radio`||n.type===`checkbox`||n.type===`dropdown`?t.selectedTexts&&t.selectedTexts.length>0?t.selectedTexts.join(`; `):t.selectedIndices&&t.selectedIndices.length>0?t.selectedIndices.map(e=>n.options[e]?.text||`Вариант ${e+1}`).join(`; `):`Ответ выбран`:t.textAnswer||`Введен ответ`,i.innerHTML=`
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
      <div class="ai-solver-selected-answer-value">${p(a)}</div>
    </div>

    <div class="ai-solver-explanation-body">
      ${p(t.explanation)}
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
  `,i.querySelector(`.ai-solver-card-close`)?.addEventListener(`click`,()=>{i.remove()});let o=i.querySelector(`.copy-btn`);o?.addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(t.explanation);let e=o.querySelector(`span`);e&&(e.textContent=`✓ Скопировано!`,setTimeout(()=>{e.textContent=`Скопировать объяснение`},2e3))}catch{}}),e.appendChild(i)}function d(e,t){let n=e.querySelector(`.ai-solver-card, .ai-solver-error-card`);n&&n.remove();let r=document.createElement(`div`);r.className=`ai-solver-error-card`,r.innerHTML=`
    <div style="display:flex; justify-content:space-between; align-items:center; font-weight:700;">
      <span style="display:flex; align-items:center; gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Ошибка решения
      </span>
      <button type="button" class="ai-solver-card-close" style="color:#ef4444;" title="Закрыть">✕</button>
    </div>
    <div>${p(t)}</div>
  `,r.querySelector(`.ai-solver-card-close`)?.addEventListener(`click`,()=>{r.remove()}),e.appendChild(r)}function f(e){if(document.getElementById(`ai-solver-floating-bar`))return;let t=document.createElement(`div`);t.id=`ai-solver-floating-bar`,t.className=`ai-solver-floating-bar`,t.innerHTML=`
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
  `,document.body.appendChild(t);let n=t.querySelector(`#ai-solver-solve-all`),r=t.querySelector(`#ai-solver-progress-wrap`),i=t.querySelector(`#ai-solver-progress-fill`);t.querySelector(`.ai-solver-floating-close`).addEventListener(`click`,()=>{t.remove()}),n.addEventListener(`click`,async()=>{n.disabled=!0,r.style.display=`block`,i.style.width=`0%`;let t=(e,t)=>{let r=t>0?e/t*100:0;i.style.width=`${r}%`;let a=n.querySelector(`.btn-text`);a&&(a.textContent=`Решаю (${e}/${t})...`)};try{await e(n,t);let r=n.querySelector(`.btn-text`);r&&(r.textContent=`✓ Форма решена!`,setTimeout(()=>{r.textContent=`✨ Решить всю форму`},3e3))}catch(e){console.error(e)}finally{n.disabled=!1,setTimeout(()=>{r.style.display=`none`},2e3)}})}function p(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}console.log(`🚀 [Google Forms AI Solver] Content script initialized.`);async function m(n,i,a){l(i,!0);try{let o=await e();if(!o.apiKey||o.apiKey.trim()===``){d(n,`⚠️ API ключ Gemini не установлен. Пожалуйста, откройте иконку расширения в правом верхнем углу браузера и введите ваш Gemini API Key.`),l(i,!1);return}let c=await r(n,a);if(!c){d(n,`Не удалось распознать структуру вопроса.`),l(i,!1);return}let f=await t(c,o);await s(c,f),u(n,f,c),o.autoScroll&&n.scrollIntoView({behavior:`smooth`,block:`center`})}catch(e){console.error(`Error during AI solve:`,e),d(n,e?.message||`Произошла непредвиденная ошибка при обращении к ИИ.`)}finally{l(i,!1)}}async function h(e,t){let n=i();if(n.length!==0)for(let e=0;e<n.length;e++){let r=n[e],i=r.querySelector(`.ai-solver-solve-btn`);i&&await m(r,i,e),t(e+1,n.length),await new Promise(e=>setTimeout(e,800))}}function g(){let e=i();e.forEach((e,t)=>{c(e,async n=>{await m(e,n,t)})}),e.length>0&&f(h)}g(),new MutationObserver(()=>{g()}).observe(document.body,{childList:!0,subtree:!0});