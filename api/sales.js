// Vercel Serverless Function - Retail Sales
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
    // GET - Get sales
    if (req.method === 'GET') {
      const { date } = req.query;
      
      let query = supabase.from('retail_sales').select('*');
      
      if (date) query = query.eq('date', date);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return res.status(200).json({ success: true, sales: data || [] });
    }

    // POST - Create sale
    if (req.method === 'POST') {
      const { customer_name, items, total_amount, payment_mode } = req.body;
      
      const { data, error } = await supabase
        .from('retail_sales')
        .insert([{
          customer_name,
          items,
          total_amount,
          payment_mode: payment_mode || 'cash'
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return res.status(201).json({ success: true, sale: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Sales API error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};
