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

exports.handler = async (event, context) => {
  // Handle CORS preflight
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
    const { shop_id, user_id, pin } = JSON.parse(event.body);

    // Validate input
    if (!shop_id || !user_id || !pin) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Validation error',
          message: 'shop_id, user_id, and pin are required'
        }),
      };
    }

    // Verify PIN length
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Validation error',
          message: 'PIN must be 6 digits'
        }),
      };
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, shop_id, role, pin_hash')
      .eq('id', user_id)
      .eq('shop_id', shop_id)
      .single();

    if (userError || !user) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Authentication failed',
          message: 'Invalid Shop ID or User ID'
        }),
      };
    }

    // Verify PIN (in production, use proper hash comparison)
    // For now, we'll store PIN as simple hash (PIN * 12345)
    const expectedPinHash = parseInt(pin) * 12345;
    
    if (user.pin_hash !== expectedPinHash) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Authentication failed',
          message: 'Invalid PIN'
        }),
      };
    }

    // Generate a simple token (in production, use JWT)
    const token = `token_${user_id}_${Date.now()}`;

    // Log login event
    await supabase
      .from('audit_events')
      .insert([{
        shop_id,
        user_id: user.id,
        action: 'login',
        entity: 'user',
        entity_id: user.id,
        before: null,
        after: { method: 'pin', timestamp: new Date().toISOString() }
      }]);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        user: {
          id: user.id,
          shop_id: user.shop_id,
          role: user.role
        }
      }),
    };

  } catch (error) {
    console.error('PIN Verification Error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Server error',
        message: error.message || 'Unknown error occurred'
      }),
    };
  }
};
