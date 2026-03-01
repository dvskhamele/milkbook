/**
 * MilkRecord - Mobile Sidebar Navigation
 * Hamburger menu with quick access to all features
 */

(function() {
  'use strict';

  // Sidebar Manager
  window.SidebarManager = {
    isOpen: false,
    
    // Initialize sidebar
    init: function() {
      this.createSidebar();
      this.addEventListeners();
      console.log('✅ Sidebar initialized');
    },
    
    // Create sidebar HTML
    createSidebar: function() {
      const html = `
        <!-- Sidebar Overlay -->
        <div class="sidebar-overlay" id="sidebarOverlay" onclick="SidebarManager.toggle()"></div>
        
        <!-- Sidebar Menu -->
        <div class="sidebar-menu" id="sidebarMenu">
          <div class="sidebar-header">
            <h2>🥛 MilkRecord</h2>
            <p id="sidebarShopName">Loading...</p>
          </div>
          
          <!-- Quick Actions (Mobile-Optimized) -->
          <div style="padding:16px;background:#f8fafc;border-bottom:2px solid #e2e8f0;">
            <div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:8px;">⚡ QUICK ACTIONS</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <button onclick="window.location.href='shift-reconciliation-screen.html'" style="padding:12px;background:#dc2626;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:12px;">🔄 Close Shift</button>
              <button onclick="window.location.href='fssai-compliance-screen.html'" style="padding:12px;background:#16a34a;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:12px;">✅ FSSAI</button>
            </div>
          </div>
          
          <div class="sidebar-nav">
            <button onclick="SidebarManager.navigate('collection')" id="navCollection">
              <span>📊</span> Collection
            </button>
            <button onclick="SidebarManager.navigate('pos')" id="navPOS">
              <span>🛒</span> POS Billing
            </button>
            <button onclick="SidebarManager.navigate('production')" id="navProduction">
              <span>🏭</span> Production
            </button>
            <button onclick="SidebarManager.navigate('ledger')" id="navLedger">
              <span>📒</span> Customer Ledger
            </button>
            <button onclick="SidebarManager.navigate('farmers')" id="navFarmers">
              <span>👥</span> Farmers
            </button>
            <button onclick="SidebarManager.navigate('products')" id="navProducts">
              <span>📦</span> Products
            </button>
            <button onclick="SidebarManager.navigate('reports')" id="navReports">
              <span>📊</span> Reports
            </button>
            <button onclick="SidebarManager.navigate('compliance')" id="navCompliance">
              <span>✅</span> FSSAI Compliance
            </button>
            <button onclick="SidebarManager.navigate('traceability')" id="navTraceability">
              <span>📱</span> QR Traceability
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
        'production': 'dairy-pos-billing-software-india.html#production',
        'ledger': 'dairy-pos-billing-software-india.html#ledger',
        'farmers': 'collection.html#farmers',
        'products': 'dairy-pos-billing-software-india.html#products',
        'reports': 'collection.html#reports',
        'compliance': 'fssai-compliance-screen.html',
        'traceability': 'qr-traceability-screen.html',
        'reconciliation': 'shift-reconciliation-screen.html',
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
