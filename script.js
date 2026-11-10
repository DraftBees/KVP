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
  var start = (q && q[1]) || store.get('kvp-lang') || ((navigator.language || 'it').slice(0, 2) === 'en' ? 'en' : 'it');
  setLang(start);
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.l); }); });

  /* intestazione */
  var bar = $('#bar');
  function onScroll() { bar.classList.toggle('on', window.scrollY > 8); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* menu mobile */
  var nav = $('#nav'), burger = $('#burger');
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }); });

  /* modulo: prepara una mail già compilata (il sito non ha un server che la invii) */
  var f = $('#f');
  f.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var en = document.documentElement.lang === 'en';
    var v = function (id) { return $('#' + id).value.trim(); };
    if (!v('n') || !/^\S+@\S+\.\S+$/.test(v('e')) || !v('m')) {
      $('#fn').textContent = en ? 'Please fill in name, a valid email and your request.' : 'Compila nome, un indirizzo email valido e la richiesta.';
      $('#fn').style.color = '#B3261E';
      return;
    }
    var subject = (en ? 'Quote request - ' : 'Richiesta di preventivo - ') + v('s');
    var body = (en ? 'Name: ' : 'Nome: ') + v('n') + '\n' + (en ? 'Company: ' : 'Azienda: ') + v('a') + '\nEmail: ' + v('e') + '\n' + (en ? 'Sector: ' : 'Settore: ') + v('s') + '\n\n' + v('m') + '\n';
    location.href = 'mailto:info@kvpvetroresina.it?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
})();
