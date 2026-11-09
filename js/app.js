import { supabase } from './supabaseClient.js';
import { catIcon, uiIcon, CATEGORIES } from './icons.js';
import { t, getLang, applyTranslations, onLangChange } from './i18n.js';
import { localISO } from './dates.js';
import { formatMoney, toCents } from './money.js';
import { isValidEmail, isValidPassword, authErrorKey } from './validate.js';
import { escapeHtml, filterExpenses, groupByDay, computeStats, categoryBreakdown, periodItems, fetchAllPages, toCsv } from './expenses.js';

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
const historySummary = document.getElementById('history-summary');
const exportCsvBtn = document.getElementById('export-csv');
let filteredCosts = [];
const statToday = document.getElementById('stat-today');
const statTotal = document.getElementById('stat-total');
const statMonth = document.getElementById('stat-month');
const searchFilter = document.getElementById('search-filter');
const categoryFilter = document.getElementById('category-filter');

let isSignUpMode = false;
let currentUser = null;
let fetchSeq = 0;
let costsCache = [];
let chartPeriod = 'month'; // 'month' | 'all'
let editingId = null; // id of the expense loaded into the add form, or null when adding
// Set before anything else so the recovery session is never mistaken for a login.
let recoveryMode = /type=recovery/.test(window.location.hash + window.location.search);

// Date shortcuts: Today / Yesterday, highlighted while the date field matches.
const dateToday = document.getElementById('date-today');
const dateYesterday = document.getElementById('date-yesterday');
function syncDateShortcuts() {
  dateToday.setAttribute('aria-pressed', String(costDateInput.value === localISO(0)));
  dateYesterday.setAttribute('aria-pressed', String(costDateInput.value === localISO(1)));
}
function setCostDate(daysAgo) { costDateInput.value = localISO(daysAgo); syncDateShortcuts(); }
dateToday.addEventListener('click', () => setCostDate(0));
dateYesterday.addEventListener('click', () => setCostDate(1));
costDateInput.addEventListener('input', syncDateShortcuts);
setCostDate(0);

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

// Show/hide toggle on every password field.
function enhancePasswordFields() {
  document.querySelectorAll('input[type="password"]').forEach((input) => {
    const wrap = document.createElement('div');
    wrap.className = 'pw-field';
    input.replaceWith(wrap);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pw-toggle';
    btn.setAttribute('aria-pressed', 'false');
    wrap.append(input, btn);
    const paint = () => {
      const shown = input.type === 'text';
      btn.innerHTML = uiIcon(shown ? 'eyeOff' : 'eye');
      btn.setAttribute('aria-label', t(shown ? 'pw.hide' : 'pw.show'));
      btn.setAttribute('aria-pressed', String(shown));
    };
    btn.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      paint();
    });
    btn.paint = paint;
    paint();
  });
}
enhancePasswordFields();

// Auth DOM Elements
const authTitle = document.getElementById('auth-title');
const authDesc = document.getElementById('auth-desc');

// Auth Tab Switching
const passwordInput = document.getElementById('password');
const forgotLinkContainer = document.getElementById('forgot-link-container');

function setAuthMode(signUp) {
  isSignUpMode = signUp;
  tabLogin.setAttribute('aria-pressed', String(!signUp));
  tabSignup.setAttribute('aria-pressed', String(signUp));
  passwordInput.autocomplete = signUp ? 'new-password' : 'current-password';
  forgotLinkContainer.classList.toggle('hidden', signUp);
  authTitle.dataset.i18n = signUp ? 'auth.create' : 'auth.welcome';
  authDesc.dataset.i18n = signUp ? 'auth.createDesc' : 'auth.welcomeDesc';
  authSubmitBtn.dataset.i18n = signUp ? 'auth.signUp' : 'auth.signIn';
  applyTranslations();
  authMessage.classList.add('hidden');
}

tabLogin.addEventListener('click', () => setAuthMode(false));
tabSignup.addEventListener('click', () => setAuthMode(true));

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

// Show a message in one of the role="status" message boxes.
function showMessage(el, text, type) {
  el.textContent = text;
  el.className = 'message ' + type;
}

// Run a request with its button disabled so a double click cannot send it twice.
// `el` is the button itself or a form containing a submit button.
async function withBusy(el, fn) {
  const btn = el instanceof HTMLButtonElement ? el : el.querySelector('[type="submit"]');
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  btn.setAttribute('aria-busy', 'true');
  try {
    await fn();
  } finally {
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
  }
}

