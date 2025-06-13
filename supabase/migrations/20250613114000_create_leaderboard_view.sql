/*
  # Vue pour le leaderboard

  Cette migration crée la vue `child_points_daily` qui agrège les points gagnés
  par chaque enfant par jour depuis la table `points_history`. La vue est créée
  avec l'option SECURITY INVOKER afin que les politiques RLS appliquées aux
  tables sous-jacentes garantissent qu'un parent ne peut voir que les données de
  sa famille.
*/

create view child_points_daily
with (security_invoker = true) as
select
  c.id as child_id,
  c.user_id,
  c.name,
  c.avatar_url,
  date_trunc('day', ph.created_at) as day,
  coalesce(sum(ph.points), 0) as points
from children c
left join points_history ph on ph.child_id = c.id
group by c.id, c.user_id, c.name, c.avatar_url, day;

