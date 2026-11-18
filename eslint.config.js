// ESLint flat config, dependency-free (no package.json). Run: npx --yes eslint@9 .
const browser = Object.fromEntries(
  ['window', 'document', 'navigator', 'location', 'history', 'localStorage', 'sessionStorage', 'console',
    'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame',
    'fetch', 'URL', 'URLSearchParams', 'Blob', 'FormData', 'Event', 'CustomEvent', 'AbortController',
    'Intl', 'Node', 'HTMLElement', 'matchMedia', 'getComputedStyle', 'MutationObserver', 'IntersectionObserver',
    'ResizeObserver', 'Image', 'TextEncoder', 'TextDecoder', 'crypto', 'structuredClone', 'queueMicrotask',
    'alert', 'confirm', 'prompt', 'self', 'caches', 'clients', 'registration', 'skipWaiting', 'addEventListener',
    'atob', 'btoa', 'performance', 'screen', 'Notification', 'BroadcastChannel', 'CSS', 'Request', 'Response', 'Headers',
    'HTMLButtonElement', 'HTMLInputElement', 'HTMLFormElement', 'HTMLSelectElement', 'Element', 'KeyboardEvent'].map((n) => [n, 'readonly'])
);
const node = Object.fromEntries(
  ['process', 'console', 'Buffer', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate',
    'URL', 'URLSearchParams', 'TextEncoder', 'TextDecoder', 'AbortController', 'fetch', 'structuredClone',
    'queueMicrotask', 'performance'].map((n) => [n, 'readonly'])
);

const rules = {
  'no-undef': 'error',
  'no-unused-vars': ['warn', { args: 'after-used', argsIgnorePattern: '^_', caughtErrors: 'none' }],
  'no-const-assign': 'error',
  'no-dupe-keys': 'error',
  'no-dupe-args': 'error',
  'no-duplicate-case': 'error',
  'no-unreachable': 'error',
  'no-redeclare': 'error',
  'no-self-assign': 'error',
  'no-unsafe-finally': 'error',
  'no-unsafe-negation': 'error',
  'no-empty': ['error', { allowEmptyCatch: true }],
  'use-isnan': 'error',
  'valid-typeof': 'error',
  'eqeqeq': ['error', 'always', { null: 'ignore' }],
  'no-var': 'error',
  'prefer-const': 'warn'
};

export default [
  { ignores: ['js/vendor/**', '_site/**', 'node_modules/**', 'tests/e2e/node_modules/**', 'coverage/**'] },
  { files: ['js/**/*.js', 'sw.js'], languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: browser }, rules },
  { files: ['tests/**/*.mjs', 'eslint.config.js'], languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...node, ...browser } }, rules }
];
