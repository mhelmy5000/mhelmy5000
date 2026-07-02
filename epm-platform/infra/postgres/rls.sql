-- Mizan EPM — Row-Level Security (defense-in-depth multi-tenancy).
--
-- Every request runs inside a transaction that first sets the tenant context:
--     SET LOCAL app.tenant_id = '<tenantId>';
-- (wired in a Prisma $extends/middleware). Policies then transparently scope
-- every read/write to that tenant, so a missing WHERE clause can never leak
-- another tenant's data. FORCE RLS makes this apply even to the table owner.
--
-- The application connects as a NON-superuser role (mizan_app); superusers
-- bypass RLS by design, so migrations run as the owner and traffic as mizan_app.

-- current tenant from the session GUC (NULL when unset → policies match nothing)
CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT current_setting('app.tenant_id', true) $$;

-- ── Direct tenant-scoped tables (own a tenantId column) ──────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'org_units','users','roles','perspectives','objectives','kpis','risks',
    'portfolios','initiatives','projects','ai_provider_configs','audit_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($p$
      CREATE POLICY tenant_isolation ON %I FOR ALL
        USING ("tenantId" = app_current_tenant())
        WITH CHECK ("tenantId" = app_current_tenant())
    $p$, t);
  END LOOP;
END $$;

-- ── The tenants table itself (scoped by its own id) ──────────────────────────
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_self ON tenants FOR ALL
  USING (id = app_current_tenant()) WITH CHECK (id = app_current_tenant());

-- ── Child tables (scoped transitively via their parent's tenant) ─────────────
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON key_results FOR ALL
  USING (EXISTS (SELECT 1 FROM objectives o WHERE o.id = "objectiveId" AND o."tenantId" = app_current_tenant()))
  WITH CHECK (EXISTS (SELECT 1 FROM objectives o WHERE o.id = "objectiveId" AND o."tenantId" = app_current_tenant()));

ALTER TABLE kpi_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_measurements FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON kpi_measurements FOR ALL
  USING (EXISTS (SELECT 1 FROM kpis k WHERE k.id = "kpiId" AND k."tenantId" = app_current_tenant()))
  WITH CHECK (EXISTS (SELECT 1 FROM kpis k WHERE k.id = "kpiId" AND k."tenantId" = app_current_tenant()));

ALTER TABLE kpi_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_objectives FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON kpi_objectives FOR ALL
  USING (EXISTS (SELECT 1 FROM kpis k WHERE k.id = "kpiId" AND k."tenantId" = app_current_tenant()))
  WITH CHECK (EXISTS (SELECT 1 FROM kpis k WHERE k.id = "kpiId" AND k."tenantId" = app_current_tenant()));

ALTER TABLE kris ENABLE ROW LEVEL SECURITY;
ALTER TABLE kris FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON kris FOR ALL
  USING (EXISTS (SELECT 1 FROM risks r WHERE r.id = "riskId" AND r."tenantId" = app_current_tenant()))
  WITH CHECK (EXISTS (SELECT 1 FROM risks r WHERE r.id = "riskId" AND r."tenantId" = app_current_tenant()));

ALTER TABLE mitigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitigations FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON mitigations FOR ALL
  USING (EXISTS (SELECT 1 FROM risks r WHERE r.id = "riskId" AND r."tenantId" = app_current_tenant()))
  WITH CHECK (EXISTS (SELECT 1 FROM risks r WHERE r.id = "riskId" AND r."tenantId" = app_current_tenant()));

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON user_roles FOR ALL
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = "userId" AND u."tenantId" = app_current_tenant()))
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = "userId" AND u."tenantId" = app_current_tenant()));

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON milestones FOR ALL
  USING (
    ("projectId"    IS NOT NULL AND EXISTS (SELECT 1 FROM projects p    WHERE p.id = "projectId"    AND p."tenantId" = app_current_tenant()))
    OR ("initiativeId" IS NOT NULL AND EXISTS (SELECT 1 FROM initiatives i WHERE i.id = "initiativeId" AND i."tenantId" = app_current_tenant()))
  );

-- ── Roles ─────────────────────────────────────────────────────────────────
-- mizan_app  : tenant traffic. Non-superuser → RLS enforced. Sets app.tenant_id
--              per request (via the Prisma RLS extension) so it sees one tenant.
-- mizan_system: BYPASSRLS. Used ONLY by the pre-auth bootstrap (login's user /
--              tenant lookup, which must run before a tenant context exists) and
--              by migrations/seed. Never used for tenant-scoped feature traffic.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mizan_app') THEN
    CREATE ROLE mizan_app LOGIN PASSWORD 'mizan_app';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mizan_system') THEN
    CREATE ROLE mizan_system LOGIN PASSWORD 'mizan_system' BYPASSRLS;
  END IF;
END $$;
GRANT USAGE ON SCHEMA public TO mizan_app, mizan_system;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mizan_app, mizan_system;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mizan_app, mizan_system;