// Forgot Password Form Submit
forgotForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();
  forgotMessage.textContent = '';
  forgotMessage.classList.add('hidden');

  if (!isValidEmail(email)) {
    showMessage(forgotMessage, t('auth.invalidEmail'), 'error');
    return;
  }

  await withBusy(forgotForm, async () => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });

    if (error) {
      showMessage(forgotMessage, authErrorText(error), 'error');
    } else {
      showMessage(forgotMessage, t('forgot.sent'), 'success');
    }
  });
});


// Reset Password Form Submit
resetPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  resetPasswordMessage.textContent = '';
  resetPasswordMessage.classList.add('hidden');

  if (!isValidPassword(newPassword)) {
    showMessage(resetPasswordMessage, t('auth.invalidPassword'), 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showMessage(resetPasswordMessage, t('setpw.mismatch'), 'error');
    return;
  }

  await withBusy(resetPasswordForm, async () => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      showMessage(resetPasswordMessage, authErrorText(error), 'error');
    } else {
      showMessage(resetPasswordMessage, t('setpw.done'), 'success');
      recoveryMode = false;
      await supabase.auth.signOut(); // force a fresh sign-in with the new password
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        resetPasswordCard.classList.add('hidden');
        authCardMain.classList.remove('hidden');
        authView.classList.remove('hidden');
        showMessage(authMessage, t('auth.updatedSignIn'), 'success');
      }, 1500);
    }
  });
});


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
    if (errorDesc) console.warn('Auth link error:', decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
    showMessage(authMessage, t('auth.linkError'), 'error');
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

  const previousUserId = currentUser?.id;
  currentUser = session?.user || null;
  if (currentUser) {
    authView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    userEmailDisplay.textContent = currentUser.email;
    userEmailDisplay.title = currentUser.email;
    document.getElementById('profile-initial').textContent = currentUser.email[0].toUpperCase();
    if (currentUser.id !== previousUserId) fetchCosts();
  } else {
    fetchSeq++; // discard any in-flight fetch
    showExpenses();
    dashboardView.classList.add('hidden');
    authView.classList.remove('hidden');
    authCardMain.classList.remove('hidden');
    forgotCard.classList.add('hidden');
    resetPasswordCard.classList.add('hidden');
    costsCache = [];
    stopEdit();
  }
}

function authErrorText(error) {
  const key = authErrorKey(error);
  return key ? t(key) : error.message;
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
    showMessage(authMessage, t('auth.invalidEmail'), 'error');
    return;
  }

  // Validate password format only when creating an account; sign-in leaves that to the server.
  if (isSignUpMode && !isValidPassword(password)) {
    showMessage(authMessage, t('auth.invalidPassword'), 'error');
    return;
  }

  await withBusy(authForm, async () => {
    if (isSignUpMode) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        showMessage(authMessage, authErrorText(error), 'error');
      } else {
        showMessage(authMessage, t('auth.created'), 'success');
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        showMessage(authMessage, authErrorText(error), 'error');
      }
    }
  });
});


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

const menuItems = [...profileMenu.querySelectorAll('.menu-item')];
const menuIsOpen = () => !profileMenu.classList.contains('hidden');

// Focus moves into the menu only when it is opened, never when a click or page change closes it.
function toggleMenu(open) {
  profileMenu.classList.toggle('hidden', !open);
  profileBtn.setAttribute('aria-expanded', String(open));
  if (open) menuItems[0].focus();
}

profileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleMenu(profileMenu.classList.contains('hidden'));
});
document.addEventListener('click', () => toggleMenu(false));
document.addEventListener('keydown', (e) => {
  if (!menuIsOpen()) return;
  if (e.key === 'Escape') { toggleMenu(false); profileBtn.focus(); return; }
  if (e.key === 'Tab') { toggleMenu(false); return; }
  const i = menuItems.indexOf(document.activeElement);
  let next = -1;
  if (e.key === 'ArrowDown') next = (i + 1) % menuItems.length;
  else if (e.key === 'ArrowUp') next = (i - 1 + menuItems.length) % menuItems.length;
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = menuItems.length - 1;
  if (next >= 0) { e.preventDefault(); menuItems[next].focus(); }
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


// Change password: re-verify the current password, then update and sign out other devices.
changePasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const current = document.getElementById('current-password').value;
  const next = document.getElementById('account-new-password').value;
  const confirm = document.getElementById('account-confirm-password').value;

  if (!isValidPassword(next)) {
    showMessage(changePasswordMessage, t('pw.invalidNew'), 'error');
    return;
  }
  if (next !== confirm) {
    showMessage(changePasswordMessage, t('pw.mismatch'), 'error');
    return;
  }
  if (next === current) {
    showMessage(changePasswordMessage, t('pw.same'), 'error');
    return;
  }

  await withBusy(changePasswordForm, async () => {
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email: currentUser.email, password: current });
    if (verifyError) {
      showMessage(changePasswordMessage, t('pw.wrongCurrent'), 'error');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) {
      showMessage(changePasswordMessage, authErrorText(error), 'error');
      return;
    }
    await supabase.auth.signOut({ scope: 'others' });
    changePasswordForm.reset();
    showMessage(changePasswordMessage, t('pw.updated'), 'success');
  });
});

