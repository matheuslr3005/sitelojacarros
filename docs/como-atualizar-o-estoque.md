# Como atualizar o estoque do site

O estoque do site vem de uma **planilha do Google**. Quem cuida da loja só mexe na planilha: o site lê ela sozinho e se atualiza em poucos minutos. Não precisa mexer no site, nem mandar nada para ninguém.

## O que acontece quando você mexe na planilha

| Você faz | O site faz |
| --- | --- |
| Adiciona uma linha | O carro aparece no estoque (e pode entrar no destaque da página inicial) |
| Troca o preço | O preço muda em todo lugar, inclusive na parcela estimada |
| Troca o status para **Vendido** | O carro sai do site |
| Troca o status para **Reservado** | O carro continua, com a etiqueta "Reservado" |
| Cola os links das fotos | As fotos aparecem na lista e na galeria do carro |

A atualização leva alguns minutos (o Google e o site guardam uma cópia por pouco tempo). Se a planilha ficar fora do ar, o site continua mostrando a última versão que leu.

## Colunas da planilha

A primeira linha tem os nomes das colunas (use o arquivo `planilha-modelo/estoque-modelo.csv` como ponto de partida). Só **Marca** e **Modelo** são obrigatórias. Quanto mais colunas preenchidas, mais completa fica a página do carro; coluna vazia simplesmente não aparece.

`Status` · `Destaque` · `Marca` · `Modelo` · `Versão` · `Ano` · `Ano modelo` · `Km` · `Preço` · `Combustível` · `Câmbio` · `Carroceria` · `Cor` · `Motor` · `Potência` · `Portas` · `Opcionais` · `Descrição` · `Selo` · `Fotos`

- **Status:** `Disponível`, `Reservado` ou `Vendido`. Em branco conta como disponível.
- **Destaque:** `Sim` ou `Não`. Os destaques aparecem primeiro na página inicial. Sem nenhum destaque, entram os carros mais novos.
- **Preço:** pode escrever `119900` ou `R$ 119.900,00`. Vazio mostra "Consulte" no site.
- **Carroceria:** Hatch, Sedã, SUV ou Picape (é por ela que o filtro funciona).
- **Opcionais:** separe por ponto e vírgula. Ex.: `Teto solar; Couro; Câmera de ré`.
- **Selo:** um texto curto que aparece no canto da foto, como `Único dono` ou `Blindado`.
- **Fotos:** cole os links separados por espaço ou por quebra de linha. A primeira foto é a capa.

## Fotos pelo Google Drive

1. Coloque as fotos numa pasta do Drive.
2. Em cada foto: botão direito, **Compartilhar**, e deixe como **"Qualquer pessoa com o link"** (pode ver).
3. **Copiar link** e cole na coluna Fotos. O site converte o link do Drive sozinho.

Prefira fotos na horizontal, de pelo menos 1200 pixels de largura. Fotos muito pesadas deixam o site lento.

## Configuração inicial (uma única vez)

1. No Google Sheets: **Arquivo, Importar, Upload** e escolha `planilha-modelo/estoque-modelo.csv`. Apague as linhas de exemplo e cadastre os carros.
2. Clique em **Compartilhar** e deixe como **"Qualquer pessoa com o link" pode ver**. Copie o link da planilha.
3. Para testar na hora: abra o site, clique em **Painel do lojista**, aba **Integração**, cole o link e clique em **Conectar planilha**. Isso vale só para o seu navegador.
4. Para valer para todo mundo: coloque o link no campo `planilha` do arquivo `js/data/estoque.js` e publique.

Dica: no Sheets, use **Dados, Validação de dados** nas colunas Status (lista: Disponível, Reservado, Vendido) e Destaque (Sim, Não) para evitar erro de digitação.
