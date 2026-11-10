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
  function closeNav() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () { burger.setAttribute('aria-expanded', String(nav.classList.toggle('open'))); });
  $$('#nav a').forEach(function (a) { a.addEventListener('click', closeNav); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });

  /* elementi animati */
  var bar = $('#bar'), gfill = $('#gfill'), gval = $('#gval');
  var layup = $('#laminato'), plies = $$('.ply'), items = $$('#plies li'), lend = $('#lend'), stack = $('#stack');
  var panels = $$('.panel');
  var MAX_MM = 14.2;

  function layupFrame(H) {
    var n = plies.length;
    if (!wide.matches || reduce) {
      plies.forEach(function (p, i) { p.style.setProperty('--z', ((n - 1 - i) * (wide.matches ? 70 : 22)) + 'px'); p.classList.remove('dim'); });
      items.forEach(function (li) { li.classList.add('on'); });
      if (lend) lend.classList.add('on');
      return;
    }
    var r = layup.getBoundingClientRect();
    var p = clamp(-r.top / (r.height - H), 0, 1);
    var gapMax = Math.min(84, stack.offsetWidth * 0.19, H * 0.09);
    var open = ease(clamp(p / 0.16, 0, 1));
    var close = ease(clamp((p - 0.86) / 0.1, 0, 1));
    var gap = gapMax * open * (1 - close);
    stack.style.setProperty('--sy', (gap * 1.6) + 'px');
    var active = -1;
    if (p > 0.16 && p < 0.86) active = clamp(Math.floor((p - 0.16) / 0.7 * n), 0, n - 1);
    plies.forEach(function (ply, i) {
      var lift = i === active ? gap * 0.6 : 0;
      ply.style.setProperty('--z', ((n - 1 - i) * (gap + 3) + lift) + 'px');
      ply.classList.toggle('dim', active > -1 && i !== active);
    });
    items.forEach(function (li, i) { li.classList.toggle('on', active === -1 ? close > 0.5 || p < 0.16 : i === active); });
    lend.classList.toggle('on', close > 0.6);
  }

  function panelsFrame(H) {
    if (!wide.matches || reduce) { panels.forEach(function (pn) { pn.style.transform = ''; pn.style.filter = ''; }); return; }
    for (var i = 0; i < panels.length - 1; i++) {
      var t = clamp(1 - panels[i + 1].getBoundingClientRect().top / H, 0, 1);
      panels[i].style.transform = t ? 'scale(' + (1 - 0.06 * t) + ')' : '';
      panels[i].style.filter = t ? 'brightness(' + (1 - 0.6 * t) + ')' : '';
    }
  }

  var ticking = false;
  function frame() {
    ticking = false;
    var H = window.innerHeight, y = window.scrollY;
    bar.classList.toggle('solid', y > H * 0.6);
    var prog = clamp(y / (document.documentElement.scrollHeight - H), 0, 1);
    gfill.style.transform = 'scaleY(' + prog + ')';
    gval.textContent = (prog * MAX_MM).toFixed(2);
    layupFrame(H);
    panelsFrame(H);
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
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
