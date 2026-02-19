const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (!supabase) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  const { httpMethod, body, queryStringParameters, path } = event;
  const resourceId = path.split('/').pop();

  try {
    // GET - Fetch milk entries
    if (httpMethod === 'GET') {
      let query = supabase
        .from('milk_entries')
        .select(`
          *,
          farmers (
            id,
            name,
            mobile
          )
        `);
      
      if (queryStringParameters?.dairy_center_id) {
        query = query.eq('dairy_center_id', queryStringParameters.dairy_center_id);
      }
      
      if (queryStringParameters?.farmer_id) {
        query = query.eq('farmer_id', queryStringParameters.farmer_id);
      }
      
      if (queryStringParameters?.date) {
        query = query.eq('day', queryStringParameters.date);
      }
      
      if (queryStringParameters?.start_date && queryStringParameters?.end_date) {
        query = query
          .gte('day', queryStringParameters.start_date)
          .lte('day', queryStringParameters.end_date);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: data || [] }),
      };
    }

    // POST - Create milk entry
    if (httpMethod === 'POST') {
      const entryData = JSON.parse(body);
      
      if (!entryData.farmer_id || !entryData.day || !entryData.qty || !entryData.amount) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'Validation error',
            message: 'farmer_id, day, qty, and amount are required'
          }),
        };
      }
      
      const { data, error } = await supabase
        .from('milk_entries')
        .insert([{
          dairy_center_id: entryData.dairy_center_id,
          farmer_id: entryData.farmer_id,
          day: entryData.day,
          session: entryData.session || 'Morning',
          animal: entryData.animal || 'cow',
          qty: entryData.qty,
          fat: entryData.fat || null,
          snf: entryData.snf || null,
          rate_per_l: entryData.rate_per_l || 0,
          amount: entryData.amount,
          collection_point_id: entryData.collection_point_id || null,
          collection_point_name: entryData.collection_point_name || null,
          slip_number: entryData.slip_number || null,
          images: entryData.images || [],
          edited: false,
        }])
        .select(`
          *,
          farmers (
            id,
            name,
            mobile
          )
        `)
        .single();
      
      if (error) throw error;
      
      return {
        statusCode: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: data }),
      };
    }

    // PUT - Update milk entry
    if (httpMethod === 'PUT') {
      if (!resourceId || resourceId === 'milk-entries') {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Entry ID is required' }),
        };
      }
      
      const updates = JSON.parse(body);
      const { id, ...safeUpdates } = updates;
      
      // Mark as edited
      safeUpdates.edited = true;
      safeUpdates.edited_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('milk_entries')
        .update(safeUpdates)
        .eq('id', resourceId)
        .select(`
          *,
          farmers (
            id,
            name,
            mobile
          )
        `)
        .single();
      
      if (error) throw error;
      if (!data) {
        return {
          statusCode: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Entry not found' }),
        };
      }
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: data }),
      };
    }

    // DELETE - Delete milk entry
    if (httpMethod === 'DELETE') {
      if (!resourceId || resourceId === 'milk-entries') {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Entry ID is required' }),
        };
      }
      
      const { error } = await supabase
        .from('milk_entries')
        .delete()
        .eq('id', resourceId);
      
      if (error) throw error;
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Entry deleted successfully' }),
      };
    }

    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Milk Entries API Error:', error);
    return {
      statusCode: error.status || 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
