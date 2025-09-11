export type UUID = string;

export type Currency = 'USD' | 'EUR' | 'PEN' | 'MXN' | 'COP' | 'ARS' | 'CLP';

export type EntityType =
  | 'user'
  | 'organization'
  | 'gym'
  | 'collaborator'
  | 'client'
  | 'contract'
  | 'evaluation'
  | 'asset';

export type Permission =
  | 'ORGANIZATIONS_CREATE'
  | 'ORGANIZATIONS_READ'
  | 'ORGANIZATIONS_UPDATE'
  | 'ORGANIZATIONS_DELETE'
  | 'GYMS_CREATE'
  | 'GYMS_READ'
  | 'GYMS_UPDATE'
  | 'GYMS_DELETE'
  | 'COLLABORATORS_CREATE'
  | 'COLLABORATORS_READ'
  | 'COLLABORATORS_UPDATE'
  | 'COLLABORATORS_DELETE'
  | 'CLIENTS_CREATE'
  | 'CLIENTS_READ'
  | 'CLIENTS_UPDATE'
  | 'CLIENTS_DELETE'
  | 'CONTRACTS_CREATE'
  | 'CONTRACTS_READ'
  | 'CONTRACTS_UPDATE'
  | 'CONTRACTS_APPROVE'
  | 'CONTRACTS_CANCEL'
  | 'EVALUATIONS_CREATE'
  | 'EVALUATIONS_READ'
  | 'EVALUATIONS_UPDATE'
  | 'EVALUATIONS_DELETE'
  | 'CHECKINS_CREATE'
  | 'CHECKINS_READ'
  | 'LEADS_CREATE'
  | 'LEADS_READ'
  | 'LEADS_UPDATE'
  | 'LEADS_DELETE'
  | 'REPORTS_VIEW'
  | 'REPORTS_FINANCIAL'
  | 'SETTINGS_UPDATE'
  | 'ASSETS_CREATE'
  | 'ASSETS_READ'
  | 'ASSETS_DELETE'
  | 'FILES_CREATE'
  | 'FILES_READ'
  | 'FILES_DELETE'
  | 'PRODUCTS_CREATE'
  | 'PRODUCTS_READ'
  | 'PRODUCTS_UPDATE'
  | 'PRODUCTS_DELETE'
  | 'PRODUCT_CATEGORIES_CREATE'
  | 'PRODUCT_CATEGORIES_READ'
  | 'PRODUCT_CATEGORIES_UPDATE'
  | 'PRODUCT_CATEGORIES_DELETE'
  | 'SALES_CREATE'
  | 'SALES_READ'
  | 'SALES_UPDATE'
  | 'SALES_DELETE'
  | 'SUPPLIERS_CREATE'
  | 'SUPPLIERS_READ'
  | 'SUPPLIERS_UPDATE'
  | 'SUPPLIERS_DELETE'
  | 'PAYMENT_METHODS_CREATE'
  | 'PAYMENT_METHODS_READ'
  | 'PAYMENT_METHODS_UPDATE'
  | 'PAYMENT_METHODS_DELETE'
  | 'SUPER_ADMIN';

export interface AuditFields {
  createdByUserId: UUID;
  updatedByUserId?: UUID;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
