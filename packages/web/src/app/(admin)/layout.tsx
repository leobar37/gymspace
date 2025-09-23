import { AdminNavigation } from '@/components/navigation/AdminNavigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="flex h-16 items-center border-b px-4">
            <h2 className="text-lg font-semibold">GymSpace Admin</h2>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <AdminNavigation />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}