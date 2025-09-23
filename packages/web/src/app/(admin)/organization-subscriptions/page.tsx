import { Metadata } from 'next';
import { OrganizationSubscriptionsList } from '@/features/organization-subscriptions/OrganizationSubscriptionsList';

export const metadata: Metadata = {
  title: 'Organization Subscriptions | GymSpace',
  description: 'View and manage subscriptions for all organizations on the GymSpace platform',
};

export default function OrganizationSubscriptionsPage() {
  return <OrganizationSubscriptionsList />;
}