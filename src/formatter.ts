/**
 * データ加工 - 連番付与、数値フォーマット、配置検出
 */

import type { TableData, Alignment } from './types';

/**
 * 連番列を先頭に追加
 */
export function addRowNumbers(data: TableData): TableData {
  const numberedHeaders = ['No.', ...data.headers];
  
  let currentNumber = 1;
  const numberedRows = data.rows.map(row => {
    // 空行（全セルが空）はスキップ
    const isEmpty = row.every(cell => cell === '');
    if (isEmpty) {
      return ['', ...row];
    }
    return [String(currentNumber++), ...row];
  });

  return {
    headers: numberedHeaders,
    rows: numberedRows,
    hasHeader: data.hasHeader,
  };
}

/**
 * 数値を3桁区切りにフォーマット
 */
export function formatNumbers(data: TableData): TableData {
  const formattedRows = data.rows.map(row =>
    row.map(cell => formatNumberCell(cell))
  );

  return {
    headers: data.headers,
    rows: formattedRows,
    hasHeader: data.hasHeader,
  };
}

/**
 * セルの値が数値なら3桁区切りに変換
 */
function formatNumberCell(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return value;

  // 数値かどうかチェック（整数または小数）
  const numericPattern = /^-?\d+(\.\d+)?$/;
  if (!numericPattern.test(trimmed)) {
    return value;
  }

  const num = parseFloat(trimmed);
  if (isNaN(num)) return value;

  // 3桁区切りでフォーマット
  return num.toLocaleString('ja-JP');
}

/**
 * 列ごとの配置を自動検出
 */
export function detectAlignment(data: TableData): Alignment[] {
  const columnCount = data.headers.length;
  const alignments: Alignment[] = [];

  for (let col = 0; col < columnCount; col++) {
    const columnValues = data.rows.map(row => row[col] || '');
    alignments.push(detectColumnAlignment(columnValues));
  }

  return alignments;
}

/**
 * 列の値から配置を判定
 * 数値が多ければ右寄せ、それ以外は左寄せ
 */
function detectColumnAlignment(values: string[]): Alignment {
  const nonEmptyValues = values.filter(v => v.trim() !== '');
  if (nonEmptyValues.length === 0) return 'left';

  const numericCount = nonEmptyValues.filter(v => isNumeric(v)).length;
  const numericRatio = numericCount / nonEmptyValues.length;

  // 50%以上が数値なら右寄せ
  return numericRatio >= 0.5 ? 'right' : 'left';
}

/**
 * 値が数値かどうかチェック
 */
export function isNumeric(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  // 3桁区切りカンマを含む数値もOK
  const numericPattern = /^-?[\d,]+(\.\d+)?$/;
  return numericPattern.test(trimmed);
}
