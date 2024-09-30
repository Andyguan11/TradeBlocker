import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import HeaderNav from '../components/HeaderNav';
import { DashboardComponent } from '../components/warning';
import { GlassySidebar } from '../components/Sidebar';
import { ConnectedWallets } from '../components/IntergrationsContainer';
import { supabase } from '../utils/supabaseClient';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex">
      <GlassySidebar />
      <div className="flex-1 flex flex-col">
        <HeaderNav />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <DashboardComponent />
          </div>
          <div className="flex">
            <div className="w-1/2 pr-3">
              <ConnectedWallets />
            </div>
            <div className="w-1/2 pl-3">
              {/* Placeholder for future content */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
