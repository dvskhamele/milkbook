const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * Get user's shop_id from JWT token
 */
async function getUserShopId(authHeader) {
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
 * Middleware: Check if subscription is active
 */
async function requireActiveSubscription(shop_id) {
  const { data, error } = await supabase
    .rpc('is_subscription_active', { p_shop_id: shop_id });
  
  if (error || !data) {
    return { active: false, error: 'No active subscription found' };
  }
  
  return { active: data, error: null };
}

/**
 * Middleware: Check if module is enabled
 */
async function requireModuleEnabled(shop_id, module_id) {
  const { data, error } = await supabase
    .rpc('is_module_enabled', { p_shop_id: shop_id, p_module_id: module_id });
  
  if (error || !data) {
    return { enabled: false, error: `Module ${module_id} not enabled` };
  }
  
  return { enabled: data, error: null };
}

/**
 * Get subscription details for shop
 */
async function getSubscriptionDetails(shop_id) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('shop_id', shop_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error) return null;
  
  // Check if expired
  const now = new Date();
  if (data.status === 'active') {
    if (data.paid_end && new Date(data.paid_end) < now) {
      await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('id', data.id);
      data.status = 'expired';
    } else if (data.trial_end && new Date(data.trial_end) < now && !data.paid_end) {
      await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('id', data.id);
      data.status = 'expired';
    }
  }
  
  return data;
}

/**
 * Get enabled modules for shop
 */
async function getEnabledModules(shop_id) {
  const { data, error } = await supabase
    .from('shop_modules')
    .select(`
      module_id,
      enabled,
      expires_at,
      modules (
        id,
        name,
        description,
        price
      )
    `)
    .eq('shop_id', shop_id)
    .eq('enabled', true);
  
  if (error) return [];
  
  return data.map(m => ({
    id: m.module_id,
    name: m.modules?.name,
    description: m.modules?.description,
    price: m.modules?.price,
    expires_at: m.expires_at
  }));
}

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  const { httpMethod, headers, path, body } = event;
  const authHeader = headers.authorization || headers.Authorization;
  const resourceId = path.split('/').pop();

  try {
    const shop_id = await getUserShopId(authHeader);
    
    if (!shop_id) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized', message: 'Invalid authentication token' }),
      };
    }

    // =====================
    // GET /subscription - Get subscription details
    // =====================
    if (httpMethod === 'GET' && resourceId === 'subscription') {
      const subscription = await getSubscriptionDetails(shop_id);
      const modules = await getEnabledModules(shop_id);
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription || { status: 'none' },
          modules: modules
        }),
      };
    }

    // =====================
    // GET /modules - Get available modules
    // =====================
    if (httpMethod === 'GET' && resourceId === 'modules') {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Get enabled modules for this shop
      const enabledModules = await getEnabledModules(shop_id);
      const enabledIds = enabledModules.map(m => m.id);
      
      const modulesWithStatus = data.map(m => ({
        ...m,
        enabled: enabledIds.includes(m.id)
      }));
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: modulesWithStatus }),
      };
    }

    // =====================
    // POST /upgrade - Upgrade to annual plan
    // =====================
    if (httpMethod === 'POST' && resourceId === 'upgrade') {
      const { amount } = JSON.parse(body);
      
      if (!amount || amount <= 0) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid amount' }),
        };
      }
      
      const { data, error } = await supabase
        .rpc('upgrade_to_annual', { 
          p_shop_id: shop_id, 
          p_amount: amount 
        });
      
      if (error) throw error;
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Upgraded to annual plan',
          subscription_id: data
        }),
      };
    }

    // =====================
    // POST /module/enable - Enable module for shop
    // =====================
    if (httpMethod === 'POST' && path.includes('/module/enable')) {
      const { module_id, expires_at } = JSON.parse(body);
      
      if (!module_id) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'module_id required' }),
        };
      }
      
      await supabase.rpc('enable_shop_module', { 
        p_shop_id: shop_id, 
        p_module_id: module_id,
        p_expires_at: expires_at || null
      });
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Module ${module_id} enabled` }),
      };
    }

    // =====================
    // POST /module/disable - Disable module for shop
    // =====================
    if (httpMethod === 'POST' && path.includes('/module/disable')) {
      const { module_id } = JSON.parse(body);
      
      if (!module_id) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'module_id required' }),
        };
      }
      
      await supabase.rpc('disable_shop_module', { 
        p_shop_id: shop_id, 
        p_module_id: module_id 
      });
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Module ${module_id} disabled` }),
      };
    }

    return {
      statusCode: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not found' }),
    };

  } catch (error) {
    console.error('Subscription API Error:', error);
    return {
      statusCode: error.status || 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
