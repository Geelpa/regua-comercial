import { calculateClientScore } from "./score.js";

const tableBody = document.getElementById("tableBody");
const emptyState = document.getElementById("empty");
const summaryText = document.getElementById("summary");

/**
 * Retorna as classes Tailwind para estilizar a badge conforme a pontuação
 */
function getScoreBadgeClass(score) {
  if (score >= 75)
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (score >= 50) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-rose-500/15 text-rose-400 border-rose-500/30";
}

/**
 * Exibe o estado vazio quando nenhum cliente é retornado
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
 * Renderiza os dados da tabela
 * @param {Array} data - Lista de clientes a serem exibidos
 * @param {Function} onCopyField - Callback disparada ao clicar em um campo clicável
 */
export function renderTable(data, onCopyField) {
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (!data || data.length === 0) {
    showEmptyState("Nenhum cliente encontrado para este filtro.");
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (summaryText)
    summaryText.textContent = `Exibindo ${data.length} cliente(s).`;

  const clickableClasses =
    "cursor-pointer hover:text-brand hover:underline transition-colors font-medium text-theme-textMain";

  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.className =
      "border-b border-theme-border hover:bg-theme-hover transition-colors";

    // Obtém o score previamente calculado ou realiza o cálculo na hora
    const score =
      item._score !== undefined ? item._score : calculateClientScore(item);
    const badgeClass = getScoreBadgeClass(score);

    // Campos principais
    const id = item["ID"] || item["Id"] || "-";
    const razao = item["Razão"] || item["Razao"] || item["Nome"] || "-";
    const contato =
      item["Telefone"] || item["Contato"] || item["Celular"] || "-";

    // Formatação unificada do Endereço (Rua + Número)
    const street =
      item["Endereço"] ||
      item["Endereco"] ||
      item["Rua"] ||
      item["Logradouro"] ||
      "";
    const number =
      item["Número"] || item["Numero"] || item["Numeral"] || item["Num"] || "";
    const fullAddress = [street, number].filter(Boolean).join(", ") || "-";

    // Motivo limpo
    let perdemosMotivo = item["Descrição"] || item["Descricao"] || "-";
    if (perdemosMotivo !== "-") {
      perdemosMotivo = perdemosMotivo.replace(/^perdemos\s*-\s*/i, "");
    }

    const dataPerdemos = item["Data perdemos"] || item["Data"] || "-";

    tr.innerHTML = `
      <td class="px-3 py-1.5 text-xs ${clickableClasses}" title="Copiar ID">${id}</td>
      <td class="px-3 py-1.5 text-xs ${clickableClasses} max-w-[180px] truncate" title="Copiar Razão">${razao}</td>
      <td class="px-3 py-1.5 text-xs ${clickableClasses}" title="Copiar Contato">${contato}</td>
      <td class="px-3 py-1.5 text-xs text-theme-textMuted max-w-[150px] truncate" title="${perdemosMotivo}">${perdemosMotivo}</td>
      <td class="px-3 py-1.5 text-xs text-theme-textMuted max-w-[200px] truncate" title="${fullAddress}">${fullAddress}</td>
      <td class="px-3 py-1.5 text-xs text-theme-textMuted whitespace-nowrap">${dataPerdemos}</td>
            <td class="px-3 py-1.5 text-xs whitespace-nowrap">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}">
          ${score} pts
        </span>
      </td>
    `;

    // Eventos de clique para copiar
    if (typeof onCopyField === "function") {
      tr.children[1].addEventListener("click", () => onCopyField(id, "ID"));
      tr.children[2].addEventListener("click", () =>
        onCopyField(razao, "Razão Social"),
      );
      tr.children[3].addEventListener("click", () =>
        onCopyField(contato, "Contato"),
      );
    }

    tableBody.appendChild(tr);
  });
}
