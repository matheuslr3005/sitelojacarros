/*
 * Camada de dados do site.
 * O resto do codigo so conversa com window.API, nunca com a fonte dos dados direto.
 *
 * Fonte do estoque:
 *  - Se a loja tem um link de planilha (LOJA.planilha em js/data/estoque.js, ou colado no Painel do lojista),
 *    o estoque vem da planilha (js/sheet.js). A ultima leitura boa fica guardada no navegador; se o Google
 *    estiver fora do ar, o site continua mostrando essa copia.
 *  - Sem link, usa os dados de demonstracao de js/data/estoque.js.
 * Para ligar a um sistema de estoque/CRM no futuro, e so reescrever listar() (o resto do site nao muda).
 */
(function () {
  var K_STOCK = 'gv-demo-estoque', K_BRAND = 'gv-demo-marca', K_CACHE = 'gv-cache-planilha';

  function read(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* modo privado */ } }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  var status = { fonte: 'demo', ok: true, total: 0, em: null, erro: '', usouCopia: false };

  function sheetUrl() { return String(API.loja().planilha || '').trim(); }
  function readCache(url) { var c = read(K_CACHE); return c.url === url && Array.isArray(c.cars) ? c.cars : null; }

  var API = {
    /* Retorna a lista de veiculos da fonte configurada. */
    listar: function () {
      var url = sheetUrl();
      if (!url) {
        var ov = read(K_STOCK);
        return wait(850).then(function () {
          var l = window.ESTOQUE.map(function (c) { return Object.assign({}, c, ov[c.id] || {}); });
          status = { fonte: 'demo', ok: true, total: l.length, em: new Date(), erro: '', usouCopia: false };
          return l;
        });
      }
      return window.Planilha.carregar(url).then(function (cars) {
        write(K_CACHE, { url: url, cars: cars });
        status = { fonte: 'planilha', ok: true, total: cars.length, em: new Date(), erro: '', usouCopia: false };
        return cars;
      }).catch(function (e) {
        var c = readCache(url);
        status = { fonte: 'planilha', ok: false, total: c ? c.length : 0, em: new Date(), erro: (e && e.message) || 'Falha ao ler a planilha.', usouCopia: !!c };
        return c || [];
      });
    },
    status: function () { return status; },
    fonte: function () { return sheetUrl() ? 'planilha' : 'demo'; },

    /* So no modo demonstracao: ajustes feitos pelo Painel ficam no navegador. */
    atualizar: function (id, patch) {
      var ov = read(K_STOCK);
      ov[id] = Object.assign(ov[id] || {}, patch);
      write(K_STOCK, ov);
    },
    resetarEstoque: function () { write(K_STOCK, {}); },

    /* Identidade da loja: dados base + personalizacao feita pelo Painel (nome, cor, contatos, link da planilha). */
    loja: function () { return Object.assign({}, window.LOJA, read(K_BRAND)); },
    salvarLoja: function (patch) { write(K_BRAND, Object.assign(read(K_BRAND), patch)); },
    removerCampoLoja: function (k) { var b = read(K_BRAND); delete b[k]; write(K_BRAND, b); },
    resetarLoja: function () { write(K_BRAND, {}); }
  };

  window.API = API;
})();
