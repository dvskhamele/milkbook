/**
 * MilkRecord - Mobile Sidebar Navigation
 * Hamburger menu with quick access to all features
 */

(function() {
  'use strict';

  // Sidebar Manager
  window.SidebarManager = {
    isOpen: false,
    isMobile: false,
    
    // Check if mobile
    checkMobile: function() {
      this.isMobile = window.innerWidth < 768;
      return this.isMobile;
    },
    
    // Initialize sidebar
    init: function() {
      if (!this.checkMobile()) {
        // Desktop - don't create sidebar
        return;
      }
      
      this.createSidebar();
      this.addEventListeners();
      console.log('✅ Sidebar initialized (mobile only)');
    },
    
    // Create sidebar HTML
    createSidebar: function() {
      const html = `
        <!-- Sidebar Overlay -->
        <div class="sidebar-overlay" id="sidebarOverlay" onclick="SidebarManager.toggle()"></div>
        
        <!-- Sidebar Menu -->
        <div class="sidebar-menu" id="sidebarMenu">
          <div class="sidebar-header">
            <h2 style="font-size:20px;">🥛</h2>
          </div>
          
          <!-- Quick Actions (Mobile-Optimized) -->
          <div style="padding:16px;background:#f8fafc;border-bottom:2px solid #e2e8f0;">
            <div style="display:grid;grid-template-columns:1fr;gap:8px;">
              <button onclick="window.location.href='shift-reconciliation-screen.html'" style="padding:12px;background:#dc2626;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:12px;">🔄 Close Shift</button>
            </div>
          </div>
          
          <div class="sidebar-nav">
            <button onclick="SidebarManager.navigate('collection')" id="navCollection">
              <span>📊</span> Collection
            </button>
            <button onclick="SidebarManager.navigate('pos')" id="navPOS">
              <span>🛒</span> POS
            </button>
            <button onclick="SidebarManager.navigate('ledger')" id="navLedger">
              <span>📒</span> Ledger
            </button>
            <button onclick="SidebarManager.navigate('settings')" id="navSettings">
              <span>⚙️</span> Settings
            </button>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('afterbegin', html);
    },
    
    // Toggle sidebar
    toggle: function() {
      this.isOpen = !this.isOpen;
      const overlay = document.getElementById('sidebarOverlay');
      const menu = document.getElementById('sidebarMenu');
      const hamburger = document.querySelector('.hamburger-btn');
      
      if (this.isOpen) {
        overlay.classList.add('active');
        menu.classList.add('active');
        if (hamburger) hamburger.classList.add('active');
      } else {
        overlay.classList.remove('active');
        menu.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
      }
    },
    
    // Navigate to page
    navigate: function(page) {
      const pages = {
        'collection': 'collection.html',
        'pos': 'dairy-pos-billing-software-india.html',
        'ledger': 'dairy-pos-billing-software-india.html#ledger',
        'settings': 'settings.html'
      };
      
      if (pages[page]) {
        window.location.href = pages[page];
      }
      
      this.toggle();
    },
    
    // Add event listeners
    addEventListeners: function() {
      // Handle back button
      window.addEventListener('popstate', () => {
        if (this.isOpen) {
          this.toggle();
        }
      });
      
      // Handle resize
      window.addEventListener('resize', () => {
        if (this.checkMobile() && !document.getElementById('sidebarMenu')) {
          this.createSidebar();
        }
      });
      
      // Load shop name
      this.loadShopInfo();
    },
    
    // Load shop information
    loadShopInfo: function() {
      const shopName = localStorage.getItem('MilkRecord_shop_name') || 'Your Dairy';
      const shopNameEl = document.getElementById('sidebarShopName');
      if (shopNameEl) {
        shopNameEl.textContent = shopName;
      }
    },
    
    // Set active nav item
    setActive: function(pageId) {
      const buttons = document.querySelectorAll('.sidebar-nav button');
      buttons.forEach(btn => btn.classList.remove('active'));
      
      const activeBtn = document.getElementById('nav' + pageId.charAt(0).toUpperCase() + pageId.slice(1));
      if (activeBtn) {
        activeBtn.classList.add('active');
      }
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SidebarManager.init());
  } else {
    SidebarManager.init();
  }

})();
