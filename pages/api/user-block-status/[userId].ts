import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('block_state')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    res.status(200).json({ block_state: data.block_state });
  } catch (error) {
    console.error('Error fetching user block status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}