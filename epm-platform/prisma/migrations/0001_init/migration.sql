-- Mizan EPM — initial schema migration.
-- Hand-authored to mirror prisma/schema.prisma (Prisma migrate produces the
-- same shape from the schema; kept here so the DB can be stood up without the
-- Prisma engine binaries). Row-level security is applied separately in
-- infra/postgres/rls.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- ── Enums ───────────────────────────────────────────────────────────────────
CREATE TYPE "TenantStatus"   AS ENUM ('ACTIVE','SUSPENDED','TRIAL');
CREATE TYPE "UserStatus"     AS ENUM ('ACTIVE','INVITED','DISABLED');
CREATE TYPE "OrgUnitType"    AS ENUM ('ENTERPRISE','BUSINESS_UNIT','DEPARTMENT','TEAM','COST_CENTER');
CREATE TYPE "ObjectiveType"  AS ENUM ('STRATEGIC','OKR','GOAL');
CREATE TYPE "KpiCategory"    AS ENUM ('STRATEGIC','ENTERPRISE','OPERATIONAL','DEPARTMENT','INDIVIDUAL');
CREATE TYPE "KpiDirection"   AS ENUM ('HIGHER_IS_BETTER','LOWER_IS_BETTER','TARGET_IS_BEST');
CREATE TYPE "KpiStatus"      AS ENUM ('DRAFT','PENDING_APPROVAL','ACTIVE','ARCHIVED');
CREATE TYPE "RiskStatus"     AS ENUM ('OPEN','MITIGATING','MONITORED','CLOSED','ESCALATED');
CREATE TYPE "PortfolioType"  AS ENUM ('STRATEGIC','PROJECT','APPLICATION','TECHNOLOGY','INVESTMENT','DEMAND');
CREATE TYPE "ProjectPhase"   AS ENUM ('INITIATION','PLANNING','DESIGN','EXECUTION','BUILD','TESTING','CLOSURE');
CREATE TYPE "RagStatus"      AS ENUM ('ON_TRACK','AT_RISK','OFF_TRACK','NOT_STARTED','COMPLETED');
CREATE TYPE "Cadence"        AS ENUM ('DAILY','WEEKLY','MONTHLY','QUARTERLY','ANNUAL');

-- ── Tables ───────────────────────────────────────────────────────────────────
CREATE TABLE tenants (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  locale        text NOT NULL DEFAULT 'en',
  timezone      text NOT NULL DEFAULT 'UTC',
  branding      jsonb,
  "featureFlags" jsonb,
  status        "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  "updatedAt"   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE org_units (
  id           text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"   text NOT NULL,
  "parentId"   text,
  name         text NOT NULL,
  type         "OrgUnitType" NOT NULL DEFAULT 'DEPARTMENT',
  "costCenter" text
);

CREATE TABLE users (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"    text NOT NULL,
  email         text NOT NULL,
  "displayName" text NOT NULL,
  locale        text,
  "externalId"  text,
  status        "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "orgUnitId"   text,
  "lastLoginAt" timestamptz,
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  "updatedAt"   timestamptz NOT NULL DEFAULT now(),
  "deletedAt"   timestamptz,
  UNIQUE ("tenantId", email)
);

CREATE TABLE roles (
  id           text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"   text NOT NULL,
  key          text NOT NULL,
  name         text NOT NULL,
  description  text,
  permissions  text[] NOT NULL DEFAULT '{}',
  "isSystem"   boolean NOT NULL DEFAULT false,
  UNIQUE ("tenantId", key)
);

CREATE TABLE user_roles (
  "userId"         text NOT NULL,
  "roleId"         text NOT NULL,
  "scopeOrgUnitId" text,
  PRIMARY KEY ("userId","roleId")
);

CREATE TABLE perspectives (
  id         text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" text NOT NULL,
  name       text NOT NULL,
  "order"    integer NOT NULL DEFAULT 0,
  color      text
);

