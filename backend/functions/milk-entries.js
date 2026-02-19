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
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  const { httpMethod, body, headers, path, queryStringParameters } = event;
  const resourceId = path.split('/').pop();
  const authHeader = headers.authorization || headers.Authorization;

  try {
    const shop_id = await getUserShopId(authHeader);
    
    if (!shop_id) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized', message: 'Invalid authentication token' }),
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    const user_id = user?.id;

    // =====================
    // GET - Fetch milk entries
    // =====================
    if (httpMethod === 'GET') {
      let query = supabase
        .from('milk_intake_entries')
        .select(`
          *,
          farmers (
            id,
            name,
            phone
          )
        `)
        .eq('shop_id', shop_id);
      
      // Apply filters
      if (queryStringParameters?.farmer_id) {
        query = query.eq('farmer_id', queryStringParameters.farmer_id);
      }
      
      if (queryStringParameters?.date) {
        query = query.eq('date', queryStringParameters.date);
      }
      
      if (queryStringParameters?.start_date && queryStringParameters?.end_date) {
        query = query
          .gte('date', queryStringParameters.start_date)
          .lte('date', queryStringParameters.end_date);
      }
      
      query = query.order('date', { ascending: false })
                   .order('created_at', { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: data || [] }),
      };
    }

    // =====================
    // POST - Create milk entry
    // =====================
    if (httpMethod === 'POST') {
      const entryData = JSON.parse(body);
      
      // Validate required fields
      if (!entryData.farmer_id || !entryData.date || !entryData.quantity || !entryData.amount) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'Validation error',
            message: 'farmer_id, date, quantity, and amount are required'
          }),
        };
      }
      
      const newEntry = {
        shop_id,
        farmer_id: entryData.farmer_id,
        date: entryData.date,
        shift: entryData.shift || 'Morning',
        animal: entryData.animal || 'cow',
        quantity: entryData.quantity,
        fat: entryData.fat || null,
        snf: entryData.snf || null,
        rate_per_l: entryData.rate_per_l || 0,
        amount: entryData.amount,
        reading_mode: entryData.reading_mode || 'manual',
        collection_point_id: entryData.collection_point_id || null,
        collection_point_name: entryData.collection_point_name || null,
        slip_number: entryData.slip_number || null,
        images: entryData.images || [],
        external_ref_id: entryData.external_ref_id || null,
        external_source: entryData.external_source || null,
        external_meta: entryData.external_meta || null,
      };
      
      const { data, error } = await supabase
        .from('milk_intake_entries')
        .insert([newEntry])
        .select(`
          *,
          farmers (
            id,
            name,
            phone
          )
        `)
        .single();
      
      if (error) throw error;
      
      // Update farmer balance
      if (entryData.update_balance !== false) {
        await supabase.rpc('update_farmer_balance', {
          p_farmer_id: entryData.farmer_id,
          p_amount: entryData.amount
        });
      }
      
      // Create audit event
      await createAuditEvent(
        shop_id,
        user_id,
        'create',
        'milk_entry',
        data.id,
        null,
        data
      );
      
      return {
        statusCode: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: data }),
      };
    }

    // =====================
    // PUT - Update milk entry
    // =====================
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
      safeUpdates.updated_at = new Date().toISOString();
      
      // Get current entry for audit
      const { data: currentEntry } = await supabase
        .from('milk_intake_entries')
        .select('*')
        .eq('id', resourceId)
        .single();
      
      const { data, error } = await supabase
        .from('milk_intake_entries')
        .update(safeUpdates)
        .eq('id', resourceId)
        .eq('shop_id', shop_id)
        .select(`
          *,
          farmers (
            id,
            name,
            phone
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
      
      // Create audit event
      await createAuditEvent(
        shop_id,
        user_id,
        'update',
        'milk_entry',
        data.id,
        currentEntry,
        data
      );
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: data }),
      };
    }

    // =====================
    // DELETE - Delete milk entry
    // =====================
    if (httpMethod === 'DELETE') {
      if (!resourceId || resourceId === 'milk-entries') {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Entry ID is required' }),
        };
      }
      
      // Get entry data for audit
      const { data: deletedEntry } = await supabase
        .from('milk_intake_entries')
        .select('*')
        .eq('id', resourceId)
        .eq('shop_id', shop_id)
        .single();
      
      const { error } = await supabase
        .from('milk_intake_entries')
        .delete()
        .eq('id', resourceId)
        .eq('shop_id', shop_id);
      
      if (error) throw error;
      
      // Create audit event
      if (deletedEntry) {
        await createAuditEvent(
          shop_id,
          user_id,
          'delete',
          'milk_entry',
          resourceId,
          deletedEntry,
          null
        );
      }
      
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
