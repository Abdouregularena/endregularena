-- Supprime les 5 packs sans articles pour les réimporter corrigés
delete from public.quizz where pack in ('tec','cdd','cmp','syscohada','sycebnl');
