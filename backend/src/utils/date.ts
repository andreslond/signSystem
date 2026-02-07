/**
 * Utility class for date format conversions.
 * The system receives dates in DD-MM-YYYY format but PostgreSQL expects MM-DD-YYYY.
 */
export class DateUtil {
  private static padZero(value: number): string {
    return value.toString().padStart(2, '0')
  }

  /**
   * Validates that a date is a valid calendar date using JavaScript Date.
   * @param year Year component
   * @param month Month component (1-12)
   * @param day Day component (1-31)
   * @returns true if valid, false otherwise
   */
  private static isValidDate(year: number, month: number, day: number): boolean {
    const date = new Date(year, month - 1, day)
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  }

  /**
   * Converts a date from DD-MM-YYYY (input format) to MM-DD-YYYY (PostgreSQL format).
   * @param date DD-MM-YYYY format
   * @returns MM-DD-YYYY format
   */
  static toPostgresFormat(date: string): string {
    const parts = date.split('-')
    if (parts.length !== 3) {
      throw new Error(`Invalid date format: ${date}. Expected DD-MM-YYYY`)
    }

    const [day, month, year] = parts.map(Number)

    // Validate numeric values
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      throw new Error(`Invalid date components: ${date}`)
    }

    // Validate using Date object
    if (!this.isValidDate(year, month, day)) {
      throw new Error(`Invalid date: ${date}`)
    }

    return `${this.padZero(month)}-${this.padZero(day)}-${year}`
  }

  /**
   * Converts a date from MM-DD-YYYY (PostgreSQL format) to DD-MM-YYYY (input format).
   * @param date MM-DD-YYYY format
   * @returns DD-MM-YYYY format
   */
  static fromPostgresFormat(date: string): string {
    const parts = date.split('-')
    if (parts.length !== 3) {
      throw new Error(`Invalid date format: ${date}. Expected MM-DD-YYYY`)
    }

    const [month, day, year] = parts.map(Number)

    // Validate numeric values
    if (isNaN(month) || isNaN(day) || isNaN(year)) {
      throw new Error(`Invalid date components: ${date}`)
    }

    // Validate using Date object
    if (!this.isValidDate(year, month, day)) {
      throw new Error(`Invalid date: ${date}`)
    }

    return `${this.padZero(day)}-${this.padZero(month)}-${year}`
  }
}
