import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabaseClient';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setUser(session.user);
      } else {
        router.push('/');
      }
      setLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/');
      }
    });

    checkUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}!</p>
      {/* Add more dashboard content here */}
    </div>
  );
}
