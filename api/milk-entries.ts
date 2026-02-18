import { VercelRequest, VercelResponse } from '@vercel/node';
import { createAdminClient } from '../lib/supabase';

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
        return await getMilkEntries(req, res, supabase);
      case 'POST':
        return await createMilkEntry(req, res, supabase);
      case 'PUT':
        return await updateMilkEntry(req, res, supabase);
      case 'DELETE':
        return await deleteMilkEntry(req, res, supabase);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Milk Entries API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getMilkEntries(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { dairy_center_id, farmer_id, date, shift, start_date, end_date } = req.query;

  let query = supabase
    .from('milk_entries')
    .select(`
      *,
      farmers (
        id,
        name,
        mobile
      )
    `);

  if (dairy_center_id) {
    query = query.eq('dairy_center_id', dairy_center_id);
  }

  if (farmer_id) {
    query = query.eq('farmer_id', farmer_id);
  }

  if (date) {
    query = query.eq('date', date);
  }

  if (shift) {
    query = query.eq('shift', shift);
  }

  if (start_date && end_date) {
    query = query.gte('date', start_date).lte('date', end_date);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ entries: data || [] });
}

async function createMilkEntry(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { 
    dairy_center_id, 
    farmer_id, 
    date, 
    shift, 
    milk_type, 
    quantity, 
    fat, 
    snf, 
    lactometer,
    rate, 
    amount 
  } = req.body;

  if (!dairy_center_id || !farmer_id || !date || !shift || !milk_type || !quantity || !rate || !amount) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['dairy_center_id', 'farmer_id', 'date', 'shift', 'milk_type', 'quantity', 'rate', 'amount']
    });
  }

  const { data, error } = await supabase
    .from('milk_entries')
    .insert([{
      dairy_center_id,
      farmer_id,
      date,
      shift,
      milk_type,
      quantity,
      fat: fat || null,
      snf: snf || null,
      lactometer: lactometer || null,
      rate,
      amount,
      is_synced: true,
      sync_status: 'synced'
    }])
    .select(`
      *,
      farmers (
        id,
        name,
        mobile
      )
    `)
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json({ entry: data });
}

async function updateMilkEntry(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { id } = req.query;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Entry ID is required' });
  }

  // Remove immutable fields
  const { id: _, created_at, ...safeUpdates } = updates;

  const { data, error } = await supabase
    .from('milk_entries')
    .update(safeUpdates)
    .eq('id', id)
    .select(`
      *,
      farmers (
        id,
        name,
        mobile
      )
    `)
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  return res.status(200).json({ entry: data });
}

async function deleteMilkEntry(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Entry ID is required' });
  }

  const { error } = await supabase
    .from('milk_entries')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ message: 'Entry deleted successfully' });
}
