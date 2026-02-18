import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key for admin access
export function createAdminClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Create Supabase client with user token
export function createUserClient(token?: string): SupabaseClient {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return createClient(supabaseUrl, supabaseUrl, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: { headers }
  });
}

// Helper function to get dairy center ID from user
export async function getUserDairyCenterId(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('dairy_center_id')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.dairy_center_id;
}

// CORS headers helper
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}
