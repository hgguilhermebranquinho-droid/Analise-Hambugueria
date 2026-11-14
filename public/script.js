/*
 * A amostra abaixo é gerada deterministicamente e também está em dados-exemplo.csv.
 * Manter o gerador aqui permite abrir index.html como arquivo local, sem fetch.
 */
const DEMO_PRODUCTS = [
  [
    { produto: 'X-Burger', preco_unitario: 25.9 },
    { produto: 'X-Salada', preco_unitario: 29.9 },
    { produto: 'X-Bacon', preco_unitario: 32.9 },
  ],
  [
    { produto: 'Refrigerante', preco_unitario: 7.5 },
    { produto: 'Suco natural', preco_unitario: 10 },
    { produto: 'Água mineral', preco_unitario: 4.5 },
  ],
  [
    { produto: 'Batata frita', preco_unitario: 14.9 },
    { produto: 'Onion rings', preco_unitario: 17.9 },
  ],
  [
    { produto: 'Brownie', preco_unitario: 12 },
    { produto: 'Milkshake', preco_unitario: 16.9 },
  ],
];
const DEMO_CATEGORIES = ['Lanches', 'Bebidas', 'Acompanhamentos', 'Sobremesas'];
const DEMO_REGIONS = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];

function createDemoRows() {
  return Array.from({ length: 200 }, (_, index) => {
    const month = (index * 7) % 12;
    const day = ((index * 11) % 28) + 1;
    const categoryIndex = (index * 13 + Math.floor(index / 9)) % DEMO_CATEGORIES.length;
    const productIndex = (index * 3 + Math.floor(index / 5)) % DEMO_PRODUCTS[categoryIndex].length;
    const product = DEMO_PRODUCTS[categoryIndex][productIndex];
    return {
      id_venda: `VD-${String(index + 1).padStart(4, '0')}`,
      data: `2025-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      produto: product.produto,
      categoria: DEMO_CATEGORIES[categoryIndex],
      regiao: DEMO_REGIONS[(index * 3 + Math.floor(index / 7)) % DEMO_REGIONS.length],
      quantidade: 1 + ((index * 5 + month * 2 + Math.floor(index / 11)) % 5),
      preco_unitario: product.preco_unitario,
    };
  });
}

const DEMO_ROWS = createDemoRows();
const moneyFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const charts = { monthly: null, category: null, region: null };
let allRows = DEMO_ROWS;
let visibleRows = [];
let isDemo = true;
let sortState = { key: 'data', direction: -1 };

const elements = {
  dateFrom: document.getElementById('date-from'),
  dateTo: document.getElementById('date-to'),
  category: document.getElementById('category-filter'),
  region: document.getElementById('region-filter'),
  search: document.getElementById('table-search'),
  rows: document.getElementById('sales-rows'),
  noResults: document.getElementById('no-results'),
  count: document.getElementById('record-count'),
  totalRevenue: document.getElementById('total-revenue'),
  totalSales: document.getElementById('total-sales'),
  totalUnits: document.getElementById('total-units'),
  averageTicket: document.getElementById('average-ticket'),
  status: document.getElementById('status-message'),
  source: document.getElementById('data-source'),
  demoBadge: document.querySelector('.demo-badge'),
  csvFile: document.getElementById('csv-file'),
};

function formatMoney(value) {
  return moneyFormat.format(Number.isFinite(value) ? value : 0);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function normalizeText(value) {
  return String(value ?? '').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseDate(value) {
  const text = String(value ?? '').trim();
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const [, year, month, day] = match;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (date.getUTCFullYear() === Number(year) && date.getUTCMonth() + 1 === Number(month) && date.getUTCDate() === Number(day)) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (date.getUTCFullYear() === Number(year) && date.getUTCMonth() + 1 === Number(month) && date.getUTCDate() === Number(day)) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  return null;
}

function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  let text = String(value ?? '').trim().replace(/\s/g, '').replace(/R\$/gi, '').replace(/[^\d,.-]/g, '');
  if (!text || !/\d/.test(text)) return null;
  const comma = text.lastIndexOf(',');
  const dot = text.lastIndexOf('.');
  if (comma !== -1 && dot !== -1) {
    const decimalSeparator = comma > dot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    text = text.split(thousandsSeparator).join('');
    if (decimalSeparator === ',') text = text.replace(',', '.');
  } else if (comma !== -1) {
    text = text.replace(',', '.');
  }
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function setStatus(message, kind = 'info') {
  elements.status.textContent = message;
  elements.status.className = `status-message${kind === 'error' ? ' error' : kind === 'info' ? ' info' : ''}`;
  elements.status.hidden = !message;
}

function setOptions(select, values, defaultText) {
  const selected = select.value;
  const options = [...new Set(values)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  select.innerHTML = `<option value="">${escapeHtml(defaultText)}</option>${options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}`;
  if (options.includes(selected)) select.value = selected;
}

function refreshOptions() {
  setOptions(elements.category, allRows.map((row) => row.categoria), 'Todas as categorias');
  setOptions(elements.region, allRows.map((row) => row.regiao), 'Todas as regiões');
}

function getFilteredRows() {
  const from = elements.dateFrom.value;
  const to = elements.dateTo.value;
  const category = elements.category.value;
  const region = elements.region.value;
  const search = normalizeText(elements.search.value);
  return allRows.filter((row) => {
    if (from && row.data < from) return false;
    if (to && row.data > to) return false;
    if (category && row.categoria !== category) return false;
    if (region && row.regiao !== region) return false;
    if (search) {
      const searchable = normalizeText([
        row.id_venda, row.data, row.produto, row.categoria, row.regiao,
        row.quantidade, row.preco_unitario, row.quantidade * row.preco_unitario,
      ].join(' '));
      if (!searchable.includes(search)) return false;
    }
    return true;
  });
}

function calculateMetrics(rows) {
  const revenue = rows.reduce((sum, row) => sum + row.quantidade * row.preco_unitario, 0);
  const salesCount = new Set(rows.map((row) => row.id_venda)).size;
  const units = rows.reduce((sum, row) => sum + row.quantidade, 0);
  return { revenue, salesCount, units, averageTicket: salesCount ? revenue / salesCount : 0 };
}

function aggregateRevenue(rows, keyFunction) {
  const totals = new Map();
  rows.forEach((row) => {
    const key = keyFunction(row);
    totals.set(key, (totals.get(key) || 0) + row.quantidade * row.preco_unitario);
  });
  return totals;
}

function sortedTableRows(rows) {
  const { key, direction } = sortState;
  return [...rows].sort((left, right) => {
    let comparison;
    if (key === 'faturamento') {
      comparison = left.quantidade * left.preco_unitario - right.quantidade * right.preco_unitario;
    } else if (key === 'quantidade' || key === 'preco_unitario') {
      comparison = left[key] - right[key];
    } else if (key === 'data') {
      comparison = left.data.localeCompare(right.data);
    } else {
      comparison = left[key].localeCompare(right[key], 'pt-BR', { numeric: true, sensitivity: 'base' });
    }
    return comparison * direction;
  });
}

function renderTable(rows) {
  const sortedRows = sortedTableRows(rows);
  elements.rows.innerHTML = sortedRows.map((row) => `
    <tr>
      <td>${escapeHtml(row.id_venda)}</td>
      <td>${escapeHtml(row.data.split('-').reverse().join('/'))}</td>
      <td>${escapeHtml(row.produto)}</td>
      <td>${escapeHtml(row.categoria)}</td>
      <td>${escapeHtml(row.regiao)}</td>
      <td class="number-cell">${numberFormat.format(row.quantidade)}</td>
      <td class="number-cell">${formatMoney(row.preco_unitario)}</td>
      <td class="number-cell">${formatMoney(row.quantidade * row.preco_unitario)}</td>
    </tr>`).join('');
  elements.noResults.hidden = rows.length > 0;
  elements.count.textContent = `${numberFormat.format(rows.length)} ${rows.length === 1 ? 'registro exibido' : 'registros exibidos'}`;
  document.querySelectorAll('th[data-sort], thead th').forEach((header) => {
    const button = header.querySelector('button[data-sort]');
    if (!button) return;
    const active = button.dataset.sort === sortState.key;
    header.setAttribute('aria-sort', active ? (sortState.direction === 1 ? 'ascending' : 'descending') : 'none');
    button.querySelector('span').textContent = active ? (sortState.direction === 1 ? '↑' : '↓') : '';
  });
}

function showChartEmpty(chartName, empty, hasData) {
  const canvas = document.getElementById(`${chartName}-chart`);
  const emptyMessage = document.getElementById(`${chartName}-empty`);
  if (charts[chartName]) {
    charts[chartName].destroy();
    charts[chartName] = null;
  }
  canvas.hidden = !hasData;
  emptyMessage.hidden = hasData;
  return canvas;
}

function chartColor(variable) {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

function chartOptions(tooltipLabel) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: chartColor('--chart-tooltip'),
        titleColor: chartColor('--parchment'),
        bodyColor: chartColor('--parchment'),
        borderColor: chartColor('--chart-tooltip-border'),
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const value = context.chart.options.indexAxis === 'y' ? context.parsed.x : context.parsed.y;
            return ` ${tooltipLabel}: ${formatMoney(value)}`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: chartColor('--parchment-muted'), font: { family: 'DM Sans', size: 10 }, maxRotation: 0, autoSkip: true } },
      y: {
        beginAtZero: true,
        grid: { color: chartColor('--chart-grid'), drawBorder: false },
        border: { display: false },
        ticks: { color: chartColor('--parchment-muted'), font: { family: 'DM Sans', size: 10 }, callback: (value) => new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value) },
      },
    },
  };
}

function renderCharts(rows) {
  if (typeof Chart === 'undefined') {
    setStatus('Os dados estão disponíveis, mas os gráficos precisam de internet para carregar Chart.js.', 'info');
    return;
  }

  const byMonth = aggregateRevenue(rows, (row) => row.data.slice(0, 7));
  const monthKeys = [...byMonth.keys()].sort();
  const monthCanvas = showChartEmpty('monthly', null, monthKeys.length > 0);
  if (monthKeys.length) {
    const labels = monthKeys.map((month) => monthFormat.format(new Date(`${month}-01T00:00:00Z`)));
    charts.monthly = new Chart(monthCanvas, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Faturamento', data: monthKeys.map((month) => byMonth.get(month)), borderColor: chartColor('--chart-gold'), backgroundColor: chartColor('--chart-fill'), fill: true, tension: .35, borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 5, pointBackgroundColor: chartColor('--parchment'), pointBorderColor: chartColor('--chart-gold'), pointBorderWidth: 2 }] },
      options: chartOptions('Faturamento'),
    });
  }

  const byCategory = aggregateRevenue(rows, (row) => row.categoria);
  const categoryEntries = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const categoryCanvas = showChartEmpty('category', null, categoryEntries.length > 0);
  if (categoryEntries.length) {
    const options = chartOptions('Faturamento');
    options.indexAxis = 'y';
    options.scales.x = { ...options.scales.y, title: { display: false } };
    options.scales.y = { grid: { display: false }, border: { display: false }, ticks: { color: chartColor('--parchment-muted'), font: { family: 'DM Sans', size: 10 } } };
    charts.category = new Chart(categoryCanvas, {
      type: 'bar',
      data: { labels: categoryEntries.map(([name]) => name), datasets: [{ label: 'Faturamento', data: categoryEntries.map(([, amount]) => amount), backgroundColor: ['--red-ochre', '--chart-orange', '--dark-orange', '--orange', '--chart-gold', '--chart-red'].map(chartColor), borderRadius: 2, maxBarThickness: 23 }] },
      options,
    });
  }

  const byRegion = aggregateRevenue(rows, (row) => row.regiao);
  const regionEntries = [...byRegion.entries()].sort((a, b) => b[1] - a[1]);
  const regionCanvas = showChartEmpty('region', null, regionEntries.length > 0);
  if (regionEntries.length) {
    charts.region = new Chart(regionCanvas, {
      type: 'bar',
      data: { labels: regionEntries.map(([name]) => name), datasets: [{ label: 'Faturamento', data: regionEntries.map(([, amount]) => amount), backgroundColor: chartColor('--chart-orange'), borderRadius: 5, maxBarThickness: 48 }] },
      options: chartOptions('Faturamento'),
    });
  }
}

function render() {
  visibleRows = getFilteredRows();
  const metrics = calculateMetrics(visibleRows);
  elements.totalRevenue.textContent = formatMoney(metrics.revenue);
  elements.totalSales.textContent = numberFormat.format(metrics.salesCount);
  elements.totalUnits.textContent = numberFormat.format(metrics.units);
  elements.averageTicket.textContent = formatMoney(metrics.averageTicket);
  renderTable(visibleRows);
  renderCharts(visibleRows);
}

function readHeaderMap(fields) {
  return new Map(fields.map((field) => [String(field).replace(/^\uFEFF/, '').trim().toLocaleLowerCase('pt-BR'), field]));
}

function validateImportedRows(parsedRows, fields) {
  const required = ['id_venda', 'data', 'produto', 'categoria', 'regiao', 'quantidade', 'preco_unitario'];
  const headerMap = readHeaderMap(fields);
  const missingHeaders = required.filter((column) => !headerMap.has(column));
  if (missingHeaders.length) return { error: `Colunas obrigatórias ausentes: ${missingHeaders.join(', ')}.` };

  const stats = { discarded: 0, missingId: 0, invalidDate: 0, invalidNumber: 0 };
  const rows = [];
  parsedRows.forEach((source) => {
    const value = (column) => source[headerMap.get(column)];
    const id = String(value('id_venda') ?? '').trim();
    const date = parseDate(value('data'));
    const quantity = parseNumber(value('quantidade'));
    const unitPrice = parseNumber(value('preco_unitario'));
    let valid = true;
    if (!id) { stats.missingId += 1; valid = false; }
    if (!date) { stats.invalidDate += 1; valid = false; }
    if (quantity === null || unitPrice === null || quantity < 0 || unitPrice < 0) { stats.invalidNumber += 1; valid = false; }
    if (!valid) { stats.discarded += 1; return; }
    rows.push({
      id_venda: id,
      data: date,
      produto: String(value('produto') ?? '').trim() || 'Não informado',
      categoria: String(value('categoria') ?? '').trim() || 'Não informado',
      regiao: String(value('regiao') ?? '').trim() || 'Não informado',
      quantidade: quantity,
      preco_unitario: unitPrice,
    });
  });
  return { rows, stats };
}

function importCsv(file) {
  if (typeof Papa === 'undefined') {
    setStatus('Não foi possível carregar Papa Parse. Confira a conexão com a internet e recarregue a página.', 'error');
    return;
  }
  Papa.parse(file, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
    complete(result) {
      const parsed = validateImportedRows(result.data, result.meta.fields || []);
      if (parsed.error) {
        setStatus(parsed.error, 'error');
        return;
      }
      if (!parsed.rows.length) {
        setStatus('O CSV não contém registros válidos. A base atual foi mantida.', 'error');
        return;
      }
      allRows = parsed.rows;
      isDemo = false;
      elements.dateFrom.value = '';
      elements.dateTo.value = '';
      elements.category.value = '';
      elements.region.value = '';
      elements.search.value = '';
      sortState = { key: 'data', direction: -1 };
      refreshOptions();
      elements.demoBadge.innerHTML = '<span aria-hidden="true">●</span> CSV importado';
      elements.source.textContent = `${numberFormat.format(allRows.length)} registros importados`;
      render();
      const parserWarning = result.errors.length ? ` Papa Parse sinalizou ${result.errors.length} problema(s) de leitura.` : '';
      const { discarded, missingId, invalidDate, invalidNumber } = parsed.stats;
      const quality = discarded
        ? ` Descartadas ${discarded} linha(s): ${missingId} sem ID, ${invalidDate} com data inválida e ${invalidNumber} com quantidade/preço inválido ou ausente.`
        : ' Nenhuma linha foi descartada.';
      setStatus(`${numberFormat.format(allRows.length)} registros válidos carregados.${quality}${parserWarning}`, parserWarning ? 'info' : 'success');
    },
    error(error) {
      setStatus(`Falha ao ler o CSV: ${error.message || 'arquivo inválido'}.`, 'error');
    },
  });
}

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function exportCsv() {
  if (!visibleRows.length) {
    setStatus('Não há registros para exportar neste recorte.', 'error');
    return;
  }
  const headers = ['id_venda', 'data', 'produto', 'categoria', 'regiao', 'quantidade', 'preco_unitario', 'faturamento'];
  const lines = [headers.join(','), ...sortedTableRows(visibleRows).map((row) => [
    row.id_venda, row.data, row.produto, row.categoria, row.regiao,
    row.quantidade, row.preco_unitario, row.quantidade * row.preco_unitario,
  ].map(csvCell).join(','))];
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'vendas-filtradas.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.getElementById('import-button').addEventListener('click', () => elements.csvFile.click());
elements.csvFile.addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (file) importCsv(file);
  event.target.value = '';
});
document.getElementById('clear-filters').addEventListener('click', () => {
  elements.dateFrom.value = '';
  elements.dateTo.value = '';
  elements.category.value = '';
  elements.region.value = '';
  elements.search.value = '';
  render();
  setStatus('Filtros e pesquisa removidos.', 'success');
});
document.getElementById('export-button').addEventListener('click', exportCsv);
[elements.dateFrom, elements.dateTo, elements.category, elements.region].forEach((input) => input.addEventListener('change', render));
elements.search.addEventListener('input', render);
document.querySelectorAll('button[data-sort]').forEach((button) => button.addEventListener('click', () => {
  const key = button.dataset.sort;
  sortState = { key, direction: sortState.key === key ? -sortState.direction : 1 };
  render();
}));

refreshOptions();
render();
