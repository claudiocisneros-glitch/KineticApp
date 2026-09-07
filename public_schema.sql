--
-- PostgreSQL database dump
--

\restrict rqlinrKqvsKvRB5iOMbE7QwHUbXaepTJyT8GfJPhsQWahHyXJU868FyTcwQPKNk

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: adjust_points(uuid, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.adjust_points(p_user_id uuid, p_amount integer, p_note text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  perform 1 from profiles where id = p_user_id for update;

  insert into points_ledger (user_id, amount, reason, reference_id)
  values (p_user_id, p_amount, 'adjustment', null);

  -- El motivo del ajuste (ej: "bonus cumpleaños") queda en breakdown de
  -- un check-in NO corresponde acá — se guarda aparte, en su propia tabla,
  -- para no forzar el shape de checkins con datos que no son check-ins.
  insert into points_adjustments (user_id, amount, note)
  values (p_user_id, p_amount, p_note);
end;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_role text;
begin
  select role into v_role
  from public.staff_role_invites
  where email = lower(new.email);

  insert into public.profiles (id, full_name, member_since, role)
  values (new.id, new.raw_user_meta_data->>'full_name', current_date, v_role);

  if v_role is not null then
    delete from public.staff_role_invites where email = lower(new.email);
  end if;

  return new;
end;
$$;


--
-- Name: redeem_reward(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.redeem_reward(p_user_id uuid, p_reward_id uuid) RETURNS TABLE(redemption_id uuid, points_spent integer, redemption_code text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_cost int;
  v_max_redemptions int;
  v_already_redeemed int;
  v_balance int;
  v_redemption_id uuid;
  v_code text;
  v_attempts int := 0;
begin
  perform 1 from profiles where id = p_user_id for update;

  select cost_points, max_redemptions_per_user into v_cost, v_max_redemptions
  from rewards
  where id = p_reward_id and is_active = true;

  if v_cost is null then
    raise exception 'Recompensa no encontrada o inactiva';
  end if;

  if v_max_redemptions is not null then
    select count(*) into v_already_redeemed
    from redemptions
    where user_id = p_user_id and reward_id = p_reward_id;

    if v_already_redeemed >= v_max_redemptions then
      raise exception 'Ya alcanzaste el límite de canjes para esta recompensa';
    end if;
  end if;

  select coalesce(sum(amount), 0) into v_balance
  from points_ledger
  where user_id = p_user_id;

  if v_balance < v_cost then
    raise exception 'Puntos insuficientes';
  end if;

  loop
    v_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
    begin
      insert into redemptions (user_id, reward_id, points_spent, status, code)
      values (p_user_id, p_reward_id, v_cost, 'pending', v_code)
      returning id into v_redemption_id;
      exit;
    exception when unique_violation then
      v_attempts := v_attempts + 1;
      if v_attempts > 5 then
        raise exception 'No se pudo generar un código de canje único';
      end if;
    end;
  end loop;

  insert into points_ledger (user_id, amount, reason, reference_id)
  values (p_user_id, -v_cost, 'redemption', v_redemption_id);

  return query select v_redemption_id, v_cost, v_code;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon_url text
);


--
-- Name: checkins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    qr_code_id uuid NOT NULL,
    points_awarded integer NOT NULL,
    breakdown jsonb NOT NULL,
    checkin_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: gym_qr_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gym_qr_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    valid_from timestamp with time zone DEFAULT now() NOT NULL,
    valid_until timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: points_adjustments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.points_adjustments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: points_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.points_ledger (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    reason text NOT NULL,
    reference_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    member_since date DEFAULT CURRENT_DATE NOT NULL,
    current_streak_weeks integer DEFAULT 0 NOT NULL,
    last_checkin_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    role text,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'reception'::text])))
);


--
-- Name: redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.redemptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reward_id uuid NOT NULL,
    points_spent integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    fulfilled_at timestamp with time zone,
    code text NOT NULL
);


--
-- Name: rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    cost_points integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    max_redemptions_per_user integer
);


