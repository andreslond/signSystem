import { createSupabaseUserClient } from '../config/supabase'
import Logger from '../utils/logger'

/**
 * EmployeeRepository - Repository for fetching employee data.
 * 
 * Responsibilities:
 * - Read employee information from ar_nomina.employees table
 * - Provide data for document display (name, email, department, etc.)
 */
export class EmployeeRepository {
  constructor(private userToken: string) {}

  private get supabaseClient() {
    return createSupabaseUserClient(this.userToken)
  }

  /**
   * Get employee by ID
   * @param employeeId - The ID of the employee
   * @returns Employee data if found, null otherwise
   */
  async getEmployeeById(employeeId: number): Promise<{
    id: number
    name: string
    email: string | null
    identification_number: string | null
    department: string | null
    position: string | null
    company_id: number | null
  } | null> {
    const { data, error } = await this.supabaseClient
      .schema('ar_nomina')
      .from('employees')
      .select('id, name, email, identification_number, department, position, company_id')
      .eq('id', employeeId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        Logger.warn('Employee not found', { employeeId })
        return null
      }
      Logger.error('Failed to get employee by ID', {
        error: error.message,
        code: error.code,
        employeeId
      })
      throw error
    }

    return data
  }

  /**
   * Get employees by IDs
   * @param employeeIds - Array of employee IDs
   * @returns Array of employee data
   */
  async getEmployeesByIds(employeeIds: number[]): Promise<{
    id: number
    name: string
    email: string | null
    identification_number: string | null
    department: string | null
    position: string | null
    company_id: number | null
  }[]> {
    if (!employeeIds.length) {
      return []
    }

    const { data, error } = await this.supabaseClient
      .schema('ar_nomina')
      .from('employees')
      .select('id, name, email, identification_number, department, position, company_id')
      .in('id', employeeIds)

    if (error) {
      Logger.error('Failed to get employees by IDs', {
        error: error.message,
        code: error.code,
        employeeIds
      })
      throw error
    }

    return data || []
  }
}