// Forgot the current password: reuse the email reset flow.
const sendResetLinkBtn = document.getElementById('send-reset-link');
sendResetLinkBtn.addEventListener('click', () => withBusy(sendResetLinkBtn, async () => {
  const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email, {
    redirectTo: window.location.origin + window.location.pathname
  });
  showMessage(changePasswordMessage, error ? authErrorText(error) : t('pw.linkSent', { email: currentUser.email }), error ? 'error' : 'success');
}));

// Fetch Costs
async function fetchCosts() {
  if (!currentUser) return;
  const seq = ++fetchSeq;
  const userId = currentUser.id;

  const { data, error } = await fetchAllPages((from, to) => supabase
    .from('costs')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id')
    .range(from, to));

  // Ignore a response that was superseded or belongs to a previous sign-in.
  if (seq !== fetchSeq || currentUser?.id !== userId) return;

  if (error) {
    console.error('Error fetching costs:', error);
    costList.innerHTML = `<li class="empty-state">${t('history.failed')} <button type="button" class="text-link link-btn" data-action="retry">${t('history.retry')}</button></li>`;
    return;
  }

  costsCache = data;
  renderCosts();
}

// Edit mode: the one add form is reused to change an existing expense.
const costFormTitle = document.getElementById('cost-form-title');
const costSubmit = document.getElementById('cost-submit');
const costCancel = document.getElementById('cost-cancel');

function setFormMode(editing) {
  costFormTitle.dataset.i18n = editing ? 'form.editTitle' : 'form.title';
  costSubmit.dataset.i18n = editing ? 'form.save' : 'form.submit';
  costCancel.classList.toggle('hidden', !editing);
  applyTranslations();
}

function startEdit(id) {
  const row = costsCache.find((c) => c.id === id);
  if (!row) return;
  editingId = id;
  costDateInput.value = row.date;
  costAmountInput.value = Number(row.amount).toFixed(2);
  costNotesInput.value = row.notes || '';
  // A category outside the six leaves nothing checked, so the required radio forces a choice.
  costForm.querySelectorAll('input[name="category"]').forEach((r) => { r.checked = false; });
  costForm.elements.category.value = row.category;
  const picked = costForm.elements.category.value;
  if (picked) costCard.dataset.cat = picked; else delete costCard.dataset.cat;
  costMessage.classList.add('hidden');
  syncDateShortcuts();
  setFormMode(true);
  renderCosts();
  costCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  costAmountInput.focus();
  costAmountInput.select();
}

function stopEdit() {
  if (editingId === null) return;
  editingId = null;
  costForm.reset();
  delete costCard.dataset.cat;
  setCostDate(0);
  costMessage.classList.add('hidden');
  setFormMode(false);
  renderCosts();
}

costCancel.addEventListener('click', () => { stopEdit(); costAmountInput.focus(); });
costForm.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && editingId !== null) { e.preventDefault(); stopEdit(); }
});

// Add or save Cost
costForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const amount = parseFloat(costAmountInput.value);
  const category = costForm.elements.category.value;
  const date = costDateInput.value;
  const notes = costNotesInput.value.trim();

  if (editingId !== null) {
    const id = editingId;
    await withBusy(costForm, async () => {
      const { error } = await supabase.from('costs').update({ amount, category, date, notes }).eq('id', id);
      if (error) {
        showMessage(costMessage, error.message, 'error');
        return;
      }
      if (editingId === id) stopEdit();
      fetchCosts();
      showToast(t('toast.updated'), { ms: 3000 });
    });
    return;
  }

  await withBusy(costForm, async () => {
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
      showMessage(costMessage, error.message, 'error');
    } else {
      showMessage(costMessage, t('form.added'), 'success');
      costForm.reset();
      delete costCard.dataset.cat;
      setCostDate(0);
      costAmountInput.focus(); // ready for the next expense
      fetchCosts();
      setTimeout(() => costMessage.classList.add('hidden'), 3000);
    }
  });
});


