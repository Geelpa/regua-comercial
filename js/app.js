import { parseCSV } from './csv.js';
import { populateSelectOptions, filterData, resetAllFilters } from './filters.js';
import { updateKPICounts, getEffectiveDateStr } from './regua.js';
import { renderTable } from './table.js';
import { calculateClientScore } from './score.js';

let rawData = [];
let currentStage = null;
let currentSort = { column: 'Score', direction: 'desc' };

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

function setupEventListeners() {
  // Importação de arquivo CSV
  const csvFileInput = document.getElementById('csvFile');
  if (csvFileInput) {
    csvFileInput.addEventListener('change', handleCSVImport);
  }

  // Busca textual
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyFiltersAndRender();
    });
  }

  // Faixa de Score
  const scoreRangeSelect = document.getElementById('scoreRange');
  if (scoreRangeSelect) {
    scoreRangeSelect.addEventListener('change', () => {
      applyFiltersAndRender();
    });
  }

  // Botão Limpar Filtros
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      resetAllFilters();
      currentStage = null;
      updateStageActiveUI(null);
      applyFiltersAndRender();
    });
  }

  // Cards da Régua KPI
  const kpiCards = document.querySelectorAll('.kpi-card');
  kpiCards.forEach(card => {
    card.addEventListener('click', () => {
      const stage = parseInt(card.dataset.stage, 10);
      currentStage = (currentStage === stage) ? null : stage;
      updateStageActiveUI(currentStage);
      applyFiltersAndRender();
    });
  });

  // Ordenação nas colunas da Tabela
  const headers = document.querySelectorAll('th[data-sort]');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.sort;
      if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.column = column;
        currentSort.direction = (column === 'Score') ? 'desc' : 'asc';
      }
      updateSortIcons(headers, header);
      applyFiltersAndRender();
    });
  });
}

function handleCSVImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  parseCSV(file, (data) => {
    rawData = data.map(item => {
      item._score = calculateClientScore(item);
      return item;
    });

    populateSelectOptions(rawData, () => {
      applyFiltersAndRender();
    });

    updateKPICounts(rawData);
    applyFiltersAndRender();
    showToast('CSV importado com sucesso!');
  });
}

function applyFiltersAndRender() {
  let filtered = filterData(rawData, currentStage);
  filtered = sortData(filtered, currentSort.column, currentSort.direction);
  renderTable(filtered, handleCopyField);
}

function sortData(data, column, direction) {
  return [...data].sort((a, b) => {
    let valA, valB;

    if (column === 'Score') {
      valA = a._score ?? 0;
      valB = b._score ?? 0;
    } else if (column === 'ID') {
      valA = a['ID'] || a['Id'] || '';
      valB = b['ID'] || b['Id'] || '';
    } else if (column === 'Razão') {
      valA = (a['Razão'] || a['Razao'] || a['Nome'] || '').toLowerCase();
      valB = (b['Razão'] || b['Razao'] || b['Nome'] || '').toLowerCase();
    } else if (column === 'Telefone') {
      valA = a['Telefone'] || a['Contato'] || '';
      valB = b['Telefone'] || b['Contato'] || '';
    } else if (column === 'Descrição') {
      valA = (a['Descrição'] || a['Descricao'] || '').toLowerCase();
      valB = (b['Descrição'] || b['Descricao'] || '').toLowerCase();
    } else if (column === 'Endereço') {
      valA = (a['Endereço'] || a['Endereco'] || '').toLowerCase();
      valB = (b['Endereço'] || b['Endereco'] || '').toLowerCase();
    } else if (column === 'Data perdemos') {
      const dateA = getEffectiveDateStr ? getEffectiveDateStr(a) : '';
      const dateB = getEffectiveDateStr ? getEffectiveDateStr(b) : '';
      valA = parseDateToTimestamp(dateA);
      valB = parseDateToTimestamp(dateB);
    } else {
      return 0;
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function parseDateToTimestamp(dateStr) {
  if (!dateStr || dateStr === '00/00/0000') return 0;
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return 0;
  return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
}

function updateStageActiveUI(activeStage) {
  const kpiCards = document.querySelectorAll('.kpi-card');
  kpiCards.forEach(card => {
    const stage = parseInt(card.dataset.stage, 10);
    if (stage === activeStage) {
      card.classList.add('border-brand', 'ring-1', 'ring-brand');
    } else {
      card.classList.remove('border-brand', 'ring-1', 'ring-brand');
    }
  });
}

function updateSortIcons(headers, activeHeader) {
  headers.forEach(h => {
    const icon = h.querySelector('.sort-icon');
    if (!icon) return;
    if (h === activeHeader) {
      icon.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
      icon.classList.add('text-brand');
    } else {
      icon.textContent = '↕';
      icon.classList.remove('text-brand');
    }
  });
}

function handleCopyField(text, fieldName) {
  if (!text || text === '-') return;
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${fieldName} copiado!`);
  }).catch(err => {
    console.error('Erro ao copiar:', err);
  });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('opacity-0', 'pointer-events-none');
  toast.classList.add('opacity-100');

  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0', 'pointer-events-none');
  }, 2500);
}