/**
 * HTMLテーブル生成・スタイリング
 */

import type { TableData, StyleOptions, ThemeColors, ThemeName, Density, Alignment } from './types';
import { detectAlignment } from './formatter';

/** テーマカラー定義 */
const THEMES: Record<ThemeName, ThemeColors> = {
  'standard-blue': {
    headerBg: '#4472C4',
    headerText: '#FFFFFF',
    zebraEven: '#D6E3F8',
    zebraOdd: '#FFFFFF',
  },
  'dark-gray': {
    headerBg: '#404040',
    headerText: '#FFFFFF',
    zebraEven: '#E8E8E8',
    zebraOdd: '#FFFFFF',
  },
  'minimal': {
    headerBg: '#F5F5F5',
    headerText: '#333333',
    zebraEven: '#FAFAFA',
    zebraOdd: '#FFFFFF',
  },
  'accent-green': {
    headerBg: '#70AD47',
    headerText: '#FFFFFF',
    zebraEven: '#E2EFDA',
    zebraOdd: '#FFFFFF',
  },
};

/** 密度ごとのパディング */
const DENSITY_PADDING: Record<Density, string> = {
  comfortable: '12px 16px',
  standard: '8px 12px',
  compact: '4px 8px',
};

/**
 * 文字列の推定幅を計算（全角=2, 半角=1として概算）
 */
function estimateTextWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    // 全角文字の判定（日本語、全角記号など）
    if (char.match(/[^\x00-\x7F]|[ａ-ｚＡ-Ｚ０-９]/)) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

/**
 * 列ごとの最大幅を計算（ヘッダーを含む）
 */
function calculateColumnWidths(data: TableData, separatorSet: Set<number>): number[] {
  const columnCount = data.headers.length;
  const widths: number[] = [];

  for (let col = 0; col < columnCount; col++) {
    if (separatorSet.has(col)) {
      // 区切り列は固定幅
      widths.push(0);
      continue;
    }

    // ヘッダーの幅
    let maxWidth = data.hasHeader ? estimateTextWidth(data.headers[col] || '') : 0;

    // データ行の幅
    for (const row of data.rows) {
      const cellWidth = estimateTextWidth(row[col] || '');
      if (cellWidth > maxWidth) {
        maxWidth = cellWidth;
      }
    }

    widths.push(maxWidth);
  }

  return widths;
}

/**
 * HTMLテーブルを生成（インラインスタイル付き）
 */
export function renderTable(data: TableData, style: StyleOptions): string {
  if (data.headers.length === 0 && data.rows.length === 0) {
    return '';
  }

  const theme = THEMES[style.theme];
  const padding = DENSITY_PADDING[style.density];
  const alignments = detectAlignment(data);
  const separatorSet = new Set(data.separatorColumns || []);
  
  // 列幅を計算（ヘッダーを含む）
  const columnWidths = calculateColumnWidths(data, separatorSet);

  const tableStyle = `
    border-collapse: collapse;
    font-family: 'Segoe UI', 'Yu Gothic UI', 'Meiryo', sans-serif;
    font-size: 14px;
    width: max-content;
  `.replace(/\s+/g, ' ').trim();

  let html = `<table style="${tableStyle}">`;
  
  // colgroup で列幅を明示的に設定
  html += '<colgroup>';
  columnWidths.forEach((width, colIndex) => {
    if (separatorSet.has(colIndex)) {
      html += '<col style="width: 16px; min-width: 16px;">';
    } else {
      // 文字幅 × 約8px（フォントサイズ14pxの半角幅）+ パディング
      const pxWidth = Math.max(width * 8 + 24, 40); // 最小幅40px
      html += `<col style="width: ${pxWidth}px; min-width: ${pxWidth}px;">`;
    }
  });
  html += '</colgroup>';

  // ヘッダー行
  if (data.hasHeader && data.headers.some(h => h !== '')) {
    html += '<thead><tr>';
    data.headers.forEach((header, colIndex) => {
      if (separatorSet.has(colIndex)) {
        // 区切り列: 透明
        const separatorStyle = buildSeparatorStyle();
        html += `<th style="${separatorStyle}"></th>`;
      } else {
        const headerStyle = buildCellStyle({
          backgroundColor: theme.headerBg,
          color: theme.headerText,
          fontWeight: 'bold',
          padding,
          textAlign: alignments[colIndex] || 'left',
        });
        html += `<th style="${headerStyle}">${escapeHtml(header)}</th>`;
      }
    });
    html += '</tr></thead>';
  }

  // データ行
  html += '<tbody>';
  data.rows.forEach((row, rowIndex) => {
    const isEven = rowIndex % 2 === 0;
    const rowBg = style.zebra 
      ? (isEven ? theme.zebraOdd : theme.zebraEven)
      : '#FFFFFF';

    html += '<tr>';
    row.forEach((cell, colIndex) => {
      if (separatorSet.has(colIndex)) {
        // 区切り列: 透明
        const separatorStyle = buildSeparatorStyle();
        html += `<td style="${separatorStyle}"></td>`;
      } else {
        const cellStyle = buildCellStyle({
          backgroundColor: rowBg,
          padding,
          textAlign: alignments[colIndex] || 'left',
        });
        html += `<td style="${cellStyle}">${escapeHtml(cell)}</td>`;
      }
    });
    html += '</tr>';
  });
  html += '</tbody>';

  html += '</table>';
  return html;
}

interface CellStyleOptions {
  backgroundColor?: string;
  color?: string;
  fontWeight?: string;
  padding: string;
  textAlign: Alignment;
}

function buildCellStyle(options: CellStyleOptions): string {
  const styles: string[] = [
    'border: 1px solid #D0D0D0',
    `padding: ${options.padding}`,
    `text-align: ${options.textAlign}`,
    'white-space: nowrap',
  ];

  if (options.backgroundColor) {
    styles.push(`background-color: ${options.backgroundColor}`);
  }
  if (options.color) {
    styles.push(`color: ${options.color}`);
  }
  if (options.fontWeight) {
    styles.push(`font-weight: ${options.fontWeight}`);
  }

  return styles.join('; ');
}

/**
 * 区切り列用の透明スタイル
 */
function buildSeparatorStyle(): string {
  return [
    'border: none',
    'background-color: transparent',
    'padding: 0 8px',
    'width: 16px',
    'min-width: 16px',
  ].join('; ');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * プレーンテキスト形式でテーブルを生成（タブ区切り）
 */
export function renderPlainText(data: TableData): string {
  const lines: string[] = [];

  if (data.hasHeader && data.headers.some(h => h !== '')) {
    lines.push(data.headers.join('\t'));
  }

  data.rows.forEach(row => {
    lines.push(row.join('\t'));
  });

  return lines.join('\n');
}
