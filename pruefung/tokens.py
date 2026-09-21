# Vergleicht die Token-Zone in site/assets/styles.css mit der Quelle tokens/colors.css des Design-Systems.
# Aufruf: python3 pruefung/tokens.py [pfad/zu/colors.css]
import re, os, sys
STD = "/Users/alexanderdettke/Documents/Claude/00 Designs/Habitat-Tycoon Design System/wilde-habitate-farbpatch/neu/tokens/colors.css"
quelle = sys.argv[1] if len(sys.argv) > 1 else STD
css = os.path.join(os.path.dirname(__file__), '..', 'site', 'assets', 'styles.css')
if not os.path.exists(quelle):
    print('Quelle nicht gefunden:', quelle); sys.exit(2)

def block(t, start, end):
    i = t.index(start); j = t.index(end, i); return t[i:j]
def toks(b):
    return { m.group(1): re.sub(r'\s+', ' ', m.group(2).split('/*')[0].strip())
             for m in re.finditer(r'(--[a-z0-9-]+)\s*:\s*([^;]+);', b) }

s = open(quelle, encoding='utf-8').read(); c = open(css, encoding='utf-8').read()
paare = [('dunkel', toks(block(s, ':root{', '[data-theme="light"]{')), toks(block(c, ':root{', '[data-theme="light"]{'))),
         ('hell',   toks(block(s, '[data-theme="light"]{', '\n}')), toks(block(c, '[data-theme="light"]{', '[data-theme="colorful"]')))]
fehler = 0
for name, quell, haus in paare:
    fehlend = [k for k in quell if k not in haus]
    anders  = [(k, quell[k], haus[k]) for k in quell if k in haus and quell[k] != haus[k]]
    print(f'== Thema {name}: {len(quell)} Tokens in der Quelle ==')
    for k in fehlend: print('  FEHLT   ', k, '=', quell[k]); fehler += 1
    for k, a, b in anders: print('  ANDERS  ', k, ': Quelle', a, '· Haus', b); fehler += 1
    if not fehlend and not anders: print('  vollständig und wertgleich')
print('\nAbweichungen:', fehler)
sys.exit(1 if fehler else 0)
