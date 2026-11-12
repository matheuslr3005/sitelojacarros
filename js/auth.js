/*
 * Login do Painel do lojista.
 * O site e estatico (sem servidor), entao a senha e conferida aqui no navegador, comparando um hash
 * PBKDF2-SHA256 (js/data/acesso.js). Isso esconde o painel de quem visita e impede tentativa facil de adivinhar,
 * mas NAO substitui seguranca de servidor: a protecao real do estoque e a permissao da planilha do Google.
 */
(function () {
  var K_SES = 'gv-sessao', K_TRY = 'gv-tentativas';

  function cfg() {
    var a = window.ACESSO || {};
    return { horas: a.sessaoHoras || 8, max: a.tentativasMax || 5, bloqueio: a.bloqueioMin || 15, usuarios: a.usuarios || [] };
  }
  function bytes(b64) { return Uint8Array.from(atob(b64), function (c) { return c.charCodeAt(0); }); }
  function concat(a, b) { var o = new Uint8Array(a.length + b.length); o.set(a, 0); o.set(b, a.length); return o; }
  function same(a, b) {
    if (a.length !== b.length) return false;
    var d = 0; for (var i = 0; i < a.length; i++) d |= a[i] ^ b[i];
    return d === 0;
  }
  function readTry() { try { return JSON.parse(localStorage.getItem(K_TRY)) || { n: 0, ate: 0 }; } catch (e) { return { n: 0, ate: 0 }; } }
  function writeTry(v) { try { localStorage.setItem(K_TRY, JSON.stringify(v)); } catch (e) { /* modo privado */ } }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function derive(senha, usuario, u) {
    var enc = new TextEncoder();
    var salt = concat(bytes(u.salt), enc.encode(String(usuario).toLowerCase()));
    return crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']).then(function (key) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: u.iteracoes }, key, 256);
    }).then(function (bits) { return new Uint8Array(bits); });
  }

  var Auth = {
    /* Minutos restantes de bloqueio (0 = liberado) */
    bloqueadoMin: function () {
      var t = readTry(), left = t.ate - Date.now();
      return left > 0 ? Math.ceil(left / 60000) : 0;
    },
    entrar: function (usuario, senha) {
      var c = cfg();
      if (!window.crypto || !crypto.subtle) return Promise.resolve({ ok: false, motivo: 'indisponivel' });
      var bl = Auth.bloqueadoMin();
      if (bl) return Promise.resolve({ ok: false, motivo: 'bloqueado', minutos: bl });
      usuario = String(usuario || '').trim();
      var found = c.usuarios.filter(function (u) { return u.usuario.toLowerCase() === usuario.toLowerCase(); })[0];
      var ref = found || c.usuarios[0];
      if (!ref) return Promise.resolve({ ok: false, motivo: 'invalido' });
      /* confere sempre, mesmo com usuario inexistente, para o tempo nao denunciar quem existe */
      return derive(String(senha || ''), usuario, ref).then(function (got) {
        var ok = !!found && same(got, bytes(ref.hash));
        if (ok) {
          writeTry({ n: 0, ate: 0 });
          try { sessionStorage.setItem(K_SES, JSON.stringify({ u: found.usuario, t: Date.now() })); } catch (e) { /* sem sessao */ }
          return { ok: true };
        }
        var t = readTry(); t.n = (t.n || 0) + 1;
        var res = { ok: false, motivo: 'invalido', restantes: Math.max(0, c.max - t.n) };
        if (t.n >= c.max) { t.n = 0; t.ate = Date.now() + c.bloqueio * 60000; res.motivo = 'bloqueado'; res.minutos = c.bloqueio; }
        writeTry(t);
        return wait(700).then(function () { return res; });
      });
    },
    logado: function () {
      try {
        var s = JSON.parse(sessionStorage.getItem(K_SES));
        if (s && s.t && Date.now() - s.t < cfg().horas * 3600000) return true;
        sessionStorage.removeItem(K_SES);
      } catch (e) { /* sem sessao */ }
      return false;
    },
    sair: function () { try { sessionStorage.removeItem(K_SES); } catch (e) { /* ok */ } }
  };

  window.Auth = Auth;
})();
