import type { InngestFunction } from './types';

/**
 * Registry to keep track of all created functions
 * Follows Inngest best practices for function organization
 */
export class IngestFunctionRegistry {
  private static functions: InngestFunction[] = [];

  /**
   * Register a new function
   */
  static register(fn: InngestFunction): void {
    this.functions.push(fn);
  }

  /**
   * Get all registered functions
   */
  static getFunctions(): InngestFunction[] {
    return [...this.functions];
  }

  /**
   * Clear all functions (useful for testing)
   */
  static clear(): void {
    this.functions = [];
  }

  /**
   * Get function count
   */
  static getCount(): number {
    return this.functions.length;
  }
}
