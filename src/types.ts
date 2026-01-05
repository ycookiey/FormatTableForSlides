/**
 * 型定義 - FormatTableForSlides
 */

/** パース済みテーブルデータ */
export interface TableData {
  headers: string[];
  rows: string[][];
  hasHeader: boolean;
  /** 区切り列のインデックス（透明化対象） */
  separatorColumns?: number[];
  /** ブロック境界の列インデックス（右側に太い罫線を引く） */
  borderBoundaries?: number[];
}

/** レイアウト設定 */
export interface LayoutOptions {
  /** 分割数（1-10） */
  splitColumns: number;
  /** ブロック区切りタイプ */
  separatorType: SeparatorType;
}

/** デザイン設定 */
export interface StyleOptions {
  /** テーマ名 */
  theme: ThemeName;
  /** ゼブラストライプを有効化 */
  zebra: boolean;
  /** 密度 */
  density: Density;
}

/** データ加工設定 */
export interface FormatOptions {
  /** 自動連番を付与 */
  addNumbers: boolean;
  /** 数値を3桁区切りに */
  formatNumbers: boolean;
}

/** 全オプションを統合 */
export interface AllOptions {
  layout: LayoutOptions;
  style: StyleOptions;
  format: FormatOptions;
  hasHeader: boolean;
}

/** テーマ名 */
export type ThemeName = 'standard-blue' | 'dark-gray' | 'minimal' | 'accent-green';

/** 密度 */
export type Density = 'extra-comfortable' | 'comfortable' | 'standard' | 'compact' | 'extra-compact';

/** ブロック区切りタイプ */
export type SeparatorType = 'none' | 'column' | 'border';

/** テーマカラー定義 */
export interface ThemeColors {
  headerBg: string;
  headerText: string;
  zebraEven: string;
  zebraOdd: string;
}

/** セルの配置 */
export type Alignment = 'left' | 'right' | 'center';

/** セル情報 */
export interface CellInfo {
  value: string;
  alignment: Alignment;
  isNumeric: boolean;
}
