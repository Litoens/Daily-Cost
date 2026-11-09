import { supabase } from './supabaseClient.js';
import { catIcon, CATEGORIES } from './icons.js';
import { t, getLang, applyTranslations, onLangChange } from './i18n.js';

// DOM Elements
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const authForm = document.getElementById('auth-form');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authMessage = document.getElementById('auth-message');
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const logoutBtn = document.getElementById('logout-btn');
const userEmailDisplay = document.getElementById('user-email-display');

const costForm = document.getElementById('cost-form');
const costDateInput = document.getElementById('cost-date');
const costAmountInput = document.getElementById('cost-amount');
const costCategoryPicker = document.getElementById('cost-category');
const costNotesInput = document.getElementById('cost-notes');
const costMessage = document.getElementById('cost-message');

const costList = document.getElementById('cost-list');
const statTotal = document.getElementById('stat-total');
const statMonth = document.getElementById('stat-month');
const searchFilter = document.getElementById('search-filter');
const categoryFilter = document.getElementById('category-filter');

let isSignUpMode = false;
let currentUser = null;
let costsCache = [];
// Set before anything else so the recovery session is never mistaken for a login.
let recoveryMode = /type=recovery/.test(window.location.hash + window.location.search);

// Set default date to today in cost form
costDateInput.valueAsDate = new Date();

// Tint the add-expense card with the chosen category's colour.
const costCard = costForm.closest('.card');

// Category picker: one radio chip per category (native radios give keyboard and `required` for free).
function renderCategoryPicker() {
  const selected = costForm.elements.category?.value || '';
  costCategoryPicker.innerHTML = CATEGORIES.map((c, i) => `
    <label class="cat-opt" data-cat="${c.value}" style="--cat:${c.color}">
      <input type="radio" name="category" value="${c.value}"${c.value === selected ? ' checked' : ''}${i === 0 ? ' required' : ''}>
      <span class="cat-opt-body">${catIcon(c.value)}<span>${t('cat.' + c.value)}</span></span>
    </label>`).join('');
}
renderCategoryPicker();
costCategoryPicker.addEventListener('change', () => { costCard.dataset.cat = costForm.elements.category.value; });

// Auth DOM Elements
const authTitle = document.getElementById('auth-title');
const authDesc = document.getElementById('auth-desc');

// Auth Tab Switching
tabLogin.addEventListener('click', () => {
  isSignUpMode = false;
  tabLogin.classList.add('active');
  tabSignup.classList.remove('active');
  authTitle.dataset.i18n = 'auth.welcome';
  authDesc.dataset.i18n = 'auth.welcomeDesc';
  authSubmitBtn.dataset.i18n = 'auth.signIn';
  applyTranslations();
  authMessage.classList.add('hidden');
});

tabSignup.addEventListener('click', () => {
  isSignUpMode = true;
  tabSignup.classList.add('active');
  tabLogin.classList.remove('active');
  authTitle.dataset.i18n = 'auth.create';
  authDesc.dataset.i18n = 'auth.createDesc';
  authSubmitBtn.dataset.i18n = 'auth.signUp';
  applyTranslations();
  authMessage.classList.add('hidden');
});

// Password Reset DOM Elements
const authCardMain = document.getElementById('auth-card-main');
const forgotCard = document.getElementById('forgot-card');
const resetPasswordCard = document.getElementById('reset-password-card');

const forgotLink = document.getElementById('forgot-link');
const backToLoginLink = document.getElementById('back-to-login-link');
const forgotForm = document.getElementById('forgot-form');
const forgotMessage = document.getElementById('forgot-message');

const resetPasswordForm = document.getElementById('reset-password-form');
const resetPasswordMessage = document.getElementById('reset-password-message');

// Forgot Password Link Click
forgotLink.addEventListener('click', (e) => {
  e.preventDefault();
  authCardMain.classList.add('hidden');
  forgotCard.classList.remove('hidden');
  resetPasswordCard.classList.add('hidden');
  forgotMessage.classList.add('hidden');
  const loginEmail = document.getElementById('email').value.trim();
  if (loginEmail) {
    document.getElementById('forgot-email').value = loginEmail;
  }
});

// Back to Login Link Click
backToLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  forgotCard.classList.add('hidden');
  authCardMain.classList.remove('hidden');
  resetPasswordCard.classList.add('hidden');
  authMessage.classList.add('hidden');
});

