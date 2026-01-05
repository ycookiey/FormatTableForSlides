/**
 * メインエントリーポイント - イベント処理・状態管理
 */

import './style.css';
import type { AllOptions, TableData, ThemeName, Density, SeparatorType, HighlightPreset } from './types';
import { parseInput, normalizeColumns } from './parser';
import { transformLayout } from './transformer';
import { addRowNumbers, formatNumbers } from './formatter';
import { renderTable, renderPlainText } from './renderer';
import { copyToClipboard, showToast } from './clipboard';
import { saveData, loadData } from './storage';

// DOM要素
const elements = {
  dataInput: document.getElementById('data-input') as HTMLTextAreaElement,
  splitColumns: document.getElementById('split-columns') as HTMLInputElement,
  headerOption: document.getElementById('header-option') as HTMLInputElement,
  separatorType: document.getElementById('separator-type') as HTMLDivElement,
  addNumbers: document.getElementById('add-numbers') as HTMLInputElement,
  formatNumbers: document.getElementById('format-numbers') as HTMLInputElement,
  theme: document.getElementById('theme') as HTMLDivElement,
  zebra: document.getElementById('zebra') as HTMLInputElement,
  density: document.getElementById('density') as HTMLInputElement,
  highlightWords: document.getElementById('highlight-words') as HTMLTextAreaElement,
  highlightPresets: document.getElementById('highlight-presets') as HTMLDivElement,
  highlightCustomColor: document.getElementById('highlight-custom-color') as HTMLInputElement,
  preview: document.getElementById('preview') as HTMLDivElement,
  copyButton: document.getElementById('copy-button') as HTMLButtonElement,
  sampleButton: document.getElementById('sample-button') as HTMLButtonElement,
};

/** セグメントコントロールから値を取得 */
function getSegmentValue(container: HTMLElement): string {
  const active = container.querySelector('button.active');
  return active?.getAttribute('data-value') || '';
}

/** セグメントコントロールに値を設定 */
function setSegmentValue(container: HTMLElement, value: string): void {
  container.querySelectorAll('button').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-value') === value);
  });
}

/** 色ボタンのセグメント値を取得（data-color属性用） */
function getColorSegmentValue(container: HTMLElement): string {
  const active = container.querySelector('button.active');
  return active?.getAttribute('data-color') || '';
}

/** 色ボタンのセグメント値を設定（data-color属性用） */
function setColorSegmentValue(container: HTMLElement, value: string): void {
  container.querySelectorAll('button').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-color') === value);
  });
}

/** 密度スライダー値(1-5)からDensity型へ変換 (左=狭、右=広) */
const DENSITY_MAP: Record<number, Density> = {
  1: 'extra-compact',
  2: 'compact',
  3: 'standard',
  4: 'comfortable',
  5: 'extra-comfortable',
};

/** Density型からスライダー値(1-5)へ変換 */
const DENSITY_REVERSE: Record<Density, number> = {
  'extra-compact': 1,
  'compact': 2,
  'standard': 3,
  'comfortable': 4,
  'extra-comfortable': 5,
};

// サンプルデータ
const SAMPLE_DATA = `名前	部署	売上
田中太郎	営業部	1234567
鈴木花子	開発部	987654
佐藤次郎	人事部	456789
山田三郎	総務部	123456
高橋四郎	経理部	789012
伊藤五郎	営業部	345678
渡辺六郎	開発部	567890
中村七子	人事部	234567`;

// 現在の生成結果を保持
let currentHtml = '';
let currentPlainText = '';

/**
 * 現在のオプション設定を取得
 */
function getOptions(): AllOptions {
  const densityValue = parseInt(elements.density.value, 10);
  return {
    layout: {
      splitColumns: parseInt(elements.splitColumns.value, 10),
      separatorType: getSegmentValue(elements.separatorType) as SeparatorType,
    },
    style: {
      theme: getSegmentValue(elements.theme) as ThemeName,
      zebra: elements.zebra.checked,
      density: DENSITY_MAP[densityValue] || 'standard',
      highlightWords: parseHighlightWords(elements.highlightWords.value),
      highlightPreset: (getColorSegmentValue(elements.highlightPresets) as HighlightPreset) || 'yellow',
      highlightCustomColor: elements.highlightCustomColor.value,
    },
    format: {
      addNumbers: elements.addNumbers.checked,
      formatNumbers: elements.formatNumbers.checked,
    },
    hasHeader: elements.headerOption.checked,
  };
}

/**
 * プレビューを更新
 */
