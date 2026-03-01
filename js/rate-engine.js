/**
 * MilkRecord POS - Collection Page Rate Engine
 * 
 * Isolated rate calculation module
 * Never mix UI logic with rate logic
 * 
 * Usage: window.rateEngine.calculate(intake, config)
 */

(function() {
  'use strict';

  class RateEngine {
    constructor() {
      // Default rate formulas (can be overridden per dairy)
      this.formulas = {
        cow: {
          base: 30,
          fat_factor: 2.5,
          snf_factor: 1.2,
          formula: 'base + (fat * fat_factor) + (snf * snf_factor)'
        },
        buffalo: {
          base: 45,
          fat_factor: 3.0,
          snf_factor: 1.5,
          formula: 'base + (fat * fat_factor) + (snf * snf_factor)'
        }
      };

      // Rate config (can be loaded from backend)
      this.config = {
        enableFatBased: true,
        enableSNFBased: true,
        minFat: 0,
        maxFat: 10,
        minSNF: 0,
        maxSNF: 15,
        roundTo: 2
      };

      console.log('🧮 Rate Engine initialized');
    }

    /**
     * Calculate rate and amount
     * @param {object} intake - {quantity, fat, snf, animal_type, rate_override}
     * @param {object} config - Optional config override
     * @returns {object} {rate_per_litre, total_amount, breakdown}
     */
    calculate(intake, config = null) {
      const cfg = config || this.config;
      const animal = (intake.animal_type || 'cow').toLowerCase();
      const formula = this.formulas[animal] || this.formulas.cow;

      // If rate override provided, use it
      if (intake.rate_override && intake.rate_override > 0) {
        const rate = parseFloat(intake.rate_override);
        const amount = this.round(rate * parseFloat(intake.quantity || 0));
        
        return {
          rate_per_litre: rate,
          total_amount: amount,
          breakdown: {
            base_rate: rate,
            fat_component: 0,
            snf_component: 0,
            quantity: parseFloat(intake.quantity || 0),
            calculation_mode: 'manual_override'
          },
          source: 'manual'
        };
      }

      // Auto calculation using formula
      const fat = parseFloat(intake.fat || 0);
      const snf = parseFloat(intake.snf || 0);
      const quantity = parseFloat(intake.quantity || 0);

      // Validate inputs
      if (fat < cfg.minFat || fat > cfg.maxFat) {
        console.warn('⚠️ Fat out of range:', fat);
      }
      if (snf < cfg.minSNF || snf > cfg.maxSNF) {
        console.warn('⚠️ SNF out of range:', snf);
      }

      // Calculate components
      const base_rate = formula.base;
      const fat_component = cfg.enableFatBased ? (fat * formula.fat_factor) : 0;
      const snf_component = cfg.enableSNFBased ? (snf * formula.snf_factor) : 0;
      
      const rate_per_litre = this.round(base_rate + fat_component + snf_component);
      const total_amount = this.round(rate_per_litre * quantity);

      return {
        rate_per_litre: rate_per_litre,
        total_amount: total_amount,
        breakdown: {
          base_rate: base_rate,
          fat_component: this.round(fat_component),
          snf_component: this.round(snf_component),
          quantity: quantity,
          fat: fat,
          snf: snf,
          animal_type: animal,
          calculation_mode: 'auto',
          formula_used: formula.formula
        },
        source: 'auto'
      };
    }

    /**
     * Set custom rate formula
     */
    setFormula(animal_type, formula) {
      this.formulas[animal_type] = formula;
      console.log('✅ Rate formula updated for:', animal_type);
    }

    /**
     * Update rate config
     */
    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      console.log('✅ Rate config updated:', this.config);
    }

    /**
     * Get current config
     */
    getConfig() {
      return { ...this.config };
    }

    /**
     * Round to decimal places
     */
    round(value, decimals = 2) {
      return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }

    /**
     * Validate intake data
     */
    validate(intake) {
      const errors = [];

      if (!intake.quantity || intake.quantity <= 0) {
        errors.push('Quantity required');
      }

      if (intake.fat !== undefined && (intake.fat < 0 || intake.fat > 10)) {
        errors.push('Fat must be between 0-10');
      }

      if (intake.snf !== undefined && (intake.snf < 0 || intake.snf > 15)) {
        errors.push('SNF must be between 0-15');
      }

      return {
        valid: errors.length === 0,
        errors: errors
      };
    }
  }

  // Create global instance
  window.rateEngine = new RateEngine();

  console.log('✅ Rate Engine loaded');
})();
