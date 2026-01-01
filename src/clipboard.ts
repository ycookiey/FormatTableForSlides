/**
 * クリップボード操作
 */

/**
 * HTMLとプレーンテキストをクリップボードにコピー
 */
export async function copyToClipboard(html: string, plainText: string): Promise<void> {
  try {
    // Clipboard API を使用（HTML + テキスト同時）
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([plainText], { type: 'text/plain' });

    const clipboardItem = new ClipboardItem({
      'text/html': htmlBlob,
      'text/plain': textBlob,
    });

    await navigator.clipboard.write([clipboardItem]);
  } catch (error) {
    // フォールバック: テキストのみ
    console.warn('Clipboard API failed, falling back to text-only:', error);
    await navigator.clipboard.writeText(plainText);
  }
}

/**
 * トースト通知を表示
 */
export function showToast(message: string, duration: number = 2000): void {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}
