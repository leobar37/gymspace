/**
 * Shared constants and types for deployment scripts
 */

export const PACKAGES = [
  { name: '@gymspace/shared', path: 'packages/shared' },
  { name: '@gymspace/sdk', path: 'packages/sdk' },
];

export const CONSUMER_APPS = [
  { name: '@gymspace/api', path: 'packages/api' },
  { name: '@gymspace/mobile', path: 'packages/mobile' },
  { name: '@gymspace/web', path: 'packages/web' },
];

export type VersionType = 'patch' | 'minor' | 'major';

export interface PublishOptions {
  version: VersionType;
  dryRun?: boolean;
  tag?: string;
}

export interface PackageInfo {
  name: string;
  path: string;
}

export interface PackageVersions {
  [packageName: string]: string;
}
