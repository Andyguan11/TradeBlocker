import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, blockState } = req.body;
    
    // Here you would typically update any necessary backend services
    // For now, we'll just log the information and return a success response
    console.log(`Updating blocking rules for user ${userId}. New block state: ${blockState}`);
    
    res.status(200).json({ message: 'Blocking rules updated successfully' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}