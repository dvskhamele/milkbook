const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Check if Supabase is configured
  if (!supabase) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Server configuration error',
        message: 'Supabase credentials not configured'
      }),
    };
  }

  const { httpMethod, body, queryStringParameters, path } = event;
  const resourceId = path.split('/').pop();

  try {
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
