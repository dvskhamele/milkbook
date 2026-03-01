/**
 * MilkRecord POS - Session Context Manager
 * 
 * Global session state
 * Date, shift, booth, operator
 * 
 * Usage: window.sessionContext.get()
 */

(function() {
  'use strict';

  class SessionContext {
    constructor() {
      this.context = {
        date: this.today(),
        shift: this.currentShift(),
        booth: 'Default Booth',
        operator_id: this.getOperatorId()
      };
      
      console.log('📋 Session Context initialized:', this.context);
    }

    /**
     * Get current context
     */
    get() {
      return { ...this.context };
    }

    /**
     * Update context
     */
    update(newContext) {
      this.context = { ...this.context, ...newContext };
      console.log('📋 Session Context updated:', this.context);
      return { ...this.context };
    }

    /**
     * Set shift
     */
    setShift(shift) {
      this.context.shift = shift;
      return this.get();
    }

    /**
     * Set booth
     */
    setBooth(booth) {
      this.context.booth = booth;
      return this.get();
    }

    /**
     * Get today's date
     */
    today() {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    /**
     * Get current shift
     */
    currentShift() {
      const hour = new Date().getHours();
      return hour < 12 ? 'Morning' : 'Evening';
    }

    /**
     * Get operator ID
     */
    getOperatorId() {
      return localStorage.getItem('mr_operator_id') || 'operator_1';
    }

    /**
     * Reset to defaults
     */
    reset() {
      this.context = {
        date: this.today(),
        shift: this.currentShift(),
        booth: 'Default Booth',
        operator_id: this.getOperatorId()
      };
      return this.get();
    }
  }

  // Create global instance
  window.sessionContext = new SessionContext();

  console.log('✅ Session Context Manager loaded');
})();
