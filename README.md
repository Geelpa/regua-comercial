# Resgate VPU — MVP v2

Aplicação estática para acompanhamento da régua de resgate.

## Estrutura

- `index.html` — estrutura da página
- `css/styles.css` — identidade visual e estilos próprios
- `js/app.js` — inicialização e coordenação
- `js/csv.js` — leitura e tratamento do CSV
- `js/dates.js` — regras de datas e régua
- `js/filters.js` — filtros e seleção
- `js/clipboard.js` — copiar nome/contato
- `js/ui.js` — renderização da interface
- `exemplo.csv` — base de teste

## Régua

D+3, D+7, D+30, D+60, D+90, D+180, D+330, D+360 e D+375.

Cada opção vale a partir do seu marco até o marco seguinte. A opção D+375 vale
também para os dias posteriores; registros com menos de 3 dias não entram na régua.

## CSV

Campos iniciais:

`id,nome,canal_de_venda,campanha,contato,endereco`

A aplicação aceita CSV separado por vírgula ou ponto e vírgula.

## Persistência

Não há banco, localStorage ou backend. Os dados existem apenas durante a sessão da página.