// Forgot Password Form Submit
forgotForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();
  forgotMessage.textContent = '';
  forgotMessage.classList.add('hidden');

  if (!isValidEmail(email)) {
    showForgotMessage(t('auth.invalidEmail'), 'error');
    return;
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname
  });

  if (error) {
    showForgotMessage(error.message, 'error');
  } else {
    showForgotMessage(t('forgot.sent'), 'success');
  }
});

function showForgotMessage(text, type) {
  forgotMessage.textContent = text;
  forgotMessage.className = `message ${type}`;
}

// Reset Password Form Submit
resetPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  resetPasswordMessage.textContent = '';
  resetPasswordMessage.classList.add('hidden');

  if (!isValidPassword(newPassword)) {
    showResetPasswordMessage(t('auth.invalidPassword'), 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showResetPasswordMessage(t('setpw.mismatch'), 'error');
    return;
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    showResetPasswordMessage(error.message, 'error');
  } else {
    showResetPasswordMessage(t('setpw.done'), 'success');
    recoveryMode = false;
    await supabase.auth.signOut(); // force a fresh sign-in with the new password
    setTimeout(() => {
      window.history.replaceState({}, document.title, window.location.pathname);
      resetPasswordCard.classList.add('hidden');
      authCardMain.classList.remove('hidden');
      authView.classList.remove('hidden');
      showAuthMessage(t('auth.updatedSignIn'), 'success');
    }, 1500);
  }
});

function showResetPasswordMessage(text, type) {
  resetPasswordMessage.textContent = text;
  resetPasswordMessage.className = `message ${type}`;
}

// Check Initial Session
async function initSession() {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const errorCode = hashParams.get('error_code');
  const errorDesc = hashParams.get('error_description');
  const errorParam = hashParams.get('error');

  if (errorCode || errorParam) {
    authCardMain.classList.remove('hidden');
    forgotCard.classList.add('hidden');
    resetPasswordCard.classList.add('hidden');
    const decodedDesc = errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, ' ')) : t('auth.linkExpired');
    showAuthMessage(t('auth.linkError', { desc: decodedDesc }), 'error');
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const tokenHash = params.get('token_hash');
  const type = params.get('type');

  if (tokenHash && type === 'recovery') {
    recoveryMode = true;
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery'
    });
    if (!error) {
      showResetCard();
      return;
    }
    recoveryMode = false;
  }

  if (recoveryMode) showResetCard();

  const { data: { session } } = await supabase.auth.getSession();
  handleSession(session);
}

function showResetCard() {
  recoveryMode = true;
  authView.classList.remove('hidden');
  dashboardView.classList.add('hidden');
  authCardMain.classList.add('hidden');
  forgotCard.classList.add('hidden');
  resetPasswordCard.classList.remove('hidden');
}

// Registered synchronously at load: the client consumes the recovery link and fires
// PASSWORD_RECOVERY before initSession's awaits finish, so a late listener misses it.
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    showResetCard();
  } else {
    handleSession(session);
  }
});

function handleSession(session) {
  // The recovery link creates a real session; don't treat it as a login until the password is reset.
  if (recoveryMode) return;

  currentUser = session?.user || null;
  if (currentUser) {
    authView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    userEmailDisplay.textContent = currentUser.email;
    userEmailDisplay.title = currentUser.email;
    document.getElementById('profile-initial').textContent = currentUser.email[0].toUpperCase();
    fetchCosts();
  } else {
    showExpenses();
    dashboardView.classList.add('hidden');
    authView.classList.remove('hidden');
    authCardMain.classList.remove('hidden');
    forgotCard.classList.add('hidden');
    resetPasswordCard.classList.add('hidden');
    costsCache = [];
  }
}

// Validation Helpers
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPassword(password) {
  // 4 to 16 characters, must contain at least one letter and one number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,16}$/;
  return passwordRegex.test(password);
}

// Auth Form Submit
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  authMessage.textContent = '';
  authMessage.classList.add('hidden');

  // Validate Email
  if (!isValidEmail(email)) {
    showAuthMessage(t('auth.invalidEmail'), 'error');
    return;
  }

  // Validate Password
  if (!isValidPassword(password)) {
    showAuthMessage(t('auth.invalidPassword'), 'error');
    return;
  }

  if (isSignUpMode) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      showAuthMessage(error.message, 'error');
    } else {
      showAuthMessage(t('auth.created'), 'success');
    }
  } else {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      showAuthMessage(error.message, 'error');
    }
  }
});

function showAuthMessage(text, type) {
  authMessage.textContent = text;
  authMessage.className = `message ${type}`;
}

// Logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// Profile menu
const profileBtn = document.getElementById('profile-btn');
const profileMenu = document.getElementById('profile-menu');
const expensesView = document.getElementById('expenses-view');
const accountView = document.getElementById('account-view');
const statsGrid = document.getElementById('stats-grid');
const changePasswordForm = document.getElementById('change-password-form');
const changePasswordMessage = document.getElementById('change-password-message');

function toggleMenu(open) {
  profileMenu.classList.toggle('hidden', !open);
  profileBtn.setAttribute('aria-expanded', String(open));
}

profileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleMenu(profileMenu.classList.contains('hidden'));
});
document.addEventListener('click', () => toggleMenu(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { toggleMenu(false); profileBtn.focus(); }
});

const passwordView = document.getElementById('password-view');

// Show exactly one of the three dashboard pages.
function showPage(page) {
  toggleMenu(false);
  expensesView.classList.toggle('hidden', page !== 'expenses');
  statsGrid.classList.toggle('hidden', page !== 'expenses');
  accountView.classList.toggle('hidden', page !== 'account');
  passwordView.classList.toggle('hidden', page !== 'password');
}

function showExpenses() { showPage('expenses'); }

function showAccount() {
  const fmt = (d) => d ? new Date(d).toLocaleString(getLang()) : '-';
  document.getElementById('account-email').textContent = currentUser.email;
  document.getElementById('account-created').textContent = fmt(currentUser.created_at);
  document.getElementById('account-last-signin').textContent = fmt(currentUser.last_sign_in_at);
  showPage('account');
}

function showPassword() {
  changePasswordForm.reset();
  changePasswordMessage.classList.add('hidden');
  showPage('password');
  document.getElementById('current-password').focus();
}

document.getElementById('menu-account').addEventListener('click', showAccount);
document.getElementById('menu-reset').addEventListener('click', showPassword);
document.getElementById('account-back').addEventListener('click', showExpenses);
document.getElementById('password-back').addEventListener('click', showExpenses);

function showChangePasswordMessage(text, type) {
  changePasswordMessage.textContent = text;
  changePasswordMessage.className = `message ${type}`;
}

// Change password: re-verify the current password, then update and sign out other devices.
changePasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const current = document.getElementById('current-password').value;
  const next = document.getElementById('account-new-password').value;
  const confirm = document.getElementById('account-confirm-password').value;

  if (!isValidPassword(next)) {
    showChangePasswordMessage(t('pw.invalidNew'), 'error');
    return;
  }
  if (next !== confirm) {
    showChangePasswordMessage(t('pw.mismatch'), 'error');
    return;
  }
  if (next === current) {
    showChangePasswordMessage(t('pw.same'), 'error');
    return;
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({ email: currentUser.email, password: current });
  if (verifyError) {
    showChangePasswordMessage(t('pw.wrongCurrent'), 'error');
    return;
  }

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    showChangePasswordMessage(error.message, 'error');
    return;
  }
  await supabase.auth.signOut({ scope: 'others' });
  changePasswordForm.reset();
  showChangePasswordMessage(t('pw.updated'), 'success');
});

// Forgot the current password: reuse the email reset flow.
document.getElementById('send-reset-link').addEventListener('click', async () => {
  const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email, {
    redirectTo: window.location.origin + window.location.pathname
  });
  showChangePasswordMessage(error ? error.message : t('pw.linkSent', { email: currentUser.email }), error ? 'error' : 'success');
});

// Fetch Costs
async function fetchCosts() {
  if (!currentUser) return;

  const { data, error } = await supabase
    .from('costs')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching costs:', error);
    costList.innerHTML = `<li class="empty-state">${t('history.failed')}</li>`;
    return;
  }

  costsCache = data || [];
  renderCosts();
}

// Add Cost
costForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const amount = parseFloat(costAmountInput.value);
  const category = costForm.elements.category.value;
  const date = costDateInput.value;
  const notes = costNotesInput.value.trim();

  const { error } = await supabase.from('costs').insert([
    {
      user_id: currentUser.id,
      amount,
      category,
      date,
      notes
    }
  ]);

  if (error) {
    showCostMessage(error.message, 'error');
  } else {
    showCostMessage(t('form.added'), 'success');
    costForm.reset();
    delete costCard.dataset.cat;
    costDateInput.valueAsDate = new Date();
    fetchCosts();
    setTimeout(() => costMessage.classList.add('hidden'), 3000);
  }
});

