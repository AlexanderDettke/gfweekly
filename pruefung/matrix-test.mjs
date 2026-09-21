import { score, absStufe, geldMax, vertretungFuer, absEnde } from './matrix-probe.mjs';
let fehler = 0;
const pruefe = (name, ist, soll) => {
  const ok = JSON.stringify(ist) === JSON.stringify(soll);
  if (!ok) { fehler++; console.log(`  FEHLT  ${name}: ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`); }
  else console.log(`  ok     ${name} = ${JSON.stringify(ist)}`);
};
const tag = (n) => new Date(Date.now() + n*86400000).toISOString().slice(0,10);

console.log('== Stufe aus der Dauer ==');
pruefe('3 Tage kurz',  absStufe({ von:'2026-10-05', bis:'2026-10-07' }), 'kurz');
pruefe('4 Tage mittel',absStufe({ von:'2026-10-05', bis:'2026-10-08' }), 'mittel');
pruefe('14 Tage mittel',absStufe({ von:'2026-10-05', bis:'2026-10-18' }), 'mittel');
pruefe('15 Tage lang', absStufe({ von:'2026-10-05', bis:'2026-10-19' }), 'lang');
pruefe('ohne bis kurz',absStufe({ von:'2026-10-05' }), 'kurz');
pruefe('Schätzung ändert die Stufe nicht', absStufe({ von:'2026-10-05', bis_geschaetzt:'2026-10-25' }), 'kurz');

console.log('\n== Geldbeträge ==');
pruefe('5.000 €', geldMax('vertrag über 5.000 € im jahr'), 5000);
pruefe('€ 2500', geldMax('kosten € 2500 netto'), 2500);
pruefe('2.500,50 EUR', geldMax('rechnung über 2.500,50 eur'), 2500.5);
pruefe('kein Geld', geldMax('ohne betrag'), 0);

const lea = { id:'a1', person:'Lea', von:'2026-10-05', bis:'2026-10-25', art:'geplant', kontakt:'wochenbrief', stufe:'lang' };
const kurz = { id:'a2', person:'Alex', von:tag(0), bis:null, bis_geschaetzt:tag(2), art:'sofort', kontakt:'keiner', stufe:'kurz' };

console.log('\n== Matrix, von Hand nachgerechnet ==');
const f1 = score({ kind:'thema', title:'Vertrag mit dem Landkreis', short_description:'', next_action:'', frist:'2026-10-01',
  priority:'hoch', gate:'gf', board_lane:'zu_besprechen', who:'Lea' }, lea);
pruefe('Vertrag, Frist vor Abreise → Z3 F3 U2 G3, Cluster A, vorher', [f1.z,f1.f,f1.u,f1.g,f1.cluster,f1.ampel,f1.quadrant], [3,3,2,3,'A','vorher','sofort']);

const f2 = score({ kind:'thema', title:'Newsletter im Oktober', short_description:'Entwurf steht', next_action:'Versand planen',
  frist:'2026-10-12', priority:'mittel', gate:'lea', board_lane:'in_klaerung', who:'Lea, Merle' }, lea);
pruefe('Newsletter im Fenster → Z2 F1 U0 G1, Cluster B, grün', [f2.z,f2.f,f2.u,f2.g,f2.cluster,f2.ampel,f2.quadrant], [2,1,0,1,'B','gruen','delegieren']);

const f3 = score({ kind:'partner', title:'Partner A', next_action:'Angebot schicken', short_description:'Gespräch lief gut',
  frist:'2026-10-20', stage:'negotiation', strand:'wwp', who:'Lea' }, lea);
pruefe('Partner in Verhandlung → Z2 F2 U1 G2, Cluster C, gelb', [f3.z,f3.f,f3.u,f3.g,f3.cluster,f3.ampel,f3.quadrant], [2,2,1,2,'C','gelb','sofort']);

const f4 = score({ kind:'thema', title:'Ablage sortieren', short_description:'liegt seit Monaten', next_action:'Ordner anlegen',
  frist:null, priority:'niedrig', gate:'team', who:'Merle' }, lea);
pruefe('Ablage mit Teamname → Z0 F1 U0 G0, Cluster D, ruht', [f4.z,f4.f,f4.u,f4.g,f4.cluster,f4.ampel,f4.quadrant], [0,1,0,0,'D','ruht','warten']);
const f4b = score({ kind:'thema', title:'Ablage sortieren', short_description:'liegt seit Monaten', next_action:'Ordner anlegen', frist:null, priority:'niedrig', gate:'team', who:'Lea' }, lea);
pruefe('dieselbe Ablage nur bei Lea → F0', [f4b.z,f4b.f,f4b.u,f4b.g,f4b.cluster], [0,0,1,0,'D']);

const f5 = score({ kind:'thema', title:'Bankvollmacht erneuern', short_description:'', next_action:'', frist:'2026-10-15',
  priority:'mittel', gate:'lea', who:'Lea' }, lea);
