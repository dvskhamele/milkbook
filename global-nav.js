/**
 * Global Navigation Component
 * Handles navigation across all MilkBook pages
 */

// Navigation configuration
const navConfig = {
  brand: {
    name: 'MilkRecord',
    logo: '💧',
    homeUrl: 'index.html'
  },
  links: [
    {
      label: 'Solutions',
      type: 'dropdown',
      icon: '▾',
      items: [
        {
          title: 'For Milk Collection Centers (BMCs)',
          desc: 'Procurement & compliance',
          url: 'milk-collection-centers.html',
          icp: 'bmc'
        },
        {
          title: 'For Dairy Shops',
          desc: 'Retail POS & billing',
          url: 'dairy-shops.html',
          icp: 'pos'
        },
        {
          title: 'For Dairy Plants',
          desc: 'Large-scale processing',
          url: 'dairy-plants.html',
          icp: 'plant',
          badge: 'Coming Soon'
        }
      ]
    },
    {
      label: 'Demos',
      type: 'dropdown',
      icon: '▾',
      items: [
        {
          title: 'BMC Procurement Demo',
          desc: 'Login required - Audit simulator',
          url: 'demo-bmc-login.html',
          icp: 'bmc'
        },
        {
          title: 'Dairy Shop POS Demo',
          desc: 'Instant access - No login',
          url: 'pos-demo.html',
          icp: 'pos'
        }
      ]
    },
    {
      label: 'Hardware',
      type: 'link',
      url: 'hardware.html',
      icp: 'all'
    },
    {
      label: 'Compliance',
      type: 'link',
      url: 'compliance.html',
      icp: 'bmc'
    },
    {
      label: 'Partners',
      type: 'link',
      url: 'partners.html',
      icp: 'all'
    }
  ],
  login: {
    bmc: {
      label: 'BMC Login',
      url: 'login-bmc.html'
    },
    pos: {
      label: 'POS Login',
      url: 'login-pos.html'
    }
  }
};

// Render global navigation
function renderGlobalNavbar(currentPage = 'home', icpType = 'all') {
  const navbar = document.getElementById('globalNavbar');
  if (!navbar) return;

  navbar.innerHTML = `
    <nav class="global-navbar navbar-${icpType}">
      <div class="nav-container">
        <a href="${navConfig.brand.homeUrl}" class="nav-brand">
          <div class="nav-brand-logo">${navConfig.brand.logo}</div>
          <span>${navConfig.brand.name}</span>
        </a>
        
        <ul class="nav-links">
          ${navConfig.links.map(link => renderNavLink(link, currentPage, icpType)).join('')}
          
          <li class="nav-item">
            <a href="${icpType === 'bmc' ? navConfig.login.bmc.url : navConfig.login.pos.url}" 
               class="nav-login-btn">
              ${icpType === 'bmc' ? navConfig.login.bmc.label : navConfig.login.pos.label}
            </a>
          </li>
        </ul>
        
        <button class="mobile-menu-toggle" onclick="toggleMobileMenu()">
          ☰
        </button>
      </div>
      
      <div class="mobile-nav" id="mobileNav">
        <ul class="mobile-nav-links">
          ${navConfig.links.map(link => renderMobileNavLink(link, currentPage, icpType)).join('')}
          <li class="mobile-nav-item">
            <a href="${icpType === 'bmc' ? navConfig.login.bmc.url : navConfig.login.pos.url}" 
               class="mobile-nav-link" style="background: rgba(37, 99, 235, 0.3);">
              ${icpType === 'bmc' ? navConfig.login.bmc.label : navConfig.login.pos.label}
            </a>
          </li>
        </ul>
      </div>
    </nav>
  `;
}

// Render desktop nav link
function renderNavLink(link, currentPage, icpType) {
  // Hide compliance link for POS
  if (link.label === 'Compliance' && icpType === 'pos') return '';
  
  if (link.type === 'dropdown') {
    const filteredItems = link.items.filter(item => 
      item.icp === 'all' || item.icp === icpType || icpType === 'all'
    );
    
    if (filteredItems.length === 0) return '';
    
    return `
      <li class="nav-item">
        <a href="#" class="nav-link ${currentPage === link.label.toLowerCase() ? 'active' : ''}">
          ${link.label}
          <span class="chevron">${link.icon}</span>
        </a>
        <div class="nav-dropdown">
          ${filteredItems.map(item => `
            <a href="${item.url}" class="nav-dropdown-item">
              <span class="item-title">${item.title}</span>
              <span class="item-desc">${item.desc}</span>
            </a>
          `).join('')}
        </div>
      </li>
    `;
  } else {
    return `
      <li class="nav-item">
        <a href="${link.url}" class="nav-link ${currentPage === link.label.toLowerCase() ? 'active' : ''}">
          ${link.label}
        </a>
      </li>
    `;
  }
}

