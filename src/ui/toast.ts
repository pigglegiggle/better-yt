/**
 * Lightweight Toast Notification Component for Better-YT
 * Injects non-intrusive toast messages adhering to secure DOM rules.
 */

export interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

let toastContainer: HTMLElement | null = null;

function ensureToastContainer(): HTMLElement {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }

  const existing = document.getElementById('better-yt-toast-container');
  if (existing) {
    toastContainer = existing;
    return toastContainer;
  }

  const container = document.createElement('div');
  container.id = 'better-yt-toast-container';
  container.className = 'better-yt-toast-container';
  document.body.appendChild(container);
  toastContainer = container;
  return toastContainer;
}

export function showToast(options: ToastOptions): () => void {
  const container = ensureToastContainer();

  const toast = document.createElement('div');
  toast.className = 'better-yt-toast';

  const textSpan = document.createElement('span');
  textSpan.className = 'better-yt-toast-text';
  textSpan.textContent = options.message;
  toast.appendChild(textSpan);

  if (options.actionLabel && options.onAction) {
    const actionBtn = document.createElement('button');
    actionBtn.className = 'better-yt-toast-action';
    actionBtn.textContent = options.actionLabel;
    actionBtn.type = 'button';
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      options.onAction?.();
      dismiss();
    });
    toast.appendChild(actionBtn);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'better-yt-toast-close';
  closeBtn.textContent = '×';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.addEventListener('click', () => {
    dismiss();
  });
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  let dismissTimer: ReturnType<typeof setTimeout> | null = null;

  const dismiss = () => {
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
    toast.classList.remove('visible');
    toast.addEventListener(
      'transitionend',
      () => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      },
      { once: true }
    );
  };

  const duration = options.durationMs ?? 4000;
  dismissTimer = setTimeout(dismiss, duration);

  return dismiss;
}
