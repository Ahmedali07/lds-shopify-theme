import { Component } from '@theme/component';
import { debounce } from '@theme/utilities';

const STORAGE_KEY = 'lds-recent-searches';
const MAX_RECENT = 5;

/**
 * A custom element that allows the user to clean a search input
 * and shows recent searches under the field.
 *
 * @typedef {object} Refs
 * @property {HTMLInputElement} searchPageInput - The search input element.
 * @property {HTMLElement} [recentRoot] - Recent searches container.
 * @property {HTMLUListElement} [recentList] - Recent searches list.
 * @extends {Component<Refs>}
 */
class SearchPageInputComponent extends Component {
  requiredRefs = ['searchPageInput'];

  connectedCallback() {
    super.connectedCallback();
    this.#saveCurrentQuery();
    this.#renderRecent();
  }

  /**
   * Handles the keydown event on the search input and resets the search when
   * empty and Escape is pressed.
   *
   * @param {KeyboardEvent} event - The keyboard event.
   */
  handleKeyDown = debounce((event) => {
    const value = this.refs.searchPageInput.value.trim();

    if (event.key === 'Escape' && value === '') {
      this.#submitEmptySearch();
    }
  }, 100);

  /**
   * Clears stored recent searches.
   */
  clearRecent = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors (private mode, etc.)
    }
    this.#renderRecent();
  };

  #submitEmptySearch() {
    const searchInput = this.refs.searchPageInput;

    searchInput.focus();
    searchInput.value = '';

    if (this.#isEmptyState()) return;

    searchInput.form?.submit();
  }

  #isEmptyState = () => {
    const url = new URL(window.location.href);
    const queryParam = url.searchParams.get('q') ?? '';

    return queryParam.trim() === '';
  };

  #saveCurrentQuery() {
    const term = this.refs.searchPageInput?.value?.trim() ?? '';
    if (!term) return;

    const recent = this.#readRecent().filter((item) => item.toLowerCase() !== term.toLowerCase());
    recent.unshift(term.slice(0, 80));

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
    } catch {
      // Ignore storage errors (private mode, etc.)
    }
  }

  /**
   * @returns {string[]}
   */
  #readRecent() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter((item) => typeof item === 'string' && item.trim())
        .map((item) => item.trim().slice(0, 80));
    } catch {
      return [];
    }
  }

  #renderRecent() {
    const { recentRoot, recentList } = this.refs;
    if (!recentRoot || !recentList) return;

    const terms = this.#readRecent();
    recentList.replaceChildren();

    if (!terms.length) {
      recentRoot.hidden = true;
      return;
    }

    recentRoot.hidden = false;
    const searchUrl = this.dataset.searchUrl || '/search';

    for (const term of terms) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'search-page-recent__chip';
      link.href = `${searchUrl}?q=${encodeURIComponent(term)}&type=product`;
      link.textContent = term;
      item.appendChild(link);
      recentList.appendChild(item);
    }
  }
}

if (!customElements.get('search-page-input-component')) {
  customElements.define('search-page-input-component', SearchPageInputComponent);
}
