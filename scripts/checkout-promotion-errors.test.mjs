import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const source = await fs.readFile(new URL('../supabase/functions/_shared/checkout-errors.ts', import.meta.url), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module:ts.ModuleKind.ESNext, target:ts.ScriptTarget.ES2022 } }).outputText;
const { checkoutOrderError } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);

test('plain PostgREST stale-price objects return the safe refresh message and HTTP409', () => {
  const message='Les prix ont changé. Actualisez le panier avant de payer.';
  assert.deepEqual(checkoutOrderError({code:'P0001',message,details:null,hint:null}),{message,status:409});
});
test('malformed expected prices return HTTP400 while arbitrary database details remain private', () => {
  assert.deepEqual(checkoutOrderError({message:'Prix attendu invalide.'}),{message:'Prix attendu invalide.',status:400});
  assert.equal(checkoutOrderError({message:'private table or SQL detail',code:'secret'}),null);
  assert.equal(checkoutOrderError(new Error('private exception')),null);
  assert.equal(checkoutOrderError(null),null);
});
