import { supabase } from './supabaseClient.js';
import { catIcon, uiIcon, CATEGORIES, SOURCES } from './icons.js';
import { t, getLang, applyTranslations, onLangChange } from './i18n.js';
import { localISO } from './dates.js';
import { formatMoney, formatSignedMoney, toCents } from './money.js';
import { isValidEmail, isValidPassword, authErrorKey } from './validate.js';
import { escapeHtml, filterExpenses, groupByDay, categoryBreakdown, periodItems, fetchAllPages, toCsv } from './expenses.js';
import { monthSummary } from './income.js';

// Expenses live in `costs` keyed by `category`; income lives in `income` keyed by `source`.
// Everything that differs between the two kinds of entry is read from here.
const KINDS = {
  expense: { table: 'costs', field: 'category', options: CATEGORIES, label: (v) => t('cat.' + v) },
  income: { table: 'income', field: 'source', options: SOURCES, label: (v) => t('src.' + v) }
};

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
const costFormTitle = document.getElementById('cost-form-title');
const costSubmit = document.getElementById('cost-submit');
const costCancel = document.getElementById('cost-cancel');
const costCategoryLabel = document.getElementById('cost-category-label');

const costList = document.getElementById('cost-list');
const historySummary = document.getElementById('history-summary');
const exportCsvBtn = document.getElementById('export-csv');
let filteredCosts = []; // rows currently listed in the details panel (expenses or income), for CSV export
const statEarnedBtn = document.getElementById('stat-earned-btn');
const statEarnedLabel = document.getElementById('stat-earned-label');
const statEarned = document.getElementById('stat-earned');
const statSpentLabel = document.getElementById('stat-spent-label');
const statSpent = document.getElementById('stat-spent');
const statLeft = document.getElementById('stat-left');
document.getElementById('stat-more-icon').innerHTML = uiIcon('chevron');
const searchFilter = document.getElementById('search-filter');
const historyPanel = document.getElementById('history-panel');
const detailsTitle = document.getElementById('details-title');
const detailsIcon = document.getElementById('details-icon');
const detailsPeriod = document.getElementById('details-period');
const detailsClose = document.getElementById('details-close');
const filterMin = document.getElementById('filter-min');
const filterMax = document.getElementById('filter-max');
const filterFrom = document.getElementById('filter-from');
const filterTo = document.getElementById('filter-to');
const filterClear = document.getElementById('filter-clear');
document.getElementById('filter-clear-icon').innerHTML = uiIcon('reset');
document.getElementById('export-csv-icon').innerHTML = uiIcon('download');
detailsClose.innerHTML = uiIcon('close');

let isSignUpMode = false;
let currentUser = null;
let fetchSeq = 0;
let costsCache = [];
let chartPeriod = 'month'; // 'month' | 'all'
let selectedCat = null; // category whose details panel is open, or null
let incomeOpen = false; // the details panel lists income instead (never both: opening one closes the other)
let incomeSeq = 0;
let incomeCache = [];
let incomeState = 'loading'; // 'loading' | 'ok' | 'failed'
let chartData = { totalCents: 0, rows: [] };
let entryKind = 'expense'; // which kind the add form records: 'expense' | 'income'
let editingId = null; // id of the entry loaded into the add form, or null when adding
let editingKind = null; // kind of that entry
let kindBeforeEdit = 'expense'; // the form goes back to this kind when editing ends
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

// Category picker: one radio chip per category, or per income source in Income mode
// (native radios give keyboard and `required` for free).
function renderCategoryPicker(selected = costForm.elements.category?.value || '') {
  const { options, label } = KINDS[entryKind];
  costCategoryPicker.innerHTML = options.map((c, i) => `
    <label class="cat-opt" data-cat="${c.value}">
      <input type="radio" name="category" value="${c.value}"${c.value === selected ? ' checked' : ''}${i === 0 ? ' required' : ''}>
      <span class="cat-opt-body">${catIcon(c.value)}<span>${label(c.value)}</span></span>
    </label>`).join('');
}
renderCategoryPicker();
costCategoryPicker.addEventListener('change', () => { costCard.dataset.cat = costForm.elements.category.value; });