function showCostMessage(text, type) {
  costMessage.textContent = text;
  costMessage.className = `message ${type}`;
}

// Delete Cost
window.deleteCost = async function(id) {
  if (!confirm(t('history.confirmDelete'))) return;

  const { error } = await supabase.from('costs').delete().eq('id', id);
  if (error) {
    alert(t('history.deleteFailed', { msg: error.message }));
  } else {
    fetchCosts();
  }
};

// Render & Filter Costs
function renderCosts() {
  const searchTerm = searchFilter.value.toLowerCase();
  const selectedCategory = categoryFilter.value;

  const filtered = costsCache.filter(item => {
    const matchesSearch = item.category.toLowerCase().includes(searchTerm) ||
                          (item.notes && item.notes.toLowerCase().includes(searchTerm)) ||
                          item.date.includes(searchTerm);
    const matchesCategory = selectedCategory === '' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  let totalAll = 0;
  let totalMonth = 0;
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  costsCache.forEach(item => {
    const amt = Number(item.amount);
    totalAll += amt;
    if (item.date && item.date.startsWith(currentYearMonth)) {
      totalMonth += amt;
    }
  });

  statTotal.textContent = `$${totalAll.toFixed(2)}`;
  statMonth.textContent = `$${totalMonth.toFixed(2)}`;

  renderChart();

  // Render list
  if (filtered.length === 0) {
    costList.innerHTML = `<li class="empty-state">${t('history.none')}</li>`;
    return;
  }

  costList.innerHTML = filtered.map(item => `
    <li class="cost-item" data-cat="${escapeHtml(item.category)}">
      <div class="cost-details">
        <div class="cost-cat">${catIcon(item.category)}${escapeHtml(t('cat.' + item.category))}</div>
        <div class="cost-date">${item.date}</div>
        ${item.notes ? `<div class="cost-notes">${escapeHtml(item.notes)}</div>` : ''}
      </div>
      <div class="cost-right">
        <span class="cost-amount">$${Number(item.amount).toFixed(2)}</span>
        <button class="btn btn-danger" onclick="deleteCost('${item.id}')">${t('history.delete')}</button>
      </div>
    </li>
  `).join('');
}

// Donut chart: all-time spend per category (same scope as the "Total" figure).

function renderChart() {
  const body = document.getElementById('chart-body');
  const sums = new Map(CATEGORIES.map(c => [c.value, 0]));
  let total = 0;
  costsCache.forEach(item => {
    const amt = Number(item.amount);
    const key = sums.has(item.category) ? item.category : 'Other';
    sums.set(key, sums.get(key) + amt);
    total += amt;
  });

  if (total <= 0) {
    body.innerHTML = `<p class="empty-state">${t('chart.empty')}</p>`;
    return;
  }

  const R = 15.9155; // circumference = 100, so dash lengths are percentages
  let offset = 25;   // start at 12 o'clock
  const rows = CATEGORIES.filter(c => sums.get(c.value) > 0);
  const arcs = rows.map(c => {
    const pct = (sums.get(c.value) / total) * 100;
    const arc = `<circle cx="21" cy="21" r="${R}" fill="none" stroke="${c.color}" stroke-width="6" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${offset}"/>`;
    offset -= pct;
    return arc;
  }).join('');

  const legend = rows
    .sort((a, b) => sums.get(b.value) - sums.get(a.value))
    .map(c => {
      const amt = sums.get(c.value);
      return `<li data-cat="${c.value}" style="--cat:${c.color}"><span class="legend-name">${catIcon(c.value)}${t('cat.' + c.value)}</span>` +
        `<span class="legend-pct">${Math.round((amt / total) * 100)}%</span>` +
        `<span class="legend-amt">$${amt.toFixed(2)}</span></li>`;
    }).join('');

  body.innerHTML = `
    <div class="donut">
      <svg viewBox="0 0 42 42" role="img" aria-label="${t('chart.aria')}">${arcs}</svg>
      <div class="donut-center"><span>${t('chart.total')}</span><strong>$${total.toFixed(2)}</strong></div>
    </div>
    <ul class="legend">${legend}</ul>`;
}

searchFilter.addEventListener('input', renderCosts);
categoryFilter.addEventListener('change', renderCosts);

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Re-render JS-built content when the language changes
onLangChange(() => {
  renderCategoryPicker();
  if (currentUser) {
    renderCosts();
    if (!accountView.classList.contains('hidden')) showAccount();
  }
});

// Initialize on load
applyTranslations();
initSession();
