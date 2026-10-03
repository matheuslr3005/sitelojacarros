# Site de loja de carros (modelo de demonstração)

Site interativo para apresentar a donos de lojas de carros que ainda não têm site, ou cujo site está desatualizado. A loja que aparece ("Garagem Verona") é fictícia e serve só de vitrine do modelo.

Não precisa instalar nada: é HTML, CSS e JavaScript puros, com as bibliotecas já dentro do projeto. Dá para abrir o `index.html` direto, mas o melhor é servir por HTTP:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## O que o site tem

- Hero com os carros em destaque trocando sozinhos, com parallax no mouse.
- Estoque com busca, filtros (carroceria, marca, combustível, câmbio, preço), ordenação e favoritos. Os cards se reorganizam com animação ao filtrar.
- Página de detalhes do carro (modal) com especificações, opcionais, parcela estimada, WhatsApp com mensagem já preenchida e agendamento de test-drive. Setas do teclado navegam entre os carros.
- Seção de rolagem animada ("o que vem com todo carro"), simulador de financiamento, formulário "quanto vale o seu carro", história da loja, depoimentos, mapa, horário com "aberto agora".
- Tema escuro e claro, responsivo e com respeito a `prefers-reduced-motion`.

## Painel do lojista (o botão no canto inferior esquerdo)

É a ferramenta de venda da demonstração. Com ele você mostra ao dono da loja o site dele funcionando:

- **Estoque:** marque um carro como vendido (ele sai do site com animação) ou mude o preço (atualiza em todo lugar).
- **Personalizar:** troque nome, cidade, WhatsApp e cor da marca. O site inteiro muda na hora.
- **Integração:** mostra o fluxo sistema da loja, conector, site, com botão "Sincronizar agora".

Também dá para abrir já personalizado por link, útil para mandar antes da reunião:

```
index.html?loja=Auto%20Center%20Silveira&cor=3b82f6&cidade=Canoas%2C%20RS&whats=51988887777
```

As alterações ficam salvas no navegador. "Restaurar" volta ao padrão.

## Como integrar com o sistema de estoque da loja

Todo o site lê os dados por um único ponto, `js/api.js`. Hoje ele lê `js/data/estoque.js` (dados de demonstração). Para a loja real:

1. Descubra de onde o estoque sai (API do sistema, planilha, feed XML ou JSON, exportação CSV).
2. Reescreva `API.listar()` em `js/api.js` para buscar essa fonte e devolver uma lista de veículos no mesmo formato de `js/data/estoque.js`. Nada mais no site precisa mudar.
3. Se a fonte exigir chave de acesso, o conector deve rodar num servidor pequeno (não no navegador) para não expor a chave.

Formato de cada veículo: `id`, `marca`, `modelo`, `versao`, `ano`, `anoModelo`, `km`, `preco`, `combustivel`, `cambio`, `carroceria` (Hatch, Sedã, SUV ou Picape), `cor {nome, hex}`, `motor`, `potencia`, `portas`, `opcionais[]`, `descricao`, `destaque`, `vendido`, `fotos[]`.

## Fotos

Os carros não têm foto ainda. Enquanto `fotos` estiver vazio, o site desenha uma ilustração de estúdio na cor do carro (`js/car-art.js`). Para usar fotos reais, coloque os arquivos (por exemplo em `assets/carros/<id>/1.jpg`) e preencha `fotos: ["assets/carros/tcross-highline-22/1.jpg"]`. A foto entra por cima da ilustração com transição, e se o arquivo falhar a ilustração continua lá.

## Antes de mostrar para um cliente

- Todos os dados (veículos, preços, quilometragem, depoimentos, endereço, telefone, números como "4.300 carros entregues") são fictícios. Troque pelos da loja ou use o Painel de personalização.
- O mapa usa OpenStreetMap em volta de um ponto de Porto Alegre. Ajuste `mapa` em `js/data/estoque.js` com a coordenada real.
- A simulação de financiamento usa uma taxa ilustrativa de 1,89% ao mês (`jurosMensal`).

## Estrutura

```
index.html            marcação de todas as seções
css/styles.css        tokens de tema, componentes e responsivo
js/app.js             comportamento: filtros, modal, simulador, painel, animações
js/api.js             camada de dados (ponto de integração)
js/data/estoque.js    loja e estoque de demonstração
js/car-art.js         ilustração de estúdio e carregamento de fotos
js/icons.js           ícones (Phosphor, MIT)
js/brands.js          logos de marcas (Simple Icons, CC0)
js/vendor/            GSAP, ScrollTrigger e Flip
assets/fonts/         Geist e Geist Mono (OFL)
```
