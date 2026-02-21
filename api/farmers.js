// Vercel Serverless Function - Get/Create Farmers
const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS (Backend - Secure!)
const SUPABASE_URL = 'https://uoeswfuiwjluqomgepar.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_Ekk4DuTlTpfnFhbYKviq5A_xz7JPBZ1';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

module.exports = async (req, res) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).send(null);
  }

  try {
    // GET - Get all farmers
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('farmers').select('*').order('name');
      
      if (error) throw error;
      
      return res.status(200).json({ success: true, farmers: data || [] });
    }

    // POST - Create farmer
    if (req.method === 'POST') {
      const { name, phone, address, balance, animal_type } = req.body;
      
      // Default shop ID
      const defaultShopId = '00000000-0000-0000-0000-000000000001';

      const { data, error } = await supabase
        .from('farmers')
        .insert([{ 
          shop_id: defaultShopId,
          name, 
          phone, 
          address, 
          balance: balance || 0, 
          animal_type: animal_type || 'cow' 
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('✅ Farmer created:', data.id);
      return res.status(201).json({ success: true, farmer: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Farmers API error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};
