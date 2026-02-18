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
        return await getPayments(req, res, supabase);
      case 'POST':
        return await createPayment(req, res, supabase);
      case 'PUT':
        return await updatePayment(req, res, supabase);
      case 'DELETE':
        return await deletePayment(req, res, supabase);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Payments API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getPayments(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { dairy_center_id, farmer_id, type, start_date, end_date } = req.query;

  let query = supabase
    .from('payments')
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

  if (type) {
    query = query.eq('type', type);
  }

  if (start_date && end_date) {
    query = query.gte('date', start_date).lte('date', end_date);
  }

  query = query.order('date', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ payments: data || [] });
}

async function createPayment(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { 
    dairy_center_id, 
    farmer_id, 
    date, 
    type, 
    amount, 
    payment_mode, 
    reference_number, 
    notes 
  } = req.body;

  if (!dairy_center_id || !farmer_id || !date || !type || !amount) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['dairy_center_id', 'farmer_id', 'date', 'type', 'amount']
    });
  }

  const { data, error } = await supabase
    .from('payments')
    .insert([{
      dairy_center_id,
      farmer_id,
      date,
      type,
      amount,
      payment_mode: payment_mode || 'Cash',
      reference_number: reference_number || null,
      notes: notes || null,
      is_synced: true
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

  return res.status(201).json({ payment: data });
}

async function updatePayment(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { id } = req.query;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Payment ID is required' });
  }

  const { id: _, created_at, ...safeUpdates } = updates;

  const { data, error } = await supabase
    .from('payments')
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
    return res.status(404).json({ error: 'Payment not found' });
  }

  return res.status(200).json({ payment: data });
}

async function deletePayment(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Payment ID is required' });
  }

  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ message: 'Payment deleted successfully' });
}
