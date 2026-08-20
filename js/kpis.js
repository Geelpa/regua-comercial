import { getDaysDiff, getStageBucket } from './regua.js';

let activeStageFilter = null;

const ACTIVE_CLASSES = ['border-brand', 'bg-brand-light', 'ring-1', 'ring-brand', 'shadow-md'];
const INACTIVE_CLASSES = ['border-theme-border', 'bg-theme-card', 'shadow-sm'];

export function updateKPIs(data) {
  const counts = { 3: 0, 7: 0, 30: 0, 90: 0, 360: 0 };
  data.forEach(item => {
    const bucket = getStageBucket(getDaysDiff(item['Data perdemos']));
    if (bucket && counts[bucket] !== undefined) counts[bucket]++;
  });
  Object.keys(counts).forEach(stage => {
    const el = document.getElementById(`count-${stage}`);
    if (el) el.textContent = counts[stage];
  });
}

export function initKPICards(onStageSelect) {
  const cards = document.querySelectorAll('.kpi-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const stage = parseInt(card.getAttribute('data-stage'), 10);
      if (activeStageFilter === stage) {
        activeStageFilter = null;
        setCardState(card, false);
      } else {
        cards.forEach(c => setCardState(c, false));
        activeStageFilter = stage;
        setCardState(card, true);
      }
      onStageSelect(activeStageFilter);
    });
  });
}

function setCardState(card, isActive) {
  if (isActive) {
    card.classList.remove(...INACTIVE_CLASSES);
    card.classList.add(...ACTIVE_CLASSES);
  } else {
    card.classList.remove(...ACTIVE_CLASSES);
    card.classList.add(...INACTIVE_CLASSES);
  }
}

export function resetKPISelection() {
  activeStageFilter = null;
  document.querySelectorAll('.kpi-card').forEach(c => setCardState(c, false));
}