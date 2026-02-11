import { EmployeeRepository } from '../../src/repositories/EmployeeRepository'
import { SupabaseResult } from '../../src/types'

// Mock Supabase
jest.mock('../../src/config/supabase', () => ({
  createSupabaseUserClient: jest.fn(),
}))

const getEmployeeBuilder = {
  single: jest.fn<Promise<SupabaseResult<any>>, []>(),
}

const getEmployeesBuilder = {
  in: jest.fn<Promise<SupabaseResult<any[]>>, [string, number[]]>(),
}

const mockSupabaseClient = {
  schema: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockImplementation(
    () => getEmployeeBuilder.single()
  ),
  in: jest.fn().mockImplementation(
    (column: string, values: number[]) => getEmployeesBuilder.in(column, values)
  ),
}

const { createSupabaseUserClient } = require('../../src/config/supabase')
createSupabaseUserClient.mockReturnValue(mockSupabaseClient)

describe('EmployeeRepository', () => {
  let repository: EmployeeRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new EmployeeRepository('test-token')
  })

  describe('getEmployeeById', () => {
    it('should return employee data when employee exists', async () => {
      const mockEmployee = {
        id: 456,
        name: 'John Doe',
        email: 'john.doe@example.com',
        identification_number: '123456789',
        department: 'Engineering',
        position: 'Software Engineer',
        company_id: 1,
      }
      mockSupabaseClient.single.mockResolvedValue({ data: mockEmployee, error: null })

      const result = await repository.getEmployeeById(456)

      expect(createSupabaseUserClient).toHaveBeenCalledWith('test-token')
      expect(mockSupabaseClient.schema).toHaveBeenCalledWith('ar_nomina')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('employees')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('id, name, email, identification_number, department, position, company_id')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 456)
      expect(result).toEqual(mockEmployee)
    })

    it('should return null when employee not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' },
      })

      const result = await repository.getEmployeeById(999)

      expect(result).toBeNull()
    })

    it('should throw error on database error', async () => {
      const error = new Error('Database error')
      mockSupabaseClient.single.mockRejectedValue(error)

      await expect(repository.getEmployeeById(456)).rejects.toThrow('Database error')
    })

    it('should return null on PGRST116 error (not found)', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'More than 1 row returned' },
      })

      const result = await repository.getEmployeeById(456)

      expect(result).toBeNull()
    })
  })

  describe('getEmployeesByIds', () => {
    it('should return employees when employees exist', async () => {
      const mockEmployees = [
        {
          id: 456,
          name: 'John Doe',
          email: 'john.doe@example.com',
          identification_number: '123456789',
          department: 'Engineering',
          position: 'Software Engineer',
          company_id: 1,
        },
        {
          id: 789,
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          identification_number: '987654321',
          department: 'Engineering',
          position: 'Senior Engineer',
          company_id: 1,
        },
      ]
      mockSupabaseClient.in.mockResolvedValue({ data: mockEmployees, error: null })

      const result = await repository.getEmployeesByIds([456, 789])

      expect(createSupabaseUserClient).toHaveBeenCalledWith('test-token')
      expect(mockSupabaseClient.schema).toHaveBeenCalledWith('ar_nomina')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('employees')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('id, name, email, identification_number, department, position, company_id')
      expect(mockSupabaseClient.in).toHaveBeenCalledWith('id', [456, 789])
      expect(result).toEqual(mockEmployees)
    })

    it('should return empty array when employeeIds is empty', async () => {
      const result = await repository.getEmployeesByIds([])

      expect(result).toEqual([])
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should return empty array when no employees found', async () => {
      mockSupabaseClient.in.mockResolvedValue({ data: null, error: null })

      const result = await repository.getEmployeesByIds([999, 888])

      expect(result).toEqual([])
    })

    it('should throw error on database error', async () => {
      const error = new Error('Database error')
      mockSupabaseClient.in.mockRejectedValue(error)

      await expect(repository.getEmployeesByIds([456, 789])).rejects.toThrow('Database error')
    })

    it('should handle null data from Supabase', async () => {
      mockSupabaseClient.in.mockResolvedValue({ data: null, error: null })

      const result = await repository.getEmployeesByIds([456])

      expect(result).toEqual([])
    })
  })
})
