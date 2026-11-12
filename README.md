# Alfa Multimarcas RS (proposta de site)

Proposta de site para a Alfa Multimarcas RS (Instagram @alfa_multimarcasrs), feita a partir do logo, do nome e das informações do perfil. É HTML, CSS e JavaScript puros, sem instalar nada. O estoque, os preços e os dados de contato que aparecem são **exemplos** e precisam ser trocados pelos reais.

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
| Sobre nós | Quem é a loja (novos e usados, mais de 10 anos, financiamento em até 60x) e link para o Instagram |
| Contato | Endereço, telefone, horários, "aberto agora", Instagram e WhatsApp. O mapa só aparece quando `mapa` tiver as coordenadas reais |

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

## Estoque por planilha (sem manutenção manual)

A loja cadastra os carros numa **planilha do Google** e o site lê ela sozinho (a cada 5 minutos e ao voltar para a aba). Preço, carro vendido, fotos e carros novos se atualizam sem mexer no site. Guia para quem cuida da loja: [`docs/como-atualizar-o-estoque.md`](docs/como-atualizar-o-estoque.md). Planilha modelo para importar: `planilha-modelo/estoque-modelo.csv`.

- **Testar na hora:** Painel do lojista, aba Integração, colar o link da planilha e "Conectar planilha" (fica só no navegador de quem testou).
- **Valer para todos:** preencher `planilha` em `js/data/estoque.js` (bloco `LOJA`). Com o campo vazio, o site usa os dados de demonstração.
- **Proteções:** se a planilha cair ou o link estiver errado, o site mostra a última cópia boa e avisa no Painel. Carro sem preço mostra "Consulte". Fotos do Google Drive viram imagem direta.
- **Código:** `js/sheet.js` lê e converte a planilha, `js/api.js` escolhe a fonte (planilha ou demonstração).

Para ligar a um sistema de estoque ou CRM no futuro, basta reescrever `listar()` em `js/api.js` para devolver os veículos no mesmo formato (`id`, `marca`, `modelo`, `versao`, `ano`, `anoModelo`, `km`, `preco`, `combustivel`, `cambio`, `carroceria`, `motor`, `potencia`, `portas`, `opcionais[]`, `descricao`, `selo`, `destaque`, `vendido`, `fotos[]`). Se a fonte exigir chave de acesso, o conector deve rodar num servidor pequeno e não no navegador.

## Identidade da Alfa

Logo em `assets/logo-alfa.png` (recortado do perfil do Instagram), vermelho `#EA202D` como cor de destaque, nav e rodapé pretos. Os textos usam só o que o perfil diz: novos e usados, variedade de estoque, mais de 10 anos no mercado e financiamento em até 60x. Números, depoimentos e promessas que não estão no perfil foram removidos.

Dados que precisam ser confirmados com o cliente em `js/data/estoque.js` (bloco `LOJA`): endereço, telefone, WhatsApp, e-mail, horários e coordenadas do mapa. Dá para preencher ao vivo no Painel do lojista (aba Personalizar). Se o nome for trocado no Painel, o logo da Alfa some sozinho.

## Antes de mostrar para um cliente

- Veículos, preços, quilometragens, endereço, telefone, WhatsApp e horários são exemplos. Troque pelos da loja ou use o Painel de personalização.
- O mapa fica escondido até `mapa` receber as coordenadas reais da loja em `js/data/estoque.js`.
- A simulação de financiamento usa taxa ilustrativa de 1,89% ao mês (`jurosMensal`) e o texto da página de Financiamento é genérico ("principais bancos"). Ajuste ao que a loja realmente trabalha.

## Estilo visual

Página clara com navegação e rodapé pretos, acento vermelho da marca (trocável), botões e filtros em paralelogramo inclinado, cards quadrados com fio de cor sob a foto. Fontes: Raleway e Michroma.

## Estrutura

```
index.html            todas as páginas (uma <div class="page"> por rota)
css/styles.css        tokens de tema, componentes e responsivo
js/app.js             rotas, filtros, página do veículo, simulador, painel, animações
js/api.js             camada de dados (planilha ou demonstração)
js/sheet.js           leitor da planilha do Google (CSV)
planilha-modelo/      planilha modelo para importar no Google Sheets
docs/                 guia de uso para a loja
js/data/estoque.js    loja e estoque de demonstração, com as fotos
js/photos.js          carregamento das fotos, com troca automática para a próxima
js/icons.js           ícones (Phosphor, MIT)
js/brands.js          logos de marcas (Simple Icons, CC0)
js/vendor/            GSAP, ScrollTrigger e Flip
assets/fonts/         Raleway, Michroma e Geist Mono (OFL)
```
