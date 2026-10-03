/**
 * Settings Modal for Better-YT
 * Compact, dark-themed configuration dialog adhering to secure DOM rules.
 */

import {
  AppSettings,
  DEFAULT_SETTINGS,
  settingsManager,
  VALID_PLAYBACK_SPEEDS,
  VALID_QUALITIES,
  VALID_SPONSOR_CATEGORIES,
} from '../settings';
import { showToast } from './toast';

export class SettingsModal {
  private modalEl: HTMLElement | null = null;
  private isOpen = false;
  private currentTab = 'general';
  private draftSettings: AppSettings = { ...DEFAULT_SETTINGS };

  constructor() {
    this.createDom();
  }

  private createDom(): void {
    if (this.modalEl) return;

    const modal = document.createElement('div');
    modal.id = 'better-yt-settings-modal';
    modal.className = 'better-yt-settings-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.style.display = 'none';

    const backdrop = document.createElement('div');
    backdrop.className = 'better-yt-settings-backdrop';
    backdrop.addEventListener('click', () => this.close());
    modal.appendChild(backdrop);

    const dialog = document.createElement('div');
    dialog.className = 'better-yt-settings-dialog';

    // Header
    const header = document.createElement('div');
    header.className = 'better-yt-settings-header';

    const titleBox = document.createElement('div');
    titleBox.className = 'better-yt-settings-title-box';

    const title = document.createElement('h2');
    title.className = 'better-yt-settings-title';
    title.textContent = 'Settings';
    titleBox.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'better-yt-settings-subtitle';
    subtitle.textContent = 'Better YT Preferences';
    titleBox.appendChild(subtitle);

    header.appendChild(titleBox);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'better-yt-settings-close-btn';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close settings');
    closeBtn.type = 'button';
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(closeBtn);

    dialog.appendChild(header);

    // Body (Tabs Sidebar + Tab Content)
    const body = document.createElement('div');
    body.className = 'better-yt-settings-body';

    // Tabs Nav
    const nav = document.createElement('nav');
    nav.className = 'better-yt-settings-nav';

    const tabs = [
      { id: 'general', label: 'General' },
      { id: 'content', label: 'Content Filters' },
      { id: 'playback', label: 'Playback' },
      { id: 'appearance', label: 'Appearance' },
      { id: 'advanced', label: 'Advanced' },
      { id: 'about', label: 'About' },
    ];

    for (const tab of tabs) {
      const tabBtn = document.createElement('button');
      tabBtn.className = `better-yt-nav-btn ${tab.id === this.currentTab ? 'active' : ''}`;
      tabBtn.dataset.tab = tab.id;
      tabBtn.textContent = tab.label;
      tabBtn.type = 'button';
      tabBtn.addEventListener('click', () => this.switchTab(tab.id));
      nav.appendChild(tabBtn);
    }

    body.appendChild(nav);

    // Content container
    const content = document.createElement('div');
    content.className = 'better-yt-settings-content';
    content.id = 'better-yt-settings-tab-content';
    body.appendChild(content);

    dialog.appendChild(body);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'better-yt-settings-footer';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'better-yt-btn better-yt-btn-secondary';
    resetBtn.textContent = 'Reset to Defaults';
    resetBtn.type = 'button';
    resetBtn.addEventListener('click', () => this.resetDefaults());
    footer.appendChild(resetBtn);

    const actions = document.createElement('div');
    actions.className = 'better-yt-settings-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'better-yt-btn better-yt-btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    cancelBtn.addEventListener('click', () => this.close());
    actions.appendChild(cancelBtn);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'better-yt-btn better-yt-btn-primary';
    saveBtn.textContent = 'Save Changes';
    saveBtn.type = 'button';
    saveBtn.addEventListener('click', () => this.saveChanges());
    actions.appendChild(saveBtn);

    footer.appendChild(actions);
    dialog.appendChild(footer);
    modal.appendChild(dialog);

    document.body.appendChild(modal);
    this.modalEl = modal;

    // Listen to Escape key
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });
  }

  public open(): void {
    if (!this.modalEl) {
      this.createDom();
    }
    if (!this.modalEl) return;

    this.draftSettings = { ...settingsManager.getSettings() };
    this.renderActiveTab();

    this.isOpen = true;
    this.modalEl.style.display = 'flex';
    requestAnimationFrame(() => {
      this.modalEl?.classList.add('visible');
    });
  }

  public close(): void {
    if (!this.isOpen || !this.modalEl) return;
    this.isOpen = false;
    this.modalEl.classList.remove('visible');
    setTimeout(() => {
      if (!this.isOpen && this.modalEl) {
        this.modalEl.style.display = 'none';
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

  private switchTab(tabId: string): void {
    this.currentTab = tabId;

    // Update active nav button
    const navBtns = this.modalEl?.querySelectorAll('.better-yt-nav-btn');
    navBtns?.forEach((btn) => {
      if (btn instanceof HTMLElement) {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
      }
    });

    this.renderActiveTab();
  }

  private renderActiveTab(): void {
    const container = document.getElementById('better-yt-settings-tab-content');
    if (!container) return;

    container.replaceChildren();

    switch (this.currentTab) {
      case 'general':
        this.renderGeneralTab(container);
        break;
      case 'content':
        this.renderContentTab(container);
        break;
      case 'playback':
        this.renderPlaybackTab(container);
        break;
      case 'appearance':
        this.renderAppearanceTab(container);
        break;
      case 'advanced':
        this.renderAdvancedTab(container);
        break;
      case 'about':
        this.renderAboutTab(container);
        break;
    }
  }

  private createToggleItem(
    title: string,
    description: string,
    checked: boolean,
    onChange: (checked: boolean) => void
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = 'better-yt-setting-row';

    const info = document.createElement('div');
    info.className = 'better-yt-setting-info';

    const titleEl = document.createElement('div');
    titleEl.className = 'better-yt-setting-label';
    titleEl.textContent = title;
    info.appendChild(titleEl);

    const descEl = document.createElement('div');
    descEl.className = 'better-yt-setting-desc';
    descEl.textContent = description;
    info.appendChild(descEl);

    row.appendChild(info);

    const switchLabel = document.createElement('label');
    switchLabel.className = 'better-yt-switch';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.addEventListener('change', () => onChange(input.checked));

    const slider = document.createElement('span');
    slider.className = 'better-yt-slider';

    switchLabel.appendChild(input);
    switchLabel.appendChild(slider);
    row.appendChild(switchLabel);

    return row;
  }

  private renderGeneralTab(container: HTMLElement): void {
    const title = document.createElement('h3');
    title.className = 'better-yt-section-heading';
    title.textContent = 'General Window & System';
    container.appendChild(title);

    container.appendChild(
      this.createToggleItem(
        'Launch Maximized',
        'Open the main application window maximized on startup',
        this.draftSettings.launchMaximized,
        (val) => {
          this.draftSettings.launchMaximized = val;
        }
      )
    );

    container.appendChild(
      this.createToggleItem(
        'Minimize to Tray',
        'Hide application window to system tray when minimized',
        this.draftSettings.minimizeToTray,
        (val) => {
          this.draftSettings.minimizeToTray = val;
        }
      )
    );

    container.appendChild(
      this.createToggleItem(
        'Close to Tray',
        'Keep application running in background tray when window is closed',
        this.draftSettings.closeToTray,
        (val) => {
          this.draftSettings.closeToTray = val;
        }
      )
    );

    container.appendChild(
      this.createToggleItem(
        'Open External Links in Browser',
        'Open non-YouTube links using your default system web browser',
        this.draftSettings.openExternalLinksInBrowser,
        (val) => {
          this.draftSettings.openExternalLinksInBrowser = val;
        }
      )
    );
  }

  private renderContentTab(container: HTMLElement): void {
    const title = document.createElement('h3');
    title.className = 'better-yt-section-heading';
    title.textContent = 'Distraction & Cosmetic Filtering';
    container.appendChild(title);

    container.appendChild(
      this.createToggleItem(
        'Hide Shorts',
        'Remove Shorts navigation links, carousels, and recommendations',
        this.draftSettings.hideShorts,
        (val) => {
          this.draftSettings.hideShorts = val;
        }
      )
    );

    container.appendChild(
      this.createToggleItem(
        'Hide Comments',
        'Completely hide the comment section on video watch pages',
        this.draftSettings.hideComments,
        (val) => {
          this.draftSettings.hideComments = val;
        }
      )
    );

    container.appendChild(
      this.createToggleItem(
        'Hide Sidebar Recommendations',
        'Hide the suggested videos column next to active video players',
        this.draftSettings.hideRecommendations,
        (val) => {
          this.draftSettings.hideRecommendations = val;
        }
      )
    );

    container.appendChild(
      this.createToggleItem(
        'Hide Homepage Recommendation Grid',
        'Create a distraction-free homepage without endless recommendation feeds',
        this.draftSettings.hideHomeRecommendations,
        (val) => {
          this.draftSettings.hideHomeRecommendations = val;
        }
      )
    );

    container.appendChild(
      this.createToggleItem(
        'Hide Merchandise & Promo UI',
        'Hide shopping shelves, ticket banners, and promotional cards',
        this.draftSettings.hideMerchPromo,
        (val) => {
          this.draftSettings.hideMerchPromo = val;
        }
      )
    );

    const sbHeading = document.createElement('h3');
    sbHeading.className = 'better-yt-section-heading';
    sbHeading.textContent = 'SponsorBlock Integration';
    container.appendChild(sbHeading);

    container.appendChild(
      this.createToggleItem(
        'Enable SponsorBlock',
        'Automatically skip sponsored segments and self-promotions using public API',
        this.draftSettings.sponsorBlockEnabled,
        (val) => {
          this.draftSettings.sponsorBlockEnabled = val;
          this.renderActiveTab();
        }
      )
    );

    if (this.draftSettings.sponsorBlockEnabled) {
      const categoriesBox = document.createElement('div');
      categoriesBox.className = 'better-yt-categories-box';

      const catTitle = document.createElement('div');
      catTitle.className = 'better-yt-setting-label';
      catTitle.textContent = 'Active Skip Categories:';
      categoriesBox.appendChild(catTitle);

      const categoryDescriptions: Record<string, string> = {
        sponsor: 'Paid sponsorships and affiliate endorsements',
        selfpromo: 'Channel merchandise, subscriptions, and self-promotion',
        interaction: 'Subscribe, like, and notification reminders',
        intro: 'Intro animations, logos, and intermissions',
        outro: 'Credits and endcard segments',
        preview: 'Episode teasers, previews, and recaps',
      };

      for (const cat of VALID_SPONSOR_CATEGORIES) {
        const catRow = this.createToggleItem(
          cat.toUpperCase(),
          categoryDescriptions[cat] || cat,
          this.draftSettings.sponsorCategories.includes(cat),
          (checked) => {
            if (checked) {
              if (!this.draftSettings.sponsorCategories.includes(cat)) {
                this.draftSettings.sponsorCategories.push(cat);
              }
            } else {
              this.draftSettings.sponsorCategories = this.draftSettings.sponsorCategories.filter(
                (c) => c !== cat
              );
            }
          }
        );
        categoriesBox.appendChild(catRow);
      }

      container.appendChild(categoriesBox);
    }
  }

  private renderPlaybackTab(container: HTMLElement): void {
    const title = document.createElement('h3');
    title.className = 'better-yt-section-heading';
    title.textContent = 'Playback Preferences';
    container.appendChild(title);

    // Default Playback Speed
    const speedRow = document.createElement('div');
    speedRow.className = 'better-yt-setting-row';

    const speedInfo = document.createElement('div');
    speedInfo.className = 'better-yt-setting-info';
    const speedLabel = document.createElement('div');
    speedLabel.className = 'better-yt-setting-label';
    speedLabel.textContent = 'Default Playback Speed';
    const speedDesc = document.createElement('div');
    speedDesc.className = 'better-yt-setting-desc';
    speedDesc.textContent = 'Automatically apply this playback rate to loaded videos';
    speedInfo.appendChild(speedLabel);
    speedInfo.appendChild(speedDesc);
    speedRow.appendChild(speedInfo);

    const speedSelect = document.createElement('select');
    speedSelect.className = 'better-yt-select';
    for (const sp of VALID_PLAYBACK_SPEEDS) {
      const opt = document.createElement('option');
      opt.value = sp.toString();
      opt.textContent = `${sp}x`;
      if (this.draftSettings.defaultPlaybackSpeed === sp) {
        opt.selected = true;
      }
      speedSelect.appendChild(opt);
    }
    speedSelect.addEventListener('change', () => {
      this.draftSettings.defaultPlaybackSpeed = parseFloat(speedSelect.value);
    });
    speedRow.appendChild(speedSelect);
    container.appendChild(speedRow);

    // Preferred Quality
    const qualityRow = document.createElement('div');
    qualityRow.className = 'better-yt-setting-row';

    const qualityInfo = document.createElement('div');
    qualityInfo.className = 'better-yt-setting-info';
    const qualityLabel = document.createElement('div');
    qualityLabel.className = 'better-yt-setting-label';
    qualityLabel.textContent = 'Preferred Video Quality';
    const qualityDesc = document.createElement('div');
    qualityDesc.className = 'better-yt-setting-desc';
    qualityDesc.textContent = 'Preferred playback resolution (when offered by video)';
    qualityInfo.appendChild(qualityLabel);
    qualityInfo.appendChild(qualityDesc);
    qualityRow.appendChild(qualityInfo);

    const qualitySelect = document.createElement('select');
    qualitySelect.className = 'better-yt-select';
    for (const q of VALID_QUALITIES) {
      const opt = document.createElement('option');
      opt.value = q;
      opt.textContent = q;
      if (this.draftSettings.preferredQuality === q) {
        opt.selected = true;
      }
      qualitySelect.appendChild(opt);
    }
    qualitySelect.addEventListener('change', () => {
      this.draftSettings.preferredQuality = qualitySelect.value as (typeof VALID_QUALITIES)[number];
    });
    qualityRow.appendChild(qualitySelect);
    container.appendChild(qualityRow);
  }

  private renderAppearanceTab(container: HTMLElement): void {
    const title = document.createElement('h3');
    title.className = 'better-yt-section-heading';
    title.textContent = 'Theme & Visuals';
    container.appendChild(title);

    // Theme selector
    const themeRow = document.createElement('div');
    themeRow.className = 'better-yt-setting-row';

    const themeInfo = document.createElement('div');
    themeInfo.className = 'better-yt-setting-info';
    const themeLabel = document.createElement('div');
    themeLabel.className = 'better-yt-setting-label';
    themeLabel.textContent = 'Interface Theme';
    const themeDesc = document.createElement('div');
    themeDesc.className = 'better-yt-setting-desc';
    themeDesc.textContent = 'Color scheme for application controls and overlays';
    themeInfo.appendChild(themeLabel);
    themeInfo.appendChild(themeDesc);
    themeRow.appendChild(themeInfo);

    const themeSelect = document.createElement('select');
    themeSelect.className = 'better-yt-select';
    const themes = [
      { id: 'system', label: 'System Default' },
      { id: 'dark', label: 'Dark' },
      { id: 'light', label: 'Light' },
    ];
    for (const t of themes) {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.label;
      if (this.draftSettings.theme === t.id) {
        opt.selected = true;
      }
      themeSelect.appendChild(opt);
    }
    themeSelect.addEventListener('change', () => {
      this.draftSettings.theme = themeSelect.value as 'system' | 'dark' | 'light';
    });
    themeRow.appendChild(themeSelect);
    container.appendChild(themeRow);

    container.appendChild(
      this.createToggleItem(
        'Compact Navigation Sidebar',
        'Use smaller sidebar icons on YouTube desktop pages',
        this.draftSettings.compactSidebar,
        (val) => {
          this.draftSettings.compactSidebar = val;
        }
      )
    );

    container.appendChild(
      this.createToggleItem(
        'Reduce Animations',
        'Minimize transition effects and UI animations',
        this.draftSettings.reduceAnimations,
        (val) => {
          this.draftSettings.reduceAnimations = val;
        }
      )
    );
  }

  private renderAdvancedTab(container: HTMLElement): void {
    const title = document.createElement('h3');
    title.className = 'better-yt-section-heading';
    title.textContent = 'Advanced Maintenance';
    container.appendChild(title);

    container.appendChild(
      this.createToggleItem(
        'Enable Developer Tools',
        'Enable developer inspector shortcuts (development mode only)',
        this.draftSettings.devToolsEnabled,
        (val) => {
          this.draftSettings.devToolsEnabled = val;
        }
      )
    );

    // Destructive Actions Box
    const dangerBox = document.createElement('div');
    dangerBox.className = 'better-yt-danger-box';

    const dangerHeading = document.createElement('div');
    dangerHeading.className = 'better-yt-setting-label danger-text';
    dangerHeading.textContent = 'Storage & Cache Management';
    dangerBox.appendChild(dangerHeading);

    const cacheRow = document.createElement('div');
    cacheRow.className = 'better-yt-setting-row';
    const cacheInfo = document.createElement('div');
    cacheInfo.className = 'better-yt-setting-info';
    const cacheLabel = document.createElement('div');
    cacheLabel.className = 'better-yt-setting-label';
    cacheLabel.textContent = 'Clear Application Cache';
    const cacheDesc = document.createElement('div');
    cacheDesc.className = 'better-yt-setting-desc';
    cacheDesc.textContent = 'Removes cached images, stylesheets, and temporary assets';
    cacheInfo.appendChild(cacheLabel);
    cacheInfo.appendChild(cacheDesc);
    cacheRow.appendChild(cacheInfo);

    const clearCacheBtn = document.createElement('button');
    clearCacheBtn.className = 'better-yt-btn better-yt-btn-secondary';
    clearCacheBtn.textContent = 'Clear Cache';
    clearCacheBtn.type = 'button';
    clearCacheBtn.addEventListener('click', () => {
      this.confirmAction('Clear Cache', 'Are you sure you want to clear temporary cached data?', async () => {
        try {
          if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke('clear_cache');
          }
          showToast({ message: 'Cache cleared successfully' });
        } catch (e) {
          showToast({ message: `Cache clear failed: ${String(e)}` });
        }
      });
    });
    cacheRow.appendChild(clearCacheBtn);
    dangerBox.appendChild(cacheRow);

    const sessionRow = document.createElement('div');
    sessionRow.className = 'better-yt-setting-row';
    const sessionInfo = document.createElement('div');
    sessionInfo.className = 'better-yt-setting-info';
    const sessionLabel = document.createElement('div');
    sessionLabel.className = 'better-yt-setting-label';
    sessionLabel.textContent = 'Clear YouTube Session Data';
    const sessionDesc = document.createElement('div');
    sessionDesc.className = 'better-yt-setting-desc';
    sessionDesc.textContent = 'Logs you out of YouTube and resets cookies';
    sessionInfo.appendChild(sessionLabel);
    sessionInfo.appendChild(sessionDesc);
    sessionRow.appendChild(sessionInfo);

    const clearSessionBtn = document.createElement('button');
    clearSessionBtn.className = 'better-yt-btn better-yt-btn-danger';
    clearSessionBtn.textContent = 'Clear Session Data';
    clearSessionBtn.type = 'button';
    clearSessionBtn.addEventListener('click', () => {
      this.confirmAction(
        'Reset Session & Logout',
        'This will log you out of YouTube and clear all cookies. Do you wish to continue?',
        async () => {
          try {
            if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
              const { invoke } = await import('@tauri-apps/api/core');
              await invoke('clear_session');
            } else {
              localStorage.clear();
              sessionStorage.clear();
            }
            showToast({ message: 'Session data cleared. Reloading page...' });
            setTimeout(() => window.location.reload(), 1500);
          } catch (e) {
            showToast({ message: `Failed to clear session: ${String(e)}` });
          }
        }
      );
    });
    sessionRow.appendChild(clearSessionBtn);
    dangerBox.appendChild(sessionRow);

    container.appendChild(dangerBox);
  }

  private renderAboutTab(container: HTMLElement): void {
    const aboutBox = document.createElement('div');
    aboutBox.className = 'better-yt-about-card';

    const title = document.createElement('h3');
    title.className = 'better-yt-title';
    title.textContent = 'Better YT';
    aboutBox.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'better-yt-subtitle';
    desc.textContent = 'Unofficial desktop client for accessing YouTube.';
    aboutBox.appendChild(desc);

    const disclaimer = document.createElement('div');
    disclaimer.className = 'better-yt-disclaimer-badge';
    disclaimer.textContent =
      'Not affiliated with, endorsed by, or sponsored by YouTube or Google.';
    aboutBox.appendChild(disclaimer);

    const metaList = document.createElement('div');
    metaList.className = 'better-yt-meta-grid';

    const items = [
      { label: 'Version', value: '1.0.0' },
      { label: 'Tauri Version', value: 'v2.x' },
      { label: 'Platform', value: navigator.platform || 'Cross-platform' },
      { label: 'User Agent', value: navigator.userAgent.split(' ')[0] },
    ];

    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'better-yt-meta-row';

      const label = document.createElement('span');
      label.className = 'better-yt-meta-label';
      label.textContent = item.label;
      row.appendChild(label);

      const val = document.createElement('span');
      val.className = 'better-yt-meta-value';
      val.textContent = item.value;
      row.appendChild(val);

      metaList.appendChild(row);
    }

    aboutBox.appendChild(metaList);
    container.appendChild(aboutBox);
  }

  private confirmAction(title: string, message: string, onConfirm: () => void): void {
    const dialog = document.createElement('div');
    dialog.className = 'better-yt-confirm-overlay';

    const box = document.createElement('div');
    box.className = 'better-yt-confirm-box';

    const h = document.createElement('h4');
    h.className = 'better-yt-confirm-title';
    h.textContent = title;
    box.appendChild(h);

    const p = document.createElement('p');
    p.className = 'better-yt-confirm-text';
    p.textContent = message;
    box.appendChild(p);

    const btns = document.createElement('div');
    btns.className = 'better-yt-confirm-actions';

    const cancel = document.createElement('button');
    cancel.className = 'better-yt-btn better-yt-btn-secondary';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => {
      dialog.remove();
    });
    btns.appendChild(cancel);

    const confirm = document.createElement('button');
    confirm.className = 'better-yt-btn better-yt-btn-danger';
    confirm.textContent = 'Confirm';
    confirm.addEventListener('click', () => {
      dialog.remove();
      onConfirm();
    });
    btns.appendChild(confirm);

    box.appendChild(btns);
    dialog.appendChild(box);
    document.body.appendChild(dialog);
  }

  private async saveChanges(): Promise<void> {
    await settingsManager.updateSettings(this.draftSettings);
    showToast({ message: 'Settings saved successfully' });
    this.close();
  }

  private async resetDefaults(): Promise<void> {
    this.confirmAction(
      'Reset All Settings',
      'Are you sure you want to restore default application settings?',
      async () => {
        this.draftSettings = { ...DEFAULT_SETTINGS };
        await settingsManager.updateSettings(this.draftSettings);
        this.renderActiveTab();
        showToast({ message: 'Settings restored to defaults' });
      }
    );
  }
}

export const settingsModal = new SettingsModal();
