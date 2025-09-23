'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BuildingIcon,
  UserIcon,
  MailIcon,
  CalendarIcon,
  MapPinIcon
} from 'lucide-react';
import { OrganizationAdminDetails } from '@gymspace/sdk';
import { formatDate } from '@/lib/utils';

interface OrganizationInfoCardProps {
  organization: OrganizationAdminDetails;
}

export function OrganizationInfoCard({ organization }: OrganizationInfoCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BuildingIcon className="size-5 text-primary" />
          Organization Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Organization Name and Created Date */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Organization Name</span>
            <span className="font-medium">{organization.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Created Date</span>
            <span className="text-sm flex items-center gap-1">
              <CalendarIcon className="size-3" />
              {formatDate(organization.createdAt)}
            </span>
          </div>
          {organization.country && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Country</span>
              <span className="text-sm">{organization.country}</span>
            </div>
          )}
        </div>

        {/* Owner Information */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <UserIcon className="size-4" />
            Owner Details
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm">{organization.owner.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm flex items-center gap-1">
                <MailIcon className="size-3" />
                {organization.owner.email}
              </span>
            </div>
          </div>
        </div>

        {/* Gym Locations */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <MapPinIcon className="size-4" />
            Gym Locations
            <Badge variant="secondary" className="ml-auto">
              {organization.gyms.length} {organization.gyms.length === 1 ? 'Location' : 'Locations'}
            </Badge>
          </h4>
          {organization.gyms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No gym locations registered</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {organization.gyms.map((gym) => (
                <div key={gym.id} className="bg-secondary/30 rounded-md p-2">
                  <p className="text-sm font-medium">{gym.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPinIcon className="size-3" />
                    {gym.address}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Organization Stats */}
        {organization.stats && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Quick Stats</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-secondary/30 rounded">
                <p className="text-2xl font-bold">{organization.stats.totalClients}</p>
                <p className="text-xs text-muted-foreground">Total Clients</p>
              </div>
              <div className="text-center p-2 bg-secondary/30 rounded">
                <p className="text-2xl font-bold">{organization.stats.activeContracts}</p>
                <p className="text-xs text-muted-foreground">Active Contracts</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}