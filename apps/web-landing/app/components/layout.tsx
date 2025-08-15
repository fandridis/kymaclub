import { Outlet } from 'react-router';
import { Navigation } from './elements/navbar';
import { Footer } from './elements/footer';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation positioned absolutely to overlap content */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      
      {/* Main content with top padding to account for fixed navigation */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
} 