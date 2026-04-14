// ── SUPABASE ──────────────────────────────────────────────
const SUPABASE_URL = 'https://havaijnlwuejpcokwdxn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdmFpam5sd3VlanBjb2t3ZHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTkxNTcsImV4cCI6MjA5MTczNTE1N30.n3xEILDp1s65WNIzYI9VAPVTXfz3nx0IOLS6JKZHlnA';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let syncTimeout = null;
let isRegistering = false; // flag per distinguere registrazione da login

// ── DATI DEFAULT ──────────────────────────────────────────
const GIORNI=['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
const GIORNI_SHORT=['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
const MEAL_KEYS=['colazione','pranzo','spuntini','cena'];
const MEAL_LABELS={colazione:'Colazione',pranzo:'Pranzo',spuntini:'Spuntini',cena:'Cena'};
const ICO={
  colazione:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>`,
  pranzo:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
  spuntini:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  cena:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
};
const DEFAULT_MEALS={
  times:{colazione:'07:30',pranzo:'13:00',spuntini:'16:30',cena:'20:00'},
  days:{
    0:{colazione:['150g latte intero','100g avena','15g cacao','1 frutto'],pranzo:['140g pasta con pomodoro','30g grana','2 scatolette tonno','200g zucchine'],cena:['180g salmone','100g pane','200g zucchine'],spuntini:['70g pane in cassetta','90g bresaola']},
    1:{colazione:['100g latte intero','90g avena','15g cacao','150g greco'],pranzo:['250g macinato manzo magro','120g riso basmati','250g zucchine','15g burro'],cena:['140g pasta integrale','250g petto di pollo','200g carote','20g grana','10g olio'],spuntini:['1 pacchetto Galbusera protein']},
    2:{colazione:['150g greco','70g biscotti secchi','1 frutto'],pranzo:['140g pasta integrale','1 busta salmone affumicato','200g zucchine','10g olio'],cena:['200g bistecca vitello','130g pane','200g verdure a scelta','10g olio'],spuntini:['3 fette pane in cassetta','40g miele','20g frutta secca']},
    3:{colazione:['150g latte intero','70g avena','150g greco','1 frutto'],pranzo:['200g petto di pollo','350g patate','15g olio'],cena:['140g pasta integrale al pomodoro','2 scatolette tonno no olio','200g zucchine','10g olio'],spuntini:['30g cioccolato fondente']},
    4:{colazione:['250g latte intero',"80g cereali Kellogg's fondente"],pranzo:['110g riso basmati','220g macinato magro','250g zucchine','10g olio'],cena:['3 uova','300g patate','150g carote'],spuntini:['150g banana','20g cioccolato']},
    5:{colazione:['150g latte intero','80g avena','20g cioccolato fondente'],pranzo:['140g pasta con pomodoro','20g grana','2 scatolette tonno','200g zucchine'],cena:['180g salmone','100g pane','200g zucchine'],spuntini:['70g pane in cassetta','90g bresaola']},
    6:{colazione:['Giorno libero'],pranzo:['Libero'],cena:['Libero'],spuntini:['Libero']}
  }
};
const DEFAULT_SHOP=[
  {cat:'Proteine',items:[{name:'Tonno in scatoletta',qty:'8 scatolette'},{name:'Salmone fresco',qty:'360g'},{name:'Salmone affumicato',qty:'1 busta'},{name:'Petto di pollo',qty:'450g'},{name:'Macinato manzo magro',qty:'470g'},{name:'Bistecca di vitello',qty:'200g'},{name:'Bresaola',qty:'180g'},{name:'Uova',qty:'3 pz'},{name:'Galbusera protein',qty:'1 pacco'}]},
  {cat:'Carboidrati & Cereali',items:[{name:'Pasta normale',qty:'280g'},{name:'Pasta integrale',qty:'420g'},{name:'Riso basmati',qty:'230g'},{name:'Avena',qty:'460g'},{name:'Pane',qty:'400g'},{name:'Pane in cassetta',qty:'210g'},{name:'Biscotti secchi',qty:'70g'},{name:'Patate',qty:'650g'},{name:"Cereali Kellogg's",qty:'80g'}]},
  {cat:'Latticini',items:[{name:'Latte intero',qty:'1,2 L'},{name:'Yogurt greco',qty:'450g'},{name:'Grana Padano',qty:'90g'},{name:'Burro',qty:'15g'}]},
  {cat:'Verdure & Frutta',items:[{name:'Zucchine',qty:'2 kg'},{name:'Carote',qty:'350g'},{name:'Verdure miste',qty:'200g'},{name:'Frutta fresca',qty:'4-5 pz'},{name:'Banana',qty:'1 pz'}]},
  {cat:'Condimenti',items:[{name:'Olio EVO',qty:'80g'},{name:'Passata di pomodoro',qty:'q.b.'},{name:'Miele',qty:'40g'},{name:'Frutta secca',qty:'20g'},{name:'Cacao amaro',qty:'30g'},{name:'Cioccolato fondente',qty:'70g'}]}
];