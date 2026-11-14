# Dashboard de análise de vendas

Dashboard interativo para explorar faturamento por mês, categoria e região. A demonstração inicial usa 200 vendas fictícias de janeiro a dezembro de 2025. Ela é apenas demonstrativa e não representa os resultados da base original de hamburgueria.

## Abrir

Abra `public/index.html` diretamente no navegador. A amostra inicial está incorporada no JavaScript, então a página não precisa buscar o CSV local. O navegador precisa de internet para carregar Chart.js 4.4.7 e Papa Parse 5.4.1 pelos CDNs jsDelivr; a importação e a exportação leem arquivos localmente no navegador.

## Usar seus dados

Escolha **Importar CSV** e selecione um arquivo no computador. A leitura ocorre no navegador e o arquivo não é enviado a um servidor. O CSV precisa ter os cabeçalhos `id_venda,data,produto,categoria,regiao,quantidade,preco_unitario`; datas `AAAA-MM-DD` (ou `DD/MM/AAAA`) e valores numéricos sem símbolo de moeda. Campos de produto, categoria ou região vazios são apresentados como “Não informado”. Linhas com identificador ausente, data inválida ou quantidade/preço ausente, inválido ou negativo são descartadas, com a contagem informada na página. Colunas adicionais são ignoradas. O projeto original `vendas_hamburgueria.csv` foi preservado; sua estrutura não contém região, então não serve diretamente à comparação regional sem uma coluna `regiao`.

Use os campos de data, categoria e região para filtrar. A busca da tabela também restringe os indicadores e os gráficos. Clique nos títulos das colunas para ordenar. **Exportar CSV** baixa o conjunto atualmente filtrado e pesquisado. **Limpar filtros** limpa datas, categorias, regiões e pesquisa.

## Dados e fórmulas

`public/dados-exemplo.csv` contém 200 vendas demonstrativas, uma por produto vendido, com datas ao longo de 12 meses. A amostra incorporada no JavaScript corresponde a esse arquivo e é carregada ao abrir a página.

- Faturamento por linha = quantidade × preço unitário.
- Faturamento total = soma do faturamento por linha no conjunto exibido.
- Quantidade de vendas = quantidade de `id_venda` únicos no conjunto exibido.
- Unidades vendidas = soma das quantidades no conjunto exibido.
- Ticket médio = faturamento total ÷ quantidade de vendas; quando não há vendas, o valor é R$ 0,00.

Linhas repetidas são mantidas, pois cada registro representa a venda de um produto; o indicador de vendas conta identificadores únicos. Números zero são aceitos e diferentes de valores ausentes ou inválidos.

## Publicar no Render

Envie esta pasta como raiz do repositório GitHub (ou coloque seu conteúdo na raiz do repositório). No Render, crie um serviço **Static Site** conectado ao repositório e configure:

- **Branch:** a branch que contém o projeto.
- **Root Directory:** vazio.
- **Build Command:** `echo "Site pronto"`
- **Publish Directory:** `public`.

Depois, clique em **Create Static Site**. O site publicado também precisa de internet para baixar Chart.js e Papa Parse pelos CDNs.
