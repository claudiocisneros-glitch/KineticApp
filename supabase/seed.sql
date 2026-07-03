-- ============================================================
-- Seed: recompensas del piloto (todas provistas por el gimnasio,
-- sin sponsors — según lo acordado)
-- ============================================================

insert into rewards (name, description, cost_points, max_redemptions_per_user) values
  ('Pase de invitado', 'Traé un amigo a entrenar gratis', 300, null),
  ('Clase premium', 'Acceso a una clase premium o sesión con instructor', 500, null),
  ('10% off próxima cuota', 'Descuento en la renovación de tu membresía', 1200, null),
  ('Reconocimiento en el gym', 'Mención en cartelera al lograr Racha de Hierro o Socio de Ley', 0, 1);

-- ============================================================
-- Seed: un QR de ejemplo para desarrollo local
-- (en producción esto se genera y rota automáticamente — ver
-- lib/qr-rotation.ts, pendiente de implementar como cron job)
-- ============================================================
insert into gym_qr_codes (code, valid_from, valid_until) values
  ('KINETIC-DEV-TEST-CODE', now(), now() + interval '1 day');
