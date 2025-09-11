'use client';

import { Organization } from '@gymspace/shared';
import { Building2, MapPin, Phone, Mail, Calendar, Users, Globe } from 'lucide-react';
import dayjs from 'dayjs';

interface OrganizationCardProps {
  organization: Organization;
  onEdit?: (org: Organization) => void;
  onView?: (org: Organization) => void;
  gymCount?: number; // Optional prop since it's not in the base Organization model
}

export function OrganizationCard({ organization, onEdit, onView, gymCount }: OrganizationCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{organization.name}</h3>
            <p className="text-sm text-gray-500">ID: {organization.id.slice(0, 8)}...</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          organization.subscriptionStatus === 'active' 
            ? 'bg-green-100 text-green-800' 
            : organization.subscriptionStatus === 'expired'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {organization.subscriptionStatus}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {organization.country && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Globe className="w-4 h-4" />
            <span>{organization.country}</span>
          </div>
        )}
        
        {organization.currency && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>Currency: {organization.currency}</span>
          </div>
        )}
        
        {organization.timezone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>Timezone: {organization.timezone}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Subscription: {dayjs(organization.subscriptionStart).format('MMM DD, YYYY')} - {dayjs(organization.subscriptionEnd).format('MMM DD, YYYY')}</span>
        </div>

        {gymCount !== undefined && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{gymCount} gym(s)</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={() => onView?.(organization)}
          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => onEdit?.(organization)}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
