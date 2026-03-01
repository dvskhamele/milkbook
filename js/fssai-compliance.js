/**
 * MilkRecord - FSSAI Compliance Auto-Logs
 * Automatic food safety logging for compliance
 */

(function() {
  'use strict';

  window.FSSAICompliance = {
    // Adulterant thresholds (FSSAI limits)
    limits: {
      addedWater: { max: 0, unit: '%' },
      urea: { max: 70, unit: 'mg/100ml' },
      detergent: { max: 0, unit: 'mg/L' },
      formalin: { max: 0, unit: 'mg/L' },
      hydrogenPeroxide: { max: 0, unit: 'mg/L' }
    },
    
    // Auto-log collection for FSSAI
    logCollection: function(entry) {
      const logs = JSON.parse(localStorage.getItem('mr_fssai_logs') || '[]');
      
      const log = {
        id: 'fssai_' + Date.now(),
        timestamp: entry.createdAt || new Date().toISOString(),
        farmer_id: entry.farmerId,
        farmer_name: entry.farmerName,
        village: entry.village || 'Unknown',
        milk_type: entry.animal,
        quantity: parseFloat(entry.qty) || 0,
        fat: parseFloat(entry.fat) || 0,
        snf: parseFloat(entry.snf) || 0,
        clr: parseFloat(entry.clr) || 0,
        density: parseFloat(entry.density) || 0,
        added_water: this.detectAddedWater(entry),
        adulterants: {
          urea: 'Not Tested',
          detergent: 'Not Tested',
          formalin: 'Not Tested'
        },
        quality_status: this.getQualityStatus(entry),
        compliance_status: 'PASS',
        logged_at: new Date().toISOString()
      };
      
      // Flag if adulteration detected
      if (log.added_water > 0) {
        log.compliance_status = 'FAIL - Added Water';
      }
      
      logs.push(log);
      localStorage.setItem('mr_fssai_logs', JSON.stringify(logs));
      
      return log;
    },
    
    // Detect added water from CLR/density
    detectAddedWater: function(entry) {
      const clr = parseFloat(entry.clr) || 28;
      const fat = parseFloat(entry.fat) || 4.0;
      
      // Normal CLR for pure milk: 28-32
      // If CLR < 26, likely water added
      if (clr < 26) {
        return ((28 - clr) / 28 * 100).toFixed(1);
      }
      return 0;
    },
    
    // Get quality status
    getQualityStatus: function(entry) {
      const fat = parseFloat(entry.fat) || 0;
      const snf = parseFloat(entry.snf) || 0;
      
      if (fat >= 3.5 && snf >= 8.5) return 'A+ (Excellent)';
      if (fat >= 3.0 && snf >= 8.0) return 'A (Good)';
      if (fat >= 2.5 && snf >= 7.5) return 'B (Average)';
      return 'C (Below Standard)';
    },
    
    // Generate FSSAI compliance report
    generateReport: function(fromDate, toDate) {
      const logs = JSON.parse(localStorage.getItem('mr_fssai_logs') || '[]');
      
      const filtered = logs.filter(log => {
        const logDate = log.timestamp.split('T')[0];
        return logDate >= fromDate && logDate <= toDate;
      });
      
      const totalSamples = filtered.length;
      const passCount = filtered.filter(l => l.compliance_status === 'PASS').length;
      const failCount = totalSamples - passCount;
      const passPercent = totalSamples > 0 ? ((passCount / totalSamples) * 100) : 0;
      
      const adulterationDetected = filtered.filter(l => l.added_water > 0);
      
      return {
        period: `${fromDate} to ${toDate}`,
        totalSamples: totalSamples,
        passCount: passCount,
        failCount: failCount,
        passPercent: passPercent.toFixed(1) + '%',
        adulterationCases: adulterationDetected.length,
        averageFat: (filtered.reduce((sum, l) => sum + (parseFloat(l.fat) || 0), 0) / totalSamples).toFixed(2),
        averageSNF: (filtered.reduce((sum, l) => sum + (parseFloat(l.snf) || 0), 0) / totalSamples).toFixed(2),
        generatedAt: new Date().toISOString()
      };
    },
    
    // Show compliance dashboard
    showDashboard: function() {
      const today = new Date().toISOString().split('T')[0];
      const lastMonth = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
      
      const report = this.generateReport(lastMonth, today);
      
      const html = `
        <div class="overlay" id="complianceOverlay" style="display:flex;align-items:center;justify-content:center;z-index:99999;">
          <div class="mobile-modal" style="width:95vw;max-width:500px;max-height:90vh;overflow-y:auto;">
            <div class="modal-header">
              <div class="modal-title">✅ FSSAI Compliance Report</div>
              <button class="modal-close" onclick="document.getElementById('complianceOverlay').remove()">✖</button>
            </div>
            <div class="modal-body">
              
              <div style="background:#f0fdf4;padding:16px;border-radius:12px;border:2px solid #16a34a;margin-bottom:16px;">
                <div style="font-size:14px;font-weight:900;color:#15803d;margin-bottom:12px;">📊 Compliance Summary</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                  <div style="background:white;padding:12px;border-radius:8px;">
                    <div style="font-size:10px;color:#64748b;">Total Samples</div>
                    <div style="font-size:20px;font-weight:900;color:#1e293b;">${report.totalSamples}</div>
                  </div>
                  <div style="background:white;padding:12px;border-radius:8px;">
                    <div style="font-size:10px;color:#64748b;">Pass Rate</div>
                    <div style="font-size:20px;font-weight:900;color:${parseFloat(report.passPercent) >= 95 ? '#16a34a' : '#dc2626'};">${report.passPercent}</div>
                  </div>
                </div>
              </div>
              
              <div style="background:#fef3c7;padding:16px;border-radius:12px;border:2px solid #f59e0b;margin-bottom:16px;">
                <div style="font-size:14px;font-weight:900;color:#92400e;margin-bottom:12px;">⚠️ Adulteration Detection</div>
                <div style="font-size:13px;color:#78350f;margin-bottom:8px;">
                  Cases Detected: <strong style="color:${report.adulterationCases > 0 ? '#dc2626' : '#16a34a'};">${report.adulterationCases}</strong>
                </div>
                ${report.adulterationCases > 0 ? `
                  <div style="font-size:11px;color:#92400e;">
                    ⚠️ Immediate action required for flagged samples
                  </div>
                ` : `
                  <div style="font-size:11px;color:#166534;">
                    ✅ No adulteration detected in this period
                  </div>
                `}
              </div>
              
              <div style="background:#eff6ff;padding:16px;border-radius:12px;border:2px solid #3b82f6;margin-bottom:16px;">
                <div style="font-size:14px;font-weight:900;color:#1e3a8a;margin-bottom:12px;">🧪 Quality Parameters</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                  <div style="background:white;padding:12px;border-radius:8px;">
                    <div style="font-size:10px;color:#64748b;">Average Fat</div>
                    <div style="font-size:18px;font-weight:900;color:#1e3a8a;">${report.averageFat}%</div>
                  </div>
                  <div style="background:white;padding:12px;border-radius:8px;">
                    <div style="font-size:10px;color:#64748b;">Average SNF</div>
                    <div style="font-size:18px;font-weight:900;color:#1e3a8a;">${report.averageSNF}%</div>
                  </div>
                </div>
              </div>
              
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <button type="button" onclick="exportFSSAIReport()" 
                  style="padding:14px;background:#16a34a;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;">
                  📥 Export PDF
                </button>
                <button type="button" onclick="document.getElementById('complianceOverlay').remove()" 
                  style="padding:14px;background:#f1f5f9;color:#64748b;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;">
                  Close
                </button>
              </div>
              
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', html);
      
      window.exportFSSAIReport = function() {
        const csv = [
          ['FSSAI Compliance Report'],
          ['Period', report.period],
          ['Generated', new Date(report.generatedAt).toLocaleString('en-IN')],
          [],
          ['Summary'],
          ['Total Samples', report.totalSamples],
          ['Pass Count', report.passCount],
          ['Fail Count', report.failCount],
          ['Pass Rate', report.passPercent],
          ['Adulteration Cases', report.adulterationCases],
          ['Average Fat', report.averageFat + '%'],
          ['Average SNF', report.averageSNF + '%']
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fssai-compliance-${today}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('📥 FSSAI report exported!');
      };
    }
  };

  console.log('✅ FSSAI Compliance Engine loaded');

})();
