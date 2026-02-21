// Vercel Serverless Function - Audit Logs
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uoeswfuiwjluqomgepar.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_Ekk4DuTlTpfnFhbYKviq5A_xz7JPBZ1';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).send(null);
  }

  try {
    const defaultShopId = '00000000-0000-0000-0000-000000000001';
    
    // GET - Get audit logs
    if (req.method === 'GET') {
      const { table, record_id, limit = 100 } = req.query;
      
      let query = supabase.from('audit_logs').select('*');
      
      if (table) query = query.eq('table_name', table);
      if (record_id) query = query.eq('record_id', record_id);
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));
      
      if (error) throw error;
      
      return res.status(200).json({ success: true, logs: data || [] });
    }

    // POST - Create audit log
    if (req.method === 'POST') {
      const { user_id, user_email, action, table_name, record_id, old_data, new_data, notes } = req.body;
      
      const { data, error } = await supabase
        .from('audit_logs')
        .insert([{
          shop_id: defaultShopId,
          user_id: user_id || 'anonymous',
          user_email: user_email || 'anonymous',
          action: action || 'unknown',
          table_name: table_name || 'unknown',
          record_id: record_id,
          old_data: old_data || null,
          new_data: new_data || null,
          notes: notes || null
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Audit log created:', data.id);
      return res.status(201).json({ success: true, log: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Audit API error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};
