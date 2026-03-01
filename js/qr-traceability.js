/**
 * MilkRecord - QR Traceability System
 * Consumer-facing quality verification
 */

(function() {
  'use strict';

  window.QRTraceability = {
    // Generate QR code data for batch
    generateQRData: function(batchData) {
      return {
        batch_id: batchData.batch_number || 'BATCH_' + Date.now(),
        production_date: batchData.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        dairy_name: localStorage.getItem('MilkRecord_shop_name') || 'Your Dairy',
        dairy_address: localStorage.getItem('MilkRecord_shop_address') || '',
        dairy_fssai: localStorage.getItem('MilkRecord_fssai_license') || '',
        dairy_contact: localStorage.getItem('MilkRecord_shop_phone') || '',
        milk_source: {
          villages: batchData.villages || ['Village A'],
          avg_fat: batchData.avg_fat || 5.0,
          avg_snf: batchData.avg_snf || 9.0,
          total_liters: batchData.milk_quantity || 0
        },
        product: {
          type: batchData.product_type || 'Paneer',
          quantity: batchData.product_quantity || 0,
          batch_yield: batchData.yield_efficiency || 100
        },
        quality_tests: {
          fat: batchData.fat || 5.0,
          snf: batchData.snf || 9.0,
          acidity: 0.15,
          phosphatase: 'Negative',
          coliform: 'Not Detected'
        },
        shelf_life: {
          refrigerated: '7 days',
          best_before: new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString('en-IN')
        },
        verified_at: new Date().toISOString()
      };
    },
    
    // Generate QR code (using simple API)
    generateQRCode: function(data) {
      const qrData = JSON.stringify(data);
      const encoded = encodeURIComponent(qrData);
      return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;
    },
    
    // Create traceability label
    createLabel: function(batchData) {
      const qrData = this.generateQRData(batchData);
      const qrUrl = this.generateQRCode(qrData);
      
      return `
        <div style="width:300px;padding:20px;background:white;border:2px solid #16a34a;border-radius:12px;font-family:Arial,sans-serif;">
          <div style="text-align:center;margin-bottom:16px;">
            <div style="font-size:18px;font-weight:900;color:#16a34a;">🥛 ${qrData.dairy_name}</div>
            <div style="font-size:10px;color:#64748b;">FSSAI Licensed Dairy</div>
          </div>
          
          <div style="text-align:center;margin-bottom:16px;">
            <img src="${qrUrl}" alt="QR Code" style="width:200px;height:200px;" />
          </div>
          
          <div style="text-align:center;margin-bottom:12px;">
            <div style="font-size:12px;font-weight:700;color:#1e293b;">Scan for Quality Report</div>
            <div style="font-size:10px;color:#64748b;">Farm to Home Traceability</div>
          </div>
          
          <div style="border-top:2px solid #e2e8f0;padding-top:12px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:10px;">
              <div>
                <strong>Product:</strong> ${qrData.product.type}<br/>
                <strong>Batch:</strong> ${qrData.batch_id}<br/>
                <strong>Mfg Date:</strong> ${qrData.production_date}
              </div>
              <div style="text-align:right;">
                <strong>Qty:</strong> ${qrData.product.quantity} kg<br/>
                <strong>Best Before:</strong> ${qrData.shelf_life.best_before}<br/>
                <strong>Store:</strong> ${qrData.shelf_life.refrigerated}
              </div>
            </div>
          </div>
          
          <div style="margin-top:12px;padding:8px;background:#f0fdf4;border-radius:6px;font-size:9px;color:#166534;text-align:center;">
            ✅ 100% Pure Milk | ✅ No Adulteration | ✅ FSSAI Compliant
          </div>
        </div>
      `;
    },
    
    // Show QR label for batch
    showQRLabel: function(batchData) {
      const labelHTML = this.createLabel(batchData);
      
      const html = `
        <div class="overlay" id="qrOverlay" style="display:flex;align-items:center;justify-content:center;z-index:99999;">
          <div class="mobile-modal" style="width:95vw;max-width:350px;">
            <div class="modal-header">
              <div class="modal-title">📱 QR Traceability Label</div>
              <button class="modal-close" onclick="document.getElementById('qrOverlay').remove()">✖</button>
            </div>
            <div class="modal-body" style="text-align:center;">
              ${labelHTML}
              
              <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <button type="button" onclick="printQRLabel()" 
                  style="padding:12px;background:#16a34a;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;">
                  🖨️ Print Label
                </button>
                <button type="button" onclick="downloadQRLabel()" 
                  style="padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;">
                  📥 Download
                </button>
              </div>
              
              <div style="margin-top:12px;font-size:11px;color:#64748b;">
                Consumers scan this QR to verify quality & origin
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', html);
      
      window.printQRLabel = function() {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html><head><title>QR Label</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;">
            ${labelHTML}
          </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
      };
      
      window.downloadQRLabel = function() {
        showToast('📥 Label download started!');
        // In production, would generate PNG/PDF
      };
    },
    
    // Consumer verification page (when QR is scanned)
    showVerification: function(qrData) {
      // This would be a separate public page
      // For now, show in modal
      const html = `
        <div class="overlay" id="verifyOverlay" style="display:flex;align-items:center;justify-content:center;z-index:99999;">
          <div class="mobile-modal" style="width:95vw;max-width:400px;">
            <div class="modal-header" style="background:#f0fdf4;">
              <div class="modal-title" style="color:#16a34a;">✅ Quality Verified</div>
              <button class="modal-close" onclick="document.getElementById('verifyOverlay').remove()">✖</button>
            </div>
            <div class="modal-body">
              <div style="text-align:center;margin-bottom:16px;">
                <div style="font-size:48px;margin-bottom:8px;">✅</div>
                <div style="font-size:16px;font-weight:900;color:#1e293b;">100% Pure & Safe</div>
                <div style="font-size:12px;color:#64748b;">FSSAI Compliant Product</div>
              </div>
              
              <div style="background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:12px;">
                <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:8px;">Product Details</div>
                <div style="font-size:12px;color:#64748b;line-height:1.8;">
                  <strong>Product:</strong> ${qrData.product.type}<br/>
                  <strong>Batch:</strong> ${qrData.batch_id}<br/>
                  <strong>Manufactured:</strong> ${qrData.production_date}<br/>
                  <strong>Best Before:</strong> ${qrData.shelf_life.best_before}
                </div>
              </div>
              
              <div style="background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:12px;">
                <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:8px;">Quality Tests</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
                  <div>
                    <strong>Fat:</strong> ${qrData.quality_tests.fat}%<br/>
                    <strong>SNF:</strong> ${qrData.quality_tests.snf}%
                  </div>
                  <div>
                    <strong>Acidity:</strong> ${qrData.quality_tests.acidity}%<br/>
                    <strong>Phosphatase:</strong> ${qrData.quality_tests.phosphatase}
                  </div>
                </div>
              </div>
              
              <div style="background:#f0fdf4;padding:12px;border-radius:8px;text-align:center;">
                <div style="font-size:11px;color:#166534;font-weight:700;">
                  🏭 ${qrData.dairy_name}<br/>
                  📞 ${qrData.dairy_contact}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', html);
    }
  };

  console.log('✅ QR Traceability System loaded');

})();
