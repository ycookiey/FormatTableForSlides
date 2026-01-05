/**
 * ストレージモジュール - localStorage への保存・復元
 */

import type { AllOptions, ThemeName, Density, HighlightPreset } from './types';

/** ローカルストレージのキー */
const STORAGE_KEY = 'formatTableForSlides';

/** 保存するデータの構造 */
interface StoredData {
  input: string;
  options: AllOptions;
}

/** デフォルトのオプション値 */
const DEFAULT_OPTIONS: AllOptions = {
  layout: {
    splitColumns: 1,
    separatorType: 'column',
  },
  style: {
    theme: 'standard-blue',
    zebra: true,
    density: 'standard',
    highlightWords: [],
    highlightPreset: 'yellow',
    highlightCustomColor: '#FFFF99',
  },
  format: {
    addNumbers: false,
    formatNumbers: true,
  },
  hasHeader: true,
};

/**
 * データをローカルストレージに保存
 */
export function saveData(input: string, options: AllOptions): void {
  try {
    const data: StoredData = { input, options };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save data to localStorage:', error);
  }
}

/**
 * ローカルストレージからデータを読み込み
 */
export function loadData(): StoredData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored) as Partial<StoredData>;
    
    // データの妥当性チェックと補完
    return {
      input: typeof data.input === 'string' ? data.input : '',
      options: mergeWithDefaults(data.options),
    };
  } catch (error) {
    console.warn('Failed to load data from localStorage:', error);
    return null;
  }
}

/**
 * 保存データとデフォルト値をマージ（欠損値を補完）
 */
function mergeWithDefaults(options?: Partial<AllOptions>): AllOptions {
  if (!options) return { ...DEFAULT_OPTIONS };

  return {
    layout: {
      splitColumns: isValidSplitColumns(options.layout?.splitColumns)
        ? options.layout!.splitColumns
        : DEFAULT_OPTIONS.layout.splitColumns,
      separatorType: isValidSeparatorType(options.layout?.separatorType)
        ? options.layout!.separatorType
        : DEFAULT_OPTIONS.layout.separatorType,
    },
    style: {
      theme: isValidTheme(options.style?.theme)
        ? options.style!.theme
        : DEFAULT_OPTIONS.style.theme,
      zebra: typeof options.style?.zebra === 'boolean'
        ? options.style.zebra
        : DEFAULT_OPTIONS.style.zebra,
      density: isValidDensity(options.style?.density)
        ? options.style!.density
        : DEFAULT_OPTIONS.style.density,
      highlightWords: Array.isArray(options.style?.highlightWords)
        ? options.style!.highlightWords
        : DEFAULT_OPTIONS.style.highlightWords,
      highlightPreset: isValidHighlightPreset(options.style?.highlightPreset)
        ? options.style!.highlightPreset
        : DEFAULT_OPTIONS.style.highlightPreset,
      highlightCustomColor: typeof options.style?.highlightCustomColor === 'string'
        ? options.style.highlightCustomColor
        : DEFAULT_OPTIONS.style.highlightCustomColor,
    },
    format: {
      addNumbers: typeof options.format?.addNumbers === 'boolean'
        ? options.format.addNumbers
        : DEFAULT_OPTIONS.format.addNumbers,
      formatNumbers: typeof options.format?.formatNumbers === 'boolean'
        ? options.format.formatNumbers
        : DEFAULT_OPTIONS.format.formatNumbers,
    },
    hasHeader: typeof options.hasHeader === 'boolean'
      ? options.hasHeader
      : DEFAULT_OPTIONS.hasHeader,
  };
}

// バリデーション関数
function isValidSplitColumns(value: unknown): value is number {
  return typeof value === 'number' && value >= 1 && value <= 5;
}

function isValidSeparatorType(value: unknown): value is 'column' | 'border' {
  return value === 'column' || value === 'border';
}

function isValidTheme(value: unknown): value is ThemeName {
  return ['standard-blue', 'dark-gray', 'minimal', 'accent-green'].includes(value as string);
}

function isValidDensity(value: unknown): value is Density {
  return ['comfortable', 'standard', 'compact', 'extra-comfortable', 'extra-compact'].includes(value as string);
}

function isValidHighlightPreset(value: unknown): value is HighlightPreset {
  return ['yellow', 'green', 'pink', 'blue', 'orange', 'custom'].includes(value as string);
}

/**
 * ローカルストレージをクリア
 */
export function clearData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
}
