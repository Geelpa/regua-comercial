const tableBody = document.getElementById('tableBody');
const emptyState = document.getElementById('empty');
const summaryText = document.getElementById('summary');

let currentSort = { key: null, direction: 'asc' };

export function initTableSort(onSortChange) {
  const headers = document.querySelectorAll('th[data-sort]');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const key = header.getAttribute('data-sort');
      if (currentSort.key === key) {
        if (currentSort.direction === 'asc') {
          currentSort.direction = 'desc';
        } else {
          currentSort.key = null;
          currentSort.direction = 'asc';
        }
      } else {
        currentSort.key = key;
        currentSort.direction = 'asc';
      }
      updateHeaderIcons();
      if (onSortChange) onSortChange();
    });
  });
}

function updateHeaderIcons() {
  const headers = document.querySelectorAll('th[data-sort]');
  headers.forEach(header => {
    const key = header.getAttribute('data-sort');
    const icon = header.querySelector('.sort-icon');
    if (!icon) return;

    if (currentSort.key === key) {
      icon.textContent = currentSort.direction === 'asc' ? '▲' : '▼';
      header.classList.add('text-brand');
      header.classList.remove('text-theme-textMuted');
    } else {
      icon.textContent = '↕';
      header.classList.remove('text-brand');
      header.classList.add('text-theme-textMuted');
    }
  });
}

export function applySorting(data) {
  if (!currentSort.key || !data || data.length === 0) return data;

  return [...data].sort((a, b) => {
    let valA = a[currentSort.key] || '';
    let valB = b[currentSort.key] || '';

    if (currentSort.key === 'Descrição') {
      valA = valA.replace(/^perdemos\s*-\s*/i, '');
      valB = valB.replace(/^perdemos\s*-\s*/i, '');
    }

    const dateA = parseDate(valA);
    const dateB = parseDate(valB);

    let result = 0;
    if (dateA && dateB) {
      result = dateA - dateB;
    } else {
      result = valA.toString().localeCompare(valB.toString(), 'pt-BR', { numeric: true, sensitivity: 'base' });
    }

    return currentSort.direction === 'asc' ? result : -result;
  });
}

function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export function resetSortState() {
  currentSort = { key: null, direction: 'asc' };
  updateHeaderIcons();
}

export function renderTable(data, onCopyField) {
  tableBody.innerHTML = '';
  
  if (!data || data.length === 0) {
    showEmptyState('Nenhum cliente encontrado para este filtro.');
    return;
  }
  
  emptyState.style.display = 'none';
  summaryText.textContent = `Exibindo ${data.length} cliente(s).`;

  const clickableClasses = 'cursor-pointer hover:text-brand hover:underline transition-colors font-medium text-theme-textMain';

  data.forEach((item) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-theme-border hover:bg-theme-hover transition-colors';
    
    const id = item['ID'] || item['Id'] || '-';
    const razao = item['Razão'] || item['Razao'] || '-';
    const contato = item['Telefone'] || item['Contato'] || '-';
    
    // Concatena Endereço + Número para a visualização
    const street = item['Endereço'] || item['Endereco'] || '';
    const number = item['Número'] || item['Numero'] || item['Numeral'] || '';
    const fullAddress = [street, number].filter(Boolean).join(', ') || '-';

    let perdemosMotivo = item['Descrição'] || item['Descricao'] || '-';
    if (perdemosMotivo !== '-') {
      perdemosMotivo = perdemosMotivo.replace(/^perdemos\s*-\s*/i, '');
    }

    const dataPerdemos = item['Data perdemos'] || item['Data'] || '-';

    tr.innerHTML = `
      <td class="px-3 py-1.5 text-xs ${clickableClasses}" title="Copiar ID">${id}</td>
      <td class="px-3 py-1.5 text-xs ${clickableClasses} max-w-[180px] truncate" title="Copiar Razão">${razao}</td>
      <td class="px-3 py-1.5 text-xs ${clickableClasses}" title="Copiar Contato">${contato}</td>
      <td class="px-3 py-1.5 text-xs text-theme-textMuted max-w-[150px] truncate" title="${perdemosMotivo}">${perdemosMotivo}</td>
      <td class="px-3 py-1.5 text-xs text-theme-textMuted max-w-[200px] truncate" title="${fullAddress}">${fullAddress}</td>
      <td class="px-3 py-1.5 text-xs text-theme-textMuted whitespace-nowrap">${dataPerdemos}</td>
    `;

    tr.children[0].addEventListener('click', () => onCopyField(id, 'ID'));
    tr.children[1].addEventListener('click', () => onCopyField(razao, 'Razão Social'));
    tr.children[2].addEventListener('click', () => onCopyField(contato, 'Contato'));

    tableBody.appendChild(tr);
  });
}

export function showEmptyState(message = 'Importe um CSV para começar.') {
  tableBody.innerHTML = '';
  emptyState.style.display = 'block';
  summaryText.textContent = message;
}