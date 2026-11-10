// Eclipse: icona e dati del programma dentro gli exe/dll di Chromium (i crediti agli autori di Chromium restano)
const fs=require('fs'),path=require('path');const R=require('resedit');const PE=require('pe-library');
const [dir,M]=process.argv.slice(2);
const ico=fs.readFileSync(path.join(M,'eclipse.ico'));const icona=R.Data.IconFile.from(ico);
const file=[['chrome.exe',['IDR_MAINFRAME','IDR_X001_APP_LIST','IDR_X006_HTML_DOC','IDR_X007_PDF_DOC','IDR_X008_ISOLATED','IDR_X009_OMNIBOX_EVERYWHERE']],
 ['chrome_proxy.exe',[]],[process.argv[4]+'/chrome.dll',[101]],[process.argv[4]+'/notification_helper.exe',[]],[process.argv[4]+'/chrome_pwa_launcher.exe',[]]];
for (const [f,gruppi] of file){
  const p=path.join(dir,f); if(!fs.existsSync(p)){ if(/notification_helper|pwa_launcher/.test(f)){console.log(f,'tolto');continue;} console.error('ERRORE: manca',p); process.exit(1);} const exe=PE.NtExecutable.from(fs.readFileSync(p),{ignoreCert:true}); const res=PE.NtExecutableResource.from(exe);
  const esist=R.Resource.IconGroupEntry.fromEntries(res.entries);
  let n=0;
  for(const g of gruppi){ const e=esist.find(x=>x.id===g); if(!e) continue;
    R.Resource.IconGroupEntry.replaceIconsForResource(res.entries,e.id,e.lang,icona.icons.map(i=>i.data)); n++; }
  const vv=R.Resource.VersionInfo.fromEntries(res.entries);
  for(const vi of vv){ for(const l of vi.getAllLanguagesForStringValues()){
     vi.setStringValues(l,{CompanyName:'LollozzOS',FileDescription:'Eclipse',ProductName:'Eclipse',ProductShortName:'Eclipse',CompanyShortName:'LollozzOS'}); }
     vi.outputToResourceEntries(res.entries); }
  res.outputResource(exe); fs.writeFileSync(p,Buffer.from(exe.generate()));
  console.log(f,'icone',n,'dati ok');
}
