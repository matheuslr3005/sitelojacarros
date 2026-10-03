/*
 * Camada de dados do site.
 * O resto do codigo so conversa com window.API, nunca com o arquivo de dados direto.
 * Para integrar com o sistema de estoque real da loja, e so reescrever listar()
 * (e sincronizar()) para buscar de uma API, planilha ou feed XML/JSON.
 * Os ajustes feitos no "Painel do lojista" da demo ficam salvos no navegador (localStorage).
 */
(function () {
  var K_STOCK = 'gv-demo-estoque', K_BRAND = 'gv-demo-marca';

  function read(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* modo privado */ } }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  var API = {
    /* Retorna a lista de veiculos. Hoje: arquivo local + ajustes da demo. */
    listar: function () {
      var ov = read(K_STOCK);
      return wait(850).then(function () {
        return window.ESTOQUE.map(function (c) { return Object.assign({}, c, ov[c.id] || {}); });
      });
    },
    atualizar: function (id, patch) {
      var ov = read(K_STOCK);
      ov[id] = Object.assign(ov[id] || {}, patch);
      write(K_STOCK, ov);
    },
    sincronizar: function () { return wait(1400).then(function () { return new Date(); }); },
    resetarEstoque: function () { write(K_STOCK, {}); },

    /* Identidade da loja: dados base + personalizacao da demo (nome, cor, whatsapp, cidade). */
    loja: function () { return Object.assign({}, window.LOJA, read(K_BRAND)); },
    salvarLoja: function (patch) { write(K_BRAND, Object.assign(read(K_BRAND), patch)); },
    resetarLoja: function () { write(K_BRAND, {}); }
  };

  window.API = API;
})();
