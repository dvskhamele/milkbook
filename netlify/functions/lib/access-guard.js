/**
 * Subscription & Module Guard Middleware
 * Use these functions in all API endpoints
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = require('./supabase-client');

/**
 * Check if subscription is active for write operations
 * Returns: { allowed: boolean, reason: string, status: string, daysRemaining: number }
 */
async function checkSubscriptionAccess(shop_id) {
  try {
    const { data, error } = await supabase
      .rpc('can_write_data', { p_shop_id: shop_id });
    
    if (error) {
      return {
        allowed: false,
        reason: 'Database error',
        status: 'error',
        daysRemaining: 0
      };
    }
    
    const result = data[0];
    
    return {
      allowed: result.allowed,
      reason: result.reason,
      status: result.subscription_status,
      daysRemaining: result.trial_days_remaining
    };
  } catch (error) {
    console.error('Subscription check error:', error);
    return {
      allowed: false,
      reason: 'Server error',
      status: 'error',
      daysRemaining: 0
    };
  }
}

/**
 * Check if specific module is enabled
 * Returns: { allowed: boolean, reason: string, moduleName: string }
 */
async function checkModuleAccess(shop_id, module_id) {
  try {
    const { data, error } = await supabase
      .rpc('can_use_module', { p_shop_id: shop_id, p_module_id: module_id });
    
    if (error) {
      return {
        allowed: false,
        reason: 'Database error',
        moduleName: null
      };
    }
    
    const result = data[0];
    
    return {
      allowed: result.allowed,
      reason: result.reason,
      moduleName: result.module_name
    };
  } catch (error) {
    console.error('Module check error:', error);
    return {
      allowed: false,
      reason: 'Server error',
      moduleName: null
    };
  }
}

/**
 * Middleware: Require active subscription for write operations
 * Use in POST/PUT/DELETE endpoints
 */
function requireActiveSubscription() {
  return async (shop_id) => {
    const access = await checkSubscriptionAccess(shop_id);
    
    if (!access.allowed) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'SUBSCRIPTION_EXPIRED',
          message: access.reason,
          subscription_status: access.status,
          trial_days_remaining: access.daysRemaining,
          upgrade_required: true
        })
      };
    }
    
    return null; // No error, continue
  };
}

/**
 * Middleware: Require specific module enabled
 * Use in module-specific endpoints
 */
function requireModule(module_id) {
  return async (shop_id) => {
    const access = await checkModuleAccess(shop_id, module_id);
    
    if (!access.allowed) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'MODULE_NOT_ENABLED',
          message: access.reason,
          module_id: module_id,
          module_name: access.moduleName,
          upgrade_required: true
        })
      };
    }
    
    return null; // No error, continue
  };
}

/**
 * Combined guard: Check both subscription AND module
 */
function requireAccess(module_id) {
  return async (shop_id) => {
    // Check subscription first
    const subscriptionError = await requireActiveSubscription()(shop_id);
    if (subscriptionError) return subscriptionError;
    
    // Check module
    const moduleError = await requireModule(module_id)(shop_id);
    if (moduleError) return moduleError;
    
    return null; // All checks passed
  };
}

/**
 * Error codes for frontend handling:
 * 
 * SUBSCRIPTION_EXPIRED:
 *   - Redirect to upgrade page
 *   - Show trial expiry message
 *   - Allow read-only access
 * 
 * MODULE_NOT_ENABLED:
 *   - Show module info/upgrade page
 *   - Allow access to other features
 * 
 * UNAUTHORIZED:
 *   - Redirect to login
 *   - Clear session
 */

module.exports = {
  checkSubscriptionAccess,
  checkModuleAccess,
  requireActiveSubscription,
  requireModule,
  requireAccess
};
