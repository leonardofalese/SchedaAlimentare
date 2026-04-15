// Calcola kcal giorno (solo pasti completati se onlyDone=true)
function calcDayKcal(dayIndex, onlyDone) {
  let total = 0;
  MEAL_KEYS.forEach(k => {
    if (onlyDone && !isDone(dayIndex, k)) return;
    const foods = state.mealData.days[dayIndex]?.[k] || [];
    foods.forEach(f => { total += calcKcalFromFood(f); });
  });
  return total;
}
function calcTotalDayKcal(dayIndex) {
  return calcDayKcal(dayIndex, false);
}

// ── RENDER FUNCTIONS (identiche a prima) ─────────────────
const mealKey = (d,k) => `d${d}_${k}`;
const isDone = (d,k) => !!state.meals[mealKey(d,k)];
function parseFood(f) {
  const m = f.match(/^(\d+\s*(?:g|ml|kg|L|pz|pacco|busta|scatolette|fette|frutto)?\s+)/i);
  if (m&&m[0].trim()) return {qty:m[0].trim(), name:f.slice(m[0].length).trim()||f};
  return {qty:'', name:f};
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg||'Salvato!';
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2000);
}

function renderDayNav() {
  document.getElementById('dayNav').innerHTML = GIORNI_SHORT.map((g,i) => {
    const hasAny = MEAL_KEYS.some(k=>isDone(i,k));
    return `<button class="day-btn ${i===currentDay?'active':''} ${hasAny&&i!==currentDay?'has-activity':''}" onclick="selectDay(${i})">${g}</button>`;
  }).join('');
}
function selectDay(i) { currentDay=i; renderDayNav(); renderMeals(); updateProgress(); document.getElementById('mainContent').scrollTop=0; }

function renderMeals() {
  const times = state.mealData.times;
  document.getElementById('mealsContainer').innerHTML = MEAL_KEYS.map(k => {
    const done = isDone(currentDay,k);
    const foods = state.mealData.days[currentDay]?.[k]||[];
    const kcalMeal = foods.reduce((s,f)=>s+calcKcalFromFood(f),0);
    return `<div class="meal-card ${done?'done':''}" id="meal-card-${k}">
      <div class="meal-header" onclick="toggleMeal(${currentDay},'${k}')">
        <div class="meal-icon-wrap" style="color:${done?'var(--green)':'var(--text-mid)'}">${ICO[k]}</div>
        <div class="meal-info"><div class="meal-name">${MEAL_LABELS[k]}<span style="font-size:11px;font-weight:400;color:var(--text-mid);margin-left:8px;font-family:var(--mono)">${kcalMeal>0?' · '+kcalMeal+' kcal':''}</span></div><div class="meal-time">${times[k]}</div></div>
        <div style="display:flex;align-items:center;gap:8px">
          <button onclick="event.stopPropagation();toggleMealEdit('${k}')" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--text-soft);display:flex;align-items:center" title="Modifica quantità">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <div class="meal-check ${done?'checked':''}">${done?'<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#0a0a0a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}</div>
        </div>
      </div>
      <div class="meal-foods" id="meal-foods-${k}">${foods.map((f,fi)=>{const p=parseFood(f);return`<div class="food-row"><span class="food-qty">${p.qty}</span><span class="food-name">${p.name}</span></div>`;}).join('')}</div>
      <div class="meal-edit-panel" id="meal-edit-${k}" style="display:none;padding:0 16px 14px 16px;border-top:1px solid var(--border)">
        <div id="meal-edit-inputs-${k}" style="margin-top:10px">
          ${foods.map((f,fi)=>`<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
            <input class="food-edit-input" type="text" value="${f.replace(/"/g,'&quot;')}" id="inline-food-${k}-${fi}" style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:6px 8px;font-family:var(--font);font-size:12px;color:var(--text);outline:none" oninput="updateInlineKcal('${k}')">
          </div>`).join('')}
        </div>
        <button onclick="saveInlineMeal('${k}')" style="background:var(--green);color:#0a0a0a;border:none;border-radius:20px;padding:6px 16px;font-family:var(--font);font-size:12px;font-weight:700;cursor:pointer;margin-top:4px">Salva</button>
        <button onclick="toggleMealEdit('${k}')" style="background:none;border:1px solid var(--border2);border-radius:20px;padding:6px 12px;font-family:var(--font);font-size:12px;color:var(--text-mid);cursor:pointer;margin-top:4px;margin-left:6px">Annulla</button>
        <div id="inline-kcal-${k}" style="font-size:11px;color:var(--green);font-family:var(--mono);margin-top:6px"></div>
      </div>
    </div>`;
  }).join('');
}
function toggleMeal(d,k) { state.meals[mealKey(d,k)]=!isDone(d,k); save(); renderMeals(); updateProgress(); renderDayNav(); }
function toggleMealEdit(k) {
  const panel = document.getElementById('meal-edit-' + k);
  const isOpen = panel.style.display !== 'none';
  // Close all other panels first
  MEAL_KEYS.forEach(mk => {
    const p = document.getElementById('meal-edit-' + mk);
    if (p) p.style.display = 'none';
  });
  if (!isOpen) {
    panel.style.display = 'block';
    updateInlineKcal(k);
  }
}

