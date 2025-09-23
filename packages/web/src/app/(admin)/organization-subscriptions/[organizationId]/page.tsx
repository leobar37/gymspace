import { Metadata } from 'next';
import { OrganizationSubscriptionDetails } from '@/features/organization-subscriptions/OrganizationSubscriptionDetails';

export const metadata: Metadata = {
  title: 'Organization Subscription Details | GymSpace',
  description: 'View detailed subscription information and history for an organization',
};

export default function OrganizationSubscriptionDetailsPage({
  params,
}: {
  params: { organizationId: string };
}) {
  return <OrganizationSubscriptionDetails organizationId={params.organizationId} />;
}