// Expense / Income switch. Switching clears the chosen category or source but keeps amount, date and notes.
const kindRadios = [...costForm.querySelectorAll('input[name="kind"]')];
function setEntryKind(kind) {
  entryKind = kind;
  kindRadios.forEach((r) => { r.checked = r.value === kind; });
  costCard.dataset.kind = kind;
  delete costCard.dataset.cat;
  renderCategoryPicker('');
  syncFormText();
}
kindRadios.forEach((r) => r.addEventListener('change', () => {
  if (r.checked) { setEntryKind(r.value); costMessage.classList.add('hidden'); }
}));

// Title, button, picker label and notes hint follow the kind and whether an entry is being edited.
function syncFormText() {
  const income = entryKind === 'income';
  const editing = editingId !== null;
  costFormTitle.dataset.i18n = editing ? (income ? 'income.editTitle' : 'form.editTitle') : (income ? 'income.formTitle' : 'form.title');
  costSubmit.dataset.i18n = editing ? 'form.save' : (income ? 'income.submit' : 'form.submit');
  costCategoryLabel.dataset.i18n = income ? 'form.source' : 'form.category';
  costNotesInput.dataset.i18nPlaceholder = income ? 'income.notesPlaceholder' : 'form.notesPlaceholder';
  costCancel.classList.toggle('hidden', !editing);
  // While editing, the switch is locked so a row can never move between tables.
  kindRadios.forEach((r) => { r.disabled = editing; });
  applyTranslations();
}

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
    if (currentUser.id !== previousUserId) {
      incomeState = 'loading';
      fetchCosts();
      fetchIncome();
    }
  } else {
    fetchSeq++; // discard any in-flight fetch
    incomeSeq++;
    incomeCache = [];
    incomeState = 'loading';
    selectedCat = null;
    incomeOpen = false;
    showExpenses();
    dashboardView.classList.add('hidden');
    authView.classList.remove('hidden');
    authCardMain.classList.remove('hidden');
    forgotCard.classList.add('hidden');
    resetPasswordCard.classList.add('hidden');
    costsCache = [];
    stopEdit();
    if (entryKind !== 'expense') { entryKind = 'expense'; resetForm(); } // the next sign-in opens in Expense mode
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

// Fetch income: same paging and stale-response guard as costs, into its own cache.
// If it fails (for example the income migration has not been run) expenses keep working
// and Earned / Left show "-".
async function fetchIncome() {
  if (!currentUser) return;
  const seq = ++incomeSeq;
  const userId = currentUser.id;

  const { data, error } = await fetchAllPages((from, to) => supabase
    .from('income')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id')
    .range(from, to));

  if (seq !== incomeSeq || currentUser?.id !== userId) return;

  if (error) {
    console.error('Error fetching income:', error);
    incomeCache = [];
    incomeState = 'failed';
  } else {
    incomeCache = data;
    incomeState = 'ok';
  }
  renderCosts();
}

const cacheOf = (kind) => (kind === 'income' ? incomeCache : costsCache);
const refetch = (kind) => (kind === 'income' ? fetchIncome() : fetchCosts());

// Empty the add form but stay in the kind it is in.
function resetForm() {
  costForm.reset(); // also re-checks the default "expense" radio, so restore the kind
  setEntryKind(entryKind);
  setCostDate(0);
}

// Edit mode: the one add form is reused to change an existing expense or income entry.
function startEdit(id, kind) {
  const row = cacheOf(kind).find((c) => c.id === id);
  if (!row) return;
  if (editingId === null) kindBeforeEdit = entryKind;
  editingId = id;
  editingKind = kind;
  setEntryKind(kind);
  costDateInput.value = row.date;
  costAmountInput.value = Number(row.amount).toFixed(2);
  costNotesInput.value = row.notes || '';
  // A value outside the fixed list leaves nothing checked, so the required radio forces a choice.
  costForm.elements.category.value = row[KINDS[kind].field];
  const picked = costForm.elements.category.value;
  if (picked) costCard.dataset.cat = picked; else delete costCard.dataset.cat;
  costMessage.classList.add('hidden');
  syncDateShortcuts();
  syncFormText();
  renderCosts();
  costCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  costAmountInput.focus();
  costAmountInput.select();
}

function stopEdit() {
  if (editingId === null) return;
  editingId = null;
  editingKind = null;
  entryKind = kindBeforeEdit;
  resetForm();
  costMessage.classList.add('hidden');
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

  const kind = editingId !== null ? editingKind : entryKind;
  const { table, field } = KINDS[kind];
  const income = kind === 'income';
  const fields = {
    amount: parseFloat(costAmountInput.value),
    [field]: costForm.elements.category.value,
    date: costDateInput.value,
    notes: costNotesInput.value.trim()
  };

  if (editingId !== null) {
    const id = editingId;
    await withBusy(costForm, async () => {
      const { error } = await supabase.from(table).update(fields).eq('id', id);
      if (error) {
        showMessage(costMessage, error.message, 'error');
        return;
      }
      if (editingId === id) stopEdit();
      refetch(kind);
      showToast(t(income ? 'income.updated' : 'toast.updated'), { ms: 3000 });
    });
    return;
  }

  await withBusy(costForm, async () => {
    const { error } = await supabase.from(table).insert([{ user_id: currentUser.id, ...fields }]);

    if (error) {
      showMessage(costMessage, error.message, 'error');
    } else {
      showMessage(costMessage, t(income ? 'income.added' : 'form.added'), 'success');
      resetForm(); // stays in the kind it was in
      costAmountInput.focus(); // ready for the next entry
      refetch(kind);
      setTimeout(() => costMessage.classList.add('hidden'), 3000);
    }
  });
});


