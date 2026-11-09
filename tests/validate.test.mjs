import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail, isValidPassword, authErrorKey } from '../js/validate.js';

test('isValidPassword', () => {
  assert.equal(isValidPassword('ab12'), true);
  assert.equal(isValidPassword('ab1!'), true);
  assert.equal(isValidPassword('abcd1234!? ñ'), true);
  assert.equal(isValidPassword('p@ss-w0rd_#'), true);
  assert.equal(isValidPassword('ab1'), false);
  assert.equal(isValidPassword('abcdefgh'), false);
  assert.equal(isValidPassword('12345678'), false);
  assert.equal(isValidPassword('!!!!1111'), false);
  assert.equal(isValidPassword('a1' + 'x'.repeat(14)), true);
  assert.equal(isValidPassword('a1' + 'x'.repeat(15)), false);
});
test('isValidEmail', () => {
  assert.equal(isValidEmail('you@example.com'), true);
  assert.equal(isValidEmail('you@example'), false);
  assert.equal(isValidEmail('a b@example.com'), false);
});
test('authErrorKey', () => {
  assert.equal(authErrorKey({ code: 'invalid_credentials' }), 'err.invalidLogin');
  assert.equal(authErrorKey({ message: 'Invalid login credentials' }), 'err.invalidLogin');
  assert.equal(authErrorKey({ message: 'User already registered' }), 'err.alreadyRegistered');
  assert.equal(authErrorKey({ code: 'email_not_confirmed' }), 'err.emailNotConfirmed');
  assert.equal(authErrorKey({ message: 'Email rate limit exceeded' }), 'err.rateLimit');
  assert.equal(authErrorKey({ message: 'TypeError: Failed to fetch' }), 'err.network');
  assert.equal(authErrorKey({ message: 'Something new' }), null);
  assert.equal(authErrorKey({}), null);
});
