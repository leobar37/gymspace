// DTOs
export * from './auth';
export * from './organizations';
export * from './gyms';
export * from './clients';
export * from './membership-plans';
export * from './contracts';
export * from './dashboard';
export * from './evaluations';
export * from './check-ins';
export * from './invitations';
export * from './leads';
export * from './assets';
export * from './files';
export * from './onboarding';
export * from './products';
export * from './sales';
export * from './suppliers';
export * from './users';
export * from './subscriptions';
export * from './payment-methods';
export * from './admin-subscriptions';
export * from './subscription-operations';

export interface ApiResponse<T> {
  data: T;
  meta?: any;
}