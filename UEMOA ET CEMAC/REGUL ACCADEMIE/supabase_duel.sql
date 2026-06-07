-- ===========================================================
-- REGUL ACADÉMIE — MODULE DUEL (à exécuter une seule fois)
-- Supabase > SQL Editor > Run
-- ===========================================================

-- 1) BANQUE DE QUESTIONS (tu y importes tes quiz validés)
create table if not exists public.quizz (
  id        bigint generated always as identity primary key,
  pack      text not null,            -- = slug de la formation (tec, rfe, pcb, ...)
  question  text not null,
  options   jsonb not null,           -- ["réponse A","réponse B","réponse C","réponse D"]
  bonne     int  not null,            -- index 0-based de la bonne réponse
  article   text,                     -- ex: "Art. 12"
  support   text,                     -- ex: "Règlement n° 06/2024/CM/UEMOA"
  lien      text,                     -- URL du support officiel (optionnel)
  cree_le   timestamptz default now()
);
alter table public.quizz enable row level security;
drop policy if exists quizz_lecture on public.quizz;
create policy quizz_lecture on public.quizz for select to authenticated using (true);
drop policy if exists quizz_insert on public.quizz;
create policy quizz_insert on public.quizz for insert to authenticated with check (true);

-- 2) DUELS
create table if not exists public.duels (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  pack          text not null,
  pack_titre    text,
  nb_questions  int  not null,
  timing        int  not null,        -- secondes par question
  questions     jsonb not null,       -- [id1,id2,...] (ordre figé, communs aux 2 joueurs)
  createur_id   uuid not null,
  createur_nom  text,
  adversaire_id uuid,
  adversaire_nom text,
  statut        text not null default 'ouvert',  -- ouvert | en_cours | termine
  reponses      jsonb not null default '{}'::jsonb, -- { "0":{par,nom,choix}, "1":{t:true}, ... }
  cree_le       timestamptz default now()
);
alter table public.duels enable row level security;
drop policy if exists duels_lecture on public.duels;
create policy duels_lecture on public.duels for select to authenticated using (true);
drop policy if exists duels_insert on public.duels;
create policy duels_insert on public.duels for insert to authenticated with check (auth.uid() = createur_id);

-- 3) REALTIME (les 2 joueurs reçoivent les changements en direct)
alter publication supabase_realtime add table public.duels;

-- 4) REJOINDRE un duel (atomique : 1 seul adversaire possible)
create or replace function public.duel_join(p_code text, p_uid uuid, p_nom text)
returns setof public.duels language sql security definer as $$
  update public.duels
     set adversaire_id = p_uid, adversaire_nom = p_nom, statut = 'en_cours'
   where code = p_code and statut = 'ouvert' and createur_id <> p_uid
  returning *;
$$;

-- 5) RÉPONDRE (buzzer : le 1er qui répond verrouille la question)
create or replace function public.duel_answer(p_id uuid, p_q int, p_uid uuid, p_nom text, p_choix int)
returns setof public.duels language sql security definer as $$
  update public.duels
     set reponses = jsonb_set(reponses, array[p_q::text],
           jsonb_build_object('par', p_uid, 'nom', p_nom, 'choix', p_choix), true)
   where id = p_id and (reponses -> p_q::text) is null;
  select * from public.duels where id = p_id;
$$;

-- 6) TEMPS ÉCOULÉ (personne n'a répondu à temps)
create or replace function public.duel_timeout(p_id uuid, p_q int)
returns setof public.duels language sql security definer as $$
  update public.duels
     set reponses = jsonb_set(reponses, array[p_q::text], jsonb_build_object('t', true), true)
   where id = p_id and (reponses -> p_q::text) is null;
  select * from public.duels where id = p_id;
$$;

-- 7) CLÔTURE (passage en 'termine' une fois toutes les questions traitées)
create or replace function public.duel_finir(p_id uuid)
returns setof public.duels language sql security definer as $$
  update public.duels set statut = 'termine'
   where id = p_id and jsonb_object_keys_count(reponses) >= nb_questions;
  select * from public.duels where id = p_id;
$$;
-- petit helper (compte les clés d'un jsonb)
create or replace function public.jsonb_object_keys_count(j jsonb)
returns int language sql immutable as $$ select count(*)::int from jsonb_object_keys(j); $$;

grant execute on function public.duel_join, public.duel_answer, public.duel_timeout, public.duel_finir to authenticated;
