import { VercelRequest, VercelResponse } from '@vercel/node';
import { createAdminClient, corsHeaders } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const supabase = createAdminClient();

  try {
    switch (req.method) {
      case 'GET':
        return await getFarmers(req, res, supabase);
      case 'POST':
        return await createFarmer(req, res, supabase);
      case 'PUT':
        return await updateFarmer(req, res, supabase);
      case 'DELETE':
        return await deleteFarmer(req, res, supabase);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Farmers API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getFarmers(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { dairy_center_id, active } = req.query;

  let query = supabase.from('farmers').select('*');

  if (dairy_center_id) {
    query = query.eq('dairy_center_id', dairy_center_id);
  }

  if (active !== undefined) {
    query = query.eq('is_active', active === 'true');
  }

  query = query.order('name', { ascending: true });

  const { data, error } = await query;

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ farmers: data || [] });
}

async function createFarmer(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { dairy_center_id, name, mobile, address, advance_amount, animal_type } = req.body;

  if (!dairy_center_id || !name || !mobile) {
    return res.status(400).json({ error: 'Missing required fields: dairy_center_id, name, mobile' });
  }

  const { data, error } = await supabase
    .from('farmers')
    .insert([{
      dairy_center_id,
      name,
      mobile,
      address: address || null,
      advance_amount: advance_amount || 0,
      animal_type: animal_type || 'Cow',
      is_active: true
    }])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json({ farmer: data });
}

async function updateFarmer(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { id } = req.query;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Farmer ID is required' });
  }

  // Remove immutable fields
  const { id: _, ...safeUpdates } = updates;

  const { data, error } = await supabase
    .from('farmers')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: 'Farmer not found' });
  }

  return res.status(200).json({ farmer: data });
}

async function deleteFarmer(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Farmer ID is required' });
  }

  const { error } = await supabase
    .from('farmers')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ message: 'Farmer deleted successfully' });
}
