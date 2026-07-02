#!/usr/bin/env bash
set -euo pipefail
BIN=/usr/lib/postgresql/16/bin
RUN=/tmp/mizan-pg
PGDATA=$RUN/data
SOCK=$RUN/sock
MIG=/home/user/mhelmy5000/epm-platform/prisma/migrations/0001_init/migration.sql
RLS=/home/user/mhelmy5000/epm-platform/infra/postgres/rls.sql

# fresh runtime dir owned by the postgres user
rm -rf "$RUN"; mkdir -p "$PGDATA" "$SOCK"
chown -R postgres:postgres "$RUN"
chmod +r "$MIG" "$RLS"

run() { su postgres -c "$1"; }

run "$BIN/initdb -D $PGDATA -A trust -U postgres >/dev/null 2>&1"
run "$BIN/pg_ctl -D $PGDATA -o '-p 55432 -k $SOCK -c listen_addresses=\"\"' -w start >/dev/null 2>&1"
trap 'su postgres -c "$BIN/pg_ctl -D $PGDATA -w stop >/dev/null 2>&1" || true' EXIT

PSQL="$BIN/psql -h $SOCK -p 55432 -U postgres -v ON_ERROR_STOP=1"
APP="$BIN/psql -h $SOCK -p 55432 -U mizan_app -d mizan_epm -v ON_ERROR_STOP=1 -tA"

run "$BIN/createdb -h $SOCK -p 55432 -U postgres mizan_epm"
echo '== applying migration =='
run "$PSQL -d mizan_epm -q -f $MIG" && echo 'migration applied'
echo '== applying RLS =='
run "$PSQL -d mizan_epm -q -f $RLS" && echo 'RLS applied'

echo '== seed 2 tenants (as owner/superuser; RLS bypassed for setup) =='
run "$PSQL -d mizan_epm -q -c \"
  INSERT INTO tenants (id,slug,name) VALUES ('T1','t1','Tenant One'),('T2','t2','Tenant Two');
  INSERT INTO kpis (id,\\\"tenantId\\\",code,name) VALUES
    ('k1a','T1','A1','T1 KPI A'),('k1b','T1','A2','T1 KPI B'),('k1c','T1','A3','T1 KPI C'),
    ('k2a','T2','B1','T2 KPI A'),('k2b','T2','B2','T2 KPI B');
  INSERT INTO risks (id,\\\"tenantId\\\",code,title,likelihood,impact) VALUES
    ('r1','T1','R1','T1 risk',4,5),('r2','T2','R2','T2 risk',3,3);
\""

echo
echo '== RLS ISOLATION TESTS (connected as non-superuser mizan_app) =='
c_all=$(run "$APP -c \"SELECT count(*) FROM kpis;\"")
echo "no tenant context set → kpis visible: $c_all   (expect 0)"
c_t1=$(run "$APP -c \"SET app.tenant_id='T1'; SELECT count(*) FROM kpis;\"")
c_t1=$(echo "${c_t1}"|tail -n1)
echo "tenant=T1 → kpis visible: $c_t1   (expect 3)"
c_t2=$(run "$APP -c \"SET app.tenant_id='T2'; SELECT count(*) FROM kpis;\"")
c_t2=$(echo "${c_t2}"|tail -n1)
echo "tenant=T2 → kpis visible: $c_t2   (expect 2)"
r_t1=$(run "$APP -c \"SET app.tenant_id='T1'; SELECT count(*) FROM risks;\"")
r_t1=$(echo "${r_t1}"|tail -n1)
echo "tenant=T1 → risks visible: $r_t1   (expect 1)"
names_t1=$(run "$APP -c \"SET app.tenant_id='T1'; SELECT string_agg(code,',' ORDER BY code) FROM kpis;\"")
names_t1=$(echo "${names_t1}"|tail -n1)
echo "tenant=T1 → kpi codes: $names_t1   (expect A1,A2,A3)"

echo
echo '== WRITE GUARD: T1 context tries to insert a KPI tagged T2 =='
if run "$APP -c \"SET app.tenant_id='T1'; INSERT INTO kpis (id,\\\"tenantId\\\",code,name) VALUES ('x','T2','X','hack');\"" 2>/tmp/rls_err; then
  echo "UNEXPECTED: cross-tenant insert SUCCEEDED"
else
  echo "blocked by WITH CHECK: $(grep -o 'new row violates row-level security[^"]*' /tmp/rls_err | head -1)"
fi

echo
echo '== PASS CHECK =='
[ "$c_all" = "0" ] && [ "$c_t1" = "3" ] && [ "$c_t2" = "2" ] && [ "$r_t1" = "1" ] && [ "$names_t1" = "A1,A2,A3" ] \
  && echo "ALL RLS ASSERTIONS PASSED" || { echo "SOME ASSERTIONS FAILED"; exit 1; }
