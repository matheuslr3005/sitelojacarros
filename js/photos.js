/*
 * Fotos dos veiculos.
 * Cada veiculo tem uma lista "fotos". Aqui a gente tenta carregar em ordem e usa a primeira que funcionar.
 * Se nenhuma carregar, o espaco mostra um quadro neutro com o icone de carro.
 */
(function () {
  /* Fotos do Wikimedia Commons aceitam ?width=N e devolvem uma miniatura do tamanho pedido. */
  function src(u, w) {
    if (/Special:FilePath/.test(u)) return u + (u.indexOf('?') > -1 ? '&' : '?') + 'width=' + (w || 800);
    return u;
  }

  function placeholder() {
    return '<div class="art-ph" aria-hidden="true"><svg class="ic"><use href="#i-car"/></svg><span>Foto em breve</span></div>';
  }

  /* Tenta cada foto em ordem; chama onOk(img, indice) com a primeira que carrega. */
  function loadFirst(list, w, alt, eager, onOk, start) {
    var i = start || 0;
    (function next() {
      if (!list || i >= list.length) return;
      var img = new Image();
      img.alt = alt || '';
      img.decoding = 'async';
      img.className = 'art-photo';
      var idx = i;
      img.onload = function () { onOk(img, idx); };
      img.onerror = function () { i++; next(); };
      img.src = src(list[idx], w);
    })();
  }

  /* Monta o espaco da foto dentro de el: quadro neutro e, por cima, a primeira foto que carregar. */
  function mount(el, car, opts) {
    opts = opts || {};
    el.classList.add('art');
    el.classList.remove('has-photo');
    el.innerHTML = placeholder();
    function go() {
      loadFirst(car.fotos, opts.w || 800, car.marca + ' ' + car.modelo, opts.eager, function (img) {
        el.appendChild(img);
        el.classList.add('has-photo');
      });
    }
    /* so baixa a foto quando o espaco esta perto da tela (a lista de estoque tem muitos carros) */
    if (opts.eager || !('IntersectionObserver' in window)) { go(); return; }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); go(); }
    }, { rootMargin: '400px 0px' });
    io.observe(el);
  }

  window.Photos = { src: src, mount: mount, loadFirst: loadFirst, placeholder: placeholder };
})();
