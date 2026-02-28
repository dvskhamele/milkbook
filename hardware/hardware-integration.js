/**
 * MilkRecord POS - Hardware Integration Module
 * 
 * Integrates hardware devices commonly used in dairy/retail POS:
 * - Barcode/QR Scanner (USB/Bluetooth)
 * - Thermal Receipt Printer (ESC/POS)
 * - Digital Weighing Scale (Serial/USB)
 * - Customer Display (VFD/LCD)
 * - Cash Drawer
 * - Biometric Scanner (optional)
 * 
 * Inspired by: milkrecord_bmc/HUB device simulators & hardware integration
 */

class HardwareIntegration {
  constructor() {
    this.devices = {
      barcodeScanner: null,
      printer: null,
      scale: null,
      customerDisplay: null,
      cashDrawer: null,
      biometric: null
    };
    this.config = {
      autoPrint: false,
      auto weigh: false,
      dualScreen: false,
      cashDrawerOnOpen: true
    };
    this.init();
  }

  /**
   * Initialize all hardware devices
   */
  init() {
    console.log('🔌 Initializing Hardware Integration...');
    
    // Auto-detect connected devices
    this.detectBarcodeScanner();
    this.detectPrinter();
    this.detectScale();
    this.detectCustomerDisplay();
    this.detectCashDrawer();
    
    // Load saved configuration
    this.loadConfig();
    
    console.log('✅ Hardware Integration Ready');
  }

  // =====================================================
  // BARCODE/QR SCANNER
  // =====================================================
  
  /**
   * Detect USB/Bluetooth barcode scanner
   * Scanners act as keyboard input devices
   */
  detectBarcodeScanner() {
    // Barcode scanners typically send data as keyboard input
    // They usually end with Enter key (keyCode 13)
    
    let barcodeBuffer = '';
    let lastKeyTime = 0;
    const BARCODE_TIMEOUT = 100; // ms between keystrokes
    
    document.addEventListener('keydown', (e) => {
      const currentTime = Date.now();
      
      // Reset buffer if too much time passed
      if (currentTime - lastKeyTime > BARCODE_TIMEOUT) {
        barcodeBuffer = '';
      }
      
      lastKeyTime = currentTime;
      
      // Collect characters (scanners send very fast)
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcodeBuffer += e.key;
        e.preventDefault(); // Don't show in input fields
      }
      
      // Enter key = barcode complete
      if (e.key === 'Enter' && barcodeBuffer.length > 3) {
        e.preventDefault();
        this.onBarcodeScanned(barcodeBuffer);
        barcodeBuffer = '';
      }
    });
    
    this.devices.barcodeScanner = {
      connected: true,
      type: 'USB/Keyboard Emulation',
      lastScan: null
    };
    
