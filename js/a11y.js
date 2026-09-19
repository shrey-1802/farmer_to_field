/**
 * KrishiNirnay AI - Accessibility & Assistive Technology Layer
 * Section 42 & Section 76 Compliance
 * Screen Reader Live Regions, Focus Trapping, Keyboard Navigation & Outdoor High Contrast
 */

(function () {
  'use strict';

  let liveRegionPolite = null;
  let liveRegionAssertive = null;
  let trappedContainer = null;
  let previouslyFocusedElement = null;

  const A11y = {
    /**
     * Initialize live regions for screen readers
     */
    init: function () {
      if (!liveRegionPolite) {
        liveRegionPolite = document.createElement('div');
        liveRegionPolite.id = 'a11y-live-polite';
        liveRegionPolite.className = 'sr-only';
        liveRegionPolite.setAttribute('role', 'status');
        liveRegionPolite.setAttribute('aria-live', 'polite');
        liveRegionPolite.setAttribute('aria-atomic', 'true');
        document.body.appendChild(liveRegionPolite);
      }

      if (!liveRegionAssertive) {
        liveRegionAssertive = document.createElement('div');
        liveRegionAssertive.id = 'a11y-live-assertive';
        liveRegionAssertive.className = 'sr-only';
        liveRegionAssertive.setAttribute('role', 'alert');
        liveRegionAssertive.setAttribute('aria-live', 'assertive');
        liveRegionAssertive.setAttribute('aria-atomic', 'true');
        document.body.appendChild(liveRegionAssertive);
      }

      // Add global keyboard listeners
      window.addEventListener('keydown', (e) => {
        // Close modal on Escape key
        if (e.key === 'Escape') {
          if (window.Modal) {
            window.Modal.close();
          }
          if (trappedContainer) {
            A11y.releaseFocus();
          }
        }
      });
    },

    /**
     * Announce message to assistive screen readers
     * @param {string} message
     * @param {'polite'|'assertive'} [priority='polite']
     */
    announce: function (message, priority = 'polite') {
      this.init();
      const region = priority === 'assertive' ? liveRegionAssertive : liveRegionPolite;
      if (region) {
        region.textContent = '';
        setTimeout(() => {
          region.textContent = String(message);
        }, 50);
      }
    },

    /**
     * Trap keyboard focus within a modal or dialog
     * @param {HTMLElement|string} target
     */
    trapFocus: function (target) {
      const container = typeof target === 'string' ? document.querySelector(target) : target;
      if (!container) return;

      previouslyFocusedElement = document.activeElement;
      trappedContainer = container;

      const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusableEls = Array.from(container.querySelectorAll(focusableSelectors));

      if (focusableEls.length > 0) {
        focusableEls[0].focus();
      }

      container.addEventListener('keydown', function handleTabKey(e) {
        if (e.key !== 'Tab') return;

        const currentFocusable = Array.from(container.querySelectorAll(focusableSelectors));
        if (currentFocusable.length === 0) return;

        const first = currentFocusable[0];
        const last = currentFocusable[currentFocusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      });
    },

    /**
     * Release focus trap and return to previous trigger element
     */
    releaseFocus: function () {
      if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
        previouslyFocusedElement.focus();
      }
      trappedContainer = null;
      previouslyFocusedElement = null;
    },

    /**
     * Toggle Outdoor High Contrast Mode (Section 76)
     * Enhances contrast for direct sunlight field operation
     * @returns {boolean} Current high-contrast state
     */
    toggleHighContrast: function () {
      const html = document.documentElement;
      const current = html.getAttribute('data-high-contrast') === 'true';
      const next = !current;
      html.setAttribute('data-high-contrast', String(next));

      this.announce(
        next ? 'High contrast outdoor mode enabled' : 'High contrast outdoor mode disabled'
      );

      return next;
    }
  };

  // Auto initialize on DOMContentLoaded
  window.addEventListener('DOMContentLoaded', () => {
    A11y.init();
  });

  window.A11y = A11y;
})();