pruefe('Vollmacht → U3, Cluster A', [f5.z,f5.f,f5.u,f5.g,f5.cluster], [2,3,3,1,'A']);

const f6 = score({ kind:'kandidat', title:'Presseanfrage', body:'kurz', relevance:'hoch', frist:'2026-10-10', gate:'lea', who:'Lea' }, lea);
pruefe('Presse → F3 (Stichwort), Cluster E, rot', [f6.f,f6.cluster,f6.ampel], [3,'E','rot']);

console.log('\n== Kandidaten werden an ihrem Text gemessen ==');
const kurz1 = score({ kind:'kandidat', title:'Kurze Notiz', body:'zu wenig', gate:'lea', who:'Lea' }, lea);
pruefe('kurzer Kandidat ist eine Lücke', [kurz1.u, kurz1.luecke], [2, true]);
const lang1 = score({ kind:'kandidat', title:'Ausführlicher Kandidat',
  body:'Die Lokalzeitung fragt nach der Fläche der Zeltwiese, nach der Zahl der Gäste und nach dem Lärmschutz. Antwort bis Freitag erbeten.',
  gate:'lea', who:'Lea, Merle' }, lea);
pruefe('ausführlicher Kandidat ist keine Lücke', [lang1.u, lang1.luecke], [0, false]);

console.log('\n== Dieselbe Eingabe, dasselbe Ergebnis ==');
const r1 = score({ kind:'thema', title:'Probe', short_description:'a', next_action:'b', frist:'2026-10-10', gate:'lea', who:'Lea' }, lea, '2026-09-21');
const r2 = score({ kind:'thema', title:'Probe', short_description:'a', next_action:'b', frist:'2026-10-10', gate:'lea', who:'Lea' }, lea, '2026-09-21');
pruefe('score ist eine reine Funktion', JSON.stringify(r1) === JSON.stringify(r2), true);
const spaeter = score({ kind:'thema', title:'Probe', short_description:'a', next_action:'b', frist:'2026-10-10', gate:'lea', who:'Lea' }, lea, '2026-10-11');
pruefe('mit späterem Stichtag wird die Frist überfällig', spaeter.z, 3);

console.log('\n== Stichworte nur am Wortanfang ==');
const w1 = score({ kind:'kandidat', title:'Werbebudget für Minikampagnen zu Lineup-Ankündigungen', body:'Anfrage aus dem Marketing, 800 € pro Kampagne', gate:'lea', who:'Lea' }, lea);
pruefe('Ankündigungen ist keine Kündigung', w1.begruendung.includes('kündigung'), false);
const w2 = score({ kind:'thema', title:'Kündigungsfrist des Mietvertrags', short_description:'x', next_action:'y', gate:'lea', who:'Lea, Merle' }, lea);
pruefe('Kündigungsfrist zählt', w2.f, 3);
const w3 = score({ kind:'thema', title:'Datenbank aufräumen', short_description:'x', next_action:'y', gate:'team', who:'Merle' }, lea);
pruefe('Datenbank ist keine Bank', w3.f, 1);

console.log('\n== Kurze Abwesenheit: alles ruht außer Notfall ==');
const k1 = score({ kind:'thema', title:'Newsletter', short_description:'steht', next_action:'senden', frist:tag(1),
  priority:'mittel', gate:'alex', who:'Alex' }, kurz);
pruefe('Alltag ruht', [k1.ampel, k1.regel_note.startsWith('Kurze Abwesenheit')], ['ruht', true]);
const k2 = score({ kind:'thema', title:'Klage der Nachbarn', short_description:'', next_action:'', frist:tag(1),
  priority:'hoch', gate:'gf', who:'Alex' }, kurz);
pruefe('Notfall bleibt rot', [k2.f, k2.ampel], [3, 'rot']);

console.log('\n== Lange Abwesenheit: Regeltext bei gelb ==');
pruefe('Tag 15 ohne Einspruch', f3.regel_note.includes('Tag 15'), true);

console.log('\n== Vertretung aus der Linie ==');
const dep = [
  { person:'Lea', bereich:'gf', vertretung:'Alex', active:true },
  { person:'Lea', bereich:'*', vertretung:'Alex', active:true },
  { person:'Lea', bereich:'wwp', vertretung:'Merle', active:true },
];
pruefe('Strang schlägt Stern', vertretungFuer(f3, { strand:'wwp' }, lea, dep), 'Merle');
pruefe('gf bei G3', vertretungFuer({ ampel:'rot', g:3 }, { strand:null }, lea, dep), 'Alex');
pruefe('ruht ohne Vertretung', vertretungFuer({ ampel:'ruht', g:1 }, { strand:'wwp' }, lea, dep), null);

console.log('\n== Fenster ==');
pruefe('offenes Ende: 14 Tage', absEnde({ von:'2026-10-05' }), '2026-10-18');

console.log(fehler ? `\n${fehler} Abweichungen` : '\nAlle Proben in Ordnung');
process.exit(fehler ? 1 : 0);
