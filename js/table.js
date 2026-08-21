import { calculateClientScore } from "./score.js";
import { getEffectiveDateStr } from './regua.js';

const tableBody = document.getElementById("tableBody");
const emptyState = document.getElementById("empty");
const summaryText = document.getElementById("summary");

let isListenerAttached = false;
let copyCallback = null;

/**
 * Retorna as classes Tailwind para a badge do Score
 */
function getScoreBadgeClass(score) {
  if (score >= 75)
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (score >= 50) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-rose-500/15 text-rose-400 border-rose-500/30";
}

/**
 * Exibe o estado vazio
 */
function showEmptyState(message) {
  if (tableBody) tableBody.innerHTML = "";
  if (emptyState) {
    emptyState.textContent = message || "Nenhum cliente encontrado.";
    emptyState.style.display = "block";
  }
  if (summaryText) summaryText.textContent = "0 clientes exibidos.";
}

/**
 * Configura a delegação de eventos para cópia no container da tabela
 */
function setupCopyDelegation() {
  if (isListenerAttached || !tableBody) return;

  tableBody.addEventListener("click", (e) => {
    // Encontra a célula clicada que possui o atributo data-copy-value
    const copyTarget = e.target.closest("[data-copy-value]");
    if (!copyTarget) return;

    const value = copyTarget.dataset.copyValue;
    const name = copyTarget.dataset.copyName;

    if (value && value !== "-" && typeof copyCallback === "function") {
      copyCallback(value, name);
    }
  });

  isListenerAttached = true;
}

export function renderTable(data, onCopyField) {
  if (!tableBody) return;

  copyCallback = onCopyField;
  setupCopyDelegation();

  tableBody.innerHTML = '';

  if (!data || data.length === 0) {
    showEmptyState('Nenhum cliente encontrado para este filtro.');
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (summaryText) summaryText.textContent = `Exibindo ${data.length} cliente(s).`;

  const clickableClasses = 'cursor-pointer hover:text-brand hover:underline transition-colors font-medium text-theme-textMain';

  data.forEach((item) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-theme-border hover:bg-theme-hover transition-colors';

    const score = item._score !== undefined ? item._score : calculateClientScore(item);
    const badgeClass = getScoreBadgeClass(score);

    const id = item['ID'] || item['Id'] || '-';
    const razao = item['Razão'] || item['Razao'] || item['Nome'] || '-';
    const contato = item['Telefone'] || item['Contato'] || item['Celular'] || '-';

    const street = item['Endereço'] || item['Endereco'] || item['Rua'] || item['Logradouro'] || '';
    const number = item['Número'] || item['Numero'] || item['Numeral'] || item['Num'] || '';
    const fullAddress = [street, number].filter(Boolean).join(', ') || '-';

    let perdemosMotivo = item['Descrição'] || item['Descricao'] || '-';
    if (perdemosMotivo !== '-') {
      perdemosMotivo = perdemosMotivo.replace(/^perdemos\s*-\s*/i, '');
    }

    // AQUI: Obtém a data efetiva (Data Perdemos ou Cadastro como fallback)
    const dataEfetiva = getEffectiveDateStr(item) || '-';

    tr.innerHTML = `
      <td class="px-3 py-1.5 text-xs whitespace-nowrap">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}">
          ${score} pts
        </span>
      </td>
      <td class="px-3 py-1.5 text-xs ${clickableClasses}" data-copy-value="${id}" data-copy-name="ID" title="Copiar ID">${id}</td>
      <td class="px-3 py-1.5 text-xs ${clickableClasses} max-w-[180px] truncate" data-copy-value="${razao}" data-copy-name="Razão Social" title="Copiar Razão">${razao}</td>
      <td class="px-3 py-1.5 text-xs ${clickableClasses}" data-copy-value="${contato}" data-copy-name="Telefone" title="Copiar Telefone">${contato}</td>
      <td class="px-3 py-1.5 text-xs text-theme-textMuted max-w-[150px] truncate" title="${perdemosMotivo}">${perdemosMotivo}</td>
      <td class="px-3 py-1.5 text-xs text-theme-textMuted max-w-[200px] truncate" title="${fullAddress}">${fullAddress}</td>
      <td class="px-3 py-1.5 text-xs text-theme-textMuted whitespace-nowrap">${dataEfetiva}</td>
    `;

    tableBody.appendChild(tr);
  });
}
