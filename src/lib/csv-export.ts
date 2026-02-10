type CSVRow = Record<string, string | number | boolean | null | undefined>;

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV(rows: CSVRow[], columns: { key: string; label: string }[], filename: string) {
  const header = columns.map((c) => escapeCSV(c.label)).join(',');
  const csvRows = rows.map((row) =>
    columns.map((c) => escapeCSV(row[c.key])).join(',')
  );
  const csv = [header, ...csvRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
