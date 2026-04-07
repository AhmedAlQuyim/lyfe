import { Topbar } from '@/components/layout/Topbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { AppProvider } from '@/lib/app-store';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="flex flex-col min-h-screen bg-bg dark:bg-bg-dark">
        <Topbar />

        {/* Main content — padded for bottom nav on mobile */}
        <main className="flex-1 w-full max-w-screen-lg mx-auto px-4 py-4 pb-[88px] lg:pb-4 lg:px-8">
          {children}
        </main>

        <BottomNav />
      </div>
    </AppProvider>
  );
}