CREATE TABLE objectives (
  id             text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"     text NOT NULL,
  "perspectiveId" text,
  "parentId"     text,
  title          text NOT NULL,
  description    text,
  type           "ObjectiveType" NOT NULL DEFAULT 'STRATEGIC',
  "ownerId"      text,
  weight         double precision NOT NULL DEFAULT 1,
  status         "RagStatus" NOT NULL DEFAULT 'ON_TRACK',
  progress       double precision NOT NULL DEFAULT 0,
  "startDate"    timestamptz,
  "dueDate"      timestamptz,
  "createdAt"    timestamptz NOT NULL DEFAULT now(),
  "updatedAt"    timestamptz NOT NULL DEFAULT now(),
  "deletedAt"    timestamptz
);

CREATE TABLE key_results (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "objectiveId" text NOT NULL,
  title         text NOT NULL,
  "startValue"  double precision NOT NULL DEFAULT 0,
  "targetValue" double precision NOT NULL,
  "currentValue" double precision NOT NULL DEFAULT 0,
  unit          text,
  progress      double precision NOT NULL DEFAULT 0
);

CREATE TABLE kpis (
  id              text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"      text NOT NULL,
  code            text NOT NULL,
  name            text NOT NULL,
  description     text,
  category        "KpiCategory" NOT NULL DEFAULT 'OPERATIONAL',
  unit            text,
  direction       "KpiDirection" NOT NULL DEFAULT 'HIGHER_IS_BETTER',
  frequency       "Cadence" NOT NULL DEFAULT 'MONTHLY',
  "ownerId"       text,
  "orgUnitId"     text,
  weight          double precision NOT NULL DEFAULT 1,
  target          double precision,
  "thresholdGreen" double precision,
  "thresholdRed"  double precision,
  status          "KpiStatus" NOT NULL DEFAULT 'DRAFT',
  formula         text,
  "createdBy"     text,
  "createdAt"     timestamptz NOT NULL DEFAULT now(),
  "updatedAt"     timestamptz NOT NULL DEFAULT now(),
  "deletedAt"     timestamptz,
  UNIQUE ("tenantId", code)
);

CREATE TABLE kpi_measurements (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "kpiId"       text NOT NULL,
  "periodStart" timestamptz NOT NULL,
  "periodEnd"   timestamptz NOT NULL,
  actual        double precision NOT NULL,
  target        double precision,
  note          text,
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("kpiId","periodStart")
);

CREATE TABLE kpi_objectives (
  "kpiId"       text NOT NULL,
  "objectiveId" text NOT NULL,
  weight        double precision NOT NULL DEFAULT 1,
  PRIMARY KEY ("kpiId","objectiveId")
);

CREATE TABLE risks (
  id             text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"     text NOT NULL,
  code           text NOT NULL,
  title          text NOT NULL,
  description    text,
  category       text,
  "ownerId"      text,
  likelihood     integer NOT NULL DEFAULT 1,
  impact         integer NOT NULL DEFAULT 1,
  "inherentScore" integer,
  "residualScore" integer,
  appetite       integer,
  status         "RiskStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt"    timestamptz NOT NULL DEFAULT now(),
  "updatedAt"    timestamptz NOT NULL DEFAULT now(),
  "deletedAt"    timestamptz,
  UNIQUE ("tenantId", code)
);

CREATE TABLE kris (
  id         text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "riskId"   text NOT NULL,
  name       text NOT NULL,
  unit       text,
  threshold  double precision,
  current    double precision,
  breached   boolean NOT NULL DEFAULT false
);

CREATE TABLE mitigations (
  id        text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "riskId"  text NOT NULL,
  action    text NOT NULL,
  "ownerId" text,
  "dueDate" timestamptz,
  status    "RagStatus" NOT NULL DEFAULT 'ON_TRACK'
);

CREATE TABLE portfolios (
  id         text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" text NOT NULL,
  name       text NOT NULL,
  type       "PortfolioType" NOT NULL DEFAULT 'STRATEGIC',
  budget     double precision NOT NULL DEFAULT 0
);