--
-- Name: staff_role_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_role_invites (
    email text NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT staff_role_invites_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'reception'::text])))
);


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    earned_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_points_balance; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_points_balance AS
 SELECT user_id,
    sum(amount) AS balance
   FROM public.points_ledger
  GROUP BY user_id;


--
-- Data for Name: badges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.badges (id, code, name, description, icon_url) FROM stdin;
fefb6ec3-0e07-48b5-b2e4-76e34d3e2052	arranque_fuerte	Arranque Fuerte	8+ check-ins en los primeros 30 días como socio	/badges/arranque-fuerte.svg
95927f65-e750-48a0-91db-01a13886ac9f	racha_hierro	Racha de Hierro	4 semanas consecutivas con al menos 2 check-ins/semana	/badges/racha-hierro.svg
e32cbd0e-f5b8-481c-9aa4-b7abd531a0a6	volviste	Volviste	Check-in después de 14+ días de inactividad	/badges/volviste.svg
2f32a8c0-606a-4eb5-b7f6-d5bcb56b5716	socio_de_ley	Socio de Ley	50 check-ins totales acumulados	/badges/socio-de-ley.svg
\.


--
-- Data for Name: checkins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.checkins (id, user_id, qr_code_id, points_awarded, breakdown, checkin_date, created_at) FROM stdin;
60b65465-15bf-428c-a8cb-b79a07638a13	8dd56b20-4171-4b32-832d-d1af5b061be6	ccfcf54f-63d1-4608-b795-eb20bf257861	150	{"base": 100, "total": 150, "streakBonus": 0, "tenureBonus": 0, "onboardingBonus": 50}	2026-07-02	2026-07-02 21:16:58.953311+00
edac6eee-a515-4df3-bef6-5185d8869a12	8dd56b20-4171-4b32-832d-d1af5b061be6	e0794129-8976-4814-bfa5-77a5c84ca21a	150	{"base": 100, "total": 150, "streakBonus": 0, "tenureBonus": 0, "onboardingBonus": 50}	2026-07-03	2026-07-03 20:18:47.881316+00
1b3c9064-e813-4f83-a826-873708348301	8dd56b20-4171-4b32-832d-d1af5b061be6	d965d96c-26cf-44a4-8e2c-0e302720498b	150	{"base": 100, "total": 150, "streakBonus": 0, "tenureBonus": 0, "onboardingBonus": 50}	2026-07-13	2026-07-13 16:44:11.272543+00
b8527f03-1fc8-4825-8205-ad164cbb8763	8dd56b20-4171-4b32-832d-d1af5b061be6	daeb9418-979b-4f99-9b1d-e15266bdf999	100	{"base": 100, "total": 100, "streakBonus": 0, "tenureBonus": 0, "onboardingBonus": 0}	2026-08-27	2026-08-27 16:51:02.353363+00
8d92cc0b-607b-4c28-90f1-77a10d98ee4c	8dd56b20-4171-4b32-832d-d1af5b061be6	b97a6647-3f67-4f3e-8a2d-aa97dd10fd64	100	{"base": 100, "total": 100, "streakBonus": 0, "tenureBonus": 0, "onboardingBonus": 0}	2026-09-01	2026-09-01 20:19:47.92984+00
\.


