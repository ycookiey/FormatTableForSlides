/**
 * データパーサー - タブ/カンマ区切りの自動判別
 */

import type { TableData } from './types';

/**
 * テキストデータをパースしてTableDataに変換
 */
export function parseInput(text: string, hasHeader: boolean): TableData {
  const trimmed = text.trim();
  if (!trimmed) {
    return { headers: [], rows: [], hasHeader };
  }

  const lines = trimmed.split(/\r?\n/);
  const delimiter = detectDelimiter(trimmed);
  
  const allRows = lines
    .map(line => parseLine(line, delimiter))
    .filter(row => row.length > 0);

  if (allRows.length === 0) {
    return { headers: [], rows: [], hasHeader };
  }

  if (hasHeader && allRows.length > 0) {
    return {
      headers: allRows[0],
      rows: allRows.slice(1),
      hasHeader: true,
    };
  }

  // ヘッダーなしの場合、列数分の空ヘッダーを生成
  const columnCount = Math.max(...allRows.map(r => r.length));
  return {
    headers: Array(columnCount).fill(''),
    rows: allRows,
    hasHeader: false,
  };
}

/**
 * 区切り文字を自動判別
 * タブの出現回数がカンマより多ければタブ区切り、それ以外はカンマ
 */
function detectDelimiter(text: string): string {
  const tabCount = (text.match(/\t/g) || []).length;
  const commaCount = (text.match(/,/g) || []).length;
  return tabCount >= commaCount ? '\t' : ',';
}

/**
 * 1行をパース（CSVの引用符対応）
 */
function parseLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // エスケープされた引用符
        current += '"';
        i++;
      } else if (char === '"') {
        // 引用符終了
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * 列数を揃える（短い行を空文字で埋める）
 */
export function normalizeColumns(data: TableData): TableData {
  const maxColumns = Math.max(
    data.headers.length,
    ...data.rows.map(row => row.length)
  );

  const normalizedHeaders = [...data.headers];
  while (normalizedHeaders.length < maxColumns) {
    normalizedHeaders.push('');
  }

  const normalizedRows = data.rows.map(row => {
    const newRow = [...row];
    while (newRow.length < maxColumns) {
      newRow.push('');
    }
    return newRow;
  });

  return {
    headers: normalizedHeaders,
    rows: normalizedRows,
    hasHeader: data.hasHeader,
  };
}
