/* Lokaler PostgreSQL Test der tatsächlichen Migrationen, ohne Produktionszugriff. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODUL || '@electric-sql/pglite');
const db = new PGlite();
try {
  await db.exec('create role anon; create role authenticated; create role service_role;');
  for (const name of ['20261005053521_hh_organisation_v32', '20261015040502_hh_org_alexander_entscheidungsfuehrung', '20261015151918_hh_org_wahl_gilt_sofort']) {
    await db.exec(fs.readFileSync(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), 'utf8'));
    if (name === '20261005053521_hh_organisation_v32') {
      await db.exec("select hh_org_wahl(1,0,'Alex',0); select hh_org_freigabe(1,'Alex',true,0); select hh_org_wahl(2,1,'Lea',0);");
    }
    if (name === '20261015040502_hh_org_alexander_entscheidungsfuehrung') {
      const row = (await db.query('select * from gfweekly_org_entscheidung where id=1')).rows[0];
      assert.ok(row.alex_frei && !row.lea_frei && row.freigegeben_am, 'Vorhandene Freigabe wird wirksam ohne Lea');
      assert.ok(!(await db.query('select * from gfweekly_org_entscheidung where id=2')).rows[0].freigegeben_am, 'Gewählt ohne Freigabe gilt vor der Regel noch nicht');
    }
  }
  const zwei = (await db.query('select * from gfweekly_org_entscheidung where id=2')).rows[0];
  assert.ok(zwei.wahl === 1 && zwei.alex_frei && zwei.freigegeben_am, 'Gewählte Entscheidung gilt nach der Regel „Wahl gilt sofort“');
  assert.equal((await db.query("select count(*)::int as n from gfweekly_org_log where what='entscheidungsregel'")).rows[0].n, 2);
  const neu = (await db.query("select hh_org_wahl(3,0,'Alex',0) as e")).rows[0].e;
  assert.ok(neu, 'Wahl liefert die Entscheidung');
  assert.ok((await db.query('select freigegeben_am from gfweekly_org_entscheidung where id=3')).rows[0].freigegeben_am, 'Neue Wahl gilt sofort');
  await db.exec('begin;');
  await db.exec(fs.readFileSync(new URL('./organisation-entscheidungsfuehrung.sql', import.meta.url), 'utf8'));
  await db.exec('rollback;');
  assert.equal((await db.query('select count(*)::int as n from gfweekly_org_entscheidung')).rows[0].n, 8);
  console.log('Organisation: Migration, vorhandene Freigabe, Entscheidungslogik und Rechte bestanden.');
} finally { await db.close(); }
