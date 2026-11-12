/*
 * ACESSO AO PAINEL DO LOJISTA
 * Aqui ficam apenas o usuario e o HASH da senha (nunca a senha em si).
 * Para trocar a senha: abra tools/gerar-acesso.html, digite usuario e senha nova e cole a linha gerada abaixo.
 * Use uma senha longa (12 caracteres ou mais): como o site e publico, quem baixar este arquivo pode tentar
 * adivinhar a senha no proprio computador, e senha curta cai rapido.
 */
window.ACESSO = {
  sessaoHoras: 8,     // depois disso pede login de novo (e a sessao tambem acaba ao fechar a aba)
  tentativasMax: 5,   // erros seguidos antes de bloquear
  bloqueioMin: 15,    // tempo de bloqueio apos errar demais
  usuarios: [
    { usuario: "alfa", salt: "DYLI5V9GlSSIFFTse6OgJA==", iteracoes: 210000, hash: "Ea2I5WAiBmGUO+5kiCxexOSIM5sQ/zfjPszR9z6ASoE=" }
  ]
};
