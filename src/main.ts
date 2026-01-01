/**
 * メインエントリーポイント - イベント処理・状態管理
 */

import './style.css';
import type { AllOptions, TableData, ThemeName, Density } from './types';
import { parseInput, normalizeColumns } from './parser';
import { transformLayout } from './transformer';
import { addRowNumbers, formatNumbers } from './formatter';
import { renderTable, renderPlainText } from './renderer';
import { copyToClipboard, showToast } from './clipboard';

// DOM要素
const elements = {
  dataInput: document.getElementById('data-input') as HTMLTextAreaElement,
  splitColumns: document.getElementById('split-columns') as HTMLInputElement,
  splitValue: document.getElementById('split-value') as HTMLSpanElement,
  headerOption: document.getElementById('header-option') as HTMLInputElement,
  separatorType: document.getElementById('separator-type') as HTMLSelectElement,
  addNumbers: document.getElementById('add-numbers') as HTMLInputElement,
  formatNumbers: document.getElementById('format-numbers') as HTMLInputElement,
  theme: document.getElementById('theme') as HTMLSelectElement,
  zebra: document.getElementById('zebra') as HTMLInputElement,
  density: document.getElementById('density') as HTMLSelectElement,
  preview: document.getElementById('preview') as HTMLDivElement,
  copyButton: document.getElementById('copy-button') as HTMLButtonElement,
  sampleButton: document.getElementById('sample-button') as HTMLButtonElement,
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
  return {
    layout: {
      splitColumns: parseInt(elements.splitColumns.value, 10),
      separatorType: elements.separatorType.value as 'column' | 'border',
    },
    style: {
      theme: elements.theme.value as ThemeName,
      zebra: elements.zebra.checked,
      density: elements.density.value as Density,
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

/**
 * イベントリスナーを設定
 */
function setupEventListeners(): void {
  // テキスト入力（デバウンス付き）
  elements.dataInput.addEventListener('input', debouncedUpdate);

  // 分割数スライダー
  elements.splitColumns.addEventListener('input', () => {
    elements.splitValue.textContent = elements.splitColumns.value;
    updatePreview();
  });

  // その他のオプション（即時更新）
  elements.headerOption.addEventListener('change', updatePreview);
  elements.separatorType.addEventListener('change', updatePreview);
  elements.addNumbers.addEventListener('change', updatePreview);
  elements.formatNumbers.addEventListener('change', updatePreview);
  elements.theme.addEventListener('change', updatePreview);
  elements.zebra.addEventListener('change', updatePreview);
  elements.density.addEventListener('change', updatePreview);

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

// 初期化
setupEventListeners();
updatePreview();
