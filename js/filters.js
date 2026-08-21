import { calculateClientScore, isScoreInRange } from './score.js';
import { getDaysDiff, getStageBucket, getEffectiveDateStr } from './regua.js';

// Estado global dos filtros
export const state = {
  years: { selected: new Set(), options: [] },
  channels: { selected: new Set(), options: [] },
  campaigns: { selected: new Set(), options: [] },
  descriptions: { selected: new Set(), options: [] }
};

let currentOnFilterChange = null;

/**
 * Normaliza textos (remove acentos, caixa alta e espaços sobressalentes)
 */
function normalizeText(text) {
  if (text === null || text === undefined) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Busca valor em múltiplas chaves de coluna do CSV
 */
function getFieldValue(item, ...candidates) {
  if (!item || typeof item !== 'object') return '';
  const itemKeys = Object.keys(item);

  for (const candidate of candidates) {
    const normCand = normalizeText(candidate);

    for (const key of itemKeys) {
      const cleanKey = key.replace(/^\ufeff/, '').trim();
      if (normalizeText(cleanKey) === normCand) {
        const val = item[key];
        if (val !== undefined && val !== null && val !== '') {
          return val.toString().trim();
        }
      }
    }
  }
  return '';
}

/**
 * Obtém a data efetiva para cálculo e filtro de ano
 */
function safeGetEffectiveDateStr(item) {
  let dateStr = '';
  if (typeof getEffectiveDateStr === 'function') {
    dateStr = getEffectiveDateStr(item);
  }

  if (!dateStr || dateStr === '00/00/0000' || dateStr === '-') {
    const perdemos = getFieldValue(item, 'Data perdemos', 'Data Perdemos', 'DataPerdemos');
    if (perdemos && perdemos !== '00/00/0000' && perdemos !== '-') {
      dateStr = perdemos;
    } else {
      dateStr = getFieldValue(item, 'Data cadastro', 'Data Cadastro') || '';
    }
  }
  return dateStr;
}

/**
 * Extrai o ano de 4 dígitos
 */
function extractYear(dateStr) {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '00/00/0000') return null;
  const match = dateStr.match(/\b(19\d{2}|20\d{2})\b/);
  return match ? match[1] : null;
}

/**
 * Renderiza checkboxes dentro de um grupo específico
 */
function renderCheckboxes(groupKey, containerId, searchTerm = '') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  const normSearch = normalizeText(searchTerm);

  const filteredOptions = state[groupKey].options.filter(opt =>
    normalizeText(opt).includes(normSearch)
  );

  if (filteredOptions.length === 0) {
    container.innerHTML = '<span class="text-[11px] text-theme-textMuted p-1 block">Nenhum item encontrado</span>';
    return;
  }

  filteredOptions.forEach(optionValue => {
    const label = document.createElement('label');
    label.className = 'flex items-center gap-2 text-[11px] text-theme-textMain cursor-pointer select-none hover:text-brand transition-colors py-0.5 px-1 rounded hover:bg-theme-hover';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = optionValue;
    checkbox.checked = state[groupKey].selected.has(optionValue);
    checkbox.className = 'rounded border-theme-border bg-theme-input text-brand focus:ring-brand h-3.5 w-3.5 cursor-pointer';

    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        state[groupKey].selected.add(optionValue);
      } else {
        state[groupKey].selected.delete(optionValue);
      }
      updateGroupUI(groupKey);
      if (typeof currentOnFilterChange === 'function') {
        currentOnFilterChange();
      }
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(optionValue));
    container.appendChild(label);
  });
}

/**
 * Atualiza Tags e Botão Limpar do Grupo
 */
