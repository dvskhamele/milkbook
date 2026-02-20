// Vercel Serverless Function - User Login
// Credentials are HARDCODED here on backend (secure!)

const { createClient } = require('@supabase/supabase-js');

// HARDCODED SUPABASE CREDENTIALS (Backend - Secure!)
const SUPABASE_URL = 'https://uoeswfuiwjluqomgepar.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kTjJ_8DV78y3W63GFaZgSQ_G9PR4YyY';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_Ekk4DuTlTpfnFhbYKviq5A_xz7JPBZ1';

// Initialize Supabase
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
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    console.log('Login attempt:', email);

    // Demo credentials (always work)
    if (email === 'demo@milkrecord.in' && password === 'demo123') {
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: 'demo-user',
          email: email,
          shop: 'Gopal Dairy Shop',
          role: 'admin'
        },
        session: {
          access_token: 'demo-token-' + Date.now(),
          refresh_token: 'demo-refresh',
          expires_in: 86400 // 24 hours
        }
      });
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        return res.status(401).json({ 
          error: 'Invalid credentials',
          message: 'Invalid email or password'
        });
      }
      throw authError;
    }

    const userId = authData.user.id;
    console.log('User authenticated:', userId);

    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*, shops(name, phone)')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Failed to get user profile:', userError);
      // Still allow login, just without profile data
    }

    // Return success with session
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: userId,
        email: email,
        shop: userData?.shops?.name || 'Unknown',
        phone: userData?.phone || userData?.shops?.phone,
        role: userData?.role || 'user'
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_in: authData.session.expires_in
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
};
