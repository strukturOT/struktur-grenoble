-- Product-wide promotions are opt-in. Existing base prices and inventory remain unchanged.
alter table public.products
  add column if not exists promotion_type text,
  add column if not exists promotion_value integer,
  add column if not exists promotion_enabled boolean not null default false,
  add column if not exists promotion_starts_at timestamptz,
  add column if not exists promotion_ends_at timestamptz;

do $constraints$
begin
  if not exists(select 1 from pg_constraint where conrelid='public.products'::regclass and conname='products_promotion_definition_check') then
    alter table public.products add constraint products_promotion_definition_check check (coalesce(
      (
      (promotion_type is null and promotion_value is null and not promotion_enabled)
      or (promotion_type='percentage' and promotion_value between 1 and 99)
      or (promotion_type='fixed_price' and promotion_value > 0)
      ), false)
    );
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.products'::regclass and conname='products_promotion_dates_check') then
    alter table public.products add constraint products_promotion_dates_check check (
      promotion_starts_at is null or promotion_ends_at is null or promotion_ends_at > promotion_starts_at
    );
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.products'::regclass and conname='products_promotion_finite_dates_check') then
    alter table public.products add constraint products_promotion_finite_dates_check check (
      (promotion_starts_at is null or isfinite(promotion_starts_at))
      and (promotion_ends_at is null or isfinite(promotion_ends_at))
    );
  end if;
end $constraints$;

-- Pure integer-cent pricing, with an explicit shared checkout timestamp.
create or replace function public.effective_unit_price_cents(
  p_base integer,
  p_type text,
  p_value integer,
  p_enabled boolean,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_at timestamptz default transaction_timestamp()
)
returns integer
language sql
immutable
parallel safe
set search_path = public
as $$
  select case
    when p_base is null or p_base < 1 or p_enabled is distinct from true or p_at is null then p_base
    when not isfinite(p_at) or (p_starts_at is not null and not isfinite(p_starts_at)) or (p_ends_at is not null and not isfinite(p_ends_at)) then p_base
    when p_starts_at is not null and p_ends_at is not null and p_ends_at <= p_starts_at then p_base
    when p_starts_at is not null and p_at < p_starts_at then p_base
    when p_ends_at is not null and p_at >= p_ends_at then p_base
    when p_type='percentage' and p_value between 1 and 99 then greatest(1,round(p_base::numeric*(100-p_value)/100)::integer)
    when p_type='fixed_price' and p_value > 0 and p_value < p_base then p_value
    else p_base
  end;
$$;

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
  v_priced_lines jsonb := '[]'::jsonb;
  v_priced_line jsonb;
  v_price_at timestamptz := transaction_timestamp();
  v_expected_price numeric;
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

    if v_quantity is null or v_quantity < 1 or v_quantity > 10 then
      raise exception 'Quantity must be between 1 and 10';
    end if;

    select
      pv.id,
      pv.name as variant_name,
      pv.sku,
      pv.stock_quantity,
      public.effective_unit_price_cents(coalesce(pv.price_cents, p.price_cents), p.promotion_type, p.promotion_value, p.promotion_enabled, p.promotion_starts_at, p.promotion_ends_at, v_price_at) as unit_price_cents,
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

    if v_variant.unit_price_cents is null or v_variant.unit_price_cents < 1 then
      raise exception 'Le prix de cet article est indisponible. Actualisez le panier.';
    end if;
    if v_line ? 'expected_unit_price_cents' then
      if jsonb_typeof(v_line -> 'expected_unit_price_cents') <> 'number' then
        raise exception 'Prix attendu invalide.';
      end if;
      v_expected_price := (v_line ->> 'expected_unit_price_cents')::numeric;
      if v_expected_price < 1 or v_expected_price > 2147483647 or v_expected_price <> trunc(v_expected_price) then
        raise exception 'Prix attendu invalide.';
      end if;
      if v_expected_price <> v_variant.unit_price_cents then
        raise exception 'Les prix ont changé. Actualisez le panier avant de payer.';
      end if;
    end if;

    v_subtotal := v_subtotal + (v_variant.unit_price_cents * v_quantity);
    -- Freeze each price once. An admin edit cannot separate the subtotal from order items.
    v_priced_lines := v_priced_lines || jsonb_build_array(jsonb_build_object(
      'variant_id', v_variant_id, 'quantity', v_quantity,
      'unit_price_cents', v_variant.unit_price_cents,
      'product_name', v_variant.product_name, 'variant_name', v_variant.variant_name,
      'sku', v_variant.sku
    ));
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

  for v_priced_line in select value from jsonb_array_elements(v_priced_lines)
  loop
    v_variant_id := (v_priced_line ->> 'variant_id')::uuid;
    v_quantity := (v_priced_line ->> 'quantity')::integer;

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
      v_order_id, v_variant_id, v_priced_line ->> 'product_name', v_priced_line ->> 'variant_name',
      v_priced_line ->> 'sku', (v_priced_line ->> 'unit_price_cents')::integer, v_quantity
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

-- Keep order creation server-only; the pure pricing function has no database side effects.
revoke all on function public.create_pending_stripe_order(uuid, uuid, text, jsonb, integer, text) from public, anon, authenticated;
grant execute on function public.create_pending_stripe_order(uuid, uuid, text, jsonb, integer, text) to service_role;
