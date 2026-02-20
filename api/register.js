// Vercel Serverless Function - User Registration
// Credentials are HARDCODED here on backend (secure!)

const { createClient } = require('@supabase/supabase-js');

// HARDCODED SUPABASE CREDENTIALS (Backend - Secure!)
const SUPABASE_URL = 'https://uoeswfuiwjluqomgepar.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kTjJ_8DV78y3W63GFaZgSQ_G9PR4YyY';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_Ekk4DuTlTpfnFhbYKviq5A_xz7JPBZ1';

// Initialize Supabase with service role (full access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).send(null);
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, email, phone, password } = req.body;

    // Validate input
    if (!shop || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Shop name, email, and password are required'
      });
    }

    console.log('Registering user:', { shop, email, phone });

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        shop_name: shop,
        phone: phone
      }
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        return res.status(409).json({ 
          error: 'Email already registered',
          message: 'This email is already registered. Please login instead.'
        });
      }
      throw authError;
    }

    const userId = authData.user.id;
    console.log('User created in Auth:', userId);

    // Create shop record
    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .insert([{
        id: userId,
        name: shop,
        phone: phone
      }])
      .select()
      .single();

    if (shopError) {
      console.error('Failed to create shop:', shopError);
      // Rollback auth user
      await supabase.auth.admin.deleteUser(userId);
      throw shopError;
    }

    console.log('Shop created:', shopData.id);

    // Create user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        shop_id: userId,
        shop_name: shop,
        phone: phone,
        role: 'admin'
      }])
      .select()
      .single();

    if (userError) {
      console.error('Failed to create user profile:', userError);
      // Rollback
      await supabase.auth.admin.deleteUser(userId);
      await supabase.from('shops').delete().eq('id', userId);
      throw userError;
    }

    console.log('User profile created:', userData.id);

    // Auto-login the user
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (loginError) {
      throw loginError;
    }

    // Return success with session
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: userId,
        email: email,
        shop: shop,
        phone: phone
      },
      session: {
        access_token: loginData.session.access_token,
        refresh_token: loginData.session.refresh_token,
        expires_in: loginData.session.expires_in
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
};
