/* Preguinho Veiculos - comportamento do site (paginas separadas por rota de hash) */
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
  var nf2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var DEFAULT_ACCENT = '#fba500';
  function brl(n) { return 'R$ ' + nf.format(Math.round(n)); }
  function km(n) { return nf.format(n) + ' km'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtH(h) { return h.replace(':', 'h'); }
  function nome(c) { return c.marca + ' ' + c.modelo; }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* modo privado */ } }
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
    var L = lum(hex), d = lum('#17120a'), w = lum('#fbfbfa');
    return (L + .05) / (d + .05) >= (w + .05) / (L + .05) ? '#17120a' : '#fbfbfa';
  }

  /* ---------- estado ---------- */
  var loja = API.loja();
  var cars = [];
  var cardMap = {};
  var favs = (function () { try { return JSON.parse(load('gv-favs')) || []; } catch (e) { return []; } })();
  var F = { q: '', carroceria: '', marca: '', comb: '', cambio: '', preco: Infinity, ordem: 'destaque', fav: false };
  var visible = [];
  var sim = { id: null, ent: 30, prazo: 48 };
  var current = { name: '', id: '' };

  function avail() { return cars.filter(function (c) { return !c.vendido; }); }
  function byId(id) { return cars.filter(function (c) { return c.id === id; })[0]; }
  function pmt(price, ent, n) {
    var i = (loja.jurosMensal || 1.89) / 100, P = price * (1 - ent);
    return P * i / (1 - Math.pow(1 + i, -n));
  }
  function pageEl(n) { return $('.page[data-page="' + n + '"]'); }
  function onPage(n) { var p = pageEl(n); return p && !p.hidden; }

  /* ---------- identidade da loja ---------- */
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
    $$('[data-bind]').forEach(function (el) { var k = el.dataset.bind; el.textContent = loja[k] != null ? loja[k] : ''; });
    $$('[data-bind-href]').forEach(function (el) { el.href = 'tel:+55' + String(loja.telefone).replace(/\D/g, ''); });
    $$('[data-bind-mail]').forEach(function (el) { el.href = 'mailto:' + loja.email; });
    $$('[data-juros]').forEach(function (el) { el.textContent = String(loja.jurosMensal).replace('.', ','); });
    $$('.wm').forEach(function (el) { el.textContent = loja.nome; });
    refreshTitle();
    $$('[data-wa]').forEach(function (el) { setWa(el); });
    var m = loja.mapa, bb = [m.lon - .006, m.lat - .0034, m.lon + .006, m.lat + .0034].join(',');
    var frame = $('#mapFrame');
    var src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + bb + '&layer=mapnik&marker=' + m.lat + ',' + m.lon;
    if (frame && frame.getAttribute('src') !== src) frame.setAttribute('src', src);
    $('#mapLink').href = 'https://www.openstreetmap.org/?mlat=' + m.lat + '&mlon=' + m.lon + '#map=17/' + m.lat + '/' + m.lon;
    $('#horarios').innerHTML = loja.horarios.map(function (h) {
      return '<div class="hours-line"><span>' + h.rotulo + '</span><span>' + h.texto + '</span></div>';
    }).join('');
    renderOpen();
    var sf = $('#sFine');
    if (sf) sf.textContent = 'Simulação ilustrativa com taxa de ' + String(loja.jurosMensal).replace('.', ',') + '% ao mês. Valores sujeitos à análise de crédito.';
    var sw = $('#swatches');
    if (sw) $$('.swatch', sw).forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.c.toLowerCase() === accent.toLowerCase())); });
    if (cars.length) { updateSim(true); if (current.name === 'veiculo') renderVehicleWa(); }
  }

  var TITLES = { estoque: 'Estoque', financiamento: 'Financiamento', venda: 'Venda seu carro', sobre: 'Sobre nós', contato: 'Venha fazer seu test drive' };
  function refreshTitle() {
    var t = current.name === 'veiculo' && byId(current.id) ? nome(byId(current.id)) : TITLES[current.name];
    document.title = t ? t + ' | ' + loja.nome : loja.nome + ' - ' + loja.slogan;
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
    if (mt) mt.content = t === 'dark' ? '#18191b' : '#5f6062';
  }
  $('#themeBtn').addEventListener('click', function () { setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'); });

  /* ---------- favoritos ---------- */
  function isFav(id) { return favs.indexOf(id) > -1; }
  function toggleFav(id) {
    var i = favs.indexOf(id);
    if (i > -1) favs.splice(i, 1); else favs.push(id);
    save('gv-favs', JSON.stringify(favs));
    syncFavs();
    if (F.fav) applyFilters(onPage('estoque'));
  }
  function setHeart(btn, on) {
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(on));
    var u = $('use', btn);
    if (u) u.setAttribute('href', on ? '#i-heart-fill' : '#i-heart');
  }
  function syncFavs() {
    var n = favs.filter(function (id) { var c = byId(id); return c && !c.vendido; }).length;
    var b = $('#favCount');
    b.hidden = n === 0; b.textContent = n;
    $$('.card').forEach(function (el) { setHeart($('.card-fav', el), isFav(el.dataset.id)); });
    if (current.name === 'veiculo') setHeart($('#vFav'), isFav(current.id));
    setHeart($('#favBtn'), F.fav);
  }
  $('#favBtn').addEventListener('click', function () {
    if (!F.fav && !favs.length) { toast('Toque no coração de um carro para salvá-lo aqui.'); return; }
    F.fav = !F.fav;
    applyFilters(false);
    syncFavs();
    go('estoque');
  });

  /* ---------- cards ---------- */
  var cardIO = null;
  function observeCard(el) {
    if (!MOTION || !('IntersectionObserver' in window)) return;
    root.classList.add('cards-io');
    if (!cardIO) cardIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); cardIO.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    cardIO.observe(el);
  }
  function cardHTML(c) {
    var selo = c.selo ? '<span class="selo"><svg class="ic"><use href="' + (c.selo === 'Blindado' ? '#i-shield' : '#i-seal') + '"/></svg>' + esc(c.selo) + '</span>' : '';
    return '<div class="card-img"><div class="art" role="presentation"></div><span class="wm"></span>' + selo +
      '<button class="card-fav icon-btn" type="button" aria-label="Favoritar ' + esc(nome(c)) + '" aria-pressed="false"><svg class="ic"><use href="#i-heart"/></svg></button></div>' +
      '<div class="card-body">' +
        '<div class="c-brand">' + esc(c.marca) + '</div><div class="c-model">' + esc(c.modelo) + '</div><div class="c-ver">' + esc(c.versao) + '</div>' +
        '<div class="c-meta"><span>' + km(c.km) + '</span><span>' + c.ano + '/' + c.anoModelo + '</span></div>' +
        '<div class="c-price"><small>R$</small><span class="p-val"></span></div><div class="c-sub p-sub"></div>' +
      '</div>' +
      '<button class="card-hit" type="button" aria-label="Ver detalhes do ' + esc(nome(c) + ' ' + c.versao) + '"></button>';
  }
  function updateCardEl(el, c) {
    $('.p-val', el).textContent = nf2.format(c.preco);
    $('.p-sub', el).textContent = 'ou ' + brl(pmt(c.preco, .3, 48)) + '/mês em 48x';
  }
  function updateCardPrices(c) { $$('.card[data-id="' + c.id + '"]').forEach(function (el) { updateCardEl(el, c); }); }
  function makeCard(c) {
    var el = document.createElement('article');
    el.className = 'card'; el.dataset.id = c.id;
    el.innerHTML = cardHTML(c);
    $('.wm', el).textContent = loja.nome;
    Photos.mount($('.art', el), c, { w: 700 });
    updateCardEl(el, c);
    setHeart($('.card-fav', el), isFav(c.id));
    observeCard(el);
    return el;
  }

  function go(path) {
    var h = '#/' + path;
    if (location.hash === h) route(); else location.hash = h;
  }
  document.addEventListener('click', function (e) {
    var card = e.target.closest && e.target.closest('.card');
    if (!card) return;
    if (e.target.closest('.card-fav')) { toggleFav(card.dataset.id); return; }
    if (e.target.closest('.card-hit')) go('veiculo/' + card.dataset.id);
  });

  /* spotlight do mouse nos cards */
  document.addEventListener('pointermove', function (e) {
    var card = e.target.closest && e.target.closest('.card');
    if (!card) return;
    var r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  /* ---------- pagina de estoque ---------- */
  function buildCards() {
    var grid = $('#grid');
    grid.innerHTML = '';
    cardMap = {};
    cars.forEach(function (c) { var el = makeCard(c); cardMap[c.id] = el; grid.appendChild(el); });
    grid.setAttribute('aria-busy', 'false');
  }

  function rangeFill(inp) {
    var p = (inp.value - inp.min) / (inp.max - inp.min) * 100;
    inp.style.setProperty('--fill', p + '%');
  }

  function populateFilters() {
    function uniq(k) { var o = {}; cars.forEach(function (c) { o[c[k]] = 1; }); return Object.keys(o).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); }); }
    var ph = { fMarca: 'Marca', fCarroceria: 'Carroceria' };
    function fill(sel, vals) {
      var cur = sel.value;
      sel.innerHTML = '<option value="">' + (ph[sel.id] || 'Todos') + '</option>' + vals.map(function (v) { return '<option>' + esc(v) + '</option>'; }).join('');
      sel.value = vals.indexOf(cur) > -1 ? cur : '';
    }
    fill($('#fMarca'), uniq('marca'));
    fill($('#fCarroceria'), uniq('carroceria'));
    fill($('#fComb'), uniq('combustivel'));
    fill($('#fCambio'), uniq('cambio'));

    var prices = cars.map(function (c) { return c.preco; });
    var max = Math.ceil(Math.max.apply(null, prices) / 5000) * 5000, min = Math.floor(Math.min.apply(null, prices) / 5000) * 5000;
    var fp = $('#fPreco');
    fp.min = min; fp.max = max;
    if (!isFinite(F.preco) || F.preco > max) { fp.value = max; F.preco = Infinity; }
    updatePrecoOut();

    var bm = {};
    avail().forEach(function (c) { bm[c.marca] = (bm[c.marca] || 0) + 1; });
    $('#brandsRow').innerHTML = Object.keys(window.BRAND_PATHS).filter(function (b) { return bm[b]; }).map(function (b) {
      return '<button class="brand-btn" type="button" data-b="' + b + '" aria-pressed="' + (F.marca === b) + '" aria-label="Ver ' + b + ' no estoque (' + bm[b] + ')" title="' + b + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + window.BRAND_PATHS[b] + '"/></svg></button>';
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
      if (q && (c.marca + ' ' + c.modelo + ' ' + c.versao + ' ' + c.ano).toLowerCase().indexOf(q) < 0) return false;
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
    var state = animate && MOTION && els.length ? Flip.getState(els) : null;
    var ids = {};
    list.forEach(function (c) { ids[c.id] = 1; });
    cars.forEach(function (c) { var el = cardMap[c.id]; if (el) el.hidden = !ids[c.id]; });
    list.forEach(function (c) { grid.appendChild(cardMap[c.id]); });

    if (state) {
      els.forEach(function (el) { el.classList.add('flipping'); });
      Flip.from(state, {
        duration: .75, ease: 'power3.inOut', absolute: true, stagger: .015,
        onEnter: function (e) { return gsap.fromTo(e, { opacity: 0, scale: .92 }, { opacity: 1, scale: 1, duration: .6, delay: .2, ease: 'power3.out', clearProps: 'opacity,scale' }); },
        onLeave: function (e) { return gsap.to(e, { opacity: 0, scale: .92, duration: .3, ease: 'power2.in' }); },
        onComplete: function () { els.forEach(function (el) { el.classList.remove('flipping'); }); }
      });
    }

    var dirty = F.q || F.carroceria || F.marca || F.comb || F.cambio || F.fav || isFinite(F.preco) || F.ordem !== 'destaque';
    $('#fClear').hidden = !dirty;
    $('#empty').hidden = list.length > 0;
    grid.hidden = list.length === 0;
    var total = avail().length;
    $('#resultCount').innerHTML = '<b>' + list.length + '</b> ' + (list.length === 1 ? 'carro encontrado' : 'carros encontrados') + (list.length !== total ? ' de ' + total : '');
    $$('.brand-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.b === F.marca)); });
    $('#fMarca').value = F.marca;
    $('#fCarroceria').value = F.carroceria;
  }

  function resetFilters() {
    F = { q: '', carroceria: '', marca: '', comb: '', cambio: '', preco: Infinity, ordem: 'destaque', fav: false };
    $('#fBusca').value = ''; $('#fMarca').value = ''; $('#fCarroceria').value = ''; $('#fComb').value = ''; $('#fCambio').value = ''; $('#fOrdem').value = 'destaque';
    $('#fPreco').value = $('#fPreco').max; updatePrecoOut();
    applyFilters(true); syncFavs();
  }

  function bindFilters() {
    var t;
    $('#fBusca').addEventListener('input', function (e) { clearTimeout(t); var v = e.target.value; t = setTimeout(function () { F.q = v; applyFilters(true); }, 180); });
    $('#fMarca').addEventListener('change', function (e) { F.marca = e.target.value; applyFilters(true); });
    $('#fCarroceria').addEventListener('change', function (e) { F.carroceria = e.target.value; applyFilters(true); });
    $('#fComb').addEventListener('change', function (e) { F.comb = e.target.value; applyFilters(true); });
    $('#fCambio').addEventListener('change', function (e) { F.cambio = e.target.value; applyFilters(true); });
    $('#fOrdem').addEventListener('change', function (e) { F.ordem = e.target.value; applyFilters(true); });
    $('#fPreco').addEventListener('input', function (e) {
      updatePrecoOut();
      F.preco = +e.target.value >= +e.target.max ? Infinity : +e.target.value;
    });
    $('#fPreco').addEventListener('change', function () { applyFilters(true); });
    $('#advBtn').addEventListener('click', function () {
      var box = $('#advBox'), open = box.hidden;
      box.hidden = !open;
      this.setAttribute('aria-expanded', String(open));
      if (open && MOTION) gsap.from(box, { opacity: 0, y: -10, duration: .5, ease: 'power3.out' });
    });
    $('#brandsRow').addEventListener('click', function (e) {
      var b = e.target.closest('.brand-btn'); if (!b) return;
      F.marca = F.marca === b.dataset.b ? '' : b.dataset.b;
      applyFilters(false);
      go('estoque');
    });
    $('#fClear').addEventListener('click', resetFilters);
    $('#emptyReset').addEventListener('click', resetFilters);
  }

  function showSkeleton() {
    var s = '';
    for (var i = 0; i < 8; i++) s += '<div class="skel" aria-hidden="true"><div class="skel-img"></div><div class="skel-line"></div><div class="skel-line"></div></div>';
    $('#grid').innerHTML = s;
    $('#grid').setAttribute('aria-busy', 'true');
  }

  /* ---------- pagina inicial ---------- */
  /* Modelos do hero: montados sozinhos a partir do estoque (um por modelo, so os que tem foto).
     Quem manda "destaque" no cadastro vem primeiro; sem isso, entram os mais novos. Nao ha valor aqui de proposito. */
  function heroList() {
    var seen = {}, out = [];
    var pool = avail().filter(function (c) { return c.fotos && c.fotos.length; }).sort(function (a, b) {
      return (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0) || b.anoModelo - a.anoModelo || a.km - b.km;
    });
    pool.forEach(function (c) { var k = c.marca + '|' + c.modelo; if (!seen[k] && out.length < 6) { seen[k] = 1; out.push(c); } });
    return out;
  }
  function renderHome() {
    var f = avail().filter(function (c) { return c.destaque; });
    if (f.length < 4) f = f.concat(avail().filter(function (c) { return !c.destaque; }));
    var g = $('#homeGrid');
    g.innerHTML = '';
    f.slice(0, 4).forEach(function (c) { g.appendChild(makeCard(c)); });
    Photos.mount($('#promiseImg'), { fotos: window.MIDIA.promessa, marca: 'Carro', modelo: 'revisado' }, { w: 1200 });
  }

  /* ---------- hero ---------- */
  var hero = { list: [], i: 0, tween: null, layer: null, intro: false };
  function heroSlide(c) {
    var d = document.createElement('div');
    d.className = 'stage-car';
    Photos.loadFirst(c.fotos, 1800, nome(c), true, function (img) {
      img.className = 'hero-photo';
      d.appendChild(img);
      if (MOTION) gsap.fromTo(img, { opacity: 0, scale: 1.07 }, { opacity: 1, scale: 1, duration: 1.8, ease: 'power2.out' });
      else img.style.opacity = 1;
    });
    return d;
  }
  function setHeroText(c) {
    $('#htA').textContent = c.marca;
    $('#htB').textContent = c.modelo;
    $('#htC').textContent = c.ano;
  }
  function buildHero() {
    hero.list = heroList();
    var stage = $('#heroStage');
    if (!hero.layer || !stage.contains(hero.layer)) { stage.innerHTML = '<div class="stage-layer"></div>'; hero.layer = $('.stage-layer', stage); }
    var strip = $('#heroTabs');
    strip.innerHTML = hero.list.map(function (c, k) {
      return '<button class="hs-item" role="tab" type="button" aria-selected="false" data-k="' + k + '" aria-label="' + esc(nome(c) + ' ' + c.ano) + '">' +
        '<span class="hs-img"></span><span class="hs-txt"><b>' + esc(c.modelo) + '</b><small>' + esc(c.marca + ' ' + c.ano) + '</small></span><span class="hs-bar"><i></i></span></button>';
    }).join('');
    $$('.hs-img', strip).forEach(function (box, k) {
      Photos.loadFirst(hero.list[k].fotos, 300, '', true, function (img) { img.className = ''; box.appendChild(img); });
    });
    if (hero.tween) hero.tween.kill();
    hero.i = -1;
    showHero(0, true);
  }
  function showHero(k, instant) {
    if (!hero.list.length) return;
    var c = hero.list[k], old = $('.stage-car', hero.layer);
    $$('.hs-item').forEach(function (t, n) { t.setAttribute('aria-selected', String(n === k)); if (HAS_GSAP) gsap.set($('i', t), { clearProps: 'transform' }); });
    hero.i = k;
    setHeroText(c);
    var el = heroSlide(c);
    hero.layer.appendChild(el);
    if (MOTION && !instant) {
      if (old) gsap.to(old, { opacity: 0, duration: 1, ease: 'power2.inOut', onComplete: function () { old.remove(); } });
      gsap.fromTo(['#htA', '#htB', '#htC', '.ht-foot'], { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .07, overwrite: true });
    } else if (old) old.remove();
    var sel = $('.hs-item[aria-selected="true"]');
    if (sel) sel.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (onPage('inicio')) startHeroTimer();
  }
  /* o tempo de cada slide aparece como barra de progresso embaixo do modelo ativo */
  function startHeroTimer() {
    if (!MOTION || !hero.list.length) return;
    if (hero.tween) hero.tween.kill();
    var bar = $('.hs-item[aria-selected="true"] i');
    hero.tween = bar
      ? gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 6.5, ease: 'none', onComplete: function () { showHero((hero.i + 1) % hero.list.length); } })
      : gsap.delayedCall(6.5, function () { showHero((hero.i + 1) % hero.list.length); });
  }
  function bindHero() {
    $('#heroTabs').addEventListener('click', function (e) {
      var t = e.target.closest('.hs-item'); if (!t) return;
      if (hero.tween) hero.tween.kill();
      showHero(+t.dataset.k);
    });
    $('#hcOpen').addEventListener('click', function () { if (hero.list[hero.i]) go('veiculo/' + hero.list[hero.i].id); });
    var h = $('#hero');
    h.addEventListener('pointerenter', function () { if (hero.tween) hero.tween.pause(); });
    h.addEventListener('pointerleave', function () { if (hero.tween) hero.tween.resume(); });
    document.addEventListener('visibilitychange', function () { if (!hero.tween) return; document.hidden ? hero.tween.pause() : hero.tween.resume(); });
    if (MOTION && window.matchMedia('(pointer: fine)').matches) {
      var lx, ly;
      h.addEventListener('pointermove', function (e) {
        if (!hero.layer) return;
        if (!lx) { lx = gsap.quickTo(hero.layer, 'x', { duration: 1, ease: 'power3' }); ly = gsap.quickTo(hero.layer, 'y', { duration: 1, ease: 'power3' }); }
        var r = h.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        lx(px * -24); ly(py * -12);
      });
    }
  }
  function introHero() {
    hero.intro = true;
    if (!MOTION) return;
    gsap.to(['.ht-a', '.ht-b', '.ht-c', '.ht-foot'], { opacity: 1, y: 0, duration: 1, ease: 'power4.out', stagger: .12, delay: .1 });
  }

  /* ---------- pagina do veiculo ---------- */
  var galleryToken = 0;
  function vehicleList() {
    var l = visible.length ? visible : avail();
    return l.some(function (c) { return c.id === current.id; }) ? l : avail();
  }
  function renderVehicleWa() {
    var c = byId(current.id); if (!c) return;
    setWa($('#vWa'), 'Olá! Tenho interesse no ' + nome(c) + ' ' + c.versao + ' ' + c.ano + ', anunciado por ' + brl(c.preco) + '. Ainda está disponível?');
    setWa($('#vTest'), 'Olá! Quero fazer um test drive do ' + nome(c) + ' ' + c.versao + ' (' + c.ano + '). Quais horários vocês têm?');
  }
  function renderGallery(c) {
    var main = $('#vgMain'), th = $('#vgThumbs'), token = ++galleryToken, selected = false, shown = 0;
    main.className = 'v-main art';
    main.innerHTML = Photos.placeholder();
    th.innerHTML = '';
    th.classList.add('single');
    function select(b, u) {
      $$('.v-thumb', th).forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      var img = new Image();
      img.className = 'art-photo'; img.alt = nome(c); img.decoding = 'async';
      img.onload = function () {
        if (token !== galleryToken) return;
        $$('.art-photo', main).forEach(function (e) { e.remove(); });
        main.appendChild(img); main.classList.add('has-photo');
        if (MOTION) gsap.fromTo(img, { opacity: 0 }, { opacity: 1, duration: .5 });
      };
      img.src = Photos.src(u, 1400);
    }
    (c.fotos || []).forEach(function (u, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'v-thumb'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', 'Foto ' + (i + 1)); b.setAttribute('aria-selected', 'false'); b.hidden = true;
      var im = new Image();
      im.alt = '';
      im.onload = function () {
        if (token !== galleryToken) return;
        b.hidden = false; shown++;
        th.classList.toggle('single', shown < 2);
        if (!selected) { selected = true; select(b, u); }
      };
      im.onerror = function () { b.remove(); };
      im.src = Photos.src(u, 300);
      b.appendChild(im);
      b.addEventListener('click', function () { select(b, u); });
      th.appendChild(b);
    });
  }
  function renderVehicle(id) {
    var c = byId(id); if (!c) return;
    $('#vCrumb').textContent = nome(c);
    $('#vBrand').textContent = c.marca;
    $('#vTitle').textContent = c.modelo;
    $('#vVersion').textContent = c.versao;
    $('#vPrice').textContent = brl(c.preco);
    $('#vParcela').innerHTML = 'ou <b>' + brl(pmt(c.preco, .3, 48)) + '</b>/mês em 48x com 30% de entrada';
    $('#vDesc').textContent = c.descricao;
    var specs = [['Ano', c.ano + '/' + c.anoModelo], ['Quilometragem', km(c.km)], ['Câmbio', c.cambio], ['Combustível', c.combustivel], ['Motor', c.motor], ['Potência', c.potencia], ['Carroceria', c.carroceria], ['Portas', c.portas]];
    $('#vSpecs').innerHTML = specs.map(function (s) { return '<div><dt>' + s[0] + '</dt><dd>' + esc(s[1]) + '</dd></div>'; }).join('');
    $('#vOpts').innerHTML = c.opcionais.map(function (o) { return '<li><svg class="ic"><use href="#i-check"/></svg>' + esc(o) + '</li>'; }).join('');
    setHeart($('#vFav'), isFav(c.id));
    renderVehicleWa();
    renderGallery(c);
    var others = avail().filter(function (x) { return x.id !== c.id; });
    others.sort(function (a, b) { return (b.carroceria === c.carroceria) - (a.carroceria === c.carroceria) || Math.abs(a.preco - c.preco) - Math.abs(b.preco - c.preco); });
    var rg = $('#relGrid');
    rg.innerHTML = '';
    others.slice(0, 4).forEach(function (x) { rg.appendChild(makeCard(x)); });
  }
  function bindVehicle() {
    $('#vFav').addEventListener('click', function () { toggleFav(current.id); });
    $('#vSim').addEventListener('click', function () { sim.id = current.id; });
    function step(dir) {
      var l = vehicleList(), i = l.map(function (c) { return c.id; }).indexOf(current.id);
      if (!l.length) return;
      go('veiculo/' + l[(i + dir + l.length) % l.length].id);
    }
    $('#vPrev').addEventListener('click', function () { step(-1); });
    $('#vNext').addEventListener('click', function () { step(1); });
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
    $('#sCar').value = sim.id;
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

  /* ---------- formulario de venda ---------- */
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
    $$('input, textarea', sf).forEach(function (i) { i.addEventListener('input', function () { if (i.closest('.invalid')) fieldErr(i, ''); }); });
    sf.elements.privacidade.addEventListener('change', function () { $('#consentErr').hidden = this.checked; });
    sf.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = validate(sf, {
        nome: req('seu nome'),
        telefone: function (v) { return v.replace(/\D/g, '').length >= 10 ? '' : 'Informe o telefone com DDD.'; },
        email: function (v) { return !v || /^\S+@\S+\.\S+$/.test(v) ? '' : 'E-mail inválido.'; },
        marca: req('a marca'), modelo: req('o modelo'),
        ano: function (v) { return /^\d{4}$/.test(v) && +v >= 1990 && +v <= yr + 1 ? '' : 'Ano com 4 dígitos.'; },
        km: function (v) { return /^\d[\d.]*$/.test(v) ? '' : 'Só números.'; }
      });
      var cons = sf.elements.privacidade.checked;
      $('#consentErr').hidden = cons;
      if (!cons) { ok = false; if (!$('.invalid', sf)) sf.elements.privacidade.focus(); }
      if (!ok) return;
      var f = sf.elements, v = f.versao.value.trim(), m = f.mensagem.value.trim();
      setWa($('#sellWa'), 'Olá! Quero avaliar meu carro: ' + f.marca.value.trim() + ' ' + f.modelo.value.trim() + (v ? ' ' + v : '') + ', ano ' + f.ano.value.trim() + ', ' + f.km.value.trim() + ' km.' + (m ? ' ' + m : '') + ' Meu nome é ' + f.nome.value.trim() + ', telefone ' + f.telefone.value.trim() + '.');
      sf.hidden = true; $('#sellOk').hidden = false;
      if (MOTION) gsap.from($('#sellOk'), { opacity: 0, y: 16, duration: .6, ease: 'power3.out' });
    });
    $('#sellAgain').addEventListener('click', function () { sf.reset(); sf.hidden = false; $('#sellOk').hidden = true; sf.elements.nome.focus(); });
  }

  /* ---------- depoimentos ---------- */
  function bindCarousel() {
    var tr = $('#depTrack');
    function step(dir) { var q = $('.quote', tr); tr.scrollBy({ left: dir * (q.offsetWidth + 18), behavior: REDUCE ? 'auto' : 'smooth' }); }
    $('#depPrev').addEventListener('click', function () { step(-1); });
    $('#depNext').addEventListener('click', function () { step(1); });
    var down = false, sx = 0, sl = 0;
    tr.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = tr.scrollLeft; });
    window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) tr.classList.add('drag'); tr.scrollLeft = sl - dx; });
    window.addEventListener('pointerup', function () { if (!down) return; down = false; tr.classList.remove('drag'); });
  }

  /* ---------- menu mobile ---------- */
  function toggleMenu(force) {
    var nav = $('#nav'), m = $('#mnav'), open = typeof force === 'boolean' ? force : m.hidden;
    m.hidden = !open;
    nav.classList.toggle('open', open);
    $('#menuBtn').setAttribute('aria-expanded', String(open));
  }
  $('#menuBtn').addEventListener('click', function () { toggleMenu(); });
  $$('#mnav a').forEach(function (a) { a.addEventListener('click', function () { toggleMenu(false); }); });

  /* ---------- painel do lojista ---------- */
  var SWATCHES = [['#fba500', 'Âmbar'], ['#f2622d', 'Laranja'], ['#3b82f6', 'Azul'], ['#1fa971', 'Verde'], ['#e5484d', 'Vermelho'], ['#d9dce0', 'Prata']];
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
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$('#panel').hidden) closePanel();
    else if ($('#nav').classList.contains('open')) toggleMenu(false);
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
      updateCardPrices(c); onStockChanged(true);
    }, 300);
  });
  $('#admReset').addEventListener('click', function () {
    API.resetarEstoque();
    API.listar().then(function (l) { cars = l; renderAdmin(); cars.forEach(updateCardPrices); onStockChanged(); toast('Estoque original restaurado'); });
  });

  function onStockChanged(priceOnly) {
    applyFilters(onPage('estoque'));
    populateFilters();
    applyFilters(false);
    buildSim(); syncFavs();
    renderHome();
    var feat = hero.list[hero.i];
    if (!priceOnly || !feat || byId(feat.id).vendido) { if (hero.tween) hero.tween.kill(); buildHero(); }
    else setHeroText(feat);
    if (current.name === 'veiculo') {
      var c = byId(current.id);
      if (!c || c.vendido) go('estoque'); else renderVehicle(current.id);
    }
  }

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
  }

  /* ---------- rotas (paginas) ---------- */
  var PAGES = ['inicio', 'estoque', 'veiculo', 'financiamento', 'venda', 'sobre', 'contato'];
  function parseRoute() {
    var p = location.hash.replace(/^#\/?/, '').split('/');
    return { name: PAGES.indexOf(p[0]) > -1 ? p[0] : 'inicio', id: p[1] || '' };
  }
  function route(opts) {
    opts = opts || {};
    var r = parseRoute();
    if (r.name === 'veiculo' && cars.length && (!byId(r.id) || byId(r.id).vendido)) { location.replace('#/estoque'); return; }
    var changed = r.name !== current.name || r.id !== current.id;
    current = r;
    $$('.page').forEach(function (pg) { pg.hidden = pg.dataset.page !== r.name; });
    $('#nav').classList.toggle('solid', r.name !== 'inicio');
    var key = r.name === 'veiculo' ? 'estoque' : r.name;
    $$('.nav-side a').forEach(function (a) { a.classList.toggle('on', a.dataset.route === key); });
    refreshTitle();
    toggleMenu(false);

    if (cars.length) {
      if (r.name === 'veiculo') renderVehicle(r.id);
      if (r.name === 'financiamento') { buildSim(); }
      if (r.name === 'inicio' && !hero.intro) introHero();
    }
    if (r.name === 'inicio') { if (hero.tween && !document.hidden) hero.tween.resume(); else if (cars.length && !hero.tween) startHeroTimer(); }
    else if (hero.tween) hero.tween.pause();

    if (!opts.silent && changed) {
      window.scrollTo(0, 0);
      if (MOTION) gsap.fromTo(pageEl(r.name), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .55, ease: 'power3.out', clearProps: 'transform' });
    }
  }
  window.addEventListener('hashchange', function () { route(); });

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
  }

  /* revelacao ao rolar e contadores, por IntersectionObserver (funciona em qualquer pagina) */
  function initReveal() {
    if (!MOTION || !('IntersectionObserver' in window)) return;
    var targets = ['.sec-title', '.sec-sub', '.filters', '.fin-copy > *', '.sim', '.about-copy > *', '.about-img', '.stats > div', '.sell-form-wrap', '.dep-head', '.quote', '.contact-info > *', '.map', '.brands .wrap > *', '.promise-copy', '.promise-img', '.center-cta', '.banner-row', '.v-gallery', '.v-info', '.v-detail > div', '.footer-in > *'];
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (s) { $$(s).forEach(function (el) { if (!el.classList.contains('rv')) { el.classList.add('rv'); io.observe(el); } }); });

    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, to = +el.dataset.to, suf = el.dataset.suffix || '', o = { v: 0 };
        gsap.to(o, { v: to, duration: 2, ease: 'power3.out', onUpdate: function () { el.textContent = nf.format(Math.round(o.v)) + suf; } });
      });
    }, { threshold: .6 });
    $$('.count').forEach(function (el) { cio.observe(el); });
  }

  /* ---------- estoque vindo da fonte de dados ---------- */
  var stockSig = '';
  function sigOf(list) { return JSON.stringify(list.map(function (c) { return [c.id, c.preco, c.vendido, c.km, c.destaque, (c.fotos || []).length]; })); }
  function applyStock(list) {
    cars = list; stockSig = sigOf(list);
    buildCards(); populateFilters(); applyFilters(false); buildSim(); syncFavs(); renderHome(); buildHero();
    if (current.name === 'veiculo') {
      var c = byId(current.id);
      if (!c || c.vendido) go('estoque'); else renderVehicle(current.id);
    }
  }
  function pollStock() {
    API.listar().then(function (l) { if (sigOf(l) !== stockSig) applyStock(l); });
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
    bindFilters(); bindSim(); bindForms(); bindCarousel(); bindBrandForm(); bindHero(); bindVehicle();
    showSkeleton();
    initMotion();
    initReveal();
    route({ silent: true });

    API.listar().then(function (list) {
      applyStock(list);
      Photos.mount($('#aboutImg'), { fotos: window.MIDIA.sobre, marca: 'Carro', modelo: 'do estoque' }, { w: 1200 });
      route({ silent: true });
      if (onPage('inicio') && !hero.intro) introHero();
      if (onPage('inicio') && hero.tween) hero.tween.resume();
    });
    /* O site se atualiza sozinho: de tempos em tempos (e ao voltar para a aba) busca o estoque de novo.
       Se algo mudou na fonte de dados (preco, vendido, carro novo), tudo se reorganiza, hero inclusive. */
    setInterval(pollStock, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) pollStock(); });
    setInterval(renderOpen, 60000);
  }
  boot();
})();
