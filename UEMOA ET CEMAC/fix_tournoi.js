const fs = require('fs');
let c = fs.readFileSync('public/index.html', 'utf8');
const old = "if(!r.ok){ elOpen.innerHTML = '<div class=\"rat-empty\">Erreur chargement</div>'; return; }";
const neu = "if(!r.ok){ var msg = r._httpStatus === 401 ? '<div class=\"rat-empty\">Connecte-toi pour voir les tournois</div>' : '<div class=\"rat-empty\">Erreur chargement</div>'; elOpen.innerHTML = msg; elMine.innerHTML = msg; return; }";
const n = (c.match(/elOpen\.innerHTML = '<div class="rat-empty">Erreur chargement/) || []).length;
console.log('Occurrences trouvees:', n);
const c2 = c.replace(old, neu);
fs.writeFileSync('public/index.html', c2, 'utf8');
console.log('Done');
