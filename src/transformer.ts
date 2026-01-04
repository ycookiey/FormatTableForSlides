/**
 * 段組み変換ロジック (Down-then-Across)
 */

import type { TableData, LayoutOptions } from './types';

/**
 * データを指定した分割数で段組みに変換
 * Down-then-Across: 上から下、次に右へ
 */
export function splitColumns(data: TableData, columns: number): TableData[] {
  if (columns <= 1 || data.rows.length === 0) {
    return [data];
  }

  const totalRows = data.rows.length;
  const rowsPerColumn = Math.ceil(totalRows / columns);
  const blocks: TableData[] = [];

  for (let col = 0; col < columns; col++) {
    const startIndex = col * rowsPerColumn;
    const endIndex = Math.min(startIndex + rowsPerColumn, totalRows);
    
    if (startIndex >= totalRows) {
      // 空のブロック（データが足りない場合）
      blocks.push({
        headers: data.headers,
        rows: Array(rowsPerColumn).fill(null).map(() => 
          Array(data.headers.length).fill('')
        ),
        hasHeader: data.hasHeader,
      });
    } else {
      const blockRows = data.rows.slice(startIndex, endIndex);
      
      // 行数を揃える
      while (blockRows.length < rowsPerColumn) {
        blockRows.push(Array(data.headers.length).fill(''));
      }

      blocks.push({
        headers: data.headers,
        rows: blockRows,
        hasHeader: data.hasHeader,
      });
    }
  }

  return blocks;
}

/**
 * 分割されたブロックを横に結合
 */
export function mergeBlocks(
  blocks: TableData[],
  options: LayoutOptions
): TableData {
  if (blocks.length === 0) {
    return { headers: [], rows: [], hasHeader: false };
  }

  if (blocks.length === 1) {
    return blocks[0];
  }

  const addSeparatorColumn = options.separatorType === 'column';
  const addBorderSeparator = options.separatorType === 'border';
  const mergedHeaders: string[] = [];
  const rowCount = Math.max(...blocks.map(b => b.rows.length));
  const mergedRows: string[][] = Array(rowCount).fill(null).map(() => []);
  const separatorColumns: number[] = [];
  const borderBoundaries: number[] = []; // 罫線を引く列（右側に罫線）

  blocks.forEach((block, blockIndex) => {
    // ブロック間に区切り列を追加
    if (blockIndex > 0 && addSeparatorColumn) {
      separatorColumns.push(mergedHeaders.length);
      mergedHeaders.push('');
      for (let i = 0; i < rowCount; i++) {
        mergedRows[i].push('');
      }
    }

    // ブロック境界（罫線モード）: 前のブロックの最後の列に太い右罫線
    if (blockIndex > 0 && addBorderSeparator) {
      borderBoundaries.push(mergedHeaders.length - 1);
    }

    // ヘッダーを追加
    mergedHeaders.push(...block.headers);

    // 行を追加
    for (let i = 0; i < rowCount; i++) {
      const row = block.rows[i] || Array(block.headers.length).fill('');
      mergedRows[i].push(...row);
    }
  });

  return {
    headers: mergedHeaders,
    rows: mergedRows,
    hasHeader: blocks[0].hasHeader,
    separatorColumns: separatorColumns.length > 0 ? separatorColumns : undefined,
    borderBoundaries: borderBoundaries.length > 0 ? borderBoundaries : undefined,
  };
}

/**
 * 段組み変換の完全なパイプライン
 */
export function transformLayout(
  data: TableData,
  options: LayoutOptions
): TableData {
  const blocks = splitColumns(data, options.splitColumns);
  return mergeBlocks(blocks, options);
}
