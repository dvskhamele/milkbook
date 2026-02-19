const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  throw new Error('Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// CORS headers
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
  
  // Get user's shop_id from profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('shop_id')
    .eq('id', user.id)
    .single();
  
  return userProfile?.shop_id || null;
}

/**
 * Create audit event
 */
async function createAuditEvent(shop_id, user_id, action, entity, entity_id, before, after) {
  try {
    await supabase.rpc('create_audit_event', {
      p_shop_id: shop_id,
      p_user_id: user_id,
      p_action: action,
      p_entity: entity,
      p_entity_id: entity_id,
      p_before: before,
      p_after: after
    });
  } catch (error) {
    console.error('Audit event creation failed:', error);
  }
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  const { httpMethod, body, headers, path } = event;
  const resourceId = path.split('/').pop();
  const authHeader = headers.authorization || headers.Authorization;

  try {
    // Get user's shop_id
    const shop_id = await getUserShopId(authHeader);
    
    if (!shop_id) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Invalid or missing authentication token'
        }),
      };
    }

    // Get user_id from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    const user_id = user?.id;

    // =====================
    // GET - Fetch farmers
    // =====================
    if (httpMethod === 'GET') {
      let query = supabase
        .from('farmers')
        .select('*')
        .eq('shop_id', shop_id)
        .order('name', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmers: data || [] }),
      };
    }

    // =====================
    // POST - Create farmer
    // =====================
    if (httpMethod === 'POST') {
      const farmerData = JSON.parse(body);
      
      // Validate required fields
      if (!farmerData.name || !farmerData.phone) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'Validation error',
            message: 'Name and phone are required'
          }),
        };
      }
      
      const newFarmer = {
        shop_id,
        name: farmerData.name,
        phone: farmerData.phone,
        balance: farmerData.balance || 0,
        external_ref_id: farmerData.external_ref_id || null,
        external_source: farmerData.external_source || null,
        external_meta: farmerData.external_meta || null,
      };
      
      const { data, error } = await supabase
        .from('farmers')
        .insert([newFarmer])
        .select()
        .single();
      
      if (error) throw error;
      
      // Create audit event
      await createAuditEvent(
        shop_id,
        user_id,
        'create',
        'farmer',
        data.id,
        null,
        data
      );
      
      return {
        statusCode: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer: data }),
      };
    }

    // =====================
    // PUT - Update farmer
    // =====================
    if (httpMethod === 'PUT') {
      if (!resourceId || resourceId === 'farmers') {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'Validation error',
            message: 'Farmer ID is required'
          }),
        };
      }
      
      const updates = JSON.parse(body);
      const { id, ...safeUpdates } = updates;
      
      // Get current farmer data for audit
      const { data: currentFarmer } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', resourceId)
        .single();
      
      const { data, error } = await supabase
        .from('farmers')
        .update({
          ...safeUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', resourceId)
        .eq('shop_id', shop_id) // Ensure shop ownership
        .select()
        .single();
      
      if (error) throw error;
      
      if (!data) {
        return {
          statusCode: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'Not found',
            message: 'Farmer not found'
          }),
        };
      }
      
      // Create audit event
      await createAuditEvent(
        shop_id,
        user_id,
        'update',
        'farmer',
        data.id,
        currentFarmer,
        data
      );
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer: data }),
      };
    }

    // =====================
    // DELETE - Delete farmer
    // =====================
    if (httpMethod === 'DELETE') {
      if (!resourceId || resourceId === 'farmers') {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'Validation error',
            message: 'Farmer ID is required'
          }),
        };
      }
      
      // Get farmer data for audit
      const { data: deletedFarmer } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', resourceId)
        .eq('shop_id', shop_id)
        .single();
      
      const { error } = await supabase
        .from('farmers')
        .delete()
        .eq('id', resourceId)
        .eq('shop_id', shop_id);
      
      if (error) throw error;
      
      // Create audit event
      if (deletedFarmer) {
        await createAuditEvent(
          shop_id,
          user_id,
          'delete',
          'farmer',
          resourceId,
          deletedFarmer,
          null
        );
      }
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Farmer deleted successfully' }),
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Method not allowed',
        message: `Method ${httpMethod} not supported`
      }),
    };

  } catch (error) {
    console.error('Farmers API Error:', error);
    return {
      statusCode: error.status || 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Server error',
        message: error.message || 'Unknown error occurred'
      }),
    };
  }
};
