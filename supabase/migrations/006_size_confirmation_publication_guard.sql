-- Keep unresolved physical sizes unpublished even when an older admin client is open.
create or replace function public.guard_product_size_confirmation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' and exists (
    select 1
    from public.product_variants variant
    where variant.product_id = new.id
      and variant.stock_quantity > 0
      and variant.attributes @> '{"size_confirmation_required": true}'::jsonb
  ) then
    raise exception using
      errcode = '23514',
      message = 'Pointures à confirmer : renseignez les tailles réelles et confirmez la fiche avant de publier.';
  end if;
  return new;
end;
$$;

create or replace function public.guard_variant_size_confirmation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_status public.product_status;
begin
  if new.stock_quantity > 0
    and new.attributes @> '{"size_confirmation_required": true}'::jsonb then
    -- Serialize a pending-size write with concurrent publication of its parent.
    select product.status into parent_status
    from public.products product
    where product.id = new.product_id
    for share;

    if parent_status = 'active' then
      raise exception using
        errcode = '23514',
        message = 'Pointures à confirmer : confirmez les tailles avant d’ajouter du stock à un produit en ligne.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_guard_size_confirmation on public.products;
create trigger products_guard_size_confirmation
before insert or update of status on public.products
for each row execute function public.guard_product_size_confirmation();

drop trigger if exists variants_guard_size_confirmation on public.product_variants;
create trigger variants_guard_size_confirmation
before insert or update of product_id, stock_quantity, attributes on public.product_variants
for each row execute function public.guard_variant_size_confirmation();
