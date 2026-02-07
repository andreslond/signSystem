import { DateUtil } from '../../src/utils/date'

describe('DateUtil', () => {
  describe('toPostgresFormat', () => {
    it('should convert DD-MM-YYYY to MM-DD-YYYY', () => {
      expect(DateUtil.toPostgresFormat('01-01-2025')).toBe('01-01-2025')
      expect(DateUtil.toPostgresFormat('31-01-2025')).toBe('01-31-2025')
      expect(DateUtil.toPostgresFormat('15-03-2025')).toBe('03-15-2025')
      expect(DateUtil.toPostgresFormat('10-12-2025')).toBe('12-10-2025')
    })

    it('should throw error for invalid format', () => {
      expect(() => DateUtil.toPostgresFormat('01-01')).toThrow('Invalid date format')
      expect(() => DateUtil.toPostgresFormat('2025-01')).toThrow('Invalid date format')
      expect(() => DateUtil.toPostgresFormat('01/01/2025')).toThrow('Invalid date format')
      expect(() => DateUtil.toPostgresFormat('01-01-2025-extra')).toThrow('Invalid date format')
    })

    it('should throw error for invalid date (fake dates)', () => {
      expect(() => DateUtil.toPostgresFormat('99-99-2025')).toThrow('Invalid date')
      expect(() => DateUtil.toPostgresFormat('32-01-2025')).toThrow('Invalid date')
      expect(() => DateUtil.toPostgresFormat('00-01-2025')).toThrow('Invalid date')
      expect(() => DateUtil.toPostgresFormat('31-13-2025')).toThrow('Invalid date')
      expect(() => DateUtil.toPostgresFormat('31-00-2025')).toThrow('Invalid date')
      expect(() => DateUtil.toPostgresFormat('29-02-2025')).toThrow('Invalid date')  // Not a leap year
      expect(DateUtil.toPostgresFormat('29-02-2024')).toBe('02-29-2024')  // Leap year is valid
    })
  })

  describe('fromPostgresFormat', () => {
    it('should convert MM-DD-YYYY to DD-MM-YYYY', () => {
      expect(DateUtil.fromPostgresFormat('01-01-2025')).toBe('01-01-2025')
      expect(DateUtil.fromPostgresFormat('01-31-2025')).toBe('31-01-2025')
      expect(DateUtil.fromPostgresFormat('03-15-2025')).toBe('15-03-2025')
      expect(DateUtil.fromPostgresFormat('12-10-2025')).toBe('10-12-2025')
    })

    it('should throw error for invalid format', () => {
      expect(() => DateUtil.fromPostgresFormat('01-01')).toThrow('Invalid date format')
      expect(() => DateUtil.fromPostgresFormat('2025-01')).toThrow('Invalid date format')
      expect(() => DateUtil.fromPostgresFormat('01/01/2025')).toThrow('Invalid date format')
      expect(() => DateUtil.fromPostgresFormat('01-01-2025-extra')).toThrow('Invalid date format')
    })

    it('should throw error for invalid date (fake dates)', () => {
      expect(() => DateUtil.fromPostgresFormat('99-99-2025')).toThrow('Invalid date')
      expect(() => DateUtil.fromPostgresFormat('32-01-2025')).toThrow('Invalid date')
      expect(() => DateUtil.fromPostgresFormat('13-01-2025')).toThrow('Invalid date')
    })
  })
})
