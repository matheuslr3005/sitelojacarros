/*
 * Ilustracao de estudio gerada por codigo.
 * Serve como imagem padrao enquanto o veiculo nao tem foto real (car.fotos vazio).
 * Quando houver foto, CarArt.mount() carrega a imagem por cima e esta ilustracao some.
 */
(function () {
  var uid = 0;

  function hex2rgb(h) {
    h = h.replace('#', '');
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function mix(h, to, t) {
    var a = hex2rgb(h), b = to === 'w' ? [255, 255, 255] : [0, 0, 0];
    return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(',') + ')';
  }

  /* Cada tipo: contorno da carroceria, vidros, colunas, posicao das rodas e detalhes. Virado para a direita. */
  var TYPES = {
    'Hatch': {
      glassTop: 'M236 206 L284 150',
      body: 'M104 296 L102 258 C102 244 108 236 120 232 L182 168 C194 148 214 138 240 136 L410 133 C444 133 466 140 486 156 L536 200 C552 210 578 214 606 218 C650 224 690 232 708 244 C718 252 722 264 722 278 L722 296 Z',
      glass: 'M196 208 L212 170 C220 154 232 146 250 145 L410 142 C436 142 452 148 466 160 L518 204 Z',
      pillars: ['M332 143 L350 143 L354 208 L330 208 Z'],
      wheels: [216, 598], r: 49, arch: 58,
      seams: ['M342 210 L342 286', 'M214 214 C212 244 212 266 214 284'],
      handles: [[288, 222], [398, 222]], mirror: [498, 184], head: [690, 236, 722], tail: [104, 238], top: 133, rails: false
    },
    'Sedã': {
      glassTop: 'M300 206 L340 152',
      body: 'M96 296 L94 262 C94 248 100 240 112 236 L124 222 C132 212 146 208 164 207 L226 204 C256 202 276 172 304 152 C314 145 326 142 344 141 L432 139 C458 139 478 146 496 162 L546 204 C566 212 618 216 662 224 C700 231 726 240 734 256 C738 264 738 272 738 280 L738 296 Z',
      glass: 'M258 204 C276 182 292 160 310 152 C318 148 328 147 344 146 L430 144 C450 144 464 150 478 164 L522 206 Z',
      pillars: ['M360 146 L378 146 L380 206 L356 206 Z'],
      wheels: [226, 616], r: 49, arch: 58,
      seams: ['M368 208 L368 286', 'M244 208 C242 240 242 264 244 284'],
      handles: [[308, 220], [418, 220]], mirror: [500, 188], head: [708, 232, 738], tail: [96, 238], top: 139, rails: false
    },
    'SUV': {
      glassTop: 'M232 206 L268 140',
      body: 'M104 296 L102 254 C102 240 108 232 118 228 L142 214 L170 152 C174 136 188 126 208 123 L420 118 C450 118 472 126 490 142 L546 204 C568 212 622 218 664 228 C694 235 708 248 708 268 L708 296 Z',
      glass: 'M180 208 L192 158 C196 146 204 139 218 137 L418 132 C440 132 456 138 468 150 L518 208 Z',
      pillars: ['M320 134 L338 134 L342 208 L318 208 Z', 'M196 140 L214 138 L208 208 L184 208 Z'],
      wheels: [218, 596], r: 52, arch: 61,
      seams: ['M330 210 L330 286', 'M206 214 C204 244 204 266 206 284'],
      handles: [[276, 222], [388, 222]], mirror: [498, 188], head: [678, 232, 708], tail: [102, 234], top: 118, rails: true
    },
    'Picape': {
      glassTop: 'M360 206 L390 146',
      body: 'M74 298 L74 218 L98 210 L304 208 L308 156 C312 140 324 134 344 133 L490 131 C514 131 530 140 544 156 L602 206 C624 212 700 218 740 230 C760 236 768 250 768 270 L768 298 Z',
      glass: 'M318 204 L322 160 C326 148 334 142 348 142 L488 139 C508 139 520 146 532 158 L576 204 Z',
      pillars: ['M408 141 L426 141 L428 206 L404 206 Z'],
      wheels: [194, 640], r: 54, arch: 63,
      seams: ['M304 210 L304 290', 'M418 208 L418 290', 'M98 214 L90 284'],
      handles: [[360, 220], [452, 220]], mirror: [546, 180], head: [738, 232, 768], tail: [74, 228], top: 131, rails: false
    }
  };

  function wheel(cx, cy, r, id) {
    var rim = r * 0.72, s = '';
    for (var i = 0; i < 5; i++) {
      s += '<path d="M' + (cx - 3.2) + ' ' + (cy - rim + 3) + ' L' + (cx + 3.2) + ' ' + (cy - rim + 3) + ' L' + (cx + 5) + ' ' + (cy - 9) + ' L' + (cx - 5) + ' ' + (cy - 9) + ' Z" fill="url(#' + id + 'rim)" transform="rotate(' + (i * 72) + ' ' + cx + ' ' + cy + ')"/>';
    }
    return '<g>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#0c0c0d"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 5) + '" fill="none" stroke="#1d1d20" stroke-width="2"/>' +
      '<g class="wheel-spin" style="transform-origin:' + cx + 'px ' + cy + 'px">' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + rim + '" fill="#26272a"/>' + s +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + (rim - 1) + '" fill="none" stroke="url(#' + id + 'rim)" stroke-width="3"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="#9ea2a8"/><circle cx="' + cx + '" cy="' + cy + '" r="3" fill="#2a2b2e"/>' +
      '</g></g>';
  }

  function svg(car, opts) {
    opts = opts || {};
    var t = TYPES[car.carroceria] || TYPES.Hatch, id = 'ca' + (++uid) + '-', col = car.cor.hex, gy = 346;
    var cy = gy - t.r;
    var h = '<svg class="car-svg" viewBox="40 70 760 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + car.marca + ' ' + car.modelo + ' ' + car.cor.nome + '" preserveAspectRatio="xMidYMid meet">';
    h += '<defs>' +
      '<linearGradient id="' + id + 'paint" gradientUnits="userSpaceOnUse" x1="0" y1="' + t.top + '" x2="0" y2="296">' +
        '<stop offset="0" stop-color="' + mix(col, 'w', 0.2) + '"/><stop offset=".38" stop-color="' + col + '"/><stop offset=".78" stop-color="' + mix(col, 'k', 0.22) + '"/><stop offset="1" stop-color="' + mix(col, 'k', 0.42) + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'sheen" gradientUnits="userSpaceOnUse" x1="90" y1="0" x2="740" y2="0">' +
        '<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".22" stop-color="#fff" stop-opacity=".0"/><stop offset=".34" stop-color="#fff" stop-opacity=".22"/><stop offset=".48" stop-color="#fff" stop-opacity="0"/><stop offset=".78" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + id + 'edge" gradientUnits="userSpaceOnUse" x1="0" y1="' + t.top + '" x2="0" y2="' + (t.top + 60) + '"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + id + 'glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3947"/><stop offset="1" stop-color="#0a0f14"/></linearGradient>' +
      '<linearGradient id="' + id + 'rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6e8eb"/><stop offset=".5" stop-color="#8d9298"/><stop offset="1" stop-color="#d3d6da"/></linearGradient>' +
      '<linearGradient id="' + id + 'fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<mask id="' + id + 'rm" maskUnits="userSpaceOnUse" x="0" y="' + gy + '" width="800" height="84"><rect x="0" y="' + gy + '" width="800" height="84" fill="url(#' + id + 'fade)"/></mask>' +
      '<clipPath id="' + id + 'clip"><path d="' + t.body + '"/></clipPath>' +
      '<filter id="' + id + 'blur" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="9"/></filter>' +
    '</defs>';

    /* sombra de contato */
    var mid = (t.wheels[0] + t.wheels[1]) / 2;
    h += '<ellipse cx="' + mid + '" cy="' + (gy + 2) + '" rx="' + ((t.wheels[1] - t.wheels[0]) / 2 + 120) + '" ry="12" fill="#000" opacity=".55" filter="url(#' + id + 'blur)"/>';

    /* grupo do carro (reutilizado no reflexo) */
    var g = '<g id="' + id + 'car">';
    g += '<path d="' + t.body + '" fill="url(#' + id + 'paint)"/>';
    g += '<path d="' + t.glass + '" fill="url(#' + id + 'glass)"/>';
    g += '<path d="' + t.glass + '" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="3"/>';
    g += '<path d="' + t.glass + '" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1"/>';
    g += '<path d="' + t.glassTop + '" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="10"/>';
    t.pillars.forEach(function (p) { g += '<path d="' + p + '" fill="url(#' + id + 'paint)"/>'; });
    g += '<g clip-path="url(#' + id + 'clip)">';
    g += '<rect x="60" y="' + (t.top - 10) + '" width="720" height="300" fill="url(#' + id + 'sheen)"/>';
    g += '<rect x="60" y="286" width="720" height="14" fill="#050506" opacity=".5"/>';
    g += '<path d="M100 232 C300 218 520 216 720 238" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>';
    g += '<path d="M100 246 C300 236 520 234 720 252" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="3"/>';
    t.wheels.forEach(function (x) { g += '<circle cx="' + x + '" cy="' + cy + '" r="' + t.arch + '" fill="#08080a"/>'; });
    g += '</g>';
    g += '<path d="' + t.body + '" fill="none" stroke="url(#' + id + 'edge)" stroke-width="2.4" stroke-linejoin="round"/>';
    t.wheels.forEach(function (x) { g += '<path d="M' + (x - t.arch) + ' ' + cy + ' A' + t.arch + ' ' + t.arch + ' 0 0 1 ' + (x + t.arch) + ' ' + cy + '" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="3"/>'; });
    t.seams.forEach(function (s) { g += '<path d="' + s + '" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1.6"/>'; });
    t.handles.forEach(function (p) { g += '<rect x="' + p[0] + '" y="' + p[1] + '" width="26" height="5" rx="2.5" fill="#000" opacity=".4"/>'; });
    g += '<path d="M' + t.mirror[0] + ' ' + (t.mirror[1] + 2) + ' C' + (t.mirror[0] + 12) + ' ' + (t.mirror[1] - 6) + ' ' + (t.mirror[0] + 30) + ' ' + (t.mirror[1] - 4) + ' ' + (t.mirror[0] + 32) + ' ' + (t.mirror[1] + 4) + ' L' + t.mirror[0] + ' ' + (t.mirror[1] + 10) + ' Z" fill="url(#' + id + 'paint)" stroke="#000" stroke-opacity=".3"/>';
    if (t.rails) g += '<path d="M212 121 L420 116" stroke="#0a0a0b" stroke-width="4" stroke-linecap="round"/>';
    /* farol e lanterna */
    var hx = t.head[2];
    g += '<path d="M' + (hx - 30) + ' ' + t.head[1] + ' L' + (hx - 2) + ' ' + (t.head[1] + 8) + ' L' + (hx - 2) + ' ' + (t.head[1] + 18) + ' L' + (hx - 34) + ' ' + (t.head[1] + 12) + ' Z" fill="#f4f1e6"/>';
    g += '<path d="M' + (hx - 28) + ' ' + (t.head[1] + 3) + ' L' + (hx - 6) + ' ' + (t.head[1] + 9) + '" stroke="#b9c3cf" stroke-width="2"/>';
    g += '<path d="M' + t.tail[0] + ' ' + t.tail[1] + ' L' + (t.tail[0] + 2) + ' ' + (t.tail[1] - 8) + ' L' + (t.tail[0] + 16) + ' ' + (t.tail[1] - 6) + ' L' + (t.tail[0] + 16) + ' ' + (t.tail[1] + 14) + ' L' + t.tail[0] + ' ' + (t.tail[1] + 16) + ' Z" fill="#c4141f"/>';
    t.wheels.forEach(function (x) { g += wheel(x, cy, t.r, id); });
    g += '</g>';
    h += g;
    /* reflexo no piso */
    h += '<g mask="url(#' + id + 'rm)" opacity=".55"><use href="#' + id + 'car" transform="translate(0,' + (gy * 2) + ') scale(1,-1)"/></g>';
    return h + '</svg>';
  }

  /* Monta ilustracao + foto real (se existir) dentro de um container.
     Se a foto falhar ao carregar, a ilustracao continua visivel. */
  function mount(el, car, opts) {
    opts = opts || {};
    el.classList.add('art');
    el.innerHTML = '<div class="art-floor"></div>' + svg(car, opts);
    var foto = car.fotos && car.fotos[opts.foto || 0];
    if (foto) {
      var img = new Image();
      img.alt = car.marca + ' ' + car.modelo;
      img.decoding = 'async';
      img.loading = opts.eager ? 'eager' : 'lazy';
      img.className = 'art-photo';
      img.onload = function () { el.classList.add('has-photo'); };
      img.onerror = function () { img.remove(); };
      img.src = foto;
      el.appendChild(img);
    }
  }

  window.CarArt = { svg: svg, mount: mount };
})();
