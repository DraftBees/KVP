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
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (e) { reduce = e.matches; req(); });
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

  /* Menu mobile: focus contenuto, sfondo inattivo e stato coerente al resize. */
  var nav = $('#nav'), burger = $('#burger');
  var compactNav = window.matchMedia('(max-width: 1080px)');
  var background = $$('main, footer, .dock, .skip');
  function setNav(open, returnFocus) {
    open = open && compactNav.matches;
    var wasOpen = nav.classList.contains('open');
    nav.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    nav.inert = compactNav.matches && !open;
    background.forEach(function (el) { el.inert = open; });
    if (open) { $('#dock').classList.remove('show'); $('#dock').inert = true; }
    if (open && !wasOpen) $('a', nav).focus({ preventScroll: true });
    if (!open && wasOpen && returnFocus) burger.focus({ preventScroll: true });
    req();
  }
  burger.addEventListener('click', function () { setNav(!nav.classList.contains('open'), true); });
  $$('#nav a').forEach(function (a) { a.addEventListener('click', function () {
    setNav(false, false);
    if (a.hash) {
      var target = $(a.hash);
      if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
    }
  }); });
  document.addEventListener('keydown', function (e) {
    if (!nav.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); setNav(false, true); }
    if (e.key === 'Tab') {
      var controls = $$('.bar a, .bar button').filter(function (el) { return !el.closest('[inert]') && el.getClientRects().length; });
      var first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  compactNav.addEventListener('change', function () { setNav(false, false); });
  nav.inert = compactNav.matches;

  /* elementi animati */
  var bar = $('#bar'), gfill = $('#gfill'), gval = $('#gval'), mprog = $('#mprog'), dock = $('#dock');
  var layup = $('#laminato'), plies = $$('.ply'), items = $$('#plies li'), lend = $('#lend'), stack = $('#stack'), stage = $('.stage');
  var panels = $$('.panel'), contact = $('#contatti');
  var MAX_MM = 14.2;

  /* trame dei materiali: generate al volo, nitide a qualsiasi dimensione (niente foto sgranate) */
  function weaveTexture(o) {
    var S = o.size || (wide.matches ? 1024 : 512), c = document.createElement('canvas'); c.width = c.height = S;
    var x = c.getContext('2d'), cell = S / o.n, gap = (o.gap || 0.07) * cell;
    x.fillStyle = o.bg; x.fillRect(0, 0, S, S);
    function tow(px, py, w, h, vert, pal) {
      var g = vert ? x.createLinearGradient(px, 0, px + w, 0) : x.createLinearGradient(0, py, 0, py + h);
      g.addColorStop(0, pal[0]); g.addColorStop(0.2, pal[1]); g.addColorStop(0.5, pal[2]); g.addColorStop(0.8, pal[1]); g.addColorStop(1, pal[0]);
      x.fillStyle = g; x.fillRect(px, py, w, h);
      var wid = vert ? w : h, cnt = Math.max(5, Math.round(wid / 1.5));
      for (var k = 0; k < cnt; k++) {
        var off = (k + Math.random() * 0.8) * wid / cnt, a = 0.05 + Math.random() * 0.13;
        x.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,' + a + ')' : 'rgba(0,0,0,' + a + ')';
        if (vert) x.fillRect(px + off, py, 1.1, h); else x.fillRect(px, py + off, w, 1.1);
      }
      var g2 = vert ? x.createLinearGradient(0, py, 0, py + h) : x.createLinearGradient(px, 0, px + w, 0);
      g2.addColorStop(0, 'rgba(0,0,0,.66)'); g2.addColorStop(0.15, 'rgba(0,0,0,.06)'); g2.addColorStop(0.5, 'rgba(255,255,255,.05)');
      g2.addColorStop(0.85, 'rgba(0,0,0,.06)'); g2.addColorStop(1, 'rgba(0,0,0,.66)');
      x.fillStyle = g2; x.fillRect(px, py, w, h);
    }
    var i, j, s;
    for (j = 0; j < o.n; j++) for (i = 0; i < o.n;) {            /* ordito (verticale) */
      if (o.rule(i, j)) { s = i; while (i < o.n && o.rule(i, j)) i++; tow(j * cell + gap / 2, s * cell + gap / 2, cell - gap, (i - s) * cell - gap, true, o.warp); } else i++;
    }
    for (i = 0; i < o.n; i++) for (j = 0; j < o.n;) {            /* trama (orizzontale) */
      if (!o.rule(i, j)) { s = j; while (j < o.n && !o.rule(i, j)) j++; tow(s * cell + gap / 2, i * cell + gap / 2, (j - s) * cell - gap, cell - gap, false, o.weft); } else j++;
    }
    x.globalCompositeOperation = 'soft-light';                    /* luce morbida + lucentezza */
    var rg = x.createRadialGradient(S * 0.3, S * 0.22, S * 0.05, S * 0.5, S * 0.5, S * 0.85);
    rg.addColorStop(0, 'rgba(255,255,255,.75)'); rg.addColorStop(0.55, 'rgba(128,128,128,.0)'); rg.addColorStop(1, 'rgba(0,0,0,.7)');
    x.fillStyle = rg; x.fillRect(0, 0, S, S);
    x.globalCompositeOperation = 'source-over';
    for (var q = 0; q < S * 3; q++) { x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '0,0,0') + ',' + (Math.random() * 0.06).toFixed(3) + ')'; x.fillRect(Math.random() * S, Math.random() * S, 1.2, 1.2); }
    return c.toDataURL('image/jpeg', 0.9);
  }
  var twill = function (i, j) { return ((i + j) % 4) < 2; }, plain = function (i, j) { return (i + j) % 2 === 0; };
  var CARB = { warp: ['#030304', '#171a1f', '#8b96a8'], weft: ['#020203', '#0c0e11', '#333a44'] };
  var KEV = { warp: ['#7a5400', '#d49f0e', '#ffe58a'], weft: ['#6a4900', '#b58306', '#e9bd3c'] };
  var GLS = { warp: ['#a7aea5', '#d9ddd3', '#fbfcf8'], weft: ['#9aa299', '#cdd2c8', '#f0f2ea'] };
  function foamTexture() {                                      /* schiuma PVC a cellule chiuse */
    var S = wide.matches ? 1024 : 512, c = document.createElement('canvas'); c.width = c.height = S; var x = c.getContext('2d');
    x.fillStyle = '#c9bf9f'; x.fillRect(0, 0, S, S);
    for (var q = 0; q < (wide.matches ? 5200 : 1300); q++) {
      var px = Math.random() * S, py = Math.random() * S, r = 4 + Math.random() * 9;
      var g = x.createRadialGradient(px - r * 0.3, py - r * 0.3, r * 0.1, px, py, r);
      var t = 0.82 + Math.random() * 0.3;
      g.addColorStop(0, 'rgb(' + Math.min(255, 238 * t | 0) + ',' + Math.min(255, 228 * t | 0) + ',' + Math.min(255, 196 * t | 0) + ')');
      g.addColorStop(0.75, 'rgb(' + (186 * t | 0) + ',' + (174 * t | 0) + ',' + (140 * t | 0) + ')');
      g.addColorStop(1, 'rgba(92,80,52,.75)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 6.2832); x.fill();
    }
    x.globalCompositeOperation = 'soft-light';
    var rg = x.createRadialGradient(S * 0.3, S * 0.22, S * 0.05, S * 0.5, S * 0.5, S * 0.85);
    rg.addColorStop(0, 'rgba(255,255,255,.6)'); rg.addColorStop(0.55, 'rgba(128,128,128,0)'); rg.addColorStop(1, 'rgba(0,0,0,.6)');
    x.fillStyle = rg; x.fillRect(0, 0, S, S);
    return c.toDataURL('image/jpeg', 0.9);
  }
  window.__tex = {
    p1: function () { return weaveTexture({ n: 24, rule: plain, warp: GLS.warp, weft: GLS.weft, bg: '#69726c', gap: 0.05 }); },
    p2: foamTexture,
    p3: function () { return weaveTexture({ n: 30, rule: plain, warp: KEV.warp, weft: KEV.weft, bg: '#2a1c00', gap: 0.06 }); },
    p4: function () { return weaveTexture({ n: 40, rule: twill, warp: CARB.warp, weft: CARB.weft, bg: '#000', gap: 0.05 }); },
    p5: function () { return weaveTexture({ n: 34, rule: twill, warp: CARB.warp, weft: KEV.weft, bg: '#120c00', gap: 0.05 }); }
  };
  var EDGE = { 1: '#8d9690', 2: '#b3a987', 3: '#8a6200', 4: '#0b0c0e', 5: '#2b2108' }, THICK = { 1: 7, 2: 22, 3: 7, 4: 8, 5: 8 };
  $$('.ply').forEach(function (p) {
    var m = /p([1-5])/.exec(p.className);
    if (m) { p.style.setProperty('--edge', EDGE[m[1]]); p.style.setProperty('--th', THICK[m[1]] + 'px'); try { p.style.setProperty('--t', 'url(' + window.__tex['p' + m[1]]() + ')'); } catch (e) {} }
  });

  /* logo KVP estruso: tante copie dello stesso tracciato del marchio, impilate in profondita */
  var logo3d = $('#logo3d'), SL = wide.matches ? 20 : 10, DEPTH = 26;
  if (logo3d) {
    for (var s = 0; s < SL; s++) {
      var t = s / (SL - 1), front = s === SL - 1;
      var k = front ? 1 : 0.34 + 0.4 * t;
      var col = 'rgb(' + Math.round(255 * k) + ',' + Math.round(199 * k) + ',' + Math.round(30 * k) + ')';
      var ns = 'http://www.w3.org/2000/svg', sv = document.createElementNS(ns, 'svg');
      sv.setAttribute('viewBox', '0 0 250 120'); sv.setAttribute('aria-hidden', 'true');
      var u = document.createElementNS(ns, 'use'); u.setAttribute('href', '#kmark'); sv.appendChild(u);
      sv.style.color = col; sv.style.transform = 'translateZ(' + ((s - SL / 2) * DEPTH / SL).toFixed(2) + 'px)';
      logo3d.appendChild(sv);
    }
  }
  var matTitle = $('.mat-title'), matSpans = $$('.mat-title .mt');
  function setPlies(gap, active) {
    var n = plies.length;
    plies.forEach(function (ply, i) {
      var lift = i === active ? gap * 0.35 : 0;
      ply.style.setProperty('--z', ((n - 1 - i) * (gap + 3) + lift) + 'px');
      ply.classList.toggle('dim', active > -1 && i !== active);
      ply.classList.toggle('act', i === active);
    });
    stack.style.setProperty('--sy', (gap * (wide.matches ? 2.3 : 1.2) + 8) + 'px');
    var sw = stackWidth, topZ = (n - 1) * (gap + 3) + (active === 0 ? gap * 0.35 : 0);
    stack.style.setProperty('--sw', sw + 'px');
    stack.style.setProperty('--lz', (topZ + 1 + gap * 0.75) + 'px');
    stack.style.setProperty('--lsz', (topZ + 1) + 'px');
    stack.style.setProperty('--lso', (0.85 - Math.min(gap / 120, 0.5)).toFixed(2));
    /* il titolo accende il materiale dello strato attivo */
    if (matTitle) {
      matTitle.classList.toggle('has-active', active >= 1);
      matSpans.forEach(function (m) { m.classList.toggle('on', active >= 1 && +m.dataset.m === active); });
    }
  }

  function sizeDesktopScene() {
    if (wide.matches) stack.style.width = Math.min(stage.clientWidth * 0.61, stage.clientHeight * 0.56, 400) + 'px';
    else stack.style.width = '';
  }
  sizeDesktopScene();
  var stackWidth = stack.offsetWidth;
  function layupFrame(H) {
    var bounds = layup.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > H) return;
    if (reduce) { setPlies(wide.matches ? 70 : 22, -1); items.forEach(function (li) { li.classList.add('on'); }); lend.classList.add('on'); return; }
    if (wide.matches) {
      var r = layup.getBoundingClientRect();
      var p = clamp(-r.top / (r.height - H), 0, 1);
      var gapMax = Math.min(62, stackWidth * 0.15, stage.offsetHeight * 0.055);
      stack.style.setProperty('--rx', (58 + p * 4) + 'deg');
      stack.style.setProperty('--rz', (-36 + p * 8) + 'deg');
      var open = ease(clamp(p / 0.16, 0, 1)), close = ease(clamp((p - 0.86) / 0.1, 0, 1));
      var active = (p > 0.16 && p < 0.86) ? clamp(Math.floor((p - 0.16) / 0.7 * items.length), 0, items.length - 1) : -1;
      var desktopGap = gapMax * open * (1 - close);
      setPlies(desktopGap, active);
      stack.style.setProperty('--sy', (desktopGap * 1.8 + 12) + 'px');
      items.forEach(function (li, i) { li.classList.toggle('on', active === -1 ? (close > 0.5 || p < 0.16) : i === active); });
      lend.classList.toggle('on', close > 0.6);
      return;
    }
    /* mobile: la scena è sticky in alto; l'elenco scorre sotto e decide lo strato attivo */
    if (window.matchMedia('(min-height: 541px)').matches) {
      var travel = bounds.height - $('.layup-pin').offsetHeight;
      var progress = clamp((60 - bounds.top) / Math.max(1, travel), 0, 1);
      var opening = ease(clamp(progress / 0.13, 0, 1));
      var closing = ease(clamp((progress - 0.90) / 0.10, 0, 1));
      var active = clamp(Math.floor((progress - 0.13) / 0.77 * items.length), 0, items.length - 1);
      var gap = Math.min(32, stage.offsetHeight * 0.065) * opening * (1 - closing);
      setPlies(gap, progress < 0.10 || closing > 0.6 ? -1 : active);
      stack.style.setProperty('--sy', (gap * 1.8 + 30) + 'px');
      stack.style.setProperty('--rx', (58 + progress * 4) + 'deg');
      stack.style.setProperty('--rz', (-32 + progress * 12) + 'deg');
      items.forEach(function (li, i) { li.classList.toggle('on', i === active && closing < 0.65); });
      lend.classList.toggle('on', closing > 0.65);
      return;
    }
    var stageBox = stage.getBoundingClientRect();
    var cards = items.map(function (li) { return li.getBoundingClientRect(); });
    var ref = H <= 540 ? H * 0.4 : Math.min(stageBox.bottom + 48, H * 0.72);
    var nearest = 0, distance = Infinity;
    cards.forEach(function (b, i) {
      var d = Math.abs(b.top - ref);
      if (d < distance) { distance = d; nearest = i; }
    });
    var gapM = Math.min(26, stageBox.height * 0.07);
    var opening = ease(clamp((H - bounds.top) / (H * 0.65), 0, 1));
    var closing = ease(clamp((ref - cards[cards.length - 1].bottom) / 180, 0, 1));
    setPlies(gapM * opening * (1 - closing), closing > 0.8 ? -1 : nearest);
    items.forEach(function (li, i) { li.classList.toggle('on', nearest === i); });
    lend.classList.toggle('on', closing > 0.5);
  }

  var sectorStack = window.matchMedia('(min-height: 541px)');
  function measurePanels() {
    panels.forEach(function (pn) {
      pn.style.setProperty('--panel-top', Math.min(60, window.innerHeight - pn.offsetHeight) + 'px');
    });
  }
  var sectorResize = new ResizeObserver(function () { measurePanels(); req(); });
  panels.forEach(function (pn) { sectorResize.observe(pn); });
  function panelsFrame(H) {
    var boxes = panels.map(function (pn) { return pn.getBoundingClientRect(); });
    panels.forEach(function (pn, i) {
      var next = boxes[i + 1];
      var t = !reduce && (wide.matches || sectorStack.matches) && next
        ? clamp(1 - next.top / H, 0, 1) : 0;
      pn.style.transform = '';
      pn.style.filter = '';
      pn.style.setProperty('--panel-scale', (1 - 0.045 * t).toFixed(4));
      pn.style.setProperty('--panel-shade', (0.55 * t).toFixed(3));
      if (boxes[i].bottom < 0 || boxes[i].top > H) return;
      var mid = (boxes[i].top + boxes[i].height / 2 - H / 2) / H;
      $('.panel-bg', pn).style.transform = reduce ? '' :
        'translate3d(0,' + clamp(mid * -14, -14, 14).toFixed(1) + 'px,0) scale(1.045)';
    });
  }

  var panelObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { entry.target.classList.toggle('in-view', entry.isIntersecting); });
  }, { threshold: 0.12 });
  panels.forEach(function (pn) { panelObserver.observe(pn); });

  var ticking = false;
  function frame() {
    ticking = false;
    var H = window.innerHeight, y = window.scrollY, total = document.documentElement.scrollHeight - H;
    var prog = total > 0 ? clamp(y / total, 0, 1) : 0;
    bar.classList.toggle('solid', y > (wide.matches ? H * 0.6 : 40));
    gfill.style.transform = 'scaleY(' + prog + ')';
    gval.textContent = (prog * MAX_MM).toFixed(2);
    mprog.style.transform = 'scaleX(' + prog + ')';
    /* barra azioni: dopo l'apertura, nascosta quando il modulo è a schermo */
    var cb = contact.getBoundingClientRect();
    var sceneBox = layup.getBoundingClientRect();
    var sceneVisible = sceneBox.top < H * 0.65 && sceneBox.bottom > H * 0.35;
    var showDock = !sceneVisible && !wide.matches && y > H * 0.7 && cb.top > H && !nav.classList.contains('open');
    dock.classList.toggle('show', showDock);
    dock.inert = !showDock;
    layupFrame(H);
    panelsFrame(H);
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', function () { sizeDesktopScene(); stackWidth = stack.offsetWidth; measurePanels(); req(); });
  window.addEventListener('load', function () { sizeDesktopScene(); stackWidth = stack.offsetWidth; req(); });
  document.fonts.ready.then(function () { sizeDesktopScene(); stackWidth = stack.offsetWidth; req(); });
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
