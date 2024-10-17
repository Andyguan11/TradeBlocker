import React from 'react';

interface Platform {
  id: string;
  name: string;
  // Add other properties as needed
}

interface InstalledAppsProps {
  platforms: Platform[];
}

const InstalledApps: React.FC<InstalledAppsProps> = ({ platforms }) => {
  return (
    <div className="installed-apps">
      {platforms.map((platform) => (
        <div key={platform.id} className="platform-item">
          {platform.name}
        </div>
      ))}
    </div>
  );
};

export default InstalledApps;
