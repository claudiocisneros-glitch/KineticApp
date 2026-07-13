-- Completa icon_url para los 4 badges del piloto (hoy en null).
-- Los SVG viven en public/badges/ — Next.js los sirve en /badges/*.svg
-- una vez deployado. Correr esto una sola vez en el SQL editor de Supabase.

update badges set icon_url = '/badges/arranque-fuerte.svg' where code = 'arranque_fuerte';
update badges set icon_url = '/badges/racha-hierro.svg'    where code = 'racha_hierro';
update badges set icon_url = '/badges/volviste.svg'        where code = 'volviste';
update badges set icon_url = '/badges/socio-de-ley.svg'    where code = 'socio_de_ley';
