// Vercel Serverless Function - Milk Entries
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
    // GET - Get milk entries
    if (req.method === 'GET') {
      const { date, farmer_id } = req.query;
      
      let query = supabase.from('milk_intake_entries').select('*, farmers(name, phone)');
      
      if (date) query = query.eq('date', date);
      if (farmer_id) query = query.eq('farmer_id', farmer_id);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return res.status(200).json({ success: true, entries: data || [] });
    }

    // POST - Create milk entry
    if (req.method === 'POST') {
      const { farmer_id, date, shift, animal, quantity, fat, snf, rate_per_l, amount } = req.body;
      
      const { data, error } = await supabase
        .from('milk_intake_entries')
        .insert([{
          farmer_id,
          date,
          shift,
          animal,
          quantity,
          fat,
          snf,
          rate_per_l,
          amount
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update farmer balance
      if (amount) {
        await supabase.rpc('update_farmer_balance', { 
          p_farmer_id: farmer_id, 
          p_amount: amount 
        });
      }
      
      return res.status(201).json({ success: true, entry: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Milk Entries API error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};
