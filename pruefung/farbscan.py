import re,os,sys,colorsys,json
root=sys.argv[1]
HEX=re.compile(r'#([0-9a-fA-F]{3,8})\b')
RGB=re.compile(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)')
HSL=re.compile(r'hsla?\(\s*([\d.]+)')
OKL=re.compile(r'oklch\(\s*([\d.%]+)\s+([\d.]+)\s+([\d.]+)')
NAMED=re.compile(r'\b(teal|cyan|turquoise|aquamarine|aqua|darkcyan|darkturquoise|mediumturquoise|paleturquoise|lightseagreen|cadetblue|lightcyan|powderblue|skyblue|lightblue|steelblue|darkslategr[ae]y|mediumaquamarine)\b',re.I)
def hue_of(r,g,b):
    h,l,s=colorsys.rgb_to_hls(r/255,g/255,b/255); return h*360,s,l
def teal(h,s,l):
    return 150<=h<=215 and s>0.08 and 0.06<l<0.97
res={}
for dp,dn,fn in os.walk(root):
    for f in fn:
        p=os.path.join(dp,f)
        if not re.search(r'\.(css|html|js|jsx|json|md|ts|svg)$',f): continue
        if 'artifact-type' in p or 'components/lib' in p or 'migration-map' in p: continue
        try: t=open(p,encoding='utf-8',errors='ignore').read()
        except: continue
        hits=[]
        for m in HEX.finditer(t):
            hx=m.group(1)
            if len(hx) in (3,4): hx=''.join(c*2 for c in hx[:3])
            elif len(hx) in (6,8): hx=hx[:6]
            else: continue
            r,g,b=int(hx[0:2],16),int(hx[2:4],16),int(hx[4:6],16)
            h,s,l=hue_of(r,g,b)
            if teal(h,s,l): hits.append(('#'+m.group(1),round(h),round(s,2),round(l,2),t.count('\n',0,m.start())+1))
        for m in RGB.finditer(t):
            r,g,b=map(int,m.groups()); h,s,l=hue_of(r,g,b)
            if teal(h,s,l): hits.append((m.group(0),round(h),round(s,2),round(l,2),t.count('\n',0,m.start())+1))
        for m in HSL.finditer(t):
            h=float(m.group(1))
            if 150<=h<=215: hits.append((m.group(0),h,'?','?',t.count('\n',0,m.start())+1))
        for m in OKL.finditer(t):
            h=float(m.group(3))
            if 170<=h<=240: hits.append((m.group(0),h,'?','?',t.count('\n',0,m.start())+1))
        for m in NAMED.finditer(t):
            hits.append((m.group(0),'named','','',t.count('\n',0,m.start())+1))
        if hits: res[os.path.relpath(p,root)]=hits
for k in sorted(res):
    print(k)
    seen=set()
    for h in res[k]:
        key=h[0].lower()
        if key in seen: continue
        seen.add(key)
        print('   ',h, 'x%d'%sum(1 for x in res[k] if x[0].lower()==key))