function updateInlineKcal(k) {
  const inputs = document.querySelectorAll(`[id^="inline-food-${k}-"]`);
  const total = Array.from(inputs).reduce((s, inp) => s + calcKcalFromFood(inp.value), 0);
  const el = document.getElementById('inline-kcal-' + k);
  if (el) el.textContent = total > 0 ? total + ' kcal' : '';
}

function saveInlineMeal(k) {
  const inputs = document.querySelectorAll(`[id^="inline-food-${k}-"]`);
  const newFoods = Array.from(inputs).map(i => i.value.trim()).filter(Boolean);
  if (!state.mealData.days[currentDay]) state.mealData.days[currentDay] = {};
  state.mealData.days[currentDay][k] = newFoods;
  const generated = generateShopFromMeals(state.mealData);
  if (generated.length > 0) state.shopData = generated;
  save();
  renderMeals();
  updateProgress();
  showToast('Salvato · lista spesa aggiornata');
}

function updateProgress() {
  const done = MEAL_KEYS.filter(k=>isDone(currentDay,k)).length;
  const kcalDone = calcDayKcal(currentDay, true);
  const kcalTotal = calcTotalDayKcal(currentDay);

  // Ring: % calorie consumate, label mostra "consumate/totale"
  const pct = kcalTotal > 0 ? Math.min(kcalDone / kcalTotal, 1) : (done / 4);
  document.getElementById('ringFill').style.strokeDashoffset = 188.5 - (188.5 * pct);
  document.getElementById('ringLabel').textContent = kcalTotal > 0 ? kcalDone + '' : done + '/4';

  // Titolo progressivo
  const titles = ['Inizia la giornata', 'Ottimo inizio!', 'Metà strada', 'Quasi fatto!', 'Completata! ⚡'];
  document.getElementById('progressTitle').textContent = titles[done] || 'Completata! ⚡';
  // Mostra target kcal giornaliero nel sottotitolo
  const kcalEl2 = document.getElementById('kcalDisplay');
  if (kcalEl2) {
    kcalEl2.style.display = '';
    kcalEl2.textContent = kcalTotal > 0 ? kcalDone + ' / ' + kcalTotal + ' kcal' : '';
  }



  // Dot: solo nome, niente numeri
  document.getElementById('mealDots').innerHTML = MEAL_KEYS.map(k => {
    const d = isDone(currentDay, k);
    return `<div class="meal-dot-wrap"><div class="meal-dot ${d ? 'done' : ''}"></div><div class="meal-dot-label">${k.slice(0,3).toUpperCase()}</div></div>`;
  }).join('');
}

function renderTracker() {
  document.getElementById('trackerContent').innerHTML = GIORNI.map((g,di) => {
    const cnt = MEAL_KEYS.filter(k=>isDone(di,k)).length;
    const dots = MEAL_KEYS.map(k=>`<div class="score-dot ${isDone(di,k)?'done':''}"></div>`).join('');
    const rows = MEAL_KEYS.map(k=>{const d=isDone(di,k);return`<div class="tracker-meal-row"><div class="tracker-cb ${d?'checked':''}" onclick="event.stopPropagation();toggleMeal(${di},'${k}');renderTracker()"></div><span class="tracker-meal-name ${d?'done':''}">${MEAL_LABELS[k]} · ${state.mealData.times[k]}</span></div>`;}).join('');
    const isT = di===today;
    return `<div class="tracker-day" style="${isT?'border-color:rgba(184,245,102,.3)':''}">
      <div class="tracker-day-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
        <span class="tracker-day-name">${g}${isT?' <span style="font-size:10px;color:var(--green);font-family:var(--mono)">· OGGI</span>':''}</span>
        <span style="display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:12px"><div class="score-bar">${dots}</div>${cnt}/4</span>
      </div>
      <div class="tracker-meals" style="display:${isT?'block':'none'}">${rows}</div>
    </div>`;
  }).join('');
}

