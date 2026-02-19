import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not configured');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * Get user's shop_id from JWT token
 */
export async function getUserShopId(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) return null;
  
  const { data: userProfile } = await supabase
    .from('users')
    .select('shop_id')
    .eq('id', user.id)
    .single();
  
  return userProfile?.shop_id || null;
}

/**
 * Check if subscription is active and get details
 */
export async function checkSubscription(shopId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, trial_end, paid_end')
    .eq('shop_id', shopId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) {
    return { active: false, status: 'none', daysRemaining: 0 };
  }
  
  const now = new Date();
  let status = data.status;
  let daysRemaining = 0;
  
  // Check if expired
  if (data.paid_end) {
    const paidEnd = new Date(data.paid_end);
    if (paidEnd < now) {
      status = 'expired';
    } else {
      daysRemaining = Math.ceil((paidEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
  } else if (data.trial_end) {
    const trialEnd = new Date(data.trial_end);
    if (trialEnd < now) {
      status = 'expired';
    } else {
      daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
  }
  
  return {
    active: status === 'active',
    status,
    daysRemaining
  };
}

/**
 * Check if module is enabled
 */
export async function checkModule(shopId: string, moduleId: string) {
  const { data, error } = await supabase
    .from('shop_modules')
    .select('enabled, modules(name)')
    .eq('shop_id', shopId)
    .eq('module_id', moduleId)
    .single();
  
  if (error || !data) {
    return { enabled: false, name: null };
  }
  
  return {
    enabled: data.enabled,
    name: data.modules?.name || moduleId
  };
}

/**
 * Check if date is within allowed history window
 * Returns true if access is allowed, false if blocked
 */
export function isWithinHistoryWindow(requestedDate: Date, subscriptionStatus: string) {
  // If subscription is active, allow all dates
  if (subscriptionStatus === 'active') {
    return true;
  }
  
  // If expired, only allow last 3 days
  const HISTORY_WINDOW_DAYS = 3;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - HISTORY_WINDOW_DAYS);
  
  return requestedDate >= cutoffDate;
}

/**
 * Middleware: Require active subscription for history/reports
 */
export function requireSubscriptionForHistory(requestedDate: Date) {
  return async (shopId: string) => {
    const subscription = await checkSubscription(shopId);
    
    if (!subscription.active) {
      // Check if date is within allowed window
      if (!isWithinHistoryWindow(requestedDate, subscription.status)) {
        return {
          statusCode: 403,
          body: {
            error: 'SUBSCRIPTION_REQUIRED',
            message: 'Upgrade to view records older than 3 days.',
            subscription_status: subscription.status,
            trial_days_remaining: subscription.daysRemaining,
            upgrade_required: true
          }
        };
      }
    }
    
    return null; // No error, continue
  };
}

/**
 * Middleware: Require active subscription for exports/reports
 */
export function requireSubscriptionForExports() {
  return async (shopId: string) => {
    const subscription = await checkSubscription(shopId);
    
    if (!subscription.active) {
      return {
        statusCode: 403,
        body: {
          error: 'SUBSCRIPTION_REQUIRED',
          message: 'Upgrade to enable exports and reports.',
          subscription_status: subscription.status,
          trial_days_remaining: subscription.daysRemaining,
          upgrade_required: true
        }
      };
    }
    
    return null; // No error, continue
  };
}

/**
 * Middleware: Require module enabled
 */
export function requireModule(moduleId: string) {
  return async (shopId: string) => {
    const module = await checkModule(shopId, moduleId);
    
    if (!module.enabled) {
      return {
        statusCode: 403,
        body: {
          error: 'MODULE_NOT_ENABLED',
          message: `This feature requires the ${module.name} module.`,
          module_id: moduleId,
          module_name: module.name,
          upgrade_required: true
        }
      };
    }
    
    return null; // No error, continue
  };
}
