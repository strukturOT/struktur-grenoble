-- Category media and product relationships.
-- The categories table and products.category_id are part of the foundation migration;
-- this migration adds the editorial image fields used by the catalogue UI.

alter table public.categories
  add column if not exists image_url text,
  add column if not exists storage_path text;

create unique index if not exists categories_storage_path_idx
  on public.categories (storage_path)
  where storage_path is not null;

insert into storage.buckets (id, name, public)
values ('category-images', 'category-images', true)
on conflict (id) do update set public = excluded.public;

create policy "category images are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'category-images');

create policy "admins upload category images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'category-images' and (select public.is_admin()));

create policy "admins update category images"
  on storage.objects for update to authenticated
  using (bucket_id = 'category-images' and (select public.is_admin()))
  with check (bucket_id = 'category-images' and (select public.is_admin()));

create policy "admins delete category images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'category-images' and (select public.is_admin()));
