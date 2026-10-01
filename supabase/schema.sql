-- Apply to the selected Supabase project; inventory_ prefix avoids existing app tables.
begin;
create table if not exists public.inventory_users (
 id uuid primary key references auth.users(id), full_name text not null,
 role text not null default 'staff' check (role in ('manager','staff')), avatar text,
 created_at timestamptz not null default now()
);
create table if not exists public.inventory_brands (
 id uuid primary key default gen_random_uuid(), name text not null,
 status text not null default 'pending' check (status in ('active','pending')),
 created_by uuid not null references public.inventory_users(id),
 assigned_staff uuid[] not null default '{}', created_at timestamptz not null default now()
);
create table if not exists public.inventory_items (
 id uuid primary key default gen_random_uuid(), brand_id uuid not null references public.inventory_brands(id),
 sku text not null, name text not null, current_stock integer not null default 0 check (current_stock >= 0),
 min_stock_threshold integer not null default 0 check (min_stock_threshold >= 0),
 cost_price numeric not null default 0 check (cost_price >= 0), sell_price numeric not null default 0 check (sell_price >= 0),
 created_at timestamptz not null default now(), unique (brand_id, sku)
);
create table if not exists public.inventory_transactions (
 id uuid primary key, item_id uuid not null references public.inventory_items(id),
 user_id uuid not null references public.inventory_users(id), type text not null check (type in ('IN','OUT','ADJUST')),
 quantity integer not null check (quantity <> 0 and (type = 'ADJUST' or quantity > 0)),
 notes text not null default '', created_at timestamptz not null default now()
);
create or replace function public.inventory_is_manager() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.inventory_users where id = auth.uid() and role = 'manager');
$$;
create or replace function public.inventory_can_access(p_brand uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select public.inventory_is_manager() or exists(select 1 from public.inventory_brands
 where id = p_brand and status = 'active' and auth.uid() = any(assigned_staff));
$$;
create or replace function public.inventory_create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.inventory_users(id, full_name) values(new.id, coalesce(new.raw_user_meta_data->>'full_name',new.email,'Staff')) on conflict do nothing;
 return new;
end;
$$;
drop trigger if exists inventory_profile_created on auth.users;
create trigger inventory_profile_created after insert on auth.users for each row execute function public.inventory_create_profile();
insert into public.inventory_users(id,full_name)
 select id,coalesce(raw_user_meta_data->>'full_name',email,'Staff') from auth.users on conflict do nothing;
alter table public.inventory_users enable row level security;
alter table public.inventory_brands enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;
drop policy if exists inventory_users_read on public.inventory_users;
create policy inventory_users_read on public.inventory_users for select to authenticated using(id = auth.uid() or public.inventory_is_manager());
drop policy if exists inventory_users_update on public.inventory_users;
create policy inventory_users_update on public.inventory_users for update to authenticated using(public.inventory_is_manager()) with check(public.inventory_is_manager());
drop policy if exists inventory_brands_read on public.inventory_brands;
create policy inventory_brands_read on public.inventory_brands for select to authenticated using(public.inventory_can_access(id) or created_by = auth.uid());
drop policy if exists inventory_brands_create on public.inventory_brands;
create policy inventory_brands_create on public.inventory_brands for insert to authenticated with check(created_by = auth.uid() and status = 'pending' and cardinality(assigned_staff) = 0);
drop policy if exists inventory_brands_update on public.inventory_brands;
create policy inventory_brands_update on public.inventory_brands for update to authenticated using(public.inventory_is_manager()) with check(public.inventory_is_manager());
drop policy if exists inventory_items_read on public.inventory_items;
create policy inventory_items_read on public.inventory_items for select to authenticated using(public.inventory_can_access(brand_id));
drop policy if exists inventory_items_create on public.inventory_items;
create policy inventory_items_create on public.inventory_items for insert to authenticated with check(public.inventory_is_manager());
drop policy if exists inventory_transactions_read on public.inventory_transactions;
create policy inventory_transactions_read on public.inventory_transactions for select to authenticated using(exists(select 1 from public.inventory_items i where i.id = item_id and public.inventory_can_access(i.brand_id)));
-- No direct stock or ledger writes. RPC checks access and locks the stock row.
revoke all on public.inventory_users, public.inventory_brands, public.inventory_items, public.inventory_transactions from anon, authenticated;
grant select,update on public.inventory_users to authenticated;
grant select,insert,update on public.inventory_brands to authenticated;
grant select,insert on public.inventory_items to authenticated;
grant select on public.inventory_transactions to authenticated;
create or replace function public.inventory_record_transaction(
 p_id uuid, p_item_id uuid, p_type text, p_quantity integer, p_notes text default '', p_created_at timestamptz default now()
) returns void language plpgsql security definer set search_path = '' as $$
declare target public.inventory_items; delta integer; existing public.inventory_transactions;
begin
 if auth.uid() is null then raise exception 'Login diperlukan'; end if;
 if p_type not in ('IN','OUT','ADJUST') or p_type is null or p_quantity is null or p_quantity = 0 or (p_type <> 'ADJUST' and p_quantity < 0) then raise exception 'Transaksi tidak valid'; end if;
 select * into target from public.inventory_items where id = p_item_id for update;
 if not found or not public.inventory_can_access(target.brand_id) then raise exception 'Barang tidak tersedia'; end if;
 if p_type = 'ADJUST' and not public.inventory_is_manager() then raise exception 'Penyesuaian memerlukan manager'; end if;
 select * into existing from public.inventory_transactions where id = p_id;
 if found then
  if existing.user_id <> auth.uid() or existing.item_id <> p_item_id or existing.type <> p_type or existing.quantity <> p_quantity or existing.notes <> coalesce(p_notes,'') then raise exception 'ID transaksi sudah digunakan'; end if;
  return;
 end if;
 delta := case when p_type = 'OUT' then -p_quantity else p_quantity end;
 if target.current_stock + delta < 0 then raise exception 'Stok tidak mencukupi'; end if;
 insert into public.inventory_transactions(id,item_id,user_id,type,quantity,notes,created_at)
 values(p_id,p_item_id,auth.uid(),p_type,p_quantity,coalesce(p_notes,''),coalesce(p_created_at,now()));
 update public.inventory_items set current_stock = current_stock + delta where id = p_item_id;
end;
$$;
revoke all on function public.inventory_create_profile() from public;
revoke all on function public.inventory_is_manager() from public;
revoke all on function public.inventory_can_access(uuid) from public;
revoke all on function public.inventory_record_transaction(uuid,uuid,text,integer,text,timestamptz) from public;
grant execute on function public.inventory_is_manager(), public.inventory_can_access(uuid), public.inventory_record_transaction(uuid,uuid,text,integer,text,timestamptz) to authenticated;
commit;
-- Bootstrap manager explicitly in SQL Editor AFTER creating an Auth account:
-- update public.inventory_users set role = 'manager' where id = '<selected-auth-user-uuid>';
