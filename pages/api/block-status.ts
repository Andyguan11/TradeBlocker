import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { userId } = req.query;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('block_state')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      res.status(200).json({ isBlocked: data.block_state === 'active' });
    } catch (error) {
      console.error('Error fetching block status:', error);
      res.status(500).json({ message: 'Failed to fetch block status' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}