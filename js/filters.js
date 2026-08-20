import { getDaysDiff, getStageBucket } from './regua.js';

const channelGroup = document.getElementById('channelGroup');
const campaignGroup = document.getElementById('campaignGroup');
const descriptionGroup = document.getElementById('descriptionGroup');
const yearGroup = document.getElementById('yearGroup');

const channelTags = document.getElementById('channelTags');
const campaignTags = document.getElementById('campaignTags');
const descriptionTags = document.getElementById('descriptionTags');
const yearTags = document.getElementById('yearTags');

const searchInput = document.getElementById('search');
const searchChannel = document.getElementById('searchChannel');
const searchCampaign = document.getElementById('searchCampaign');
const searchDescription = document.getElementById('searchDescription');
const searchYear = document.getElementById('searchYear');

const state = {
  channels: { all: new Set(), selected: new Set(), query: '' },
  campaigns: { all: new Set(), selected: new Set(), query: '' },
  descriptions: { all: new Set(), selected: new Set(), query: '' },
  years: { all: new Set(), selected: new Set(), query: '' }
};

let onFilterChangeCallback = null;

function extractYear(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('/');
  if (parts.length === 3) {
    const year = parts[2].trim();
    if (year.length === 4 && !isNaN(year)) return year;
  }
  return null;
}

export function populateSelectOptions(data, onChange) {
  onFilterChangeCallback = onChange;

  state.channels.all.clear();
  state.campaigns.all.clear();
  state.descriptions.all.clear();
  state.years.all.clear();

  data.forEach(item => {
    if (item['Canal']) state.channels.all.add(item['Canal']);
    if (item['Campanha']) state.campaigns.all.add(item['Campanha']);
    if (item['Descrição']) {
      const cleanDesc = item['Descrição'].replace(/^perdemos\s*-\s*/i, '');
      state.descriptions.all.add(cleanDesc);
    }
    const year = extractYear(item['Data perdemos']);
    if (year) state.years.all.add(year);
  });

  setupInternalSearch();
  renderAllGroups();
  setupClearButtons();
}

function setupInternalSearch() {
  const bindSearch = (input, categoryState) => {
    if (!input) return;
    
    // Filtra enquanto o usuário digita
    input.oninput = (e) => {
      categoryState.query = e.target.value.toLowerCase().trim();
      renderAllGroups();
    };

    // Ao focar/clicar no input, re-renderiza para garantir a exibição imediata
    input.onfocus = () => {
      renderAllGroups();
    };
  };

  bindSearch(searchChannel, state.channels);
  bindSearch(searchCampaign, state.campaigns);
  bindSearch(searchDescription, state.descriptions);
  bindSearch(searchYear, state.years);
}

function renderAllGroups() {
  renderCheckboxGroup(channelGroup, channelTags, state.channels, 'clearChannels');
  renderCheckboxGroup(campaignGroup, campaignTags, state.campaigns, 'clearCampaigns');
  renderCheckboxGroup(descriptionGroup, descriptionTags, state.descriptions, 'clearDescriptions');
  renderCheckboxGroup(yearGroup, yearTags, state.years, 'clearYears');
}

function renderCheckboxGroup(listContainer, tagsContainer, categoryState, clearBtnId) {
  if (!listContainer) return;
  listContainer.innerHTML = '';
  if (tagsContainer) tagsContainer.innerHTML = '';

  const query = categoryState.query;
  const selectedList = Array.from(categoryState.selected).sort();

  // 1. Botão "Limpar" por coluna
  const clearBtn = document.getElementById(clearBtnId);
  if (clearBtn) {
    clearBtn.classList.toggle('hidden', categoryState.selected.size === 0);
  }

  // 2. Renderizar Tags / Etiquetas selecionadas
  if (tagsContainer && selectedList.length > 0) {
    selectedList.forEach(val => {
      const tag = document.createElement('span');
      tag.className = 'inline-flex items-center gap-1 bg-brand/15 text-brand border border-brand/30 px-2 py-0.5 rounded-full text-[10px] font-medium leading-tight';

      const textSpan = document.createElement('span');
      textSpan.textContent = val;
      textSpan.className = 'truncate max-w-[120px]';

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.innerHTML = '&times;';
      removeBtn.className = 'hover:bg-brand/30 rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold text-[11px] leading-none transition-colors text-brand ml-0.5 cursor-pointer';
      removeBtn.title = 'Remover filtro';

      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        categoryState.selected.delete(val);
        renderAllGroups();
        if (onFilterChangeCallback) onFilterChangeCallback();
      });

      tag.appendChild(textSpan);
      tag.appendChild(removeBtn);
      tagsContainer.appendChild(tag);
    });
  }

  // 3. Filtrar opções que ainda não foram selecionadas (se query for vazia, mostra todas)
  const optionsList = Array.from(categoryState.all)
    .filter(val => !categoryState.selected.has(val) && val.toLowerCase().includes(query))
    .sort();

  if (optionsList.length === 0) {
    listContainer.innerHTML = `<span class="text-theme-textMuted italic p-1 block text-[10px]">Nenhuma opção disponível</span>`;
    return;
  }

  optionsList.forEach(val => {
    listContainer.appendChild(createCheckboxItem(val, categoryState));
  });
}

