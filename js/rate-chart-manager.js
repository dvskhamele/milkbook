/**
 * Rate Chart Manager - Complete Rate List Functionality
 * Import, Edit, Display, WhatsApp Share
 */

(function() {
  'use strict';

  window.RateChartManager = {
    // Default rate chart (FAT → RATE)
    defaultChart: {
      cow: [],
      buffalo: []
    },
    
    // Current base rate
    baseRate: 18.00,
    
    // Load rate chart from localStorage
    loadChart: function() {
      try {
        const stored = localStorage.getItem('mr_rate_chart');
        if (stored) {
          const chart = JSON.parse(stored);
          this.defaultChart = chart;
        }
        
        const baseRate = localStorage.getItem('mr_base_rate');
        if (baseRate) {
          this.baseRate = parseFloat(baseRate);
        }
        
        // Generate if empty
        if (this.defaultChart.cow.length === 0) {
          this.generateDefaultChart();
        }
        
        console.log('✅ Rate chart loaded:', this.defaultChart.cow.length, 'entries');
      } catch (e) {
        console.error('❌ Failed to load rate chart:', e);
        this.generateDefaultChart();
      }
    },
    
    // Generate default rate chart (Base ₹18, Fat factor ₹9)
    generateDefaultChart: function() {
      const cowChart = [];
      const buffChart = [];
      
      // Generate for FAT 3.0% to 10.0%
      for (let fat = 30; fat <= 100; fat++) {
        const fatPercent = fat / 10;
        const cowRate = this.baseRate + (fatPercent - 3.5) * 9;
        const buffRate = this.baseRate + (fatPercent - 5.0) * 12;
        
        cowChart.push({
          fat: fatPercent.toFixed(1),
          rate: Math.round(cowRate * 100) / 100
        });
        
        buffChart.push({
          fat: fatPercent.toFixed(1),
          rate: Math.round(buffRate * 100) / 100
        });
      }
      
      this.defaultChart.cow = cowChart;
      this.defaultChart.buffalo = buffChart;
      this.saveChart();
    },
    
    // Save rate chart to localStorage
    saveChart: function() {
      try {
        localStorage.setItem('mr_rate_chart', JSON.stringify(this.defaultChart));
        localStorage.setItem('mr_base_rate', this.baseRate.toString());
        console.log('✅ Rate chart saved');
      } catch (e) {
        console.error('❌ Failed to save rate chart:', e);
      }
    },
    
    // Get rate for given FAT
    getRate: function(milkType, fatPercent) {
      const chart = this.defaultChart[milkType] || this.defaultChart.cow;
      const fat = parseFloat(fatPercent);
      
      // Find closest FAT entry
      const entry = chart.find(e => Math.abs(parseFloat(e.fat) - fat) < 0.05);
      return entry ? entry.rate : null;
    },
    
    // Update rate for specific FAT
    updateRate: function(milkType, fatPercent, newRate) {
      const chart = this.defaultChart[milkType] || this.defaultChart.cow;
      const fat = parseFloat(fatPercent).toFixed(1);
      
      const entry = chart.find(e => e.fat === fat);
      if (entry) {
        entry.rate = parseFloat(newRate);
        this.saveChart();
        return true;
      }
      return false;
    },
    
    // Import from CSV or Excel matrix format
    importFromCSV: function(csvText, milkType) {
      const lines = csvText.trim().split('\n');
      const newChart = [];
      
      // Check if this is a matrix format (CLR/SNF table)
      const isMatrixFormat = lines.some(line => line.includes('CLR') || line.includes('SNF'));
      
      if (isMatrixFormat) {
        // Parse matrix format - import ALL columns
        return this.importMatrixFormat(lines, milkType);
      }
      
      // Simple 2-column format (FAT,RATE)
      for (let line of lines) {
        const parts = line.split(',');
        if (parts.length >= 2) {
          let fat = parseFloat(parts[0].replace('%', '').trim());
          let rate = parseFloat(parts[1].replace('₹', '').trim());
          
          if (!isNaN(fat) && !isNaN(rate)) {
            newChart.push({
              fat: fat.toFixed(1),
              rate: rate,
              snf: 8.5, // Default SNF
              clr: 30   // Default CLR
            });
          }
        }
      }
      
      if (newChart.length > 0) {
        // Sort by FAT
        newChart.sort((a, b) => parseFloat(a.fat) - parseFloat(b.fat));
        this.defaultChart[milkType] = newChart;
        this.saveChart();
        return newChart.length;
      }
      return 0;
    },
    
    // Parse matrix format (CLR/SNF table) - Import ALL columns
    importMatrixFormat: function(lines, milkType) {
      const newChart = [];
      let clrValues = [];
      let headerFound = false;
      let clrRowIndex = -1;
      
      // First pass: find CLR row and extract CLR values
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('CLR')) {
          clrRowIndex = i;
          const parts = line.split(/\t+/);
          // Extract CLR values (skip first 2 columns which are labels)
          for (let j = 2; j < parts.length; j++) {
            const clr = parseFloat(parts[j].trim());
            if (!isNaN(clr)) {
              clrValues.push(clr);
            }
          }
          headerFound = true;
          break;
        }
      }
      
      if (!headerFound || clrValues.length === 0) {
        return 0;
      }
      
      // Second pass: parse FAT rows with ALL SNF/RATE columns
      for (let i = clrRowIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        const parts = line.split(/\t+/);
        
        // Skip empty or header rows
        if (parts.length < 3 || line.includes('FAT') || line.includes('SNF')) continue;
        
        // First column is FAT value
        const fat = parseFloat(parts[0]?.trim());
        if (isNaN(fat)) continue;
        
        // Parse each CLR column's SNF/RATE pair
        // Structure: FAT | SNF@CLR30 | RATE@CLR30 | SNF@CLR29 | RATE@CLR29 | ...
        for (let col = 0; col < clrValues.length; col++) {
          const snfIndex = 1 + (col * 2);      // SNF column index
          const rateIndex = 2 + (col * 2);     // RATE column index
          
          if (snfIndex >= parts.length || rateIndex >= parts.length) break;
          
          const snf = parseFloat(parts[snfIndex]?.trim());
          const rate = parseFloat(parts[rateIndex]?.trim());
          
          // Only add if we have valid SNF and RATE
          if (!isNaN(snf) && !isNaN(rate) && snf >= 7.0) {
            newChart.push({
              fat: fat.toFixed(1),
              snf: snf.toFixed(1),
              rate: rate,
              clr: clrValues[col]
            });
          }
        }
      }
      
      if (newChart.length > 0) {
        // Sort by FAT, then by CLR
        newChart.sort((a, b) => {
          const fatDiff = parseFloat(a.fat) - parseFloat(b.fat);
          if (fatDiff !== 0) return fatDiff;
          return b.clr - a.clr; // Higher CLR first
        });
        
        this.defaultChart[milkType] = newChart;
        this.saveChart();
        return newChart.length;
      }
      return 0;
    },
    
    // Export to CSV
    exportToCSV: function(milkType) {
      const chart = this.defaultChart[milkType] || this.defaultChart.cow;
      if (chart.length === 0) return '';
      
      // Check if we have CLR/SNF data (matrix format)
      const hasMatrixData = chart.some(entry => entry.clr !== undefined);
      
      if (hasMatrixData) {
        // Export in matrix format
        return this.exportMatrixFormat(chart, milkType);
      }
      
      // Simple format
      return chart.map(e => `${e.fat}%,₹${e.rate}`).join('\n');
    },
    
    // Export in matrix format (CLR/SNF table with all columns)
    exportMatrixFormat: function(chart, milkType) {
      // Get unique CLR values (sorted descending)
      const clrValues = [...new Set(chart.map(e => e.clr))].sort((a, b) => b - a);
      
      // Get unique FAT values (sorted ascending)
      const fatValues = [...new Set(chart.map(e => e.fat))].sort((a, b) => parseFloat(a) - parseFloat(b));
      
      // Build CSV rows
      const rows = [];
      
      // Header row 1: Title
      rows.push(`\tRATE CHART FOR ${milkType.toUpperCase()} MILK`);
      rows.push(`\tGenerated: ${new Date().toLocaleDateString()}`);
      rows.push('');
      
      // Header row 2: CLR values
      let clrRow = '\tCLR';
      clrValues.forEach(clr => {
        clrRow += `\t${clr}`;
      });
      rows.push(clrRow);
      
      // Header row 3: SNF/RATE headers
      let headerRow = '\tFAT';
      clrValues.forEach(clr => {
        headerRow += `\tSNF\tRATE`;
      });
      rows.push(headerRow);
      
      // Data rows: FAT values with SNF/RATE pairs
      fatValues.forEach(fat => {
        let row = `\t${fat}`;
        clrValues.forEach(clr => {
          // Find entry for this FAT and CLR
          const entry = chart.find(e => e.fat === fat && e.clr === clr);
          if (entry) {
            row += `\t${entry.snf}\t${entry.rate}`;
          } else {
            row += `\t\t`; // Empty cells if no data
          }
        });
        rows.push(row);
      });
      
      return rows.join('\n');
    },
    
    // Show rate list modal
    showRateList: function() {
      const html = `
        <div class="overlay" id="rateListOverlay" style="display:flex;align-items:center;justify-content:center;z-index:99999;">
          <div class="modal" style="width:95vw;max-width:500px;max-height:90vh;overflow-y:auto;">
            <div class="panelHeader" style="background:linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color:white; position:sticky; top:0; z-index:10;">
              <span>📋 Rate List (Chart)</span>
              <div style="display:flex;gap:8px;">
                <button onclick="RateChartManager.editChart()" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">✏️ Edit</button>
                <button onclick="RateChartManager.shareWhatsApp()" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">💬 Share</button>
                <button onclick="document.getElementById('rateListOverlay').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:white;padding:0;width:32px;height:32px;">✖</button>
              </div>
            </div>
            
            <div style="padding:16px;">
              <!-- Base Rate Info -->
              <div style="background:#eff6ff;padding:12px;border-radius:8px;border:2px solid #3b82f6;margin-bottom:16px;">
                <div style="font-size:11px;font-weight:700;color:#1e40af;margin-bottom:4px;">Base Rate</div>
                <div style="font-size:20px;font-weight:900;color:#1e3a8a;">₹${this.baseRate.toFixed(2)}</div>
              </div>
              
              <!-- Cow Milk Chart -->
              <div style="margin-bottom:16px;">
                <div style="font-size:14px;font-weight:900;color:#1e293b;margin-bottom:8px;display:flex;align-items:center;gap:8px;">
                  <span style="font-size:20px;">🐄</span> Cow Milk Rate Chart
                </div>
                <div style="background:white;border:2px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;font-size:11px;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0;">
                    <div style="padding:8px;background:#f8fafc;">FAT %</div>
                    <div style="padding:8px;background:#f8fafc;text-align:right;">RATE (₹/L)</div>
                  </div>
                  <div style="max-height:250px;overflow-y:auto;">
                    ${this.defaultChart.cow.slice(0, 30).map((entry, i) => `
                      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;font-size:12px;border-bottom:1px solid #f1f5f9;${i % 2 === 0 ? 'background:#f8fafc' : ''}">
                        <div style="padding:8px;font-weight:700;color:#1e293b;">${entry.fat}%</div>
                        <div style="padding:8px;text-align:right;font-weight:900;color:#16a34a;">₹${entry.rate.toFixed(2)}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
              
              <!-- Buffalo Milk Chart -->
              <div style="margin-bottom:16px;">
                <div style="font-size:14px;font-weight:900;color:#1e293b;margin-bottom:8px;display:flex;align-items:center;gap:8px;">
                  <span style="font-size:20px;">🐃</span> Buffalo Milk Rate Chart
                </div>
                <div style="background:white;border:2px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;font-size:11px;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0;">
                    <div style="padding:8px;background:#f8fafc;">FAT %</div>
                    <div style="padding:8px;background:#f8fafc;text-align:right;">RATE (₹/L)</div>
                  </div>
                  <div style="max-height:250px;overflow-y:auto;">
                    ${this.defaultChart.buffalo.slice(0, 30).map((entry, i) => `
                      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;font-size:12px;border-bottom:1px solid #f1f5f9;${i % 2 === 0 ? 'background:#f8fafc' : ''}">
                        <div style="padding:8px;font-weight:700;color:#1e293b;">${entry.fat}%</div>
                        <div style="padding:8px;text-align:right;font-weight:900;color:#16a34a;">₹${entry.rate.toFixed(2)}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
              
              <!-- Import/Export Buttons -->
              <div style="margin-top:16px;padding-top:16px;border-top:2px dashed #e2e8f0;">
                <div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:8px;">📁 Import / Export</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                  <button onclick="document.getElementById('rateImportInput').click()" style="padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;">📥 Import CSV</button>
                  <button onclick="RateChartManager.exportChart()" style="padding:12px;background:#16a34a;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;">📤 Export CSV</button>
                </div>
                <input type="file" id="rateImportInput" accept=".csv" style="display:none;" onchange="RateChartManager.importChart(this)" />
              </div>
              
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', html);
    },
    
    // Edit rate chart
    editChart: function() {
      const overlay = document.getElementById('rateListOverlay');
      if (overlay) overlay.remove();
      
      const html = `
        <div class="overlay" id="rateEditOverlay" style="display:flex;align-items:center;justify-content:center;z-index:99999;">
          <div class="modal" style="width:95vw;max-width:600px;max-height:90vh;overflow-y:auto;">
            <div class="panelHeader" style="background:linear-gradient(135deg, #16a34a 0%, #059669 100%); color:white; position:sticky; top:0; z-index:10;">
              <span>✏️ Edit Rate Chart</span>
              <button onclick="document.getElementById('rateEditOverlay').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:white;padding:0;width:32px;height:32px;">✖</button>
            </div>
            
            <div style="padding:16px;">
              <!-- Base Rate -->
              <div style="margin-bottom:16px;">
                <label style="font-size:12px;font-weight:700;color:#64748b;display:block;margin-bottom:6px;">Base Rate (₹)</label>
                <input type="number" id="editBaseRate" value="${this.baseRate}" step="0.5" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;font-size:16px;font-weight:700;" onchange="RateChartManager.updateBaseRate(this.value)" />
              </div>
              
              <!-- Cow Milk Rates -->
              <div style="margin-bottom:16px;">
                <div style="font-size:14px;font-weight:900;color:#1e293b;margin-bottom:8px;">🐄 Cow Milk Rates</div>
                <div style="max-height:300px;overflow-y:auto;border:2px solid #e2e8f0;border-radius:8px;">
                  ${this.defaultChart.cow.map((entry, i) => `
                    <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;padding:8px;border-bottom:1px solid #f1f5f9;align-items:center;">
                      <div style="font-size:12px;font-weight:700;color:#1e293b;">${entry.fat}%</div>
                      <input type="number" value="${entry.rate}" step="0.5" onchange="RateChartManager.updateRateEntry('cow',${i},this.value)" style="padding:6px;border:2px solid #e2e8f0;border-radius:6px;font-size:12px;font-weight:700;width:100%;" />
                      <button onclick="RateChartManager.resetRateEntry('cow',${i})" style="padding:4px 8px;background:#f1f5f9;border:none;border-radius:4px;cursor:pointer;font-size:10px;font-weight:700;color:#64748b;">↺ Reset</button>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <!-- Buffalo Milk Rates -->
              <div>
                <div style="font-size:14px;font-weight:900;color:#1e293b;margin-bottom:8px;">🐃 Buffalo Milk Rates</div>
                <div style="max-height:300px;overflow-y:auto;border:2px solid #e2e8f0;border-radius:8px;">
                  ${this.defaultChart.buffalo.map((entry, i) => `
                    <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;padding:8px;border-bottom:1px solid #f1f5f9;align-items:center;">
                      <div style="font-size:12px;font-weight:700;color:#1e293b;">${entry.fat}%</div>
                      <input type="number" value="${entry.rate}" step="0.5" onchange="RateChartManager.updateRateEntry('buffalo',${i},this.value)" style="padding:6px;border:2px solid #e2e8f0;border-radius:6px;font-size:12px;font-weight:700;width:100%;" />
                      <button onclick="RateChartManager.resetRateEntry('buffalo',${i})" style="padding:4px 8px;background:#f1f5f9;border:none;border-radius:4px;cursor:pointer;font-size:10px;font-weight:700;color:#64748b;">↺ Reset</button>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <!-- Save Button -->
              <button onclick="document.getElementById('rateEditOverlay').remove(); RateChartManager.showRateList();" style="margin-top:16px;width:100%;padding:14px;background:#16a34a;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;">✅ Done</button>
              
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', html);
    },
    
    // Update base rate
    updateBaseRate: function(value) {
      this.baseRate = parseFloat(value);
      this.generateDefaultChart();
      showToastFn('✅ Base rate updated!');
    },
    
    // Update rate entry
    updateRateEntry: function(milkType, index, value) {
      if (this.defaultChart[milkType][index]) {
        this.defaultChart[milkType][index].rate = parseFloat(value);
        this.saveChart();
      }
    },
    
    // Reset rate entry to formula
    resetRateEntry: function(milkType, index) {
      this.generateDefaultChart();
      showToastFn('✅ Rate reset to formula!');
    },
    
    // Import chart from CSV
    importChart: function(input) {
      const file = input.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        
        // Try to import for both Cow and Buffalo
        let cowCount = this.importFromCSV(text, 'cow');
        let buffCount = this.importFromCSV(text, 'buffalo');
        
        // If only one type imported, use same for both
        if (cowCount > 0 && buffCount === 0) {
          buffCount = this.importFromCSV(text, 'buffalo');
        }
        
        const total = cowCount + buffCount;
        showToast(`📥 Imported ${total} rates! (Cow: ${cowCount}, Buffalo: ${buffCount})`);
        this.showRateList();
      };
      reader.readAsText(file);
    },
    
    // Export chart to CSV
    exportChart: function() {
      // Use global showToast if available
      var showToastFn = window.showToast || function(msg) { console.log(msg); };

      const csv = this.exportToCSV('cow');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rate-chart.csv';
      a.click();
      URL.revokeObjectURL(url);
      showToastFn('📤 Rate chart exported!');
    },
    
    // Share via WhatsApp
    shareWhatsApp: function() {
      const overlay = document.getElementById('rateListOverlay');
      if (overlay) overlay.remove();
      
      let message = `*${localStorage.getItem('MilkRecord_shop_name') || 'Your Dairy'}*\n`;
      message += `📋 Rate List - ${new Date().toLocaleDateString('en-IN')}\n\n`;
      message += `*Base Rate: ₹${this.baseRate.toFixed(2)}*\n\n`;
      
      message += `*🐄 COW MILK*\n`;
      message += `FAT % | RATE (₹/L)\n`;
      message += `------|----------\n`;
      
      this.defaultChart.cow.slice(0, 15).forEach(entry => {
        message += `${entry.fat}% | ₹${entry.rate.toFixed(2)}\n`;
      });
      
      message += `\n*🐃 BUFFALO MILK*\n`;
      message += `FAT % | RATE (₹/L)\n`;
      message += `------|----------\n`;
      
      this.defaultChart.buffalo.slice(0, 15).forEach(entry => {
        message += `${entry.fat}% | ₹${entry.rate.toFixed(2)}\n`;
      });
      
      message += `\n_For complete rate list, visit our dairy_`;
      
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  };

  // Initialize on load
  document.addEventListener('DOMContentLoaded', function() {
    RateChartManager.loadChart();
    console.log('✅ Rate Chart Manager loaded');
  });

})();