function updatePreview(): void {
  const inputText = elements.dataInput.value;
  const options = getOptions();

  if (!inputText.trim()) {
    elements.preview.innerHTML = '<p class="placeholder-text">データを入力するとプレビューが表示されます</p>';
    elements.preview.className = 'preview-area';
    currentHtml = '';
    currentPlainText = '';
    return;
  }

  // 1. パース
  let data: TableData = parseInput(inputText, options.hasHeader);
  data = normalizeColumns(data);

  // 2. データ加工
  if (options.format.addNumbers) {
    data = addRowNumbers(data);
  }
  if (options.format.formatNumbers) {
    data = formatNumbers(data);
  }

  // 3. レイアウト変換
  data = transformLayout(data, options.layout);

  // 4. レンダリング
  currentHtml = renderTable(data, options.style);
  currentPlainText = renderPlainText(data);

  // プレビュー表示
  elements.preview.innerHTML = currentHtml || '<p class="placeholder-text">データを入力するとプレビューが表示されます</p>';
  elements.preview.className = `preview-area density-${options.style.density}`;

  // 設定を自動保存
  saveData(inputText, options);
}

/**
 * デバウンス関数
 */
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// デバウンス付きの更新関数
const debouncedUpdate = debounce(updatePreview, 100);

/** ハイライト単語をパース（カンマ、セミコロン、改行、和文句読点に対応） */
function parseHighlightWords(input: string): string[] {
  return input
    .split(/[,、，;;\n\r]+/)
    .map(w => w.trim())
    .filter(w => w.length > 0);
}

/**
 * イベントリスナーを設定
 */
function setupEventListeners(): void {
  // テキスト入力（デバウンス付き）
  elements.dataInput.addEventListener('input', debouncedUpdate);

  // 分割数スライダー
  elements.splitColumns.addEventListener('input', updatePreview);

  // 密度スライダー
  elements.density.addEventListener('input', updatePreview);

  // その他のオプション（即時更新）
  elements.headerOption.addEventListener('change', updatePreview);
  elements.addNumbers.addEventListener('change', updatePreview);
  elements.formatNumbers.addEventListener('change', updatePreview);
  elements.zebra.addEventListener('change', updatePreview);

  // セグメントコントロール(テーマ)
  elements.theme.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON') {
      setSegmentValue(elements.theme, target.getAttribute('data-value') || '');
      updatePreview();
    }
  });

  // セグメントコントロール(ブロック区切り)
  elements.separatorType.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON') {
      setSegmentValue(elements.separatorType, target.getAttribute('data-value') || '');
      updatePreview();
    }
  });

  // ハイライト単語入力（デバウンス付き）
  elements.highlightWords.addEventListener('input', debouncedUpdate);

  // ハイライト色プリセット
  elements.highlightPresets.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON') {
      const color = target.getAttribute('data-color') || 'yellow';
      setColorSegmentValue(elements.highlightPresets, color);
      
      // customの場合はカラーピッカーを表示
      if (color === 'custom') {
        elements.highlightCustomColor.classList.remove('hidden');
      } else {
        elements.highlightCustomColor.classList.add('hidden');
      }
      updatePreview();
    }
  });

  // カスタムカラーピッカー
  elements.highlightCustomColor.addEventListener('input', updatePreview);

  // サンプル入力ボタン
  elements.sampleButton.addEventListener('click', () => {
    elements.dataInput.value = SAMPLE_DATA;
    updatePreview();
  });

  // コピーボタン
  elements.copyButton.addEventListener('click', async () => {
    if (!currentHtml) {
      showToast('コピーするデータがありません');
      return;
    }

    try {
      await copyToClipboard(currentHtml, currentPlainText);
      showToast('コピーしました！');
    } catch (error) {
      console.error('Copy failed:', error);
      showToast('コピーに失敗しました');
    }
  });
}

/**
 * 保存されたデータをUIに復元
 */
function loadStoredData(): void {
  const stored = loadData();
  if (!stored) return;

  // 入力を復元
  elements.dataInput.value = stored.input;

  // オプションを復元
  elements.splitColumns.value = String(stored.options.layout.splitColumns);
  setSegmentValue(elements.separatorType, stored.options.layout.separatorType);
  elements.headerOption.checked = stored.options.hasHeader;
  elements.addNumbers.checked = stored.options.format.addNumbers;
  elements.formatNumbers.checked = stored.options.format.formatNumbers;
  setSegmentValue(elements.theme, stored.options.style.theme);
  elements.zebra.checked = stored.options.style.zebra;
  elements.density.value = String(DENSITY_REVERSE[stored.options.style.density] || 3);

  // ハイライト設定を復元
  elements.highlightWords.value = stored.options.style.highlightWords.join(', ');
  setColorSegmentValue(elements.highlightPresets, stored.options.style.highlightPreset);
  elements.highlightCustomColor.value = stored.options.style.highlightCustomColor;
  if (stored.options.style.highlightPreset === 'custom') {
    elements.highlightCustomColor.classList.remove('hidden');
  }
}

// 初期化
loadStoredData();
setupEventListeners();
updatePreview();
