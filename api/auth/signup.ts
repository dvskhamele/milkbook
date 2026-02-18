import { VercelRequest, VercelResponse } from '@vercel/node';
import { createAdminClient } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const supabase = createAdminClient();
  const { email, password, name, mobile, dairy_center_id } = req.body;

  try {
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        mobile,
        dairy_center_id,
        role: 'owner'
      }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create dairy center if provided
    let dairyCenterId = dairy_center_id;
    if (!dairyCenterId && name) {
      const { data: dairyData, error: dairyError } = await supabase
        .from('dairy_centers')
        .insert([{
          name: `${name}'s Dairy`,
          owner_name: name,
          mobile: mobile || '',
          rate_type: 'Fat_SNF',
          language: 'EN'
        }])
        .select()
        .single();

      if (dairyError) {
        console.error('Error creating dairy center:', dairyError);
      } else {
        dairyCenterId = dairyData.id;
        
        // Update user with dairy center ID
        await supabase
          .from('users')
          .update({ dairy_center_id: dairyCenterId })
          .eq('id', authData.user.id);
      }
    }

    return res.status(201).json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        mobile,
        dairy_center_id: dairyCenterId
      },
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
