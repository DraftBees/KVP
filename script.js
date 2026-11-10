(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* lingua: ?lang=en, poi scelta salvata, poi lingua del browser */
  function setLang(l) {
    document.documentElement.lang = l;
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.l === l)); });
    document.title = l === 'en'
      ? 'KVP Composite Materials | Fiberglass, carbon fiber and Kevlar'
      : 'KVP Composite Materials | Vetroresina, carbonio e Kevlar';
    store.set('kvp-lang', l);
  }
  var q = /[?&]lang=(it|en)/.exec(location.search);
  setLang((q && q[1]) || store.get('kvp-lang') || ((navigator.language || 'it').slice(0, 2) === 'en' ? 'en' : 'it'));
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.l); }); });

  /* menu mobile */
  var nav = $('#nav'), burger = $('#burger');
  function closeNav() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('#nav a').forEach(function (a) { a.addEventListener('click', closeNav); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });

  /* settori: porting vanilla di "Scroll 01" (21st.dev).
     L'immagine sticky a sinistra segue il testo attivo a destra (quello che attraversa il centro dello schermo). */
  var items = $$('.item'), figs = $$('.stage figure'), counter = $('#stage-n');
  function activate(i) {
    figs.forEach(function (f) { f.classList.toggle('on', f.dataset.i === String(i)); });
    items.forEach(function (it) { it.classList.toggle('on', it.dataset.i === String(i)); });
    if (counter) counter.textContent = '0' + (Number(i) + 1);
  }
  if ('IntersectionObserver' in window && items.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) activate(e.target.dataset.i); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    items.forEach(function (it) { io.observe(it); });
  }
  activate(0);

  /* modulo: prepara una mail già compilata (il sito non ha un server che la invii) */
  $('#f').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var en = document.documentElement.lang === 'en';
    var v = function (id) { return $('#' + id).value.trim(); };
    var fn = $('#fn');
    if (!v('n') || !/^\S+@\S+\.\S+$/.test(v('e')) || !v('m')) {
      fn.textContent = en ? 'Please fill in name, a valid email and your request.' : 'Compila nome, un indirizzo email valido e la richiesta.';
      fn.style.color = '#8A1C12'; fn.style.fontWeight = '600';
      var first = !v('n') ? 'n' : (!/^\S+@\S+\.\S+$/.test(v('e')) ? 'e' : 'm');
      $('#' + first).focus();
      return;
    }
    var subject = (en ? 'Quote request - ' : 'Richiesta di preventivo - ') + v('s');
    var body = (en ? 'Name: ' : 'Nome: ') + v('n') + '\n' + (en ? 'Company: ' : 'Azienda: ') + v('a') + '\nEmail: ' + v('e') + '\n' + (en ? 'Sector: ' : 'Settore: ') + v('s') + '\n\n' + v('m') + '\n';
    location.href = 'mailto:info@kvpvetroresina.it?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
})();