CREATE TABLE initiatives (
  id              text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"      text NOT NULL,
  "portfolioId"   text,
  title           text NOT NULL,
  "businessCase"  text,
  "strategicValue" double precision NOT NULL DEFAULT 0,
  "executionRisk" double precision NOT NULL DEFAULT 0,
  budget          double precision NOT NULL DEFAULT 0,
  benefit         double precision NOT NULL DEFAULT 0,
  progress        double precision NOT NULL DEFAULT 0,
  status          "RagStatus" NOT NULL DEFAULT 'ON_TRACK',
  "startDate"     timestamptz,
  "dueDate"       timestamptz,
  "createdAt"     timestamptz NOT NULL DEFAULT now(),
  "deletedAt"     timestamptz
);

CREATE TABLE projects (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"    text NOT NULL,
  "portfolioId" text,
  code          text NOT NULL,
  name          text NOT NULL,
  "managerId"   text,
  phase         "ProjectPhase" NOT NULL DEFAULT 'INITIATION',
  health        "RagStatus" NOT NULL DEFAULT 'ON_TRACK',
  progress      double precision NOT NULL DEFAULT 0,
  budget        double precision NOT NULL DEFAULT 0,
  "actualCost"  double precision NOT NULL DEFAULT 0,
  "startDate"   timestamptz,
  "endDate"     timestamptz,
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  "deletedAt"   timestamptz,
  UNIQUE ("tenantId", code)
);

CREATE TABLE milestones (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId"   text,
  "initiativeId" text,
  title         text NOT NULL,
  "dueDate"     timestamptz,
  completed     boolean NOT NULL DEFAULT false
);

CREATE TABLE ai_provider_configs (
  id              text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"      text NOT NULL,
  provider        text NOT NULL,
  enabled         boolean NOT NULL DEFAULT false,
  priority        integer NOT NULL DEFAULT 100,
  "apiKeyRef"     text,
  "baseUrl"       text,
  deployment      text,
  "defaultModel"  text NOT NULL,
  "fallbackModels" text[] NOT NULL DEFAULT '{}',
  "embeddingModel" text,
  "rateLimitRpm"  integer,
  options         jsonb,
  UNIQUE ("tenantId", provider)
);

CREATE TABLE audit_logs (
  id           text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"   text NOT NULL,
  "actorId"    text,
  action       text NOT NULL,
  "entityType" text NOT NULL,
  "entityId"   text NOT NULL,
  before       jsonb,
  after        jsonb,
  ip           text,
  "createdAt"  timestamptz NOT NULL DEFAULT now()
);

