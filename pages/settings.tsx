import { NextPage } from 'next';
import Head from 'next/head';
import { useTheme } from 'next-themes';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/warnCard';
import { Button } from '@/components/ui/warnButton';
import HeaderNav from '@/components/HeaderNav';
import { GlassySidebar } from '@/components/Sidebar';

const SettingsPage: NextPage = () => {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <Head>
        <title>Settings - Your App Name</title>
        <meta name="description" content="Settings page" />
      </Head>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <GlassySidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <HeaderNav />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
            <div className="container mx-auto p-8">
              <h1 className="text-3xl font-bold mb-8">Settings</h1>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Theme</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      onClick={() => setTheme('light')}
                    >
                      Light
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => setTheme('dark')}
                    >
                      Dark
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>More Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-center py-8">Coming Soon</p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
