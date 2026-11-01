import { supabase } from './supabaseClient.js';

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
const costCategoryInput = document.getElementById('cost-category');
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

// Set default date to today in cost form
costDateInput.valueAsDate = new Date();

// Auth DOM Elements
const authTitle = document.getElementById('auth-title');
const authDesc = document.getElementById('auth-desc');

// Auth Tab Switching
tabLogin.addEventListener('click', () => {
  isSignUpMode = false;
  tabLogin.classList.add('active');
  tabSignup.classList.remove('active');
  authTitle.textContent = 'Welcome Back';
  authDesc.textContent = 'Log in securely to manage your daily expenses';
  authSubmitBtn.textContent = 'Sign In';
  authMessage.classList.add('hidden');
});

tabSignup.addEventListener('click', () => {
  isSignUpMode = true;
  tabSignup.classList.add('active');
  tabLogin.classList.remove('active');
  authTitle.textContent = 'Create Account';
  authDesc.textContent = 'Sign up to start tracking your daily costs securely';
  authSubmitBtn.textContent = 'Sign Up';
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
    showForgotMessage('Please enter a valid email address.', 'error');
    return;
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname
  });

  if (error) {
    showForgotMessage(error.message, 'error');
  } else {
    showForgotMessage('Password reset email sent! Please check your inbox for the reset link.', 'success');
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
    showResetPasswordMessage('Password must be 4 to 16 characters long and contain both letters and numbers.', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showResetPasswordMessage('Passwords do not match.', 'error');
    return;
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    showResetPasswordMessage(error.message, 'error');
  } else {
    showResetPasswordMessage('Password updated successfully! Redirecting...', 'success');
    setTimeout(() => {
      window.history.replaceState({}, document.title, window.location.pathname);
      resetPasswordCard.classList.add('hidden');
      authCardMain.classList.remove('hidden');
      authView.classList.remove('hidden');
      showAuthMessage('Password updated successfully. Please sign in with your new password.', 'success');
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
    const decodedDesc = errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, ' ')) : 'Password reset link is invalid or has expired.';
    showAuthMessage(`Reset link error: ${decodedDesc} Please make sure your Supabase Site URL matches https://litoens.github.io/Daily-Cost/ and request a new reset link.`, 'error');
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const tokenHash = params.get('token_hash');
  const type = params.get('type');

  if (tokenHash && type === 'recovery') {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery'
    });
    if (!error) {
      authCardMain.classList.add('hidden');
      forgotCard.classList.add('hidden');
      resetPasswordCard.classList.remove('hidden');
      return;
    }
  }

  const isRecovery = window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery');
  if (isRecovery) {
    authCardMain.classList.add('hidden');
    forgotCard.classList.add('hidden');
    resetPasswordCard.classList.remove('hidden');
  }

  const { data: { session } } = await supabase.auth.getSession();
  handleSession(session, isRecovery);

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      authCardMain.classList.add('hidden');
      forgotCard.classList.add('hidden');
      resetPasswordCard.classList.remove('hidden');
    } else {
      handleSession(session);
    }
  });
}

function handleSession(session, isRecovery = false) {
  if (isRecovery || window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery')) {
    return;
  }

  currentUser = session?.user || null;
  if (currentUser) {
    authView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    userEmailDisplay.textContent = currentUser.email;
    fetchCosts();
  } else {
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
    showAuthMessage('Please enter a valid email address.', 'error');
    return;
  }

  // Validate Password
  if (!isValidPassword(password)) {
    showAuthMessage('Password must be 4 to 16 characters long and contain both letters and numbers.', 'error');
    return;
  }

  if (isSignUpMode) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      showAuthMessage(error.message, 'error');
    } else {
      showAuthMessage('Account created successfully! Please check your email for confirmation or sign in.', 'success');
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

// Fetch Costs
async function fetchCosts() {
  if (!currentUser) return;

  const { data, error } = await supabase
    .from('costs')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching costs:', error);
    costList.innerHTML = `<li class="empty-state">Failed to load expenses.</li>`;
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
  const category = costCategoryInput.value;
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
    showCostMessage('Expense added successfully!', 'success');
    costForm.reset();
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
  if (!confirm('Are you sure you want to delete this expense?')) return;

  const { error } = await supabase.from('costs').delete().eq('id', id);
  if (error) {
    alert('Failed to delete expense: ' + error.message);
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

  // Render list
  if (filtered.length === 0) {
    costList.innerHTML = `<li class="empty-state">No expenses found.</li>`;
    return;
  }

  costList.innerHTML = filtered.map(item => `
    <li class="cost-item">
      <div class="cost-details">
        <div class="cost-cat">${escapeHtml(item.category)}</div>
        <div class="cost-date">${item.date}</div>
        ${item.notes ? `<div class="cost-notes">${escapeHtml(item.notes)}</div>` : ''}
      </div>
      <div class="cost-right">
        <span class="cost-amount">$${Number(item.amount).toFixed(2)}</span>
        <button class="btn btn-danger" onclick="deleteCost('${item.id}')">Delete</button>
      </div>
    </li>
  `).join('');
}

searchFilter.addEventListener('input', renderCosts);
categoryFilter.addEventListener('change', renderCosts);

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Initialize on load
initSession();
