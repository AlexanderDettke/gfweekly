# Kontrastpruefung der Token-Zone (V23). Liest site/assets/styles.css, rechnet WCAG-Kontraste
# fuer beide Themen und meldet jedes Paar unter der Schwelle. Aufruf: python3 pruefung/kontrast.py
import re, sys, os
CSS = os.path.join(os.path.dirname(__file__), '..', 'site', 'assets', 'styles.css')

def parse(block):
    tok = {}
    for m in re.finditer(r'(--[a-z0-9-]+)\s*:\s*([^;]+);', block):
        tok[m.group(1)] = m.group(2).strip()
    return tok

src = open(CSS, encoding='utf-8').read()
root = parse(src[src.index(':root{'):src.index('[data-theme="light"]{')])
light = dict(root); light.update(parse(src[src.index('[data-theme="light"]{'):src.index('[data-theme="colorful"]')]))

def rgba(v, tok, depth=0):
    v = v.strip()
    if v.startswith('var(') and depth < 6:
        inner = v[4:v.rindex(')')]
        name = inner.split(',')[0].strip()
        rest = inner.split(',', 1)[1].strip() if ',' in inner else None
        if name in tok: return rgba(tok[name], tok, depth+1)
        if rest: return rgba(rest, tok, depth+1)
        raise KeyError('Token fehlt: ' + name)
    m = re.match(r'#([0-9a-fA-F]{6})$', v)
    if m:
        h = m.group(1); return (int(h[0:2],16), int(h[2:4],16), int(h[4:6],16), 1.0)
    m = re.match(r'rgba?\(([^)]+)\)', v)
    if m:
        p = [x.strip() for x in m.group(1).split(',')]
        return (int(p[0]), int(p[1]), int(p[2]), float(p[3]) if len(p) > 3 else 1.0)
    raise ValueError('unbekannte Farbe: ' + v)

def over(fg, bg):                      # fg mit Alpha ueber bg legen, ungerundet bis zur Ausgabe
    a = fg[3]
    return tuple(fg[i]*a + bg[i]*(1-a) for i in range(3)) + (1.0,)

def lum(c):
    def f(x):
        x = x/255
        return x/12.92 if x <= 0.03928 else ((x+0.055)/1.055)**2.4
    return 0.2126*f(c[0]) + 0.7152*f(c[1]) + 0.0722*f(c[2])

def ratio(fg, bg):
    a, b = lum(fg), lum(bg)
    if a < b: a, b = b, a
    return (a+0.05)/(b+0.05)

# (Schrift, Grund, Grund-Unterlage falls der Grund durchsichtig ist, Schwelle, Zweck)
PAARE = [
 ('--text','--bg',None,4.5,'Text auf Seitengrund'),
 ('--text','--surface',None,4.5,'Text auf Karte'),
 ('--text','--surface-2',None,4.5,'Text auf zweiter Flaeche'),
 ('--text','--panel',None,4.5,'Text im Panel'),
 ('--text','--header-bg',None,4.5,'Text in der Kopfzeile'),
 ('--text-2','--surface',None,4.5,'Nebentext auf Karte'),
 ('--text-2','--surface-2',None,4.5,'Nebentext auf zweiter Flaeche'),
 ('--text-2','--panel',None,4.5,'Nebentext im Panel'),
 ('--text-2','--fill','--surface',4.5,'Nebentext auf der Hoverflaeche einer Karte'),
 ('--text-2','--fill-soft','--surface',4.5,'Nebentext auf der weichen Hoverflaeche'),
 ('--text-2','--fill','--surface-2',4.5,'Nebentext auf der Hoverflaeche der zweiten Flaeche'),
 ('--text','--fill','--surface',4.5,'Text auf der Hoverflaeche einer Karte'),
 ('--text-2','--bg',None,4.5,'Nebentext auf Seitengrund'),
 ('--text-3','--surface',None,4.5,'dritte Textstufe auf Karte'),
 # Die dritte Textstufe kommt auf der zweiten Flaeche nur auf 4,19:1 (dunkel) und wird dort deshalb nicht mehr
 # verwendet; Ticker, Sichtungskorb, Themenlage, Filterspalten und der Plattform-Hinweis tragen dort --text-2.

 ('--text-3','--bg',None,4.5,'dritte Textstufe auf Seitengrund'),
 ('--on-action','--action',None,4.5,'Schrift auf der Hauptaktion'),
 ('--brand-ink','--surface',None,4.5,'Markenschrift auf Karte'),
 ('--brand-ink','--surface-2',None,4.5,'Markenschrift auf zweiter Flaeche'),
 ('--on-action','--action-hover',None,4.5,'Schrift auf der Hauptaktion im Hover'),
 ('--warn','--surface-2',None,4.5,'Warnung auf zweiter Flaeche'),
 ('--crit-text','--surface-2',None,4.5,'Kritisch auf zweiter Flaeche'),
 ('--pos','--surface-2',None,4.5,'Erreicht auf zweiter Flaeche'),
 ('--brand-ink','--accent-soft','--surface',4.5,'Markenschrift auf weicher Auswahl'),
 ('--accent-strong','--surface',None,4.5,'Auswahl kraeftig auf Karte'),
 ('--accent-strong','--accent-soft','--surface',4.5,'Auswahl auf weicher Auswahl'),
 ('--link','--bg',None,4.5,'Link auf Seitengrund'),
 ('--link','--surface',None,4.5,'Link auf Karte'),
 ('--warn','--warn-bg','--surface',4.5,'Warnung auf Warnflaeche'),
 ('--warn','--surface',None,4.5,'Warnung auf Karte'),
 ('--crit-text','--crit-bg','--surface',4.5,'Kritisch auf kritischer Flaeche'),
 ('--crit','--surface',None,4.5,'Kritisch auf Karte'),
 ('--pos','--pos-bg','--surface',4.5,'Erreicht auf Erreicht-Flaeche'),
 ('--info','--info-bg','--surface',4.5,'Hinweis auf Hinweisflaeche'),
 ('--on-band','--warn',None,4.5,'Schrift auf Warnband'),
 ('--on-band','--crit',None,4.5,'Schrift auf kritischem Band'),
 # Deaktivierte Bedienelemente nimmt WCAG 1.4.3 ausdruecklich aus; hier trotzdem gemessen, Richtwert 3,0.
 ('--disabled-fg','--disabled',None,3.0,'Schrift auf deaktiviert (WCAG-Ausnahme)'),
 ('--on-photo','--photo-bg',None,4.5,'Schrift auf Foto'),
 ('--chart-gruen','--surface',None,3.0,'Diagrammfarbe auf Karte'),
]
bad = 0
for name, tok in (('dunkel', root), ('hell', light)):
    print('\n== Thema ' + name + ' ==')
    for fg, bg, under, schwelle, zweck in PAARE:
        f = rgba(tok[fg], tok); b = rgba(tok[bg], tok)
        if under is not None or b[3] < 1: b = over(b, rgba(tok[under or '--bg'], tok))
        if f[3] < 1: f = over(f, b)
        r = ratio(f, b)
        ok = r >= schwelle
        if not ok: bad += 1
        print(('  ok ' if ok else '  FEHLT ') + f'{r:5.2f}:1  (mind. {schwelle})  {fg} auf {bg}  · {zweck}')
print('\nPaare unter der Schwelle:', bad)
sys.exit(1 if bad else 0)
