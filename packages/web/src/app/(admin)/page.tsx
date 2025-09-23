import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRightIcon, BuildingIcon, CreditCardIcon, PackageIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Dashboard | GymSpace',
  description: 'Manage your GymSpace platform administration',
};

export default function AdminDashboardPage() {
  const adminSections = [
    {
      title: 'Organizations',
      description: 'Manage organizations and their settings',
      href: '/organizations',
      icon: BuildingIcon,
      color: 'text-blue-500',
    },
    {
      title: 'Subscription Plans',
      description: 'Configure subscription plans and pricing',
      href: '/subscription-plans',
      icon: PackageIcon,
      color: 'text-green-500',
    },
    {
      title: 'Organization Subscriptions',
      description: 'View and manage active subscriptions',
      href: '/organization-subscriptions',
      icon: CreditCardIcon,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the GymSpace administration panel
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Icon className={`h-8 w-8 ${section.color}`} />
                    <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="mt-4">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Platform overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Organizations</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Subscriptions</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Available Plans</span>
                <span className="font-medium">-</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent activity to display</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}