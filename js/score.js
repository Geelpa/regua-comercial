import { getDaysDiff, getEffectiveDateStr } from './regua.js';

// Tabela de pontuações das opções
const SCORE_CONFIG = {
  motivos: {
    'sem cobertura': 10,
    'sem interesse': 20,
    'preco': 30,
    'fechou com concorrente': 40,
    'default': 50
  },
  diasPerdido: [
    { maxDias: 7, score: 90 },
    { maxDias: 30, score: 75 },
    { maxDias: 90, score: 50 },
    { maxDias: 360, score: 40 },
    { maxDias: Infinity, score: 20 }
  ],
  canais: {
    'outbound': 30,
    'inbound': 70,
    'indicacao': 90,
    'default': 30
  },
  campanhas: {
    'black friday': 20,
    'google ads': 60,
    'organico': 80,
    'default': 20
  }
};

// Menores valores possíveis de cada categoria (usados quando o campo estiver vazio)
const MIN_SCORES = {
  motivo: 10,   // 'sem cobertura'
  tempo: 10,    // > 360 dias
  canal: 30,    // 'outbound'
  campanha: 20  // 'black friday'
};

export function calculateClientScore(item) {
  // 1. Motivo (Peso 35%)
  const rawDesc = item['Descrição'] || item['Descricao'] || '';
  let scoreMotivo = MIN_SCORES.motivo;
  if (rawDesc.trim()) {
    const cleanDesc = rawDesc.replace(/^perdemos\s*-\s*/i, '').toLowerCase().trim();
    scoreMotivo = SCORE_CONFIG.motivos[cleanDesc] ?? SCORE_CONFIG.motivos['default'];
  }

  // 2. Tempo (Data Perdemos com fallback para Data Cadastro) (Peso 35%)
  const effectiveDateStr = getEffectiveDateStr(item);
  let scoreTempo = MIN_SCORES.tempo;
  
  if (effectiveDateStr) {
    const dias = getDaysDiff(effectiveDateStr);
    if (dias >= 0) {
      const faixa = SCORE_CONFIG.diasPerdido.find(f => dias <= f.maxDias);
      if (faixa) scoreTempo = faixa.score;
    }
  }

  // 3. Canal (Peso 15%)
  const canal = (item['Canal'] || '').toLowerCase().trim();
  let scoreCanal = MIN_SCORES.canal;
  if (canal) {
    scoreCanal = SCORE_CONFIG.canais[canal] ?? SCORE_CONFIG.canais['default'];
  }

  // 4. Campanha (Peso 15%)
  const campanha = (item['Campanha'] || '').toLowerCase().trim();
  let scoreCampanha = MIN_SCORES.campanha;
  if (campanha) {
    scoreCampanha = SCORE_CONFIG.campanhas[campanha] ?? SCORE_CONFIG.campanhas['default'];
  }

  const total = Math.round(
    (scoreMotivo * 0.35) +
    (scoreTempo * 0.35) +
    (scoreCanal * 0.15) +
    (scoreCampanha * 0.15)
  );

  return Math.min(100, Math.max(0, total));
}

// Verifica se o score se encaixa na faixa selecionada (ex: "21-30")
export function isScoreInRange(score, rangeStr) {
  if (!rangeStr || rangeStr === 'all') return true;
  const [min, max] = rangeStr.split('-').map(Number);
  return score >= min && score <= max;
}