-- ── Foreign keys ─────────────────────────────────────────────────────────────
ALTER TABLE org_units        ADD CONSTRAINT fk_orgunit_tenant  FOREIGN KEY ("tenantId")   REFERENCES tenants(id);
ALTER TABLE org_units        ADD CONSTRAINT fk_orgunit_parent  FOREIGN KEY ("parentId")   REFERENCES org_units(id);
ALTER TABLE users            ADD CONSTRAINT fk_user_tenant     FOREIGN KEY ("tenantId")   REFERENCES tenants(id);
ALTER TABLE users            ADD CONSTRAINT fk_user_orgunit    FOREIGN KEY ("orgUnitId")  REFERENCES org_units(id);
ALTER TABLE roles            ADD CONSTRAINT fk_role_tenant     FOREIGN KEY ("tenantId")   REFERENCES tenants(id);
ALTER TABLE user_roles       ADD CONSTRAINT fk_ur_user         FOREIGN KEY ("userId")     REFERENCES users(id);
ALTER TABLE user_roles       ADD CONSTRAINT fk_ur_role         FOREIGN KEY ("roleId")     REFERENCES roles(id);
ALTER TABLE perspectives     ADD CONSTRAINT fk_persp_tenant    FOREIGN KEY ("tenantId")   REFERENCES tenants(id);
ALTER TABLE objectives       ADD CONSTRAINT fk_obj_tenant      FOREIGN KEY ("tenantId")   REFERENCES tenants(id);
ALTER TABLE objectives       ADD CONSTRAINT fk_obj_persp       FOREIGN KEY ("perspectiveId") REFERENCES perspectives(id);
ALTER TABLE objectives       ADD CONSTRAINT fk_obj_parent      FOREIGN KEY ("parentId")   REFERENCES objectives(id);
ALTER TABLE key_results      ADD CONSTRAINT fk_kr_obj          FOREIGN KEY ("objectiveId") REFERENCES objectives(id);
ALTER TABLE kpis             ADD CONSTRAINT fk_kpi_tenant      FOREIGN KEY ("tenantId")   REFERENCES tenants(id);
ALTER TABLE kpis             ADD CONSTRAINT fk_kpi_owner       FOREIGN KEY ("ownerId")    REFERENCES users(id);
ALTER TABLE kpi_measurements ADD CONSTRAINT fk_km_kpi          FOREIGN KEY ("kpiId")      REFERENCES kpis(id);
ALTER TABLE kpi_objectives   ADD CONSTRAINT fk_ko_kpi          FOREIGN KEY ("kpiId")      REFERENCES kpis(id);
ALTER TABLE kpi_objectives   ADD CONSTRAINT fk_ko_obj          FOREIGN KEY ("objectiveId") REFERENCES objectives(id);
ALTER TABLE risks            ADD CONSTRAINT fk_risk_tenant     FOREIGN KEY ("tenantId")   REFERENCES tenants(id);
ALTER TABLE risks            ADD CONSTRAINT fk_risk_owner      FOREIGN KEY ("ownerId")    REFERENCES users(id);
ALTER TABLE kris             ADD CONSTRAINT fk_kri_risk        FOREIGN KEY ("riskId")     REFERENCES risks(id);
ALTER TABLE mitigations      ADD CONSTRAINT fk_mit_risk        FOREIGN KEY ("riskId")     REFERENCES risks(id);
ALTER TABLE portfolios       ADD CONSTRAINT fk_pf_tenant       FOREIGN KEY ("tenantId")   REFERENCES tenants(id);
ALTER TABLE initiatives      ADD CONSTRAINT fk_init_tenant     FOREIGN KEY ("tenantId")   REFERENCES tenants(id);
ALTER TABLE initiatives      ADD CONSTRAINT fk_init_pf         FOREIGN KEY ("portfolioId") REFERENCES portfolios(id);
ALTER TABLE projects         ADD CONSTRAINT fk_proj_tenant     FOREIGN KEY ("tenantId")   REFERENCES tenants(id);
ALTER TABLE projects         ADD CONSTRAINT fk_proj_pf         FOREIGN KEY ("portfolioId") REFERENCES portfolios(id);
ALTER TABLE milestones       ADD CONSTRAINT fk_ms_proj         FOREIGN KEY ("projectId")  REFERENCES projects(id);
ALTER TABLE milestones       ADD CONSTRAINT fk_ms_init         FOREIGN KEY ("initiativeId") REFERENCES initiatives(id);
ALTER TABLE ai_provider_configs ADD CONSTRAINT fk_ai_tenant    FOREIGN KEY ("tenantId")   REFERENCES tenants(id);
ALTER TABLE audit_logs       ADD CONSTRAINT fk_audit_tenant    FOREIGN KEY ("tenantId")   REFERENCES tenants(id);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_tenant_status   ON users ("tenantId", status);
CREATE INDEX idx_orgunits_tenant_parent ON org_units ("tenantId","parentId");
CREATE INDEX idx_obj_tenant_status     ON objectives ("tenantId", status);
CREATE INDEX idx_kpis_tenant_cat_status ON kpis ("tenantId", category, status);
CREATE INDEX idx_km_kpi_period         ON kpi_measurements ("kpiId","periodStart");
CREATE INDEX idx_risks_tenant_status   ON risks ("tenantId", status);
CREATE INDEX idx_init_tenant_status    ON initiatives ("tenantId", status);
CREATE INDEX idx_proj_tenant_health    ON projects ("tenantId", health);
CREATE INDEX idx_audit_tenant_entity   ON audit_logs ("tenantId","entityType","entityId");
CREATE INDEX idx_audit_tenant_created  ON audit_logs ("tenantId","createdAt");