// Toast: one message at a time, auto-hides.
const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');
const toastUndo = document.getElementById('toast-undo');
let toastTimer = null;
let undoRow = null;

function showToast(text, { undo = null, ms = 7000 } = {}) {
  clearTimeout(toastTimer);
  toastText.textContent = text;
  undoRow = undo;
  toastUndo.classList.toggle('hidden', !undo);
  toast.classList.remove('hidden');
  toastTimer = setTimeout(hideToast, ms);
}

// Keep the toast while the pointer is over it or focus is inside it.
toast.addEventListener('mouseenter', () => clearTimeout(toastTimer));
toast.addEventListener('focusin', () => clearTimeout(toastTimer));
const restartToastTimer = () => {
  if (toast.classList.contains('hidden') || toast.matches(':hover') || toast.contains(document.activeElement)) return;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 4000);
};
toast.addEventListener('mouseleave', restartToastTimer);
toast.addEventListener('focusout', () => setTimeout(restartToastTimer, 0));

function hideToast() {
  clearTimeout(toastTimer);
  toast.classList.add('hidden');
  undoRow = null;
}

// Delete Cost: removed right away; "Undo" re-inserts the same row (same id), so nothing is lost if the tab closes.
async function deleteCost(id, btn) {
  const row = costsCache.find(c => c.id === id);
  if (btn) btn.disabled = true;
  const { error } = await supabase.from('costs').delete().eq('id', id);
  if (error) {
    if (btn) btn.disabled = false;
    showToast(t('history.deleteFailed', { msg: error.message }), { ms: 8000 });
    return;
  }
  if (id === editingId) stopEdit();
  await fetchCosts();
  if (row) showToast(t('toast.deleted'), { undo: row });
}

// One delegated listener for every row action (later tasks add more actions here).
costList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn || !costList.contains(btn)) return;
  if (btn.dataset.action === 'edit') startEdit(btn.dataset.id);
  if (btn.dataset.action === 'delete') deleteCost(btn.dataset.id, btn);
  if (btn.dataset.action === 'retry') fetchCosts();
});

toastUndo.addEventListener('click', async () => {
  const row = undoRow;
  if (!row) return;
  hideToast();
  await withBusy(toastUndo, async () => {
    const { error } = await supabase.from('costs').insert([row]);
    if (error) {
      showToast(t('toast.undoFailed', { msg: error.message }), { ms: 8000 });
    } else {
      await fetchCosts();
      showToast(t('toast.restored'), { ms: 3000 });
    }
  });
});

// Category filter: options are built from CATEGORIES so labels follow the language.
function renderCategoryFilter() {
  const selected = categoryFilter.value;
  categoryFilter.querySelectorAll('option:not([value=""])').forEach((o) => o.remove());
  CATEGORIES.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.value;
    opt.textContent = t('cat.' + c.value);
    categoryFilter.append(opt);
  });
  categoryFilter.value = selected;
}
renderCategoryFilter();

