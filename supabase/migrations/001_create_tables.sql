-- ============================================================
-- 001_create_tables.sql
-- Creates categories and expenses tables with triggers, RLS,
-- indexes, and seed data.
-- ============================================================

-- =========================
-- updated_at trigger function
-- =========================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================
-- categories
-- =========================
create table public.categories (
  id         uuid        primary key default gen_random_uuid(),
  name       text        unique not null,
  color      text        not null default '#6B7280',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_updated_at
  before update on public.categories
  for each row
  execute function public.set_updated_at();

-- =========================
-- expenses
-- =========================
create table public.expenses (
  id          uuid          primary key default gen_random_uuid(),
  amount      numeric(12,2) not null check (amount > 0),
  description text          not null default '',
  date        date          not null default current_date,
  category_id uuid          not null references public.categories(id) on delete restrict,
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now()
);

create trigger expenses_updated_at
  before update on public.expenses
  for each row
  execute function public.set_updated_at();

-- =========================
-- indexes
-- =========================
create index idx_expenses_date        on public.expenses(date);
create index idx_expenses_category_id on public.expenses(category_id);

-- =========================
-- RLS (open for Phase 1)
-- =========================
alter table public.categories enable row level security;
alter table public.expenses   enable row level security;

create policy "Allow all on categories"
  on public.categories for all
  using (true)
  with check (true);

create policy "Allow all on expenses"
  on public.expenses for all
  using (true)
  with check (true);

-- =========================
-- seed categories
-- =========================
insert into public.categories (name, color) values
  ('Alimentación', '#EF4444'),
  ('Transporte',   '#F97316'),
  ('Vivienda',     '#EAB308'),
  ('Suministros',  '#22C55E'),
  ('Ocio',         '#3B82F6'),
  ('Salud',        '#8B5CF6'),
  ('Educación',    '#EC4899'),
  ('Otros',        '#6B7280');