// Toast: one message at a time, auto-hides.
const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');
const toastUndo = document.getElementById('toast-undo');
let toastTimer = null;
let undoRow = null; // { kind, row } that Undo puts back

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

// Delete an entry: removed right away; "Undo" re-inserts the same row (same id), so nothing is lost if the tab closes.
async function deleteEntry(id, kind, btn) {
  const income = kind === 'income';
  const row = cacheOf(kind).find(c => c.id === id);
  if (btn) btn.disabled = true;
  const { error } = await supabase.from(KINDS[kind].table).delete().eq('id', id);
  if (error) {
    if (btn) btn.disabled = false;
    showToast(t(income ? 'income.deleteFailed' : 'history.deleteFailed', { msg: error.message }), { ms: 8000 });
    return;
  }
  if (id === editingId) stopEdit();
  await refetch(kind);
  if (row) showToast(t(income ? 'income.deleted' : 'toast.deleted'), { undo: { kind, row } });
}

// One delegated listener for every row action. Rows say which kind they are via data-kind.
costList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn || !costList.contains(btn)) return;
  const kind = btn.dataset.kind === 'income' ? 'income' : 'expense';
  if (btn.dataset.action === 'edit') startEdit(btn.dataset.id, kind);
  if (btn.dataset.action === 'delete') deleteEntry(btn.dataset.id, kind, btn);
  if (btn.dataset.action === 'retry') refetch(kind);
});

toastUndo.addEventListener('click', async () => {
  const undo = undoRow;
  if (!undo) return;
  const income = undo.kind === 'income';
  hideToast();
  await withBusy(toastUndo, async () => {
    const { error } = await supabase.from(KINDS[undo.kind].table).insert([undo.row]);
    if (error) {
      showToast(t(income ? 'income.undoFailed' : 'toast.undoFailed', { msg: error.message }), { ms: 8000 });
    } else {
      await refetch(undo.kind);
      showToast(t(income ? 'income.restored' : 'toast.restored'), { ms: 3000 });
    }
  });
});

