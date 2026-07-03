--
-- PostgreSQL database dump
--

\restrict wfeamCNXGKx3kEs3r8ufAR6RElCke4T1FcDxpCqTQ3Z1LUPQhzBIIGkWG7PtM0V

-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 18.3

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.connections (
    id text NOT NULL,
    "fromNode" text NOT NULL,
    "toNode" text NOT NULL,
    view text DEFAULT 'master'::text NOT NULL,
    "lineStyle" text
);


--
-- Name: files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.files (
    id text NOT NULL,
    "nodeId" text NOT NULL,
    name text NOT NULL,
    "mimeType" text NOT NULL,
    size integer NOT NULL,
    "storageKey" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.history (
    id integer NOT NULL,
    ts timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    action text NOT NULL,
    details jsonb
);


--
-- Name: history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.history_id_seq OWNED BY public.history.id;


--
-- Name: nodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nodes (
    id text NOT NULL,
    badge text DEFAULT 'ROLE'::text NOT NULL,
    title text DEFAULT 'New Position'::text NOT NULL,
    sub text DEFAULT ''::text NOT NULL,
    color text DEFAULT '#6c63ff'::text NOT NULL,
    project text DEFAULT 'shared'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    x double precision DEFAULT 100 NOT NULL,
    y double precision DEFAULT 100 NOT NULL,
    view text DEFAULT 'master'::text NOT NULL,
    collapsed boolean DEFAULT false NOT NULL,
    hc jsonb,
    size jsonb,
    clarity jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.history ALTER COLUMN id SET DEFAULT nextval('public.history_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public._prisma_migrations VALUES ('9f08e199-f56f-4128-b6de-e766ced6cb6a', 'ad076a2b71d180b27e4464e967c1da004ecfabf0724a1692d940fef14d4a7df4', '2026-06-30 05:40:40.032172+00', '20260630054039_init', NULL, NULL, '2026-06-30 05:40:39.858897+00', 1);


--
-- Data for Name: connections; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.connections VALUES ('conn_rnd_bom', 'rnd', 'bom', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_bom_pmo', 'bom', 'pmo', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_bom_wc-root', 'bom', 'wc-root', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_bom_vsl-root', 'bom', 'vsl-root', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_bom_col-root', 'bom', 'col-root', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_bom_dev', 'bom', 'dev', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_bom_mkt', 'bom', 'mkt', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_pmo_wc-root', 'pmo', 'wc-root', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_pmo_vsl-root', 'pmo', 'vsl-root', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_pmo_col-root', 'pmo', 'col-root', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_wc-root_wc-am', 'wc-root', 'wc-am', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_wc-am_wc-bm', 'wc-am', 'wc-bm', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_wc-bm_wc-abm-an', 'wc-bm', 'wc-abm-an', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_wc-bm_wc-abm-kum', 'wc-bm', 'wc-abm-kum', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_wc-bm_wc-abm-tey', 'wc-bm', 'wc-abm-tey', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_wc-abm-an_an-sc-lead', 'wc-abm-an', 'an-sc-lead', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_wc-abm-an_an-hc-lead', 'wc-abm-an', 'an-hc-lead', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_wc-abm-an_an-rec', 'wc-abm-an', 'an-rec', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_an-sc-lead_an-sc-1', 'an-sc-lead', 'an-sc-1', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_an-hc-lead_an-hc-1', 'an-hc-lead', 'an-hc-1', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_an-hc-lead_an-hc-2', 'an-hc-lead', 'an-hc-2', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_an-rec_an-hk', 'an-rec', 'an-hk', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_wc-abm-kum_kum-sc-lead', 'wc-abm-kum', 'kum-sc-lead', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_wc-abm-kum_kum-hc-lead', 'wc-abm-kum', 'kum-hc-lead', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_wc-abm-kum_kum-rec', 'wc-abm-kum', 'kum-rec', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_kum-sc-lead_kum-sc-1', 'kum-sc-lead', 'kum-sc-1', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_kum-sc-lead_kum-sc-2', 'kum-sc-lead', 'kum-sc-2', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_kum-hc-lead_kum-hc-1', 'kum-hc-lead', 'kum-hc-1', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_kum-hc-lead_kum-hc-2', 'kum-hc-lead', 'kum-hc-2', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_dev_dev-spc', 'dev', 'dev-spc', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_dev_dev-nos', 'dev', 'dev-nos', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_vsl-root_vsl-sc', 'vsl-root', 'vsl-sc', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_vsl-root_vsl-hc', 'vsl-root', 'vsl-hc', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_col-root_col-tc', 'col-root', 'col-tc', 'master', NULL);
INSERT INTO public.connections VALUES ('conn_col-root_col-bde', 'col-root', 'col-bde', 'master', NULL);


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: history; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.history VALUES (1, '2026-06-30 05:41:08.48', 'Seeded initial org structure', NULL);
INSERT INTO public.history VALUES (2, '2026-06-30 05:41:41.905', 'Added new node "Test Node"', '{"nodeId": "nd_mr07yj7f_3c580883"}');
INSERT INTO public.history VALUES (3, '2026-06-30 05:41:42.62', 'Deleted node "Test Node"', '{"nodeId": "nd_mr07yj7f_3c580883"}');
INSERT INTO public.history VALUES (4, '2026-06-30 08:14:03.406', 'Verify PUT roundtrip', NULL);
INSERT INTO public.history VALUES (5, '2026-06-30 08:18:05.436', 'Added new node "E2E UI Test Node"', '{"nodeId": "nd_mr0djnpj_4b8520c3"}');
INSERT INTO public.history VALUES (6, '2026-06-30 08:18:20.995', 'Deleted node "E2E UI Test Node"', '{"nodeId": "nd_mr0djnpj_4b8520c3"}');
INSERT INTO public.history VALUES (7, '2026-06-30 08:34:07.393', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (8, '2026-06-30 08:44:55.821', 'Updated "Wellness Center"', '{"nodeId": "wc-root"}');
INSERT INTO public.history VALUES (9, '2026-06-30 08:47:37.905', 'Updated "Wellness Center"', '{"nodeId": "wc-root"}');
INSERT INTO public.history VALUES (10, '2026-06-30 09:00:44.145', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (11, '2026-06-30 09:05:37.307', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (12, '2026-06-30 09:05:41.852', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (13, '2026-06-30 09:07:53.39', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (14, '2026-06-30 09:14:23.883', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (15, '2026-06-30 09:15:33.192', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (16, '2026-06-30 09:15:34.068', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (17, '2026-06-30 09:15:35.529', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (18, '2026-06-30 09:15:37.971', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (19, '2026-06-30 09:15:40.784', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (20, '2026-06-30 09:15:41.762', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (21, '2026-06-30 09:15:43.237', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (22, '2026-06-30 09:15:45.993', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (23, '2026-06-30 09:15:52.426', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (24, '2026-06-30 09:15:53.804', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (25, '2026-06-30 09:15:55.643', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (26, '2026-06-30 09:15:56.8', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (27, '2026-06-30 09:16:01.58', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (28, '2026-06-30 09:16:03.61', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (29, '2026-06-30 09:16:07.438', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (30, '2026-06-30 09:16:08.466', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (31, '2026-06-30 09:16:10.153', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (32, '2026-06-30 09:16:11.087', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (33, '2026-06-30 09:16:12.112', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (34, '2026-06-30 09:16:14.462', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (35, '2026-06-30 09:16:17.337', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (36, '2026-06-30 09:16:18.558', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (37, '2026-06-30 09:16:19.275', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (38, '2026-06-30 09:16:21.802', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (39, '2026-06-30 09:16:25.434', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (40, '2026-06-30 09:16:28.339', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (41, '2026-06-30 09:16:29.11', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (42, '2026-06-30 09:16:31.101', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (43, '2026-06-30 09:16:34.661', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (44, '2026-06-30 09:16:36.07', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (45, '2026-06-30 09:16:37.305', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (46, '2026-06-30 09:16:38.625', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (47, '2026-06-30 09:16:40.161', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (48, '2026-06-30 09:17:09.225', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (49, '2026-06-30 09:17:11.374', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (50, '2026-06-30 09:17:12.945', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (51, '2026-06-30 09:17:14.888', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (52, '2026-06-30 09:17:22.03', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (53, '2026-06-30 09:21:01.716', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (54, '2026-06-30 09:23:42.102', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (55, '2026-06-30 09:23:46.276', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (56, '2026-06-30 09:48:08.057', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (57, '2026-06-30 09:48:16.4', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (58, '2026-06-30 10:29:08.593', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (59, '2026-06-30 10:29:11.471', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (60, '2026-06-30 10:34:14.99', 'Updated "Business Operations Mgr"', '{"nodeId": "bom"}');
INSERT INTO public.history VALUES (61, '2026-06-30 10:34:17.869', 'Updated "Business Operations Mgr"', '{"nodeId": "bom"}');
INSERT INTO public.history VALUES (62, '2026-06-30 10:35:49.651', 'Added new node "New Node"', '{"nodeId": "nd_mr0igsf3_9a24a24d"}');
INSERT INTO public.history VALUES (63, '2026-06-30 10:35:53.118', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (64, '2026-06-30 10:35:57.399', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (65, '2026-06-30 10:36:02.614', 'Deleted node "New Node"', '{"nodeId": "nd_mr0igsf3_9a24a24d"}');
INSERT INTO public.history VALUES (66, '2026-06-30 10:44:18.218', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (67, '2026-06-30 10:46:18.817', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (68, '2026-06-30 10:46:20.302', 'Moved 1 node', NULL);
INSERT INTO public.history VALUES (69, '2026-06-30 11:10:22.644', 'Updated "Project Mgmt Analyst"', '{"nodeId": "pmo"}');
INSERT INTO public.history VALUES (70, '2026-06-30 14:13:34.485', 'Moved "R&D Manager"', '{"nodeId": "rnd"}');
INSERT INTO public.history VALUES (71, '2026-06-30 14:13:34.485', 'Moved "Wellness Center"', '{"nodeId": "wc-root"}');
INSERT INTO public.history VALUES (72, '2026-06-30 14:13:34.485', 'Moved "Wellness Center"', '{"nodeId": "wc-root"}');


--
-- Data for Name: nodes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.nodes VALUES ('an-sc-lead', 'LEAD', 'Sales Caller Lead', 'Pavithra Sakkari', '#ff7043', 'wc', 'active', -285, 829, 'master', false, 'null', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:05.919', '2026-06-30 14:13:42.973');
INSERT INTO public.nodes VALUES ('an-sc-1', 'SALES CALLER', 'Sales Caller', 'Open Position', '#ff7043', 'wc', 'hiring', -291, 1083, 'master', false, '{"req": 1, "have": 0, "hire": 1, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:05.962', '2026-06-30 14:13:43.075');
INSERT INTO public.nodes VALUES ('dev-nos', 'OUTLET SOURCE', 'New Outlet Sourcing', 'Hire 1 Position', '#7c4dff', 'dev', 'hiring', 1035, 620, 'master', false, '{"req": 1, "have": 0, "hire": 1, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:07.388', '2026-06-30 14:13:43.174');
INSERT INTO public.nodes VALUES ('an-hc-2', 'HEALTH COACH', 'Health Coach 2', 'Screening', '#ff7043', 'wc', 'hiring', -4, 1206, 'master', false, '{"req": 1, "have": 0, "hire": 1, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:06.311', '2026-06-30 14:13:43.278');
INSERT INTO public.nodes VALUES ('an-hc-1', 'HEALTH COACH', 'Health Coach 1', 'Open Position', '#ff7043', 'wc', 'hiring', -10, 1003, 'master', false, '{"req": 1, "have": 0, "hire": 1, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:06.269', '2026-06-30 14:13:43.381');
INSERT INTO public.nodes VALUES ('an-hc-lead', 'LEAD', 'Health Coach Lead', 'Kokila', '#ff7043', 'wc', 'active', -55, 865, 'master', false, 'null', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:06.166', '2026-06-30 14:13:43.484');
INSERT INTO public.nodes VALUES ('an-hk', 'HOUSEKEEPING', 'Housekeeping', 'Open', '#ff7043', 'wc', 'hiring', 200, 986, 'master', false, '{"req": 1, "have": 0, "hire": 1, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:06.474', '2026-06-30 14:13:43.586');
INSERT INTO public.nodes VALUES ('rnd', 'R&D MANAGER', 'R&D Manager', 'Shyam Kumar', '#ab47bc', 'ops', 'active', 975, -292, 'master', false, 'null', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:05.247', '2026-06-30 14:13:43.688');
INSERT INTO public.nodes VALUES ('col-root', 'BDM — LEAD', 'Collab Lead', 'Ram Ravanan', '#66bb6a', 'col', 'active', 1725, 450, 'master', false, 'null', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:07.513', '2026-06-30 14:13:43.79');
INSERT INTO public.nodes VALUES ('dev-spc', 'SYS & PROCESS', 'System & Process', 'Hire 1 Position', '#7c4dff', 'dev', 'hiring', 616, 508, 'master', false, '{"req": 1, "have": 0, "hire": 1, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:07.346', '2026-06-30 14:13:43.893');
INSERT INTO public.nodes VALUES ('wc-abm-tey', 'NEW OUTLET', 'Teynampet', 'Location TBD', '#546e7a', 'wc', 'future', 777, 643, 'master', false, 'null', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:07.181', '2026-06-30 14:13:43.994');
INSERT INTO public.nodes VALUES ('kum-hc-lead', 'LEAD', 'Health Coach Lead', 'TBD', '#ff7043', 'wc', 'hiring', 554, 837, 'master', false, '{"req": 1, "have": 0, "hire": 1, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:06.983', '2026-06-30 14:13:44.098');
INSERT INTO public.nodes VALUES ('kum-sc-2', 'SALES CALLER', 'Sugashini', 'Dual SC/HC', '#ff7043', 'wc', 'active', 295, 1136, 'master', false, 'null', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:06.882', '2026-06-30 14:13:44.204');
INSERT INTO public.nodes VALUES ('kum-hc-2', 'HEALTH COACH', 'Pongali', 'Dual role', '#ff7043', 'wc', 'active', 549, 1161, 'master', false, 'null', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:07.133', '2026-06-30 14:13:44.3');
INSERT INTO public.nodes VALUES ('kum-sc-lead', 'LEAD', 'Sales Caller Lead', 'TBD', '#ff7043', 'wc', 'hiring', 391, 834, 'master', false, '{"req": 1, "have": 0, "hire": 1, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:06.678', '2026-06-30 14:13:44.351');
INSERT INTO public.nodes VALUES ('kum-sc-1', 'SALES CALLER', 'Gayathri', 'Active', '#ff7043', 'wc', 'active', 411, 1003, 'master', false, 'null', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:06.779', '2026-06-30 14:13:44.404');
INSERT INTO public.nodes VALUES ('wc-am', 'AREA MGR', 'Area Manager', 'Hiring in progress', '#ff7043', 'wc', 'hiring', 130, 329, 'master', false, '{"req": 1, "have": 0, "hire": 1, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:05.654', '2026-06-30 14:13:45.223');
INSERT INTO public.nodes VALUES ('dev', 'COMMON — TECH', 'Development Team', 'System & Process · Outlets', '#7c4dff', 'dev', 'hiring', 792, 290, 'master', false, '{"req": 2, "have": 0, "hire": 2, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:07.293', '2026-06-30 14:13:44.506');
INSERT INTO public.nodes VALUES ('pmo', 'PMO ANALYST', 'Project Mgmt Analyst', 'Hiring — 1 Position', '#7c4dff', 'ops', 'hiring', 1615, -28, 'master', false, '{"req": 2, "have": 0, "hire": 2, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:05.54', '2026-06-30 14:13:44.611');
INSERT INTO public.nodes VALUES ('bom', 'OPERATIONS', 'Business Operations Mgr', 'Hiring — 1 Position', '#26c6da', 'ops', 'hiring', 999, -113, 'master', false, '{"req": 1, "have": 0, "hire": 1, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:05.449', '2026-06-30 14:13:44.711');
INSERT INTO public.nodes VALUES ('wc-abm-kum', 'ABM — KUM', 'Kumananchavadi', 'Pavithra B', '#ff7043', 'wc', 'active', 327, 646, 'master', false, '{"req": 8, "have": 6, "hire": 2, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:06.575', '2026-06-30 14:13:44.814');
INSERT INTO public.nodes VALUES ('vsl-sc', 'SETTER CALLER', 'Setter Caller', 'Hire 1 Position', '#26c6da', 'vsl', 'hiring', 1380, 700, 'master', false, '{"req": 1, "have": 0, "hire": 1, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:07.462', '2026-06-30 14:13:45.429');
INSERT INTO public.nodes VALUES ('vsl-hc', 'HEALTH COACH', 'Health Coach', 'Hire 1 Position', '#26c6da', 'vsl', 'hiring', 1520, 700, 'master', false, '{"req": 1, "have": 0, "hire": 1, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:07.488', '2026-06-30 14:13:45.532');
INSERT INTO public.nodes VALUES ('wc-abm-an', 'ABM — A/N', 'A/N Branch', 'Hiring', '#ff7043', 'wc', 'hiring', 0, 700, 'master', false, '{"req": 11, "have": 7, "hire": 4, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:05.859', '2026-06-30 14:13:44.918');
INSERT INTO public.nodes VALUES ('col-bde', 'BDE', 'Business Dev Exec', 'Future Hire 1', '#66bb6a', 'col', 'future', 1951, 616, 'master', false, '{"req": 1, "have": 0, "hire": 1, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:07.564', '2026-06-30 14:13:45.634');
INSERT INTO public.nodes VALUES ('kum-hc-1', 'HEALTH COACH', 'Kavi Priya', 'Active', '#ff7043', 'wc', 'active', 894, 1120, 'master', false, 'null', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:07.087', '2026-06-30 14:13:45.737');
INSERT INTO public.nodes VALUES ('col-tc', 'TELE CALLER', 'Tele Caller', 'Future Hire 1', '#66bb6a', 'col', 'future', 1717, 603, 'master', false, '{"req": 1, "have": 0, "hire": 1, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:07.539', '2026-06-30 14:13:45.837');
INSERT INTO public.nodes VALUES ('mkt', 'COMMON — MKTG', 'Marketing Team', 'Abi — Budget · Ads · Leads', '#f06292', 'mkt', 'active', 1182, 458, 'master', false, '{"req": 1, "have": 1, "hire": 0, "notice": 0}', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:07.414', '2026-06-30 14:13:45.942');
INSERT INTO public.nodes VALUES ('an-rec', 'RECEPTION', 'Receptionist', 'Dharshana', '#ff7043', 'wc', 'active', 160, 840, 'master', false, 'null', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:06.37', '2026-06-30 14:13:45.019');
INSERT INTO public.nodes VALUES ('wc-root', 'PROJECT', 'Wellness Center', '3 Branches', '#ff7043', 'wc', 'active', 120, 144, 'master', false, 'null', 'null', '{"dept": "wc", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:05.567', '2026-06-30 14:13:45.122');
INSERT INTO public.nodes VALUES ('wc-bm', 'BRANCH MGR', 'Branch Manager', 'Pramoth Gopi', '#ff7043', 'wc', 'active', 127, 500, 'master', false, 'null', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:05.757', '2026-06-30 14:13:45.329');
INSERT INTO public.nodes VALUES ('vsl-root', 'BDM — LEAD', 'VSL Lead', 'Robin', '#26c6da', 'vsl', 'active', 1445, 463, 'master', false, 'null', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:07.437', '2026-06-30 14:13:46.045');
INSERT INTO public.nodes VALUES ('kum-rec', 'RECEPTION', 'Ajay', 'Replacement', '#ff7043', 'wc', 'active', 737, 837, 'master', false, 'null', NULL, '{"dept": "", "kpis": [], "kras": [], "doc_link": "", "doc_notes": "", "reports_to": "", "responsibilities": ""}', '2026-06-30 05:41:07.158', '2026-06-30 14:13:46.15');


--
-- Name: history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.history_id_seq', 72, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: connections connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: history history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.history
    ADD CONSTRAINT history_pkey PRIMARY KEY (id);


--
-- Name: nodes nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT nodes_pkey PRIMARY KEY (id);


--
-- Name: connections_fromNode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "connections_fromNode_idx" ON public.connections USING btree ("fromNode");


--
-- Name: connections_toNode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "connections_toNode_idx" ON public.connections USING btree ("toNode");


--
-- Name: files_nodeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "files_nodeId_key" ON public.files USING btree ("nodeId");


--
-- Name: history_ts_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX history_ts_idx ON public.history USING btree (ts);


--
-- Name: connections connections_fromNode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT "connections_fromNode_fkey" FOREIGN KEY ("fromNode") REFERENCES public.nodes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: connections connections_toNode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT "connections_toNode_fkey" FOREIGN KEY ("toNode") REFERENCES public.nodes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: files files_nodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "files_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES public.nodes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict wfeamCNXGKx3kEs3r8ufAR6RElCke4T1FcDxpCqTQ3Z1LUPQhzBIIGkWG7PtM0V

