/**
 * Collection Page - Conversion Modal Enhancement
 * Shows today's collected milk (cow/buffalo split)
 */

(function() {
  'use strict';

  // Track today's collection
  let todayCollection = {
    cowMilk: 0,
    cowAmount: 0,
    buffMilk: 0,
    buffAmount: 0,
    totalMilk: 0,
    totalAmount: 0
  };

  // Update today's collection from entries
  function updateTodayCollection() {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Get entries from localStorage
    const entries = JSON.parse(localStorage.getItem('mr_milk_entries') || '[]');
    
    // Reset counters
    todayCollection = {
      cowMilk: 0,
      cowAmount: 0,
      buffMilk: 0,
      buffAmount: 0,
      totalMilk: 0,
      totalAmount: 0
    };
    
    // Sum up today's entries
    entries.forEach(entry => {
      if (entry.collection_date === today || entry.day === today) {
        const qty = parseFloat(entry.qty) || 0;
        const amount = parseFloat(entry.amount) || 0;
        const animal = (entry.animal || '').toLowerCase();
        
        if (animal.includes('cow')) {
          todayCollection.cowMilk += qty;
          todayCollection.cowAmount += amount;
        } else if (animal.includes('buff')) {
          todayCollection.buffMilk += qty;
          todayCollection.buffAmount += amount;
        }
        
        todayCollection.totalMilk += qty;
        todayCollection.totalAmount += amount;
      }
    });
    
    // Update display if modal is open
    updateConversionModalDisplay();
  }

  // Update conversion modal display
  function updateConversionModalDisplay() {
    // Update today's summary
    const el = (id) => document.getElementById(id);
    
    if (el('todayCowMilk')) el('todayCowMilk').textContent = todayCollection.cowMilk.toFixed(1);
    if (el('todayCowAmount')) el('todayCowAmount').textContent = todayCollection.cowAmount.toFixed(0);
    if (el('todayBuffMilk')) el('todayBuffMilk').textContent = todayCollection.buffMilk.toFixed(1);
    if (el('todayBuffAmount')) el('todayBuffAmount').textContent = todayCollection.buffAmount.toFixed(0);
    if (el('todayTotalMilk')) el('todayTotalMilk').textContent = todayCollection.totalMilk.toFixed(1);
    if (el('todayTotalAmount')) el('todayTotalAmount').textContent = todayCollection.totalAmount.toFixed(0);
    
    // Update available for conversion (same as today's collection for now)
    if (el('availableCow')) el('availableCow').textContent = todayCollection.cowMilk.toFixed(1);
    if (el('availableBuff')) el('availableBuff').textContent = todayCollection.buffMilk.toFixed(1);
  }

  // Get selected milk source
  function getSelectedMilkSource() {
    const radios = document.getElementsByName('milkSource');
    for (let radio of radios) {
      if (radio.checked) {
        return radio.value;
      }
    }
    return 'mixed';
  }

  // Update conversion preview with milk source awareness
  function updateConversionPreviewWithSource() {
    const milkSource = getSelectedMilkSource();
    const milkQty = parseFloat(document.getElementById('convQty').value) || 0;
    
    // Check if enough milk available
    let available = 0;
    if (milkSource === 'cow') {
      available = todayCollection.cowMilk;
    } else if (milkSource === 'buff') {
      available = todayCollection.buffMilk;
    } else {
      available = todayCollection.totalMilk;
    }
    
    if (milkQty > available && available > 0) {
      // Show warning
      const preview = document.getElementById('convPreview');
      if (preview) {
        preview.style.background = '#fef2f2';
        preview.style.borderColor = '#dc2626';
      }
    }
  }

  // Initialize
  function init() {
    console.log('✅ Conversion Modal Enhancement loaded');
    
    // Update on page load
    updateTodayCollection();
    
    // Update when entries change
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, arguments);
      if (key === 'mr_milk_entries') {
        updateTodayCollection();
      }
    };
    
    // Listen for modal open
    const originalOpenModal = window.openModal;
    if (originalOpenModal) {
      window.openModal = function(modalId) {
        if (modalId === 'convertModal') {
          updateTodayCollection();
        }
        originalOpenModal(modalId);
      };
    }
  }

  // Export functions
  window.updateTodayCollection = updateTodayCollection;
  window.updateConversionModalDisplay = updateConversionModalDisplay;
  window.getSelectedMilkSource = getSelectedMilkSource;
  
  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
