/**
 * Safe DOM Utilities for Better-YT
 * Adheres strictly to secure DOM manipulation guidelines (no innerHTML, textContent only).
 */

/**
 * Checks whether an event target is an active text input or editable element.
 * Used by keyboard shortcuts to ensure normal typing is not intercepted.
 */
export function isEditable(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toUpperCase();
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }

  if (target.isContentEditable) {
    return true;
  }

  const role = target.getAttribute('role');
  if (role === 'textbox' || role === 'searchbox' || role === 'combobox') {
    return true;
  }

  // YouTube's custom paper-input and search elements
  if (target.closest('ytd-searchbox') || target.closest('#search-form') || target.closest('[contenteditable="true"]')) {
    return true;
  }

  return false;
}

/**
 * Debounces a function call by a specified delay in milliseconds.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Args) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delayMs);
  };
}

/**
 * Safely creates an SVG icon from an XML string using DOMParser.
 */
export function createSvgElement(svgString: string): SVGElement | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return null;
    }
    const svg = doc.documentElement;
    if (svg instanceof SVGElement) {
      return svg;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Asynchronously waits for an element matching the selector to appear in the DOM.
 */
export function waitForElement<T extends Element>(
  selector: string,
  timeoutMs = 5000,
  root: ParentNode = document
): Promise<T | null> {
  return new Promise((resolve) => {
    const existing = root.querySelector<T>(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    let observer: MutationObserver | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    timer = setTimeout(() => {
      cleanup();
      resolve(null);
    }, timeoutMs);

    observer = new MutationObserver(() => {
      const match = root.querySelector<T>(selector);
      if (match) {
        cleanup();
        resolve(match);
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}
