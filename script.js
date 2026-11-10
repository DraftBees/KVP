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
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (e) { reduce = e.matches; refreshGeometry(); });
  document.documentElement.classList.toggle('webkit-scene', /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg/.test(navigator.userAgent));
  var wide = window.matchMedia('(min-width: 861px)');

  /* lingua */
  function setLang(l) {
    document.documentElement.lang = l;
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.l === l)); });
    document.title = l === 'en' ? 'KVP Composite Materials | Fiberglass, carbon fiber and Kevlar' : 'KVP Composite Materials | Vetroresina, carbonio e Kevlar';
    store.set('kvp-lang', l);
    document.dispatchEvent(new Event('kvp:language'));
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
  $('.bar .logo').addEventListener('click', function () { setNav(false, false); });
  compactNav.addEventListener('change', function () { setNav(false, false); });
  nav.inert = compactNav.matches;

  /* elementi animati */
  var bar = $('#bar'), gfill = $('#gfill'), gval = $('#gval'), mprog = $('#mprog'), dock = $('#dock');
  var layup = $('#laminato'), plies = $$('.ply'), items = $$('#plies li'), lend = $('#lend'), stack = $('#stack'), stage = $('.stage');
  var panels = $$('.panel'), contact = $('#contatti');
  var MAX_MM = 14.2;

  /* trame dei materiali: preparate una volta, senza canvas durante la visita. */
  var EDGE = { 1: '#8d9690', 2: '#b3a987', 3: '#8a6200', 4: '#0b0c0e', 5: '#2b2108' }, THICK = { 1: 7, 2: 22, 3: 7, 4: 8, 5: 8 };
  $$('.ply').forEach(function (p) {
    var m = /p([1-5])/.exec(p.className);
    if (m) {
      p.style.setProperty('--edge', EDGE[m[1]]);
      p.style.setProperty('--th', THICK[m[1]] + 'px');
      p.style.setProperty('--t', 'url(assets/textures/p' + m[1] + (wide.matches ? '-1024.webp)' : '-512.webp)'));
    }
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
  function logoFlight(amount) {
    if (!logo3d) return;
    amount = reduce ? 0 : clamp(amount, 0, 1);
    logo3d.classList.toggle('logo-away', amount >= 0.995);
    logo3d.style.setProperty('--logo-flight', (amount * 480).toFixed(1) + 'px');
    logo3d.style.setProperty('--logo-turn', (amount * -18).toFixed(1) + 'deg');
  }
  function setPlies(gap, active) {
    var n = plies.length;
    stack.classList.toggle('has-selection', active >= 0);
    plies.forEach(function (ply, i) {
      var lift = i === active ? gap * 0.35 : 0;
      ply.style.setProperty('--z', ((n - 1 - i) * (gap + 3) + lift).toFixed(1) + 'px');
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
    if (wide.matches && !reduce) stack.style.width = Math.min(stage.clientWidth * 0.61, stage.clientHeight * 0.56, 400) + 'px';
    else stack.style.width = '';
  }
  sizeDesktopScene();
  var stackWidth = stack.offsetWidth;
  var mobileStageHeight = stage.offsetHeight;
  var mobilePin = $('.layup-pin'), mobilePinTop = parseFloat(getComputedStyle(mobilePin).top) || 60;
  var mobileTravel = layup.offsetHeight - mobilePin.offsetHeight;
  var mobileProgress = null, motionTime = 0;
  function layupFrame(H) {
    var bounds = layup.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > H) { mobileProgress = null; motionTime = 0; return; }
    if (reduce) { logoFlight(0); setPlies(wide.matches ? 70 : 22, -1); items.forEach(function (li) { li.classList.add('on'); }); lend.classList.add('on'); return; }
    if (wide.matches) {
      var r = layup.getBoundingClientRect();
      var p = clamp(-r.top / (r.height - H), 0, 1);
      var gapMax = Math.min(62, stackWidth * 0.15, stage.offsetHeight * 0.055);
      stack.style.setProperty('--rx', (58 + p * 4) + 'deg');
      stack.style.setProperty('--rz', (-36 + p * 8) + 'deg');
      var open = ease(clamp(p / 0.16, 0, 1)), close = ease(clamp((p - 0.86) / 0.1, 0, 1));
      var active = (p > 0.16 && p < 0.86) ? clamp(Math.floor((p - 0.16) / 0.7 * items.length), 0, items.length - 1) : -1;
      logoFlight(ease(clamp((p - 0.01) / 0.12, 0, 1)) * (1 - ease(clamp((p - 0.87) / 0.12, 0, 1))));
      var desktopGap = gapMax * open * (1 - close);
      setPlies(desktopGap, active);
      stack.style.setProperty('--sy', (desktopGap * 1.8 + 12) + 'px');
      items.forEach(function (li, i) { li.classList.toggle('on', active === -1 ? (close > 0.5 || p < 0.16) : i === active); });
      lend.classList.toggle('on', close > 0.6);
      return;
    }
    /* mobile: la scena è sticky in alto; l'elenco scorre sotto e decide lo strato attivo */
    if (window.matchMedia('(min-height: 541px)').matches) {
      var travel = mobileTravel;
      var target = clamp((mobilePinTop - bounds.top) / Math.max(1, travel), 0, 1);
      var now = performance.now(), dt = Math.min(32, now - (motionTime || now - 16));
      motionTime = now;
      if (mobileProgress === null) mobileProgress = target;
      var delta = target - mobileProgress;
      mobileProgress += clamp(delta * (1 - Math.exp(-dt / 160)), -0.025, 0.025);
      if (Math.abs(target - mobileProgress) < 0.0004) mobileProgress = target;
      else req();
      var progress = mobileProgress;
      var opening = ease(clamp(progress / 0.13, 0, 1));
      var closing = ease(clamp((progress - 0.90) / 0.10, 0, 1));
      var active = clamp(Math.floor((progress - 0.13) / 0.77 * items.length), 0, items.length - 1);
      var gap = Math.min(32, mobileStageHeight * 0.065) * opening * (1 - closing);
      logoFlight(ease(clamp((progress - 0.01) / 0.11, 0, 1)) * (1 - ease(clamp((progress - 0.88) / 0.12, 0, 1))));
      setPlies(gap, progress < 0.10 || closing > 0.6 ? -1 : active);
      stack.style.setProperty('--sy', (gap * 1.8 + 30) + 'px');
      stack.style.setProperty('--rx', (58 + progress * 4) + 'deg');
      stack.style.setProperty('--rz', (-32 + progress * 12) + 'deg');
      items.forEach(function (li, i) { li.classList.toggle('on', i === active && closing < 0.65); });
      lend.classList.toggle('on', closing > 0.65);
      return;
    }
    logoFlight(0);
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
  var panelStarts = [], sectorViewport = window.innerHeight;
  function measurePanels() {
    var naturalTop = 0;
    sectorViewport = !wide.matches && sectorStack.matches && !reduce
      ? Math.round($('.panel-bg', panels[0]).offsetHeight / 0.48) : window.innerHeight;
    panels.forEach(function (pn, i) {
      panelStarts[i] = naturalTop;
      naturalTop += pn.offsetHeight;
      pn.style.setProperty('--panel-top', Math.min(60, sectorViewport - pn.offsetHeight) + 'px');
    });
  }
  var sectorResize = new ResizeObserver(function () { measurePanels(); req(); });
  panels.forEach(function (pn) { sectorResize.observe(pn); });
  function panelsFrame(H) {
    var sectorBounds = $('.sectors').getBoundingClientRect();
    if (sectorBounds.top > H || sectorBounds.bottom < 0) return;
    if (panelStarts.length !== panels.length) measurePanels();
    var boxes = panels.map(function (pn, i) {
      return { top: sectorBounds.top + panelStarts[i], height: pn.offsetHeight };
    });
    panels.forEach(function (pn, i) {
      var next = boxes[i + 1];
      var t = !reduce && (wide.matches || sectorStack.matches) && next
        ? clamp(1 - next.top / sectorViewport, 0, 1) : 0;
      pn.classList.toggle('is-covered', !reduce && !!next && next.top <= -sectorViewport);
      pn.style.transform = '';
      pn.style.filter = '';
      pn.style.setProperty('--panel-scale', (1 - 0.045 * t).toFixed(4));
      pn.style.setProperty('--panel-shade', (0.55 * t).toFixed(3));
      if (boxes[i].top + boxes[i].height < 0 || boxes[i].top > H) return;
      var mid = (boxes[i].top + boxes[i].height / 2 - H / 2) / H;
      $('.panel-bg', pn).style.transform = reduce ? '' :
        'translate3d(0,' + clamp(mid * -14, -14, 14).toFixed(1) + 'px,0) scale(1.045)';
    });
  }

  var sceneObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { stack.classList.toggle('scene-sleep', !entry.isIntersecting); });
  }, { rootMargin: '160px' });
  sceneObserver.observe(stage);

  var panelObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { if (entry.isIntersecting) {
      entry.target.classList.add('in-view'); panelObserver.unobserve(entry.target);
      var photo = $('.panel-bg', entry.target); if (photo) photo.loading = 'eager';
    } });
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
  function refreshGeometry() {
    sizeDesktopScene(); stackWidth = stack.offsetWidth;
    mobileStageHeight = stage.offsetHeight;
    mobileTravel = layup.offsetHeight - mobilePin.offsetHeight;
    mobilePinTop = parseFloat(getComputedStyle(mobilePin).top) || 60;
    mobileProgress = null; motionTime = 0;
    measurePanels(); req();
  }
  var sceneResize = new ResizeObserver(refreshGeometry);
  sceneResize.observe(mobilePin); sceneResize.observe(stage);
  window.addEventListener('resize', refreshGeometry);
  window.addEventListener('pageshow', refreshGeometry);
  document.addEventListener('kvp:language', refreshGeometry);
  window.addEventListener('load', refreshGeometry);
  document.fonts.ready.then(refreshGeometry);
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