    console.log('📷 Barcode Scanner: Ready (Keyboard Emulation)');
  }

  /**
   * Handle scanned barcode
   */
  async onBarcodeScanned(barcode) {
    console.log('📷 Barcode Scanned:', barcode);
    
    // Search product by barcode
    const product = await this.searchProductByBarcode(barcode);
    
    if (product) {
      // Add to cart
      this.addToCart(product);
      
      // Play success sound
      this.playBeep('success');
      
      // Show toast
      this.showToast(`✅ ${product.name} added`);
    } else {
      // Product not found
      this.playBeep('error');
      this.showToast('❌ Product not found: ' + barcode);
      
      // Optionally: Open product creation modal
      if (confirm('Product not found. Create new product?')) {
        this.openCreateProductModal(barcode);
      }
    }
  }

  /**
   * Search product by barcode in database
   */
  async searchProductByBarcode(barcode) {
    // Try localStorage first (offline mode)
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const product = products.find(p => p.barcode === barcode || p.sku === barcode);
    
    if (product) {
      return product;
    }
    
    // Try Supabase/Backend
    try {
      const response = await fetch(`/api/products/barcode/${barcode}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.log('Offline mode - using local data only');
    }
    
    return null;
  }

  // =====================================================
  // THERMAL RECEIPT PRINTER (ESC/POS)
  // =====================================================
  
  /**
   * Detect thermal receipt printer
   */
  detectPrinter() {
    // Check for WebUSB API support (Chrome/Edge)
    if ('usb' in navigator) {
      navigator.usb.getDevices().then(devices => {
        const printer = devices.find(d => 
          d.deviceClass === 7 || // Printer class
          d.productName?.includes('printer') ||
          d.productName?.includes('ESC') ||
          d.productName?.includes('POS')
        );
        
        if (printer) {
          this.devices.printer = {
            connected: true,
            type: 'USB ESC/POS',
            device: printer
          };
          console.log('🖨️  Thermal Printer: Connected (USB)');
        }
      });
    }
    
    // Also check for network printer
    this.detectNetworkPrinter();
    
    // Fallback: Browser print dialog
    this.devices.printer = this.devices.printer || {
      connected: true,
      type: 'Browser Print Dialog',
      print: (content) => this.browserPrint(content)
    };
  }

  /**
   * Detect network printer (WiFi/Ethernet)
   */
  detectNetworkPrinter() {
    // Common printer IP ranges
    const printerIPs = [
      '192.168.1.100',
      '192.168.0.100',
      '10.0.0.100'
    ];
    
    // Try to ping/connect (requires backend proxy)
    // This is a placeholder - actual implementation needs backend
  }

  /**
   * Print receipt using ESC/POS commands
   */
  async printReceipt(receiptData) {
    const printer = this.devices.printer;
    
    if (!printer) {
      console.error('❌ No printer connected');
      this.browserPrint(receiptData);
      return;
    }
    
    // ESC/POS commands
    const ESC = '\x1B';
    const GS = '\x1D';
    const INIT = `${ESC}@`;      // Initialize printer
    const ALIGN_LEFT = `${ESC}a0`;
    const ALIGN_CENTER = `${ESC}a1`;
    const ALIGN_RIGHT = `${ESC}a2`;
    const BOLD_ON = `${ESC}E1`;
    const BOLD_OFF = `${ESC}E0`;
    const DOUBLE_ON = `${GS}!${String.fromCharCode(0x11)}`;
    const DOUBLE_OFF = `${GS}!${String.fromCharCode(0)}`;
    const CUT = `${GS}V${String.fromCharCode(66)}${String.fromCharCode(0)}`;
    const LINE_FEED = '\n';
    
    let receipt = '';
    
    // Header
    receipt += INIT;
    receipt += ALIGN_CENTER;
    receipt += DOUBLE_ON;
    receipt += receiptData.shopName || 'MilkRecord POS';
    receipt += DOUBLE_OFF;
    receipt += LINE_FEED;
    receipt += receiptData.address || '';
    receipt += LINE_FEED;
    receipt += receiptData.phone || '';
    receipt += LINE_FEED + LINE_FEED;
    
    // Receipt info
    receipt += ALIGN_LEFT;
    receipt += `Invoice: ${receiptData.invoiceNumber}`;
    receipt += LINE_FEED;
    receipt += `Date: ${receiptData.date}`;
    receipt += LINE_FEED;
    receipt += `Customer: ${receiptData.customerName}`;
    receipt += LINE_FEED + LINE_FEED;
    
    // Items table header
    receipt += BOLD_ON;
    receipt += 'Item'.padEnd(20) + 'Qty'.padStart(5) + 'Price'.padStart(10);
    receipt += BOLD_OFF;
    receipt += LINE_FEED;
    receipt += '─'.repeat(40);
    receipt += LINE_FEED;
    
    // Items
    receiptData.items.forEach(item => {
      receipt += item.name.padEnd(20);
      receipt += item.qty.toString().padStart(5);
      receipt += ('₹' + item.price.toFixed(2)).padStart(10);
      receipt += LINE_FEED;
    });
    
    receipt += '─'.repeat(40);
    receipt += LINE_FEED;
    
    // Totals
    receipt += ALIGN_RIGHT;
    receipt += `Subtotal: ₹${receiptData.subtotal.toFixed(2)}`;
    receipt += LINE_FEED;
    
    if (receiptData.discount > 0) {
      receipt += `Discount: -₹${receiptData.discount.toFixed(2)}`;
      receipt += LINE_FEED;
    }
    
    receipt += BOLD_ON;
    receipt += `TOTAL: ₹${receiptData.total.toFixed(2)}`;
    receipt += BOLD_OFF;
    receipt += LINE_FEED + LINE_FEED;
    
    // Payment info
    receipt += ALIGN_LEFT;
    receipt += `Payment: ${receiptData.paymentMode}`;
    receipt += LINE_FEED;
    receipt += `Amount: ₹${receiptData.amountPaid.toFixed(2)}`;
    receipt += LINE_FEED;
    
    if (receiptData.change > 0) {
      receipt += `Change: ₹${receiptData.change.toFixed(2)}`;
      receipt += LINE_FEED;
    }
    
    // Footer
    receipt += LINE_FEED;
    receipt += ALIGN_CENTER;
    receipt += 'Thank you for your visit!';
    receipt += LINE_FEED;
    receipt += 'Please visit again';
    receipt += LINE_FEED + LINE_FEED;
    
    // Cut paper
    receipt += CUT;
    
    // Send to printer
    if (printer.type === 'USB ESC/POS') {
      await this.sendToUSBPrinter(printer.device, receipt);
    } else if (printer.type === 'Network') {
      await this.sendToNetworkPrinter(printer.ip, receipt);
    } else {
      // Fallback to browser print
      this.browserPrint(receiptData);
    }
    
    // Open cash drawer if configured
    if (this.config.cashDrawerOnOpen) {
      this.openCashDrawer();
    }
    
    console.log('🖨️  Receipt printed');
  }

  /**
   * Send to USB printer using WebUSB API
   */
  async sendToUSBPrinter(device, data) {
    try {
      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);
      await device.transferOut(1, new TextEncoder().encode(data));
      await device.close();
    } catch (error) {
      console.error('USB Print error:', error);
      this.browserPrint(JSON.parse(data));
    }
  }

  /**
   * Send to network printer
   */
  async sendToNetworkPrinter(ip, data) {
    try {
      const response = await fetch(`/api/printer/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, data })
      });
      
      if (!response.ok) throw new Error('Network print failed');
    } catch (error) {
      console.error('Network Print error:', error);
      this.browserPrint(JSON.parse(data));
    }
  }

  /**
   * Fallback: Browser print dialog
   */
  browserPrint(receiptData) {
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receiptData.invoiceNumber}</title>
        <style>
          @media print {
            body { font-family: 'Courier New', monospace; font-size: 12px; }
            .receipt { width: 80mm; padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <pre>${this.formatReceiptText(receiptData)}</pre>
        </div>
        <script>window.print(); window.close();<\/script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  }

  formatReceiptText(data) {
    let text = `${data.shopName || 'MilkRecord POS'}\n`;
    text += `${data.address || ''}\n`;
    text += `${data.phone || ''}\n\n`;
    text += `Inv: ${data.invoiceNumber}\n`;
    text += `${data.date}\n`;
    text += `${data.customerName}\n\n`;
    text += '─'.repeat(40) + '\n';
    
    data.items.forEach(item => {
      text += `${item.name} x${item.qty}\n`;
      text += `₹${item.price.toFixed(2)}\n`;
    });
    
    text += '─'.repeat(40) + '\n';
    text += `TOTAL: ₹${data.total.toFixed(2)}\n\n`;
    text += `${data.paymentMode}: ₹${data.amountPaid.toFixed(2)}\n`;
    
    if (data.change > 0) {
      text += `Change: ₹${data.change.toFixed(2)}\n`;
    }
    
    text += '\nThank you!\n';
    
    return text;
  }

  // =====================================================
  // DIGITAL WEIGHING SCALE
  // =====================================================
  
  /**
   * Detect digital weighing scale
   */
  detectScale() {
    // Serial API (Chrome 89+)
    if ('serial' in navigator) {
      this.connectSerialScale();
    }
    
    // USB HID API
    if ('hid' in navigator) {
      this.connectHIDScale();
    }
    
    // Fallback: Manual weight entry
    this.devices.scale = this.devices.scale || {
      connected: false,
      type: 'Manual Entry',
      weight: 0
    };
  }

  /**
   * Connect to serial scale
   */
  async connectSerialScale() {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      
      this.devices.scale = {
        connected: true,
        type: 'Serial',
        port: port,
        weight: 0
      };
      
      console.log('⚖️  Scale: Connected (Serial)');
      
      // Start reading weight
      this.readScaleWeight(port);
    } catch (error) {
      console.log('Scale not connected or not supported');
    }
  }

  /**
   * Connect to USB HID scale
   */
  async connectHIDScale() {
    try {
      const device = await navigator.hid.requestDevice({
        filters: [{ usagePage: 0xffa0, usage: 0x1 }] // Weight scales
      });
      
      await device.open();
      
      this.devices.scale = {
        connected: true,
        type: 'USB HID',
        device: device,
        weight: 0
      };
      
      console.log('⚖️  Scale: Connected (USB HID)');
      
      // Listen for weight updates
      device.addEventListener('inputreport', this.handleScaleInput.bind(this));
    } catch (error) {
      console.log('HID Scale not connected');
    }
  }

  /**
   * Read weight from serial scale
   */
  async readScaleWeight(port) {
    const reader = port.readable.getReader();
    
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        // Parse weight from scale data
        const weight = this.parseScaleData(value);
        this.devices.scale.weight = weight;
        
        // Update UI if weigh mode active
        if (this.config.autoWeigh) {
          this.updateWeightDisplay(weight);
        }
      }
    } catch (error) {
      console.error('Scale read error:', error);
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Handle HID scale input
   */
  handleScaleInput(event) {
    const weight = this.parseScaleData(event.data);
    this.devices.scale.weight = weight;
    this.updateWeightDisplay(weight);
  }

  /**
   * Parse weight from scale data
   */
  parseScaleData(data) {
    // Implementation depends on scale protocol
    // Common formats: ASCII weight followed by unit
    // Example: "1.234 kg" or "1234 g"
    
    const text = new TextDecoder().decode(data);
    const match = text.match(/([\d.]+)\s*(kg|g|lb)/i);
    
    if (match) {
      let weight = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      
      // Convert to kg
      if (unit === 'g') weight /= 1000;
      if (unit === 'lb') weight *= 0.453592;
      
      return weight;
    }
    
    return 0;
  }

  /**
   * Update weight display in UI
   */
  updateWeightDisplay(weight) {
    const weightElement = document.getElementById('weightDisplay');
    if (weightElement) {
      weightElement.textContent = `${weight.toFixed(3)} kg`;
    }
  }

  // =====================================================
  // CUSTOMER DISPLAY (Dual Screen)
  // =====================================================
  
  /**
   * Detect customer-facing display
   */
  detectCustomerDisplay() {
    // Check for secondary display
    if (window.screen && window.screen.availWidth > window.screen.width) {
      this.openCustomerDisplay();
    }
    
    // VFD/LCD display via Serial
    if ('serial' in navigator) {
      this.connectCustomerDisplay();
    }
  }

  /**
   * Open customer display window
   */
  openCustomerDisplay() {
    const customerWindow = window.open('', 'CustomerDisplay', 
      'width=400,height=300,left=' + (screen.width - 400));
    
    if (customerWindow) {
      customerWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Customer Display</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background: #000;
              color: #0f0;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .price { font-size: 72px; font-weight: bold; }
            .item { font-size: 24px; margin: 10px 0; }
            .message { font-size: 18px; color: #ff0; }
          </style>
        </head>
        <body>
          <div class="item" id="customerItem">Welcome</div>
          <div class="price" id="customerPrice">₹0.00</div>
          <div class="message" id="customerMessage">Thank you</div>
        </body>
        </html>
      `);
      
      this.devices.customerDisplay = {
        connected: true,
        type: 'Secondary Window',
        window: customerWindow
      };
      
      console.log('🖥️  Customer Display: Connected');
    }
  }

  /**
   * Update customer display
   */
  updateCustomerDisplay(item, price, message) {
    const display = this.devices.customerDisplay;
    
    if (display && display.window) {
      display.window.document.getElementById('customerItem').textContent = item;
      display.window.document.getElementById('customerPrice').textContent = `₹${price.toFixed(2)}`;
      display.window.document.getElementById('customerMessage').textContent = message;
    }
  }

  // =====================================================
  // CASH DRAWER
  // =====================================================
  
  /**
   * Detect cash drawer
   */
  detectCashDrawer() {
    // Cash drawers are typically connected via printer
    // They open when printer sends specific ESC/POS command
    
    this.devices.cashDrawer = {
      connected: true, // Via printer
      type: 'Printer-Connected'
    };
    
    console.log('💰 Cash Drawer: Ready (via Printer)');
  }

  /**
   * Open cash drawer
   */
  async openCashDrawer() {
    const printer = this.devices.printer;
    
    if (!printer) {
      console.warn('⚠️  Cannot open cash drawer - no printer');
      return;
    }
    
    // ESC/POS command to open cash drawer
    const OPEN_DRAWER = '\x1B\x70\x00\x3C\xFF'; // Standard command
    
    if (printer.type === 'USB ESC/POS') {
      await this.sendToUSBPrinter(printer.device, OPEN_DRAWER);
    } else if (printer.type === 'Network') {
      await this.sendToNetworkPrinter(printer.ip, OPEN_DRAWER);
    }
    
    console.log('💰 Cash drawer opened');
  }

  // =====================================================
  // BIOMETRIC SCANNER (Optional)
  // =====================================================
  
  /**
   * Detect biometric scanner
   */
  detectBiometric() {
    // WebAuthn API for biometric authentication
    if (window.PublicKeyCredential) {
      this.devices.biometric = {
        connected: true,
        type: 'WebAuthn',
        available: true
      };
      
      console.log('👆 Biometric: Available (WebAuthn)');
    }
  }

  /**
   * Authenticate with biometrics
   */
  async authenticateBiometric() {
    if (!this.devices.biometric?.available) {
      throw new Error('Biometric not available');
    }
    
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          rpId: window.location.hostname,
          allowCredentials: []
        }
      });
      
      return {
        success: true,
        credential: credential
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================
  
  /**
   * Play beep sound
   */
  playBeep(type = 'success') {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'success') {
      oscillator.frequency.value = 1000;
      gainNode.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'error') {
      oscillator.frequency.value = 400;
      gainNode.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  }

  /**
   * Show toast notification
   */
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #0f172a;
      color: #fff;
      padding: 12px 20px;
      border-radius: 16px;
      font-weight: 700;
      z-index: 10000;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  /**
   * Add product to cart
   */
  addToCart(product) {
    // This would integrate with the POS cart system
    // Placeholder - actual implementation depends on POS structure
    console.log('Adding to cart:', product);
  }

  /**
   * Open create product modal
   */
  openCreateProductModal(barcode) {
    // Placeholder - opens modal to create new product
    console.log('Create product with barcode:', barcode);
  }

  /**
   * Load saved configuration
   */
  loadConfig() {
    const saved = localStorage.getItem('hardwareConfig');
    if (saved) {
      this.config = { ...this.config, ...JSON.parse(saved) };
    }
  }

  /**
   * Save configuration
   */
  saveConfig() {
    localStorage.setItem('hardwareConfig', JSON.stringify(this.config));
  }

  /**
   * Get device status
   */
  getStatus() {
    return {
      barcodeScanner: this.devices.barcodeScanner?.connected || false,
      printer: this.devices.printer?.connected || false,
      scale: this.devices.scale?.connected || false,
      customerDisplay: this.devices.customerDisplay?.connected || false,
      cashDrawer: this.devices.cashDrawer?.connected || false,
      biometric: this.devices.biometric?.available || false
    };
  }
}

// Export for use in POS application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HardwareIntegration;
} else {
  window.HardwareIntegration = HardwareIntegration;
}
