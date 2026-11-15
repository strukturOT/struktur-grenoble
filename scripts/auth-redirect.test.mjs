import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/auth/authRedirect.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { adminSignInPath, confirmationRedirectUrl, safeAccountNext } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('admin sign-in preserves the product selection, other filters, and fragment together', () => {
  const location = { pathname: '/admin/catalogue', search: '?produit=stable-product-id&statut=brouillon', hash: '#identite' };
  const signIn = new URL(adminSignInPath(location), 'https://strukturkultur.fr');
  assert.equal(signIn.pathname, '/compte');
  assert.equal(signIn.searchParams.get('next'), '/admin/catalogue?produit=stable-product-id&statut=brouillon#identite');
});

test('plain admin routes and email-confirmation returns remain inside the storefront', () => {
  assert.equal(new URL(adminSignInPath({ pathname: '/admin' }), 'https://strukturkultur.fr').searchParams.get('next'), '/admin');
  const requested = '/admin/catalogue?produit=stable-id#identite';
  assert.equal(new URL(confirmationRedirectUrl('https://strukturkultur.fr', requested)).searchParams.get('next'), requested);
});

test('return paths reject external, protocol-relative, and malformed destinations', () => {
  for (const input of ['https://other.example/admin', '//other.example/admin', '/\\other.example', '/admin\n/catalogue', 'javascript:alert(1)']) {
    assert.equal(safeAccountNext(input), '/compte');
  }
});
