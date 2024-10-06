import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Mock data for installed apps
  const installedApps: never[] = [
    // { id: 1, name: 'App 1', description: 'Description 1' },
    // { id: 2, name: 'App 2', description: 'Description 2' },
    // { id: 3, name: 'App 3', description: 'Description 3' },
  ]

  res.status(200).json(installedApps)
}