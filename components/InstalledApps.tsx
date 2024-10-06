import React from 'react';

interface App {
  name: string;
  identifier: string;
}

interface InstalledAppsProps {
  platform: string;
  apps: App[] | undefined;
}

const InstalledApps: React.FC<InstalledAppsProps> = ({ platform, apps }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Installed Apps ({platform})</h2>
      {apps && apps.length > 0 ? (
        <ul className="space-y-2">
          {apps.map((app, index) => (
            <li key={index} className="flex justify-between">
              <span>{app.name}</span>
              <span className="text-gray-500 text-sm">{app.identifier}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No apps installed or data unavailable.</p>
      )}
    </div>
  );
};

export default InstalledApps;