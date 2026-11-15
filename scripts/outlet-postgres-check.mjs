/** Isolated PostgreSQL integration checks; no live catalogue or order is used. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

if (!process.env.PGLITE_MODULE_PATH) throw new Error('Set PGLITE_MODULE_PATH to run the isolated Outlet checks.');
const { PGlite } = await import(process.env.PGLITE_MODULE_PATH);
const read = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const source = await read('supabase/migrations/001_commerce_foundation.sql');
const foundation = source
  .split('create or replace function public.handle_new_user()')[0]
  .replace('create extension if not exists pgcrypto;', '');
const checkout = await read('supabase/migrations/004_stripe_checkout.sql');
const promotions = await read('supabase/migrations/007_product_promotions.sql');
const migration = await read('supabase/migrations/008_outlet_selection.sql');
const reservedId = '741d7a60-2e81-4eb4-9c9c-b4ac9555175d';
const db = new PGlite();
const checks = [];
async function setup(database) {
  await database.exec('create schema auth;create table auth.users(id uuid primary key);create role anon;create role authenticated;create role service_role;');
  await database.exec(foundation);
  await database.exec(checkout);
  await database.exec(promotions);
  await database.exec(`create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
  await database.exec('create or replace function public.is_admin()'+source.split('create or replace function public.is_admin()')[1].split('create or replace function public.protect_profile_role()')[0]);
  await database.exec(`grant usage on schema public,auth to anon,authenticated;
    grant select,update on public.products to authenticated;
    alter table public.products enable row level security;
    create policy "fixture admin reads" on public.products for select to authenticated using(public.is_admin());
    create policy "fixture admin updates" on public.products for update to authenticated using(public.is_admin())with check(public.is_admin());`);
}
async function products() { return (await db.query('select to_jsonb(p)as row from public.products p order by slug')).rows.map((row) => row.row); }
try {
  await setup(db);
  const brandId = crypto.randomUUID();
  const legacyId = crypto.randomUUID();
  const normalId = crypto.randomUUID();
  await db.query("insert into public.categories(id,name,slug,description,position)values($1,'Outlet existant','outlet','Texte marchand',9),($2,'Marque','fixture-brand','Marque conservée',1)",[reservedId,brandId]);
  await db.query("insert into public.products(id,name,slug,brand,category_id,price_cents,status,promotion_type,promotion_value,promotion_enabled,updated_at)values($1,'Legacy','fixture-legacy','Fixture',$2,15000,'active','percentage',20,true,'2026-10-01'),($3,'Normal','fixture-normal','Fixture',$4,8000,'draft',null,null,false,'2026-10-01')",[legacyId,reservedId,normalId,brandId]);
  await db.query("insert into public.product_variants(product_id,name,sku,price_cents,stock_quantity,attributes)values($1,'L','OUTLET-LEGACY-L',15000,3,'{\"source_reference\":\"unchanged\"}'),($2,'M','OUTLET-NORMAL-M',null,4,'{}')",[legacyId,normalId]);
  const before = await products();
  const categoriesBefore = (await db.query('select to_jsonb(c)as row from public.categories c order by id')).rows;
  const variantsBefore = (await db.query('select to_jsonb(v)as row from public.product_variants v order by sku')).rows;
  await db.exec(migration);
  const after = await products();
  for (let index=0;index<before.length;index++) {
    for (const [key,value] of Object.entries(before[index])) {
      if (key==='updated_at' && before[index].id===legacyId) continue;
      assert.deepEqual(after[index][key],value,`Preserve ${key}`);
    }
    assert.equal(after[index].is_outlet,before[index].id===legacyId);
  }
  assert.deepEqual((await db.query('select to_jsonb(c)as row from public.categories c order by id')).rows,categoriesBefore);
  assert.deepEqual((await db.query('select to_jsonb(v)as row from public.product_variants v order by sku')).rows,variantsBefore);
  checks.push('first migration backfills only legacy Outlet products and preserves category, brand, prices, promotions and all variants');

  await db.query('update public.products set is_outlet=false where id=$1',[legacyId]);
  await db.exec(migration);
  assert.equal((await db.query('select is_outlet from public.products where id=$1',[legacyId])).rows[0].is_outlet,false);
  await db.query('update public.products set category_id=$1 where id=$2',[reservedId,normalId]);
  assert.equal((await db.query('select is_outlet from public.products where id=$1',[normalId])).rows[0].is_outlet,false);
  checks.push('explicit removal stays false on migration rerun and legacy primary category cannot override the selection flag');

  await assert.rejects(db.query('delete from public.categories where id=$1',[reservedId]),/ne peut pas être supprimée/);
  await assert.rejects(db.query("update public.categories set slug='renamed-outlet'where id=$1",[reservedId]),/ne peut pas être modifié/);
  await db.query("update public.categories set name='Outlet renommé',description='Texte modifié',position=8 where id=$1",[reservedId]);
  assert.equal((await db.query('select slug from public.categories where id=$1',[reservedId])).rows[0].slug,'outlet');
  await db.query("update public.categories set slug='fixture-brand-renamed'where id=$1",[brandId]);
  await db.query('delete from public.categories where id=$1',[brandId]);
  checks.push('reserved Outlet slug cannot be renamed or deleted; merchant copy edits and other category operations remain allowed');

  await db.query("insert into public.products(name,slug,price_cents)values('New','outlet-new-default-fixture',1000)");
  assert.equal((await db.query("select is_outlet from public.products where slug='outlet-new-default-fixture'")).rows[0].is_outlet,false);
  await assert.rejects(db.query('update public.products set is_outlet=null where id=$1',[legacyId]),/not-null/);
  const priorToggle = (await db.query('select to_jsonb(p)as row from public.products p where id=$1',[normalId])).rows[0].row;
  await db.query('update public.products set is_outlet=true where id=$1',[normalId]);
  const afterToggle = (await db.query('select to_jsonb(p)as row from public.products p where id=$1',[normalId])).rows[0].row;
  for (const [key,value]of Object.entries(priorToggle)) if(!['is_outlet','updated_at'].includes(key)) assert.deepEqual(afterToggle[key],value);
  assert.equal((await db.query('select count(*)::integer n from public.orders')).rows[0].n,0);
  checks.push('new products default false and a selection-only update changes no commerce fields or orders');

  const adminId=crypto.randomUUID(),customerId=crypto.randomUUID();
  await db.query('insert into auth.users(id)values($1),($2)',[adminId,customerId]);
  await db.query("insert into public.profiles(id,role)values($1,'admin'),($2,'customer')",[adminId,customerId]);
  const permissions=(await db.query("select has_function_privilege('anon','public.set_products_outlet(uuid[],boolean)','execute')as anon,has_function_privilege('authenticated','public.set_products_outlet(uuid[],boolean)','execute')as authenticated,(select prosecdef from pg_proc where oid='public.set_products_outlet(uuid[],boolean)'::regprocedure)as security_definer")).rows[0];
  assert.deepEqual(permissions,{anon:false,authenticated:true,security_definer:false});
  await db.exec('set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[customerId]);
  await assert.rejects(db.query('select public.set_products_outlet($1,false)',[[legacyId]]),/Seul un administrateur/);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[adminId]);
  const rpcBefore=await products();
  await assert.rejects(db.query('select public.set_products_outlet($1,true)',[[legacyId,crypto.randomUUID()]]),/introuvables/);
  assert.deepEqual(await products(),rpcBefore);
  for(const ids of [[],null,[null],Array(1001).fill(legacyId)]) await assert.rejects(db.query('select public.set_products_outlet($1,true)',[ids]),/Sélection Outlet invalide/);
  await assert.rejects(db.query('select public.set_products_outlet($1,null)',[[legacyId]]),/Sélection Outlet invalide/);
  const toggled=(await db.query('select public.set_products_outlet($1,false)as count',[[legacyId,normalId,normalId]])).rows[0].count;
  assert.equal(toggled,2);
  const rpcAfter=await products();
  for(let index=0;index<rpcBefore.length;index++) for(const[key,value]of Object.entries(rpcBefore[index])) if(!['is_outlet','updated_at'].includes(key)) assert.deepEqual(rpcAfter[index][key],value);
  assert.equal(rpcAfter.filter((row)=>[legacyId,normalId].includes(row.id)).every((row)=>row.is_outlet===false),true);
  await db.exec('reset role');
  assert.deepEqual((await db.query('select to_jsonb(v)as row from public.product_variants v order by sku')).rows,variantsBefore);
  checks.push('bulk RPC is invoker-only, anonymous execution denied, customers refused, duplicates counted once and missing/invalid IDs roll back every update');

  const fresh = new PGlite();
  try {
    await setup(fresh);
    await fresh.exec('begin');await fresh.exec(migration);
    assert.equal((await fresh.query("select id from public.categories where slug='outlet'")).rows[0].id,reservedId);
    await fresh.exec('rollback');
    assert.equal((await fresh.query("select count(*)::integer n from information_schema.columns where table_schema='public'and table_name='products'and column_name='is_outlet'")).rows[0].n,0);
    assert.equal((await fresh.query("select count(*)::integer n from public.categories where slug='outlet'")).rows[0].n,0);
    checks.push('missing Outlet category is seeded with stable UUID and all schema/seed changes roll back atomically');
    await fresh.query("insert into public.categories(id,name,slug)values($1,'Conflict','fixture-conflict')",[reservedId]);
    await fresh.exec('begin');
    await assert.rejects(fresh.exec(migration),/identifiant réservé/);
    await fresh.exec('rollback');
    assert.equal((await fresh.query("select count(*)::integer n from information_schema.columns where table_schema='public'and table_name='products'and column_name='is_outlet'")).rows[0].n,0);
    checks.push('reserved UUID reuse aborts safely without adding a partial selection column');
  } finally { await fresh.close(); }
  const report={ok:true,engine:'PGlite PostgreSQL',remote_calls:false,order_mutations:false,checks};
  if(process.argv[2])await fs.writeFile(process.argv[2],JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}catch(error){console.error(JSON.stringify({ok:false,error:error.message,checks},null,2));process.exitCode=1;}
await db.close();
