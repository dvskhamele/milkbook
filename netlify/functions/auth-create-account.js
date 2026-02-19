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
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * POST /auth/create-account
 * Create new dairy shop account with user
 */
exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { shop_name, owner_name, mobile, password, pin, location } = JSON.parse(event.body);

    // Validate input
    if (!shop_name || !owner_name || !mobile) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Validation error',
          message: 'Shop name, owner name, and mobile are required'
        }),
      };
    }

    // Either password or PIN must be provided
    if (!password && !pin) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Validation error',
          message: 'Either password or PIN must be provided'
        }),
      };
    }

    // Validate PIN format if provided
    if (pin && !/^\d{6}$/.test(pin)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Validation error',
          message: 'PIN must be 6 digits'
        }),
      };
    }

    // Call database function to create account
    const { data, error } = await supabase
      .rpc('create_dairy_account', {
        p_shop_name: shop_name,
        p_owner_name: owner_name,
        p_mobile: mobile,
        p_password: password || null,
        p_pin: pin || null,
        p_location: location || null
      });

    if (error) throw error;

    const account = data[0];

    // Generate JWT token for immediate login
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: `${mobile}@milkbook.local`, // Temporary email format
      password: password || 'pin-login'
    });

    return {
      statusCode: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Account created successfully',
        shop_id: account.shop_id,
        user_id: account.user_id,
        subscription_id: account.subscription_id,
        trial_end: account.trial_end,
        trial_days_remaining: Math.floor((new Date(account.trial_end) - new Date()) / (1000 * 60 * 60 * 24)),
        token: session?.access_token || null
      }),
    };

  } catch (error) {
    console.error('Create Account Error:', error);
    return {
      statusCode: error.status || 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message || 'Failed to create account'
      }),
    };
  }
};
