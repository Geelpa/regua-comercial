/**
 * Processa um arquivo CSV (File object) ou uma string com o conteúdo CSV
 * @param {File|string} fileOrText - Arquivo vindo do input ou string do CSV
 * @param {Function} callback - Função que receberá o array de objetos parseado
 */
export function parseCSV(fileOrText, callback) {
  if (fileOrText instanceof File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsedData = processCSVText(text);
      if (typeof callback === 'function') callback(parsedData);
    };
    reader.readAsText(fileOrText, 'UTF-8');
  } else if (typeof fileOrText === 'string') {
    const parsedData = processCSVText(fileOrText);
    if (typeof callback === 'function') callback(parsedData);
  } else {
    console.error('Entrada inválida fornecida para parseCSV:', fileOrText);
  }
}

/**
 * Converte o texto bruto do CSV em um Array de Objetos
 * @param {string} text 
 * @returns {Array<Object>}
 */
function processCSVText(text) {
  if (typeof text !== 'string') return [];

  // Padroniza quebras de linha e remove linhas vazias
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  // Detecta se o separador é ponto e vírgula (;) ou vírgula (,)
  const separator = lines[0].includes(';') ? ';' : ',';

  // Extrai cabeçalhos e limpa aspas duplas
  const headers = lines[0].split(separator).map(h => h.trim().replace(/^"|"$/g, ''));

  // Converte cada linha do CSV em objeto
  return lines.slice(1).map(line => {
    // Regex para respeitar valores entre aspas contendo separadores
    const regex = new RegExp(`(?:^|${separator})(?:"([^"]*)"|([^"${separator}]*))`, 'g');
    const values = [];
    let match;

    while ((match = regex.exec(line)) !== null) {
      values.push((match[1] !== undefined ? match[1] : match[2] || '').trim());
    }

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
}