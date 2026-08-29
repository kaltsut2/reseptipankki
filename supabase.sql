-- ===============================================================
--  Reseptipankin tietokanta
--
--  Aja tämä kerran Supabasen SQL Editorissa uudessa projektissa.
--  Luo reseptitaulun, kuvien tallennuspaikan ja käyttöoikeudet.
-- ===============================================================

-- --- Reseptitaulu ----------------------------------------------

create table if not exists public.reseptit (
  id            uuid primary key default gen_random_uuid(),
  nimi          text not null,
  kategoria     text not null default 'Muut',
  paaraaka_aine text,
  aika_min      integer,
  annokset      integer,
  ainekset      text,
  ohje          text,
  vinkki        text,
  kuva_url      text,
  suosikki      boolean not null default false,
  luotu         timestamptz not null default now(),
  muokattu      timestamptz not null default now()
);

alter table public.reseptit enable row level security;

-- Sovellus on avoin linkin tietäville: luku ja kirjoitus sallitaan
-- anon-avaimella. Jos haluat myöhemmin rajata muokkausoikeutta,
-- muuta insert/update/delete -käytännöt vaatimaan kirjautumista.

drop policy if exists "reseptit luku"     on public.reseptit;
drop policy if exists "reseptit lisays"   on public.reseptit;
drop policy if exists "reseptit muokkaus" on public.reseptit;
drop policy if exists "reseptit poisto"   on public.reseptit;

create policy "reseptit luku"     on public.reseptit for select using (true);
create policy "reseptit lisays"   on public.reseptit for insert with check (true);
create policy "reseptit muokkaus" on public.reseptit for update using (true) with check (true);
create policy "reseptit poisto"   on public.reseptit for delete using (true);

-- --- Kuvien tallennuspaikka -------------------------------------

insert into storage.buckets (id, name, public)
values ('kuvat', 'kuvat', true)
on conflict (id) do nothing;

drop policy if exists "kuvat luku"   on storage.objects;
drop policy if exists "kuvat lisays" on storage.objects;

create policy "kuvat luku"
  on storage.objects for select
  using (bucket_id = 'kuvat');

create policy "kuvat lisays"
  on storage.objects for insert
  with check (bucket_id = 'kuvat');
