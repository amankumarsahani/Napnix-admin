/**
 * Minimal RFC 4180 CSV parser: quoted fields, escaped quotes (""), commas and newlines inside quotes, CRLF.
 * Returns an array of rows (arrays of strings); blank lines are dropped.
 */
export function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    const raw = String(text);
    const src = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw; // strip a BOM

    const endField = () => { row.push(field); field = ''; };
    const endRow = () => { endField(); if (row.some(c => c.trim() !== '')) rows.push(row); row = []; };

    for (let i = 0; i < src.length; i += 1) {
        const ch = src[i];
        if (inQuotes) {
            if (ch === '"') {
                if (src[i + 1] === '"') { field += '"'; i += 1; } else inQuotes = false;
            } else field += ch;
        } else if (ch === '"') inQuotes = true;
        else if (ch === ',') endField();
        else if (ch === '\n') endRow();
        else if (ch !== '\r') field += ch;
    }
    if (field !== '' || row.length) endRow();
    return rows;
}

/** CSV text -> array of objects keyed by the lower-cased header row. */
export function parseCsvObjects(text) {
    const [header = [], ...rest] = parseCsv(text);
    const keys = header.map(h => h.trim().toLowerCase());
    return { keys, records: rest.map(cells => Object.fromEntries(keys.map((k, i) => [k, (cells[i] || '').trim()]))) };
}
