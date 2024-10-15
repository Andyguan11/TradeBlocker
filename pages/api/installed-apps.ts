import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

type InstalledApp = {
  name: string;
  id: string;
  // Add other properties as needed
}

type InstalledAppsResponse = {
  installedApps: InstalledApp[];
  platform?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InstalledAppsResponse>
) {
  try {
    const platform = process.platform;
    let apps: InstalledApp[] = [];

    switch (platform) {
      case 'win32':
        const { stdout: winApps } = await execAsync('powershell "Get-AppxPackage -AllUsers | Select-Object Name, PackageFullName | ConvertTo-Json"');
        apps = JSON.parse(winApps).map((app: { Name: any; PackageFullName: any; }) => ({ name: app.Name, identifier: app.PackageFullName }));
        break;
      case 'darwin':
        const { stdout: macApps } = await execAsync('system_profiler SPApplicationsDataType -json');
        const macAppData = JSON.parse(macApps).SPApplicationsDataType;
        apps = macAppData.map((app: { _name: any; bundle_id: any; }) => ({ name: app._name, identifier: app.bundle_id }));
        break;
      // Note: Android and iOS detection cannot be done server-side in this context
      default:
        throw new Error('Unsupported platform');
    }

    res.status(200).json({ installedApps: apps, platform });
  } catch (error) {
    console.error('Error fetching installed apps:', error);
    res.status(500).json({ installedApps: [], error: 'Failed to fetch installed apps' });
  }
}
