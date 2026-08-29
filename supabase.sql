-- ===============================================================
--  Reseptipankin tietokanta
--
--  UUSI KANTA: aja tämä tiedosto kokonaisuudessaan Supabasen
--  SQL Editorissa.
--
--  OLEMASSA OLEVA KANTA: aja vain alin osio "MIGRAATIO".
-- ===============================================================

create table if not exists public.reseptit (
  id              uuid primary key default gen_random_uuid(),
  nimi            text not null,
  kategoriat      text[] not null default '{}',
  paaraaka_aineet text[] not null default '{}',
  aika_min        integer,
  annokset        integer,
  ainekset        text,
  ohje            text,
  vinkki          text,
  kuva_url        text,
  lisaaja         text,
  suosikki        boolean not null default false,
  luotu           timestamptz not null default now(),
  muokattu        timestamptz not null default now()
);

alter table public.reseptit enable row level security;

drop policy if exists "reseptit luku"     on public.reseptit;
drop policy if exists "reseptit lisays"   on public.reseptit;
drop policy if exists "reseptit muokkaus" on public.reseptit;
drop policy if exists "reseptit poisto"   on public.reseptit;

create policy "reseptit luku"     on public.reseptit for select using (true);
create policy "reseptit lisays"   on public.reseptit for insert with check (true);
create policy "reseptit muokkaus" on public.reseptit for update using (true) with check (true);
create policy "reseptit poisto"   on public.reseptit for delete using (true);

insert into storage.buckets (id, name, public)
values ('kuvat', 'kuvat', true)
on conflict (id) do nothing;

drop policy if exists "kuvat luku"   on storage.objects;
drop policy if exists "kuvat lisays" on storage.objects;

create policy "kuvat luku"   on storage.objects for select using (bucket_id = 'kuvat');
create policy "kuvat lisays" on storage.objects for insert with check (bucket_id = 'kuvat');


-- ===============================================================
--  MIGRAATIO
--
--  Muuttaa vanhan yhden kategorian ja yhden pääraaka-aineen
--  listoiksi, ja lisää tiedon reseptin lisääjästä.
--
--  Turvallinen ajaa: uudet sarakkeet luodaan vain jos niitä ei ole,
--  ja vanhat arvot kopioidaan listoihin ennen kuin vanhat sarakkeet
--  poistetaan. Mitään tietoa ei häviä.
-- ===============================================================

alter table public.reseptit
  add column if not exists kategoriat      text[] not null default '{}',
  add column if not exists paaraaka_aineet text[] not null default '{}',
  add column if not exists lisaaja         text;

-- Vanhat yksittäisarvot listoiksi.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'reseptit'
               and column_name = 'kategoria') then
    execute $sql$
      update public.reseptit
         set kategoriat = array[kategoria]
       where cardinality(kategoriat) = 0
         and kategoria is not null
         and kategoria <> ''
    $sql$;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'reseptit'
               and column_name = 'paaraaka_aine') then
    execute $sql$
      update public.reseptit
         set paaraaka_aineet = array[paaraaka_aine]
       where cardinality(paaraaka_aineet) = 0
         and paaraaka_aine is not null
         and paaraaka_aine <> ''
    $sql$;
  end if;
end $$;

-- Vanhat sarakkeet pois vasta kun arvot on kopioitu.
alter table public.reseptit
  drop column if exists kategoria,
  drop column if exists paaraaka_aine;
