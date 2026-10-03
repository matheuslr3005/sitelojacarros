# Preguinho Veículos (site de demonstração para lojas de carros)

Site para apresentar a donos de lojas de carros que ainda não têm site, ou cujo site está desatualizado. A loja que aparece ("Preguinho Veículos") é fictícia e serve de vitrine do modelo. É HTML, CSS e JavaScript puros, sem instalar nada.

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Abra por um servidor como acima (ou por qualquer hospedagem estática). As fotos dos carros vêm da internet, então é preciso estar online.

## Páginas

Cada item do menu abre a sua própria página (não é uma rolagem contínua):

| Página | O que tem |
| --- | --- |
| Início | Hero em tela cheia (modelo, marca e ano, sem preço), faixa de diferenciais, marcas, carros em destaque, "o que vem com todo carro" e chamada para vender |
| Estoque | Busca, filtros (marca, carroceria e, em "Filtro avançado", combustível, câmbio e preço), ordenação e favoritos |
| Veículo | Abre ao clicar num carro: galeria de fotos, preço, parcela, ficha técnica, opcionais, descrição, WhatsApp e outros carros |
| Financiamento | Texto sobre taxas, prazos, entrada e bancos, mais o simulador de parcela |
| Venda | Formulário completo (dados pessoais e do veículo) que monta a mensagem para o WhatsApp |
| Sobre nós | História da loja, números e depoimentos |
| Contato | Endereço, horários, "aberto agora", WhatsApp e mapa |

## O hero se monta sozinho (sem manutenção)

O hero da página inicial não tem nada digitado à mão: ele é montado a partir do estoque. Mostra até 6 modelos diferentes, só os que têm foto, com **marca, modelo e ano e sem preço** (por isso não envelhece quando o preço muda). Quem estiver marcado como `destaque` no cadastro vem primeiro; sem isso, entram os mais novos. Carro vendido sai sozinho.

O site também busca o estoque de novo a cada 5 minutos e sempre que a pessoa volta para a aba. Se algo mudou na fonte de dados (preço, vendido, carro novo), estoque, hero e destaques se reorganizam sem recarregar a página. Ligando `js/api.js` ao sistema da loja, ninguém precisa atualizar o site à mão.

A faixa logo abaixo do hero (laudo cautelar, garantia, financiamento, troca) é texto fixo em `index.html`.

## Fotos

Os carros usam fotos reais do Wikimedia Commons (licenças Creative Commons), carregadas direto da internet. **São de modelos parecidos, não do carro exato do estoque**, e servem só para a demonstração. Antes de usar com um cliente, troque pelas fotos da própria loja.

Cada veículo tem uma lista `fotos` em `js/data/estoque.js`. O site usa a primeira que carregar, e as demais aparecem na galeria da página do veículo. Para usar fotos da loja, coloque os arquivos em `assets/carros/<id>/` e escreva `fotos: ["assets/carros/tcross-highline-22/1.jpg", "..."]`. Se nenhuma foto carregar, aparece um quadro neutro com "Foto em breve".

## Painel do lojista (botão no canto inferior esquerdo)

Ferramenta de venda da demonstração:

- **Estoque:** marque um carro como vendido (ele sai do site) ou mude o preço.
- **Personalizar:** troque nome, cidade, WhatsApp e cor da marca e o site inteiro muda na hora.
- **Integração:** mostra o fluxo sistema da loja, conector, site, com botão "Sincronizar agora".

Também dá para abrir já personalizado por link: `index.html?loja=Auto%20Center%20Silveira&cor=3b82f6&cidade=Canoas%2C%20RS&whats=51988887777`. As alterações ficam salvas no navegador.

## Como integrar com o sistema de estoque da loja

Todo o site lê os dados por um único ponto, `js/api.js`. Hoje ele lê `js/data/estoque.js` (dados de demonstração). Para a loja real, reescreva `API.listar()` para buscar do sistema dela (API, planilha, XML, JSON ou CSV) e devolver os veículos no mesmo formato. Nada no layout muda. Se a fonte exigir chave de acesso, o conector deve rodar num servidor pequeno e não no navegador.

Formato de cada veículo: `id`, `marca`, `modelo`, `versao`, `ano`, `anoModelo`, `km`, `preco`, `combustivel`, `cambio`, `carroceria`, `motor`, `potencia`, `portas`, `opcionais[]`, `descricao`, `destaque`, `vendido`, `fotos[]` e, opcional, `selo` (texto no canto da foto, ex.: "Blindado").

## Antes de mostrar para um cliente

- Veículos, preços, quilometragens, depoimentos, endereço, telefone e números como "4.300 carros entregues" são fictícios. Troque pelos da loja ou use o Painel de personalização.
- O mapa usa OpenStreetMap em volta de um ponto de Porto Alegre. Ajuste `mapa` em `js/data/estoque.js`.
- A simulação de financiamento usa taxa ilustrativa de 1,89% ao mês (`jurosMensal`) e o texto da página de Financiamento é genérico ("principais bancos"). Ajuste ao que a loja realmente trabalha.

## Estilo visual

Página clara com navegação e rodapé cinza, acento âmbar (trocável), botões e filtros em paralelogramo inclinado, cards quadrados com fio de cor sob a foto. Fontes: Raleway e Michroma.

## Estrutura

```
index.html            todas as páginas (uma <div class="page"> por rota)
css/styles.css        tokens de tema, componentes e responsivo
js/app.js             rotas, filtros, página do veículo, simulador, painel, animações
js/api.js             camada de dados (ponto de integração)
js/data/estoque.js    loja e estoque de demonstração, com as fotos
js/photos.js          carregamento das fotos, com troca automática para a próxima
js/icons.js           ícones (Phosphor, MIT)
js/brands.js          logos de marcas (Simple Icons, CC0)
js/vendor/            GSAP, ScrollTrigger e Flip
assets/fonts/         Raleway, Michroma e Geist Mono (OFL)
```
