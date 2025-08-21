// Product Types
export const PRODUCT_TYPES = {
  PRODUCT: 'Product',
  SERVICE: 'Service',
} as const;

export type ProductType = typeof PRODUCT_TYPES[keyof typeof PRODUCT_TYPES];

// Product Status
export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type ProductStatus = typeof PRODUCT_STATUS[keyof typeof PRODUCT_STATUS];

// Track Inventory Types
export const TRACK_INVENTORY = {
  NONE: 'none',
  STOCK: 'stock',
  BATCH: 'batch',
} as const;

export type TrackInventoryType = typeof TRACK_INVENTORY[keyof typeof TRACK_INVENTORY];