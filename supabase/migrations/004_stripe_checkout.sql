-- Atomic Stripe Checkout order creation, inventory reservation, and fulfillment.

alter table public.orders
  add column if not exists checkout_key uuid,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_checkout_url text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stock_reserved boolean not null default false,
  add column if not exists paid_at timestamptz;

create unique index if not exists orders_user_checkout_key_idx
  on public.orders(user_id, checkout_key)
  where checkout_key is not null;

create unique index if not exists orders_stripe_checkout_session_idx
  on public.orders(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index if not exists orders_stripe_payment_intent_idx
  on public.orders(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create or replace function public.create_pending_stripe_order(
  p_user_id uuid,
  p_checkout_key uuid,
  p_email text,
  p_lines jsonb,
  p_shipping_cents integer,
  p_currency text default 'EUR'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_existing_order public.orders%rowtype;
  v_subtotal integer := 0;
  v_line jsonb;
  v_variant record;
  v_quantity integer;
  v_variant_id uuid;
  v_line_count integer;
begin
  if p_user_id is null or not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Invalid customer';
  end if;
  if p_checkout_key is null then
    raise exception 'Missing checkout key';
  end if;
  if p_email is null or position('@' in p_email) < 2 then
    raise exception 'Invalid customer email';
  end if;
  if upper(p_currency) <> 'EUR' then
    raise exception 'Unsupported currency';
  end if;
  if p_shipping_cents is null or p_shipping_cents < 0 then
    raise exception 'Invalid shipping amount';
  end if;
  if jsonb_typeof(p_lines) <> 'array' then
    raise exception 'Invalid cart';
  end if;

  v_line_count := jsonb_array_length(p_lines);
  if v_line_count < 1 or v_line_count > 50 then
    raise exception 'Cart must contain between 1 and 50 lines';
  end if;

  select * into v_existing_order
  from public.orders
  where user_id = p_user_id and checkout_key = p_checkout_key;

  if v_existing_order.id is not null then
    if v_existing_order.stock_reserved or v_existing_order.payment_status = 'paid' then
      return jsonb_build_object('order_id', v_existing_order.id, 'created', false);
    end if;

    -- A cancelled/expired attempt keeps its audit record but no longer owns this cart key.
    update public.orders set checkout_key = null where id = v_existing_order.id;
  end if;

  -- Lock every requested variant in a stable order to prevent overselling and deadlocks.
  perform pv.id
  from public.product_variants pv
  where pv.id in (
    select distinct (line ->> 'variant_id')::uuid
    from jsonb_array_elements(p_lines) as line
  )
  order by pv.id
  for update;

  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    begin
      v_variant_id := (v_line ->> 'variant_id')::uuid;
      v_quantity := (v_line ->> 'quantity')::integer;
    exception when others then
      raise exception 'Invalid cart line';
    end;

    if v_quantity < 1 or v_quantity > 10 then
      raise exception 'Quantity must be between 1 and 10';
    end if;

    select
      pv.id,
      pv.name as variant_name,
      pv.sku,
      pv.stock_quantity,
      coalesce(pv.price_cents, p.price_cents) as unit_price_cents,
      p.name as product_name,
      p.currency,
      p.status
    into v_variant
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = v_variant_id;

    if not found or v_variant.status <> 'active' then
      raise exception 'A cart item is no longer available';
    end if;
    if v_variant.currency <> upper(p_currency) then
      raise exception 'Mixed currencies are not supported';
    end if;
    if v_variant.stock_quantity < v_quantity then
      raise exception 'Insufficient stock for %', v_variant.product_name;
    end if;

    v_subtotal := v_subtotal + (v_variant.unit_price_cents * v_quantity);
  end loop;

  insert into public.orders (
    user_id, email, status, payment_status, currency,
    subtotal_cents, shipping_cents, tax_cents, total_cents,
    shipping_address, payment_provider, checkout_key, stock_reserved
  ) values (
    p_user_id, lower(trim(p_email)), 'pending_payment', 'pending', upper(p_currency),
    v_subtotal, p_shipping_cents, 0, v_subtotal + p_shipping_cents,
    '{}'::jsonb, 'stripe', p_checkout_key, true
  )
  returning id into v_order_id;

  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    v_variant_id := (v_line ->> 'variant_id')::uuid;
    v_quantity := (v_line ->> 'quantity')::integer;

    select
      pv.name as variant_name,
      pv.sku,
      coalesce(pv.price_cents, p.price_cents) as unit_price_cents,
      p.name as product_name
    into v_variant
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = v_variant_id;

    update public.product_variants
    set stock_quantity = stock_quantity - v_quantity
    where id = v_variant_id and stock_quantity >= v_quantity;

    if not found then
      raise exception 'An item sold out during checkout';
    end if;

    insert into public.order_items (
      order_id, product_variant_id, product_name, variant_name,
      sku, unit_price_cents, quantity
    ) values (
      v_order_id, v_variant_id, v_variant.product_name, v_variant.variant_name,
      v_variant.sku, v_variant.unit_price_cents, v_quantity
    );
  end loop;

  return jsonb_build_object('order_id', v_order_id, 'created', true);
exception
  when unique_violation then
    select id into v_order_id
    from public.orders
    where user_id = p_user_id and checkout_key = p_checkout_key;
    if v_order_id is not null then
      return jsonb_build_object('order_id', v_order_id, 'created', false);
    end if;
    raise;
end;
$$;

create or replace function public.release_stripe_order_reservation(
  p_order_id uuid,
  p_checkout_session_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    return false;
  end if;
  if p_checkout_session_id is not null
     and v_order.stripe_checkout_session_id is distinct from p_checkout_session_id then
    return false;
  end if;
  if not v_order.stock_reserved or v_order.payment_status = 'paid' then
    return true;
  end if;

  for v_item in
    select product_variant_id, quantity
    from public.order_items
    where order_id = p_order_id and product_variant_id is not null
  loop
    update public.product_variants
    set stock_quantity = stock_quantity + v_item.quantity
    where id = v_item.product_variant_id;
  end loop;

  update public.orders
  set status = 'cancelled', payment_status = 'failed', stock_reserved = false,
      stripe_checkout_url = null
  where id = p_order_id;
  return true;
end;
$$;

create or replace function public.complete_stripe_order(
  p_order_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_email text,
  p_shipping_address jsonb,
  p_billing_address jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.payment_provider <> 'stripe' then
    return false;
  end if;
  if v_order.stripe_checkout_session_id is distinct from p_checkout_session_id then
    return false;
  end if;
  if v_order.payment_status = 'paid' then
    return true;
  end if;
  if not v_order.stock_reserved then
    return false;
  end if;

  update public.orders
  set status = 'paid', payment_status = 'paid',
      payment_reference = coalesce(nullif(p_payment_intent_id, ''), p_checkout_session_id),
      stripe_payment_intent_id = nullif(p_payment_intent_id, ''),
      email = coalesce(nullif(lower(trim(p_email)), ''), email),
      shipping_address = coalesce(p_shipping_address, '{}'::jsonb),
      billing_address = p_billing_address,
      stock_reserved = false, paid_at = now(), stripe_checkout_url = null
  where id = p_order_id;
  return true;
end;
$$;

revoke all on function public.create_pending_stripe_order(uuid, uuid, text, jsonb, integer, text) from public, anon, authenticated;
revoke all on function public.release_stripe_order_reservation(uuid, text) from public, anon, authenticated;
revoke all on function public.complete_stripe_order(uuid, text, text, text, jsonb, jsonb) from public, anon, authenticated;

grant execute on function public.create_pending_stripe_order(uuid, uuid, text, jsonb, integer, text) to service_role;
grant execute on function public.release_stripe_order_reservation(uuid, text) to service_role;
grant execute on function public.complete_stripe_order(uuid, text, text, text, jsonb, jsonb) to service_role;
