/**
 * Native App Search Overlay for Better-YT
 * Triggered by Ctrl+L / Cmd+L or the search button in title bar.
 */

import { getSearchUrl } from '../utils/url';
import { createSvgElement } from '../utils/dom';

export class SearchOverlay {
  private overlayEl: HTMLElement | null = null;
  private inputEl: HTMLInputElement | null = null;
  private isOpen = false;

  constructor() {
    this.createDom();
  }

  private createDom(): void {
    if (this.overlayEl) return;

    const overlay = document.createElement('div');
    overlay.id = 'better-yt-search-overlay';
    overlay.className = 'better-yt-search-overlay';
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('role', 'dialog');
    overlay.style.display = 'none';

    const backdrop = document.createElement('div');
    backdrop.className = 'better-yt-search-backdrop';
    backdrop.addEventListener('click', () => this.close());
    overlay.appendChild(backdrop);

    const dialog = document.createElement('div');
    dialog.className = 'better-yt-search-box';

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'better-yt-search-input-wrapper';

    // Search SVG Icon
    const searchIcon = createSvgElement(
      `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="better-yt-search-icon">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>`
    );
    if (searchIcon) {
      inputWrapper.appendChild(searchIcon);
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'better-yt-search-input';
    input.placeholder = 'Search YouTube or enter URL...';
    input.setAttribute('aria-label', 'Search YouTube');
    input.autocomplete = 'off';
    input.spellcheck = false;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.submit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });

    inputWrapper.appendChild(input);
    this.inputEl = input;

    const hint = document.createElement('div');
    hint.className = 'better-yt-search-hint';
    
    const enterBadge = document.createElement('kbd');
    enterBadge.textContent = '↵ Enter';
    const escBadge = document.createElement('kbd');
    escBadge.textContent = 'Esc';

    hint.appendChild(enterBadge);
    const submitText = document.createTextNode(' to search • ');
    hint.appendChild(submitText);
    hint.appendChild(escBadge);
    const closeText = document.createTextNode(' to close');
    hint.appendChild(closeText);

    dialog.appendChild(inputWrapper);
    dialog.appendChild(hint);
    overlay.appendChild(dialog);

    document.body.appendChild(overlay);
    this.overlayEl = overlay;
  }

  public open(): void {
    if (!this.overlayEl) {
      this.createDom();
    }
    if (!this.overlayEl || !this.inputEl) return;

    this.isOpen = true;
    this.overlayEl.style.display = 'flex';
    requestAnimationFrame(() => {
      this.overlayEl?.classList.add('visible');
      this.inputEl?.focus();
      this.inputEl?.select();
    });
  }

  public close(): void {
    if (!this.isOpen || !this.overlayEl) return;
    this.isOpen = false;
    this.overlayEl.classList.remove('visible');
    setTimeout(() => {
      if (!this.isOpen && this.overlayEl) {
        this.overlayEl.style.display = 'none';
      }
    }, 200);
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }

  private submit(): void {
    if (!this.inputEl) return;
    const rawQuery = this.inputEl.value.trim();
    if (!rawQuery) return;

    this.close();

    // If user entered a full URL, navigate directly if safe
    if (rawQuery.startsWith('http://') || rawQuery.startsWith('https://')) {
      window.location.href = rawQuery;
      return;
    }

    const searchUrl = getSearchUrl(rawQuery);
    window.location.href = searchUrl;
  }
}

export const searchOverlay = new SearchOverlay();