const shopKey = (ci,i) => `s_${ci}_${i}`;
const isShopDone = (ci,i) => !!state.shop[shopKey(ci,i)];
function renderShop() {
  const tot = state.shopData.reduce((a,c)=>a+c.items.length,0);
  const done = state.shopData.reduce((a,c,ci)=>a+c.items.filter((_,i)=>isShopDone(ci,i)).length,0);
  const pct = tot?Math.round(done/tot*100):0;
  document.getElementById('shopPct').textContent = pct+'%';
  document.getElementById('shopProgFill').style.width = pct+'%';
  document.getElementById('shopContent').innerHTML = state.shopData.map((cat,ci)=>`
    <div class="shop-cat"><div class="shop-cat-title">${cat.cat}</div>
      ${cat.items.map((item,i)=>{const d=isShopDone(ci,i);return`<div class="shop-item ${d?'bought':''}" onclick="toggleShop(${ci},${i})"><div class="shop-cb2 ${d?'checked':''}"></div><span class="shop-name">${item.name}</span><span class="shop-qty">${item.qty}</span></div>`;}).join('')}
    </div>`).join('');
}
function toggleShop(ci,i) { state.shop[shopKey(ci,i)]=!state.shop[shopKey(ci,i)]; save(); renderShop(); }
function resetShop() { state.shop={}; save(); renderShop(); }
function checkAll() { state.shopData.forEach((c,ci)=>c.items.forEach((_,i)=>{state.shop[shopKey(ci,i)]=true;})); save(); renderShop(); }

function renderTimer() {
  const now=new Date(), times=state.mealData.times;
  const mt=MEAL_KEYS.map(k=>{const[h,m]=times[k].split(':').map(Number);const t=new Date();t.setHours(h,m,0,0);return{key:k,date:t};}).sort((a,b)=>a.date-b.date);
  const next=(mt.find(m=>m.date>now)||mt[0]);
  const foods=state.mealData.days[currentDay]?.[next.key]||[];
  document.getElementById('timerMealName').textContent=MEAL_LABELS[next.key];
  document.getElementById('timerMealFoods').textContent=foods.slice(0,2).join(' · ')+(foods.length>2?'…':'');
  if(timerInt)clearInterval(timerInt);
  const tick=()=>{
    const n=new Date();let diff=next.date-n;if(diff<0)diff+=86400000;
    const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
    const el=document.getElementById('timerDisplay');
    el.textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    el.classList.toggle('urgent',diff<600000);
  };
  tick(); timerInt=setInterval(tick,1000);
  document.getElementById('scheduleList').innerHTML=mt.map(m=>{
    const isN=m.key===next.key,isPast=m.date<now&&!isN;
    return`<div class="sched-row ${isN?'next':''} ${isPast?'past':''}">
      <div class="sched-left"><div style="color:${isN?'var(--green)':'var(--text-mid)'}">${ICO[m.key]}</div><div><div class="sched-name">${MEAL_LABELS[m.key]}</div><div class="sched-status">${isN?'⟵ prossimo':isPast?'passato':'in arrivo'}</div></div></div>
      <span class="sched-time">${times[m.key]}</span>
    </div>`;
  }).join('');
}
function markNextDone() {
  const now=new Date(),times=state.mealData.times;
  const mt=MEAL_KEYS.map(k=>{const[h,mn]=times[k].split(':').map(Number);const t=new Date();t.setHours(h,mn,0,0);return{key:k,date:t};}).sort((a,b)=>a.date-b.date);
  const next=mt.find(m=>m.date>now)||mt[0];
  toggleMeal(currentDay,next.key); renderTimer();
}

