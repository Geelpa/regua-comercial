/**
 * ui.js
 * Responsabilidade: renderização da interface.
 */

import { formatDate, getRulerDate, isSameDay, RULER_DAYS } from "./dates.js";

export function renderFilters({ rows, channelSelect, campaignSelect }) {
  const channels = unique(rows.map(row => row.canal_de_venda));
  const campaigns = unique(rows.map(row => row.campanha));

  channelSelect.innerHTML =
    '<option value="">Todos os canais</option>' +
    channels.map(value => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join("");

  campaignSelect.innerHTML =
    '<option value="">Todas as campanhas</option>' +
    campaigns.map(value => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join("");
}

export function renderKPIs({ container, rows, baseDate, activeRuler, onRulerClick }) {
  container.innerHTML = RULER_DAYS.map(days => {
    const target = getRulerDate(baseDate, days);
    const isToday = isSameDay(target, new Date());

    return `
      <button class="kpi ${activeRuler === days ? "active" : ""}" data-ruler="${days}">
        <div class="kpi-title">D+${days}</div>
        <div class="kpi-count">${isToday ? rows.length : 0}</div>
        <div class="kpi-date">${formatDate(target)}</div>
      </button>
    `;
  }).join("");

  container.querySelectorAll("[data-ruler]").forEach(button => {
    button.addEventListener("click", () => {
      onRulerClick(Number(button.dataset.ruler));
    });
  });
}

export function renderTable({ body, empty, rows, baseDate, ruler }) {
  const today = new Date();
  const due = ruler
    ? rows.filter(() => isSameDay(getRulerDate(baseDate, ruler), today))
    : [];

  body.innerHTML = due.map(row => `
    <tr>
      <td>
        <button
          class="copy-button"
          data-copy="${escapeAttribute(`${row.nome}\n${row.contato}`)}"
          title="Copiar nome e contato">
          📋
        </button>
      </td>

      <td>
        <span class="copyable" data-copy="${escapeAttribute(row.nome)}" title="Clique para copiar">
          ${escapeHTML(row.nome || "-")}
        </span>
      </td>

      <td>${escapeHTML(row.canal_de_venda || "-")}</td>
      <td>${escapeHTML(row.campanha || "-")}</td>

      <td>
        <span class="copyable" data-copy="${escapeAttribute(row.contato)}" title="Clique para copiar">
          ${escapeHTML(row.contato || "-")}
        </span>
      </td>

      <td>${escapeHTML(row.endereco || "-")}</td>

      <td>
        <span class="ruler-badge">D+${ruler}</span>
      </td>

      <td>${formatDate(getRulerDate(baseDate, ruler))}</td>
    </tr>
  `).join("");

  empty.style.display = due.length ? "none" : "block";
  return due.length;
}

export function updateSummary(element, visibleCount, totalCount, ruler) {
  if (!totalCount) {
    element.textContent = "Importe um CSV para começar.";
    return;
  }

  element.textContent =
    `${visibleCount} cliente(s) para D+${ruler} hoje · ${totalCount} na base filtrada`;
}

export function showToast(element, message) {
  element.textContent = message;
  element.classList.add("show");

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    element.classList.remove("show");
  }, 1400);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function escapeAttribute(value) {
  return escapeHTML(value);
}
