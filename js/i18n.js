// Minimal i18n: dictionaries + data-i18n attributes. No build step, no dependencies.
//   data-i18n="key"              -> element.textContent
//   data-i18n-placeholder="key"  -> placeholder attribute
//   data-i18n-aria="key"         -> aria-label attribute
// Stored category values (Meat, Utilities, ...) never change; only their labels do.

export const DICT = {
  en: {
    'lang.label': 'Language',

    'auth.welcome': 'Welcome Back',
    'auth.welcomeDesc': 'Log in securely to manage your daily expenses',
    'auth.create': 'Create Account',
    'auth.createDesc': 'Sign up to start tracking your daily costs securely',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email address',
    'auth.password': 'Password',
    'auth.forgot': 'Forgot password?',
    'auth.back': '← Back to Sign In',
    'auth.invalidEmail': 'Please enter a valid email address.',
    'auth.invalidPassword': 'Password must be 4 to 16 characters long and contain both letters and numbers.',
    'auth.created': 'Account created successfully! Please check your email for confirmation or sign in.',
    'auth.updatedSignIn': 'Password updated successfully. Please sign in with your new password.',
    'auth.linkError': 'Reset link error: {desc} Please make sure your Supabase Site URL matches https://litoens.github.io/Daily-Cost/ and request a new reset link.',
    'auth.linkExpired': 'Password reset link is invalid or has expired.',

    'forgot.title': 'Reset Password',
    'forgot.desc': "Enter your email address and we'll send you a link to reset your password.",
    'forgot.send': 'Send Reset Link',
    'forgot.sent': 'Password reset email sent! Please check your inbox for the reset link.',

    'setpw.title': 'Set New Password',
    'setpw.desc': 'Please enter your new password below.',
    'setpw.new': 'New Password',
    'setpw.confirm': 'Confirm New Password',
    'setpw.update': 'Update Password',
    'setpw.mismatch': 'Passwords do not match.',
    'setpw.done': 'Password updated successfully! Redirecting...',

    'nav.account': 'Account menu',
    'nav.accountItem': 'Account',
    'nav.resetPassword': 'Reset password',
    'nav.signOut': 'Sign Out',
    'nav.back': '← Back to expenses',

    'stats.total': 'Total Spent (All Time)',
    'stats.month': 'This Month',

    'form.title': 'Add Expense',
    'form.date': 'Date',
    'form.amount': 'Amount ($)',
    'form.category': 'Category',
    'form.selectCategory': 'Select category',
    'form.notes': 'Notes (Optional)',
    'form.notesPlaceholder': 'e.g. 2kg of fresh beef',
    'form.submit': 'Add Expense',
    'form.added': 'Expense added successfully!',

    'cat.Meat': 'Meat & Groceries',
    'cat.Food & Dining': 'Food & Dining',
    'cat.Transport': 'Transport',
    'cat.Utilities': 'Utilities & Bills',
    'cat.Entertainment': 'Entertainment',
    'cat.Other': 'Other',

    'chart.title': 'Where it goes',
    'chart.empty': 'Add an expense to see the breakdown.',
    'chart.total': 'Total',
    'chart.aria': 'Spending by category',

    'history.title': 'Expense History',
    'history.search': 'Search category or notes...',
    'history.searchAria': 'Search expenses',
    'history.filterAria': 'Filter by category',
    'history.all': 'All Categories',
    'history.loading': 'Loading expenses...',
    'history.none': 'No expenses found.',
    'history.failed': 'Failed to load expenses.',
    'history.delete': 'Delete',
    'history.confirmDelete': 'Are you sure you want to delete this expense?',
    'history.deleteFailed': 'Failed to delete expense: {msg}',

    'account.title': 'Account',
    'account.email': 'Email',
    'account.since': 'Member since',
    'account.lastSignIn': 'Last sign-in',

    'pw.title': 'Reset password',
    'pw.current': 'Current password',
    'pw.new': 'New password',
    'pw.confirm': 'Confirm new password',
    'pw.update': 'Update Password',
    'pw.forgotCurrent': 'Forgot your current password?',
    'pw.emailLink': 'Email me a reset link',
    'pw.invalidNew': 'New password must be 4 to 16 characters long and contain both letters and numbers.',
    'pw.mismatch': 'New passwords do not match.',
    'pw.same': 'New password must be different from the current one.',
    'pw.wrongCurrent': 'Current password is incorrect.',
    'pw.updated': 'Password updated. Other devices have been signed out.',
    'pw.linkSent': 'Reset link sent to {email}. Check your inbox.',

    'footer.text': '© 2026 Daily Cost Tracker. Securely powered by Supabase & GitHub Pages.'
  },

  es: {
    'lang.label': 'Idioma',

    'auth.welcome': 'Bienvenido de nuevo',
    'auth.welcomeDesc': 'Inicia sesión de forma segura para gestionar tus gastos diarios',
    'auth.create': 'Crear cuenta',
    'auth.createDesc': 'Regístrate para registrar tus gastos diarios de forma segura',
    'auth.signIn': 'Iniciar sesión',
    'auth.signUp': 'Registrarse',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.forgot': '¿Olvidaste tu contraseña?',
    'auth.back': '← Volver a iniciar sesión',
    'auth.invalidEmail': 'Ingresa un correo electrónico válido.',
    'auth.invalidPassword': 'La contraseña debe tener entre 4 y 16 caracteres, con letras y números.',
    'auth.created': '¡Cuenta creada! Revisa tu correo para confirmarla o inicia sesión.',
    'auth.updatedSignIn': 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.',
    'auth.linkError': 'Error en el enlace: {desc} Verifica que la Site URL de Supabase sea https://litoens.github.io/Daily-Cost/ y solicita un nuevo enlace.',
    'auth.linkExpired': 'El enlace para restablecer la contraseña no es válido o ha expirado.',

    'forgot.title': 'Restablecer contraseña',
    'forgot.desc': 'Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.',
    'forgot.send': 'Enviar enlace',
    'forgot.sent': '¡Correo enviado! Revisa tu bandeja de entrada para encontrar el enlace.',

    'setpw.title': 'Nueva contraseña',
    'setpw.desc': 'Ingresa tu nueva contraseña a continuación.',
    'setpw.new': 'Nueva contraseña',
    'setpw.confirm': 'Confirmar nueva contraseña',
    'setpw.update': 'Actualizar contraseña',
    'setpw.mismatch': 'Las contraseñas no coinciden.',
    'setpw.done': '¡Contraseña actualizada! Redirigiendo...',

    'nav.account': 'Menú de cuenta',
    'nav.accountItem': 'Cuenta',
    'nav.resetPassword': 'Cambiar contraseña',
    'nav.signOut': 'Cerrar sesión',
    'nav.back': '← Volver a los gastos',

    'stats.total': 'Total gastado (histórico)',
    'stats.month': 'Este mes',

    'form.title': 'Agregar gasto',
    'form.date': 'Fecha',
    'form.amount': 'Monto ($)',
    'form.category': 'Categoría',
    'form.selectCategory': 'Selecciona una categoría',
    'form.notes': 'Notas (opcional)',
    'form.notesPlaceholder': 'p. ej. 2 kg de carne fresca',
    'form.submit': 'Agregar gasto',
    'form.added': '¡Gasto agregado!',

    'cat.Meat': 'Carnes y supermercado',
    'cat.Food & Dining': 'Comida y restaurantes',
    'cat.Transport': 'Transporte',
    'cat.Utilities': 'Servicios y cuentas',
    'cat.Entertainment': 'Entretenimiento',
    'cat.Other': 'Otros',

    'chart.title': 'En qué se va',
    'chart.empty': 'Agrega un gasto para ver el desglose.',
    'chart.total': 'Total',
    'chart.aria': 'Gastos por categoría',

    'history.title': 'Historial de gastos',
    'history.search': 'Buscar por categoría o notas...',
    'history.searchAria': 'Buscar gastos',
    'history.filterAria': 'Filtrar por categoría',
    'history.all': 'Todas las categorías',
    'history.loading': 'Cargando gastos...',
    'history.none': 'No se encontraron gastos.',
    'history.failed': 'No se pudieron cargar los gastos.',
    'history.delete': 'Eliminar',
    'history.confirmDelete': '¿Seguro que quieres eliminar este gasto?',
    'history.deleteFailed': 'No se pudo eliminar el gasto: {msg}',

    'account.title': 'Cuenta',
    'account.email': 'Correo',
    'account.since': 'Miembro desde',
    'account.lastSignIn': 'Último inicio de sesión',

    'pw.title': 'Cambiar contraseña',
    'pw.current': 'Contraseña actual',
    'pw.new': 'Nueva contraseña',
    'pw.confirm': 'Confirmar nueva contraseña',
    'pw.update': 'Actualizar contraseña',
    'pw.forgotCurrent': '¿Olvidaste tu contraseña actual?',
    'pw.emailLink': 'Enviarme un enlace por correo',
    'pw.invalidNew': 'La nueva contraseña debe tener entre 4 y 16 caracteres, con letras y números.',
    'pw.mismatch': 'Las nuevas contraseñas no coinciden.',
    'pw.same': 'La nueva contraseña debe ser distinta de la actual.',
    'pw.wrongCurrent': 'La contraseña actual es incorrecta.',
    'pw.updated': 'Contraseña actualizada. Se cerró la sesión en los demás dispositivos.',
    'pw.linkSent': 'Enlace enviado a {email}. Revisa tu bandeja de entrada.',

    'footer.text': '© 2026 Daily Cost Tracker. Con tecnología de Supabase y GitHub Pages.'
  }
};

const STORAGE_KEY = 'dc-lang';
const listeners = [];

function detect() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && DICT[saved]) return saved;
  } catch { /* storage blocked: fall through */ }
  return ((typeof navigator !== 'undefined' && navigator.language) || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
}

let lang = detect();

export function getLang() { return lang; }

export function t(key, vars = {}) {
  const s = DICT[lang][key] ?? DICT.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}

export function onLangChange(cb) { listeners.push(cb); }

export function applyTranslations(root = document) {
  document.documentElement.lang = lang;
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  root.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
  });
}

export function setLang(next) {
  if (!DICT[next] || next === lang) return;
  lang = next;
  try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  applyTranslations();
  listeners.forEach((cb) => cb(lang));
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lang]');
    if (btn) setLang(btn.dataset.lang);
  });
}