exportCsvBtn.addEventListener('click', () => {
  const blob = new Blob([toCsv(filteredCosts, incomeOpen ? 'source' : 'category')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${incomeOpen ? 'daily-income' : 'daily-costs'}-${localISO(0)}.csv`;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// Current month name for the band labels, capitalised ("November", "Noviembre").
function monthName() {
  const name = new Intl.DateTimeFormat(getLang(), { month: 'long' }).format(new Date());
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Top band: Earned / Spent / Left for the current calendar month.
function renderBand() {
  const month = monthName();
  statEarnedLabel.textContent = t('stats.earned', { month });
  statSpentLabel.textContent = t('stats.spent', { month });
  const { earnedCents, spentCents, leftCents } = monthSummary(costsCache, incomeCache, localISO(0));
  statSpent.textContent = formatMoney(spentCents);
  const known = incomeState === 'ok';
  statEarned.textContent = known ? formatMoney(earnedCents) : '-';
  statLeft.textContent = known ? formatSignedMoney(leftCents) : '-';
  statLeft.dataset.sign = !known || leftCents === 0 ? 'zero' : leftCents > 0 ? 'positive' : 'negative';
  statEarnedBtn.setAttribute('aria-pressed', String(incomeOpen));
}

// Dashboard totals and chart; the details panel is rendered separately (renderDetails).
function renderCosts() {
  // The entry being edited is gone (deleted here or elsewhere): leave edit mode, which re-renders.
  if (editingId !== null && !cacheOf(editingKind).some((c) => c.id === editingId)) { stopEdit(); return; }

  renderBand();
  renderChart();
  renderDetails();
}

// Details panel: the expenses of the selected category, or all income, within the chart's period.
// With no selection the panel collapses but keeps its last content so it can animate out.
function renderDetails({ stagger = false } = {}) {
  const open = selectedCat !== null || incomeOpen;
  historyPanel.classList.toggle('is-open', open);
  historyPanel.inert = !open;
  statEarnedBtn.setAttribute('aria-pressed', String(incomeOpen));
  if (!open) return;

  const kind = incomeOpen ? 'income' : 'expense';
  const { label } = KINDS[kind];
  historyPanel.dataset.cat = incomeOpen ? 'Income' : selectedCat;
  detailsIcon.innerHTML = catIcon(incomeOpen ? 'Income' : selectedCat);
  detailsTitle.textContent = incomeOpen ? t('income.title') : t('cat.' + selectedCat);
  searchFilter.setAttribute('aria-label', t(incomeOpen ? 'income.searchAria' : 'history.searchAria'));

  if (incomeOpen && incomeState !== 'ok') {
    historySummary.classList.add('hidden');
    exportCsvBtn.classList.add('hidden');
    filteredCosts = [];
    costList.innerHTML = incomeState === 'loading'
      ? `<li class="empty-state">${t('income.loading')}</li>`
      : `<li class="empty-state">${t('income.failed')} <button type="button" class="text-link link-btn" data-action="retry" data-kind="income">${t('history.retry')}</button></li>`;
    return;
  }

  // Amount bounds are typed in dollars; '' means no bound. Date bounds replace the chart's period.
  const toBound = (input) => (input.value === '' || !(Number(input.value) >= 0) ? null : Math.round(Number(input.value) * 100));
  const minCents = toBound(filterMin);
  const maxCents = toBound(filterMax);
  const from = filterFrom.value;
  const to = filterTo.value;
  const customDates = from !== '' || to !== '';
  detailsPeriod.textContent = customDates ? t('filter.custom') : t('chart.' + chartPeriod);
  filterClear.classList.toggle('hidden', !(searchFilter.value || minCents !== null || maxCents !== null || customDates));

  const source = cacheOf(kind);
  const filtered = filterExpenses(customDates ? source : periodItems(source, chartPeriod, localISO(0)), {
    search: searchFilter.value,
    category: incomeOpen ? '' : selectedCat,
    keyOf: (item) => item[KINDS[kind].field],
    labelOf: label,
    minCents, maxCents, from, to
  });
  filteredCosts = filtered;
  exportCsvBtn.classList.toggle('hidden', filtered.length === 0);

  if (filtered.length === 0) {
    historySummary.classList.add('hidden');
    // An impossible range is the likely reason for an empty list: say so rather than "not found".
    const key = minCents !== null && maxCents !== null && minCents > maxCents ? 'filter.invertedAmount'
      : from && to && from > to ? 'filter.invertedDate' : incomeOpen ? 'income.none' : 'history.none';
    costList.innerHTML = `<li class="empty-state">${t(key)}</li>`;
    return;
  }

  const shown = groupByDay(filtered).reduce((sum, d) => sum + d.subtotalCents, 0);
  const summaryKey = incomeOpen
    ? (filtered.length === 1 ? 'income.summaryOne' : 'income.summaryMany')
    : (filtered.length === 1 ? 'history.summaryOne' : 'history.summaryMany');
  historySummary.textContent = t(summaryKey, { n: filtered.length, total: formatMoney(shown) });
  historySummary.classList.remove('hidden');

  // Group by day (the query is already newest-first) with a subtotal per day.
  costList.innerHTML = groupByDay(filtered).map(({ date, items, subtotalCents }) => `
    <li class="day-head"><span>${dayLabel(date)}</span><span>${formatMoney(subtotalCents)}</span></li>
    ${items.map(item => incomeOpen ? incomeRow(item) : expenseRow(item)).join('')}`).join('');

  // Staggered entrance, only when the panel opens or switches category (not on every keystroke).
  costList.classList.toggle('stagger', stagger);
  if (stagger) {
    costList.scrollTop = 0;
    costList.querySelectorAll(':scope > li').forEach((li, i) => li.style.setProperty('--i', Math.min(i, 14)));
  }
}

function rowActions(item, kind, ariaVars) {
  const id = escapeHtml(item.id);
  const prefix = kind === 'income' ? 'income' : 'history';
  return `
        <button type="button" class="icon-btn" data-action="edit" data-kind="${kind}" data-id="${id}" aria-label="${escapeHtml(t(prefix + '.editAria', ariaVars))}">${uiIcon('pencil')}</button>
        <button type="button" class="icon-btn danger" data-action="delete" data-kind="${kind}" data-id="${id}" aria-label="${escapeHtml(t(prefix + '.deleteAria', ariaVars))}">${uiIcon('trash')}</button>`;
}

// An expense row sits inside its category's panel, so it shows only the note.
function expenseRow(item) {
  const amount = formatMoney(toCents(item.amount));
  return `
    <li class="cost-item" data-cat="${escapeHtml(item.category)}"${item.id === editingId ? ' aria-current="true"' : ''}>
      <div class="cost-details">
        ${item.notes
          ? `<div class="cost-note">${escapeHtml(item.notes)}</div>`
          : `<div class="cost-note is-empty">${t('details.noNote')}</div>`}
      </div>
      <div class="cost-right">
        <span class="cost-amount">${amount}</span>${rowActions(item, 'expense', { cat: t('cat.' + item.category), amount })}
      </div>
    </li>`;
}

// The income list mixes Salary and Extra, so each row names its source; the amount carries a "+".
function incomeRow(item) {
  const amount = formatMoney(toCents(item.amount));
  const src = KINDS.income.label(item.source);
  return `
    <li class="cost-item" data-cat="${escapeHtml(item.source)}"${item.id === editingId ? ' aria-current="true"' : ''}>
      <div class="cost-details">
        <div class="cost-cat">${catIcon(item.source)}<span>${escapeHtml(src)}</span></div>
        ${item.notes ? `<div class="cost-notes">${escapeHtml(item.notes)}</div>` : ''}
      </div>
      <div class="cost-right">
        <span class="cost-amount is-income">+${amount}</span>${rowActions(item, 'income', { src, amount })}
      </div>
    </li>`;
}

function clearFilters() {
  [searchFilter, filterMin, filterMax, filterFrom, filterTo].forEach((input) => { input.value = ''; });
}

function revealPanel() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => historyPanel.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }), 320);
}

function selectCategory(value) {
  selectedCat = value === selectedCat ? null : value;
  if (selectedCat) incomeOpen = false;
  clearFilters();
  syncChartSelection();
  renderDetails({ stagger: true });
  if (selectedCat) revealPanel();
}

// The Earned box opens the income list in the same panel; clicking it again closes it.
function toggleIncome(open = !incomeOpen) {
  incomeOpen = open;
  if (open) selectedCat = null;
  clearFilters();
  syncChartSelection();
  renderDetails({ stagger: true });
  if (open) revealPanel();
}
statEarnedBtn.addEventListener('click', () => toggleIncome());

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
  renderDetails({ stagger: true });
});

function renderChart() {
  const body = document.getElementById('chart-body');
  chartData = categoryBreakdown(periodItems(costsCache, chartPeriod, localISO(0)), CATEGORIES.map((c) => c.value));
  const { totalCents, rows } = chartData;

  // The open category has no spend left in this period (deleted, or period switched): close it.
  if (selectedCat && !rows.some((r) => r.value === selectedCat)) selectedCat = null;

  if (totalCents <= 0) {
    const key = costsCache.length === 0 || chartPeriod === 'all' ? 'chart.empty'
      : chartPeriod === 'month' ? 'chart.emptyMonth' : 'chart.emptyRange';
    body.innerHTML = `<p class="empty-state">${t(key)}</p>`;
    return;
  }

  const colorOf = (value) => CATEGORIES.find((c) => c.value === value).color;
  const R = 15.9155; // circumference = 100, so dash lengths are percentages
  let offset = 25;   // start at 12 o'clock
  const arcs = rows.map(r => {
    const arc = `<circle class="arc" data-cat="${r.value}" cx="21" cy="21" r="${R}" fill="none" stroke="${colorOf(r.value)}" stroke-width="6" stroke-dasharray="${r.pct} ${100 - r.pct}" stroke-dashoffset="${offset}"/>`;
    offset -= r.pct;
    return arc;
  }).join('');

  const legend = [...rows]
    .sort((a, b) => b.cents - a.cents)
    .map(r => `<li data-cat="${r.value}"><button type="button" class="legend-row" aria-pressed="false" aria-controls="history-panel">` +
      `<span class="legend-name">${catIcon(r.value)}${t('cat.' + r.value)}</span>` +
      `<span class="legend-pct">${Math.round(r.pct)}%</span>` +
      `<span class="legend-amt">${formatMoney(r.cents)}</span></button></li>`)
    .join('');

  body.innerHTML = `
    <div class="donut">
      <svg viewBox="0 0 42 42" role="img" aria-label="${t('chart.aria')}">${arcs}</svg>
      <div class="donut-center"><span></span><strong></strong></div>
    </div>
    <div class="legend-wrap">
      <ul class="legend">${legend}</ul>
      <p class="legend-hint">${t('details.hint')}</p>
    </div>`;
  syncChartSelection();
}

// Highlight the selected category in the donut and legend without rebuilding them,
// so the CSS transitions run and keyboard focus stays on the clicked legend row.
function syncChartSelection() {
  const body = document.getElementById('chart-body');
  const label = body.querySelector('.donut-center span');
  if (!label) return;
  body.classList.toggle('has-sel', selectedCat !== null);
  body.querySelectorAll('[data-cat]').forEach((el) => el.classList.toggle('is-sel', el.dataset.cat === selectedCat));
  body.querySelectorAll('.legend-row').forEach((b) => b.setAttribute('aria-pressed', String(b.parentElement.dataset.cat === selectedCat)));
  const row = chartData.rows.find((r) => r.value === selectedCat);
  label.textContent = row ? t('cat.' + row.value) : t('chart.total');
  body.querySelector('.donut-center strong').textContent = formatMoney(row ? row.cents : chartData.totalCents);
}

// Click a legend row or a donut slice to open that category's details; click it again to close.
document.getElementById('chart-body').addEventListener('click', (e) => {
  const target = e.target.closest('.legend-row, .arc');
  if (!target) return;
  selectCategory((target.closest('[data-cat]') || target).dataset.cat);
});
detailsClose.addEventListener('click', () => {
  if (incomeOpen) {
    toggleIncome(false);
    statEarnedBtn.focus();
    return;
  }
  const value = selectedCat;
  selectCategory(value);
  document.querySelector(`#chart-body li[data-cat="${CSS.escape(value)}"] .legend-row`)?.focus();
});
historyPanel.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && (selectedCat || incomeOpen)) { e.preventDefault(); detailsClose.click(); }
});

[searchFilter, filterMin, filterMax, filterFrom, filterTo].forEach((input) => {
  input.addEventListener('input', () => renderDetails());
});
filterClear.addEventListener('click', () => { clearFilters(); renderDetails(); searchFilter.focus(); });

// Re-render JS-built content when the language changes
onLangChange(() => {
  document.querySelectorAll('.pw-toggle').forEach((b) => b.paint());
  renderCategoryPicker();
  if (currentUser) {
    renderCosts();
    if (!accountView.classList.contains('hidden')) showAccount();
  }
});

// Initialize on load
applyTranslations();
initSession();
