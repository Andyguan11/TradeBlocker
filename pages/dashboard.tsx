import HeaderNav from '../components/HeaderNav';
import { DashboardComponent } from '../components/warning';
// Add any necessary CSS imports here, if they're not already in your global styles

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100"> {/* Add a background color */}
      <HeaderNav />
      <main className="container mx-auto py-6">
        <DashboardComponent />
      </main>
    </div>
  );
}