function updateGroupUI(groupKey) {
  const config = {
    years: { tagsId: 'yearTags', clearBtnId: 'clearYears' },
    channels: { tagsId: 'channelTags', clearBtnId: 'clearChannels' },
    campaigns: { tagsId: 'campaignTags', clearBtnId: 'clearCampaigns' },
    descriptions: { tagsId: 'descriptionTags', clearBtnId: 'clearDescriptions' }
  }[groupKey];

  if (!config) return;

  // Renderizar Tags
  const tagsContainer = document.getElementById(config.tagsId);
  if (tagsContainer) {
    tagsContainer.innerHTML = '';
    state[groupKey].selected.forEach(val => {
      const tag = document.createElement('span');
      tag.className = 'inline-flex items-center gap-1 bg-brand/20 text-brand border border-brand/30 px-1.5 py-0.5 rounded text-[10px] font-medium';
      tag.innerHTML = `${val} <button type="button" class="hover:text-white font-bold">&times;</button>`;
      
      tag.querySelector('button').addEventListener('click', () => {
        state[groupKey].selected.delete(val);
        const groupContainerId = {
          years: 'yearGroup',
          channels: 'channelGroup',
          campaigns: 'campaignGroup',
          descriptions: 'descriptionGroup'
        }[groupKey];
        
        renderCheckboxes(groupKey, groupContainerId);
        updateGroupUI(groupKey);
        if (typeof currentOnFilterChange === 'function') currentOnFilterChange();
      });

      tagsContainer.appendChild(tag);
    });
  }

  // Exibir/Ocultar Botão Limpar
  const clearBtn = document.getElementById(config.clearBtnId);
  if (clearBtn) {
    if (state[groupKey].selected.size > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }
}

/**
 * Configura os ouvintes de busca e ações nos filtros
 */
function setupFilterControls() {
  const mappings = [
    { key: 'years', group: 'yearGroup', search: 'searchYear', selectAll: 'selectAllYears', clear: 'clearYears' },
    { key: 'channels', group: 'channelGroup', search: 'searchChannel', selectAll: 'selectAllChannels', clear: 'clearChannels' },
    { key: 'campaigns', group: 'campaignGroup', search: 'searchCampaign', selectAll: 'selectAllCampaigns', clear: 'clearCampaigns' },
    { key: 'descriptions', group: 'descriptionGroup', search: 'searchDescription', selectAll: 'selectAllDescriptions', clear: 'clearDescriptions' }
  ];

  mappings.forEach(({ key, group, search, selectAll, clear }) => {
    // Input de busca interna do grupo
    const searchEl = document.getElementById(search);
    if (searchEl && !searchEl.dataset.bound) {
      searchEl.dataset.bound = 'true';
      searchEl.addEventListener('input', (e) => {
        renderCheckboxes(key, group, e.target.value);
      });
    }

    // Botão Selecionar Todos
    const selectAllEl = document.getElementById(selectAll);
    if (selectAllEl && !selectAllEl.dataset.bound) {
      selectAllEl.dataset.bound = 'true';
      selectAllEl.addEventListener('click', () => {
        state[key].options.forEach(opt => state[key].selected.add(opt));
        renderCheckboxes(key, group, searchEl ? searchEl.value : '');
        updateGroupUI(key);
        if (typeof currentOnFilterChange === 'function') currentOnFilterChange();
      });
    }

    // Botão Limpar Grupo
    const clearEl = document.getElementById(clear);
    if (clearEl && !clearEl.dataset.bound) {
      clearEl.dataset.bound = 'true';
      clearEl.addEventListener('click', () => {
        state[key].selected.clear();
        renderCheckboxes(key, group, searchEl ? searchEl.value : '');
        updateGroupUI(key);
        if (typeof currentOnFilterChange === 'function') currentOnFilterChange();
      });
    }
  });
}

/**
 * Extrai opções do CSV e popula as listas na tela
 */
export function populateSelectOptions(data, onFilterChange) {
  if (onFilterChange) currentOnFilterChange = onFilterChange;

  const yearsSet = new Set();
  const channelsSet = new Set();
  const campaignsSet = new Set();
  const descriptionsSet = new Set();

  data.forEach(item => {
    const effectiveDate = safeGetEffectiveDateStr(item);
    const year = extractYear(effectiveDate);
    if (year) yearsSet.add(year);

    const channel = getFieldValue(item, 'Canal', 'Channel', 'Origem', 'Midia');
    if (channel) channelsSet.add(channel);

    const campaign = getFieldValue(item, 'Campanha', 'Campaign');
    if (campaign) campaignsSet.add(campaign);

    const rawDesc = getFieldValue(item, 'Descrição', 'Descricao', 'Motivo', 'Reason');
    if (rawDesc) {
      const cleanDesc = rawDesc.replace(/^perdemos\s*-\s*/i, '').trim();
      if (cleanDesc) descriptionsSet.add(cleanDesc);
    }
  });

  state.years.options = Array.from(yearsSet).sort().reverse();
  state.channels.options = Array.from(channelsSet).sort();
  state.campaigns.options = Array.from(campaignsSet).sort();
  state.descriptions.options = Array.from(descriptionsSet).sort();

  setupFilterControls();

  renderCheckboxes('years', 'yearGroup');
  renderCheckboxes('channels', 'channelGroup');
  renderCheckboxes('campaigns', 'campaignGroup');
  renderCheckboxes('descriptions', 'descriptionGroup');

  updateGroupUI('years');
  updateGroupUI('channels');
  updateGroupUI('campaigns');
  updateGroupUI('descriptions');
}

/**
 * Aplica a filtragem nos dados do CSV
 */
export function filterData(data, activeStage = null) {
  const searchEl = document.getElementById('search');
  const scoreRangeEl = document.getElementById('scoreRange');
  const selectedScoreRange = scoreRangeEl ? scoreRangeEl.value : 'all';

  const rawTerm = searchEl ? searchEl.value : '';
  const normalizedTerm = normalizeText(rawTerm);
  const searchTokens = normalizedTerm.split(' ').filter(Boolean);

  return data.filter(item => {
    const clientScore = item._score !== undefined ? item._score : calculateClientScore(item);
    item._score = clientScore;

    // 1. Filtro de Score
    if (!isScoreInRange(clientScore, selectedScoreRange)) return false;

    const effectiveDate = safeGetEffectiveDateStr(item);
    const itemYear = extractYear(effectiveDate);

    const id = getFieldValue(item, 'ID', 'Id');
    const name = getFieldValue(item, 'Razão', 'Razao', 'Nome');
    const street = getFieldValue(item, 'Endereço', 'Endereco', 'Rua');
    const number = getFieldValue(item, 'Número', 'Numero', 'Num');
    const phone = getFieldValue(item, 'Telefone', 'Contato');

    const rawDesc = getFieldValue(item, 'Descrição', 'Descricao', 'Motivo');
    const cleanDesc = rawDesc.replace(/^perdemos\s*-\s*/i, '').trim();
    const channel = getFieldValue(item, 'Canal', 'Channel', 'Origem');
    const campaign = getFieldValue(item, 'Campanha', 'Campaign');

    // 2. Busca Geral Textual
    const searchableText = normalizeText(`${id} ${name} ${street} ${number} ${phone} ${cleanDesc} ${channel} ${campaign}`);
    const matchesSearch = searchTokens.length === 0 || searchTokens.every(token => searchableText.includes(token));

    // 3. Filtros das caixas de seleção
    const matchesChannel = state.channels.selected.size === 0 || state.channels.selected.has(channel);
    const matchesCampaign = state.campaigns.selected.size === 0 || state.campaigns.selected.has(campaign);
    const matchesDesc = state.descriptions.selected.size === 0 || state.descriptions.selected.has(cleanDesc) || state.descriptions.selected.has(rawDesc);
    const matchesYear = state.years.selected.size === 0 || (itemYear && state.years.selected.has(itemYear));

    // 4. Régua KPI
    let matchesStage = true;
    if (activeStage !== null && activeStage !== undefined) {
      const days = getDaysDiff(effectiveDate);
      matchesStage = (getStageBucket(days) === activeStage);
    }

    return matchesSearch && matchesChannel && matchesCampaign && matchesDesc && matchesYear && matchesStage;
  });
}

/**
 * Reseta todos os filtros
 */
export function resetAllFilters() {
  state.years.selected.clear();
  state.channels.selected.clear();
  state.campaigns.selected.clear();
  state.descriptions.selected.clear();

  ['searchYear', 'searchChannel', 'searchCampaign', 'searchDescription', 'search'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.value = '';
  });

  const scoreRangeEl = document.getElementById('scoreRange');
  if (scoreRangeEl) scoreRangeEl.value = 'all';

  renderCheckboxes('years', 'yearGroup');
  renderCheckboxes('channels', 'channelGroup');
  renderCheckboxes('campaigns', 'campaignGroup');
  renderCheckboxes('descriptions', 'descriptionGroup');

  updateGroupUI('years');
  updateGroupUI('channels');
  updateGroupUI('campaigns');
  updateGroupUI('descriptions');
}