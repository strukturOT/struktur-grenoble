-- Outlet is an independent selection; products retain their brand and category.
-- Keep the collection URL available even when its selection is empty.
do $outlet_category$
begin
  if exists (
    select 1 from public.categories
    where id = '741d7a60-2e81-4eb4-9c9c-b4ac9555175d'
      and slug <> 'outlet'
  ) then
    raise exception 'L’identifiant réservé à la collection Outlet est déjà utilisé.';
  end if;

  insert into public.categories (id, name, slug, description, position)
  select '741d7a60-2e81-4eb4-9c9c-b4ac9555175d', 'Outlet', 'outlet',
    'Dernières pièces et sélections des collections précédentes.', 12
  where not exists (select 1 from public.categories where slug = 'outlet')
  on conflict (slug) do nothing;
end;
$outlet_category$;

-- Backfill only once. A later explicit false must remain authoritative even if
-- the product still has the legacy Outlet category as its primary category.
do $outlet_selection$
declare
  v_backfill boolean := not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products'
      and column_name = 'is_outlet'
  );
begin
  alter table public.products
    add column if not exists is_outlet boolean not null default false;

  if v_backfill then
    update public.products p
    set is_outlet = true
    from public.categories c
    where p.category_id = c.id and c.slug = 'outlet';
  end if;
end;
$outlet_selection$;

create or replace function public.protect_outlet_category()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if old.slug = 'outlet' then
    if tg_op = 'DELETE' then
      raise exception 'La collection Outlet est réservée et ne peut pas être supprimée. Gérez sa sélection dans le catalogue.';
    elsif new.slug is distinct from old.slug then
      raise exception 'Le lien de la collection Outlet est réservé et ne peut pas être modifié.';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$;

drop trigger if exists categories_protect_outlet on public.categories;
create trigger categories_protect_outlet
before delete or update of slug on public.categories
for each row execute function public.protect_outlet_category();

-- One request keeps a bulk selection atomic without a long URL or partial batches.
create or replace function public.set_products_outlet(
  p_product_ids uuid[],
  p_is_outlet boolean
)
returns integer
language plpgsql
security invoker
set search_path = public
as $function$
declare
  v_ids uuid[];
  v_updated integer;
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Seul un administrateur peut gérer la sélection Outlet.' using errcode = '42501';
  end if;
  if p_is_outlet is null or p_product_ids is null
    or cardinality(p_product_ids) < 1 or cardinality(p_product_ids) > 1000
    or array_position(p_product_ids, null) is not null then
    raise exception 'Sélection Outlet invalide : choisissez entre 1 et 1 000 fiches valides.';
  end if;

  v_ids := array(select distinct id from unnest(p_product_ids) as selected(id) order by id);
  update public.products set is_outlet = p_is_outlet where id = any(v_ids);
  get diagnostics v_updated = row_count;
  if v_updated <> cardinality(v_ids) then
    raise exception 'Certaines fiches de la sélection Outlet sont introuvables. Actualisez le catalogue.';
  end if;
  return v_updated;
end;
$function$;

revoke all on function public.set_products_outlet(uuid[], boolean) from public, anon;
grant execute on function public.set_products_outlet(uuid[], boolean) to authenticated;
