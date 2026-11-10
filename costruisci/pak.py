import struct
def leggi(path):
    b=open(path,'rb').read()
    ver,=struct.unpack_from('<I',b,0); assert ver==5,ver
    enc=b[4]; n,na=struct.unpack_from('<HH',b,8)
    ent=[struct.unpack_from('<HI',b,12+i*6) for i in range(n+1)]
    al=[struct.unpack_from('<HH',b,12+(n+1)*6+i*4) for i in range(na)]
    res={}; ordine=[]
    for i in range(n):
        rid,off=ent[i]; res[rid]=b[off:ent[i+1][1]]; ordine.append(rid)
    alias={a:ordine[idx] for a,idx in al}
    return {'enc':enc,'res':res,'ordine':ordine,'alias':alias}
def scrivi(path,p):
    ordine=p['ordine']; res=p['res']; n=len(ordine)
    # gli alias puntano all'indice della risorsa
    idx={rid:i for i,rid in enumerate(ordine)}
    al=sorted(p['alias'].items())
    head=struct.pack('<IB3xHH',5,p['enc'],n,len(al))
    off=12+(n+1)*6+len(al)*4
    tab=b''; dati=b''
    for rid in ordine:
        tab+=struct.pack('<HI',rid,off+len(dati)); dati+=res[rid]
    tab+=struct.pack('<HI',0,off+len(dati))
    ta=b''.join(struct.pack('<HH',a,idx[t]) for a,t in al)
    open(path,'wb').write(head+tab+ta+dati)
