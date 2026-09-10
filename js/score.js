import { getDaysDiff, getEffectiveDateStr } from './regua.js';

const SCORE_CONFIG = {
  regrasIndicacao: {
    dataInicio: '01/04/2026',
    bonusTaxa: 15
  },
  motivos: {
    preco: 90,
    'nao interagiu': 65,
    'sem resposta': 65,
    'momento inadequado': 70,
    'fidelidade ativa': 75,
    'fechou com concorrente': 40,
    inadimplente: 35,
    'sem cobertura': 25,
    'sem interesse': 30,
    default: 35
  },
  diasPerdido: [
    { maxDias: 7, score: 90 },
    { maxDias: 30, score: 80 },
    { maxDias: 90, score: 65 },
    { maxDias: 180, score: 50 },
    { maxDias: 330, score: 35 },
    { maxDias: 360, score: 25 },
    { maxDias: Infinity, score: 15 }
  ],
  canais: {
    indicacao: 85,
    condominio: 90,
    google: 70,
    'redes sociais': 65,
    'ja foi cliente': 75,
    'nao interagiu': 45,
    outros: 40,
    default: 30
  },
  campanhas: {
    'taxa isenta': 85,
    cashback: 85,
    'cash back': 85,
    desconto: 80,
    promocional: 80,
    'campanha especial': 80,
    default: 30
  }
};

const MIN_SCORES = {
  motivo: 20,
  tempo: 15,
  canal: 20,
  campanha: 20
};

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function findScoreByKeyword(value, scores) {
  const normalizedValue = normalizeText(value);
  const match = Object.keys(scores).find(keyword => (
    keyword !== 'default' && normalizedValue.includes(keyword)
  ));

  return match ? scores[match] : scores.default;
}

function isAfterDate(dateStr, minimumDateStr) {
  const [day, month, year] = normalizeText(dateStr).split('/').map(Number);
  const [minimumDay, minimumMonth, minimumYear] = minimumDateStr.split('/').map(Number);

  if (![day, month, year].every(Number.isFinite)) return false;

  return new Date(year, month - 1, day) >= new Date(
    minimumYear,
    minimumMonth - 1,
    minimumDay
  );
}

function hasFeeRelatedOffer(value) {
  const normalizedValue = normalizeText(value);
  return ['taxa', 'cashback', 'cash back'].some(keyword => (
    normalizedValue.includes(keyword)
  ));
}

export function calculateClientScore(item) {
  const rawDesc = item['Descrição'] || item['Descricao'] || '';
  let scoreMotivo = MIN_SCORES.motivo;
  if (rawDesc.trim()) {
    const cleanDesc = rawDesc.replace(/^perdemos\s*-\s*/i, '');
    scoreMotivo = findScoreByKeyword(cleanDesc, SCORE_CONFIG.motivos);
  }

  const effectiveDateStr = getEffectiveDateStr(item);
  let scoreTempo = MIN_SCORES.tempo;
  if (effectiveDateStr) {
    const dias = getDaysDiff(effectiveDateStr);
    if (dias >= 0) {
      const faixa = SCORE_CONFIG.diasPerdido.find(f => dias <= f.maxDias);
      if (faixa) scoreTempo = faixa.score;
    }
  }

  const canal = item['Canal'] || item['Origem'] || '';
  let scoreCanal = MIN_SCORES.canal;
  if (canal.trim()) scoreCanal = findScoreByKeyword(canal, SCORE_CONFIG.canais);

  const campanha = item['Campanha'] || item['Campaign'] || '';
  let scoreCampanha = MIN_SCORES.campanha;
  if (campanha.trim()) scoreCampanha = findScoreByKeyword(campanha, SCORE_CONFIG.campanhas);

  let total = Math.round(
    (scoreMotivo * 0.40) +
    (scoreTempo * 0.25) +
    (scoreCanal * 0.20) +
    (scoreCampanha * 0.15)
  );

  const isReferralChannel = ['indicacao', 'condominio'].some(keyword => (
    normalizeText(canal).includes(keyword)
  ));
  const reasonOrCampaignHasFee = hasFeeRelatedOffer(rawDesc) || hasFeeRelatedOffer(campanha);

  if (
    isReferralChannel &&
    reasonOrCampaignHasFee &&
    isAfterDate(effectiveDateStr, SCORE_CONFIG.regrasIndicacao.dataInicio)
  ) {
    total += SCORE_CONFIG.regrasIndicacao.bonusTaxa;
  }

  return Math.min(100, Math.max(0, total));
}

// Verifica se o score se encaixa na faixa selecionada (ex: "21-30")
export function isScoreInRange(score, rangeStr) {
  if (!rangeStr || rangeStr === 'all') return true;
  const [min, max] = rangeStr.split('-').map(Number);
  return score >= min && score <= max;
}