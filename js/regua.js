/**
 * Calcula a diferença em dias entre a data atual e uma data no formato "DD/MM/YYYY" ou ISO
 * @param {string} dateStr - Data em formato de texto
 * @returns {number} Quantidade de dias passados (-1 se inválida)
 */
export function getDaysDiff(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return -1;

  const parts = dateStr.trim().split('/');
  let targetDate;

  if (parts.length === 3) {
    // Formato brasileiro DD/MM/YYYY
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    targetDate = new Date(year, month, day);
  } else {
    // Tenta fallback para ISO YYYY-MM-DD
    targetDate = new Date(dateStr);
  }

  if (isNaN(targetDate.getTime())) return -1;

  const now = new Date();
  // Zera horas/minutos/segundos para comparar apenas os dias
  now.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = now.getTime() - targetDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Retorna o estágio da régua com base nos dias passados
 * @param {number} days - Dias corridos
 * @returns {number|null} Estágio da régua (3, 7, 30, 60, 90, 180, 360)
 */
export function getStageBucket(days) {
  if (days < 0) return null;
  if (days <= 3) return 3;
  if (days <= 7) return 7;
  if (days <= 30) return 30;
  if (days <= 60) return 60;
  if (days <= 90) return 90;
  if (days <= 180) return 180;
  if (days <= 360) return 360;
  return null;
}

/**
 * Atualiza os contadores nos cards KPI no topo do painel
 * @param {Array} data - Lista de clientes importados do CSV
 */
export function updateKPICounts(data) {
  const counts = {
    3: 0,
    7: 0,
    30: 0,
    60: 0,
    90: 0,
    180: 0,
    360: 0
  };

  if (Array.isArray(data)) {
    data.forEach(item => {
      const dateStr = item['Data perdemos'] || item['Data'] || '';
      const days = getDaysDiff(dateStr);
      const stage = getStageBucket(days);

      if (stage && counts[stage] !== undefined) {
        counts[stage]++;
      }
    });
  }

  // Atualiza os elementos HTML dos cards KPI correspondentes
  Object.keys(counts).forEach(stage => {
    const el = document.getElementById(`kpi-${stage}`);
    if (el) {
      el.textContent = counts[stage];
    }
  });
}