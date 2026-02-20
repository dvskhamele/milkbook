// Vercel Serverless Function - Institutional Records (Farmer Source, Quality, Settlement, Deductions, Equipment)
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uoeswfuiwjluqomgepar.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_Ekk4DuTlTpfnFhbYKviq5A_xz7JPBZ1';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).send(null);
  }

  try {
    const { table, action, data } = req.body;

    // Validate table name
    const validTables = ['farmer_sources', 'quality_tests', 'payment_settlements', 'deductions_loans', 'equipment_logs', 'diary_entries'];
    if (!validTables.includes(table)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    // GET - Fetch records
    if (req.method === 'GET') {
      const { shop_id, filters } = req.query;
      
      let query = supabase.from(table).select('*');
      
      if (shop_id) query = query.eq('shop_id', shop_id);
      if (filters) {
        const parsedFilters = JSON.parse(filters);
        Object.keys(parsedFilters).forEach(key => {
          query = query.eq(key, parsedFilters[key]);
        });
      }
      
      const { data: records, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return res.status(200).json({ success: true, records: records || [] });
    }

    // POST - Create record
    if (req.method === 'POST') {
      const { data: recordData } = req.body;
      
      const { data, error } = await supabase
        .from(table)
        .insert([recordData])
        .select()
        .single();
      
      if (error) throw error;
      
      return res.status(201).json({ success: true, record: data });
    }

    // PUT - Update record
    if (req.method === 'PUT') {
      const { id, data: updateData } = req.body;
      
      const { data, error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return res.status(200).json({ success: true, record: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Institutional Records API error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};
