/**
 * csv.js
 * Responsabilidade: leitura e interpretação do CSV.
 */

export function parseCSV(text) {
  const lines = text.replace(/\r/g, "").split("\n").filter(line => line.trim());
  if (!lines.length) return [];

  const separator = detectSeparator(lines[0]);
  const headers = parseLine(lines[0], separator)
    .map(normalizeHeader);

  return lines.slice(1).map(line => {
    const values = parseLine(line, separator);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return normalizeRow(row);
  });
}

function detectSeparator(header) {
  const semicolons = (header.match(/;/g) || []).length;
  const commas = (header.match(/,/g) || []).length;
  return semicolons > commas ? ";" : ",";
}

function parseLine(line, separator) {
  const result = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === separator && !quoted) {
      result.push(value.trim());
      value = "";
      continue;
    }

    value += char;
  }

  result.push(value.trim());
  return result;
}

function normalizeHeader(header) {
  return header
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function normalizeRow(row) {
  return {
    id: row.id || "",
    nome: row.nome || row.razao || "",
    canal_de_venda: row.canal_de_venda || row.canal || "",
    campanha: row.campanha || "",
    contato: row.contato || row.telefone || "",
    endereco: row.endereco || ""
  };
}
