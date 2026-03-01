/**
 * MilkRecord - Additive Rate Chart Mode Engine
 * Mobile-first, simple, non-conflicting with formula builder
 */

(function() {
  'use strict';

  // Rate Chart Manager
  window.RateChartManager = {
    cache: {
      cow: [],
      buffalo: []
    },
    
    // Load rate chart from localStorage
    loadChart: function() {
      try {
        const stored = localStorage.getItem('mr_rate_chart');
        if (stored) {
          const chart = JSON.parse(stored);
          this.cache.cow = chart.cow || [];
          this.cache.buffalo = chart.buffalo || [];
          console.log('✅ Rate chart loaded:', this.cache.cow.length + this.cache.buffalo.length, 'entries');
        }
      } catch (e) {
        console.error('❌ Failed to load rate chart:', e);
        this.cache.cow = [];
        this.cache.buffalo = [];
      }
    },
    
    // Save rate chart to localStorage
    saveChart: function() {
      try {
        const chart = {
          cow: this.cache.cow,
          buffalo: this.cache.buffalo
        };
        localStorage.setItem('mr_rate_chart', JSON.stringify(chart));
        console.log('✅ Rate chart saved');
      } catch (e) {
        console.error('❌ Failed to save rate chart:', e);
      }
    },
    
    // Get rate for given FAT
    getRate: function(milkType, fatValue) {
      const chart = this.cache[milkType] || [];
      if (chart.length === 0) return null;
      
      // Round FAT to nearest 0.1
      const roundedFat = Math.round(fatValue * 10) / 10;
      
      // Find matching rate
      const entry = chart.find(e => Math.abs(e.fat - roundedFat) < 0.01);
      return entry ? entry.rate : null;
    },
    
    // Add rate entry
    addRate: function(milkType, fat, rate) {
      const chart = this.cache[milkType] || [];
      
      // Remove existing entry for same FAT
      const existingIndex = chart.findIndex(e => Math.abs(e.fat - fat) < 0.01);
      if (existingIndex >= 0) {
        chart[existingIndex] = { fat, rate };
      } else {
        chart.push({ fat, rate });
      }
      
      // Sort by FAT
      chart.sort((a, b) => a.fat - b.fat);
      this.cache[milkType] = chart;
      this.saveChart();
    },
    
    // Import from CSV
    importFromCSV: function(milkType, csvText) {
      const lines = csvText.trim().split('\n');
      const newChart = [];
      
      for (let line of lines) {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const fat = parseFloat(parts[0].trim());
          const rate = parseFloat(parts[1].trim());
          if (!isNaN(fat) && !isNaN(rate)) {
            newChart.push({ fat, rate });
          }
        }
      }
      
      if (newChart.length > 0) {
        // Sort and remove duplicates
        newChart.sort((a, b) => a.fat - b.fat);
        const unique = newChart.filter((item, index) => 
          index === 0 || Math.abs(item.fat - newChart[index - 1].fat) >= 0.01
        );
        
        this.cache[milkType] = unique;
        this.saveChart();
        return unique.length;
      }
      return 0;
    },
    
    // Clear chart
    clearChart: function(milkType) {
      this.cache[milkType] = [];
      this.saveChart();
    },
    
    // Export to CSV
    exportToCSV: function(milkType) {
      const chart = this.cache[milkType] || [];
      return chart.map(e => `${e.fat},${e.rate}`).join('\n');
    }
  };

  // Rate Mode Manager
  window.RateModeManager = {
    // Get current rate mode
    getMode: function() {
      return localStorage.getItem('mr_rate_mode') || 'formula';
    },
    
    // Set rate mode
    setMode: function(mode) {
      if (mode === 'formula' || mode === 'chart') {
        localStorage.setItem('mr_rate_mode', mode);
        console.log('✅ Rate mode set to:', mode);
        
        // Update UI
        this.updateUI();
      }
    },
    
    // Check if chart mode is active
    isChartMode: function() {
      return this.getMode() === 'chart';
    },
    
    // Update UI based on mode
    updateUI: function() {
      const isChart = this.isChartMode();
      
      // Hide/show formula builder
      const formulaElements = document.querySelectorAll('.formula-builder, .formula-settings');
      formulaElements.forEach(el => {
        el.style.display = isChart ? 'none' : 'block';
      });
      
      // Hide/show rate chart
      const chartElements = document.querySelectorAll('.rate-chart-editor');
      chartElements.forEach(el => {
        el.style.display = isChart ? 'block' : 'none';
      });
      
      // Update toggle buttons
      const formulaBtn = document.getElementById('rateModeFormula');
      const chartBtn = document.getElementById('rateModeChart');
      
      if (formulaBtn) formulaBtn.classList.toggle('active', !isChart);
      if (chartBtn) chartBtn.classList.toggle('active', isChart);
    }
  };

  // Initialize on load
  document.addEventListener('DOMContentLoaded', function() {
    RateChartManager.loadChart();
    RateModeManager.updateUI();
    console.log('✅ Rate Chart Engine loaded');
  });

  // Override rate calculation in collection
  window.calculateRateFromChart = function(milkType, fat, snf) {
    if (!RateModeManager.isChartMode()) {
      return null; // Let formula engine handle it
    }
    
    const rate = RateChartManager.getRate(milkType, fat);
    if (rate === null) {
      throw new Error(`Rate not defined for FAT ${fat}%`);
    }
    
    return rate;
  };

})();