function renderSettingsDayTabs() {
  document.getElementById('settingsDayTabs').innerHTML=GIORNI_SHORT.map((g,i)=>`<button class="day-tab ${i===settingsDay?'active':''}" onclick="selectSettingsDay(${i})">${g}</button>`).join('');
}
function selectSettingsDay(i) { settingsDay=i; renderSettingsDayTabs(); renderMealEditor(); }
function renderMealEditor() {
  const times=state.mealData.times;
  const dayData=state.mealData.days[settingsDay]||{};
  document.getElementById('mealEditorContainer').innerHTML=MEAL_KEYS.map(k=>`
    <div class="settings-row">
      <div class="settings-row-header">
        <div class="settings-row-name">${MEAL_LABELS[k]}</div>
        <div class="settings-row-time"><label>Orario</label><input class="time-input" type="time" id="time_${k}" value="${times[k]}"></div>
      </div>
      <div class="food-edit-list" id="foods_${k}">
        ${(dayData[k]||[]).map((f,i)=>`<div class="food-edit-row"><input class="food-edit-input" type="text" value="${f.replace(/"/g,'&quot;')}" id="fi_${k}_${i}" placeholder="es. 150g latte intero"><button class="del-btn" onclick="delFood('${k}',${i})">×</button></div>`).join('')}
      </div>
      <button class="add-food-btn" onclick="addFood('${k}')">+ Aggiungi alimento</button>
    </div>`).join('');
}
function addFood(k) {
  if(!state.mealData.days[settingsDay][k])state.mealData.days[settingsDay][k]=[];
  state.mealData.days[settingsDay][k].push(''); save(); renderMealEditor();
  const inputs=document.querySelectorAll(`#foods_${k} .food-edit-input`);
  if(inputs.length)inputs[inputs.length-1].focus();
}
function delFood(k,idx) {
  state.mealData.days[settingsDay][k].splice(idx,1);
  const generated = generateShopFromMeals(state.mealData);
  if (generated.length > 0) state.shopData = generated;
  save(); renderMealEditor(); renderShopEditor();
}
function saveMeals() {
  MEAL_KEYS.forEach(k=>{
    const tEl=document.getElementById('time_'+k);
    if(tEl&&tEl.value)state.mealData.times[k]=tEl.value;
    const inputs=document.querySelectorAll(`#foods_${k} .food-edit-input`);
    state.mealData.days[settingsDay][k]=Array.from(inputs).map(i=>i.value.trim()).filter(Boolean);
  });
  const generated = generateShopFromMeals(state.mealData);
  if (generated.length > 0) { state.shopData = generated; renderShopEditor(); }
  save(); renderMeals(); updateProgress(); showToast('Pasti e lista spesa aggiornati!');
}

function renderShopEditor() {
  document.getElementById('shopEditorContainer').innerHTML=state.shopData.map((cat,ci)=>`
    <div style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div class="shop-cat-title" style="border:none;padding:0;margin:0">${cat.cat}</div>
        <button class="del-btn" onclick="delShopCat(${ci})" style="font-size:12px;width:auto;padding:0 8px;color:var(--text-soft)">Rimuovi cat.</button>
      </div>
      <div id="shopEditCat_${ci}">
        ${cat.items.map((item,i)=>`<div class="shop-edit-row"><input class="shop-edit-name" type="text" value="${item.name.replace(/"/g,'&quot;')}" id="sn_${ci}_${i}" placeholder="Ingrediente"><input class="shop-edit-qty" type="text" value="${item.qty.replace(/"/g,'&quot;')}" id="sq_${ci}_${i}" placeholder="qtà"><button class="del-btn" onclick="delShopItem(${ci},${i})">×</button></div>`).join('')}
      </div>
      <button class="add-food-btn" style="margin-top:6px" onclick="addShopItem(${ci})">+ Aggiungi</button>
    </div>`).join('');
}
function addShopItem(ci) { state.shopData[ci].items.push({name:'',qty:''}); save(); renderShopEditor(); const rows=document.querySelectorAll(`#shopEditCat_${ci} .shop-edit-name`); if(rows.length)rows[rows.length-1].focus(); }
function delShopItem(ci,i) { state.shopData[ci].items.splice(i,1); save(); renderShopEditor(); }
function delShopCat(ci) { if(confirm('Rimuovere la categoria?')){state.shopData.splice(ci,1);save();renderShopEditor();} }
function addShopCategory() { const name=prompt('Nome categoria:'); if(!name)return; state.shopData.push({cat:name,items:[]}); save(); renderShopEditor(); }
function saveShop() {
  state.shopData.forEach((cat,ci)=>{
    cat.items.forEach((item,i)=>{
      const n=document.getElementById(`sn_${ci}_${i}`),q=document.getElementById(`sq_${ci}_${i}`);
      if(n)item.name=n.value.trim(); if(q)item.qty=q.value.trim();
    });
    cat.items=cat.items.filter(item=>item.name);
  });
  save(); renderShop(); showToast('Lista salvata!');
}
