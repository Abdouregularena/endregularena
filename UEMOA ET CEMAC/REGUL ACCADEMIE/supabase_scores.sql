-- ===========================================================
-- REGUL ACADÉMIE — CLASSEMENT DES DUELS (à exécuter une fois)
-- ===========================================================
create table if not exists public.scores (
  id      bigint generated always as identity primary key,
  user_id uuid not null,
  nom     text,
  pack    text not null,
  points  int  not null default 0,
  parties int  not null default 0,
  maj_le  timestamptz default now(),
  unique (user_id, pack)
);
alter table public.scores enable row level security;
drop policy if exists scores_lecture on public.scores;
create policy scores_lecture on public.scores for select to authenticated using (true);

-- Enregistrement cumulatif du score (uniquement pour soi-même via auth.uid())
create or replace function public.enregistrer_score(p_pack text, p_nom text, p_points int)
returns void language plpgsql security definer as $$
begin
  insert into public.scores(user_id, nom, pack, points, parties)
  values (auth.uid(), p_nom, p_pack, greatest(p_points,0), 1)
  on conflict (user_id, pack) do update
    set points  = scores.points + greatest(excluded.points,0),
        parties = scores.parties + 1,
        nom     = excluded.nom,
        maj_le  = now();
end;$$;
grant execute on function public.enregistrer_score to authenticated;
