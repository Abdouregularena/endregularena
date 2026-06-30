/* ============================================================
   REGUL ARENA — Détail d'une banque (clic → membres)   // MODIFIÉ (task A)
   Fichier ADDITIF, chargé APRÈS index.html.
   Il réécrit lbLoadBanks() pour rendre les lignes cliquables
   et ajoute lbOpenBank() qui ouvre le classement des membres.
   Aucune modification du gros index.html sauf la balise <script>.
   ============================================================ */
(function () {
  if (typeof window === 'undefined') return;

  // petit drapeau pays (fallback : rien)
  var FLAG = { SN:'🇸🇳',CI:'🇨🇮',BF:'🇧🇫',ML:'🇲🇱',BJ:'🇧🇯',NE:'🇳🇪',TG:'🇹🇬',GW:'🇬🇼',
               CM:'🇨🇲',GA:'🇬🇦',CG:'🇨🇬',CF:'🇨🇫',GQ:'🇬🇶',TD:'🇹🇩' };
  function flag(c){ return FLAG[String(c||'').toUpperCase()] || '🌍'; }

  // ----- réécriture de lbLoadBanks : identique + lignes cliquables -----
  window.lbLoadBanks = function (zone) {
    ['all','uemoa','cemac'].forEach(function(z){ var b=ge('lb-t-'+z); if(b) b.className='vtab'+(z===zone?' ac':''); });
    var box=ge('lb-list'); if(!box) return;
    box.innerHTML='<div class="al al-info" style="font-size:12px;">Chargement du classement des banques…</div>';
    var goalBox=ge('lb-goal'); if(goalBox) goalBox.innerHTML='';
    var podBox=ge('lb-podium'); if(podBox) podBox.innerHTML='';
    var url='/leaderboard/banks'+(zone&&zone!=='all'?('?zone='+zone):'');
    var hdr=(typeof U!=='undefined'&&U&&U.token)?{'Authorization':'Bearer '+U.token}:{};
    fetch(url,{headers:hdr}).then(function(r){return r.json();}).then(function(d){
      if(typeof lbMode!=='undefined' && lbMode!=='banks') return;
      var list=(d&&d.leaderboard)||[];
      lbBanksData=list;
      var myRank=(d&&d.my_rank)||null;
      var myBankKey=(d&&d.my_bank)?String(d.my_bank).trim().toLowerCase()
        :((typeof U!=='undefined'&&U&&U.etablissement)?String(U.etablissement).trim().toLowerCase():null);
      if(!list.length){
        box.innerHTML='<div class="al al-info" style="font-size:12px;">Aucune banque classée pour l\'instant. Renseignez votre établissement et jouez un quiz pour lancer le classement collectif ! 🏦</div>';
        return;
      }
      // 🏆 podium top 3 (cliquable)  // MODIFIÉ : data-bank + cursor
      var pod=list.slice(0,3), podHTML='';
      if(pod.length>=3){
        var order=[1,0,2], hh=[80,62,50];
        podHTML='<div class="ra-podium-wrap"><div class="ra-podium-row" style="display:flex;align-items:flex-end;justify-content:center;gap:8px;padding:26px 6px 4px;position:relative;z-index:1;">'+
          order.map(function(idx){ var p=pod[idx]; if(!p) return ''; var mine=(myBankKey&&p.bank_key===myBankKey); var isKing=(idx===0);
            return '<div class="lb-podium-item'+(isKing?' ra-king':'')+'" data-bank="'+arChatEsc(p.bank||'')+'" style="flex:1;max-width:112px;text-align:center;cursor:pointer;animation-delay:'+(idx*0.1)+'s;">'+
              (isKing?'<div class="ra-crown" aria-hidden="true">👑</div>':'')+
              '<div style="font-size:20px;">'+['🥇','🥈','🥉'][idx]+'</div>'+
              '<div class="av'+(isKing?' ra-king-av':'')+'" style="width:'+(isKing?46:40)+'px;height:'+(isKing?46:40)+'px;font-size:'+(isKing?14:12)+'px;font-weight:800;margin:2px auto 5px;'+(mine?'box-shadow:0 0 0 2px #E8B520;':'')+'">'+arChatEsc(lbBankInitials(p.bank))+'</div>'+
              '<div style="font-size:11px;font-weight:700;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+arChatEsc(p.bank||'')+(mine?' ⭐':'')+'</div>'+
              '<div style="font-size:10px;color:#4ade80;font-weight:700;">'+(p.total_score||0)+' pts</div>'+
              '<div style="font-size:9px;color:#8aa3d4;">'+(p.members||0)+' membre'+(((p.members||0)>1)?'s':'')+'</div>'+
              '<div class="ra-podium-base'+(isKing?' ra-king-base':'')+'" style="height:'+hh[idx]+'px;margin-top:5px;border-radius:8px 8px 0 0;background:linear-gradient(180deg,rgba(201,153,26,.4),rgba(201,153,26,.08));border:1px solid rgba(201,153,26,.35);"></div>'+
            '</div>';
          }).join('')+'</div></div>';
      }
      if(podBox){ podBox.innerHTML=podHTML;
        podBox.onclick=function(e){ var el=e.target.closest&&e.target.closest('[data-bank]'); if(el) lbOpenBank(el.getAttribute('data-bank')); }; // MODIFIÉ
      }
      // 🎯 objectif de ma banque (inchangé)
      if(goalBox){
        var gh='';
        if(myRank && myRank>1 && list[myRank-2] && list[myRank-1]){
          var above=list[myRank-2], mineRow=list[myRank-1];
          var gap=Math.max(1,(above.total_score||0)-(mineRow.total_score||0)+1);
          gh='<div class="card lb-goal" style="padding:14px 16px;border:1px solid rgba(232,181,32,.45);">'+
            '<div style="font-size:13px;font-weight:800;color:#E8B520;margin-bottom:4px;">🎯 Objectif de votre banque</div>'+
            '<div style="font-size:13px;color:white;line-height:1.5;">Plus que <strong style="color:#4ade80;">'+gap+' pts</strong> collectifs pour que <strong>'+arChatEsc(mineRow.bank||'votre banque')+'</strong> dépasse <strong>'+arChatEsc(above.bank||'')+'</strong> et passe <strong>'+(myRank-1)+'<sup>e</sup></strong>.</div>'+
            '<div style="font-size:11px;color:var(--sub);margin-top:5px;">Mobilisez vos collègues : chaque quiz compte pour l\'équipe. 🤝</div></div>';
        } else if(myRank===1){
          gh='<div class="card lb-goal" style="padding:14px 16px;border:1px solid rgba(232,181,32,.45);">'+
            '<div style="font-size:13px;font-weight:800;color:#E8B520;">👑 Votre banque est en tête !</div>'+
            '<div style="font-size:12px;color:var(--sub);margin-top:4px;">Continuez à jouer en équipe pour conserver le titre.</div></div>';
        } else if(myBankKey){
          gh='<div class="card lb-goal" style="padding:14px 16px;border:1px solid rgba(232,181,32,.45);">'+
            '<div style="font-size:13px;font-weight:800;color:#E8B520;">🏦 Faites entrer votre banque</div>'+
            '<div style="font-size:12px;color:var(--sub);margin-top:4px;">Jouez un quiz pour que votre établissement apparaisse au classement collectif.</div></div>';
        }
        goalBox.innerHTML=gh;
      }
      // liste rang 4+ (cliquable)  // MODIFIÉ : data-bank + cursor + chevron ›
      var startI=pod.length>=3?3:0;
      var rowsHTML=list.slice(startI).map(function(p,k){
        var i=startI+k, r=i+1, mine=(myBankKey&&p.bank_key===myBankKey);
        return '<div class="lb-row'+(mine?' me':'')+'" data-bank="'+arChatEsc(p.bank||'')+'" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(10,33,62,.6);background:'+(mine?'rgba(201,153,26,.08)':'transparent')+';cursor:pointer;animation-delay:'+(Math.min(k,12)*0.04)+'s;">'+
          '<div style="display:flex;align-items:center;gap:11px;min-width:0;flex:1;">'+
          '<span style="font-weight:900;font-size:15px;color:#8aa3d4;width:26px;flex-shrink:0;text-align:center;">'+r+'</span>'+
          '<div class="av" style="width:34px;height:34px;font-size:12px;font-weight:800;flex-shrink:0;">'+arChatEsc(lbBankInitials(p.bank))+'</div>'+
          '<div style="min-width:0;"><div style="font-weight:600;color:white;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+arChatEsc(p.bank||'')+(mine?' <span style="color:#E8B520;font-size:10px;font-weight:800;">VOTRE BANQUE</span>':'')+' '+raTierPill(p.total_score||0)+'</div>'+
          '<div style="font-size:10px;color:#8aa3d4;">👥 '+(p.members||0)+' membre'+(((p.members||0)>1)?'s':'')+' · ⌀ '+(p.avg_score||0)+' pts/membre</div></div></div>'+
          '<div style="text-align:right;flex-shrink:0;white-space:nowrap;display:flex;align-items:center;gap:8px;"><div><div style="font-weight:700;color:#4ade80;font-size:13px;">'+(p.total_score||0)+' pts</div><div style="font-size:10px;color:var(--sub);">'+(p.games||0)+' partie'+(((p.games||0)>1)?'s':'')+'</div></div><span style="color:#8aa3d4;font-size:18px;">›</span></div></div>';
      }).join('');
      box.innerHTML=rowsHTML || '<div class="al al-info" style="font-size:12px;">Aucune autre banque pour l\'instant.</div>';
      box.onclick=function(e){ var el=e.target.closest&&e.target.closest('[data-bank]'); if(el) lbOpenBank(el.getAttribute('data-bank')); }; // MODIFIÉ
    }).catch(function(){ box.innerHTML='<div class="al al-warn" style="font-size:12px;">Classement des banques momentanément indisponible.</div>'; });
  };

  // ----- nouvel écran : membres d'une banque (overlay) -----  // MODIFIÉ (task A)
  window.lbOpenBank = function (bankName) {
    bankName=String(bankName||'').trim(); if(!bankName) return;
    var ov=ge('lb-bank-ov');
    if(!ov){ ov=document.createElement('div'); ov.id='lb-bank-ov';
      ov.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(4,12,28,.92);overflow-y:auto;-webkit-overflow-scrolling:touch;';
      document.body.appendChild(ov);
    }
    ov.innerHTML='<div style="max-width:560px;margin:0 auto;padding:18px 14px 40px;">'+
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">'+
        '<button onclick="lbCloseBank()" style="background:rgba(255,255,255,.08);color:white;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:8px 12px;font-size:14px;cursor:pointer;">← Retour</button>'+
        '<div style="font-weight:800;color:white;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">🏦 '+arChatEsc(bankName)+'</div>'+
      '</div>'+
      '<div id="lb-bank-body"><div class="al al-info" style="font-size:12px;">Chargement des membres…</div></div></div>';
    document.body.style.overflow='hidden';
    var zone=(typeof lbZone!=='undefined'&&lbZone)?lbZone:'all';
    var url='/leaderboard/banks/members?bank='+encodeURIComponent(bankName)+(zone&&zone!=='all'?('&zone='+zone):'');
    var hdr=(typeof U!=='undefined'&&U&&U.token)?{'Authorization':'Bearer '+U.token}:{};
    fetch(url,{headers:hdr}).then(function(r){return r.json();}).then(function(d){
      var body=ge('lb-bank-body'); if(!body) return;
      var members=(d&&d.members)||[], myId=(d&&d.my_id)||null, tot=(d&&d.total_score)||0;
      if(d && d.restricted){ // MODIFIÉ : détail nominatif réservé à l'admin / établissement
        var cnt=(d&&d.count)||0, t2=(d&&d.total_score)||0;
        body.innerHTML=
          '<div class="card" style="padding:12px 16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">'+
            '<div style="font-size:12px;color:var(--sub);">👥 '+cnt+' membre'+(cnt>1?'s':'')+' classé'+(cnt>1?'s':'')+'</div>'+
            '<div style="font-weight:800;color:#4ade80;font-size:14px;">'+t2+' pts</div></div>'+
          '<div class="card" style="padding:18px 16px;text-align:center;border:1px solid rgba(232,181,32,.4);background:rgba(232,181,32,.05);">'+
            '<div style="font-size:30px;margin-bottom:8px;">🔒</div>'+
            '<div style="font-weight:800;color:#E8B520;font-size:14px;margin-bottom:6px;">Détail réservé à l\'établissement</div>'+
            '<div style="font-size:12px;color:var(--sub);line-height:1.55;">Le classement nominatif du personnel et l\'analyse <strong>Forces &amp; faiblesses</strong> par thème sont confidentiels (données RH).<br><br>Dirigeants : activez votre <strong>Espace Établissement</strong> pour suivre la montée en compétence de vos équipes.</div>'+
          '</div>';
        return;
      }
      if(!members.length){ body.innerHTML='<div class="al al-info" style="font-size:12px;">Aucun membre classé pour cette banque dans cette zone.</div>'; return; }
      var head='<div class="card" style="padding:12px 16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">'+
        '<div style="font-size:12px;color:var(--sub);">👥 '+members.length+' membre'+(members.length>1?'s':'')+' classé'+(members.length>1?'s':'')+'</div>'+
        '<div style="font-weight:800;color:#4ade80;font-size:14px;">'+tot+' pts</div></div>';
      var rows=members.map(function(m,i){
        var r=i+1, me=(myId&&m.id===myId), medal=(r<=3?['🥇','🥈','🥉'][r-1]:r);
        return '<div class="lb-row'+(me?' me':'')+'" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(10,33,62,.6);background:'+(me?'rgba(201,153,26,.08)':'transparent')+';">'+
          '<div style="display:flex;align-items:center;gap:11px;min-width:0;flex:1;">'+
          '<span style="font-weight:900;font-size:15px;color:#8aa3d4;width:30px;flex-shrink:0;text-align:center;">'+medal+'</span>'+
          '<div style="min-width:0;"><div style="font-weight:600;color:white;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+flag(m.country)+' '+arChatEsc(m.name||'Joueur')+(me?' <span style="color:#E8B520;font-size:10px;font-weight:800;">VOUS</span>':'')+'</div>'+
          '<div style="font-size:10px;color:#8aa3d4;">'+(m.games||0)+' partie'+(((m.games||0)>1)?'s':'')+'</div></div></div>'+
          '<div style="font-weight:700;color:#4ade80;font-size:13px;flex-shrink:0;">'+(m.total_score||0)+' pts</div></div>';
      }).join('');
      body.innerHTML=head
        +'<div id="lb-bank-themes" style="margin-bottom:12px;"></div>' // MODIFIÉ (task B)
        +'<div style="font-size:11px;font-weight:800;color:#8aa3d4;text-transform:uppercase;letter-spacing:.4px;margin:4px 2px 8px;">Membres</div>'
        +'<div class="card" style="overflow:hidden;">'+rows+'</div>';
      lbBankThemes(bankName); // MODIFIÉ (task B)
    }).catch(function(){ var body=ge('lb-bank-body'); if(body) body.innerHTML='<div class="al al-warn" style="font-size:12px;">Membres momentanément indisponibles.</div>'; });
  };

  // ----- tableau de bord forces / faiblesses par thème -----  // MODIFIÉ (task B)
  function packLabel(id){
    id=String(id||'').trim();
    if(id==='kotm') return '👑 Roi de la Manche';
    if(id==='coumba') return '🎯 Coumba';
    if(id==='duel') return '⚔️ Duel';
    if(/^sprint-/.test(id)) return '⚡ Sprint '+id.replace('sprint-','');
    if(/[ A-Z]/.test(id)) return id; // MODIFIÉ : déjà un libellé lisible → ne pas recasser (accents)
    return id.replace(/[-_]/g,' ').replace(/^./,function(c){return c.toUpperCase();}); // slug technique pur
  }
  window.lbBankThemes = function (bankName) {
    var box=ge('lb-bank-themes'); if(!box) return;
    var zone=(typeof lbZone!=='undefined'&&lbZone)?lbZone:'all';
    var url='/leaderboard/banks/themes?bank='+encodeURIComponent(bankName)+(zone&&zone!=='all'?('&zone='+zone):'');
    var hdr=(typeof U!=='undefined'&&U&&U.token)?{'Authorization':'Bearer '+U.token}:{};
    box.innerHTML='<div class="al al-info" style="font-size:12px;">Analyse des thèmes…</div>';
    fetch(url,{headers:hdr}).then(function(r){return r.json();}).then(function(d){
      var th=(d&&d.themes)||[];
      if(!th.length){ box.innerHTML='<div class="al al-info" style="font-size:12px;">Pas encore assez de parties pour mesurer les forces et faiblesses (min. 5 réponses par thème).</div>'; return; }
      // MODIFIÉ : forts = ≥70 % · à renforcer = <70 % uniquement (th déjà trié desc)
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
          '<div style="font-size:9px;color:#8aa3d4;margin-top:2px;">'+t.parties+' partie'+(t.parties>1?'s':'')+' · '+t.joueurs+' joueur'+(t.joueurs>1?'s':'')+'</div></div>';
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

  window.lbCloseBank = function () {
    var ov=ge('lb-bank-ov'); if(ov) ov.remove();
    document.body.style.overflow='';
  };
})();
