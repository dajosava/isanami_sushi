-- Corregir typo: "temporas" -> "tempuras"
update public.categorias_menu
set nombre = 'Rollos especiales y tempuras'
where nombre = 'Rollos especiales y temporas';
