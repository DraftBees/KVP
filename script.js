(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide = window.matchMedia('(min-width: 861px)');

  /* lingua */
  function setLang(l) {
    document.documentElement.lang = l;
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.l === l)); });
    document.title = l === 'en' ? 'KVP Composite Materials | Fiberglass, carbon fiber and Kevlar' : 'KVP Composite Materials | Vetroresina, carbonio e Kevlar';
    store.set('kvp-lang', l);
  }
  var q = /[?&]lang=(it|en)/.exec(location.search);
  setLang((q && q[1]) || store.get('kvp-lang') || ((navigator.language || 'it').slice(0, 2) === 'en' ? 'en' : 'it'));
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.l); }); });

  /* menu */
  var nav = $('#nav'), burger = $('#burger');
  function setNav(open) {
    nav.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    nav.inert = !open && window.matchMedia('(max-width: 1080px)').matches;
  }
  setNav(false);
  burger.addEventListener('click', function () { setNav(!nav.classList.contains('open')); });
  $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
  window.matchMedia('(min-width: 1081px)').addEventListener('change', function () { setNav(false); nav.inert = false; });

  /* elementi animati */
  var bar = $('#bar'), gfill = $('#gfill'), gval = $('#gval'), mprog = $('#mprog'), dock = $('#dock');
  var layup = $('#laminato'), plies = $$('.ply'), items = $$('#plies li'), lend = $('#lend'), stack = $('#stack'), stage = $('.stage');
  var panels = $$('.panel'), contact = $('#contatti');
  var MAX_MM = 14.2;

  function setPlies(gap, active) {
    var n = plies.length;
    plies.forEach(function (ply, i) {
      var lift = i === active ? gap * 0.6 : 0;
      ply.style.setProperty('--z', ((n - 1 - i) * (gap + 3) + lift) + 'px');
      ply.classList.toggle('dim', active > -1 && i !== active);
    });
    stack.style.setProperty('--sy', (gap * 1.6) + 'px');
  }

  function layupFrame(H) {
    if (reduce) { setPlies(wide.matches ? 70 : 34, -1); items.forEach(function (li) { li.classList.add('on'); }); lend.classList.add('on'); return; }
    if (wide.matches) {
      var r = layup.getBoundingClientRect();
      var p = clamp(-r.top / (r.height - H), 0, 1);
      var gapMax = Math.min(84, stack.offsetWidth * 0.19, H * 0.09);
      var open = ease(clamp(p / 0.16, 0, 1)), close = ease(clamp((p - 0.86) / 0.1, 0, 1));
      var active = (p > 0.16 && p < 0.86) ? clamp(Math.floor((p - 0.16) / 0.7 * items.length), 0, items.length - 1) : -1;
      setPlies(gapMax * open * (1 - close), active);
      items.forEach(function (li, i) { li.classList.toggle('on', active === -1 ? (close > 0.5 || p < 0.16) : i === active); });
      lend.classList.toggle('on', close > 0.6);
      return;
    }
    /* mobile: la scena è sticky in alto; l'elenco scorre sotto e decide lo strato attivo */
    var ref = stage.getBoundingClientRect().bottom - 12;
    var t0 = items[0].getBoundingClientRect().top;
    var last = items[items.length - 1].getBoundingClientRect();
    var gapM = Math.min(46, H * 0.058);
    var o = ease(clamp((ref + H * 0.30 - t0) / (H * 0.30), 0, 1));
    var c = ease(clamp((ref - last.bottom + 40) / 120, 0, 1));
    var act = -1;
    items.forEach(function (li, i) { var b = li.getBoundingClientRect(); if (b.top < ref + 30 && b.bottom > ref + 30) act = i; });
    if (c > 0.5) act = -1;
    setPlies(gapM * o * (1 - c), act);
    items.forEach(function (li, i) { li.classList.toggle('on', act === i); });
    lend.classList.toggle('on', c > 0.5);
  }

  function panelsFrame(H) {
    if (reduce) { panels.forEach(function (pn) { pn.style.transform = ''; pn.style.filter = ''; $('.panel-bg', pn).style.transform = ''; }); return; }
    if (wide.matches) {
      for (var i = 0; i < panels.length - 1; i++) {
        var t = clamp(1 - panels[i + 1].getBoundingClientRect().top / H, 0, 1);
        panels[i].style.transform = t ? 'scale(' + (1 - 0.06 * t) + ')' : '';
        panels[i].style.filter = t ? 'brightness(' + (1 - 0.6 * t) + ')' : '';
      }
      panels.forEach(function (pn) { $('.panel-bg', pn).style.transform = ''; });
      return;
    }
    /* mobile: parallasse leggero della foto */
    panels.forEach(function (pn) {
      var b = pn.getBoundingClientRect();
      if (b.bottom < -H || b.top > H * 2) return;
      var mid = (b.top + b.height / 2 - H / 2) / H;
      $('.panel-bg', pn).style.transform = 'translate3d(0,' + (mid * -42).toFixed(1) + 'px,0) scale(1.18)';
    });
  }

  var ticking = false;
  function frame() {
    ticking = false;
    var H = window.innerHeight, y = window.scrollY, total = document.documentElement.scrollHeight - H;
    var prog = clamp(y / total, 0, 1);
    bar.classList.toggle('solid', y > (wide.matches ? H * 0.6 : 40));
    gfill.style.transform = 'scaleY(' + prog + ')';
    gval.textContent = (prog * MAX_MM).toFixed(2);
    mprog.style.transform = 'scaleX(' + prog + ')';
    /* barra azioni: dopo l'apertura, nascosta quando il modulo è a schermo */
    var cb = contact.getBoundingClientRect();
    dock.classList.toggle('show', y > H * 0.7 && cb.top > H * 0.35 && !nav.classList.contains('open'));
    layupFrame(H);
    panelsFrame(H);
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  window.addEventListener('load', req);
  frame();

  /* modulo: prepara una mail già compilata */
  $('#f').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var en = document.documentElement.lang === 'en';
    var v = function (id) { return $('#' + id).value.trim(); };
    var fn = $('#fn'), mailOk = /^\S+@\S+\.\S+$/.test(v('e'));
    if (!v('n') || !mailOk || !v('m')) {
      fn.textContent = en ? 'Please fill in name, a valid email and your request.' : 'Compila nome, un indirizzo email valido e la richiesta.';
      fn.style.color = '#FFC71E';
      $('#' + (!v('n') ? 'n' : !mailOk ? 'e' : 'm')).focus();
      return;
    }
    var subject = (en ? 'Quote request - ' : 'Richiesta di preventivo - ') + v('s');
    var body = (en ? 'Name: ' : 'Nome: ') + v('n') + '\n' + (en ? 'Company: ' : 'Azienda: ') + v('a') + '\nEmail: ' + v('e') + '\n' + (en ? 'Sector: ' : 'Settore: ') + v('s') + '\n\n' + v('m') + '\n';
    location.href = 'mailto:info@kvpvetroresina.it?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
})();
