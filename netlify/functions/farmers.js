const { createClient } = require('@supabase/supabase-js');
const { requireAccess } = require('./lib/access-guard');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
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

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  const { httpMethod, body, queryStringParameters, path } = event;
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const resourceId = path.split('/').pop();

  try {
    // Get user's shop_id
    const shop_id = await getUserShopId(authHeader);
    
    if (!shop_id) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'UNAUTHORIZED',
          message: 'Invalid or missing authentication token'
        }),
      };
    }

    // Check subscription and module access for write operations
    if (['POST', 'PUT', 'DELETE'].includes(httpMethod)) {
      const accessError = await requireAccess('farmer_collection')(shop_id);
      if (accessError) {
        return accessError;
      }
    }
    // GET - Fetch farmers
    if (httpMethod === 'GET') {
      let query = supabase.from('farmers').select('*');
      
      // Filter by dairy_center_id if provided
      if (queryStringParameters?.dairy_center_id) {
        query = query.eq('dairy_center_id', queryStringParameters.dairy_center_id);
      }
      
      // Filter by active status
      if (queryStringParameters?.active !== undefined) {
        query = query.eq('active', queryStringParameters.active === 'true');
      }
      
      // Order by name
      query = query.order('name', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmers: data || [] }),
      };
    }

    // POST - Create farmer
    if (httpMethod === 'POST') {
      const farmerData = JSON.parse(body);
      
      // Validate required fields
      if (!farmerData.name || !farmerData.mobile) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'Validation error',
            message: 'Name and mobile are required'
          }),
        };
      }
      
      const { data, error } = await supabase
        .from('farmers')
        .insert([{
          dairy_center_id: farmerData.dairy_center_id,
          name: farmerData.name,
          mobile: farmerData.mobile,
          address: farmerData.address || null,
          advance: farmerData.advance || 0,
          balance: farmerData.balance || 0,
          animal_type: farmerData.animal_type || 'cow',
          active: farmerData.active !== false,
          image_data: farmerData.image_data || null,
          gst_no: farmerData.gst_no || null,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        statusCode: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer: data }),
      };
    }

    // PUT - Update farmer
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
      
      const { data, error } = await supabase
        .from('farmers')
        .update(safeUpdates)
        .eq('id', resourceId)
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
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer: data }),
      };
    }

    // DELETE - Delete farmer
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
      
      const { error } = await supabase
        .from('farmers')
        .delete()
        .eq('id', resourceId);
      
      if (error) throw error;
      
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
