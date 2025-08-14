/**
 * Contract expiration tolerance constants
 * These constants define the time windows for contract status transitions
 */
export const CONTRACT_EXPIRATION_CONSTANTS = {
  /**
   * Days before expiration to mark contract as expiring_soon
   */
  EXPIRING_SOON_DAYS: 5,

  /**
   * Buffer for exact expiration check (in hours)
   * Contracts are considered expired if their endDate + buffer has passed
   */
  EXPIRATION_BUFFER_HOURS: 0,

  /**
   * Maximum days to check for near-expiring contracts
   * Used for performance optimization in queries
   */
  MAX_EXPIRING_CHECK_DAYS: 30,

  /**
   * Grace period in days after expiration before considering contract truly expired
   * This allows for business flexibility in case of payment delays, etc.
   */
  GRACE_PERIOD_DAYS: 0,

  /**
   * Cron job schedule for checking contract statuses
   * Default: Every 6 hours to catch status changes promptly
   */
  CRON_SCHEDULE: '0 */6 * * *', // Every 6 hours

  /**
   * Batch size for processing contract updates
   * To avoid overwhelming the database with large updates
   */
  BATCH_SIZE: 100,
} as const;

/**
 * Contract status transition rules
 */
export const CONTRACT_STATUS_TRANSITIONS = {
  /**
   * Valid transitions from each status
   */
  VALID_TRANSITIONS: {
    pending: ['active', 'cancelled'],
    active: ['expiring_soon', 'expired', 'cancelled'],
    expiring_soon: ['expired', 'cancelled'],
    expired: ['cancelled'], // Can only cancel expired contracts, not renew directly
    cancelled: [], // Terminal state
  },

  /**
   * Automatic status transitions (handled by cron)
   */
  AUTOMATIC_TRANSITIONS: {
    'active': 'expiring_soon', // When contract is within EXPIRING_SOON_DAYS of expiration
    'expiring_soon': 'expired', // When contract has passed its endDate + grace period
    'active_direct': 'expired', // Direct transition from active to expired if no expiring_soon step
  },
} as const;

/**
 * Contract expiration notification settings
 */
export const CONTRACT_NOTIFICATION_SETTINGS = {
  /**
   * Days before expiration to send first warning
   */
  FIRST_WARNING_DAYS: 7,

  /**
   * Days before expiration to send final warning
   */
  FINAL_WARNING_DAYS: 2,

  /**
   * Days after expiration to send overdue notice
   */
  OVERDUE_NOTICE_DAYS: 3,
} as const;