import { Request, Response } from 'express'
import { EmployeeService } from '../services/EmployeeService'
import { sendSuccess } from '../utils/apiError'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

declare global {
    namespace Express {
        interface Request {
            employeeService: EmployeeService
        }
    }
}

function validatePagination(page: string | undefined, limit: string | undefined): { page: number; limit: number } {
    const pageNum = page ? parseInt(page, 10) : DEFAULT_PAGE
    const limitNum = limit ? parseInt(limit, 10) : DEFAULT_LIMIT

    if (isNaN(pageNum) || pageNum < 1) {
        throw new Error('Page must be a positive integer')
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > MAX_LIMIT) {
        throw new Error(`Limit must be between 1 and ${MAX_LIMIT}`)
    }

    return { page: pageNum, limit: limitNum }
}

export class EmployeeController {
    /**
     * GET /employees
     * List employees with stats
     */
    getEmployees = async (req: Request, res: Response) => {
        try {
            const pageParam = req.query.page as string | undefined
            const limitParam = req.query.limit as string | undefined
            const search = req.query.search as string | undefined
            const { page, limit } = validatePagination(pageParam, limitParam)

            console.log(`[EmployeeController] getEmployees: userId=${req.user.id}, page=${page}, limit=${limit}, search=${search || 'none'}`)

            const response = await req.employeeService.getEmployees(page, limit, search)

            return sendSuccess(res, response.data, { pagination: response.pagination })
        } catch (error: any) {
            console.error(`[EmployeeController] getEmployees: Error - ${error.message}`)
            if (error.message.includes('Page must be') || error.message.includes('Limit must be')) {
                return res.status(400).json({ error: error.message })
            }
            res.status(500).json({ error: error.message })
        }
    }

    /**
     * GET /employees/:id
     * Get employee details
     */
    getEmployeeById = async (req: Request, res: Response) => {
        try {
            const id = req.params.id
            const idString = Array.isArray(id) ? id[0] : id
            const employeeId = parseInt(idString, 10)
            if (isNaN(employeeId)) {
                return res.status(400).json({ error: 'Invalid employee ID' })
            }

            console.log(`[EmployeeController] getEmployeeById: userId=${req.user.id}, employeeId=${employeeId}`)

            const employee = await req.employeeService.getEmployeeById(employeeId)
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' })
            }

            return sendSuccess(res, employee)
        } catch (error: any) {
            console.error(`[EmployeeController] getEmployeeById: Error - ${error.message}`)
            res.status(500).json({ error: error.message })
        }
    }

    /**
     * PUT /employees/:id
     * Update employee details
     */
    updateEmployee = async (req: Request, res: Response) => {
        try {
            const id = req.params.id
            const idString = Array.isArray(id) ? id[0] : id
            const employeeId = parseInt(idString, 10)
            if (isNaN(employeeId)) {
                return res.status(400).json({ error: 'Invalid employee ID' })
            }

            console.log(`[EmployeeController] updateEmployee: userId=${req.user.id}, employeeId=${employeeId}`)

            const updated = await req.employeeService.updateEmployee(employeeId, req.body)

            return sendSuccess(res, updated)
        } catch (error: any) {
            console.error(`[EmployeeController] updateEmployee: Error - ${error.message}`)
            res.status(500).json({ error: error.message })
        }
    }
}
