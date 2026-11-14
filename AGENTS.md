# Orientações do projeto

## Objetivo

Criar dashboards interativos para análise exploratória de dados, com visual profissional e ferramentas simples. O projeto é usado por alunos iniciantes e deve ser fácil de entender, executar e modificar.

## Tecnologias e execução

- Use HTML, CSS e JavaScript puro, sem React, backend, banco de dados ou ferramentas de compilação.
- Use Chart.js para gráficos e Papa Parse para importar CSV. Carregue as bibliotecas por CDN com versões fixadas e explique no README que elas exigem internet.
- O dashboard deve funcionar ao abrir `public/index.html` diretamente no navegador. Mantenha a amostra inicial incorporada no JavaScript; não use `fetch` para ler o CSV local.
- Para importar CSV, use um seletor de arquivo e faça a leitura local no navegador.
- Preserve os arquivos originais fornecidos pelo usuário.

## Estrutura

- `AGENTS.md` e `README.md` na raiz do projeto.
- `public/index.html`: estrutura da página.
- `public/styles.css`: aparência e adaptação para diferentes telas.
- `public/script.js`: importação, tratamento, filtros, cálculos e gráficos.
- `public/dados-exemplo.csv`: base demonstrativa correspondente à amostra incorporada.

## Interface e apresentação

- Escreva em português do Brasil, com valores monetários em reais, rótulos claros e navegação por teclado.
- Use fundo claro, cores consistentes, bom contraste, tipografia legível e espaçamento confortável.
- Organize a página com título, filtros, cartões de indicadores, gráficos e tabela.
- Adapte o layout para computador e celular.
- Inclua títulos, unidades e legendas nos gráficos. Evite elementos decorativos que atrapalhem a leitura.

## Interatividade

- Todos os filtros devem atualizar indicadores, gráficos e tabela de forma consistente.
- Inclua botões para limpar filtros e exportar os dados filtrados em CSV.
- Exiba a quantidade de registros após a filtragem e mostre uma mensagem clara quando nenhum registro corresponder.
- Permita pesquisar e ordenar a tabela.

## Qualidade da análise

- Examine as colunas e os tipos de dados antes de escolher indicadores e gráficos.
- Diferencie valores ausentes de valores iguais a zero.
- Valide datas e números; informe quantos registros foram descartados e por quê.
- Não remova duplicatas sem verificar o significado de cada linha.
- Não invente relações de causa e efeito. Identifique claramente os dados fictícios usados na demonstração.
- Calcule os indicadores a partir dos dados e documente suas fórmulas.
- Use linhas para evolução temporal e barras para comparações entre categorias.
- Formate números, datas e moedas conforme o padrão brasileiro.

## Simplicidade e aprendizado

- Escreva código legível, com funções pequenas e nomes claros.
- Comente as partes que ajudam a entender cálculos e interações.
- Explique decisões importantes em linguagem acessível.
- Para escolhas visuais comuns, adote uma solução coerente e prossiga.

## Verificação e entrega

- Confira os cálculos usando uma pequena amostra com resultados conhecidos.
- Verifique importação de CSV, filtros combinados, limpeza dos filtros, exportação e ausência de resultados.
- Confira a aparência em telas grandes e pequenas quando houver navegador disponível.
- Informe o que foi verificado e qualquer limitação que permaneça.
- No README, explique como abrir, importar uma base própria e publicar no Render como Static Site.