function createCheckboxItem(value, categoryState) {
  const label = document.createElement('label');
  label.className = 'flex items-center gap-2 p-1 rounded cursor-pointer transition-colors text-theme-textMuted hover:bg-theme-hover hover:text-theme-textMain text-xs';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = false;
  checkbox.className = 'accent-brand rounded cursor-pointer w-3.5 h-3.5';

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      categoryState.selected.add(value);
      categoryState.query = '';
      resetSearchInput(categoryState);
    }
    renderAllGroups();
    if (onFilterChangeCallback) onFilterChangeCallback();
  });

  const span = document.createElement('span');
  span.textContent = value;
  span.className = 'truncate';

  label.appendChild(checkbox);
  label.appendChild(span);
  return label;
}

function resetSearchInput(categoryState) {
  if (categoryState === state.channels && searchChannel) searchChannel.value = '';
  if (categoryState === state.campaigns && searchCampaign) searchCampaign.value = '';
  if (categoryState === state.descriptions && searchDescription) searchDescription.value = '';
  if (categoryState === state.years && searchYear) searchYear.value = '';
}

function setupClearButtons() {
  const bindClear = (btnId, categoryState) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.onclick = () => {
      categoryState.selected.clear();
      categoryState.query = '';
      resetSearchInput(categoryState);
      renderAllGroups();
      if (onFilterChangeCallback) onFilterChangeCallback();
    };
  };

  bindClear('clearChannels', state.channels);
  bindClear('clearCampaigns', state.campaigns);
  bindClear('clearDescriptions', state.descriptions);
  bindClear('clearYears', state.years);
}

export function resetAllFiltersState() {
  state.channels.selected.clear();
  state.campaigns.selected.clear();
  state.descriptions.selected.clear();
  state.years.selected.clear();

  state.channels.query = state.campaigns.query = state.descriptions.query = state.years.query = '';

  if (searchChannel) searchChannel.value = '';
  if (searchCampaign) searchCampaign.value = '';
  if (searchDescription) searchDescription.value = '';
  if (searchYear) searchYear.value = '';

  renderAllGroups();
}

export function filterData(data, activeStage = null) {
  const term = searchInput ? searchInput.value.toLowerCase().trim() : '';

  return data.filter(item => {
    const id = (item['ID'] || '').toLowerCase();
    const name = (item['Razão'] || '').toLowerCase();
    const phone = (item['Telefone'] || '').toLowerCase();
    const taxa = (item['Taxa'] || '').toLowerCase();
    const valor = (item['Valor'] || '').toLowerCase();

    let rawDesc = item['Descrição'] || '';
    let cleanDesc = rawDesc.replace(/^perdemos\s*-\s*/i, '');
    const itemYear = extractYear(item['Data perdemos']);

    const matchesSearch = !term ||
      name.includes(term) ||
      phone.includes(term) ||
      id.includes(term) ||
      taxa.includes(term) ||
      valor.includes(term);

    const matchesChannel = state.channels.selected.size === 0 || state.channels.selected.has(item['Canal']);
    const matchesCampaign = state.campaigns.selected.size === 0 || state.campaigns.selected.has(item['Campanha']);
    const matchesDesc = state.descriptions.selected.size === 0 || state.descriptions.selected.has(cleanDesc) || state.descriptions.selected.has(rawDesc);
    const matchesYear = state.years.selected.size === 0 || (itemYear && state.years.selected.has(itemYear));

    let matchesStage = true;
    if (activeStage !== null) {
      matchesStage = (getStageBucket(getDaysDiff(item['Data perdemos'])) === activeStage);
    }

    return matchesSearch && matchesChannel && matchesCampaign && matchesDesc && matchesYear && matchesStage;
  });
}