import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  addDays,
} from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

/**
 * Utility class for handling timezone conversions
 * Converts user timezone dates to UTC for database storage
 */
export class TimezoneUtil {
  /**
   * Convert a date string from user timezone to UTC
   * @param dateString - Date string in user timezone
   * @param timezone - User timezone (e.g., 'America/Lima')
   * @returns UTC Date object
   */
  static toUtc(dateString: string, timezone: string): Date {
    const zonedDate = new Date(dateString);
    return fromZonedTime(zonedDate, timezone);
  }

  /**
   * Convert UTC date to user timezone
   * @param utcDate - UTC Date object
   * @param timezone - User timezone (e.g., 'America/Lima')
   * @returns Date object in user timezone
   */
  static fromUtc(utcDate: Date, timezone: string): Date {
    return toZonedTime(utcDate, timezone);
  }

  /**
   * Get current date in user timezone
   * @param timezone - User timezone (e.g., 'America/Lima')
   * @returns Date object in user timezone
   */
  static nowInTimezone(timezone: string): Date {
    return toZonedTime(new Date(), timezone);
  }

  /**
   * Get start of day in user timezone, converted to UTC
   * @param date - Date in user timezone or date string
   * @param timezone - User timezone (e.g., 'America/Lima')
   * @returns UTC Date object representing start of day in user timezone
   */
  static startOfDayUtc(date: Date | string, timezone: string): Date {
    const zonedDate = typeof date === 'string' ? new Date(date) : date;
    const startOfDayInTimezone = startOfDay(zonedDate);
    return fromZonedTime(startOfDayInTimezone, timezone);
  }

  /**
   * Get end of day in user timezone, converted to UTC
   * @param date - Date in user timezone or date string
   * @param timezone - User timezone (e.g., 'America/Lima')
   * @returns UTC Date object representing end of day in user timezone
   */
  static endOfDayUtc(date: Date | string, timezone: string): Date {
    const zonedDate = typeof date === 'string' ? new Date(date) : date;
    const endOfDayInTimezone = endOfDay(zonedDate);
    return fromZonedTime(endOfDayInTimezone, timezone);
  }

  /**
   * Get start of month in user timezone, converted to UTC
   * @param date - Date in user timezone or date string
   * @param timezone - User timezone (e.g., 'America/Lima')
   * @returns UTC Date object representing start of month in user timezone
   */
  static startOfMonthUtc(date: Date | string, timezone: string): Date {
    const zonedDate = typeof date === 'string' ? new Date(date) : date;
    const startOfMonthInTimezone = startOfMonth(zonedDate);
    return fromZonedTime(startOfMonthInTimezone, timezone);
  }

  /**
   * Get end of month in user timezone, converted to UTC
   * @param date - Date in user timezone or date string
   * @param timezone - User timezone (e.g., 'America/Lima')
   * @returns UTC Date object representing end of month in user timezone
   */
  static endOfMonthUtc(date: Date | string, timezone: string): Date {
    const zonedDate = typeof date === 'string' ? new Date(date) : date;
    const endOfMonthInTimezone = endOfMonth(zonedDate);
    return fromZonedTime(endOfMonthInTimezone, timezone);
  }

  /**
   * Add days to a date in user timezone, then convert to UTC
   * @param date - Date in user timezone
   * @param days - Number of days to add
   * @param timezone - User timezone (e.g., 'America/Lima')
   * @returns UTC Date object
   */
  static addDaysUtc(date: Date, days: number, timezone: string): Date {
    const zonedDate = toZonedTime(date, timezone);
    const resultInTimezone = addDays(zonedDate, days);
    return fromZonedTime(resultInTimezone, timezone);
  }

  /**
   * Get date range for queries, handling timezone conversion
   * @param startDate - Optional start date string
   * @param endDate - Optional end date string
   * @param timezone - User timezone (e.g., 'America/Lima')
   * @param defaultStartFn - Function to get default start date in timezone
   * @param defaultEndFn - Function to get default end date in timezone
   * @returns Object with start and end UTC Date objects
   */
  static getDateRange(
    startDate: string | undefined,
    endDate: string | undefined,
    timezone: string,
    defaultStartFn: (now: Date) => Date = (now) => startOfMonth(now),
    defaultEndFn: (now: Date) => Date = (now) => endOfMonth(now),
  ): { start: Date; end: Date } {
    const nowInTimezone = TimezoneUtil.nowInTimezone(timezone);

    let start: Date;
    let end: Date;

    if (startDate) {
      // Convert user-provided start date to UTC
      start = TimezoneUtil.startOfDayUtc(startDate, timezone);
    } else {
      // Use default start function with current time in timezone, then convert to UTC
      const defaultStartInTimezone = defaultStartFn(nowInTimezone);
      start = fromZonedTime(defaultStartInTimezone, timezone);
    }

    if (endDate) {
      // Convert user-provided end date to UTC
      end = TimezoneUtil.endOfDayUtc(endDate, timezone);
    } else {
      // Use default end function with current time in timezone, then convert to UTC
      const defaultEndInTimezone = defaultEndFn(nowInTimezone);
      end = fromZonedTime(defaultEndInTimezone, timezone);
    }

    return { start, end };
  }
}