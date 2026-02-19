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
 * POST /auth/login
 * Login with password or PIN
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
    const { identifier, password, pin } = JSON.parse(event.body);

    // Validate input
    if (!identifier) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Validation error',
          message: 'Mobile number or user ID is required'
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

    // Call database function to login
    const { data, error } = await supabase
      .rpc('login_user', {
        p_identifier: identifier,
        p_password: password || null,
        p_pin: pin || null
      });

    if (error) {
      // Handle specific error messages
      if (error.message.includes('not found') || error.message.includes('inactive')) {
        return {
          statusCode: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'User not found',
            message: 'User not found or account is inactive'
          }),
        };
      }
      
      if (error.message.includes('password') || error.message.includes('PIN')) {
        return {
          statusCode: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'Invalid credentials',
            message: error.message
          }),
        };
      }

      throw error;
    }

    const user = data[0];

    // Generate JWT token via Supabase Auth
    // For now, we'll create a simple token (in production use proper JWT)
    const token = `milkbook_${user.user_id}_${Date.now()}`;

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Login successful',
        user: {
          id: user.user_id,
          shop_id: user.shop_id,
          role: user.role
        },
        subscription: {
          status: user.subscription_status,
          trial_days_remaining: user.trial_days_remaining
        },
        modules: user.enabled_modules,
        token: token
      }),
    };

  } catch (error) {
    console.error('Login Error:', error);
    return {
      statusCode: error.status || 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message || 'Login failed'
      }),
    };
  }
};
