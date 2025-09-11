'use client';

import { Organization } from '@gymspace/shared';
import { OrganizationCard } from './OrganizationCard';
import { Building2, AlertCircle } from 'lucide-react';

interface OrganizationsListProps {
  organizations: Organization[];
  isLoading: boolean;
  error: Error | null;
  onEdit?: (org: Organization) => void;
  onView?: (org: Organization) => void;
}

export function OrganizationsList({ 
  organizations, 
  isLoading, 
  error, 
  onEdit, 
  onView 
}: OrganizationsListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading organizations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading organizations</h3>
        <p className="text-gray-600">{error.message}</p>
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No organizations found</h3>
        <p className="text-gray-600">Create your first organization to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {organizations.map((organization) => (
        <OrganizationCard
          key={organization.id}
          organization={organization}
          onEdit={onEdit}
          onView={onView}
        />
      ))}
    </div>
  );
}