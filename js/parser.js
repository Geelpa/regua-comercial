export function readCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(parseCSV(e.target.result));
    reader.onerror = (err) => reject(err);
    reader.readAsText(file, 'UTF-8');
  });
}

function parseCSV(text) {
  const lines = text.trim().split(/\r\n|\n/);
  if (lines.length < 2) return [];
  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map(h => h.trim().replace(/^"|"$/g, ''));

  return lines.slice(1).reduce((acc, line) => {
    if (!line.trim()) return acc;
    const values = line.split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
    const item = {};
    headers.forEach((header, index) => { item[header] = values[index] || ''; });
    acc.push(item);
    return acc;
  }, []);
}