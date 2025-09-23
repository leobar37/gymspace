import { Metadata } from 'next';
import { SubscriptionPlansList } from '@/features/subscription-plans/SubscriptionPlansList';

export const metadata: Metadata = {
  title: 'Subscription Plans | GymSpace',
  description: 'Manage subscription plans and pricing for your GymSpace platform',
};

export default function SubscriptionPlansPage() {
  return <SubscriptionPlansList />;
}