// Toggle cache help modal
function toggleCacheHelp() {
  const modal = document.getElementById('cacheHelpModal');
  if (modal) {
    modal.classList.toggle('active');
  }
}

// Render mobile nav link
function renderMobileNavLink(link, currentPage, icpType) {
  // Hide compliance link for POS
  if (link.label === 'Compliance' && icpType === 'pos') return '';
  
  if (link.type === 'dropdown') {
    const filteredItems = link.items.filter(item => 
      item.icp === 'all' || item.icp === icpType || icpType === 'all'
    );
    
    if (filteredItems.length === 0) return '';
    
    return `
      <li class="mobile-nav-item">
        <a href="#" class="mobile-nav-link" onclick="toggleMobileDropdown('${link.label}'); return false;">
          ${link.label} ▾
        </a>
        <div class="mobile-nav-dropdown" id="mobileDropdown-${link.label.replace(/\s/g, '')}">
          ${filteredItems.map(item => `
            <a href="${item.url}" class="mobile-nav-link" style="padding-left: 24px; font-size: 14px;">
              ${item.title}
            </a>
          `).join('')}
        </div>
      </li>
    `;
  } else {
    return `
      <li class="mobile-nav-item">
        <a href="${link.url}" class="mobile-nav-link">
          ${link.label}
        </a>
      </li>
    `;
  }
}

// Toggle mobile menu
function toggleMobileMenu() {
  const mobileNav = document.getElementById('mobileNav');
  if (mobileNav) {
    mobileNav.classList.toggle('active');
  }
}

// Toggle mobile dropdown
function toggleMobileDropdown(dropdownName) {
  const dropdownId = `mobileDropdown-${dropdownName.replace(/\s/g, '')}`;
  const dropdown = document.getElementById(dropdownId);
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', function() {
  // Determine current page type
  const path = window.location.pathname;
  let currentPage = 'home';
  let icpType = 'all';
  
  if (path.includes('milk-collection') || path.includes('bmc')) {
    currentPage = 'solutions';
    icpType = 'bmc';
  } else if (path.includes('dairy-shops') || path.includes('pos') || path.includes('purchase')) {
    currentPage = 'solutions';
    icpType = 'pos';
  } else if (path.includes('hardware')) {
    currentPage = 'hardware';
  } else if (path.includes('compliance')) {
    currentPage = 'compliance';
    icpType = 'bmc';
  } else if (path.includes('partners')) {
    currentPage = 'partners';
  } else if (path.includes('demo-bmc')) {
    currentPage = 'demos';
    icpType = 'bmc';
  } else if (path.includes('demo') || path.includes('purchase')) {
    currentPage = 'demos';
    icpType = 'pos';
  }
  
  // Render navigation
  renderGlobalNavbar(currentPage, icpType);
  
  // Add cache help modal
  const cacheModal = document.createElement('div');
  cacheModal.id = 'cacheHelpModal';
  cacheModal.className = 'cache-help-modal';
  cacheModal.innerHTML = `
    <div class="cache-help-content">
      <h3>Trouble seeing updates?</h3>
      <p>If changes are not visible, your browser may be showing a cached version.</p>
      <p><strong>How to refresh:</strong></p>
      <ul>
        <li><strong>Windows / Linux:</strong> Ctrl + Shift + R or Ctrl + F5</li>
        <li><strong>Mac:</strong> Cmd + Shift + R</li>
      </ul>
      <p><strong>Alternative options:</strong></p>
      <ul>
        <li>Open this page in <strong>Incognito / Private window</strong></li>
        <li>Add <code>?v=2</code> at the end of the URL</li>
      </ul>
      <button class="cache-help-close" onclick="toggleCacheHelp()">Got it</button>
    </div>
  `;
  document.body.appendChild(cacheModal);
});

// Export for use in other scripts
window.MilkBookNav = {
  renderGlobalNavbar,
  toggleMobileMenu,
  toggleMobileDropdown,
  navConfig
};
