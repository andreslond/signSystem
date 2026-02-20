import { createSupabaseUserClient } from '../config/supabase'
import Logger from '../utils/logger'
import {
  Employee,
  EmployeeSelectResult,
  EmployeeUpdateFields,
  EmployeeListResult
} from '../types'

/**
 * EmployeeRepository - Repository for fetching employee data.
 * 
 * Responsibilities:
 * - Read employee information from ar_nomina.employees table
 * - Provide data for document display (name, email, department, etc.)
 */
export class EmployeeRepository {
  constructor(private userToken: string) { }

  private get supabaseClient() {
    return createSupabaseUserClient(this.userToken)
  }

  /**
   * Get employee by ID
   * @param employeeId - The ID of the employee
   * @returns Employee data if found, null otherwise
   */
  async getEmployeeById(employeeId: number): Promise<Employee | null> {
    const { data, error } = await this.supabaseClient
      .schema('ar_nomina')
      .from('employees')
      .select('id, name, email, identification_number, identification_type, company_id, external_employee_id, external_provider_id, active, created_at')
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
  async getEmployeesByIds(employeeIds: number[]): Promise<EmployeeSelectResult[]> {
    if (!employeeIds.length) {
      return []
    }

    const { data, error } = await this.supabaseClient
      .schema('ar_nomina')
      .from('employees')
      .select('id, name, email, identification_number, identification_type, company_id, external_employee_id, external_provider_id, active')
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

  /**
   * Get all employees with pagination
   * @param page - Page number
   * @param limit - Page limit
   * @param search - Optional search query
   * @returns Array of employees and count
   */
  async getAllEmployees(page: number = 1, limit: number = 10, search?: string): Promise<EmployeeListResult> {
    let query = this.supabaseClient
      .schema('ar_nomina')
      .from('employees')
      .select('id, name, email, identification_number, identification_type, company_id, external_employee_id, external_provider_id, active', { count: 'exact' })
      .eq('active', true) // Only get active employees

    if (search) {
      query = query.or(`name.ilike.%${search}%,identification_number.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count, error } = await query
      .range(from, to)
      .order('name', { ascending: true })

    if (error) {
      Logger.error('Failed to get all employees', {
        error: error.message,
        code: error.code,
        page,
        limit
      })
      throw error
    }

    return { data: data || [], count: count || 0 }
  }

  /**
   * Update employee details
   * @param employeeId - Employee ID
   * @param updates - Updates to apply
   * @returns Updated employee data
   */
  async updateEmployee(employeeId: number, updates: EmployeeUpdateFields): Promise<EmployeeSelectResult> {
    const { data, error } = await this.supabaseClient
      .schema('ar_nomina')
      .from('employees')
      .update(updates)
      .eq('id', employeeId)
      .select('id, name, email, identification_number, identification_type, company_id, external_employee_id, external_provider_id, active')
      .single()

    if (error) {
      Logger.error('Failed to update employee', {
        error: error.message,
        code: error.code,
        employeeId,
        updates
      })
      throw error
    }

    return data
  }
}
