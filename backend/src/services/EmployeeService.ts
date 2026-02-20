import { EmployeeRepository } from '../repositories/EmployeeRepository'
import { DocumentAdminRepository } from '../repositories/DocumentAdminRepository'
import { createPaginationMeta, PaginationMeta } from '../types'

export class EmployeeService {
    constructor(private userToken: string) { }

    private get employeeRepository(): EmployeeRepository {
        return new EmployeeRepository(this.userToken)
    }

    private get documentAdminRepository(): DocumentAdminRepository {
        return new DocumentAdminRepository()
    }

    /**
     * Get paginated employees with document statistics.
     * @param page - Page number
     * @param limit - Items per page
     * @param search - Search query
     */
    async getEmployees(page: number = 1, limit: number = 10, search?: string) {
        // 1. Get employees from repository
        const { data: employees, count } = await this.employeeRepository.getAllEmployees(page, limit, search)

        // 2. Enrich with document stats (parallel)
        const enrichedEmployees = await Promise.all(
            employees.map(async (emp) => {
                // Fetch stats
                const stats = await this.documentAdminRepository.getEmployeeDocumentStats(emp.id)

                // Fetch last 3 pending and signed documents
                const lastPending = await this.documentAdminRepository.getEmployeeLastDocuments(emp.id, 'PENDING', 3)
                const lastSigned = await this.documentAdminRepository.getEmployeeLastDocuments(emp.id, 'SIGNED', 3)

                return {
                    ...emp,
                    stats: {
                        pending: stats.pendingCount,
                        signed: stats.signedCount
                    },
                    lastDocuments: {
                        pending: lastPending,
                        signed: lastSigned
                    }
                }
            })
        )

        const pagination: PaginationMeta = createPaginationMeta(count, page, limit)

        return {
            data: enrichedEmployees,
            pagination
        }
    }

    /**
     * Get employee by ID with full details.
     * @param employeeId - Employee ID
     */
    async getEmployeeById(employeeId: number) {
        const employee = await this.employeeRepository.getEmployeeById(employeeId)
        if (!employee) return null

        // Fetch stats and all documents (or paginated, but for detail maybe just recent/all)
        // For now, let's just get the same stats + maybe more history if needed
        // The requirement says "full detail of the employee list... full list of pending, full list of signed"
        // So we should probably fetch ALL documents for the detail view, or paginated lists.
        // For simplicity in this iteration, let's fetch a larger set (e.g., 50) or just reuse the stats methods.

        // User asked for "Last 3 signed documents and the last 3 pending documents" for the LIST.
        // For the DETAIL, "Full list of pending, full list of signed".

        // I'll add methods to get ALL docs by status for an employee in AdminRepo later if needed, 
        // but for now I'll reuse getEmployeeLastDocuments with a high limit or add a new method.
        // Let's stick to a reasonable limit (e.g., 100) or add pagination for docs in the detail view later.

        const allPending = await this.documentAdminRepository.getEmployeeLastDocuments(employeeId, 'PENDING', 100)
        const allSigned = await this.documentAdminRepository.getEmployeeLastDocuments(employeeId, 'SIGNED', 100)
        const stats = await this.documentAdminRepository.getEmployeeDocumentStats(employeeId)

        return {
            ...employee,
            stats: {
                pending: stats.pendingCount,
                signed: stats.signedCount
            },
            documents: {
                pending: allPending,
                signed: allSigned
            }
        }
    }

    /**
     * Update employee details.
     * @param employeeId - Employee ID
     * @param data - Data to update
     */
    async updateEmployee(employeeId: number, data: any) {
        return this.employeeRepository.updateEmployee(employeeId, data)
    }
}
