/* Lokaler PostgreSQL Test der tatsächlichen Migrationen, ohne Produktionszugriff. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODUL || '@electric-sql/pglite');
const db = new PGlite();
try {
  await db.exec('create role anon; create role authenticated; create role service_role;');
  for (const name of ['20261005053521_hh_organisation_v32', '20261015040502_hh_org_alexander_entscheidungsfuehrung']) {
    await db.exec(fs.readFileSync(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), 'utf8'));
    if (name === '20261005053521_hh_organisation_v32') {
      await db.exec("select hh_org_wahl(1,0,'Alex',0); select hh_org_freigabe(1,'Alex',true,0);");
    }
  }
  const row = (await db.query('select * from gfweekly_org_entscheidung where id=1')).rows[0];
  assert.ok(row.alex_frei && !row.lea_frei && row.freigegeben_am, 'Vorhandene Freigabe wird wirksam ohne Lea');
  assert.equal((await db.query("select count(*)::int as n from gfweekly_org_log where what='entscheidungsregel'")).rows[0].n, 1);
  await db.exec('begin;');
  await db.exec(fs.readFileSync(new URL('./organisation-entscheidungsfuehrung.sql', import.meta.url), 'utf8'));
  await db.exec('rollback;');
  assert.equal((await db.query('select count(*)::int as n from gfweekly_org_entscheidung')).rows[0].n, 8);
  console.log('Organisation: Migration, vorhandene Freigabe, Entscheidungslogik und Rechte bestanden.');
} finally { await db.close(); }
