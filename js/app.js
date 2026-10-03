/* Garagem Verona - comportamento do site de demonstracao */
(function () {
  'use strict';

  /* ---------- utilidades ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HAS_GSAP = !!window.gsap;
  var MOTION = HAS_GSAP && !REDUCE;
  var root = document.documentElement;
  if (!MOTION) root.classList.add('no-motion');
  if (HAS_GSAP) gsap.registerPlugin(ScrollTrigger, Flip);

  var nf = new Intl.NumberFormat('pt-BR');
  var DEFAULT_ACCENT = '#f2622d';
  function brl(n) { return 'R$ ' + nf.format(Math.round(n)); }
  function km(n) { return nf.format(n) + ' km'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtH(h) { return h.replace(':', 'h'); }
  function nome(c) { return c.marca + ' ' + c.modelo; }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignorado */ } }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 400); }, 3200);
  }

  function lum(hex) {
    var c = hex.replace('#', '');
    var a = [0, 2, 4].map(function (i) { var v = parseInt(c.substr(i, 2), 16) / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return .2126 * a[0] + .7152 * a[1] + .0722 * a[2];
  }
  function inkFor(hex) {
    var L = lum(hex), d = lum('#15110e'), w = lum('#fbfbfa');
    return (L + .05) / (d + .05) >= (w + .05) / (L + .05) ? '#15110e' : '#fbfbfa';
  }

  /* ---------- estado ---------- */
  var loja = API.loja();
  var cars = [];
  var cardMap = {};
  var favs = (function () { try { return JSON.parse(load('gv-favs')) || []; } catch (e) { return []; } })();
  var F = { q: '', carroceria: '', marca: '', comb: '', cambio: '', preco: Infinity, ordem: 'destaque', fav: false };
  var visible = [];
  var sim = { id: null, ent: 30, prazo: 48 };

  function avail() { return cars.filter(function (c) { return !c.vendido; }); }
  function byId(id) { return cars.filter(function (c) { return c.id === id; })[0]; }
  function pmt(price, ent, n) {
    var i = (loja.jurosMensal || 1.89) / 100, P = price * (1 - ent);
    return P * i / (1 - Math.pow(1 + i, -n));
  }

  /* ---------- identidade da loja ---------- */
  function iniciais(n) {
    var p = n.trim().split(/\s+/).filter(function (w) { return w.length > 1 || /^[A-Z]/.test(w); });
    return ((p[0] || '?')[0] + (p[1] ? p[1][0] : (p[0] || '  ')[1] || '')).toUpperCase();
  }
  function waNum() {
    var d = String(loja.whatsapp || '').replace(/\D/g, '');
    return d && d.indexOf('55') !== 0 && d.length <= 11 ? '55' + d : d;
  }
  function setWa(el, msg) {
    if (msg != null) el._msg = msg;
    var m = el._msg || el.dataset.msg || ('Olá! Vim pelo site da ' + loja.nome + ' e gostaria de mais informações.');
    el.href = 'https://wa.me/' + waNum() + '?text=' + encodeURIComponent(m);
  }

  function applyBrand() {
    loja = API.loja();
    var accent = loja.cor || DEFAULT_ACCENT;
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-ink', inkFor(accent));
    var mt = $('meta[name="theme-color"]');
    $$('[data-bind]').forEach(function (el) {
      var k = el.dataset.bind;
      el.textContent = k === 'iniciais' ? iniciais(loja.nome) : (loja[k] != null ? loja[k] : '');
    });
    $$('[data-bind-href]').forEach(function (el) { el.href = 'tel:+55' + String(loja.telefone).replace(/\D/g, ''); });
    document.title = loja.nome + ' - ' + loja.slogan;
    $$('[data-wa]').forEach(function (el) { setWa(el); });
    var m = loja.mapa, bb = [m.lon - .008, m.lat - .0045, m.lon + .008, m.lat + .0045].join(',');
    var frame = $('#mapFrame');
    var src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + bb + '&layer=mapnik&marker=' + m.lat + ',' + m.lon;
    if (frame.getAttribute('src') !== src) frame.setAttribute('src', src);
    $('#mapLink').href = 'https://www.openstreetmap.org/?mlat=' + m.lat + '&mlon=' + m.lon + '#map=17/' + m.lat + '/' + m.lon;
    $('#horarios').innerHTML = loja.horarios.map(function (h) {
      return '<div class="hours-line"><span>' + h.rotulo + '</span><span>' + h.texto + '</span></div>';
    }).join('');
    renderOpen();
    renderStoryCar();
    var sf = $('#sFine');
    if (sf) sf.textContent = 'Simulação ilustrativa com taxa de ' + String(loja.jurosMensal).replace('.', ',') + '% ao mês. Valores sujeitos à análise de crédito.';
    var sw = $('#swatches');
    if (sw) $$('.swatch', sw).forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.c.toLowerCase() === accent.toLowerCase())); });
    if (cars.length) { updateSim(); renderModalWa(); }
  }

  /* ---------- aberto agora ---------- */
  function renderOpen() {
    var now = new Date(), d = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
    function parse(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
    function find(day) { return loja.horarios.filter(function (h) { return h.dias.indexOf(day) > -1; })[0]; }
    var h = find(d), el = $('#openStatus'), tx = $('#openText'), open = false;
    if (h && h.abre && mins >= parse(h.abre) && mins < parse(h.fecha)) { open = true; tx.textContent = 'Aberto agora, fechamos às ' + fmtH(h.fecha); }
    else {
      var label = '';
      if (h && h.abre && mins < parse(h.abre)) label = 'hoje às ' + fmtH(h.abre);
      else {
        for (var i = 1; i <= 7; i++) {
          var n = find((d + i) % 7);
          if (n && n.abre) { label = (i === 1 ? 'amanhã' : ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][(d + i) % 7]) + ' às ' + fmtH(n.abre); break; }
        }
      }
      tx.textContent = 'Fechado agora, abrimos ' + label;
    }
    el.classList.toggle('closed', !open);
  }

  /* ---------- tema ---------- */
  function setTheme(t) {
    root.dataset.theme = t;
    save('gv-tema', t);
    var mt = $('meta[name="theme-color"]');
    if (mt) mt.content = t === 'dark' ? '#0d0e10' : '#eef0f2';
  }
  $('#themeBtn').addEventListener('click', function () { setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'); });

  /* ---------- favoritos ---------- */
  function isFav(id) { return favs.indexOf(id) > -1; }
  function toggleFav(id) {
    var i = favs.indexOf(id);
    if (i > -1) favs.splice(i, 1); else favs.push(id);
    save('gv-favs', JSON.stringify(favs));
    syncFavs();
    if (F.fav) applyFilters(true);
  }
  function setHeart(btn, on) {
    btn.setAttribute('aria-pressed', String(on));
    var u = $('use', btn);
    if (u) u.setAttribute('href', on ? '#i-heart-fill' : '#i-heart');
  }
  function syncFavs() {
    var n = favs.filter(function (id) { var c = byId(id); return c && !c.vendido; }).length;
    var b = $('#favCount');
    b.hidden = n === 0; b.textContent = n;
    $$('.card').forEach(function (el) { setHeart($('.card-fav', el), isFav(el.dataset.id)); });
    if (modalId) setHeart($('#mFav'), isFav(modalId));
    setHeart($('#favBtn'), F.fav);
    $('#favBtn').setAttribute('aria-pressed', String(F.fav));
  }
  $('#favBtn').addEventListener('click', function () {
    if (!F.fav && !favs.length) { toast('Toque no coração de um carro para salvá-lo aqui.'); return; }
    F.fav = !F.fav;
    applyFilters(true);
    syncFavs();
    $('#estoque').scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' });
  });

  /* ---------- cards ---------- */
  function cardHTML(c) {
    return '<div class="art" role="presentation"></div>' +
      '<button class="card-fav icon-btn" type="button" aria-label="Favoritar ' + esc(nome(c)) + '" aria-pressed="false"><svg class="ic"><use href="#i-heart"/></svg></button>' +
      '<div class="card-body">' +
        '<div class="card-title"><b>' + esc(nome(c)) + '</b><span>' + esc(c.versao) + '</span></div>' +
        '<div class="card-meta"><span><svg class="ic"><use href="#i-cal"/></svg>' + c.ano + '/' + c.anoModelo + '</span><span><svg class="ic"><use href="#i-speed"/></svg>' + km(c.km) + '</span><span><svg class="ic"><use href="#i-gear"/></svg>' + c.cambio + '</span></div>' +
        '<div class="card-foot"><div class="price"><span class="p-val">' + brl(c.preco) + '</span><span class="price-sub p-sub"></span></div><span class="card-go"><svg class="ic"><use href="#i-arrow"/></svg></span></div>' +
      '</div>' +
      '<button class="card-hit" type="button" aria-label="Ver detalhes do ' + esc(nome(c) + ' ' + c.versao) + '"></button>';
  }
  function updateCardPrice(c) {
    var el = cardMap[c.id]; if (!el) return;
    $('.p-val', el).textContent = brl(c.preco);
    $('.p-sub', el).textContent = 'a partir de ' + brl(pmt(c.preco, .3, 48)) + '/mês';
  }

  function buildCards() {
    var grid = $('#grid');
    grid.innerHTML = '';
    cardMap = {};
    cars.forEach(function (c) {
      var el = document.createElement('article');
      el.className = 'card'; el.dataset.id = c.id;
      el.innerHTML = cardHTML(c);
      CarArt.mount($('.art', el), c);
      cardMap[c.id] = el;
      updateCardPrice(c);
      grid.appendChild(el);
    });
    grid.setAttribute('aria-busy', 'false');
    if (MOTION && 'IntersectionObserver' in window) {
      root.classList.add('cards-io');
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px' });
      $$('.card', grid).forEach(function (el) { io.observe(el); });
      /* cards que ficam visiveis depois de um filtro tambem precisam ser observados */
      grid._io = io;
    }
  }

  /* spotlight do mouse nos cards */
  document.addEventListener('pointermove', function (e) {
    var card = e.target.closest && e.target.closest('.card');
    if (!card) return;
    var r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  $('#grid').addEventListener('click', function (e) {
    var card = e.target.closest('.card'); if (!card) return;
    if (e.target.closest('.card-fav')) { toggleFav(card.dataset.id); return; }
    if (e.target.closest('.card-hit')) openModal(card.dataset.id);
  });

  /* ---------- filtros ---------- */
  function rangeFill(inp) {
    var p = (inp.value - inp.min) / (inp.max - inp.min) * 100;
    inp.style.setProperty('--fill', p + '%');
  }

  function populateFilters() {
    var all = cars;
    function uniq(k) { var o = {}; all.forEach(function (c) { o[c[k]] = 1; }); return Object.keys(o).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); }); }
    function fill(sel, vals) {
      var cur = sel.value;
      sel.innerHTML = '<option value="">' + (sel.id === 'fMarca' ? 'Todas' : 'Todos') + '</option>' + vals.map(function (v) { return '<option>' + esc(v) + '</option>'; }).join('');
      sel.value = vals.indexOf(cur) > -1 ? cur : '';
    }
    fill($('#fMarca'), uniq('marca'));
    fill($('#fComb'), uniq('combustivel'));
    fill($('#fCambio'), uniq('cambio'));

    var prices = all.map(function (c) { return c.preco; });
    var max = Math.ceil(Math.max.apply(null, prices) / 5000) * 5000, min = Math.floor(Math.min.apply(null, prices) / 5000) * 5000;
    var fp = $('#fPreco');
    fp.min = min; fp.max = max;
    if (!isFinite(F.preco) || F.preco > max) { fp.value = max; F.preco = Infinity; }
    updatePrecoOut();

    var counts = {};
    avail().forEach(function (c) { counts[c.carroceria] = (counts[c.carroceria] || 0) + 1; });
    var types = ['Hatch', 'Sedã', 'SUV', 'Picape'].filter(function (t) { return counts[t]; });
    var box = $('#fCarroceria');
    box.innerHTML = '<button class="chip" type="button" data-v="" aria-pressed="' + (F.carroceria === '') + '">Todos <small>' + avail().length + '</small></button>' +
      types.map(function (t) { return '<button class="chip" type="button" data-v="' + t + '" aria-pressed="' + (F.carroceria === t) + '">' + t + ' <small>' + counts[t] + '</small></button>'; }).join('');

    var bm = {};
    avail().forEach(function (c) { bm[c.marca] = (bm[c.marca] || 0) + 1; });
    var row = $('#brandsRow');
    row.innerHTML = Object.keys(window.BRAND_PATHS).filter(function (b) { return bm[b]; }).map(function (b) {
      return '<button class="brand-btn" type="button" data-b="' + b + '" aria-pressed="' + (F.marca === b) + '" aria-label="Filtrar ' + b + ' (' + bm[b] + ' no estoque)" title="' + b + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + window.BRAND_PATHS[b] + '"/></svg></button>';
    }).join('');
  }
  function updatePrecoOut() {
    var fp = $('#fPreco'), v = +fp.value;
    $('#fPrecoOut').textContent = v >= +fp.max ? 'sem limite' : brl(v);
    rangeFill(fp);
  }

  function applyFilters(animate) {
    var q = F.q.trim().toLowerCase();
    var list = avail().filter(function (c) {
      if (F.fav && !isFav(c.id)) return false;
      if (F.carroceria && c.carroceria !== F.carroceria) return false;
      if (F.marca && c.marca !== F.marca) return false;
      if (F.comb && c.combustivel !== F.comb) return false;
      if (F.cambio && c.cambio !== F.cambio) return false;
      if (c.preco > F.preco) return false;
      if (q && (c.marca + ' ' + c.modelo + ' ' + c.versao + ' ' + c.cor.nome + ' ' + c.ano).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var sorters = {
      destaque: function (a, b) { return (b.destaque - a.destaque) || (cars.indexOf(a) - cars.indexOf(b)); },
      menor: function (a, b) { return a.preco - b.preco; },
      maior: function (a, b) { return b.preco - a.preco; },
      novo: function (a, b) { return (b.anoModelo - a.anoModelo) || (a.km - b.km); },
      km: function (a, b) { return a.km - b.km; }
    };
    list.sort(sorters[F.ordem]);
    visible = list;

    var grid = $('#grid'), els = $$('.card', grid);
    var state = animate && MOTION ? Flip.getState(els) : null;
    var ids = {};
    list.forEach(function (c) { ids[c.id] = 1; });
    cars.forEach(function (c) { var el = cardMap[c.id]; el.hidden = !ids[c.id]; if (ids[c.id] && grid._io && !el.classList.contains('in')) grid._io.observe(el); });
    list.forEach(function (c) { grid.appendChild(cardMap[c.id]); });

    if (state) {
      els.forEach(function (el) { el.classList.add('flipping'); });
      Flip.from(state, {
        duration: .75, ease: 'power3.inOut', absolute: true, stagger: .015,
        onEnter: function (e) { return gsap.fromTo(e, { opacity: 0, scale: .92 }, { opacity: 1, scale: 1, duration: .6, delay: .2, ease: 'power3.out', clearProps: 'opacity,scale' }); },
        onLeave: function (e) { return gsap.to(e, { opacity: 0, scale: .92, duration: .3, ease: 'power2.in' }); },
        onComplete: function () { els.forEach(function (el) { el.classList.remove('flipping'); }); ScrollTrigger.refresh(); }
      });
    }

    var dirty = F.q || F.carroceria || F.marca || F.comb || F.cambio || F.fav || isFinite(F.preco) || F.ordem !== 'destaque';
    $('#fClear').hidden = !dirty;
    $('#empty').hidden = list.length > 0;
    grid.hidden = list.length === 0;
    var total = avail().length;
    $('#resultCount').innerHTML = '<b>' + list.length + '</b> ' + (list.length === 1 ? 'carro encontrado' : 'carros encontrados') + (list.length !== total ? ' de ' + total : '');
    $$('.chip', $('#fCarroceria')).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === F.carroceria)); });
    $$('.brand-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.b === F.marca)); });
    $('#fMarca').value = F.marca;
  }

  function resetFilters() {
    F = { q: '', carroceria: '', marca: '', comb: '', cambio: '', preco: Infinity, ordem: 'destaque', fav: false };
    $('#fBusca').value = ''; $('#fComb').value = ''; $('#fCambio').value = ''; $('#fOrdem').value = 'destaque';
    $('#fPreco').value = $('#fPreco').max; updatePrecoOut();
    applyFilters(true); syncFavs();
  }

  function bindFilters() {
    var t;
    $('#fBusca').addEventListener('input', function (e) { clearTimeout(t); var v = e.target.value; t = setTimeout(function () { F.q = v; applyFilters(true); }, 180); });
    $('#fMarca').addEventListener('change', function (e) { F.marca = e.target.value; applyFilters(true); });
    $('#fComb').addEventListener('change', function (e) { F.comb = e.target.value; applyFilters(true); });
    $('#fCambio').addEventListener('change', function (e) { F.cambio = e.target.value; applyFilters(true); });
    $('#fOrdem').addEventListener('change', function (e) { F.ordem = e.target.value; applyFilters(true); });
    $('#fPreco').addEventListener('input', function (e) {
      updatePrecoOut();
      F.preco = +e.target.value >= +e.target.max ? Infinity : +e.target.value;
    });
    $('#fPreco').addEventListener('change', function () { applyFilters(true); });
    $('#fCarroceria').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; F.carroceria = b.dataset.v; applyFilters(true); });
    $('#brandsRow').addEventListener('click', function (e) {
      var b = e.target.closest('.brand-btn'); if (!b) return;
      F.marca = F.marca === b.dataset.b ? '' : b.dataset.b;
      applyFilters(true);
      $('#estoque').scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' });
    });
    $('#fClear').addEventListener('click', resetFilters);
    $('#emptyReset').addEventListener('click', resetFilters);
  }

  /* ---------- skeleton ---------- */
  function showSkeleton() {
    var s = '';
    for (var i = 0; i < 6; i++) s += '<div class="skel" aria-hidden="true"><div class="skel-img"></div><div class="skel-line"></div><div class="skel-line"></div></div>';
    $('#grid').innerHTML = s;
    $('#grid').setAttribute('aria-busy', 'true');
  }

  /* ---------- modal ---------- */
  var modalId = null, lastFocus = null;
  function renderModalWa() {
    if (!modalId) return;
    var c = byId(modalId);
    setWa($('#mWa'), 'Olá! Tenho interesse no ' + nome(c) + ' ' + c.versao + ' ' + c.ano + ', anunciado por ' + brl(c.preco) + '. Ainda está disponível?');
  }
  function fillModal(c) {
    modalId = c.id;
    CarArt.mount($('#mMedia'), c, { eager: true });
    $('#mBrand').textContent = c.marca;
    $('#mTitle').textContent = c.modelo;
    $('#mVersion').textContent = c.versao;
    $('#mPrice').textContent = brl(c.preco);
    $('#mParcela').innerHTML = 'ou <b>' + brl(pmt(c.preco, .3, 48)) + '</b>/mês em 48x com 30% de entrada';
    $('#mDesc').textContent = c.descricao;
    var specs = [['Ano', c.ano + '/' + c.anoModelo], ['Quilometragem', km(c.km)], ['Câmbio', c.cambio], ['Combustível', c.combustivel], ['Motor', c.motor], ['Potência', c.potencia], ['Cor', c.cor.nome], ['Portas', c.portas]];
    $('#mSpecs').innerHTML = specs.map(function (s) { return '<div><dt>' + s[0] + '</dt><dd>' + esc(s[1]) + '</dd></div>'; }).join('');
    $('#mOpts').innerHTML = c.opcionais.map(function (o) { return '<span>' + esc(o) + '</span>'; }).join('');
    setHeart($('#mFav'), isFav(c.id));
    renderModalWa();
  }
  function openModal(id) {
    var c = byId(id); if (!c) return;
    lastFocus = document.activeElement;
    var m = $('#modal'), card = $('.modal-card', m);
    fillModal(c);
    m.hidden = false;
    root.style.overflow = 'hidden';
    card.scrollTop = 0; $('.modal-body', m).scrollTop = 0;
    if (MOTION) {
      gsap.fromTo($('.modal-scrim', m), { opacity: 0 }, { opacity: 1, duration: .35 });
      gsap.fromTo(card, { opacity: 0, y: 40, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .6, ease: 'power4.out' });
      gsap.fromTo($$('.modal-body > *', m), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .55, ease: 'power3.out', stagger: .04, delay: .12, clearProps: 'opacity,transform' });
    }
    $('.modal-close', m).focus({ preventScroll: true });
    history.replaceState(null, '', '#' + id);
  }
  function closeModal() {
    if (modalId == null) return;
    var m = $('#modal');
    function done() { m.hidden = true; root.style.overflow = ''; modalId = null; if (lastFocus) lastFocus.focus({ preventScroll: true }); history.replaceState(null, '', location.pathname + location.search); }
    if (MOTION) {
      gsap.to($('.modal-card', m), { opacity: 0, y: 24, scale: .98, duration: .28, ease: 'power2.in' });
      gsap.to($('.modal-scrim', m), { opacity: 0, duration: .3, onComplete: done });
    } else done();
  }
  function stepModal(dir) {
    if (!visible.length) return;
    var i = visible.map(function (c) { return c.id; }).indexOf(modalId);
    var n = visible[(i + dir + visible.length) % visible.length];
    fillModal(n);
    if (MOTION) gsap.fromTo($('.modal-media .art', $('#modal')), { opacity: 0, x: dir * 30 }, { opacity: 1, x: 0, duration: .5, ease: 'power3.out' });
    history.replaceState(null, '', '#' + n.id);
  }
  $('#modal').addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeModal(); });
  $('#mPrev').addEventListener('click', function () { stepModal(-1); });
  $('#mNext').addEventListener('click', function () { stepModal(1); });
  $('#mFav').addEventListener('click', function () { toggleFav(modalId); });
  $('#mTest').addEventListener('click', function () {
    var id = modalId; closeModal();
    setTimeout(function () { $('#tdCar').value = id; $('#contato').scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' }); }, MOTION ? 320 : 0);
  });

  /* ---------- teclado global ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (modalId != null) closeModal();
      else if (!$('#panel').hidden) closePanel();
      else if ($('#nav').classList.contains('open')) toggleMenu(false);
    }
    if (modalId != null) {
      if (e.key === 'ArrowLeft') stepModal(-1);
      if (e.key === 'ArrowRight') stepModal(1);
      if (e.key === 'Tab') {
        var f = $$('button, a[href], input, select', $('.modal-card')).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  });

  /* ---------- hero ---------- */
  var hero = { list: [], i: 0, tween: null, layer: null, mark: null };
  function heroList() {
    var f = avail().filter(function (c) { return c.destaque; });
    if (f.length < 3) f = f.concat(avail().filter(function (c) { return !c.destaque; }).sort(function (a, b) { return b.preco - a.preco; }).slice(0, 3 - f.length));
    return f.slice(0, 5);
  }
  function heroCar(c) {
    var d = document.createElement('div');
    d.className = 'stage-car';
    d.innerHTML = CarArt.svg(c);
    return d;
  }
  function setHeroText(c) {
    $('#hcName').textContent = nome(c) + ' ' + c.ano;
    $('#hcMeta').textContent = brl(c.preco) + ' · ' + km(c.km);
  }
  function buildHero(first) {
    hero.list = heroList();
    var stage = $('#heroStage');
    if (!hero.layer || !stage.contains(hero.layer)) {
      stage.innerHTML = '<div class="mark"></div><div class="stage-layer" style="position:absolute;inset:0"></div>';
      hero.mark = $('.mark', stage); hero.layer = $('.stage-layer', stage);
    }
    $('#heroTabs').innerHTML = hero.list.map(function (c, k) { return '<button class="hero-tab" role="tab" type="button" aria-label="' + esc(nome(c)) + '" aria-selected="false" data-k="' + k + '"><i></i></button>'; }).join('');
    if (hero.tween) hero.tween.kill();
    hero.i = -1;
    showHero(0, first);
  }
  function showHero(k, instant) {
    if (!hero.list.length) return;
    var c = hero.list[k], old = $('.stage-car', hero.layer), dir = k >= hero.i ? 1 : -1;
    $$('.hero-tab').forEach(function (t, n) { t.setAttribute('aria-selected', String(n === k)); var bar = $('i', t); if (HAS_GSAP) gsap.set(bar, { clearProps: 'transform' }); });
    hero.i = k;
    setHeroText(c);
    var mk = window.BRAND_PATHS[c.marca];
    hero.mark.innerHTML = mk ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + mk + '"/></svg>' : '';
    var el = heroCar(c);
    hero.layer.appendChild(el);
    if (MOTION && !instant) {
      el.classList.add('rolling');
      gsap.fromTo(el, { xPercent: 16 * dir, opacity: 0 }, { xPercent: 0, opacity: 1, duration: .9, ease: 'power4.out' });
      if (old) gsap.to(old, { xPercent: -16 * dir, opacity: 0, duration: .6, ease: 'power3.in', onComplete: function () { old.remove(); } });
      gsap.fromTo(hero.mark, { opacity: 0 }, { opacity: 1, duration: .8 });
    } else if (old) old.remove();
    if (MOTION) {
      var bar = $('.hero-tab[aria-selected="true"] i');
      hero.tween = gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 5.5, ease: 'none', onComplete: function () { showHero((hero.i + 1) % hero.list.length); } });
    }
  }
  function bindHero() {
    $('#heroTabs').addEventListener('click', function (e) {
      var t = e.target.closest('.hero-tab'); if (!t) return;
      if (hero.tween) hero.tween.kill();
      showHero(+t.dataset.k);
    });
    $('#hcOpen').addEventListener('click', function () { openModal(hero.list[hero.i].id); });
    var wrap = $('.hero-stage-wrap');
    wrap.addEventListener('pointerenter', function () { if (hero.tween) hero.tween.pause(); });
    wrap.addEventListener('pointerleave', function () { if (hero.tween) hero.tween.resume(); });
    document.addEventListener('visibilitychange', function () { if (!hero.tween) return; document.hidden ? hero.tween.pause() : hero.tween.resume(); });
    if (MOTION && window.matchMedia('(pointer: fine)').matches) {
      var stage = $('#heroStage'), lx, ly, mx, my;
      stage.addEventListener('pointermove', function (e) {
        if (!hero.layer) return;
        if (!lx) { lx = gsap.quickTo(hero.layer, 'x', { duration: .8, ease: 'power3' }); ly = gsap.quickTo(hero.layer, 'y', { duration: .8, ease: 'power3' }); mx = gsap.quickTo(hero.mark, 'x', { duration: 1.2, ease: 'power3' }); my = gsap.quickTo(hero.mark, 'y', { duration: 1.2, ease: 'power3' }); }
        var r = stage.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        lx(px * 22); ly(py * 12); mx(px * -34); my(py * -18);
      });
      stage.addEventListener('pointerleave', function () { if (lx) { lx(0); ly(0); mx(0); my(0); } });
    }
  }

  /* ---------- historia pinada ---------- */
  function renderStoryCar() {
    var accent = loja.cor || DEFAULT_ACCENT;
    $('#storyCar').innerHTML = CarArt.svg({ marca: 'SUV', modelo: 'ilustração', carroceria: 'SUV', cor: { nome: 'cor da marca', hex: accent } });
  }
  var storyMM = null;
  function initStory() {
    if (!MOTION) return;
    storyMM = gsap.matchMedia();
    var items = $$('.story-item'), car = $('#storyCar');
    storyMM.add('(min-width: 900px)', function () {
      function wheels(p) { $$('.wheel-spin', car).forEach(function (w) { w.style.transform = 'rotate(' + (p * 2400) + 'deg)'; }); }
      var tl = gsap.timeline({
        scrollTrigger: { trigger: '#porque', start: 'top top', end: '+=1500', pin: true, scrub: .5, anticipatePin: 1 },
        onUpdate: function () {
          wheels(tl.progress());
          var c = car.getBoundingClientRect(), cx = c.left + c.width * .5;
          items.forEach(function (it) { var r = it.getBoundingClientRect(); it.classList.toggle('on', cx > r.left + r.width * .35); });
        }
      });
      tl.fromTo(car, { x: function () { return -car.offsetWidth; } }, { x: function () { return window.innerWidth - car.offsetWidth * .1; }, ease: 'none' });
      return function () { items.forEach(function (it) { it.classList.remove('on'); }); gsap.set(car, { clearProps: 'transform' }); };
    });
    storyMM.add('(max-width: 899px)', function () {
      gsap.fromTo(car, { x: function () { return -car.offsetWidth; } }, { x: function () { return window.innerWidth; }, ease: 'none', scrollTrigger: { trigger: '.story-road', start: 'top 92%', end: 'bottom 8%', scrub: .5 } });
    });
  }

  /* ---------- simulador ---------- */
  var PRAZOS = [12, 24, 36, 48, 60];
  function buildSim() {
    var sel = $('#sCar'), list = avail();
    if (!list.length) return;
    if (!sim.id || !list.some(function (c) { return c.id === sim.id; })) sim.id = list[Math.min(2, list.length - 1)].id;
    sel.innerHTML = list.map(function (c) { return '<option value="' + c.id + '">' + esc(nome(c) + ' ' + c.ano + ' (' + brl(c.preco) + ')') + '</option>'; }).join('');
    sel.value = sim.id;
    $('#sPrazo').innerHTML = PRAZOS.map(function (n) { return '<button class="chip" type="button" data-n="' + n + '" aria-pressed="' + (n === sim.prazo) + '">' + n + 'x</button>'; }).join('');
    updateSim(true);
  }
  var simShown = { v: 0 };
  function updateSim(instant) {
    var c = byId(sim.id); if (!c) return;
    var ent = sim.ent / 100, entV = c.preco * ent, fin = c.preco - entV, p = pmt(c.preco, ent, sim.prazo);
    $('#sEntOut').textContent = sim.ent + '% (' + brl(entV) + ')';
    rangeFill($('#sEnt'));
    $('#sPreco').textContent = brl(c.preco);
    $('#sEntrada').textContent = brl(entV);
    $('#sFin').textContent = brl(fin);
    var out = $('#sParcela');
    if (MOTION && !instant) gsap.to(simShown, { v: p, duration: .6, ease: 'power3.out', onUpdate: function () { out.textContent = nf.format(Math.round(simShown.v)); } });
    else { simShown.v = p; out.textContent = nf.format(Math.round(p)); }
    $$('#sPrazo .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.n === sim.prazo)); });
    setWa($('#sSend'), 'Olá! Simulei o financiamento do ' + nome(c) + ' ' + c.ano + ' (' + brl(c.preco) + ') com entrada de ' + brl(entV) + ' em ' + sim.prazo + 'x. A parcela ficou em torno de ' + brl(p) + '. Podem confirmar as condições?');
  }
  function bindSim() {
    $('#sCar').addEventListener('change', function (e) { sim.id = e.target.value; updateSim(); });
    $('#sEnt').addEventListener('input', function (e) { sim.ent = +e.target.value; updateSim(); });
    $('#sPrazo').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; sim.prazo = +b.dataset.n; updateSim(); });
  }

  /* ---------- formularios ---------- */
  function fieldErr(input, msg) {
    var f = input.closest('.field'), e = $('.field-err', f);
    f.classList.toggle('invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (e) { e.hidden = !msg; e.textContent = msg || ''; }
  }
  function validate(form, rules) {
    var ok = true, firstBad = null;
    Object.keys(rules).forEach(function (n) {
      var inp = form.elements[n], msg = rules[n](inp.value.trim());
      fieldErr(inp, msg);
      if (msg) { ok = false; if (!firstBad) firstBad = inp; }
    });
    if (firstBad) firstBad.focus();
    return ok;
  }
  function req(label) { return function (v) { return v ? '' : 'Informe ' + label + '.'; }; }

  function bindForms() {
    var sf = $('#sellForm'), yr = new Date().getFullYear();
    $$('input', sf).forEach(function (i) { i.addEventListener('input', function () { if (i.closest('.invalid')) fieldErr(i, ''); }); });
    sf.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = validate(sf, {
        marca: req('a marca'), modelo: req('o modelo'),
        ano: function (v) { return /^\d{4}$/.test(v) && +v >= 1990 && +v <= yr + 1 ? '' : 'Ano com 4 dígitos.'; },
        km: function (v) { return /^\d[\d.]*$/.test(v) ? '' : 'Só números.'; },
        nome: req('seu nome')
      });
      if (!ok) return;
      var f = sf.elements;
      setWa($('#sellWa'), 'Olá! Quero avaliar meu carro: ' + f.marca.value.trim() + ' ' + f.modelo.value.trim() + ', ano ' + f.ano.value.trim() + ', ' + f.km.value.trim() + ' km. Meu nome é ' + f.nome.value.trim() + '.');
      sf.hidden = true; $('#sellOk').hidden = false;
      if (MOTION) gsap.from($('#sellOk'), { opacity: 0, y: 16, duration: .6, ease: 'power3.out' });
    });
    $('#sellAgain').addEventListener('click', function () { sf.reset(); sf.hidden = false; $('#sellOk').hidden = true; sf.elements.marca.focus(); });

    var tf = $('#tdForm');
    tf.elements.nome.addEventListener('input', function () { fieldErr(tf.elements.nome, ''); });
    tf.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(tf, { nome: req('seu nome') })) return;
      var c = byId(tf.elements.carro.value), dia = $('#tdDia').selectedOptions[0].textContent, hora = tf.elements.hora.value;
      var msg = 'Olá! Gostaria de agendar um test-drive do ' + nome(c) + ' ' + c.versao + ' (' + c.ano + ') em ' + dia + ', às ' + fmtH(hora) + '. Meu nome é ' + tf.elements.nome.value.trim() + '.';
      var url = 'https://wa.me/' + waNum() + '?text=' + encodeURIComponent(msg);
      var ok = $('#tdOk');
      ok.hidden = false;
      ok.innerHTML = 'Pedido pronto para ' + esc(dia) + ' às ' + fmtH(hora) + '. <a class="link-btn" target="_blank" rel="noopener" href="' + url + '">Confirmar pelo WhatsApp</a>';
      toast('Test-drive reservado. Falta confirmar no WhatsApp.');
    });
  }

  /* dias e horarios do test-drive */
  function buildTestDrive() {
    var list = avail(), sel = $('#tdCar'), cur = sel.value;
    sel.innerHTML = list.map(function (c) { return '<option value="' + c.id + '">' + esc(nome(c) + ' ' + c.ano) + '</option>'; }).join('');
    if (cur && list.some(function (c) { return c.id === cur; })) sel.value = cur;
    if ($('#tdDia').options.length) return;
    var days = [], d = new Date(), names = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    function hoursFor(day) { return loja.horarios.filter(function (h) { return h.dias.indexOf(day) > -1; })[0]; }
    for (var i = 0; days.length < 7 && i < 20; i++) {
      var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i), h = hoursFor(x.getDay());
      if (!h || !h.abre) continue;
      if (i === 0 && (d.getHours() * 60 + d.getMinutes()) > (+h.fecha.split(':')[0] - 1) * 60) continue;
      days.push({ date: x, h: h, label: (i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : names[x.getDay()]) + ', ' + pad(x.getDate()) + '/' + pad(x.getMonth() + 1) });
    }
    $('#tdDia').innerHTML = days.map(function (o, k) { return '<option value="' + k + '">' + o.label + '</option>'; }).join('');
    function hours() {
      var o = days[+$('#tdDia').value], out = [], s = +o.h.abre.split(':')[0], e = +o.h.fecha.split(':')[0];
      for (var h = s; h < e; h++) out.push(pad(h) + ':00');
      $('#tdHora').innerHTML = out.map(function (v) { return '<option value="' + v + '">' + fmtH(v) + '</option>'; }).join('');
    }
    $('#tdDia').addEventListener('change', hours);
    hours();
  }

  /* ---------- depoimentos ---------- */
  function bindCarousel() {
    var tr = $('#depTrack');
    function step(dir) { var q = $('.quote', tr); tr.scrollBy({ left: dir * (q.offsetWidth + 16), behavior: REDUCE ? 'auto' : 'smooth' }); }
    $('#depPrev').addEventListener('click', function () { step(-1); });
    $('#depNext').addEventListener('click', function () { step(1); });
    var down = false, sx = 0, sl = 0, moved = false;
    tr.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = tr.scrollLeft; });
    window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; tr.classList.add('drag'); } tr.scrollLeft = sl - dx; });
    window.addEventListener('pointerup', function () { if (!down) return; down = false; tr.classList.remove('drag'); });
  }

  /* ---------- menu mobile ---------- */
  function toggleMenu(force) {
    var nav = $('#nav'), open = typeof force === 'boolean' ? force : !nav.classList.contains('open');
    nav.classList.toggle('open', open);
    $('#menuBtn').setAttribute('aria-expanded', String(open));
  }
  $('#menuBtn').addEventListener('click', function () { toggleMenu(); });
  $$('.nav-links a').forEach(function (a) { a.addEventListener('click', function () { toggleMenu(false); }); });

  /* ---------- painel do lojista ---------- */
  var SWATCHES = [['#f2622d', 'Laranja'], ['#3b82f6', 'Azul'], ['#1fa971', 'Verde'], ['#e5484d', 'Vermelho'], ['#e3a21a', 'Âmbar'], ['#d9dce0', 'Prata']];
  function openPanel() {
    var p = $('#panel');
    p.hidden = false;
    $('#dockBtn').setAttribute('aria-expanded', 'true');
    renderAdmin();
    if (MOTION) gsap.fromTo($('.panel-card', p), { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: .5, ease: 'power4.out' });
  }
  function closePanel() {
    var p = $('#panel');
    function done() { p.hidden = true; $('#dockBtn').setAttribute('aria-expanded', 'false'); }
    if (MOTION) gsap.to($('.panel-card', p), { x: 30, opacity: 0, duration: .25, ease: 'power2.in', onComplete: done }); else done();
  }
  $('#dockBtn').addEventListener('click', function () { $('#panel').hidden ? openPanel() : closePanel(); });
  $('#panel').addEventListener('click', function (e) { if (e.target.closest('[data-pclose]')) closePanel(); });
  $$('.tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.tabs button').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      $$('.tab-pane').forEach(function (p) { p.hidden = p.dataset.pane !== b.dataset.tab; });
    });
  });

  function renderAdmin() {
    $('#admList').innerHTML = cars.map(function (c) {
      return '<li class="adm-item' + (c.vendido ? ' sold' : '') + '" data-id="' + c.id + '">' +
        '<div><b>' + esc(nome(c)) + '</b><small>' + esc(c.versao) + ', ' + c.ano + '</small></div>' +
        '<button class="switch" type="button" aria-pressed="' + !!c.vendido + '"><i></i>Vendido</button>' +
        '<label class="adm-price">R$ <input type="number" min="0" step="500" value="' + c.preco + '" aria-label="Preço de ' + esc(nome(c)) + '"></label>' +
        '</li>';
    }).join('');
  }
  $('#admList').addEventListener('click', function (e) {
    var sw = e.target.closest('.switch'); if (!sw) return;
    var li = sw.closest('.adm-item'), c = byId(li.dataset.id), now = !c.vendido;
    c.vendido = now; API.atualizar(c.id, { vendido: now });
    sw.setAttribute('aria-pressed', String(now)); li.classList.toggle('sold', now);
    onStockChanged();
    toast(now ? nome(c) + ' saiu do site' : nome(c) + ' voltou ao estoque');
  });
  var pt;
  $('#admList').addEventListener('input', function (e) {
    if (e.target.type !== 'number') return;
    var li = e.target.closest('.adm-item'), c = byId(li.dataset.id), v = +e.target.value;
    clearTimeout(pt);
    pt = setTimeout(function () {
      if (!(v > 0)) return;
      c.preco = v; API.atualizar(c.id, { preco: v });
      updateCardPrice(c); onStockChanged(true);
    }, 300);
  });
  $('#admReset').addEventListener('click', function () {
    API.resetarEstoque();
    API.listar().then(function (l) { cars = l; renderAdmin(); cars.forEach(updateCardPrice); onStockChanged(); toast('Estoque original restaurado'); });
  });

  function onStockChanged(priceOnly) {
    var feat = hero.list[hero.i];
    applyFilters(true);
    populateFilters();
    applyFilters(false);
    buildSim(); buildTestDrive(); syncFavs();
    if (!priceOnly || !feat || byId(feat.id).vendido) { if (hero.tween) hero.tween.kill(); buildHero(true); if (MOTION) hero.tween && hero.tween.restart(); }
    else setHeroText(feat);
    if (HAS_GSAP) ScrollTrigger.refresh();
  }

  /* marca */
  function bindBrandForm() {
    var form = $('#brandForm'), t;
    function fillForm() { form.elements.nome.value = loja.nome; form.elements.cidade.value = loja.cidade; form.elements.whatsapp.value = loja.whatsapp; }
    fillForm();
    $('#swatches').innerHTML = SWATCHES.map(function (s) { return '<button class="swatch" type="button" role="radio" aria-checked="false" aria-label="' + s[1] + '" title="' + s[1] + '" data-c="' + s[0] + '" style="--c:' + s[0] + '"></button>'; }).join('');
    form.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var p = {}; ['nome', 'cidade', 'whatsapp'].forEach(function (k) { var v = form.elements[k].value.trim(); if (v) p[k] = v; });
        API.salvarLoja(p); applyBrand();
      }, 250);
    });
    $('#swatches').addEventListener('click', function (e) { var b = e.target.closest('.swatch'); if (!b) return; API.salvarLoja({ cor: b.dataset.c }); applyBrand(); });
    $('#brandReset').addEventListener('click', function () { API.resetarLoja(); applyBrand(); fillForm(); toast('Identidade padrão restaurada'); });
    $('#syncBtn').addEventListener('click', function () {
      var b = this; if (b.classList.contains('loading')) return;
      b.classList.add('loading'); b.disabled = true;
      API.sincronizar().then(function (d) {
        b.classList.remove('loading'); b.disabled = false;
        $('#syncInfo').textContent = 'Última sincronização: hoje às ' + pad(d.getHours()) + 'h' + pad(d.getMinutes()) + '.';
        toast('Estoque sincronizado: ' + avail().length + ' veículos no ar');
      });
    });
    fillForm.call(null);
  }

  /* ---------- animacoes de pagina ---------- */
  function initMotion() {
    if (!MOTION) return;
    var nav = $('#nav');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (s) {
        nav.classList.toggle('scrolled', s.scroll() > 24);
        nav.classList.toggle('hide', s.direction === 1 && s.scroll() > 520 && !nav.classList.contains('open'));
      }
    });

    /* intro do hero */
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to('.display .line > span', { y: 0, yPercent: 0, duration: 1.1, stagger: .12 }, .1)
      .to('.reveal-hero', { opacity: 1, y: 0, duration: .9, stagger: .1 }, .45)
      .from('.hero-stage', { opacity: 0, y: 40, scale: .97, duration: 1.2 }, .25)
      .from('.hero-caption, .hero-tabs', { opacity: 0, y: 14, duration: .8, stagger: .08 }, .9);

    /* revelacao ao rolar */
    var targets = ['.sec-head > *', '.filters', '.fin-copy > *', '.sim', '.sell', '.bento-cell', '.dep-head', '.quote', '.contact-info > *', '.map', '.brands .wrap > *', '.footer-in > *'];
    targets.forEach(function (s) { $$(s).forEach(function (el) { el.classList.add('rv'); }); });
    ScrollTrigger.batch('.rv', {
      start: 'top 90%', once: true,
      onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .08 }); }
    });

    /* contadores */
    $$('.count').forEach(function (el) {
      var to = +el.dataset.to, suf = el.dataset.suffix || '', o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: function () { gsap.to(o, { v: to, duration: 2, ease: 'power3.out', onUpdate: function () { el.textContent = nf.format(Math.round(o.v)) + suf; } }); }
      });
    });

    /* link ativo no menu */
    ['estoque', 'financiamento', 'vender', 'loja', 'contato'].forEach(function (id) {
      var link = $('.nav-links a[href="#' + id + '"]');
      ScrollTrigger.create({ trigger: '#' + id, start: 'top 45%', end: 'bottom 45%', onToggle: function (s) { if (link) link.classList.toggle('on', s.isActive); } });
    });

    /* botoes magneticos (so em ponteiro fino) */
    if (window.matchMedia('(pointer: fine)').matches) {
      $$('.hero-cta .btn, .nav-cta').forEach(function (b) {
        var qx = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3' }), qy = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3' });
        b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * .22); qy((e.clientY - r.top - r.height / 2) * .3); });
        b.addEventListener('pointerleave', function () { qx(0); qy(0); });
      });
    }
  }

  /* ---------- inicializacao ---------- */
  function applyUrlParams() {
    var p = new URLSearchParams(location.search), patch = {};
    if (p.get('loja')) patch.nome = p.get('loja');
    if (p.get('cidade')) patch.cidade = p.get('cidade');
    if (p.get('whats')) patch.whatsapp = p.get('whats');
    if (/^[0-9a-f]{6}$/i.test(p.get('cor') || '')) patch.cor = '#' + p.get('cor');
    if (Object.keys(patch).length) API.salvarLoja(patch);
  }

  function boot() {
    applyUrlParams();
    applyBrand();
    bindFilters(); bindSim(); bindForms(); bindCarousel(); bindBrandForm();
    showSkeleton();
    initMotion();
    initStory();

    API.listar().then(function (list) {
      cars = list;
      buildCards();
      populateFilters();
      applyFilters(false);
      buildSim(); buildTestDrive(); syncFavs();
      bindHero(); buildHero(true);
      var showcase = avail().filter(function (c) { return c.marca === 'BMW'; })[0] || avail()[0];
      if (showcase) CarArt.mount($('#bentoArt'), showcase);
      if (HAS_GSAP) { ScrollTrigger.refresh(); }
      if (MOTION) hero.tween && hero.tween.restart();
      var h = location.hash.slice(1);
      if (h && byId(h)) openModal(h);
    });

    if (document.fonts && document.fonts.ready && HAS_GSAP) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    setInterval(renderOpen, 60000);
  }
  boot();
})();
