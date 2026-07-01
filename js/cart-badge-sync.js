/* ════════════════════════════════════════════════════════
   GLOBAL CART BADGE SYNCHRONIZATION
   - Syncs cart count across all pages using localStorage
   - Updates in real-time across browser tabs
════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // Storage keys
  const CART_KEY = 'alha_cart';
  const COUNT_KEY = 'alha_cart_count';

  /**
   * Calculate total cart items from cart data
   */
  function calculateCartCount() {
    try {
      const cartData = localStorage.getItem(CART_KEY);
      if (!cartData) return 0;
      
      const cart = JSON.parse(cartData);
      if (!Array.isArray(cart)) return 0;
      
      return cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    } catch (error) {
      console.error('Error calculating cart count:', error);
      return 0;
    }
  }

  /**
   * Update cart count in localStorage
   */
  function saveCartCount() {
    const count = calculateCartCount();
    localStorage.setItem(COUNT_KEY, count.toString());
    return count;
  }

  /**
   * Update all cart badge elements on the current page
   */
  function updateGlobalCartBadge() {
    const count = calculateCartCount();
    
    // Update count in storage for cross-page sync
    localStorage.setItem(COUNT_KEY, count.toString());
    
    // Find all possible cart badge selectors
    const badgeSelectors = [
      '.nav-cart-badge',
      '#cart-badge',
      '.cart-badge',
      '#cart-count',
      '[data-cart-badge]'
    ];
    
    badgeSelectors.forEach(selector => {
      const badges = document.querySelectorAll(selector);
      badges.forEach(badge => {
        if (badge) {
          badge.textContent = count;
          
          // Show/hide badge based on count
          if (count === 0) {
            badge.style.display = 'none';
          } else {
            badge.style.display = 'flex';
          }
        }
      });
    });
  }

  /**
   * Initialize cart badge sync on page load
   */
  function initCartBadgeSync() {
    // Update badge immediately
    updateGlobalCartBadge();
    
    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', function(e) {
      if (e.key === CART_KEY || e.key === COUNT_KEY) {
        updateGlobalCartBadge();
      }
    });
    
    // Periodic sync every 500ms to catch same-page updates
    setInterval(updateGlobalCartBadge, 500);
  }

  /**
   * Hook into cart modifications
   * Call this whenever cart is modified
   */
  window.syncCartBadge = function() {
    updateGlobalCartBadge();
  };

  /**
   * Override localStorage.setItem to auto-sync when cart changes
   */
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    
    // If cart was modified, trigger sync
    if (key === CART_KEY) {
      setTimeout(updateGlobalCartBadge, 0);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCartBadgeSync);
  } else {
    initCartBadgeSync();
  }

  // Export for manual calls
  window.updateGlobalCartBadge = updateGlobalCartBadge;
  window.saveCartCount = saveCartCount;
  window.calculateCartCount = calculateCartCount;
})();