exportCsvBtn.addEventListener('click', () => {
  const blob = new Blob([toCsv(filteredCosts)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `daily-costs-${localISO(0)}.csv`;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// Render & Filter Costs
function renderCosts() {
  // The expense being edited is gone (deleted here or elsewhere): leave edit mode, which re-renders.
  if (editingId !== null && !costsCache.some((c) => c.id === editingId)) { stopEdit(); return; }

  const filtered = filterExpenses(costsCache, {
    search: searchFilter.value,
    category: categoryFilter.value,
    labelOf: (c) => t('cat.' + c)
  });

  filteredCosts = filtered;
  exportCsvBtn.classList.toggle('hidden', filtered.length === 0);

  const stats = computeStats(costsCache, localISO(0));
  statToday.textContent = formatMoney(stats.todayCents);
  statTotal.textContent = formatMoney(stats.allCents);
  statMonth.textContent = formatMoney(stats.monthCents);

  renderChart();

  // Summary of what the current search/filter shows
  if (filtered.length === 0) {
    historySummary.classList.add('hidden');
  } else {
    const shown = groupByDay(filtered).reduce((sum, d) => sum + d.subtotalCents, 0);
    historySummary.textContent = t(filtered.length === 1 ? 'history.summaryOne' : 'history.summaryMany',
      { n: filtered.length, total: formatMoney(shown) });
    historySummary.classList.remove('hidden');
  }

  // Render list
  if (filtered.length === 0) {
    costList.innerHTML = `<li class="empty-state">${t('history.none')}</li>`;
    return;
  }

  // Group by day (the query is already newest-first) with a subtotal per day.
  costList.innerHTML = groupByDay(filtered).map(({ date, items, subtotalCents }) => `
    <li class="day-head"><span>${dayLabel(date)}</span><span>${formatMoney(subtotalCents)}</span></li>
    ${items.map(item => `
    <li class="cost-item" data-cat="${escapeHtml(item.category)}"${item.id === editingId ? ' aria-current="true"' : ''}>
      <div class="cost-details">
        <div class="cost-cat">${catIcon(item.category)}${escapeHtml(t('cat.' + item.category))}</div>
        ${item.notes ? `<div class="cost-notes">${escapeHtml(item.notes)}</div>` : ''}
      </div>
      <div class="cost-right">
        <span class="cost-amount">${formatMoney(toCents(item.amount))}</span>
        <button type="button" class="icon-btn" data-action="edit" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(t('history.editAria', { cat: t('cat.' + item.category), amount: formatMoney(toCents(item.amount)) }))}">${uiIcon('pencil')}</button>
        <button type="button" class="icon-btn danger" data-action="delete" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(t('history.deleteAria', { cat: t('cat.' + item.category), amount: formatMoney(toCents(item.amount)) }))}">${uiIcon('trash')}</button>
      </div>
    </li>`).join('')}`).join('');
}

// "Today", "Yesterday", otherwise a short local date such as "Sat, 7 Nov" (year added when not this year).
function dayLabel(iso) {
  if (iso === localISO(0)) return t('day.today');
  if (iso === localISO(1)) return t('day.yesterday');
  const [y, m, d] = iso.split('-').map(Number);
  const opts = { weekday: 'short', day: 'numeric', month: 'short' };
  if (y !== new Date().getFullYear()) opts.year = 'numeric';
  return new Intl.DateTimeFormat(getLang(), opts).format(new Date(y, m - 1, d));
}

// Donut chart: spend per category for this month or all time (chartPeriod).
document.getElementById('chart-period').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-period]');
  if (!btn) return;
  chartPeriod = btn.dataset.period;
  document.querySelectorAll('#chart-period [data-period]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b === btn));
  });
  renderChart();
});

function renderChart() {
  const body = document.getElementById('chart-body');
  const { totalCents, rows } = categoryBreakdown(periodItems(costsCache, chartPeriod, localISO(0)), CATEGORIES.map((c) => c.value));

  if (totalCents <= 0) {
    const key = chartPeriod === 'month' && costsCache.length > 0 ? 'chart.emptyMonth' : 'chart.empty';
    body.innerHTML = `<p class="empty-state">${t(key)}</p>`;
    return;
  }

  const colorOf = (value) => CATEGORIES.find((c) => c.value === value).color;
  const R = 15.9155; // circumference = 100, so dash lengths are percentages
  let offset = 25;   // start at 12 o'clock
  const arcs = rows.map(r => {
    const arc = `<circle cx="21" cy="21" r="${R}" fill="none" stroke="${colorOf(r.value)}" stroke-width="6" stroke-dasharray="${r.pct} ${100 - r.pct}" stroke-dashoffset="${offset}"/>`;
    offset -= r.pct;
    return arc;
  }).join('');

  const legend = [...rows]
    .sort((a, b) => b.cents - a.cents)
    .map(r => `<li data-cat="${r.value}" style="--cat:${colorOf(r.value)}"><span class="legend-name">${catIcon(r.value)}${t('cat.' + r.value)}</span>` +
      `<span class="legend-pct">${Math.round(r.pct)}%</span>` +
      `<span class="legend-amt">${formatMoney(r.cents)}</span></li>`)
    .join('');

  body.innerHTML = `
    <div class="donut">
      <svg viewBox="0 0 42 42" role="img" aria-label="${t('chart.aria')}">${arcs}</svg>
      <div class="donut-center"><span>${t('chart.total')}</span><strong>${formatMoney(totalCents)}</strong></div>
    </div>
    <ul class="legend">${legend}</ul>`;
}

searchFilter.addEventListener('input', renderCosts);
categoryFilter.addEventListener('change', renderCosts);

// Re-render JS-built content when the language changes
onLangChange(() => {
  document.querySelectorAll('.pw-toggle').forEach((b) => b.paint());
  renderCategoryPicker();
  renderCategoryFilter();
  if (currentUser) {
    renderCosts();
    if (!accountView.classList.contains('hidden')) showAccount();
  }
});

// Initialize on load
applyTranslations();
initSession();