--
-- Data for Name: gym_qr_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gym_qr_codes (id, code, valid_from, valid_until, created_at) FROM stdin;
557a66c6-c99b-4024-8419-6c028a6248cd	KINETIC-DEV-TEST-CODE	2026-07-02 20:11:37.870787+00	2026-07-02 20:50:20.583+00	2026-07-02 20:11:37.870787+00
5612d641-a6ec-4719-ad92-caed2039ce06	KINETIC-160b6800-265f-44f9-8eb5-3183c0634b85	2026-07-02 20:43:52.732+00	2026-07-02 20:50:20.583+00	2026-07-02 20:43:52.970819+00
09e41bc8-70f8-4b14-8737-6f4f8d6f5230	KINETIC-1a553605-0901-4694-8672-1607c8214dcf	2026-07-02 20:44:05.625+00	2026-07-02 20:50:20.583+00	2026-07-02 20:44:05.723346+00
ccfcf54f-63d1-4608-b795-eb20bf257861	KINETIC-c3e312a9-13a5-4b3b-b5ae-695f0b998cfb	2026-07-02 20:50:20.583+00	2026-07-03 20:18:44.381+00	2026-07-02 20:50:21.313869+00
e0794129-8976-4814-bfa5-77a5c84ca21a	KINETIC-eb7aa3c2-0287-4d7b-bb51-8974b01300cc	2026-07-03 20:18:44.514+00	2026-07-04 20:18:44.514+00	2026-07-03 20:18:44.581731+00
d965d96c-26cf-44a4-8e2c-0e302720498b	KINETIC-a46555ce-cfad-43c4-b3de-f3d2fba39a2b	2026-07-13 16:44:06.005+00	2026-07-14 16:44:06.005+00	2026-07-13 16:44:06.087937+00
daeb9418-979b-4f99-9b1d-e15266bdf999	KINETIC-4c97c02d-985c-4893-b35a-4787581d1473	2026-08-27 16:50:54.463+00	2026-08-28 16:50:54.463+00	2026-08-27 16:50:54.662365+00
b97a6647-3f67-4f3e-8a2d-aa97dd10fd64	KINETIC-1e724497-1c60-4080-bce0-a4a62ac25c44	2026-09-01 20:19:44.547+00	2026-09-02 20:19:44.547+00	2026-09-01 20:19:44.651812+00
\.


--
-- Data for Name: points_adjustments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.points_adjustments (id, user_id, amount, note, created_at) FROM stdin;
27fa5d24-ad89-4512-925e-bdb60dfa49ab	8dd56b20-4171-4b32-832d-d1af5b061be6	100	Bonus cumpleaños	2026-09-01 20:58:02.75091+00
\.


--
-- Data for Name: points_ledger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.points_ledger (id, user_id, amount, reason, reference_id, created_at) FROM stdin;
544555c0-0a5f-4782-834e-c1b2d88b4601	8dd56b20-4171-4b32-832d-d1af5b061be6	150	checkin	60b65465-15bf-428c-a8cb-b79a07638a13	2026-07-02 21:16:59.269422+00
a12a595b-1c52-431c-b879-3fe781133ee8	8dd56b20-4171-4b32-832d-d1af5b061be6	0	redemption	470f84b1-af4f-4eaa-bae5-b5126648d270	2026-07-02 21:18:21.616756+00
a06586fa-13d1-4a75-aa30-bd2d6bd94f52	8dd56b20-4171-4b32-832d-d1af5b061be6	0	redemption	9f784d94-0430-4032-bc23-a5888892830c	2026-07-02 21:18:36.315675+00
0c5ef9b3-c29a-4071-b4ec-017ecec3d7b8	8dd56b20-4171-4b32-832d-d1af5b061be6	0	redemption	d6be7251-8f60-4ff2-b723-a6642790de89	2026-07-02 21:19:24.504941+00
8caaa080-fe5c-4275-aedd-351c277a337f	8dd56b20-4171-4b32-832d-d1af5b061be6	0	redemption	70289213-f1b1-4580-8292-c5a90a3be88d	2026-07-02 21:20:56.872748+00
256f720d-4760-48c7-82d2-e969850c1d29	8dd56b20-4171-4b32-832d-d1af5b061be6	0	redemption	f40be4ac-2ae9-42e2-b93d-8c83b4dd4d43	2026-07-02 21:34:22.636115+00
98a2192e-9328-46b1-9da4-5d0e458a441c	8dd56b20-4171-4b32-832d-d1af5b061be6	150	checkin	edac6eee-a515-4df3-bef6-5185d8869a12	2026-07-03 20:18:47.982023+00
e7368119-2250-4858-854b-c416f19ab226	8dd56b20-4171-4b32-832d-d1af5b061be6	-300	redemption	a6e8d663-40d3-4452-8f15-b36176e9d6df	2026-07-03 20:19:08.133+00
46f53e8f-cf60-4df4-94a8-87af74f977e5	8dd56b20-4171-4b32-832d-d1af5b061be6	150	checkin	1b3c9064-e813-4f83-a826-873708348301	2026-07-13 16:44:11.424333+00
0e14b103-5573-4049-b503-cd244d574832	8dd56b20-4171-4b32-832d-d1af5b061be6	100	checkin	b8527f03-1fc8-4825-8205-ad164cbb8763	2026-08-27 16:51:03.56425+00
9fe967ff-1b5b-478b-847c-eadb7c3394bf	8dd56b20-4171-4b32-832d-d1af5b061be6	100	checkin	8d92cc0b-607b-4c28-90f1-77a10d98ee4c	2026-09-01 20:19:48.048493+00
54e4e3f7-aba5-473e-9c2b-82a1a72ef056	8dd56b20-4171-4b32-832d-d1af5b061be6	-300	redemption	ca0b05a3-0467-4a9c-9ded-feacc0413874	2026-09-01 20:19:57.576122+00
5dbadf50-3cd6-43bb-bafc-f2769b1849f3	8dd56b20-4171-4b32-832d-d1af5b061be6	100	adjustment	\N	2026-09-01 20:58:02.75091+00
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, full_name, member_since, current_streak_weeks, last_checkin_at, created_at, role) FROM stdin;
8dd56b20-4171-4b32-832d-d1af5b061be6	\N	2026-07-02	0	2026-09-01 20:19:48.067+00	2026-07-02 20:26:51.213342+00	\N
\.


