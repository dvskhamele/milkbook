// Vercel Serverless Function - Customers
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
    const defaultShopId = '00000000-0000-0000-0000-000000000001';
    
    // GET - Get all customers
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('customers').select('*').order('name');
      
      if (error) throw error;
      
      return res.status(200).json({ success: true, customers: data || [] });
    }

    // POST - Create customer
    if (req.method === 'POST') {
      const { name, phone, email, balance } = req.body;
      
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          shop_id: defaultShopId,
          name, phone, email, balance: balance || 0
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('✅ Customer created:', data.id);
      return res.status(201).json({ success: true, customer: data });
    }

    // PUT - Update customer balance
    if (req.method === 'PUT') {
      const { id, balance } = req.body;
      
      const { data, error } = await supabase
        .from('customers')
        .update({ balance })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('✅ Customer updated:', data.id);
      return res.status(200).json({ success: true, customer: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Customers API error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};
