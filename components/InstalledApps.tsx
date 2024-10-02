import { useState, useEffect } from 'react';

interface App {
  name: string;
  identifier: string;
}

export function InstalledApps() {
  const [apps, setApps] = useState<App[]>([]);
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    async function fetchInstalledApps() {
      try {
        const response = await fetch('/api/installed-apps');
        const data = await response.json();
        setApps(data.apps);
        setPlatform(data.platform);
      } catch (error) {
        console.error('Error fetching installed apps:', error);
      }
    }

    fetchInstalledApps();
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Installed Apps ({platform})</h2>
      <ul className="space-y-2">
        {apps.map((app, index) => (
          <li key={index} className="flex justify-between">
            <span>{app.name}</span>
            <span className="text-gray-500 text-sm">{app.identifier}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}