--
-- Data for Name: redemptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.redemptions (id, user_id, reward_id, points_spent, status, created_at, fulfilled_at, code) FROM stdin;
470f84b1-af4f-4eaa-bae5-b5126648d270	8dd56b20-4171-4b32-832d-d1af5b061be6	e1548f86-defb-477d-ba9c-238d52ba88ae	0	pending	2026-07-02 21:18:21.616756+00	\N	42AA44B3
9f784d94-0430-4032-bc23-a5888892830c	8dd56b20-4171-4b32-832d-d1af5b061be6	e1548f86-defb-477d-ba9c-238d52ba88ae	0	pending	2026-07-02 21:18:36.315675+00	\N	FE37FCE1
d6be7251-8f60-4ff2-b723-a6642790de89	8dd56b20-4171-4b32-832d-d1af5b061be6	e1548f86-defb-477d-ba9c-238d52ba88ae	0	pending	2026-07-02 21:19:24.504941+00	\N	694465C8
70289213-f1b1-4580-8292-c5a90a3be88d	8dd56b20-4171-4b32-832d-d1af5b061be6	e1548f86-defb-477d-ba9c-238d52ba88ae	0	pending	2026-07-02 21:20:56.872748+00	\N	D62F65B2
f40be4ac-2ae9-42e2-b93d-8c83b4dd4d43	8dd56b20-4171-4b32-832d-d1af5b061be6	e1548f86-defb-477d-ba9c-238d52ba88ae	0	pending	2026-07-02 21:34:22.636115+00	\N	E9F6C2BC
a6e8d663-40d3-4452-8f15-b36176e9d6df	8dd56b20-4171-4b32-832d-d1af5b061be6	5703e278-c6d4-4588-8927-c1d68707b03f	300	pending	2026-07-03 20:19:08.133+00	\N	11B2376C
ca0b05a3-0467-4a9c-9ded-feacc0413874	8dd56b20-4171-4b32-832d-d1af5b061be6	5703e278-c6d4-4588-8927-c1d68707b03f	300	fulfilled	2026-09-01 20:19:57.576122+00	2026-09-01 20:20:37.032+00	BEA806A2
\.


--
-- Data for Name: rewards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rewards (id, name, description, cost_points, is_active, created_at, max_redemptions_per_user) FROM stdin;
5703e278-c6d4-4588-8927-c1d68707b03f	Pase de invitado	Traé un amigo a entrenar gratis	300	t	2026-07-02 20:11:37.870787+00	\N
cee74887-f329-483f-affe-0602090a1a74	Clase premium	Acceso a una clase premium o sesión con instructor	500	t	2026-07-02 20:11:37.870787+00	\N
f082145f-b8eb-4bd6-8489-0b78107fe846	10% off próxima cuota	Descuento en la renovación de tu membresía	1200	t	2026-07-02 20:11:37.870787+00	\N
e1548f86-defb-477d-ba9c-238d52ba88ae	Reconocimiento en el gym	Mención en cartelera al lograr Racha de Hierro o Socio de Ley	0	t	2026-07-02 20:11:37.870787+00	1
406474a0-a04e-4cc5-b940-2ff64b226e60	Descuento en suplementos "Dietetica Power"	Cupón descuento 20% en la compra de suplementos dietarios	250	t	2026-09-01 21:07:47.284072+00	1
\.


