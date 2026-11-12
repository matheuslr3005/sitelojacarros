/*
 * Leitor de planilha (Google Sheets ou qualquer CSV online).
 * A loja cadastra os carros numa planilha com colunas em portugues (veja planilha-modelo/estoque-modelo.csv).
 * Aqui o site le essa planilha, converte cada linha em um veiculo e entrega para o resto do codigo.
 * Cabecalhos aceitam acento, maiuscula e variacoes (ex.: "Preço", "preco", "Valor").
 */
(function () {
  function norm(s) {
    return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  /* CSV com aspas, virgulas e quebras de linha dentro das celulas; detecta ; como separador */
  function parseCSV(text) {
    text = String(text).replace(/^﻿/, '');
    var first = text.split(/\r?\n/)[0] || '';
    var sep = (first.split(';').length > first.split(',').length) ? ';' : ',';
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === sep) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); cell = '';
        if (row.some(function (c) { return String(c).trim() !== ''; })) rows.push(row);
        row = [];
      } else cell += ch;
    }
    row.push(cell);
    if (row.some(function (c) { return String(c).trim() !== ''; })) rows.push(row);
    return rows;
  }

  /* Aceita o link normal da planilha (basta estar "qualquer pessoa com o link pode ver")
     ou o link de "Publicar na Web" em CSV. */
  function toUrl(u) {
    u = String(u).trim();
    if (/\/spreadsheets\/d\/e\//.test(u) || /output=csv/.test(u) || /\/gviz\/tq/.test(u) || /\.csv(\?|$)/.test(u)) return u;
    var m = u.match(/\/spreadsheets\/d\/([^\/?#]+)/);
    if (m) {
      var g = u.match(/[#&?]gid=(\d+)/);
      return 'https://docs.google.com/spreadsheets/d/' + m[1] + '/gviz/tq?tqx=out:csv' + (g ? '&gid=' + g[1] : '');
    }
    return u;
  }

  var ALIAS = {
    id: ['id', 'codigo', 'cod', 'referencia'],
    status: ['status', 'situacao', 'disponibilidade'],
    destaque: ['destaque', 'destacar'],
    marca: ['marca', 'fabricante'],
    modelo: ['modelo'],
    versao: ['versao', 'versao_do_carro'],
    ano: ['ano', 'ano_fabricacao', 'ano_fab'],
    ano_modelo: ['ano_modelo', 'ano_mod', 'modelo_ano'],
    km: ['km', 'quilometragem', 'rodados'],
    preco: ['preco', 'valor', 'preco_r', 'valor_r'],
    combustivel: ['combustivel'],
    cambio: ['cambio', 'transmissao'],
    carroceria: ['carroceria', 'tipo', 'categoria'],
    cor: ['cor'],
    motor: ['motor'],
    potencia: ['potencia', 'cv'],
    portas: ['portas'],
    opcionais: ['opcionais', 'equipamentos', 'acessorios', 'itens'],
    descricao: ['descricao', 'observacoes', 'obs', 'detalhes'],
    selo: ['selo', 'etiqueta', 'tag'],
    fotos: ['fotos', 'foto', 'imagens', 'links_das_fotos', 'fotos_links']
  };

  function money(v) {
    v = String(v == null ? '' : v).replace(/[^\d.,]/g, '');
    if (!v) return 0;
    if (v.indexOf(',') > -1) v = v.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, '');
    return parseFloat(v) || 0;
  }
  function int(v) { var d = String(v == null ? '' : v).replace(/\D/g, ''); return d ? parseInt(d, 10) : null; }
  function yes(v) { return /^(sim|s|yes|y|true|1|x)$/.test(norm(v)); }
  function slug(s) { return norm(s).replace(/_/g, '-'); }
  function list(v, seps) { return String(v || '').split(seps).map(function (x) { return x.trim(); }).filter(Boolean); }

  function converter(rows) {
    if (!rows.length) throw new Error('A planilha está vazia.');
    var heads = rows[0].map(norm), idx = {};
    Object.keys(ALIAS).forEach(function (k) {
      for (var i = 0; i < ALIAS[k].length; i++) { var p = heads.indexOf(ALIAS[k][i]); if (p > -1) { idx[k] = p; break; } }
    });
    if (idx.marca == null || idx.modelo == null) throw new Error('A planilha precisa das colunas "Marca" e "Modelo" na primeira linha.');
    var seen = {}, out = [];
    rows.slice(1).forEach(function (r) {
      function g(k) { return idx[k] == null ? '' : String(r[idx[k]] == null ? '' : r[idx[k]]).trim(); }
      var marca = g('marca'), modelo = g('modelo');
      if (!marca || !modelo) return;
      var ano = int(g('ano')), anoModelo = int(g('ano_modelo')) || ano;
      var st = norm(g('status'));
      var vendido = /vendid|oculto|inativ|indisponivel|baixad/.test(st);
      var reservado = /reserv/.test(st);
      var base = g('id') ? slug(g('id')) : slug([marca, modelo, g('versao'), ano].join(' '));
      var id = base, n = 2;
      while (seen[id]) id = base + '-' + (n++);
      seen[id] = 1;
      var opc = g('opcionais');
      var fotos = String(g('fotos')).split(/[\s;|]+/).filter(function (u) { return /^https?:\/\//i.test(u); });
      out.push({
        id: id, marca: marca, modelo: modelo, versao: g('versao'),
        ano: ano, anoModelo: anoModelo, km: int(g('km')), preco: money(g('preco')),
        combustivel: g('combustivel'), cambio: g('cambio'), carroceria: g('carroceria') || 'Outros',
        cor: { nome: g('cor'), hex: '#8a8d91' }, motor: g('motor'), potencia: g('potencia'), portas: int(g('portas')),
        opcionais: opc.indexOf(';') > -1 || opc.indexOf('|') > -1 || opc.indexOf('\n') > -1 ? list(opc, /[;|\n]+/) : list(opc, /,/),
        descricao: g('descricao'),
        selo: g('selo') || (reservado ? 'Reservado' : ''),
        destaque: yes(g('destaque')), vendido: vendido, fotos: fotos
      });
    });
    return out;
  }

  function carregar(url) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
    return fetch(toUrl(url), { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('O Google respondeu ' + r.status + '. Confira se o link está certo e se a planilha está compartilhada.'); return r.text(); })
      .then(function (text) {
        clearTimeout(t);
        if (/^\s*<(!doctype|html)/i.test(text)) throw new Error('A planilha não está pública. Compartilhe como "qualquer pessoa com o link pode ver".');
        return converter(parseCSV(text));
      }, function (e) { clearTimeout(t); throw new Error(e && e.name === 'AbortError' ? 'A planilha demorou demais para responder.' : 'Não consegui abrir a planilha. Verifique a internet e o link.'); });
  }

  window.Planilha = { carregar: carregar, parseCSV: parseCSV, converter: converter, toUrl: toUrl, norm: norm };
})();
