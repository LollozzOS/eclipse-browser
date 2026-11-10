// prepara le regole del pacchetto: node costruisci.js <cartella liste> <cartella estensione>
const fs=require('fs'),path=require('path');const conv=require(path.resolve(process.argv[3],'converti.js'));
const L=process.argv[2],E=process.argv[3],r=(f)=>fs.readFileSync(path.join(L,f),'utf8');
const t={pubblicita:r('easylist.txt')+'\n'+r('ubo-filters.txt')+'\n'+fs.readFileSync(E+'/nostre.txt','utf8'),traccianti:r('easyprivacy.txt')+'\n'+r('ubo-privacy.txt')};
const o=conv(t);fs.mkdirSync(E+'/regole',{recursive:true});
for(const n of ['pubblicita','traccianti'])fs.writeFileSync(`${E}/regole/${n}.json`,JSON.stringify(o.rete[n]));
fs.writeFileSync(E+'/regole/eccezioni.json',JSON.stringify(o.eccezioni));
fs.writeFileSync(E+'/cosmetica.json',JSON.stringify(o.cosmetica));
// finestre dei cookie: a parte, cosi' si accende e spegne da sola (blocchi + eccezioni sue nello stesso gruppo)
const c=conv({cookie:r('adguard-cookie.txt')});
const cr=[...c.rete.cookie,...c.eccezioni].map((x,i)=>({...x,id:i+1}));
fs.writeFileSync(E+'/regole/cookie.json',JSON.stringify(cr));
fs.writeFileSync(E+'/cosmetica_cookie.json',JSON.stringify(c.cosmetica));
const v=(/! Version: (\d+)/.exec(t.pubblicita)||[])[1]||'';const q=Date.UTC(+v.slice(0,4),+v.slice(4,6)-1,+v.slice(6,8),+v.slice(8,10),+v.slice(10,12));
fs.writeFileSync(E+'/liste.json',JSON.stringify({quando:q,data:new Date(q).toLocaleDateString('it-IT'),regole:Object.values(o.rete).flat().length+o.eccezioni.length+cr.length}));
console.log(o.stat,'eccezioni',o.eccezioni.length,'cookie',cr.length,c.stat,fs.readFileSync(E+'/liste.json','utf8'));
