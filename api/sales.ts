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
        return await getSales(req, res, supabase);
      case 'POST':
        return await createSale(req, res, supabase);
      case 'PUT':
        return await updateSale(req, res, supabase);
      case 'DELETE':
        return await deleteSale(req, res, supabase);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Sales API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getSales(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { dairy_center_id, start_date, end_date, payment_status } = req.query;

  let query = supabase.from('sales').select('*');

  if (dairy_center_id) {
    query = query.eq('dairy_center_id', dairy_center_id);
  }

  if (start_date && end_date) {
    query = query.gte('date', start_date).lte('date', end_date);
  }

  if (payment_status) {
    query = query.eq('payment_status', payment_status);
  }

  query = query.order('date', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ sales: data || [] });
}

async function createSale(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { 
    dairy_center_id, 
    customer_name, 
    customer_mobile, 
    date, 
    items, 
    total_amount, 
    payment_status 
  } = req.body;

  if (!dairy_center_id || !date || !items || !total_amount) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['dairy_center_id', 'date', 'items', 'total_amount']
    });
  }

  const { data, error } = await supabase
    .from('sales')
    .insert([{
      dairy_center_id,
      customer_name: customer_name || null,
      customer_mobile: customer_mobile || null,
      date,
      items,
      total_amount,
      payment_status: payment_status || 'paid',
      is_synced: true
    }])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json({ sale: data });
}

async function updateSale(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { id } = req.query;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Sale ID is required' });
  }

  const { id: _, created_at, ...safeUpdates } = updates;

  const { data, error } = await supabase
    .from('sales')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: 'Sale not found' });
  }

  return res.status(200).json({ sale: data });
}

async function deleteSale(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Sale ID is required' });
  }

  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ message: 'Sale deleted successfully' });
}
