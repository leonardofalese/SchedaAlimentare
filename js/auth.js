// ── AUTH ──────────────────────────────────────────────────
function showAllHidden() {
  document.getElementById('loadingScreen').classList.add('hidden');
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('visible');
  document.getElementById('welcomeScreen').classList.add('hidden');
  document.getElementById('resetScreen').classList.add('hidden');
  document.getElementById('greetingModal').classList.add('hidden');
}
function showAuth() {
  showAllHidden();
  document.getElementById('authScreen').classList.remove('hidden');
}
function showApp() {
  showAllHidden();
  document.getElementById('mainApp').classList.add('visible');
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t,i)=>t.classList.toggle('active', (i===0&&tab==='login')||(i===1&&tab==='register')));
  document.getElementById('loginForm').style.display = tab==='login'?'block':'none';
  document.getElementById('forgotForm').style.display = 'none';
  document.getElementById('registerForm').style.display = tab==='register'?'block':'none';
  document.getElementById('authError').classList.remove('show');
}

function showForgotForm(show) {
  document.getElementById('loginForm').style.display = show ? 'none' : 'block';
  document.getElementById('forgotForm').style.display = show ? 'block' : 'none';
  document.getElementById('authError').classList.remove('show');
}

function showAuthError(msg, isSuccess) {
  const el = document.getElementById('authError');
  el.textContent = msg;
  el.style.color = isSuccess ? 'var(--green)' : '#ff5555';
  el.style.borderColor = isSuccess ? 'rgba(184,245,102,.3)' : 'rgba(255,85,85,.3)';
  el.style.background = isSuccess ? 'rgba(184,245,102,.1)' : 'rgba(255,85,85,.1)';
  el.classList.add('show');
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email||!password) return showAuthError('Inserisci email e password');
  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = 'Accesso…';
  const {error} = await sb.auth.signInWithPassword({email, password});
  btn.disabled = false; btn.textContent = 'Accedi';
  if (error) showAuthError('Email o password errati');
}

async function doRegister() {
  const nickname = document.getElementById('regNickname').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  if (!nickname) return showAuthError('Inserisci un nickname');
  if (!email) return showAuthError('Inserisci la tua email');
  if (password.length < 6) return showAuthError('La password deve essere di almeno 6 caratteri');
  const nicknameClean = nickname.charAt(0).toUpperCase() + nickname.slice(1).toLowerCase();
  const btn = document.getElementById('registerBtn');
  btn.disabled = true; btn.textContent = 'Creazione…';
  isRegistering = true;
  const {data, error} = await sb.auth.signUp({
    email, password,
    options: { data: { nickname: nicknameClean } }
  });
  btn.disabled = false; btn.textContent = 'Crea account';
  if (error) { isRegistering = false; return showAuthError(error.message); }
  if (data.user && data.session) {
    // Login automatico avvenuto (email confirm disabilitata)
    // isRegistering verrà usato da onAuthStateChange
  } else if (data.user) {
    isRegistering = false;
    showAuthError('✓ Account creato! Controlla la tua email per confermare, poi accedi.', true);
  }
}

async function doLogout() {
  if (syncTimeout) clearTimeout(syncTimeout);
  if (timerInt) { clearInterval(timerInt); timerInt = null; }
  await sb.auth.signOut();
  currentUser = null;
  state = {
    meals: {},
    shop: {},
    mealData: JSON.parse(JSON.stringify(DEFAULT_MEALS)),
    shopData: JSON.parse(JSON.stringify(DEFAULT_SHOP))
  };
  currentDay = today;
  settingsDay = 0;
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  showAuth();
}