--
-- Data for Name: staff_role_invites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_role_invites (email, role, created_at) FROM stdin;
claude81@gmail.com	reception	2026-09-01 21:02:29.785437+00
\.


--
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_badges (id, user_id, badge_id, earned_at) FROM stdin;
ad8998dd-40bc-46e5-a647-f8e6e2c833fc	8dd56b20-4171-4b32-832d-d1af5b061be6	e32cbd0e-f5b8-481c-9aa4-b7abd531a0a6	2026-08-27 16:51:04.422326+00
\.


--
-- Name: badges badges_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_code_key UNIQUE (code);


--
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- Name: checkins checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT checkins_pkey PRIMARY KEY (id);


--
-- Name: checkins checkins_user_id_checkin_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT checkins_user_id_checkin_date_key UNIQUE (user_id, checkin_date);


--
-- Name: gym_qr_codes gym_qr_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gym_qr_codes
    ADD CONSTRAINT gym_qr_codes_code_key UNIQUE (code);


--
-- Name: gym_qr_codes gym_qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gym_qr_codes
    ADD CONSTRAINT gym_qr_codes_pkey PRIMARY KEY (id);


--
-- Name: points_adjustments points_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_adjustments
    ADD CONSTRAINT points_adjustments_pkey PRIMARY KEY (id);


--
-- Name: points_ledger points_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_ledger
    ADD CONSTRAINT points_ledger_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: redemptions redemptions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemptions
    ADD CONSTRAINT redemptions_code_key UNIQUE (code);


--
-- Name: redemptions redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemptions
    ADD CONSTRAINT redemptions_pkey PRIMARY KEY (id);


--
-- Name: rewards rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_pkey PRIMARY KEY (id);


--
-- Name: staff_role_invites staff_role_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_role_invites
    ADD CONSTRAINT staff_role_invites_pkey PRIMARY KEY (email);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_user_id_badge_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);


--
-- Name: checkins checkins_qr_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT checkins_qr_code_id_fkey FOREIGN KEY (qr_code_id) REFERENCES public.gym_qr_codes(id);


--
-- Name: checkins checkins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT checkins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: points_adjustments points_adjustments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_adjustments
    ADD CONSTRAINT points_adjustments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: points_ledger points_ledger_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_ledger
    ADD CONSTRAINT points_ledger_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: redemptions redemptions_reward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemptions
    ADD CONSTRAINT redemptions_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.rewards(id);


--
-- Name: redemptions redemptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemptions
    ADD CONSTRAINT redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_badges user_badges_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id);


--
-- Name: user_badges user_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: rewards Anyone can view active rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active rewards" ON public.rewards FOR SELECT USING ((is_active = true));


--
-- Name: badges Anyone can view badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);


--
-- Name: points_adjustments Users can view their own adjustments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own adjustments" ON public.points_adjustments FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_badges Users can view their own badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own badges" ON public.user_badges FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: checkins Users can view their own checkins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own checkins" ON public.checkins FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: points_ledger Users can view their own ledger; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own ledger" ON public.points_ledger FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: redemptions Users can view their own redemptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own redemptions" ON public.redemptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

--
-- Name: checkins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

--
-- Name: gym_qr_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gym_qr_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: points_adjustments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.points_adjustments ENABLE ROW LEVEL SECURITY;

--
-- Name: points_ledger; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: redemptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

--
-- Name: rewards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_role_invites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staff_role_invites ENABLE ROW LEVEL SECURITY;

--
-- Name: user_badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict rqlinrKqvsKvRB5iOMbE7QwHUbXaepTJyT8GfJPhsQWahHyXJU868FyTcwQPKNk

