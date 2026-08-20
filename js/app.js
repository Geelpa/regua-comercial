import { readCSVFile } from './parser.js';
import { renderTable, showEmptyState, initTableSort, applySorting, resetSortState } from './table.js';
import { copyFieldToClipboard } from './clipboard.js';
import { populateSelectOptions, filterData, resetAllFiltersState } from './filters.js';
import { updateKPIs, initKPICards, resetKPISelection } from './kpis.js';

let rawData = [];
let currentStageFilter = null;

const csvInput = document.getElementById('csvFile');
const clearBtn = document.getElementById('clearBtn');
const searchInput = document.getElementById('search');

// Inicializa a ordenação nos cabeçalhos da tabela
initTableSort(() => applyFiltersAndRender());

initKPICards((selectedStage) => {
  currentStageFilter = selectedStage;
  applyFiltersAndRender();
});

csvInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    rawData = await readCSVFile(file);
    if (rawData.length > 0) {
      populateSelectOptions(rawData, applyFiltersAndRender);
      updateKPIs(rawData);
      applyFiltersAndRender();
    } else {
      showEmptyState('O arquivo fornecido está vazio ou é inválido.');
    }
  } catch (err) {
    showEmptyState('Erro ao tentar processar o arquivo CSV.');
  }
});

function applyFiltersAndRender() {
  const filtered = filterData(rawData, currentStageFilter);
  const sorted = applySorting(filtered);
  renderTable(sorted, copyFieldToClipboard);
}

if (searchInput) {
  searchInput.addEventListener('input', applyFiltersAndRender);
}

clearBtn.addEventListener('click', () => {
  rawData = [];
  currentStageFilter = null;
  csvInput.value = '';
  if (searchInput) searchInput.value = '';
  resetAllFiltersState();
  resetSortState();
  resetKPISelection();
  updateKPIs([]);
  showEmptyState();
});