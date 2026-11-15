/** Manual integration check. Set PGLITE_MODULE_PATH to an installed PGlite module; no live DB is used. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

if (!process.env.PGLITE_MODULE_PATH) throw new Error('Set PGLITE_MODULE_PATH to run the isolated PostgreSQL promotion checks.');
const { PGlite } = await import(process.env.PGLITE_MODULE_PATH);
const repo = new URL('../', import.meta.url);
const read = (path) => fs.readFile(new URL(path, repo), 'utf8');
const foundation = (await read('supabase/migrations/001_commerce_foundation.sql'))
  .split('create or replace function public.handle_new_user()')[0]
  .replace('create extension if not exists pgcrypto;', '');
const checkout = await read('supabase/migrations/004_stripe_checkout.sql');
const migration = await read('supabase/migrations/007_product_promotions.sql');
const db = new PGlite();
const checks = [];
const userId = crypto.randomUUID();
const productId = crypto.randomUUID();
const variantId = crypto.randomUUID();

async function order(lines, shipping = 0, key = crypto.randomUUID()) {
  const result = await db.query("select public.create_pending_stripe_order($1,$2,'fixture@example.invalid',$3::jsonb,$4,'EUR') as result", [userId, key, JSON.stringify(lines), shipping]);
  return { ...result.rows[0].result, checkoutKey: key };
}
async function orderSnapshot(id) {
  const result = await db.query('select subtotal_cents,shipping_cents,total_cents,(select sum(unit_price_cents*quantity)::integer from public.order_items where order_id=orders.id)as item_total from public.orders where id=$1', [id]);
  return result.rows[0];
}
async function stock() { return (await db.query('select stock_quantity from public.product_variants where id=$1', [variantId])).rows[0].stock_quantity; }
try {
  await db.exec('create schema auth;create table auth.users(id uuid primary key);create role anon;create role authenticated;create role service_role;');
  await db.exec(foundation);
  await db.exec(checkout);
  await db.query('insert into auth.users(id)values($1)', [userId]);
  await db.query("insert into public.products(id,name,slug,brand,price_cents,status)values($1,'Existing fixture','existing-promotion-fixture','Fixture',6500,'active')", [productId]);
  await db.query("insert into public.product_variants(id,product_id,name,sku,price_cents,stock_quantity,attributes)values($1,$2,'M','PROMO-FIXTURE-M',null,30,'{}')", [variantId, productId]);
  const prior = (await db.query('select to_jsonb(p)as product from public.products p where id=$1', [productId])).rows[0].product;
  await db.exec(migration); await db.exec(migration);
  const after = (await db.query('select to_jsonb(p)as product from public.products p where id=$1', [productId])).rows[0].product;
  assert.equal(after.promotion_enabled, false);
  for (const [key, value] of Object.entries(prior)) assert.deepEqual(after[key], value);
  checks.push('additive migration is idempotent and preserves existing catalogue with promotions disabled');

  const at = '2026-11-15T12:00:00Z';
  const cases = [
    [6500,'percentage',20,false,null,null,at,6500], [6500,'percentage',20,true,null,null,at,5200],
    [101,'percentage',50,true,null,null,at,51], [1,'percentage',99,true,null,null,at,1],
    [6500,'fixed_price',5000,true,null,null,at,5000], [6500,'fixed_price',6500,true,null,null,at,6500],
    [6500,'fixed_price',7000,true,null,null,at,6500], [6500,'percentage',100,true,null,null,at,6500],
    [6500,'percentage',0,true,null,null,at,6500], [6500,'invalid',20,true,null,null,at,6500],
    [6500,'percentage',20,true,'2026-11-16T00:00:00Z',null,at,6500],
    [6500,'percentage',20,true,at,null,at,5200], [6500,'percentage',20,true,null,at,at,6500],
    [6500,'percentage',20,true,'2026-11-16T00:00:00Z','2026-11-14T00:00:00Z',at,6500],
    [6500,'percentage',20,true,null,null,null,6500], [null,'percentage',20,true,null,null,at,null],
    [6500,'percentage',20,true,'infinity',null,at,6500], [6500,'percentage',20,true,null,'infinity',at,6500],
    [6500,'percentage',20,true,null,null,'infinity',6500],
  ];
  for (const row of cases) {
    const result = await db.query('select public.effective_unit_price_cents($1,$2,$3,$4,$5,$6,$7)as price', row.slice(0,7));
    assert.equal(result.rows[0].price, row[7]);
  }
  checks.push('19 integer-cent rounding, minimum price, fixed-price and finite scheduling boundaries agree');
  await assert.rejects(db.query("update public.products set promotion_enabled=true,promotion_type='percentage',promotion_value=null where id=$1", [productId]), /products_promotion_definition_check/);
  await assert.rejects(db.query("update public.products set promotion_starts_at='infinity'where id=$1",[productId]),/products_promotion_finite_dates_check/);
  const acl = await db.query("select has_function_privilege('anon','public.create_pending_stripe_order(uuid,uuid,text,jsonb,integer,text)','execute')as anon,has_function_privilege('authenticated','public.create_pending_stripe_order(uuid,uuid,text,jsonb,integer,text)','execute')as authenticated,has_function_privilege('service_role','public.create_pending_stripe_order(uuid,uuid,text,jsonb,integer,text)','execute')as service");
  assert.deepEqual(acl.rows, [{ anon:false, authenticated:false, service:true }]);
  checks.push('invalid enabled definitions are rejected and order RPC remains service-role only');

  const original = await order([{ variant_id:variantId,quantity:2 }], 500);
  assert.deepEqual(await orderSnapshot(original.order_id), { subtotal_cents:13000,shipping_cents:500,total_cents:13500,item_total:13000 });
  assert.equal(await stock(),28);
  checks.push('old clients without expected prices retain compatible atomic reservations');
  await db.query("update public.products set promotion_type='percentage',promotion_value=20,promotion_enabled=true where id=$1", [productId]);
  const resumed = await order([{ variant_id:variantId,quantity:2,expected_unit_price_cents:5200 }],700,original.checkoutKey);
  assert.equal(resumed.order_id,original.order_id);assert.equal(resumed.created,false);
  assert.equal((await orderSnapshot(original.order_id)).total_cents,13500);assert.equal(await stock(),28);
  checks.push('resumed attempts keep their original item and shipping amounts after promotion changes');
  const beforeOrders = (await db.query('select count(*)::integer n from public.orders')).rows[0].n;
  await assert.rejects(order([{ variant_id:variantId,quantity:1,expected_unit_price_cents:6500 }]), /prix ont changé/);
  await assert.rejects(order([{ variant_id:variantId,quantity:1,expected_unit_price_cents:null }]), /Prix attendu invalide/);
  await assert.rejects(order([{ variant_id:variantId,quantity:1,expected_unit_price_cents:5200.5 }]), /Prix attendu invalide/);
  await assert.rejects(order([{ variant_id:variantId,quantity:null,expected_unit_price_cents:5200 }]), /Quantity must/);
  assert.equal((await db.query('select count(*)::integer n from public.orders')).rows[0].n,beforeOrders);assert.equal(await stock(),28);
  checks.push('stale or malformed expected prices create no order and reserve no inventory');

  // Force a campaign edit exactly between subtotal calculation and line-item insertion.
  await db.exec(`create function public.promo_fixture_change_price()returns trigger language plpgsql as $$begin update public.products set promotion_value=90 where id='${productId}';return new;end$$;create trigger promo_fixture_order_price before insert on public.orders for each row execute function public.promo_fixture_change_price();`);
  const frozen = await order([{ variant_id:variantId,quantity:2,expected_unit_price_cents:5200 }],200);
  assert.deepEqual(await orderSnapshot(frozen.order_id),{subtotal_cents:10400,shipping_cents:200,total_cents:10600,item_total:10400});
  await db.exec('drop trigger promo_fixture_order_price on public.orders;drop function public.promo_fixture_change_price();');
  checks.push('mid-order campaign edits cannot change frozen item prices or separate totals from line items');
  await db.query('select public.release_stripe_order_reservation($1,null)',[frozen.order_id]);assert.equal(await stock(),28);
  checks.push('existing reservation release restores discounted-order stock without repricing');
  await db.query("update public.products set promotion_type='fixed_price',promotion_value=8000 where id=$1",[productId]);
  const variant2=crypto.randomUUID();
  await db.query("insert into public.product_variants(id,product_id,name,sku,price_cents,stock_quantity)values($1,$2,'L','PROMO-FIXTURE-L',10000,3)",[variant2,productId]);
  const mixed=await order([{variant_id:variantId,quantity:1,expected_unit_price_cents:6500},{variant_id:variant2,quantity:1,expected_unit_price_cents:8000}]);
  assert.deepEqual(await orderSnapshot(mixed.order_id),{subtotal_cents:14500,shipping_cents:0,total_cents:14500,item_total:14500});
  const before=await stock();const count=(await db.query('select count(*)::integer n from public.orders')).rows[0].n;
  await assert.rejects(order([{variant_id:variant2,quantity:3,expected_unit_price_cents:8000}]),/Insufficient stock/);
  assert.equal(await stock(),before);assert.equal((await db.query('select count(*)::integer n from public.orders')).rows[0].n,count);
  checks.push('fixed prices respect each variant base and insufficient stock rolls back without extra orders');
  const report={ok:true,engine:'PGlite PostgreSQL',remote_calls:false,real_payments:false,checks};
  if(process.argv[2])await fs.writeFile(process.argv[2],JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
} catch(error) { console.error(JSON.stringify({ok:false,error:error.message,checks},null,2));process.exitCode=1; }
await db.close();
