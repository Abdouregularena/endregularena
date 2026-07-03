/* ============================================================
   REGUL ARENA — Détail d'un joueur (clic → forces & faiblesses)
   Fichier ADDITIF, chargé APRÈS banks-detail.js.
   Réécrit lbLoad() pour rendre le podium + les lignes cliquables
   (identique à l'existant + data-uid) et ajoute lbOpenPlayer().
   Aucune modification du gros index.html sauf une balise <script>.
   Confidentialité : le détail "Forces & faiblesses par thème"
   n'est visible que par le joueur lui-même ou un admin (le backend
   /leaderboard/player/themes renvoie {restricted:true} sinon) —
   même logique CDP que pour les banques.
   ============================================================ */
(function () {
  if (typeof window === 'undefined') return;

  var FLAG = { SN:'🇸🇳',CI:'🇨🇮',BF:'🇧🇫',ML:'🇲🇱',BJ:'🇧🇯',NE:'🇳🇪',TG:'🇹🇬',GW:'🇬🇼',
               CM:'🇨🇲',GA:'🇬🇦',CG:'🇨🇬',CF:'🇨🇫',GQ:'🇬🇶',TD:'🇹🇩' };
  function flag(c){ return FLAG[String(c||'').toUpperCase()] || '🌍'; }

  // ----- réécriture de lbLoad : identique + podium/lignes cliquables (data-uid) -----
  window.lbLoad = function (zone) {
    ['all','uemoa','cemac'].forEach(function(z){ var b=ge('lb-t-'+z); if(b) b.className='vtab'+(z===zone?' ac':''); });
    var box=ge('lb-list'); if(!box) return;
    var url='/leaderboard'+(zone&&zone!=='all'?('?zone='+zone):'');
    var hdr=(typeof U!=='undefined'&&U&&U.token)?{'Authorization':'Bearer '+U.token}:{};
    fetch(url,{headers:hdr}).then(function(r){return r.json();}).then(function(d){
      if(typeof lbMode!=='undefined' && lbMode!=='players') return; // MODIFIÉ : garde-fou bascule d'onglet
      var rawList=(d&&d.leaderboard)||[];
      var LB_HIDE=['kaiser ndao','abdou ndao'];
      var list=rawList.filter(function(p){ return LB_HIDE.indexOf(String((p&&p.name)||'').trim().toLowerCase())===-1; });
      window.lbLastList=list; // MODIFIÉ : cache pour lbOpenPlayer (évite un appel réseau supplémentaire)
      var myRank=null;
      if(typeof U!=='undefined' && U && U.name){ var __un=String(U.name).trim().toLowerCase();
        for(var __mi=0; __mi<list.length; __mi++){ if(String(list[__mi].name||'').trim().toLowerCase()===__un){ myRank=__mi+1; break; } } }
      var goalBox=ge('lb-goal');
      if(!list.length){ if(goalBox) goalBox.innerHTML=''; var __pb0=ge('lb-podium'); if(__pb0) __pb0.innerHTML=''; box.innerHTML='<div class="al al-info" style="font-size:12px;">Le classement se construit au fil des quiz. Soyez le premier à marquer des points !</div>'; return; }
      if(goalBox){
        var gh='';
        if(myRank && myRank>1 && list[myRank-2] && list[myRank-1]){
          var above=list[myRank-2], meP=list[myRank-1];
          var gap=Math.max(1,(above.total_score||0)-(meP.total_score||0)+1);
          gh='<div class="card lb-goal" style="padding:14px 16px;border:1px solid rgba(232,181,32,.45);">'+
            '<div style="font-size:13px;font-weight:800;color:#E8B520;margin-bottom:4px;">🎯 Votre prochain objectif</div>'+
            '<div style="font-size:13px;color:white;line-height:1.5;">Plus que <strong style="color:#4ade80;">'+gap+' pts</strong> pour dépasser <strong>'+arChatEsc(above.name||'le joueur au-dessus')+'</strong> et passer <strong>'+(myRank-1)+'<sup>e</sup></strong>.</div>'+
            '<div style="font-size:11px;color:var(--sub);margin-top:5px;">Un quiz rapide bien joué et la place est à vous. ⚡</div></div>';
        } else if(myRank===1){
          gh='<div class="card lb-goal" style="padding:14px 16px;border:1px solid rgba(232,181,32,.45);">'+
            '<div style="font-size:13px;font-weight:800;color:#E8B520;">👑 Vous êtes en tête !</div>'+
            '<div style="font-size:12px;color:var(--sub);margin-top:4px;">Gardez le rythme : les poursuivants ne sont jamais loin.</div></div>';
        } else {
          gh='<div class="card lb-goal" style="padding:14px 16px;border:1px solid rgba(232,181,32,.45);">'+
            '<div style="font-size:13px;font-weight:800;color:#E8B520;">🎯 Entrez dans le classement</div>'+
            '<div style="font-size:12px;color:var(--sub);margin-top:4px;">Jouez un quiz pour apparaître dans le tableau et viser le sommet.</div></div>';
        }
        goalBox.innerHTML=gh;
      }
      var pod=list.slice(0,3), podHTML='';
      if(pod.length>=3){
        var order=[1,0,2], hh=[84,64,52];
        var _cfc=['#E8B520','#00B4D8','#4ade80','#f87171','#ffffff','#C9991A','#FFD75E'];
        var _conf='<div class="ra-conf-layer" aria-hidden="true">';
        for(var _ci=0;_ci<22;_ci++){
          var _l=Math.round(Math.random()*100),
              _dl=(Math.random()*3).toFixed(2),
              _du=(2.8+Math.random()*2.4).toFixed(2),
              _col=_cfc[_ci%_cfc.length],
              _rot=Math.round(Math.random()*360),
              _w=(5+Math.round(Math.random()*4)),
              _h=(8+Math.round(Math.random()*7));
          _conf+='<i style="left:'+_l+'%;width:'+_w+'px;height:'+_h+'px;background:'+_col+';animation-delay:'+_dl+'s;animation-duration:'+_du+'s;transform:rotate('+_rot+'deg);"></i>';
        }
        _conf+='</div>';
        podHTML='<div class="ra-podium-wrap">'+_conf+
          '<div class="ra-podium-row" style="display:flex;align-items:flex-end;justify-content:center;gap:8px;padding:30px 6px 4px;position:relative;z-index:1;">'+
          order.map(function(idx){ var p=pod[idx]; if(!p) return ''; var rr=idx+1; var meP=(myRank&&rr===myRank); var isKing=(idx===0);
            return '<div class="lb-podium-item'+(isKing?' ra-king':'')+'" data-uid="'+(p.id!=null?p.id:'')+'" style="flex:1;max-width:108px;text-align:center;cursor:pointer;animation-delay:'+(idx*0.1)+'s;">'+
              (isKing?'<div class="ra-crown" aria-hidden="true">👑</div>':'')+
              '<div style="font-size:20px;">'+['🥇','🥈','🥉'][idx]+'</div>'+
              '<div class="av'+(isKing?' ra-king-av':'')+'" style="width:'+(isKing?44:38)+'px;height:'+(isKing?44:38)+'px;font-size:'+(isKing?16:14)+'px;margin:2px auto 5px;'+((meP&&!isKing)?'box-shadow:0 0 0 2px #E8B520;':'')+'">'+arChatEsc((p.name||'?').charAt(0))+'</div>'+
              '<div style="font-size:11px;font-weight:700;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+arChatEsc(p.name||'')+(meP?' (Vous)':'')+'</div>'+
              '<div style="font-size:10px;color:#4ade80;font-weight:700;">'+(p.total_score||0)+' pts</div>'+
              (isKing?'<div class="ra-belt" aria-hidden="true">🏆 CHAMPION</div>':'')+
              '<div style="margin-top:3px;">'+raTierPill(p.total_score||0)+'</div>'+
              '<div class="ra-podium-base'+(isKing?' ra-king-base':'')+'" style="height:'+hh[idx]+'px;margin-top:5px;border-radius:8px 8px 0 0;background:linear-gradient(180deg,rgba(201,153,26,.4),rgba(201,153,26,.08));border:1px solid rgba(201,153,26,.35);display:flex;align-items:flex-start;justify-content:center;font-weight:900;color:#E8B520;padding-top:5px;">'+rr+'</div>'+
            '</div>';
          }).join('')+'</div></div>';
      }
      var startI=pod.length>=3?3:0;
      function lbRowHTML(p,i){
        var r=i+1, me=(myRank&&r===myRank);
        return '<div class="lb-row'+(me?' me':'')+'" data-uid="'+(p.id!=null?p.id:'')+'" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(10,33,62,.6);background:'+(me?'rgba(201,153,26,.08)':'transparent')+';cursor:pointer;">'+
          '<div style="display:flex;align-items:center;gap:11px;min-width:0;flex:1;">'+
          '<span style="font-weight:900;font-size:15px;color:#8aa3d4;width:26px;flex-shrink:0;text-align:center;">'+r+'</span>'+
          '<div class="av" style="width:32px;height:32px;font-size:12px;flex-shrink:0;">'+arChatEsc((p.name||'?').charAt(0))+'</div>'+
          '<div style="min-width:0;"><div style="font-weight:600;color:white;font-size:13px;">'+arChatEsc(p.name||'')+(me?' (Vous)':'')+' '+raTierPill(p.total_score||0)+'</div>'+
          '<div style="font-size:10px;color:#8aa3d4;">'+[lbCountryLabel(p.country), lbProfileLabel(p.profile)].filter(Boolean).join(' · ')+'</div></div></div>'+
          '<div style="text-align:right;flex-shrink:0;white-space:nowrap;display:flex;align-items:center;gap:8px;"><div><div style="font-weight:700;color:#4ade80;font-size:13px;">'+(p.total_score||0)+' pts</div><div style="font-size:10px;color:var(--sub);">'+(p.games||0)+' partie'+(((p.games||0)>1)?'s':'')+'</div></div><span style="color:#8aa3d4;font-size:16px;">›</span></div></div>'; // MODIFIÉ : chevron ajouté
      }
      var restAll=list.slice(startI);
      var VIS=5;
      var visRows=restAll.slice(0,VIS).map(function(p,k){ return lbRowHTML(p,startI+k); }).join('');
      var moreArr=restAll.slice(VIS);
      var moreRows=moreArr.map(function(p,k){ return lbRowHTML(p,startI+VIS+k); }).join('');
      var moreLabel='Voir tout le classement ('+list.length+' joueurs) ▼';
      var moreToggle=moreArr.length?('<button id="lb-more-btn" class="btn btn-sm" data-more="'+moreLabel+'" style="width:100%;padding:12px;border-radius:0;background:rgba(0,180,216,.08);color:var(--cyan);font-weight:700;font-size:12px;" onclick="lbToggleMore()">'+moreLabel+'</button>'):'';
      var rowsHTML=visRows+'<div id="lb-list-more" style="display:none;">'+moreRows+'</div>'+moreToggle;
      var zLbl=(zone==='uemoa')?'UEMOA':(zone==='cemac')?'CEMAC':'Tous';
      var certHTML='';
      if(myRank && myRank<=3){
        var myPts=(list[myRank-1]&&list[myRank-1].total_score)||0;
        certHTML='<div style="margin:10px 14px 4px;padding:14px 16px;border-radius:12px;background:linear-gradient(135deg,rgba(201,153,26,.18),rgba(201,153,26,.05));border:1px solid rgba(201,153,26,.45);text-align:center;">'+
          '<div style="font-size:13px;font-weight:800;color:#E8B520;margin-bottom:8px;">🏆 Vous êtes dans le Top 3 '+zLbl+' !</div>'+
          '<button onclick="raLbCert('+myRank+',\''+zLbl+'\','+myPts+')" style="width:100%;padding:13px;background:linear-gradient(135deg,#C9991A,#a87d12);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(201,153,26,.35);">📥 Télécharger mon certificat de classement</button>'+
        '</div>';
      }
      box.innerHTML=rowsHTML || '<div class="al al-info" style="font-size:12px;">Aucun autre joueur pour l\'instant.</div>';
      var podBox=ge('lb-podium'); if(podBox) podBox.innerHTML=certHTML+podHTML;
      // MODIFIÉ : clic délégué sur podium + liste → ouvre le détail du joueur
      box.onclick=function(e){ var el=e.target.closest&&e.target.closest('[data-uid]'); if(el && el.getAttribute('data-uid')) lbOpenPlayer(el.getAttribute('data-uid')); };
      if(podBox) podBox.onclick=function(e){ var el=e.target.closest&&e.target.closest('[data-uid]'); if(el && el.getAttribute('data-uid')) lbOpenPlayer(el.getAttribute('data-uid')); };
    }).catch(function(){ box.innerHTML='<div class="al al-warn" style="font-size:12px;">Classement momentanément indisponible.</div>'; });
  };

  // ----- nouvel écran : détail d'un joueur (overlay) -----
  window.lbOpenPlayer = function (userId) {
    userId=String(userId||'').trim(); if(!userId) return;
    var ov=ge('lb-player-ov');
    if(!ov){ ov=document.createElement('div'); ov.id='lb-player-ov';
      ov.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(4,12,28,.92);overflow-y:auto;-webkit-overflow-scrolling:touch;';
      document.body.appendChild(ov);
    }
    ov.innerHTML='<div style="max-width:560px;margin:0 auto;padding:18px 14px 40px;">'+
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">'+
        '<button onclick="lbClosePlayer()" style="background:rgba(255,255,255,.08);color:white;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:8px 12px;font-size:14px;cursor:pointer;">← Retour</button>'+
        '<div id="lb-player-title" style="font-weight:800;color:white;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">👤 Chargement…</div>'+
      '</div>'+
      '<div id="lb-player-body"><div class="al al-info" style="font-size:12px;">Chargement du profil…</div></div></div>';
    document.body.style.overflow='hidden';

    // Infos de base (nom, pays, points, parties, rang) : déjà en cache dans le classement courant
    var cached=null;
    if(typeof lbLastList!=='undefined' && lbLastList && lbLastList.length){
      for(var i=0;i<lbLastList.length;i++){ if(String(lbLastList[i].id)===userId){ cached=lbLastList[i]; break; } }
    }
    var title=ge('lb-player-title');
    if(title) title.innerHTML='👤 '+arChatEsc(cached?cached.name:('Joueur #'+userId));

    var body=ge('lb-player-body');
    var head=cached?(
      '<div class="card" style="padding:14px 16px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;">'+
        '<div style="display:flex;align-items:center;gap:11px;min-width:0;">'+
          '<div class="av" style="width:42px;height:42px;font-size:16px;flex-shrink:0;">'+arChatEsc((cached.name||'?').charAt(0))+'</div>'+
          '<div style="min-width:0;"><div style="font-weight:700;color:white;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+flag(cached.country)+' '+arChatEsc(cached.name||'')+'</div>'+
          '<div style="font-size:10px;color:#8aa3d4;">'+[lbCountryLabel(cached.country), lbProfileLabel(cached.profile)].filter(Boolean).join(' · ')+' · '+(cached.games||0)+' partie'+(((cached.games||0)>1)?'s':'')+'</div></div></div>'+
        '<div style="text-align:right;flex-shrink:0;"><div style="font-weight:800;color:#4ade80;font-size:15px;">'+(cached.total_score||0)+' pts</div>'+raTierPill(cached.total_score||0)+'</div>'+
      '</div>'
    ):'';
    if(body) body.innerHTML=head+'<div id="lb-player-themes"></div>';
    lbPlayerThemes(userId);
  };

  // ----- forces / faiblesses du joueur -----
  function packLabel(id){
    id=String(id||'').trim();
    if(id==='kotm') return '👑 Roi de la Manche';
    if(id==='coumba') return '🎯 Coumba';
    if(id==='duel') return '⚔️ Duel';
    if(/^sprint-/.test(id)) return '⚡ Sprint '+id.replace('sprint-','');
    if(/[ A-Z]/.test(id)) return id;
    return id.replace(/[-_]/g,' ').replace(/^./,function(c){return c.toUpperCase();});
  }
  window.lbPlayerThemes = function (userId) {
    var box=ge('lb-player-themes'); if(!box) return;
    var hdr=(typeof U!=='undefined'&&U&&U.token)?{'Authorization':'Bearer '+U.token}:{};
    box.innerHTML='<div class="al al-info" style="font-size:12px;">Analyse des thèmes…</div>';
    fetch('/leaderboard/player/themes?user_id='+encodeURIComponent(userId),{headers:hdr}).then(function(r){return r.json();}).then(function(d){
      if(d && d.restricted){
        box.innerHTML='<div class="card" style="padding:18px 16px;text-align:center;border:1px solid rgba(232,181,32,.4);background:rgba(232,181,32,.05);">'+
          '<div style="font-size:30px;margin-bottom:8px;">🔒</div>'+
          '<div style="font-weight:800;color:#E8B520;font-size:14px;margin-bottom:6px;">Détail réservé</div>'+
          '<div style="font-size:12px;color:var(--sub);line-height:1.55;">L\'analyse <strong>Forces &amp; faiblesses</strong> par thème d\'un joueur est confidentielle (données personnelles) : elle n\'est visible que par le joueur lui-même ou un administrateur.</div>'+
        '</div>';
        return;
      }
      var th=(d&&d.themes)||[];
      if(!th.length){ box.innerHTML='<div class="al al-info" style="font-size:12px;">Pas encore assez de parties pour mesurer les forces et faiblesses (min. 5 réponses par thème).</div>'; return; }
      var SEUIL=70;
      var forces=th.filter(function(t){ return t.taux>=SEUIL; }).slice(0,3);
      var faibles=th.filter(function(t){ return t.taux<SEUIL; }).slice(-3).reverse();
      function bar(t){
        var col=t.taux>=70?'#4ade80':(t.taux>=50?'#E8B520':'#f87171');
        return '<div style="margin-bottom:9px;">'+
          '<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;color:white;margin-bottom:3px;">'+
            '<span style="min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+arChatEsc(packLabel(t.pack_id))+'</span>'+
            '<span style="font-weight:800;color:'+col+';flex-shrink:0;">'+t.taux+'%</span></div>'+
          '<div style="height:7px;border-radius:5px;background:rgba(255,255,255,.08);overflow:hidden;"><div style="height:100%;width:'+t.taux+'%;background:'+col+';"></div></div>'+
          '<div style="font-size:9px;color:#8aa3d4;margin-top:2px;">'+t.parties+' partie'+(t.parties>1?'s':'')+'</div></div>';
      }
      var html='<div class="card" style="padding:14px 16px;">'+
        '<div style="font-size:13px;font-weight:800;color:white;margin-bottom:3px;">📊 Forces &amp; faiblesses</div>'+
        '<div style="font-size:10px;color:#8aa3d4;margin-bottom:10px;">Taux de réussite par thème · apprentissage (Kirkpatrick N2)</div>';
      if(forces.length){
        html+='<div style="font-size:11px;font-weight:800;color:#4ade80;margin:2px 0 6px;">💪 Points forts</div>'+forces.map(bar).join('');
      }
      if(faibles.length){
        html+='<div style="font-size:11px;font-weight:800;color:#f87171;margin:'+(forces.length?'10':'2')+'px 0 6px;">🎯 À renforcer</div>'+faibles.map(bar).join('');
      } else if(forces.length){
        html+='<div style="font-size:11px;color:#8aa3d4;margin-top:8px;">✅ Niveau solide sur tous les thèmes mesurés (≥ 70 %).</div>';
      }
      html+='</div>';
      box.innerHTML=html;
    }).catch(function(){ box.innerHTML='<div class="al al-warn" style="font-size:12px;">Analyse des thèmes indisponible.</div>'; });
  };

  window.lbClosePlayer = function () {
    var ov=ge('lb-player-ov'); if(ov) ov.remove();
    document.body.style.overflow='';
  };
})();
