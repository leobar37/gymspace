'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/',
  },
  {
    title: 'Organizations',
    href: '/organizations',
  },
  {
    title: 'Subscription Plans',
    href: '/subscription-plans',
  },
  {
    title: 'Organization Subscriptions',
    href: '/organization-subscriptions',
  },
];

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}