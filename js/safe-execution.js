/**
 * MilkRecord POS - Safe Execution Wrapper
 * Enterprise-grade error isolation
 * Prevents undefined variable crashes
 * 
 * Usage: safeExecute(fn, context, ...args)
 */

(function() {
  'use strict';

  // Global safe execution wrapper
  window.safeExecute = function(fn, context, ...args) {
    try {
      return fn.apply(context || this, args);
    } catch (error) {
      console.error('🛡️ Safe Execution Error:', {
        function: fn.name || 'anonymous',
        error: error.message,
        stack: error.stack?.split('\n')[1] || '',
        timestamp: new Date().toISOString()
      });
      return null;
    }
  };

  // Safe property access - prevents "Cannot read property of undefined"
  window.safeGet = function(obj, path, defaultValue = null) {
    try {
      if (!obj) return defaultValue;
      return path.split('.').reduce((current, key) => {
        return current?.[key];
      }, obj) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Safe array operations - ensures array methods don't crash
  window.safeArray = function(arr) {
    if (!arr) return [];
    if (Array.isArray(arr)) return arr;
    return [];
  };

  // Safe length check
  window.safeLength = function(arr) {
    return Array.isArray(arr) ? arr.length : 0;
  };

  // Safe forEach
  window.safeForEach = function(arr, fn) {
    if (!Array.isArray(arr)) return;
    arr.forEach((item, index) => {
      safeExecute(fn, null, item, index);
    });
  };

  // Safe map
  window.safeMap = function(arr, fn) {
    if (!Array.isArray(arr)) return [];
    return arr.map((item, index) => {
      return safeExecute(fn, null, item, index) || null;
    }).filter(x => x !== null);
  };

  // Safe filter
  window.safeFilter = function(arr, fn) {
    if (!Array.isArray(arr)) return [];
    return arr.filter((item, index) => {
      try {
        return fn(item, index);
      } catch {
        return false;
      }
    });
  };

  // Wrap setTimeout to prevent crashes
  const originalSetTimeout = window.setTimeout;
  window.setTimeout = function(fn, delay, ...args) {
    return originalSetTimeout(() => {
      safeExecute(fn, null, ...args);
    }, delay);
  };

  // Wrap setInterval to prevent crashes
  const originalSetInterval = window.setInterval;
  window.setInterval = function(fn, delay, ...args) {
    return originalSetInterval(() => {
      safeExecute(fn, null, ...args);
    }, delay);
  };

  // Global error handler - prevents white screen of death
  window.addEventListener('error', function(event) {
    console.error('🛡️ Global Error Caught:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.message
    });
    // Don't prevent default - let browser handle it
  });

  // Global unhandled promise rejection handler
  window.addEventListener('unhandledrejection', function(event) {
    console.error('🛡️ Unhandled Promise Rejection:', {
      reason: event.reason?.message || event.reason,
      promise: event.promise
    });
    event.preventDefault(); // Prevent console spam
  });

  // Safe JSON parse
  window.safeJSONParse = function(str, defaultValue = null) {
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  };

  // Safe JSON stringify
  window.safeJSONStringify = function(obj, defaultValue = '{}') {
    try {
      return JSON.stringify(obj);
    } catch {
      return defaultValue;
    }
  };

  // Debounce function - prevents rapid fire calls
  window.debounce = function(fn, delay = 500) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        safeExecute(fn, this, ...args);
      }, delay);
    };
  };

  // Throttle function - limits execution rate
  window.throttle = function(fn, limit = 1000) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        safeExecute(fn, this, ...args);
      }
    };
  };

  console.log('✅ Safe Execution Wrapper loaded');
})();
