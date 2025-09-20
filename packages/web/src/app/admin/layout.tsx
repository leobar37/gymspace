'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  CreditCard, 
  Users, 
  Settings,
  Shield,
  FileText,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Organizations',
    href: '/admin/organizations',
    icon: Building2,
  },
  {
    title: 'Subscription Plans',
    href: '/admin/plans',
    icon: CreditCard,
  },
  {
    title: 'Subscription Requests',
    href: '/admin/requests',
    icon: FileText,
  },
  {
    title: 'Cancellations',
    href: '/admin/cancellations',
    icon: XCircle,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  // TODO: Add proper authentication check
  // For now, we'll assume the user is authenticated and has admin rights
  // In production, this should check for SUPER_ADMIN permission
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">GymSpace Admin</span>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
            >
              Exit Admin
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="sticky top-16 h-[calc(100vh-4rem)] w-64 border-r bg-white">
          <div className="space-y-1 p-4">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1">
          <div className="container py-6 px-4 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}