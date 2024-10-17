import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface WindowsApp {
  Name: string;
  PackageFullName: string;
}

interface MacApp {
  _name: string;
  bundle_id: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const platform = process.platform;
    let apps: { name: string; identifier: string }[] = [];

    switch (platform) {
      case 'win32':
        const { stdout: winApps } = await execAsync('powershell "Get-AppxPackage -AllUsers | Select-Object Name, PackageFullName | ConvertTo-Json"');
        apps = JSON.parse(winApps).map((app: WindowsApp) => ({ name: app.Name, identifier: app.PackageFullName }));
        break;
      case 'darwin':
        const { stdout: macApps } = await execAsync('system_profiler SPApplicationsDataType -json');
        const macAppData = JSON.parse(macApps).SPApplicationsDataType as MacApp[];
        apps = macAppData.map((app: MacApp) => ({ name: app._name, identifier: app.bundle_id }));
        break;
      // Note: Android and iOS detection cannot be done server-side in this context
      default:
        throw new Error('Unsupported platform');
    }

    res.status(200).json({ platform, apps });
  } catch (error) {
    console.error('Error fetching installed apps:', error);
    res.status(500).json({ error: 'Failed to fetch installed apps' });
  }
}
