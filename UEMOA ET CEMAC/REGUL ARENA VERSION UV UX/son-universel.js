/* ============================================================
   REGUL ACADÉMIE — Système son universel pour formations
   Aligné sur le SFX du parent (index.html)
   À inclure dans chaque formation HTML via :
   <script src="../js/son-universel.js"></script>
   ============================================================ */
(function(){
  let _ac = null;
  function ac(){
    try {
      if(!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
      if(_ac.state === 'suspended') _ac.resume();
    } catch(e){}
    return _ac;
  }
  function bip(freq, dur, type, vol, delay){
    const c = ac(); if(!c) return;
    const t = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol || 0.25, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  // Système SFX identique au parent — cohérence garantie
  window.SFX = {
    clic(){ bip(520, .05, 'square', .12, 0); },
    bon(){ bip(660, .12, 'sine', .3, 0); bip(880, .18, 'sine', .3, .1); bip(1180, .25, 'sine', .28, .22); },
    faux(){ bip(200, .25, 'sawtooth', .22, 0); bip(150, .3, 'sawtooth', .2, .12); },
    tick(){ bip(900, .06, 'square', .14, 0); },
    win(){ bip(660, .15, 'sine', .3, 0); bip(880, .15, 'sine', .3, .15); bip(1320, .3, 'sine', .3, .3); },
    lose(){ bip(330, .2, 'sawtooth', .2, 0); bip(220, .35, 'sawtooth', .2, .2); },
    ouvre(){ bip(740, .08, 'triangle', .2, 0); bip(990, .1, 'triangle', .2, .08); }
  };
  // Auto-attache un son de clic sur TOUS les boutons + déblocage audio
  document.addEventListener('click', function(e){
    const cible = e.target.closest('button, .btn, .quiz-option, .answer-btn, [role="button"], input[type="button"], input[type="submit"]');
    if(cible){
      try {
        ac();
        // Sons contextuels selon la classe
        if(cible.classList.contains('correct') || cible.classList.contains('ok')) SFX.bon();
        else if(cible.classList.contains('wrong') || cible.classList.contains('bad') || cible.classList.contains('err')) SFX.faux();
        else SFX.clic();
      } catch(err){}
    }
  }, true);
  // Indicateur visuel discret en bas à droite
  document.addEventListener('DOMContentLoaded', function(){
    const ind = document.createElement('div');
    ind.textContent = '🔊';
    ind.title = 'Son activé — clique pour désactiver';
    ind.style.cssText = 'position:fixed;bottom:12px;right:12px;background:#002B5C;color:#C9991A;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:9999;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,.2);user-select:none';
    let on = true;
    ind.onclick = function(){
      on = !on;
      ind.textContent = on ? '🔊' : '🔇';
      if(_ac){ if(on) _ac.resume(); else _ac.suspend(); }
    };
    document.body.appendChild(ind);
  });
})();
