-- ============================================================
-- REGUL ACADÉMIE — Statistiques admin + journal des parties
-- À exécuter UNE SEULE FOIS dans Supabase → SQL Editor → Run.
-- N'altère aucune table existante. 100% additif.
-- ============================================================

-- 1) Table des évènements (participations duels / tournois) -----------------
create table if not exists public.evenements (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,            -- 'duel' | 'tournoi'
  pack        text,
  pack_titre  text,
  user_id     uuid references auth.users(id) on delete set null,
  nom         text,
  points      int default 0,
  meta        jsonb default '{}'::jsonb, -- ex: {"mode":"elimination","rang":2,"joueurs":8}
  cree_le     timestamptz default now()
);

alter table public.evenements enable row level security;

-- chaque utilisateur connecté n'enregistre QUE ses propres parties
drop policy if exists ev_insert on public.evenements;
create policy ev_insert on public.evenements
  for insert to authenticated
  with check (auth.uid() = user_id);

-- lecture réservée à l'admin
drop policy if exists ev_select_admin on public.evenements;
create policy ev_select_admin on public.evenements
  for select to authenticated
  using (auth.jwt() ->> 'email' = 'regul.arena2026@gmail.com');

-- 2) Fonction de statistiques agrégées (admin uniquement) -------------------
-- SECURITY DEFINER : passe la RLS proprement et ne renvoie QUE des totaux
-- (aucune donnée personnelle ligne par ligne).
create or replace function public.stats_admin()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare r json;
begin
  if coalesce(auth.jwt() ->> 'email','') <> 'regul.arena2026@gmail.com' then
    raise exception 'Acces refuse';
  end if;

  select json_build_object(
    'total_users',          (select count(*) from auth.users),
    'forfaits_actifs',      (select count(*) from public.profiles where forfait_actif is true),
    'formations_terminees', (select count(*) from public.progressions where modules_vus >= 5),
    'apprenants_actifs',    (select count(distinct user_id) from public.progressions),
    'duels_joues',          (select count(*) from public.evenements where type = 'duel'),
    'tournois_joues',       (select count(*) from public.evenements where type = 'tournoi'),
    'parties_30j',          (select count(*) from public.evenements where cree_le > now() - interval '30 days'),
    'inscrits_30j',         (select count(*) from auth.users where created_at > now() - interval '30 days'),
    'par_secteur',          (select coalesce(json_object_agg(s, n), '{}'::json)
                             from (select coalesce(nullif(raw_user_meta_data ->> 'secteur',''),'Non renseigné') s,
                                          count(*) n
                                   from auth.users group by 1) x)
  ) into r;

  return r;
end $$;

grant execute on function public.stats_admin() to authenticated;

-- ============================================================
-- Fait. Reconnecte-toi en admin (regul.arena2026@gmail.com)
-- puis ouvre l'onglet Admin → Statistiques.
-- ============================================================
